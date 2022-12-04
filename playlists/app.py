from flask import Flask, redirect, session, url_for, request

import spotipy
# from spotipy import oauth2
from spotipy.oauth2 import SpotifyOAuth

app = Flask(__name__)
app.config.from_mapping(
        SECRET_KEY='dev'
    )

scope = 'user-library-read'
CACHE = '.spotifycache'
# Reads client id and client secret from environment variables
# sp_oauth = oauth2.SpotifyOAuth(scope=SCOPE,cache_path=CACHE)
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(scope=scope))


@app.route('/')
def login():
    # If auth token is already cached and not expired, use that else redirect
    # user to login or refresh token
    token_info = sp.auth_manager.get_cached_token()
    if token_info and not sp.auth_manager.is_token_expired(token_info):
        access_token = token_info['access_token']
        session['access_token'] = access_token
        return redirect(url_for('home'))
    else:
        login_url = sp.auth_manager.get_authorize_url()
        print(login_url)
        return redirect(login_url)


@app.route('/oauth/callback')
def set_token():
    code = request.args['code']
    token_info = sp.auth_manager.get_access_token(code)
    access_token = token_info['access_token']
    session['access_token'] = access_token
    return redirect(url_for('home'))

@app.route('/home')
def home():
    return 'Welcome to Playlists TG'



if __name__ == '__main__':
    app.run()
