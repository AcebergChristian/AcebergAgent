import React, { useContext, useEffect, useState, useRef } from 'react';
import { Button, Form, Input, Select, Message, Drawer, Spin, Slider, Image, Avatar, Tag } from '@arco-design/web-react';
import {
  IconMenu,
  IconLanguage,
  IconMoonFill,
  IconSunFill,
  IconSearch,
  IconReply,
  IconUser,
  IconLock,
  IconSafe,
  IconEraser,
  IconSend,
  IconCopy,
  IconLoading,
  IconFontColors,
  IconFile
} from '@arco-design/web-react/icon';
import styles from './style/index.module.less';
import useLocale from '@/utils/useLocale';
import { FormInstance } from '@arco-design/web-react/es/Form';
import apiClient from '@/utils/apiService';
import { GlobalContext } from '@/context';
import defaultLocale from '@/locale';
import { useLocation, useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { createStore } from 'redux';
import indexstore from '@/store';
import { GlobalState } from '@/store';
import { v4 as uuidv4 } from 'uuid';
// import { createElement } from 'react'; // 添加此行
// import { jsx as createElement } from 'react/jsx-runtime.js';
// import Markdown from 'react-markdown';


function AgentStudio() {

  const t = useLocale();
  // 定义form
  const FormItem = Form.Item;
  const Textarea = Input.TextArea;

  const location = useLocation();
  const { state } = location;

  const history = useHistory();

  // chat对话组件 
  const fakedata = [
    { key: '1', role: 'bot', content: '你好，请问有什么可以帮助你的?' }
  ]
  const [chatdata, setchatdata] = useState(fakedata)

  const [usrinputvalue, setusrinputvalue] = useState('')
  const [answer, setanswer] = useState('')
  const usrinputRef = useRef(null)
  const [loading, setloading] = useState(false)

  // 清空方法
  const onClear = () => {
    setusrinputvalue('')
    setchatdata(fakedata)

    // removehistory()
  }

  // 发送方法
  const onSend = () => {
    if (usrinputvalue != '') {

      const usrkey = uuidv4();
      const botkey = uuidv4();
      setchatdata([...chatdata,
      {
        key: usrkey,
        role: 'usr',
        content: usrinputvalue
      },
      {
        key: botkey,
        role: 'bot',
        content: ''
      }
      ])

      // 调接口方法
      agentstudio_agentfunc()

      setusrinputvalue('')
    }
    else {
      Message.error(t['needcontent'])
    }
  }

  // chatdata数据更新后，滚动条滚动到最后
  const agent_content = useRef(null)
  useEffect(() => {
    const chatelescroll = agent_content.current;
    if (chatelescroll) {
      chatelescroll.scrollTop = chatelescroll.scrollHeight;
    }
  }, [chatdata])


  function botanswertochat(content) {
    setchatdata(pre => {
      pre[pre.length - 1].content = content
      return [...pre]
    })
  }

  // useEffect(() => {
  //   if (answer != '') {
  //     botanswertochat()
  //   }
  // }, [answer])

  // 判断agent类型和bot answer状态的方法
  function judgeAgentType(content) {
    if (content === "") {
      return <IconLoading />;
    }
    else {
      // For any other case, just return the content
      return content //(<Markdown children={content} />)
    }
  }


  // 清除history接口
  const removehistory = () => {
    apiClient.post('/api/aiagent_removehistory', {}).then((response) => {
      console.log(response)
    })
  }

  // 复制方法
  const copycontent = (arg) => {
    if (typeof (arg) == 'object') {
      navigator.clipboard.writeText(JSON.stringify(arg.images[0].url))
    }
    else {
      navigator.clipboard.writeText(arg)
    }
    Message.success(t['copysuccess'])
  }

  // 欢迎语
  const [welcome, setwelcome] = useState("")
  const welcomefunc=(v)=>{
    setwelcome(v)
  }


  const [settingform] = Form.useForm()
  const Option = Select.Option
  const modeloptions = [
    {
      key: '0',
      name: 'gpt-3.5-turbo',
      price: '1.5'
    },
    {
      key: '1',
      name: 'gpt-4o-mini-2024-07-18',
      price: '0.6'
    },
    {
      key: '2',
      name: 'gpt-4o-mini',
      price: '0.6'
    },
    {
      key: '3',
      name: 'gemini-pro',
      price: '0.6'
    },
    {
      key: '4',
      name: 'gemma2-9b-it',
      price: '0.4'
    },
    {
      key: '5',
      name: 'llama-3.1-70b-versatile',
      price: '0.8'
    }
  ]


  // known的接口
  const [knownoptions, setknownoptions] = useState([])
  const knownoptionsfunc = () => {
    apiClient.get('/api/agentstudio_knownoptions').then((res) => {
      const {msg, status, data} = res.data
      if (status == 'success') {
        setknownoptions(data)
      }
    })
  }


  // tools的接口
  const [toolsoptions, settoolsoptions] = useState([])
  const toolsoptionsfunc = () => {
    apiClient.get('/api/agentstudio_toolsoptions', {}).then((res) => {
      const {msg, status, data} = res.data
      if (status == 'success') {
        settoolsoptions(data)
      }
    })
  }


  useEffect(() => {
    // 挂载时，设置欢迎语，调known和tools的接口
    welcomefunc(settingform.getFieldValue('welcome'))
    knownoptionsfunc()
    toolsoptionsfunc()
  }, [])


  // 统计关联tool的数量
  const [maxtools, setmaxtools] = useState(0)

  // 问答chat的接口
  const agentstudio_agentfunc =()=>{
    const formdata = settingform.getFieldsValue()
    const selectedknown = knownoptions.find(option => option.name === formdata.known);
    const known = selectedknown ? {key:selectedknown.key, type:selectedknown.type} : null;

    const selectedtools = formdata.tools?.map(toolName => {
      const option = toolsoptions.find(option => option.name === toolName);
      return option ? {key:option.key, filename:option.filename} : null;
    })
    const tools = selectedtools?selectedtools:null;
    
    apiClient.post('/api/agentstudio_agent',
      {llmargs:formdata,query:usrinputvalue,known_data:known,tools_list:tools}
    ).then((res) => {
        const {msg, status, data} = res.data
      if (status == 'success') {
        setloading(false)
        botanswertochat(data)
      } else {
        setloading(false)
        botanswertochat(msg)
      }

      })
      .catch((e) => {
        // 处理错误
        Message.error(e)
        botanswertochat(e)
      }).finally(()=>{
        null
      });
  }



  return (
    <div className={styles.container}>
      <div className={styles.agent_top}>
        <Button
          type='secondary'
          style={{ width: 30, height: 30, fontSize: 12}}
          icon={<IconReply />}
          onClick={() => {
            history.push({
              pathname: '/agent',
            })
          }}
        />
        <div className={styles.agent_top_title}>
          {state?.e.title}
        </div>
      </div>

      <div className={styles.agent_mid}>


        <div className={styles.agent_content}>
          <div className={styles.agent_content_chat_welcome}>
            <svg width="30" height="26"><g fill="none"><path d="M3.878 11.98l7.372-7.55a5.096 5.096 0 017.292 0l.08.083a5.226 5.226 0 010 7.302l-7.372 7.55a5.096 5.096 0 01-7.292 0l-.08-.083a5.226 5.226 0 010-7.302z" fill="#12D2AC"></path><path d="M18.548 4.43l7.292 7.467a5.344 5.344 0 010 7.467 5.096 5.096 0 01-7.292 0l-7.292-7.467a5.344 5.344 0 010-7.467 5.096 5.096 0 017.292 0z" fill="#307AF2"></path><path d="M18.632 4.522l3.553 3.638-7.292 7.467L7.601 8.16l3.553-3.638a5.226 5.226 0 017.478 0z" fill="#0057FE"></path></g></svg>
              {welcome}
          </div>

          <div ref={agent_content} className={styles.agent_content_chat_content}>
            {chatdata.map((item, index) => {
              if (item.role == 'bot') {
                return (
                  <div key={item.key} className={styles.everychat_bot}>
                    <div className={styles.everychat_avator}>
                      <Avatar size={28} style={{ backgroundColor: '#29d1ad' }}>
                        {item.role}
                      </Avatar>
                    </div>
                    <div className={`${styles.everychat_content} ${styles.everychat_content_bot}`}>
                      {judgeAgentType(item.content)}
                    </div>
                    <Button
                      icon={<IconCopy />}
                      onClick={() => copycontent(item.content)}
                    />
                  </div>
                )
              }
              else if (item.role == 'usr') {
                return (
                  <div key={item.key} className={styles.everychat_usr}>

                    <Button
                      icon={<IconCopy />}
                      onClick={() => copycontent(item.content)}
                    />
                    <div className={`${styles.everychat_content} ${styles.everychat_content_usr}`}>{item.content}</div>
                    <div className={styles.everychat_avator}>
                      <Avatar size={28} style={{ backgroundColor: '#367eef' }}>
                        {item.role}
                      </Avatar>
                    </div>


                  </div>
                )
              }

            }

            )
            }
          </div>


          <div className={styles.agent_input}>
            <Button
              type='primary'
              style={{ width: 30, height: 30, fontSize: 12 }}
              icon={<IconEraser />}
              onClick={onClear}
            />
            <Textarea
              ref={usrinputRef}
              value={usrinputvalue}
              onChange={(value) => {
                // 当输入框内容发生变化时，更新状态
                setusrinputvalue(value)
              }}
              style={{ backgroundColor: '#FFFFFF', borderRadius: '4px', color: '#333' }}
              autoSize={{ minRows: 1, maxRows: 2 }}
              maxLength={360}
              showWordLimit
              placeholder='请输入'
              allowClear
            />
            <Button
              type='primary'
              style={{ width: 30, height: 30, fontSize: 12 }}
              icon={<IconSend />}
              onClick={onSend}
              // loading={loading}
              disabled={loading}
            />
          </div>

        </div>


        {/* 右侧设置 */}
        <div className={styles.agent_setting}>
          <Form
            form={settingform}
            autoComplete='off'
            scrollToFirstError
            layout={'vertical'}
            initialValues={{
              welcome:'你好',
              prompt:'',
              model: 'gpt-3.5-turbo',
              temperature:0.7,
              top_p:0.95,
              maxtoken:888
            }}
          >

            <FormItem label='welcome' field='welcome' >
              <Input
                maxLength={50}
                onChange={(v)=>welcomefunc(v)}
              />
            </FormItem>

            <FormItem label='prompt' field='prompt' >
              <Textarea
                autoSize={{
                  minRows:2,
                  maxRows:5
                }}
                rows={5}
                maxLength={360}
              />
            </FormItem>
            
            <FormItem
              label='model'
              field="model"
              style={{width: '100%'}}
            >
              <Select
                placeholder='Please select'
                showSearch
                allowClear
                renderFormat={(option, value) => {
                  return  (
                    <span style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      {option.value}
                      <Tag
                        color={'green'}
                      >
                        {modeloptions.find(item => item.name === option.value)?.price}
                      </Tag>
                    </span>
                  )
                }}
              >
                {modeloptions.map((option) => (
                  <Option key={option.key } value={option.name }>
                    {option.name}
                  </Option>
                ))}
              </Select>
            </FormItem>

            <FormItem label='temperature' field='temperature'>
              <Slider
                min={0}
                max={1}
                step={0.01}
                showInput
              />
            </FormItem>

            <FormItem label='maxtoken' field='maxtoken' >
              <Slider
                min={0}
                max={3200}
                step={1}
                showInput
              />
            </FormItem>

            <FormItem label='top_p' field='top_p'>
              <Slider
                min={0}
                max={1}
                step={0.01}
                showInput
              />
            </FormItem>

            <FormItem label='known' field='known'>
              <Select
                  placeholder='Please select'
                  showSearch
                  allowClear
                >
                  {knownoptions.map((option) => (
                    <Option key={option.key } value={option.name } >
                      {option.name}
                    </Option>
                  ))}
                </Select>
            </FormItem>

            <FormItem label='tools' field='tools'>
              <Select
                  placeholder='Please select'
                  showSearch
                  allowClear
                  mode='multiple'
                  maxTagCount={3}
                  onSelect={(value) => {
                    if (maxtools < 3) {
                      setmaxtools(pre => pre + 1)
                    } else {
                      setmaxtools(pre => pre + 1)
                      Message.error('最多3个工具生效')
                    }
                  }}
                  onDeselect={(value) => {
                    setmaxtools(pre => pre - 1) // 取消选择时减少计数
                  }}
                >
                  {toolsoptions.map((option) => (
                    <Option key={option.key } value={option.name } >
                      {option.name}
                    </Option>
                  ))}
                </Select>
            </FormItem>

          </Form>
        </div>

      </div>


      <div className={styles.agent_footer}>
        内容由 AI 生成, 不能保证真实
      </div>
    </div>
  )

}


export default AgentStudio;
