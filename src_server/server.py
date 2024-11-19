from flask import Flask, request, jsonify
import bcrypt
import jwt
import datetime

app = Flask(__name__)
SECRET_KEY = "your-secret-key"

# Mock database
users = {}
comments = {}

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if username in users:
        return jsonify({"success": False, "message": "User already exists"}), 400

    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    users[username] = hashed_password
    return jsonify({"success": True, "message": "User registered successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    hashed_password = users.get(username)
    if hashed_password and bcrypt.checkpw(password.encode(), hashed_password.encode()):
        token = jwt.encode(
            {"username": username, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
            SECRET_KEY,
            algorithm="HS256",
        )
        return jsonify({"success": True, "token": token})
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/api/comments', methods=['GET', 'POST'])
def comments_api():
    token = request.headers.get("Authorization").split()[1]
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        username = decoded["username"]
    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "message": "Invalid token"}), 401

    if request.method == 'POST':
        comment = request.json.get("comment")
        comments.setdefault(username, []).append(comment)
        return jsonify({"success": True, "message": "Comment added"}), 201

    return jsonify({"comments": comments.get(username, [])})

if __name__ == '__main__':
    app.run(debug=True)
