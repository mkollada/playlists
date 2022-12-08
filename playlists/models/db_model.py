from ..app import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    spotify_user_uri = db.column(db.String(100), unique=True)


class Playlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    spotify_playlist_uri = db.Column(db.String(100), unique=True)


class SongContribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer)
    playlist_id = db.Column(db.Integer)
    spotify_track_uri = db.Column(db.String(100))


db.create_all()


