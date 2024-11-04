import React, { useEffect } from 'react';
import LoginForm from './form';
import styles from './style/index.module.less';

function Login() {
  useEffect(() => {
    document.body.setAttribute('arco-theme', 'light');
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.logo}/>

      <LoginForm />
    </div>
  );
}
Login.displayName = 'LoginPage';

export default Login;
