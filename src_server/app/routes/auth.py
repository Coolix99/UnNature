from flask import Blueprint, request, jsonify, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer
from flask_mail import Message
from .. import db, mail
from ..models import User

auth_bp = Blueprint("auth", __name__)
serializer = URLSafeTimedSerializer("your-secret-key")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if User.query.filter_by(username=username).first():
        return jsonify({"success": False, "message": "User already exists"}), 400

    hashed_password = generate_password_hash(password)
    user = User(username=username, email=email, password=hashed_password)
    db.session.add(user)
    db.session.commit()

    token = serializer.dumps(email, salt="email-confirm")
    confirm_url = url_for("auth.confirm_email", token=token, _external=True)

    msg = Message("Confirm your Email", recipients=[email])
    msg.body = f"Click the link to confirm your email: {confirm_url}"
    mail.send(msg)

    return jsonify({"success": True, "message": "Registration successful! Check your email."}), 201

@auth_bp.route("/confirm/<token>", methods=["GET"])
def confirm_email(token):
    try:
        email = serializer.loads(token, salt="email-confirm", max_age=3600)
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"success": False, "message": "Invalid token"}), 400
        user.is_verified = True
        db.session.commit()
        return jsonify({"success": True, "message": "Email confirmed"}), 200
    except Exception:
        return jsonify({"success": False, "message": "Token expired or invalid"}), 400
