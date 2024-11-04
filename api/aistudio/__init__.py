from flask import Blueprint, render_template, request, jsonify
from utils.common import validate_token
import json
import requests
import os
from dotenv import load_dotenv

aistudio_blueprint = Blueprint("aistudio_module", __name__)

_ = load_dotenv(dotenv_path='aceberg.env') 
key = os.getenv('Key')
path = os.getenv('Path')
X_API_KEY = os.getenv('X_API_KEY')

os.environ["OPENAI_API_KEY"] = key
os.environ["OPENAI_API_PATH"] = path
os.environ["SERPER_API_KEY"] = X_API_KEY

from langchain_community.utilities import GoogleSerperAPIWrapper
from langchain_core.tools import Tool
from langchain import hub
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.prompts import PromptTemplate

# ai搜索方法返回数据方法
def agent_aisearch(input, args):
    details = []
    summary = ""
    
    # 使用GoogleSerperAPIWrapper 搜索4项结果
    url = "https://google.serper.dev/search"
    payload = json.dumps({
    "q": input,
    "gl": "cn",
    "num": 8
    })
    headers = {
    'X-API-KEY': X_API_KEY,
    'Content-Type': 'application/json'
    }

    print('正在获取搜索结果......')
    details = requests.request("POST", url, headers=headers, data=payload).json()['organic'] #list
    
    # 使用langchain搜索摘要
    
    search = GoogleSerperAPIWrapper()
    tools = [
        Tool(
            name="搜索互联网答案",
            func=search.run,
            description= "用于当你需要使用搜索引擎解答此问题时",
        )
    ]

    model = ChatOpenAI(
        api_key=key,
        base_url=path,
        model=args['model'],
        temperature=args['temperature'],
        max_tokens=args['maxtoken'],
        model_kwargs={'top_p': args['top_p']}
        )

   
    prompt = PromptTemplate(
                                input_variables=['agent_scratchpad', 'input', 'tool_names', 'tools'],
                                metadata = {'lc_hub_owner': 'hwchase17', 'lc_hub_repo': 'react', 'lc_hub_commit_hash': 'd15fe3c426f1c4b3f37c9198853e4a86e20c425ca7f4752ec0c9b0e97ca7ea4d'},
                                template='''Answer the following questions as best you can. You have access to the following tools:\n\n
                                {tools}\n\n
                                Use the following format:\n\n
                                Question: the input question you must answer\n
                                Thought: you should always think about what to do\n
                                Action: the action to take, should be one of [{tool_names}]\n
                                Action Input: the input to the action\n
                                Observation: the result of the action\n... (this Thought/Action/Action Input/Observation can repeat N times)\n
                                Thought: I now know the final answer\nFinal Answer: the final answer to the original input question\n\n
                                Answer must in Chinese.
                                Begin!\n\n
                                Question: {input}\n
                                Thought:{agent_scratchpad}'''
                              )
    
    
    # prompt = hub.pull("hwchase17/structured-chat-agent")
    agent = create_react_agent(model, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=False, handle_parsing_errors=True)

    print('正在获取摘要......')
    summary = agent_executor.invoke({"input": input})['output']
    
    res = {
        "summary" : summary,
        "details" : details
    }
    return res


# aistudio 组件里搜索返回值的接口
@aistudio_blueprint.route("/aistudio", methods=["POST"])
@validate_token
def aistudio():

    # 获取参数
    params = json.loads(request.data.decode("utf-8"))
    usrinput = params.get("usrinput", None)
    defaultargs = {'model': 'THUDM/glm-4-9b-chat', 'temperature': 0.7, 'maxtoken': 200, 'top_p': 0.7}
    args = params.get("args") if params.get("args") else defaultargs
    print(params.get("args"))    
    if usrinput:
        try:
            res = agent_aisearch(usrinput ,args)
            print(res)
            response = jsonify({"msg": "", "status": "success", "data": json.dumps(res, ensure_ascii=False)})
            response.status_code = 200
            response.headers["Content-Type"] = "application/json; charset=utf-8"
        except Exception as e:
            print(e)
            response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
            response.status_code = 200
            response.headers["Content-Type"] = "application/json; charset=utf-8"
    else:
        response = jsonify({"msg": "请求参数有误", "status": "error", "data": "请求参数有误"})
        response.status_code = 200

    return response


