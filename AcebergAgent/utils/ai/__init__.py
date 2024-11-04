from langchain_community.document_loaders import PyPDFLoader,Docx2txtLoader,UnstructuredWordDocumentLoader,UnstructuredMarkdownLoader,UnstructuredExcelLoader,UnstructuredPowerPointLoader
from langchain import hub
from langchain_community.vectorstores import FAISS
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import OpenAIEmbeddings,ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os
import importlib
import ast
from utils.sql import SQLiteClass

from langchain_core.documents import Document
from langchain.tools.retriever import create_retriever_tool
from langchain.agents import create_tool_calling_agent,Tool
from langchain.agents import AgentExecutor
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate


from dotenv import load_dotenv
# # 加载 env.env 文件  获取X_API_KEY
_ = load_dotenv(dotenv_path='test.env')

key = os.getenv('Key')
path = os.getenv('Path')

os.environ["OPENAI_API_KEY"] = key
os.environ["OPENAI_API_BASE"] = path


def to_embeddings():
    embeddings = OpenAIEmbeddings(
        model="text-embedding-ada-002"
    )
    return embeddings

# 解析文件规则，根据文件类型选择解析器
def parserrule(file):
    # 格式
    if file.endswith('.txt'):
        return Docx2txtLoader(file)
    elif file.endswith('.pdf'):
        return PyPDFLoader(file)
    elif file.endswith('.docx') or file.endswith('.doc'):
        return UnstructuredWordDocumentLoader(file)
    elif file.endswith('.md'):
        return UnstructuredMarkdownLoader(file)
    elif file.endswith('.xlsx') or file.endswith('.xls'):
        return UnstructuredExcelLoader(file)
    elif file.endswith('.pptx') or file.endswith('.ppt'):
        return UnstructuredPowerPointLoader(file)


def to_vectorstore(key):
    try:
        VECTORS_FOLDER = '../AcebergAgent/vectorstore'
        if not os.path.exists(VECTORS_FOLDER):
            os.makedirs(VECTORS_FOLDER)

        # 从uploads_folder/upload_keyxxxxxxxxxxxx  文件夹下获取文件 
        UPLOADS_FOLDER = '../AcebergAgent/uploads_folder'
        files = [ f'{UPLOADS_FOLDER}/upload_{key}/{item}' for item in os.listdir(f'{UPLOADS_FOLDER}/upload_{key}')]  # 添加相对路径
        
        docslist = [parserrule(item).load()[0] for item in files]
        print('=============> spliter')
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=30)
        splits = text_splitter.split_documents(docslist)
        
        if os.path.exists(f"{VECTORS_FOLDER}/vector_{key}.faiss"):
            print('=============> load vectorstore')
            vectorstore = FAISS.load_local(f"{VECTORS_FOLDER}/vector_{key}.faiss",
                            embeddings=OpenAIEmbeddings(),
                            allow_dangerous_deserialization=True)  # 加载本地的向量数据库
        else:
            print('=============> embedding')
            vectorstore = FAISS.from_documents(
                documents=splits,
                embedding=OpenAIEmbeddings()
            )
            # 存到本地 向量文件
            print('=============> 存到本地 向量文件')
            vectorstore.save_local(f"{VECTORS_FOLDER}/vector_{key}.faiss")  # 保存向量数据库到本地文件
        
        return True
    
    except Exception as e:
        print(f"Error in loading vectorstore: {e}")
        return False
    
