import React, { useEffect, useState, useRef, useMemo, } from 'react';
import { Radio, Select, Button, Form, Input, Tag, Drawer, Message } from '@arco-design/web-react';
import { useLocation, useHistory } from 'react-router-dom';
import useLocale from '@/utils/useLocale';
import styles from './style/index.module.less';
import {
  IconApps,
  IconBold,
  IconBranch,
  IconGitlab,
  IconLock,
  IconMore,
  IconUnlock,
  IconUser,
} from '@arco-design/web-react/icon';
import apiClient from '@/utils/apiService';
import VChart from '@visactor/vchart';


const Dash = (() => {
  const t = useLocale();
  // 定义form
  const FormItem = Form.Item;
  const [form] = Form.useForm();
  const Option = Select.Option;
  const Textarea = Input.TextArea;

  const location = useLocation();
  const { state } = location;

  const history = useHistory();


  // 在文件顶部添加这个接口定义
  interface IndicatorData {
    total: number;
    isonnum: number;
    isoffnum: number;
    usernum: number;
    createnum: Array<{ name: string; value: number; type: string }>;
    dailyres: Array<{ user: string; value: number; type: string }>;
    // 添加其他可能的属性
  }

// 修改 useState 的类型声明
const [indicatordata, setindicatordata] = useState<IndicatorData | null>(null);
  // 获取接口数据方法
  const indicator_data = () => {
    apiClient.get('/api/dash_indicator').then((res) => {
      const { msg, status, data } = res.data;
      if (status === 'success') {
        setindicatordata(data)
      }
      else {
        Message.info(msg)
      }
    }).catch((err) => {
      Message.error(err+'')
    })
  }

  useEffect(() => {
    indicator_data()
  }, [])
  
  const [baroption, setBarOption] = useState(null);
  const [lineoption, setLineOption] = useState(null);

  useEffect(() => {
    if (indicatordata) {
      setBarOption({
        title: {
          text: '用户创建数'
        },
        type: 'bar',
        data: [
          {
            id: 'data',
            values: indicatordata?.createnum
          }
        ],
        xField: ['x', 'type'],
        yField: 'y',
        seriesField: 'type',
        bar: {
          style: {
            cornerRadius: 10,
            fill: {
              gradient: 'linear',
              x0: 0.5,
              y0: 0,
              x1: 0.5,
              y1: 1,
              stops: [
                {
                  offset: 0,
                  color: '#86DF6C'
                },
                {
                  offset: 1,
                  color: '#468DFF'
                }
              ]
            }
          },
          state: {
            selected: {
              stroke: '#000',
              lineWidth: 1
            }
          }
        },
        axes: [
          {
            orient: 'bottom',
            domainLine: {
              visible: false
            },
            bandPadding: 0,
            paddingInner: 0.1
          },
          {
            orient: 'left',
            grid: {
              visible: false
            },
            tick: {
              visible: true,
              tickCount: 3
            },
            domainLine: {
              visible: false
            }
          }
        ]
      });

      // 这里假设您有每日新增数据，如果没有，需要调整数据结构
      setLineOption({
        type: 'line',
        data: {
          values: indicatordata?.dailyres
        },
        title: {
          text: '每日新增'
        },
        // stack: true,
        xField: 'type',
        yField: 'value',
        seriesField: 'user',
      });
    }
  }, [indicatordata]);
  
  useEffect(() => {
    if (baroption && lineoption) {
      const vchartbar = new VChart(baroption, { dom: 'bar' });
      const vchartline = new VChart(lineoption, { dom: 'line' });
      vchartbar.renderSync();
      vchartline.renderSync();

      // 清理函数
      return () => {
        vchartbar.release();
        vchartline.release();
      };
    }
  }, [baroption, lineoption]);

  return (
    <div className={styles.container}>
      <div className={styles.indicator}>
        <div className={styles.indicator_item}>
          <div className={styles.indicator_icon}>
            <IconApps />
          </div>
          <div className={styles.indicator_con}>
            <div className={styles.indicator_title}>总量</div>
            <div className={styles.indicator_num}>{indicatordata?.total}</div>
          </div>
        </div>

        <div className={styles.indicator_item}>
          <div className={styles.indicator_icon}>
            <IconUnlock />
          </div>
          <div className={styles.indicator_con}>
            <div className={styles.indicator_title}>启用中</div>
            <div className={styles.indicator_num}>{indicatordata?.isonnum}</div>
          </div>
        </div>

        <div className={styles.indicator_item}>
          <div className={styles.indicator_icon}>
            <IconLock />
          </div>
          <div className={styles.indicator_con}>
            <div className={styles.indicator_title}>禁用中</div>
            <div className={styles.indicator_num}>{indicatordata?.isoffnum}</div>
          </div>
        </div>

        <div className={styles.indicator_item}>
          <div className={styles.indicator_icon}>
            <IconUser />
          </div>
          <div className={styles.indicator_con}>
            <div className={styles.indicator_title}>用户</div>
            <div className={styles.indicator_num}>{indicatordata?.usernum}</div>
          </div>
        </div>
        
      </div>
      <div className={styles.charts}>
        <div id="bar"></div>
        <div id="line"></div>
      </div>

      
    </div>
  )

})

export default Dash;
