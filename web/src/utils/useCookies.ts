// 每次发送API请求时带上Token作为身份验证凭证，确实可以每次在发送请求前从localStorage中获取Token

import Cookies from 'universal-cookie';

const cookies = new Cookies();

export function getCookie(
  key: string
  ){
  // 获取名为'token'的Cookie值
  const getToken = cookies.get(key);

  return getToken
}

// 清除cookie
export function clearCookie(key: string) {
  cookies.remove(key);
}


// 添加默认导出
export default { getCookie, clearCookie };