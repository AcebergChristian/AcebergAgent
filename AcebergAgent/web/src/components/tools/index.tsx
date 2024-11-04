import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Modal, Select, Button, Form, Input, Tag, Drawer, Message } from '@arco-design/web-react';
import { useLocation, useHistory } from 'react-router-dom';
import useLocale from '@/utils/useLocale';
import styles from './style/index.module.less';
import {
  IconBranch,
  IconMore,
} from '@arco-design/web-react/icon';
import apiClient from '@/utils/apiService';
import AceEditor from "react-ace";
import 'ace-builds/src-noconflict/mode-python';

// 确保导入所有你需要的模块
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-language_tools';
import useForm from '@arco-design/web-react/es/Form/useForm';


const Tools = (() => {
  const t = useLocale();
  // 定义form
  const FormItem = Form.Item;
  const [form] = Form.useForm();
  const Option = Select.Option;
  const Textarea = Input.TextArea;

  const location = useLocation();
  const { state } = location;

  const history = useHistory();

  const [drawerform] = Form.useForm();


  const [data, setdata] = useState([])
  // 获取数据方法
  const tool_query=()=>{
    apiClient.post('/api/tool_query',
      {}
    ).then((res) => {
      const { msg, status,data } = res.data;
      if (status === 'success') {
        setdata(data)
      }
      else{
        Message.error(msg);
      }
        
    }).catch((err) => {
      Message.error('Query Error!')
    })
  }
  useEffect(()=>{
    tool_query()
    return () => {
      setdata([]); // 清理状态以防止内存泄漏
    };
  }, [])
  

  const [createform] = Form.useForm();
  const [createvisible, setcreatevisible] = useState(false);
  // 创建agent方法
  const createtool=()=>{
    const newtool = createform.getFieldsValue()
    
    apiClient.post('/api/tool_create',newtool).then((res) => {
      const { msg, status, data } = res.data;
      if (status === 'success') {
        Message.success(msg);
        tool_query()
      }
      else {
        Message.error(msg);
      }
    }).catch((err) => {
      Message.error('Create Error!')
    })
  }
  
  // 删除 tool方法
  const deltool=(item)=>{
    Modal.warning({
      title: '删除Agent',
      content: (
        <div>
          <p>您确定要删除名为 {item.title} 的 Tool 吗？</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button type="secondary" onClick={() => {
            Modal.destroyAll(); // 关闭所有模态框
          }}>
            取消
          </Button>
          <Button
          type="primary"
          status='warning'
          style={{ marginLeft: '12px' }}
          onClick={() => {
            // 在这里添加删除操作的代码
            apiClient.post('/api/tool_del', {id: item.id}).then((res) => {
              const { msg, status, data } = res.data;
              if (status === 'success') {
                Message.success(msg);
                tool_query();

                setdrawerstatus({...drawerstatus, visible:false})
                Modal.destroyAll(); // 关闭所有模态框
              } else {
                Message.error(msg);
              }
            }).catch((err) => {
              Message.error('删除出错！');
            });
          }}>
            确认
          </Button>
          </div>
        </div>
      ),
      okButtonProps: {
        style: { display: 'none' }
      },
      cancelButtonProps: {
        style: { display: 'none' }
      }
    });
  }


  // 更新工具
  const editorref = useRef(null);

  // 更新agent方法
  const updatetool=(item)=>{
    const toolcode = editorref.current?.editor.getValue() // 获取编辑器的值
    apiClient.post('/api/tool_update', {id: item.id, title:item.title, toolcode:toolcode}).then((res) => {
      const { msg, status, data } = res.data;
      if (status === 'success') {
        Message.success(msg);
        tool_query();

        setdrawerstatus({...drawerstatus, visible:false})
      } else {
        Message.error(msg);
      }
    }).catch((err) => {
      Message.error(err+'');
    });
  }

  // drawerstatus 传给drawer的数据
  const [drawerstatus, setdrawerstatus] = useState({info:{id:'',title:'',desc:'',funcname:'',toolcode:''},visible:false});
  // 点击tool 展示drawer的方法 把item传递给drawer的字段，目前只有editor的值需要传递
  const showdrawer = useCallback( (item:any) => {
    settestres('')

    setdrawerstatus({visible: true, info: item});
    editorref.current?.editor.setValue(item.toolcode); // 更新编辑器的值
  }, [drawerstatus]);



  const [testres, settestres] = useState('');
  const [testform] = Form.useForm();
  // 测试python代码
  const test=()=>{
    const testformkv = testform.getFieldsValue();
    const toolcode = editorref.current?.editor.getValue() // 获取编辑器的值
    apiClient.post('/api/tool_codetest', { testquery: testformkv.testquery,toolcode:toolcode?toolcode:''}).then((res) => {
      const { msg, status, data } = res.data;
      if (status === 'success') {
        Message.success(msg);
        
        settestres(data)
      } else {
        Message.error(msg);
      }
    }).catch((err) => {
      Message.error(err+'');
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.tools_toolbar}>
        <Button
          type='primary'
          size='small'
          onClick={() => {
            createform.clearFields()
            setcreatevisible(true)
          }}
        > {t['create']} </Button>
      </div>
      <div className={styles.tools_content}>
        {data.map((item) => (
          <div className={styles.tools_content_item}
          key={item.id}
          onClick={() => {
            testform.resetFields()
            showdrawer(item)}}
          >
            <div className={styles.tools_content_item_top}>
              <div
                className={styles.tools_content_item_top_icon}
              >
                      <IconBranch 
                  type='text'
                  />
              </div>
              
            </div>
            <div className={styles.tools_content_item_mid}>
              {item.title.slice(0, 6)}
            </div>
            <div className={styles.tools_content_item_bottom}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>


      <Drawer
        width={380}
        title={<span> {drawerstatus.info.title} </span>}
        visible={drawerstatus.visible}
        footer={
          <div className={styles.tools_drawer_footer}>
            <div>
              <Button
                onClick={()=>{
                    test() 
                  }
                }
                type='secondary'
              >
                测试
              </Button>
            </div>

            <div>
              <Button
                onClick={()=>{
                  deltool(drawerstatus.info)
                }}
                type='secondary'
                status='danger'
              >
                删除
              </Button>

              <Button
                onClick={()=>{
                  updatetool(drawerstatus.info)
                }}
                type='primary'
                status='default'
              >
                保存
              </Button>
            </div>
          </div>
        }
        onCancel={() => {
          setdrawerstatus(pre=>({...pre, visible:false}))
        }}
      >
        <div className={styles.tools_drawer_desc}>
          描述：{drawerstatus.info.desc}
          <React.Fragment>
            <br />
            <br />
            工具方法必须用tool装饰器装饰，参数默认为用户输入的str，并且必须返回一个str对象
          </React.Fragment>
        </div>

        <Form
          layout='vertical'
          form={testform}
        >
          <Form.Item label='testquery' field='testquery'>
            <Input
              placeholder='eg. 最近有什么新闻？'
              autoComplete='off'
              autoFocus={false}
            />
          </Form.Item>
        </Form>

        <div className={styles.tools_drawer_editor}>
          <AceEditor
            ref={editorref}
            defaultValue={drawerstatus.info.toolcode}
            theme="monakai" // 设置主题
            mode="python" // 设置语言为 Python
            name="python_editor"
            editorProps={{ $blockScrolling: true, $disableFocus: true }}
            width="100%"
            height="400px" // 设置高度
            onFocus={() => {
              const editor = editorref.current?.editor;
              if (editor) {
                editor.moveCursorTo(0, 0);
              }
            }}
          />
        </div>

        <div className={styles.tools_testres}>
          <span>
            测试结果返回数据:
          </span>
          <br />{testres}
        </div>
        
      </Drawer>



      <Modal
        title={t['create']}
        visible={createvisible}
        onOk={()=>{
          createform.validate().then(() => {
            null
          }).then(() => {
            createtool()
            setcreatevisible(false)
          }).catch(e => {
            Message.error(`${e}`);
          });
        }}
        onCancel={()=>{
          setcreatevisible(false)
        }}
        autoFocus={false}
        focusLock={true}
      >
        <Form
          form={createform}
          autoComplete='off'
          scrollToFirstError
        >

          <FormItem label='Title' field='title' rules={[{ required: true }]}>
            <Input placeholder='please enter...' />
          </FormItem>

          <FormItem label='Desc' field='desc'>
            <Input placeholder='please enter...' />
          </FormItem>

          <FormItem label='Funcname' field='funcname' rules={[{ required: true }]}>
            <Input placeholder='please enter...' />
          </FormItem>
        </Form>
      </Modal>
    </div>
  )

})

export default Tools;
