from flask import Blueprint, request, jsonify, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer
from flask_mail import Message
from flask_jwt_extended import create_access_token
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

    # Check if email is already in use
    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "Email already in use"}), 400

    # Check if username is already in use
    if User.query.filter_by(username=username).first():
        return jsonify({"success": False, "message": "Username already in use"}), 400

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


# Add a route for requesting a password reset
@auth_bp.route("/reset-password-request", methods=["POST"])
def reset_password_request():
    data = request.json
    email = data.get("email")

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"success": False, "message": "Email not found"}), 404

    token = serializer.dumps(email, salt="password-reset")
    reset_url = url_for("auth.reset_password", token=token, _external=True)

    msg = Message("Reset Your Password", recipients=[email])
    msg.body = f"Click the link to reset your password: {reset_url}"
    mail.send(msg)

    return jsonify({"success": True, "message": "Password reset link sent. Check your email."}), 200

@auth_bp.route("/reset-password/<token>", methods=["GET", "POST"])
def reset_password(token):
    try:
        # Decode the token to get the email
        email = serializer.loads(token, salt="password-reset", max_age=3600)
        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({"success": False, "message": "Invalid token"}), 400

        if request.method == "GET":
            # If the method is GET, render a basic HTML form for password reset
            return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Password</title>
            </head>
            <body>
                <h2>Reset Password</h2>
                <form method="POST">
                    <label for="new_password">New Password:</label><br>
                    <input type="password" id="new_password" name="new_password" required><br><br>
                    <button type="submit">Reset Password</button>
                </form>
            </body>
            </html>
            """, 200

        if request.method == "POST":
            # Handle the password reset
            new_password = request.form.get("new_password")
            hashed_password = generate_password_hash(new_password)

            user.password = hashed_password
            db.session.commit()

            return jsonify({"success": True, "message": "Password has been reset"}), 200

    except Exception as e:
        return jsonify({"success": False, "message": "Token expired or invalid"}), 400

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    # Check if the user exists
    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"success": False, "message": "Invalid username or password"}), 401

    # Check if the account is validated
    if not user.is_verified:
        return jsonify({"success": False, "message": "Please verify your email before logging in."}), 403

    # Generate JWT token
    access_token = create_access_token(identity=user.id)

    # Decode the token if it is in bytes
    if isinstance(access_token, bytes):
        access_token = access_token.decode("utf-8")

    return jsonify({"success": True, "access_token": access_token}), 200