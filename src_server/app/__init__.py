from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from flask import render_template


db = SQLAlchemy()
mail = Mail()
jwt = JWTManager()


def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")

    db.init_app(app)
    mail.init_app(app)
    jwt.init_app(app)
    CORS(app)

    from .routes.auth import auth_bp
    from .routes.comments import comments_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(comments_bp, url_prefix="/api/comments")

    @app.route("/")
    def index():
        return send_from_directory("../html_tests", "index.html")

    with app.app_context():
        db.create_all()  # Create database tables

    return app
