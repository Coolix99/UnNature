from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import Comment, User

comments_bp = Blueprint("comments", __name__)

@comments_bp.route("/", methods=["GET", "POST"])
@jwt_required()
def manage_comments():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    if request.method == "POST":
        comment_text = request.json.get("comment")
        comment = Comment(user_id=user.id, comment=comment_text)
        db.session.add(comment)
        db.session.commit()
        return jsonify({"success": True, "message": "Comment added"}), 201

    comments = Comment.query.filter_by(user_id=user.id).all()
    return jsonify({"comments": [{"id": c.id, "text": c.comment} for c in comments]}), 200
