from flask import Flask, redirect, session, url_for, request, render_template, \
    jsonify
import os
from flask_sqlalchemy import SQLAlchemy
from models.db_model import User, Playlist, SongContribution

import spotipy
from spotipy.oauth2 import SpotifyOAuth

app = Flask(__name__)
app.config.from_mapping(
        SECRET_KEY='dev'
    )
app_dir = os.path.dirname(os.path.realpath(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite://{app_dir}/database.db'

db = SQLAlchemy(app)
db.create_all()

scope = 'playlist-modify-private'
CACHE = '.spotifycache'
# Reads client id and client secret from environment variables
# sp_oauth = oauth2.SpotifyOAuth(scope=SCOPE,cache_path=CACHE)
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(scope=scope))

@app.route('/')
def home():
    token_info = sp.auth_manager.get_cached_token()
    if token_info and not sp.auth_manager.is_token_expired(token_info):
        return redirect(url_for('create'))
    else:
        return redirect((url_for('login')))

def check_if_registered():
    sp.current_user()

@app.route('/login')
def login():
    # If auth token is already cached and not expired, use that else redirect
    # user to login or refresh token
    token_info = sp.auth_manager.get_cached_token()
    # if already logged in
    if token_info and not sp.auth_manager.is_token_expired(token_info):
        access_token = token_info['access_token']
        session['access_token'] = access_token
        check_if_registered()
        return redirect(request.referrer)
    # go login
    else:
        login_url = sp.auth_manager.get_authorize_url()
        return redirect(login_url)


@app.route('/oauth/callback')
def set_token():
    code = request.args['code']
    token_info = sp.auth_manager.get_access_token(code)
    access_token = token_info['access_token']
    session['access_token'] = access_token

    redirect_url = session['prev_url']
    session['prev_url'] = None

    return redirect(redirect_url)


@app.route('/js/add_songs.js')
def serve_search_bar_js():
    return app.send_static_file('js/add_songs.js')

# TODO: Make this a post/get method
@app.route('/search')
def search():
    # Get the search query from the request
    query = request.args.get('query')
    if query:
        # Use the Spotify client to search for tracks
        results = sp.search(query, type="track")
        return jsonify(results['tracks']['items'])
    else:
        return jsonify({})


@app.route('/add_songs', methods=['GET'])
def add_songs():

    token_info = sp.auth_manager.get_cached_token()
    if token_info and not sp.auth_manager.is_token_expired(token_info):
        return render_template('add_songs.html')
    else:
        session['prev_url'] = '/add_songs'
        return redirect((url_for('login')))


@app.route('/create')
def create():
    token_info = sp.auth_manager.get_cached_token()
    if token_info and not sp.auth_manager.is_token_expired(token_info):
        return render_template('create.html')
    else:
        session['prev_url'] = '/create'
        return redirect((url_for('login')))


@app.route('/test')
def test():
    token_info = sp.auth_manager.get_cached_token()
    if token_info and not sp.auth_manager.is_token_expired(token_info):
        return render_template('create.html')
    else:
        session['prev_url'] = '/create'
        return redirect((url_for('login')))


@app.route('/playlist_created')
def playlist_created():
    return render_template('playlist_created.html',
                           name=request.args['name'],
                           link=request.args['link'])


@app.route('/create_playlist', methods=['POST', 'GET'])
def create_playlist():

    playlist = sp.user_playlist_create(
        user=sp.current_user()['id'],
        name=request.form['playlist-name-field'],
        public=False,
        collaborative=True,
        description=request.form['playlist-desc-field']
    )

    playlist

    return redirect(url_for('playlist_created',
                    name=request.form['playlist-name-field'],
                    link=playlist['external_urls']['spotify']))




if __name__ == '__main__':
    app.run()
