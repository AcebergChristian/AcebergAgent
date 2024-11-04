import React, { useEffect, useState, useRef, useMemo, } from 'react';
import { Radio, Popover, Select, Button, Form, Input, Avatar, Message, Image } from '@arco-design/web-react';
import { useLocation, useHistory } from 'react-router-dom';
import useLocale from '@/utils/useLocale';
import styles from './style/index.module.less';
import {
  IconBackward,
  IconCopy,
  IconEraser,
  IconLoading,
  IconMore,
  IconRefresh,
  IconReply,
  IconSend,
  IconSync,
} from '@arco-design/web-react/icon';
import apiClient from '@/utils/apiService';
import { v4 as uuidv4 } from 'uuid';

const Chat = (() => {
  const t = useLocale();
  // 定义form
  const FormItem = Form.Item;
  const [form] = Form.useForm();
  const Option = Select.Option;
  const Textarea = Input.TextArea;

  const location = useLocation();
  const { state } = location;

  const history = useHistory();

  // chat对话组件 
  const fakedata = [
    { key: '1', role: 'bot', content: '你好，这里是' + state?.e.title },
    { key: '2', role: 'bot', content: '请问有什么需要帮助你的？' },
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

    removehistory()
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
      aiagentapi()

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

  // 接口方法
  const aiagentapi = () => {

    apiClient.post('/api/aiagent', { usrinput: usrinputvalue, agenttype: state.e.key })
      .then((response) => {
        const res = response.data.data
        setanswer(res)
        setloading(false)

      })
      .catch((error) => {
        // 处理错误
        console.log(error)
        setanswer("")
        setloading(false)
      });

  }

  function botanswertochat() {
    setchatdata(pre => {
      pre[pre.length - 1].content = answer
      return [...pre]
    })
  }

  useEffect(() => {
    if (answer != '') {
      botanswertochat()
    }
  }, [answer])

  // 判断agent类型和bot answer状态的方法
  function judgeAgentType(content) {
    if (content === "") {
      return <IconLoading />;
    }
    else if (typeof content === "object" && content.images && content.images.length > 0) {
      const image = content.images.map((item, index) => {
        return <Image key={index} width="100%" src={item.url} />;
      })
      return image
    }
    else if (content === "error"){ 
      return "error";
    }
    else {
      // For any other case, just return the content
      return content;
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
    if (typeof(arg) == 'object') {
      navigator.clipboard.writeText(JSON.stringify(arg.images[0].url))
    }
    else {
      navigator.clipboard.writeText(arg)
    }
    Message.success(t['copysuccess'])
  }


  return (
    <div className={styles.container}>
      <div className={styles.agent_top}>
        <Button
          type='secondary'
          style={{ width: 30, height: 30, fontSize: 12, }}
          icon={<IconReply />}
          onClick={() => {
            history.push({
              pathname: '/aisearch',
            })
          }}
        />
        <div className={styles.agent_top_title}>
          {state?.e.title}
        </div>
      </div>
      <div ref={agent_content} className={styles.agent_content}>
        <div className={styles.agent_content_chat_welcome}>
          <svg width="30" height="26"><g fill="none"><path d="M3.878 11.98l7.372-7.55a5.096 5.096 0 017.292 0l.08.083a5.226 5.226 0 010 7.302l-7.372 7.55a5.096 5.096 0 01-7.292 0l-.08-.083a5.226 5.226 0 010-7.302z" fill="#12D2AC"></path><path d="M18.548 4.43l7.292 7.467a5.344 5.344 0 010 7.467 5.096 5.096 0 01-7.292 0l-7.292-7.467a5.344 5.344 0 010-7.467 5.096 5.096 0 017.292 0z" fill="#307AF2"></path><path d="M18.632 4.522l3.553 3.638-7.292 7.467L7.601 8.16l3.553-3.638a5.226 5.226 0 017.478 0z" fill="#0057FE"></path></g></svg>
          {state?.e.desc}
        </div>

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
        />
      </div>
      <div className={styles.agent_footer}>
        内容由 AI 生成, 不能保证真实
      </div>
    </div>
  )

})

export default Chat;
