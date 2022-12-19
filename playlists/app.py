import os
from flask import Flask, redirect, session, url_for, request, render_template, \
    jsonify
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from models import db
from html import escape

app = Flask(__name__)
app.config.from_mapping(
    SECRET_KEY='dev'
)
app_dir = os.path.dirname(os.path.realpath(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///database.sqlite3'

db.init_app(app)

from models import User, Playlist, SongContribution


with app.app_context():
    # db.drop_all() # Using to reset database if necessary
    db.create_all()

scope = 'playlist-modify-private'
CACHE = '.spotifycache'
# Reads client id and client secret from environment variables
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(scope=scope))

def query_current_user_id():
    # TODO: probably should be a check here if we get user
    return User.query.filter(
        User.spotify_user_uri == sp.current_user()['uri']
    ).first().id


@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('favicon.ico')


# Use a catch-all route to match any URL
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    # Redirect the user to the create page
    token_info = sp.auth_manager.get_cached_token()
    if check_if_logged_in(token_info):
        return redirect(url_for('create'))
    else:
        return redirect(url_for('login'))


def register_current_user():
    user = User(spotify_user_uri=sp.current_user()['uri'])
    db.session.add(user)
    db.session.commit()
    return user


def check_if_user_registered():
    query = User.query.filter(User.spotify_user_uri == sp.current_user()['uri'])
    user = query.first()

    if user:
        return user
    else:
        user = register_current_user()
        return user


def check_if_logged_in(token_info):
    if token_info and not sp.auth_manager.is_token_expired(token_info):
        return True
    else:
        return False


@app.route('/login')
def login():
    # If auth token is already cached and not expired, use that else redirect
    # user to login or refresh token
    token_info = sp.auth_manager.get_cached_token()
    # if already logged in
    if check_if_logged_in(token_info):
        set_token(token_info)
        return redirect(request.referrer)
    # go login
    else:
        login_url = sp.auth_manager.get_authorize_url()
        session['redirect_url'] = request.referrer
        return redirect(login_url)


def set_token(token_info):
    access_token = token_info['access_token']
    session['access_token'] = access_token
    session['logged_in'] = True
    check_if_user_registered()

    return session['logged_in']


@app.route('/oauth/callback', methods=['GET'])
def callback():
    code = request.args['code']
    token_info = sp.auth_manager.get_access_token(code)
    set_token(token_info)

    redirect_url = session['redirect_url']
    session['redirect_url'] = None

    return redirect(redirect_url)


@app.route('/js/add_songs.js')
def serve_search_bar_js():
    return app.send_static_file('js/add_songs.js')


# TODO: Make this a post/get method
@app.route('/search', methods=['GET'])
def search():
    # Get the search query from the request
    # sanitizing request using python built-in html.escape
    query = escape(request.args.get('query'))
    if query:
        # Use the Spotify client to search for tracks
        results = sp.search(query, type="track")
        return jsonify(results['tracks']['items'])
    else:
        return jsonify({})


@app.route('/add_songs/<string:spotify_playlist_id>', methods=['GET'])
def add_songs(spotify_playlist_id):
    token_info = sp.auth_manager.get_cached_token()
    if check_if_logged_in(token_info):
        return render_template('add_songs.html',
                               spotify_playlist_id=spotify_playlist_id)
    else:
        return redirect((url_for('login')))


@app.route('/add_tracks_to_playlist/<string:spotify_playlist_id>',
           methods=['POST'])
def add_tracks_to_playlist(spotify_playlist_id):
    tracks_to_add = request.get_json()['tracks_to_add']

    for ix, track_id in enumerate(tracks_to_add):
        tracks_to_add[ix] = f'spotify:track:{track_id}'

    sp.playlist_add_items(spotify_playlist_id,
                          tracks_to_add)

    session[f'tracks_added-{spotify_playlist_id}'] = True

    return redirect(url_for('tracks_added',
                            spotify_playlist_id=spotify_playlist_id))


@app.route('/tracks_added/<string:spotify_playlist_id>', methods=['GET'])
def tracks_added(spotify_playlist_id):
    if session.get(f'tracks_added-{spotify_playlist_id}'):
        return render_template('tracks_added.html',
                               link=f'https://open.spotify.com/playlist/{spotify_playlist_id}')
    else:
        return redirect(url_for('add_songs',
                                spotify_playlist_id=spotify_playlist_id))



@app.route('/create')
def create():
    token_info = sp.auth_manager.get_cached_token()
    if token_info and not sp.auth_manager.is_token_expired(token_info):
        current_user_id = query_current_user_id()
        return render_template('create.html',
                               current_user_id=current_user_id)
    else:
        session['prev_url'] = '/create'
        return redirect((url_for('login')))


@app.route('/playlist_created')
def playlist_created():
    return render_template('playlist_created.html',
                           name=request.args['name'],
                           link=request.args['link'],
                           spotify_playlist_id=request.args['spotify_playlist_id'])


@app.route('/create_playlist', methods=['POST', 'GET'])
def create_playlist():
    name = escape(request.form['playlist-name-field'])
    description = escape(request.form['playlist-desc-field'])

    playlist = sp.user_playlist_create(
        user=sp.current_user()['id'],
        name=name,
        public=False,
        collaborative=True,
        description=description
    )

    current_user_id = query_current_user_id()

    playlist_db_entry = Playlist(spotify_playlist_id=playlist['id'],
                                 creator_user_id=current_user_id)

    db.session.add(playlist_db_entry)
    db.session.commit()

    return redirect(url_for('playlist_created',
                            name=request.form['playlist-name-field'],
                            link=playlist['external_urls']['spotify'],
                            spotify_playlist_id=playlist['id']))

## TODO: redirect when we don't have spotify access
# app.route('/no_access')
# def no_access():


if __name__ == '__main__':
    app.run()
