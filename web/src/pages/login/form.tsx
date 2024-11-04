import {
  Form,
  Input,
  Checkbox,
  Link,
  Button,
  Space,
} from '@arco-design/web-react';
import { FormInstance } from '@arco-design/web-react/es/Form';
import { IconLock, IconUser } from '@arco-design/web-react/icon';
import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import useStorage from '@/utils/useStorage';
import axios from 'axios';
import apiClient from '@/utils/apiService';
import {getCookie, } from '@/utils/useCookies';
import useLocale from '@/utils/useLocale';
import locale from './locale';
import styles from './style/index.module.less';
import Cookies from 'universal-cookie';

function LoginForm() {
  const formRef = useRef<FormInstance>();
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 获取 Storage里的loginParams 账号密码
  const [loginParams, setLoginParams, removeLoginParams] =
    useStorage('loginParams');


  // 多语言
  const t = useLocale(locale);

  //记住密码的状态
  const [rememberPassword, setRememberPassword] = useState(!!loginParams);

  // 创建一个新的Cookies实例 方法
  const cookies = new Cookies();
  function setCookie(key, value) {
    // 设置一个cookie，有效期为7天（以天数表示）
    cookies.set(key, value, { path: '/', maxAge: 60 * 60 * 24 * 7 }); // 60 * 60 * 24 * 7
  }

  // 判断有token时，即使进入/login 也要回到 /
  const history = useHistory();  
  const token = getCookie('token');  
  useEffect(() => {  
    if (token) {
      // 如果已经存在token，则重定向到主页  
      history.push('/');  
    }  
  }, [history]);

  // 在登陆成功后触发的方法
  function afterLoginSuccess(params) {
    // 是否记住密码 是否存loginParams 到localStorage里 {username: 'admin', password: 'admin'}
    if (rememberPassword) {
      setLoginParams(JSON.stringify(params))
    }
    else {
      removeLoginParams();
    }
    // 记录登录状态到localStorage
    localStorage.setItem('userStatus', 'login');
    // 跳转首页
    window.location.href = '/';
  }


  // 登陆的方法
  function login(params) {
    setErrorMessage('');
    setLoading(true);

    axios.post('/api/login', params, {  
      headers: {  
        'Content-Type': 'application/json' // 根据你的API要求设置内容类型  
      }  
    }) 
      .then((res) => {
        const { msg, token } = res.data;
        console.log('===============>res', res);
        if (res.status === 200) {
          // 如果返回的状态为 success 则登陆成功 执行 afterLoginSuccess 记住密码 和跳转路由到 /
          afterLoginSuccess(params);
          // 设置cookie
          setCookie('token', token);
          // 记录userRole 用户角色 到localStorage
          localStorage.setItem('userInfo', JSON.stringify(params) );

          afterLoginSuccess(params); // 登录成功后执行

        } else {
          setErrorMessage(msg || t['login.form.login.errMsg']);
        }
      })
      .catch((error) => { 
        // 请求失败，处理错误
        console.error('请求失败:', error)
        const { msg } = error.response.data;
        setErrorMessage(msg || t['login.form.login.errMsg']); 
      })
      .finally(() => {
        setLoading(false);
      });
  }


  // 提交表单 点击登陆按钮, 将{username: 'admin', password: 'admin'} 传给login方法
  function onSubmitClick() {
    formRef.current.validate().then((values) => {
      login(values);
    });
  }

  // 记住密码后，读取 localStorage里的账号密码，赋值给登陆form初始值
  useEffect(() => {
    const rememberPassword = !!loginParams;
    setRememberPassword(rememberPassword);
    if (formRef.current && rememberPassword) {
      const parseParams = JSON.parse(loginParams);
      formRef.current.setFieldsValue(parseParams);
    }
  }, [loginParams]);

  
  return (
    <div className={styles['login-form-wrapper']}>
            <div className={styles['login-form-title']}>{t['login.form.title']}</div>
            <div className={styles['login-form-sub-title']}>
              {t['login.form.sub.title']}
            </div>
            <div className={styles['login-form-error-msg']}>{errorMessage}</div>
            <Form
              className={styles['login-form']}
              layout="vertical"
              ref={formRef}
              initialValues={{'username': '', password: ''}}
            >
              <Form.Item
                field="username"
                rules={[{ required: true, message: t['login.form.userName.errMsg'] }]}
              >
                <Input
                  prefix={<IconUser />}
                  placeholder={t['login.form.userName.placeholder']}
                  autoComplete="new-username" // 禁止浏览器自动填充用户名
                />
              </Form.Item>
              <Form.Item
                field="password"
                rules={[{ required: true, message: t['login.form.password.errMsg'] }]}
              >
                <Input.Password
                  prefix={<IconLock />}
                  placeholder={t['login.form.password.placeholder']}
                  autoComplete='new-password' // 禁止浏览器自动填充密码
                />
              </Form.Item>
              <Space size={16} direction="vertical">
                <div className={styles['login-form-password-actions']}>
                  <Checkbox checked={rememberPassword} onChange={setRememberPassword}>
                    {t['login.form.rememberPassword']}
                  </Checkbox>
                  {/* <Link>{t['login.form.forgetPassword']}</Link> */}
                </div>
                <Button type="primary"
                  long
                  onClick={onSubmitClick}
                  loading={loading}>
                  {t['login.form.login']}
                </Button>
              </Space>
            </Form>
    </div>
  );
}



export default LoginForm;