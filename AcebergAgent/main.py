# -*- coding: utf-8 -*-

from flask import Flask, render_template
from api.login import login_blueprint
from api.dash import dash_blueprint
from api.agent import agent_blueprint
from api.agentstudio import agentstudio_blueprint
from api.known import known_blueprint
from api.tools import tools_blueprint

from api.aistudio import aistudio_blueprint
from api.usrcenter import usrcenter_blueprint
from dotenv import load_dotenv
import os
from flask_jwt_extended import JWTManager
import logging
from logging.handlers import RotatingFileHandler


# 加载 env.env 文件  获取SECRET_KEY
_ = load_dotenv(dotenv_path='aceberg.env') 
SECRET_KEY = os.getenv('SECRET_KEY')


# app = Flask(__name__, template_folder='templates', static_folder='static')
app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = SECRET_KEY  # 更换为你的密钥
jwt = JWTManager(app)


@app.route('/')
@app.route('/login')
@app.route('/dash')
@app.route('/agent')
@app.route('/known')
@app.route('/tools')
def index():
    return render_template('index.html')


# 注册蓝图
app.register_blueprint(aistudio_blueprint, url_prefix='/api')
app.register_blueprint(usrcenter_blueprint, url_prefix='/api')

app.register_blueprint(login_blueprint, url_prefix='/api')
app.register_blueprint(dash_blueprint, url_prefix='/api')
app.register_blueprint(agent_blueprint, url_prefix='/api')
app.register_blueprint(agentstudio_blueprint, url_prefix='/api')
app.register_blueprint(known_blueprint, url_prefix='/api')
app.register_blueprint(tools_blueprint, url_prefix='/api')



if __name__ == '__main__':
    # # 配置日志文件处理器
    # file_handler = RotatingFileHandler('app.log', maxBytes=20*1024*1024, backupCount=5)
    
    # # 设置日志格式
    # formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    # file_handler.setFormatter(formatter)
    
    # # 将处理器添加到Flask应用的日志系统
    # app.logger.addHandler(file_handler)
    
    # # 设置日志级别
    # app.logger.setLevel(logging.INFO)
    
    app.run(host='0.0.0.0', debug=True)