def to_RAG(files,
           query,
           chatargs={'model':'gpt-4o-mini'},
           ):
    '''
        Example:

        from langchain_openai import OpenAIEmbeddings

        res = to_RAG(['file1.txt','file2.docx'],query, chatargs={'model':'gpt-4o-mini'})
    '''
    
    # 读取文件 切文本
    print('================> text spliter')
    docslist = [parserrule(item).load()[0] for item in files]
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=30)
    splits = text_splitter.split_documents(docslist)

    # 生成向量
    if os.path.exists("vectorstore.faiss"):
        print('=============> load vectorstore')
        vectorstore = FAISS.load_local("vectorstore.faiss",
                        embeddings=OpenAIEmbeddings(),
                        allow_dangerous_deserialization=True)  # 加载本地的向量数据库
    else:
        print('=============> embedding')
        vectorstore = FAISS.from_documents(
            documents=splits,
            embedding=OpenAIEmbeddings()
        )
        # 存到本地 向量文件
        print('=============> 存到本地 向量文件')
        vectorstore.save_local("vectorstore.faiss")  # 保存向量数据库到本地文件


    llm = ChatOpenAI(model_name=chatargs['model'],)
    
    retriever = vectorstore.as_retriever()

    prompt = hub.pull("rlm/rag-prompt")


    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)


    print('=============> rag_chain')
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    try:
        res = rag_chain.invoke(query)
        print('=============> output')
        print(res)
        return res
    except Exception as e:
        print(f"发生错误: {e}")
        return "发生错误: " + str(e)
    
    
    
# welcome = params.get("welcome", "")
# prompt = params.get("prompt", "")
# model = params.get("model", "gpt-3.5-turbo")
# temperature = params.get("temperature", 0.7)
# maxtoken = params.get("maxtoken", 888)
# top_p = params.get("top_p", 0.95)
# known = params.get("known", "")
# tools = params.get("tools", [])





def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

class ToolsParser:
    def __init__(self, llmargs, query):
        self.model = llmargs.get('model', 'gpt-3.5-turbo')
        self.temperature = llmargs.get('temperature', '0.7')
        self.max_tokens = llmargs.get('max_tokens', '1024')
        self.top_p = llmargs.get('top_p', '0.7')
        self.prompt = llmargs.get('prompt', 'prompt')
        self.query = query

    def llm(self):
        llm = ChatOpenAI(
            model_name=self.model,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            model_kwargs = {'top_p':self.top_p}
            )
        return llm
    
    def prompt(self):
        return self.prompt

    def text_retriever_tool(self, key):
        try:
            with SQLiteClass("acebergagent.db") as cursor:
                content = cursor.select_data("known",columns='content', condition="key='{}' and isdel='0'".format(key))[0]['content']
        except Exception as e:
            print(str(e))
            

        chunk_size = int(len(content)/50)
        chunk_overlap = int(len(content)/240)
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        document = Document(page_content=content)
        splits = text_splitter.split_documents([document])

        vectorstore = FAISS.from_documents(
            documents=splits,
            embedding=OpenAIEmbeddings(
                # openai_api_base=path,
                # openai_api_key=key
                )
        )
        retriever= vectorstore.as_retriever()

        retriever_tool = create_retriever_tool(
            retriever,
            "vector_search",
            "For any question, you must first use this vector_search tool to answer, and if it cannot be found, then use other tools!",
        )

        return retriever_tool

    def file_retriever_tool(self, key):
        if os.path.exists(f"../AcebergAgent/vectorstore/vector_{key}.faiss"):
            
            vectorstore = FAISS.load_local(
                f"../AcebergAgent/vectorstore/vector_{key}.faiss",
                embeddings=OpenAIEmbeddings(
                    # openai_api_base=path,
                    # openai_api_key=key
                ),
                allow_dangerous_deserialization=True,
            )

        retriever= vectorstore.as_retriever()

        retriever_tool = create_retriever_tool(
            retriever,
            "vector_search",
            "For any question, you must first use this vector_search tool to answer, and if it cannot be found, then use other tools!",
        )

        return retriever_tool

    def custom_tools(self, filename):
        # toolsfolder文件夹下，里面是python代码，包括自定义的tool,返回每一个py文件里的tool
        tools_folder = "toolsfolder"

        module_name = filename[:-3]  # 去掉 .py 后缀
        module = importlib.import_module(f'{tools_folder}.{module_name}')

        # 检查模块中的所有函数
        for attr in dir(module):
            func = getattr(module, attr)
            if callable(func) and hasattr(func, 'args_schema'):
                # 尝试获取原始函数
                original_func = getattr(func, '__wrapped__', func)

        return original_func #返回每一个py文件里的tool
    
    def test(self, filename):
        # toolsfolder文件夹下，里面是python代码，包括自定义的tool,返回每一个py文件里的tool
        tools_folder = "toolsfolder"

        module_name = filename[:-3]  # 去掉 .py 后缀
        module = importlib.import_module(f'{tools_folder}.{module_name}')
        tools = []
        # 检查模块中的所有函数
        for attr in dir(module):
            func = getattr(module, attr)
            if callable(func) and hasattr(func, 'args_schema'):
                # 尝试获取原始函数
                original_func = getattr(func, '__wrapped__', func)
                # 添加符合条件的函数到 tools 列表
                tools.append(original_func)
        
        model = ChatOpenAI(model="gpt-3.5-turbo")

        prompt = hub.pull("hwchase17/openai-functions-agent")
        # prompt = PromptTemplate(
        #     input_variables=["agent_scratchpad", "context", "question","tools"],
        #     template="""请根据以下上下文回答问题：\n{context}\n问题：{question}
        #     {agent_scratchpad}
        #     必要时请根据以下工具回答问题：\n{tools}
        #     """,
        # )

        agent = create_tool_calling_agent(model, tools, prompt)

        agent_executor = AgentExecutor(agent=agent, tools= tools)


        res = agent_executor.invoke({"input": "马斯克最近怎么了？"})

        print(res)


