from flask import Blueprint, render_template, request, jsonify
from flask import Flask, jsonify, request
from flask_jwt_extended import get_jwt_identity
from werkzeug.utils import secure_filename
from utils.sql import SQLiteClass
from functools import wraps
from utils.common import validate_token
from utils.common import allowed_file
from utils.common import savefile
from utils.ai import to_vectorstore
import json
import datetime
from uuid import uuid4


known_blueprint = Blueprint("known_module", __name__)


# known 组件里创建接口
@known_blueprint.route("/known_create", methods=["POST"])
@validate_token
def known_create():
    # 获取参数
    params = request.form
    files = request.files.getlist('files')  # 获取文件列表

    key = str(uuid4())
    title= params.get("title", None)
    desc = params.get("desc", None)
    type = params.get("type", None)
    leng = params.get("leng", None)
        
    if type == 'text':
        content = params.get("content", None)
    elif type == 'file':
        contentlist = json.loads(params.get("upload", None))
        # 判断文件数量
        if len(files) > 5:
            return jsonify({"code": 200, 'status': 'error',"msg": "File count not more than 5!"}), 200
        # 判断文件是否传成功和限制格式
        for item in contentlist:
            if item['response']['status'] != 'success':
                return jsonify({"code": 200, 'status': 'error',"msg": "Upload Error, Some File Type Not Support!"}), 200
        content = ','.join([item['name'] for item in contentlist])
    
    # 获取当前用户的 ID
    current_user = get_jwt_identity()
    time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    newknown = {
        'key': key,
        'title':title,
        'desc':desc,
        'type':type,
        'leng':leng,
        'content': content,
        'isdel':'0',
        'creator':current_user,
        'createtime': time,
    }
    print('============>', newknown)
  
    try:
        with SQLiteClass("acebergagent.db") as cursor:
            rows_affected = cursor.insert_data("known", newknown) 
        if rows_affected > 0:
            if  type == 'text':
                response = jsonify({"msg": "Create Data Success!", "status": "success"})
            elif  type == 'file':
                # 如果数据新增到db成功，则新增数据到文件夹 和 向量库
                if savefile(files, key):
                    if to_vectorstore(key):
                        response = jsonify({"msg": "Create Data, File, Vectorstore  Success!", "status": "success"})
                    else:
                        response = jsonify({"msg": "Generate Vectorstore Error!", "status": "error"})
                else:
                    response = jsonify({"msg": "Save File Error!", "status": "error"})
            else:
                pass
        else:
            response = jsonify({"msg": "Create Error!", "status": "error" })
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
            
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"

    return response



# Modal 里的action
@known_blueprint.route("/known_uploadaction", methods=["POST"])
# @validate_token
def known_uploadaction():
    if 'files' not in request.files:
        return jsonify({"msg": "files not available", "status": "error"}), 400

    try:
        files = request.files.getlist('files')
        
        uploaded_files = []
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                uploaded_files.append(filename)
                
            else:
                return jsonify({"msg": "File type not allowed", "status": "error"}), 400
        
        response = jsonify({"msg": "Upload Success!", "status": "success", "files": uploaded_files}), 200
    
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
    
    return response



@known_blueprint.route("/known_query", methods=["POST"])
@validate_token
def known_query():
    # 获取参数
    params = json.loads(request.data.decode("utf-8"))
    
    # select * from known LIMIT 5,2
    current = params.get("current", None)
    pagesize = params.get("pagesize", None)
    type = params.get("type", None)
    # 获取当前用户的 ID
    current_user = get_jwt_identity()

    try:
        with SQLiteClass("acebergagent.db") as cursor:
            if type == '':
                data = cursor.select_data("known", condition="creator='{}' and type='text' and isdel='0' limit {},{}".format(current_user, current, pagesize)) 
                total = cursor.cursor.execute("SELECT count(key) from known where creator='{}' and type='text' and isdel='0'".format(current_user)).fetchall() 
            else:
                data = cursor.select_data("known", condition="creator='{}' and type='{}' and isdel='0' limit {},{}".format(current_user, type, current, pagesize))
                total = cursor.cursor.execute("SELECT count(key) from known where creator='{}' and type='{}' and isdel='0'".format(current_user, type,)).fetchall() 
            

        res = {'data':data, 'total':total[0][0]}
        response = jsonify({"msg": "Query Success! ", "status": "success", "data": res})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"


    return response

# 更新接口
@known_blueprint.route("/known_update", methods=["POST"])
@validate_token
def known_update():
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
@known_blueprint.route("/known_del", methods=["POST"])
@validate_token
def known_del():
    # 获取参数
    params = json.loads(request.data.decode("utf-8"))
    
    key = params.get("key", None)
    
    try:
        with SQLiteClass("acebergagent.db") as cursor:
            data = cursor.update_data("known", {'isdel' : '1'}, condition="key='{}'".format(key))

        response = jsonify({"msg": "Delete Success! ", "status": "success", "data": data})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"


    return response

