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

dash_blueprint = Blueprint("dash_module", __name__)



# dash 组件里创建接口
@dash_blueprint.route("/dash_indicator", methods=["GET"])
@validate_token
def dash():

    # 获取参数
    # params = json.loads(request.data.decode("utf-8"))
    
    # 获取当前用户的 ID
    current_user = get_jwt_identity()
    
    total=0
    isonnum=0
    isoffnum=0
    usernum=0
    createnum = []
    dailyres = []
    
    try:
        with SQLiteClass("acebergagent.db") as cursor:
            # 合并多个查询为一个
            combined_query = """
            SELECT 
                (SELECT COUNT(id) FROM agent WHERE isdel = '0') as total,
                (SELECT COUNT(id) FROM agent WHERE isdel = '0' AND ison = '1') as isonnum,
                (SELECT COUNT(id) FROM agent WHERE isdel = '0' AND ison = '0') as isoffnum,
                (SELECT COUNT(id) FROM users) as usernum
            """
            total, isonnum, isoffnum, usernum = cursor.cursor.execute(combined_query).fetchone()

            # 使用子查询优化用户创建的agent数量统计
            user_agent_counts = cursor.cursor.execute("""
                SELECT u.account, COALESCE(a.count, 0) as count
                FROM users u
                LEFT JOIN (
                    SELECT creator, COUNT(id) as count
                    FROM agent
                    WHERE isdel = '0'
                    GROUP BY creator
                ) a ON u.account = a.creator
            """).fetchall()

            createnum = [{'x': user, 'y': count, 'type': 'num'} for user, count in user_agent_counts]

            # 优化日期查询
            dailydata = cursor.cursor.execute("""
                SELECT DATE(createtime) as date, creator, COUNT(id) as count
                FROM agent 
                WHERE isdel = '0'
                GROUP BY DATE(createtime), creator
                ORDER BY date, creator
                lIMIT 20
            """).fetchall()

            dailyres = [{"type": date, "user": user, "value": value} for date, user, value in dailydata]
        
        data = {
            'total' : total,
            'isonnum': isonnum,
            'isoffnum': isoffnum,
            'usernum': usernum,
            'createnum' : createnum,
            'dailyres': dailyres
        }
        
        response = jsonify({"msg": "Query Success!", "status": "success", "data": data})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
            
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 203
        response.headers["Content-Type"] = "application/json; charset=utf-8"


    return response

