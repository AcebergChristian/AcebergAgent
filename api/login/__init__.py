from flask import Blueprint, render_template, request, jsonify
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import json
# from utils.ai import _
from utils.sql import SQLiteClass
import datetime
from utils.common import validate_token


login_blueprint = Blueprint("login_module", __name__)


@login_blueprint.route("/login", methods=["POST"])
def login():
    username = request.json.get('username', None)
    password = request.json.get('password', None)
    print(username, password)
    if not username or not password:
        return jsonify({'msg': 'Missing username or password'}), 400

    with SQLiteClass("acebergagent.db") as cursor:
        user = cursor.select_data("users", condition="account='{}'".format(username))

    if not user:
        return jsonify({'msg': 'Account no exists!'}), 401

    password_hash = user[0]['password']

    if not check_password_hash(password_hash, password):
        return jsonify({'msg': 'Password Error!'}), 401

    # 生成 token
    access_token = create_access_token(identity=username, expires_delta=datetime.timedelta(days=1))
    
    return jsonify({'msg': 'Logged in successfully!', 'token': access_token}), 200



@login_blueprint.route("/test", methods=["GET"])
# @validate_token
# @jwt_required()  # 保护这个路由
def test():
    # current_user = get_jwt_identity()
    # return jsonify(logged_in_as=current_user), 200
    return jsonify({'msg': 'Test Successfully!', 'user': 'current_user'}), 200

