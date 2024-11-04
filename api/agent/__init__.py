from flask import Blueprint, render_template, request, jsonify
from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, get_jwt_identity, verify_jwt_in_request
from flask_jwt_extended.exceptions import NoAuthorizationError, InvalidHeaderError, RevokedTokenError
from utils.sql import SQLiteClass
from functools import wraps
from utils.common import validate_token
import json
import datetime
from uuid import uuid4

agent_blueprint = Blueprint("agent_module", __name__)



# agent 组件里创建接口
@agent_blueprint.route("/agent_create", methods=["POST"])
@validate_token
def agent_create():

    # 获取参数
    params = json.loads(request.data.decode("utf-8"))
    
    id = str(uuid4())
    title= params.get("title", None)
    type = params.get("type", None)
    # 获取当前用户的 ID
    current_user = get_jwt_identity()
    newagent = {
        'id': id,
        'title':title,
        'type':type,
        'agentjson': '',
        'creator':current_user,
        'createtime': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'isdel':'0',
        'ison': '0'
    }
    print(newagent)
    try:
        with SQLiteClass("acebergagent.db") as cursor:
            rows_affected = cursor.insert_data("agent", newagent) 
        if rows_affected > 0:
            response = jsonify({"msg": "Create Success!", "status": "success", "data": newagent})
        else:
            response = jsonify({"msg": "Create Error!", "status": "error", "data": newagent})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
            
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"


    return response


@agent_blueprint.route("/agent_query", methods=["POST"])
@validate_token
def agent_query():
    # 获取参数
    params = json.loads(request.data.decode("utf-8"))
    
    type = params.get("type", None)
    
    # 获取当前用户的 ID
    current_user = get_jwt_identity()
    print(current_user)
    try:
        if type == '全部' or type == '':
            with SQLiteClass("acebergagent.db") as cursor:
                data = cursor.select_data("agent", condition="creator='{}' and isdel='0'".format(current_user))
        else:
            with SQLiteClass("acebergagent.db") as cursor:
                data = cursor.select_data("agent", condition="creator='{}' and type='{}' and isdel='0'".format(current_user,type))
        
        response = jsonify({"msg": "Query Success! ", "status": "success", "data": data})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"


    return response

# 更新接口
@agent_blueprint.route("/agent_update", methods=["POST"])
@validate_token
def agent_update():
    # 获取参数
    params = json.loads(request.data.decode("utf-8"))
    
    id = params.get("id", None)
    title = params.get("title", None)
    type = params.get("type", None)
    ison = params.get("ison", None)
    
    try:
        with SQLiteClass("acebergagent.db") as cursor:
            data = cursor.update_data("agent", {'title':title, 'type':type,'ison' : ison}, condition="id='{}'".format(id))
        print(data)
        if data:
            response = jsonify({"msg": "Update Success! ", "status": "success", "data": data})
            response.status_code = 200
            response.headers["Content-Type"] = "application/json; charset=utf-8"
        else:
            response = jsonify({"msg": "Update Failed! ", "status": "error", "data": data})
            response.status_code = 200
            response.headers["Content-Type"] = "application/json; charset=utf-8"
            
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"


    return response

# 删除接口
@agent_blueprint.route("/agent_del", methods=["POST"])
@validate_token
def agent_del():
    # 获取参数
    params = json.loads(request.data.decode("utf-8"))
    
    id = params.get("id", None)
    
    try:
        with SQLiteClass("acebergagent.db") as cursor:
            data = cursor.update_data("agent", {'isdel' : '1'}, condition="id='{}'".format(id))

        response = jsonify({"msg": "Delete Success! ", "status": "success", "data": data})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"


    return response


