import React, { useEffect, useState, useRef, useMemo, useCallback, } from 'react';
import { Radio, Select, Button, Form, Input, Tag, Modal, Dropdown, Menu, Divider, Message, Switch } from '@arco-design/web-react';
import { useLocation, useHistory } from 'react-router-dom';
import useLocale from '@/utils/useLocale';
import styles from './style/index.module.less';
import {
  IconCheck,
  IconClose,
  IconDelete,
  IconEdit,
  IconMore,
  IconSend,
  IconUser,
} from '@arco-design/web-react/icon';
import apiClient from '@/utils/apiService';
import { v4 as uuidv4 } from 'uuid';

const Agent =()=> {
  const t = useLocale();
  // 定义form
  const FormItem = Form.Item;
  const [form] = Form.useForm();
  const Option = Select.Option;
  const Textarea = Input.TextArea;

  const location = useLocation();
  const { state } = location;


  const history = useHistory();


  // 查询接口方法
  const [data, setdata] = useState([])
  // 获取数据方法
  const agent_query=(type='')=>{
    apiClient.post('/api/agent_query',
      {type:type}
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
    agent_query()
    return () => {
      setdata([]); // 清理状态以防止内存泄漏
    };
  }, [])
  
  const [gettype, setgettype] = useState('全部');
  const datatype = ['全部', '工具', '效率', '生活', '娱乐', '影音', '艺术', '科学', '其他'];
  const filtertype = (item) => {
    setgettype(item)
    agent_query(item)
  }
  

  const selecttype = ['工具', '效率', '生活', '娱乐', '影音', '艺术', '科学', '其他']

  const dropList = (item:any) => (
    <Menu
      style={{
        width: 80,
        textAlign: 'center',
      }}
    >
      <Menu.Item
        key='0'
        style={{
          fontSize: '12px',
        }}
        onClick={()=>{
          updateagentmodal(item)
        }}
      >
        <IconEdit /> 编辑
      </Menu.Item>
      <Divider style={{ margin: '4px 0' }} />
      <Menu.Item
        key='1'
        style={{
          fontSize: '12px',
        }}
        onClick={()=>{
          delagent(item)
        }}
      >
        <IconDelete /> 删除
      </Menu.Item>
      <Menu.Item
        key='2'
        style={{
          fontSize: '12px',
        }}
        onClick={()=>{
          if(item.ison == '1'){
            Message.info('Go!')
            // 在新页面打开 /agentstudio 没有_blank
            // history.push('/agentstudio', {
            //   id: item.id,
            // }
            // )
            window.open(`/agentstudio?id=${item.id}`, '_blank')
          }
          else{
            //处于禁用状态
            Message.error('In Disable State')
          }
        }
        }
      >
        <IconSend /> 进入
      </Menu.Item>
    </Menu>
  );

  // Create Modal
  const [createform] = Form.useForm();
  const TextArea = Input.TextArea;
  const [visible, setvisible] = useState(false);
  
  // 创建agent方法
  const createagent=()=>{
    const newagent = createform.getFieldsValue()
    
    apiClient.post('/api/agent_create',newagent).then((res) => {
      const { msg, status,data } = res.data;
      if (status === 'success') {
        Message.success(msg);
        agent_query()
      }
      else {
        Message.error(msg);
      }
    }).catch((err) => {
      Message.error('Create Error!')
    })
  }

  const [updateform] = Form.useForm();

  interface UpdateModalArgs {
    title: string;
    type: string;
    ison: string;
  }
  const [updatemodalstatus, setupdatemodalstatus] = useState<{visible: boolean; args: UpdateModalArgs | null}>({visible: false, args: null});

  // Update Modal
  const updateagentmodal = useCallback( (item:any) => {
    setupdatemodalstatus({visible: true, args: item});
    
    // 在这里更新表单的值
    updateform.setFieldsValue({
      id: item.id,
      title: item.title,
      type: item.type,
      ison: item.ison === '1'
    });

}, [updateform]);

  // 更新agent方法
  const updateagent=()=>{
    const agentdata = updateform.getFieldsValue()
    apiClient.post('/api/agent_update', agentdata).then((res) => {
      const { msg, status, data } = res.data;
      if (status === 'success') {
        Message.success(msg);
        agent_query();
      } else {
        Message.error(msg);
      }
    }).catch((err) => {
      Message.error(err+'');
    });
  }

  // 删除agent方法
  const delagent=(item)=>{
    Modal.warning({
      title: '删除Agent',
      content: (
        <div>
          <p>您确定要删除名为 {item.title} 的 Agent 吗？</p>
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
            apiClient.post('/api/agent_del', {id: item.id}).then((res) => {
              const { msg, status, data } = res.data;
              if (status === 'success') {
                Message.success(msg);
                agent_query();
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


  return (
    <div className={styles.container}>

      <div className={styles.agent_toolbar}>
        <Button type='primary'
          size='small'
          onClick={()=>{
            createform.resetFields()  
            setvisible(true)
          }}
        >
          {t['create']}
        </Button>
        <div className={styles.agent_toolbar_tag}>
          {datatype.map((item, index) => (
            <Button 
              type= {gettype==item ? 'primary' : 'secondary'}
              size='mini'
              key={index}
              onClick={()=>filtertype(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      <div className={styles.agent_content}>
        {data.map((item) => (
          <div className={styles.agent_content_item} key={item.id}>
            <div className={styles.agent_content_item_top}>
              <Tag>
                <span style={{fontSize:16,fontWeight:600,margin:0,color: item.ison=='1'?'#00ff00':'#ff0000'}}
                >•</span> {item.type}

              </Tag>
              <Dropdown
                droplist={dropList(item)}
                position='bl'
              >
                <Button
                  type='text'
                  style={{
                    width: 32,
                    height: 24,
                    color: 'var(--color-neutral-6)',
                  }}
                  icon={<IconMore />} />
              </Dropdown>
              
            </div>
            <div className={styles.agent_content_item_mid}>
              <div
                className={styles.agent_content_item_mid_icon}
                style={{backgroundColor: item.color}}>
                  {item.title?.slice(0, 1)}
              </div>
            </div>
            <div className={styles.agent_content_item_bottom}>
              {item.title}
            </div>
          </div>
        ))}
      </div>

      <Modal
        title={t['create']}
        visible={visible}
        onOk={()=>{
          createform.validate().then(() => {
            null
          }).then(() => {
            createagent()
            setvisible(false)
          }).catch(e => {
            Message.error(`${e}`);
          });
        }}
        onCancel={()=>{
          setvisible(false)
        }}
        autoFocus={false}
        focusLock={true}
      >
        <Form
          form={createform}
          autoComplete='off'
          initialValues={{
            title: '',
            type: '',
          }}
          scrollToFirstError
        >

          <FormItem label='Title' field='title' rules={[{ required: true }]}>
            <Input placeholder='please enter...' />
          </FormItem>

          <FormItem label='Type' field='type' rules={[{ required: true }]}>
            <Select
              allowClear
            >
              {
                selecttype.map((item, index)=>{
                  return (
                  <Option key={index} value={item}>
                    {item}
                  </Option>
                  )
                })
              }
            </Select>
          </FormItem>
        </Form>
      </Modal>


      <Modal
        title={`${t['update']} ${t['agent']}`}
        visible={updatemodalstatus.visible}
        onOk={()=>{
          updateform.validate().then(() => {
            null
          }).then(() => {
            // 更新接口的方法
            updateagent()
            setupdatemodalstatus({...updatemodalstatus, visible: false})
          }).catch(e => {
            Message.error(`${e}`);
          });
        }}
        onCancel={()=>{
          setupdatemodalstatus({...updatemodalstatus, visible: false})
        }}
        autoFocus={false}
        focusLock={true}
      >
        <Form
          form={updateform}
          autoComplete='off'
          scrollToFirstError
        >

          <FormItem label='Id' field='id' disabled>
            <Input/>
          </FormItem>

          <FormItem label='Title' field='title' rules={[{ required: true }]}>
            <Input placeholder='please enter...' />
          </FormItem>

          <FormItem label='Type' field='type' rules={[{ required: true }]}>
            <Select
              allowClear
            >
              {
                selecttype.map((item, index)=>{
                  return (
                  <Option key={index} value={item}>
                    {item}
                  </Option>
                  )
                })
              }
            </Select>
          </FormItem>

          <FormItem label='Ison' field='ison' triggerPropName='checked'>
            <Switch
              type='line'
              checkedIcon={<IconCheck />}
              uncheckedIcon={<IconClose />}
            />
          </FormItem>
        </Form>
      </Modal>
    </div>
  )

}

export default Agent;


