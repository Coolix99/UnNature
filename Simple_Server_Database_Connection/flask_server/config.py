# config.py

import os

class Config:
    # Set the path for the SQLite database
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(BASE_DIR, "page_comments.db")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
