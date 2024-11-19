from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_cors import CORS
import os

db = SQLAlchemy()
mail = Mail()

def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")

    db.init_app(app)
    mail.init_app(app)
    CORS(app)

    from .routes.auth import auth_bp
    from .routes.comments import comments_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(comments_bp, url_prefix="/api/comments")

    with app.app_context():
        db.create_all()  # Create database tables

    return app
