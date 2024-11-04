from flask import Blueprint, render_template, request, jsonify
from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, get_jwt_identity, verify_jwt_in_request
from flask_jwt_extended.exceptions import NoAuthorizationError, InvalidHeaderError, RevokedTokenError
from utils.sql import SQLiteClass
from functools import wraps
from utils.common import validate_token
from utils.common import create_py_file, update_py_file
import json
import datetime
from uuid import uuid4
import os
import sys
import tempfile
import importlib.util
import re

tools_blueprint = Blueprint("tools_module", __name__)



# agent 组件里创建接口
@tools_blueprint.route("/tool_create", methods=["POST"])
@validate_token
def tool_create():

    # 获取参数
    params = json.loads(request.data.decode("utf-8"))
    
    id = str(uuid4())
    title= params.get("title", None)
    desc = params.get("desc", None)
    funcname = params.get("funcname", None)
    defaultcode = f"""# -*- coding: utf-8 -*- \nfrom langchain_core.tools import tool\n@tool\ndef {funcname}(query: str) -> str:\n\n    '''\n        {desc}\n        '''\n    return 'test'\n"""
    # 获取当前用户的 ID
    current_user = get_jwt_identity()
    newtool = {
        'id': id,
        'title':title,
        'desc':desc,
        'funcname':funcname,
        'filename':f'{title}_{id}.py',
        'toolcode': defaultcode,
        'isdel':'0',
        'createtime': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'creator':current_user,
    }
    print(newtool)
    try:
        with SQLiteClass("acebergagent.db") as cursor:
            rows_affected = cursor.insert_data("tools", newtool) 
        if rows_affected > 0:
            # 同时创建py文件在tools文件夹里
            if create_py_file(f'{title}_{id}.py', defaultcode):
                response = jsonify({"msg": "Create Success!", "status": "success"})
            else:
                response = jsonify({"msg": "Create Pyfile Error!", "status": "error"})
        else:
            response = jsonify({"msg": "Create Error!", "status": "error"})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
            
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"

    return response


@tools_blueprint.route("/tool_query", methods=["POST"])
@validate_token
def agent_query():
    # 获取当前用户的 ID
    current_user = get_jwt_identity()
    try:
        with SQLiteClass("acebergagent.db") as cursor:
            data = cursor.select_data("tools", condition="creator='{}' and isdel='0'".format(current_user))
 
        response = jsonify({"msg": "Query Success! ", "status": "success", "data": data})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"

    return response


# 更新接口
@tools_blueprint.route("/tool_update", methods=["POST"])
@validate_token
def tool_update():
    # 获取参数
    params = json.loads(request.data.decode("utf-8"))
    id = params.get("id", None)
    title= params.get("title", None)
    toolcode = params.get("toolcode", None)
    print(id, toolcode)
    try:
        with SQLiteClass("acebergagent.db") as cursor:
            data = cursor.update_data("tools", {'toolcode' : toolcode}, condition="id='{}'".format(id))
        if data:
            if update_py_file(f'{title}_{id}.py', toolcode):
                response = jsonify({"msg": "Update Success! ", "status": "success"})
            else:
                response = jsonify({"msg": "Pyfile Update Failed! ", "status": "error"})
        else:
            response = jsonify({"msg": "Update Failed! ", "status": "error"})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
            
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"


    return response

# 删除接口
@tools_blueprint.route("/tool_del", methods=["POST"])
@validate_token
def tool_del():
    # 获取参数
    params = json.loads(request.data.decode("utf-8"))
    
    id = params.get("id", None)
    print('===========>',id)
    
    try:
        with SQLiteClass("acebergagent.db") as cursor:
            data = cursor.update_data("tools", {'isdel' : '1'}, condition="id='{}'".format(id))

        response = jsonify({"msg": "Delete Success! ", "status": "success", "data": data})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"


    return response



# 危险模块和关键字列表
DANGEROUS_MODULES_AND_KEYWORDS = [
    'exec', 'eval', 'os', 'sys', 'subprocess', 'shutil', 'globals', 'locals',
    'open', 'importlib', 'compile', 'delattr', 'setattr', 'getattr', '__import__'
]

def check_dangerous_code(code):
    """检查代码中是否包含危险模块或关键字"""
    for keyword in DANGEROUS_MODULES_AND_KEYWORDS:
        if re.search(rf'\b{keyword}\b', code):
            return False
    return True

# 测试python代码ok 
@tools_blueprint.route("/tool_codetest", methods=["POST"])
@validate_token
def tool_codetest():
    # 获取参数
    params = json.loads(request.data.decode("utf-8"))
    toolcode = params.get("toolcode", None)
    testquery = params.get("testquery", '最近有什么新闻？')
    # key = params.get("key", None)
    
    # print(params)
    try:
        
        # 检查代码是否包含危险模块或关键字
        if not check_dangerous_code(toolcode):
            response = jsonify({"msg": "Dangerous modules or keywords! ", "status": "error", "data": ''})
            response.status_code = 200
            response.headers["Content-Type"] = "application/json; charset=utf-8"
            return response
        
        # 创建一个临时文件来保存传入的代码
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.py', delete=False) as temp_file:
            temp_file.write(toolcode)
            temp_file_name = temp_file.name
        
        # 动态导入临时文件中的模块
        spec = importlib.util.spec_from_file_location("temp_module", temp_file_name)
        temp_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(temp_module)
        
        func = [func for func in dir(temp_module) if callable(getattr(temp_module, func)) ][0]
        # print(func)
        
        # 从模块中获取方法函数，并执行它
        if hasattr(temp_module, func):
            res = getattr(temp_module, func)(testquery)  # 使用 getattr 动态调用函数
            os.remove(temp_file_name)  # 删除临时文件
        
        response = jsonify({"msg": "Test Success! ", "status": "success", "data": res})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"


    return response


