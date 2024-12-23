from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS 
from urllib.parse import unquote
from config import Config
from models import db, Comment  

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load configuration from config.py
app.config.from_object(Config)

# Initialize the database with the app
db.init_app(app)

# Create the database and tables if they don't exist
with app.app_context():
    db.create_all()

@app.route('/comments', methods=['POST'])
def save_comment():
    data = request.get_json()
    url = data.get('url')
    comment_text = data.get('comment')

    if not url or not comment_text:
        return jsonify({'error': 'Invalid request'}), 400

    try:
        comment = Comment(url=url, comment=comment_text)
        db.session.add(comment)
        db.session.commit()
        return jsonify({'message': 'Comment saved'}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to save comment'}), 500

@app.route('/comments/<path:url>', methods=['GET'])
def get_comment(url):
    # Decode the URL
    decoded_url = unquote(url)
    comment = Comment.query.filter_by(url=decoded_url).first()
    if comment:
        return jsonify({'comment': comment.comment}), 200
    else:
        return jsonify({'error': 'Comment not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)
