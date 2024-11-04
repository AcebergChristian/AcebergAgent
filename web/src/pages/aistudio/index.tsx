import React, { useContext, useEffect, useState, useRef } from 'react';
import { Button, Form, Input, Select, Message, Drawer, Spin, Tooltip, Slider, Tag, Empty, Modal } from '@arco-design/web-react';
import {
  IconMenu,
  IconLanguage,
  IconMoonFill,
  IconSunFill,
  IconSearch,
  IconReply,
  IconSend,
  IconLoading,
  IconLink,
  IconRefresh,
  IconEraser,
  IconList,
  IconCopy,
  IconSettings,
  IconSelectAll,
  IconFire
} from '@arco-design/web-react/icon';
import styles from './style/index.module.less';
import useLocale from '@/utils/useLocale';
import { FormInstance } from '@arco-design/web-react/es/Form';
import apiClient from '@/utils/apiService';
import { GlobalContext } from '@/context';
import defaultLocale from '@/locale';
import { useLocation, useHistory } from 'react-router-dom';


function Aistudio() {
  const TextArea = Input.TextArea;
  // 国际化
  const t = useLocale();
  // redux
  const { lang, setLang, theme, setTheme } = useContext(GlobalContext);

  const location = useLocation();
  const { state } = location;

  const [usrinput, setUsrinput] = useState(state.e)

  const history = useHistory();

  const [loading, setLoading] = useState('pre');
  const [aistudio, setAistudio] = useState({ summary: '', details: [] });

  const [aistudioform] = Form.useForm();
  const [aistudiovisible, setaistudiovisible] = useState(false)

  const [args, setargs] = useState({
    model: 'THUDM/glm-4-9b-chat',
    temperature:0.7,
    top_p:0.95,
    maxtoken:888
  })
  
  const aistudioapi = () => {
    setLoading('loading')

    console.log(args)
    apiClient.post('/api/aistudio', { usrinput: usrinput, args: args})
      .then((response) => {
        try {
          const res = JSON.parse(response.data.data)
          setAistudio(res)
          setLoading('end')
        }
        catch (error) {
          setLoading('pre')
          console.log(error)
        }
      })
      .catch((error) => {
        // 处理错误
        setAistudio(error)
        console.log(error)
        setLoading('pre')
      });

  }

  useEffect(() => {
      aistudioapi()
  }, [])

  // 获取域名方法
  function extractDomain(url) {
    const pattern = /[\w.-]+\.[a-z]{2,6}(?=\/*)/;
    const match = url.match(pattern);

    return match ? match[0] : 'No match found.';
  }

  const copy = () => {
    // navigator.clipboard.writeText(aistudio.summary);
    // Message.success('复制成功');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(aistudio.summary).then(() => {
        Message.success('复制成功');
        // 这里可以添加一个成功的提示，例如使用 Message.success
      }, (err) => {
        Message.error('复制失败:' + err);
      });
    } else {
      Message.error('您的浏览器不支持 navigator.clipboard API');
    }
  }


  const Option = Select.Option
  const options = [
    {
      key: '0',
      name: 'THUDM/glm-4-9b-chat'
    },
    {
      key: '1',
      name: 'Qwen/Qwen2-7B-Instruct'
    },
    {
      key: '2',
      name: 'google/gemma-2-9b-it'
    },
    {
      key: '3',
      name: 'mistralai/Mistral-7B-Instruct-v0.2'
    }
  ]

  
  
  const open_settings =()=>{
    setaistudiovisible(true)
  }

  const close_settings =()=>{
    setaistudiovisible(false)
  }

  const save_settings =()=>{
    const v = aistudioform.getFieldsValue()
      setargs((pre) => ({
        ...pre,
        ...v
      }
    ))

    Message.success('Save Success')
    close_settings()
  }

  
  const Settings_Modal = () => {
    const FormItem = Form.Item;
    return (
        <Modal
        title={'Settings Modal'}
        visible={aistudiovisible}
        style={{width: '80%'}}
        footer={
          <>
          <Button
            type='secondary'
            onClick={close_settings}
            >
              Cancel
          </Button>

          <Button
            type='primary'
            onClick={save_settings}
            >
              Save
          </Button>
          </>
        }
      >
        <Form
          className={styles['aistudio-form']}
          layout="vertical"
          form={aistudioform}
          style={{ width: '100%', padding: '0 0', }}
          initialValues={args}
        >
          <FormItem
            label={t['aistudio.model']}
            field="model"
            style={{width: '100%'}}
          >
            <Select
              placeholder='Please select'
              showSearch
              allowClear
            >
              {options.map((option) => (
                <Option key={option.key } value={option.name } >
                  {option.name}
                </Option>
              ))}
            </Select>
          </FormItem>

          <FormItem label={t['aistudio.temperature']} field='temperature'>
            <Slider
              min={0}
              max={1}
              step={0.01}
              showInput
            />
          </FormItem>

          <FormItem label={t['aistudio.maxtoken']} field='maxtoken' >
            <Slider
              min={0}
              max={3200}
              step={1}
              showInput
            />
          </FormItem>

          <FormItem label={t['aistudio.top_p']} field='top_p'>
            <Slider
              min={0}
              max={1}
              step={0.01}
              showInput
            />
          </FormItem>
        </Form>
        </Modal>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.aistudio_top}>
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
        <div className={styles.aistudio_top_input}>
          <Input
            defaultValue={usrinput}
            allowClear
            onChange={(v) => {
              setUsrinput(v)
            }}
          />
          <Button
            icon={<IconSend />}
            onClick={aistudioapi}
          />
        </div>
      </div>
      <div className={styles.aistudio_content}>
        {
          loading == 'loading' ?
            <div className={styles.aistudio_content_loading}>
              <Button
                type="text"
                style={{ width: 30, height: 30, fontSize: 18, }}
                icon={<IconLoading />}
              >
                {'总结中...'}
              </Button>
            </div>
            :
            loading == 'end' ?
              <div className={styles.aistudio_content_res}>
                <div className={styles.aistudio_content_summary}>
                  <h3>回答：</h3>
                  {aistudio.summary}
                  <div className={styles.aistudio_content_summary_btn}>
                    <Button
                      type="text"
                      style={{ width: 24, height: 24, fontSize: 16, }}
                      icon={<IconCopy />}
                      onClick={copy}
                    />
                  </div>
                </div>
                <div className={styles.aistudio_content_details}>
                  <h3>相关结果：</h3>
                  {aistudio.details.map((item, index) => {
                    return (
                      <div key={index} className={styles.aistudio_content_details_item}>
                        <div className={styles.aistudio_content_details_item_inner}>
                          <div className={styles.aistudio_content_details_item_source}>
                            <h4>来源：</h4>
                            <a href={item.link} target="_blank" rel="noopener noreferrer">
                              <IconLink />{extractDomain(item.link)}
                            </a>
                          </div>

                          <div className={styles.aistudio_content_details_item_title}>
                            {item.title}
                          </div>

                          <div className={styles.aistudio_content_details_item_content}>
                            {item.snippet}
                          </div>

                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              :
              <Empty />
        }

      </div>

      <div
        className={styles.aistudio_footer}
        style={theme == 'dark' ? { backgroundColor: '#29292c' } : { backgroundColor: '#ffffffad' }}
      >
        工具栏
        <Button
          type='secondary'
          style={{ width: 30, height: 30, fontSize: 12, }}
          icon={<IconRefresh />}
          onClick={() => {
            aistudioapi()
          }}
        />
        <Button
          type='secondary'
          style={{ width: 30, height: 30, fontSize: 12, }}
          icon={<IconEraser />}
          onClick={() => {
            setAistudio({ summary: '', details: [] })
            setLoading('pre')
            Message.info('Clear Success!');
          }}
        />
        <Button
          type='secondary'
          style={{ width: 30, height: 30, fontSize: 12, }}
          icon={<IconSettings />}
          onClick={() => {
            open_settings()
          }}
        />
        <Button
          type='secondary'
          style={{ width: 30, height: 30, fontSize: 12, }}
          icon={<IconList />}
          onClick={() => {
            Message.info('In Development...');
          }}
        />
      </div>

      {/* 设置对话框 */}
      <Settings_Modal />
    </div>
  );
}

export default Aistudio;
