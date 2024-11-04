# -*- coding: utf-8 -*-

from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, get_jwt_identity, verify_jwt_in_request
from flask_jwt_extended.exceptions import NoAuthorizationError, InvalidHeaderError, RevokedTokenError
from utils.sql import SQLiteClass
from functools import wraps
import os
from werkzeug.utils import secure_filename
import datetime


# 自定义装饰器来验证 token
def validate_token(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            # 验证 token 的有效性
            verify_jwt_in_request()
            # 获取当前用户的 ID
            current_user = get_jwt_identity()
            with SQLiteClass("acebergagent.db") as cursor:
                user = cursor.select_data("users", condition="account='{}'".format(current_user))
            if not user:
                return jsonify({'msg': 'Data no exists!'}), 401
    
        except NoAuthorizationError:
            # 如果没有提供 token
            return jsonify({"msg": "Missing token"}), 401
        except InvalidHeaderError:
            # 如果 token 的头部无效
            return jsonify({"msg": "Invalid JWT header"}), 401
        # except ExpiredSignatureError:
        #     # 如果 token 已经过期
        #     return jsonify({"msg": "Token has expired"}), 401
        except RevokedTokenError:
            # 如果 token 已经被撤销
            return jsonify({"msg": "Token has been revoked"}), 401
        except Exception as e:
            # 其他类型的错误
            return jsonify({"msg": str(e)}), 401

        return func(*args, **kwargs)
    return wrapper



# 验证上传的文件格式
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'pptx', 'ppt','md'}  # 允许的文件扩展名
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS



# 上传文件到指定文件夹方法和生成向量数据库的方法
def savefile(files, key):
    try:
        UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '../../uploads_folder/upload_{}'.format(key))
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)
        
        for file in files:
            filename = file.filename
            file.save(os.path.join(UPLOAD_FOLDER, filename))
        return True
    except Exception as e:
        print(e)
        return False
    
    
# /toolsfolder里，创建py文件
def create_py_file(file_name, defaultcode):
    try:
        if not os.path.exists('toolsfolder'):
            os.makedirs('toolsfolder', exist_ok=True)  # 确保目录存在
        with open(f'toolsfolder/{file_name}', 'w') as f:
            f.write(defaultcode)
        return True
    except Exception as e:
        print(e)
        return False


            
# /toolsfolder里，更新py文件
def update_py_file(file_name, toolcode):
    try:
        with open(f'toolsfolder/{file_name}', 'w') as f:
            f.write(toolcode)
        return True
    except Exception as e:
        print(e)
        return False