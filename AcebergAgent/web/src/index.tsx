import './style/global.less';
import React, { useEffect, useState,  } from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import zhCN from '@arco-design/web-react/es/locale/zh-CN';
import enUS from '@arco-design/web-react/es/locale/en-US';
import { Switch, Route,Redirect, BrowserRouter as Router } from 'react-router-dom';
import indexstore from './store';
import PageLayout from './layout';
import { GlobalContext } from './context';
import Login from './pages/login';
import AgentStudio from './pages/agentstudio'
import useStorage from './utils/useStorage';
import { ConfigProvider } from '@arco-design/web-react';
import './mock';
import {getCookie} from './utils/useCookies';
import changeTheme from '@/utils/changeTheme';

const store = createStore(indexstore);

function Index() {
  const token = getCookie('token');

  // 设置默认语言为中文
  const [lang, setLang] = useStorage('arco-lang', 'en-US');
  const [theme, setTheme] = useStorage('arco-theme', 'light');

  function getArcoLocale() {
    switch (lang) {
      case 'zh-CN':
        return zhCN;
      case 'en-US':
        return enUS;
      default:
        return zhCN;
    }
  }

  // function fetchUserInfo() {
  //   store.dispatch({
  //     type: 'update-userInfo',
  //     payload: { userInfo: {path:'2356',key:'1835'}, userLoading: false },
  //   });
  // }

  // fetchUserInfo()


  // useEffect(() => {
  //   if (checkLogin()) {
  //     fetchUserInfo();
  //   } else if (window.location.pathname.replace(/\//g, '') !== 'login') {
  //     window.location.pathname = '/login';
  //   }
  // }, []);


  
  const contextValue = {
    lang,
    setLang,
    theme,
    setTheme,
  };

  useEffect(()=>{
    changeTheme(theme)
  },[theme])
  
  
  return (
    <Router history={history}>
      {/* <ConfigProvider> */}
        <Provider store={store}>
          <GlobalContext.Provider value={contextValue}>
            <Switch>
              <Route exact path="/login" component={Login} />
              {/* 确保 /agentstudio 路由直接渲染 AgentStudio 组件 */}
              <Route exact path="/agentstudio" component={AgentStudio} />
              <Route path="/agentstudio:id" component={AgentStudio} />
              <Route path="/" component={PageLayout} />
            </Switch>
          </GlobalContext.Provider>
        </Provider>
      {/* </ConfigProvider> */}
    </Router>
  );
}


ReactDOM.render(<Index />, document.getElementById('root'));

