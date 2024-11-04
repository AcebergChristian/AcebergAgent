from flask import Blueprint, render_template, request, jsonify
from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, get_jwt_identity, verify_jwt_in_request
from flask_jwt_extended.exceptions import NoAuthorizationError, InvalidHeaderError, RevokedTokenError
from utils.sql import SQLiteClass
from functools import wraps
from utils.common import validate_token
from utils.ai import AgentExecute
import json
import datetime
from uuid import uuid4

agentstudio_blueprint = Blueprint("agentstudio_module", __name__)



# agentstudio known 的options
@agentstudio_blueprint.route("/agentstudio_knownoptions", methods=["GET"])
@validate_token
def agentstudio_knownoptions():

    # 获取当前用户的 ID
    current_user = get_jwt_identity()
    try:
        with SQLiteClass("acebergagent.db") as cursor:
            data = cursor.select_data("known",columns='key, title as name, type as type', condition="creator='{}' and isdel='0'".format(current_user))
        
        response = jsonify({"msg": "Query Success! ", "status": "success", "data": data})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"

    return response


# agentstudio tools 的options
@agentstudio_blueprint.route("/agentstudio_toolsoptions", methods=["GET"])
@validate_token
def agentstudio_toolsoptions():

    # 获取当前用户的 ID
    current_user = get_jwt_identity()
    try:
        with SQLiteClass("acebergagent.db") as cursor:
            data = cursor.select_data("tools",columns='id as key, title as name, filename', condition="creator='{}' and isdel='0'".format(current_user))
        
        print(data)
        
        response = jsonify({"msg": "Query Success! ", "status": "success", "data": data})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"

    return response


# 问答接口
@agentstudio_blueprint.route("/agentstudio_agent", methods=["POST"])
@validate_token
def agentstudio_agent():

    # 获取参数
    params = json.loads(request.data.decode("utf-8"))
    print('=============>', params) #{'llmargs': {'welcome': '你好', 'prompt': '萨大大大大实打实的', 'model': 'gpt-3.5-turbo', 'temperature': 0.7, 'maxtoken': 888, 'top_p': 0.95, 'known': '飞连介绍文档', 'tools': ['GoogleSearchApi']}, 'query': '你好么？？？？？', 'known_data': {'key': '5e40f0d5-2ed1-4874-8e17-af302fb9a8f9', 'type': 'file'}, 'tools_list': [{'key': '36e88985-291a-4839-aed0-afcf50ab3615', 'filename': 'GoogleSearchApi_36e88985-291a-4839-aed0-afcf50ab3615.py'}]}
    
    # 获取当前用户的 ID
    current_user = get_jwt_identity()
    llmargs = params.get("llmargs", {})
    query = params.get("query", "")
    known_data = params.get("known_data", {})
    tools_list = params.get("tools_list", [])
    
    try:
        agent = AgentExecute(llmargs, query, known_data, tools_list)
        
        res = agent()
        
        response = jsonify({"msg": "Query Success! ", "status": "success", "data": res})
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
    response.status_code = 200
    response.headers["Content-Type"] = "application/json; charset=utf-8"
    
    return response