# {'welcome': '你好', 'prompt': 'asdadadadadads', 'model': 'gpt-3.5-turbo', 'temperature': 0.7, 'maxtoken': 888, 'top_p': 0.95, 'known': {'key': '5e40f0d5-2ed1-4874-8e17-af302fb9a8f9', 'type': 'file'}, 'tools': [{'key': '36e88985-291a-4839-aed0-afcf50ab3615', 'filename': 'GoogleSearchApi_36e88985-291a-4839-aed0-afcf50ab3615.py'}]}
class AgentExecute(ToolsParser):
    def __init__(self, llmargs, query, known_data, tools_list):
        super().__init__(llmargs, query)
        # 添加缺失的缩进块
        self.known_data = known_data
        self.tools_list = tools_list

    def get_tools(self):
        tools = []
        if self.known_data:
            if self.known_data['type'] == 'text':
                knowntool = self.text_retriever_tool(self.known_data['key'])
            elif self.known_data['type'] == 'file':
                knowntool = self.file_retriever_tool(self.known_data['key'])
            tools.append(knowntool)
        
        if self.tools_list:
            for item in self.tools_list:
                tools.append(self.custom_tools(item['filename']))
            
        # print('tools==========>', tools)
        return tools
        
    def __call__(self):
        # 获取工具
        tools = self.get_tools()
            
        # 用户自定义的提示
        self_prompt = self.prompt
        default_prompt = hub.pull("hwchase17/openai-functions-agent")
        # 如果有工具，使用默认的提示模板
        if tools:
            # 使用 partial 方法预填充用户的自定义提示
            prompt = default_prompt.partial(instructions=self.prompt)
            # prompt = ChatPromptTemplate.from_template(
            #     '''Answer the following question as best you can with using tools.{tools}\n\n
            #     Question: {input}\n
            #     请根据用户的提问：{input}\n
            #     {self_prompt}
            #     Thought: {agent_scratchpad}
            #     Final Answer: 
            #     '''
            # )
        else:
            tools = [Tool(name="NoOp", func=lambda x: "No operation performed.", description="This is a no-operation tool.")]
            # 没有工具时的提示模板
            prompt = ChatPromptTemplate.from_template(
                '''Answer the following question as best you can without using any tools.\n\n
                Question: {input}\n
                请根据用户的提问：{input}\n
                {self_prompt}
                Thought: {agent_scratchpad}
                Final Answer: 
                '''
            )
            
        model = self.llm()
        agent = create_tool_calling_agent(model, tools, prompt)

        agent_executor = AgentExecutor(agent=agent, tools=tools)
        print('===========>res')
        res = agent_executor.invoke({
            "input": self.query,
            "self_prompt": self_prompt,
            "agent_scratchpad": "",
            "tools":tools,
            "tool_names": [tool.name for tool in tools], 
        })['output']

        return res

