import {
  Message
} from '@arco-design/web-react';
// 每次发送API请求时带上Token作为身份验证凭证，确实可以每次在发送请求前从localStorage中获取Token
import axios from 'axios';
import { getCookie, clearCookie } from './useCookies'; // 导入函数


// 创建一个axios实例 除了登陆用axios 其他之外的都用这个apiClient，可以校验cookie是否存在
const apiClient = axios.create();

// 添加请求拦截器
apiClient.interceptors.request.use((config) => {
  // 导入 useAuth 获取当前用户是否有 token
  const token = getCookie("token");

  // 在请求发出前，获取 token 并附加到 headers 中
  if (token) {
    config.headers['Content-Type'] = 'application/json';
    config.headers['Authorization'] = `Bearer ${token}`;
  } else {
    // 如果 token 不存在，则移除 Authorization 头
    delete config.headers['Authorization'];
    // 退出到 /login
    window.location.href = '/login';
  }

  return config;
});

// 添加响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    // 例如，你可以在这里检查响应的状态码
    if (response.status === 200) {
      // 如果状态码为 200，你可以直接返回数据
      return response;
    } else {
      // 如果状态码不是 200，你可以处理错误
      return Promise.reject(response);
    }
  },
  (error) => {
    // 对响应错误做点什么
    // 例如，你可以在这里检查错误的状态码
    if (error.response) {
      // 如果请求已发出并且服务器响应了状态码
      switch (error.response.status) {
        case 400:
          // 如果是 400 , Missing username or password
          Message.error('Error:'+ error.response);
          break;
        case 401:
          // 如果是 401 未授权，你可以处理重新登录或其他操作
          // 清除 token
          clearCookie("token");
          // localStorage的userStatus登陆状态改为logout
          localStorage.setItem('userStatus', 'logout');
          localStorage.removeItem('userInfo');
          // 退出到 /login
          window.location.href = '/login';
          break;
        case 403:
          // 如果是 403 禁止访问，你可以显示错误信息
          Message.error('您没有权限访问此资源！');
          break;
        default:
          // 其他错误状态码
          Message.error('Error:'+ error.response);
      }
    } else if (error.request) {
      // 如果请求已发出但没有收到响应
      console.error('No response received:', error.request);
    } else {
      // 发送请求时出现了一些错误
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

// 导出 apiClient 实例，以便在其他地方使用
export default apiClient;