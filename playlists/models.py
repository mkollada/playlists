from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    spotify_user_uri = db.Column(db.String(100), unique=True)


class Playlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    spotify_playlist_id = db.Column(db.String(100), unique=True)
    creator_user_id = db.Column(db.Integer)


class SongContribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer)
    playlist_id = db.Column(db.Integer)
    spotify_track_uri = db.Column(db.String(100))