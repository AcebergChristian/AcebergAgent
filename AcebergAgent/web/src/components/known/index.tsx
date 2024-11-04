import React, { useEffect, useState, useRef, useMemo, } from 'react';
import { Radio, Select, Button, Form, Input, Tag, Table, Modal, Upload, Message, Descriptions } from '@arco-design/web-react';
import { useLocation, useHistory } from 'react-router-dom';
import useLocale from '@/utils/useLocale';
import styles from './style/index.module.less';
import {
  IconDelete,
  IconEdit,
  IconInfo,
  IconMore,
} from '@arco-design/web-react/icon';
import apiClient from '@/utils/apiService';
import { Group } from 'bizcharts/lib/g-components';
import { RadioGroupContext } from '@arco-design/web-react/es/Radio/group';

const Known = (() => {
  const t = useLocale();
  // 定义form
  const FormItem = Form.Item;
  const [form] = Form.useForm();
  const Option = Select.Option;
  const Textarea = Input.TextArea;

  const location = useLocation();
  const { state } = location;

  const history = useHistory();


  const [gettype, setgettype] = useState('text');
  const datatype = ['text', 'file']

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      ellipsis: true,
      width: 80,
    },
    {
      title: 'Desc',
      dataIndex: 'desc',
      ellipsis: true,
      width: 80,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      ellipsis: true,
      width: 80,
    },
    {
      title: 'Leng',
      dataIndex: 'leng',
      ellipsis: true,
      width: 80,
    },
    {
      title: 'Content',
      dataIndex: 'content',
      ellipsis: true,
      width: 80,
    },
    {
      title: 'Createtime',
      dataIndex: 'createtime',
      width: 180,
    },
    {
      title: 'Creator',
      dataIndex: 'creator',
      ellipsis: true,
      width: 80,
    },
    {
      title: 'Operation',
      dataIndex: 'op',
      width: 120,
      render: (_, record) => (
        <div className={styles.known_table_opreation}>
          <Button
            type='secondary'
            size='mini'
            icon={<IconInfo />}
            onClick={() => {
              Modal.info({
                title: record.title,
                style: {
                  height: 'auto',
                  width: '72%',
                },
                content: (
                  <div
                    key={record.key}
                  >
                    <Descriptions
                      border
                      data={Object.keys(record).map(key => ({
                        label: key,
                        value: typeof record[key] === 'string' ? record[key].substring(0, 100) : record[key] // 限制显示长度
                      }))}
                      style={{
                        overflow: 'hidden',
                        overflowY: 'auto',
                      }}
                    />
                  </div>
                )
              });
            }}
          />
          <Button
            type='secondary'
            size='mini'
            icon={<IconDelete />}
            onClick={() => {
              delknown(record)
            }}
          />
        </div>
      ),
    },
  ];

  // 查询接口
  const [data, setdata] = useState({ data: [], total: 0 });
  // 获取数据方法
  const known_query = (type = '', current = 0, pagesize = 10) => {
    setgettype(type != '' ? type : 'text')
    const currentx = current * pagesize
    apiClient.post('/api/known_query',
      { type: type, current: currentx, pagesize: pagesize }
    ).then((res) => {
      const { msg, status, data } = res.data;
      if (status === 'success') {
        setdata(data)

        setPagination((prev) => ({ ...prev, current: 1, total: data.total })); // 更新total
      }
      else {
        Message.error(msg);
      }

    }).catch((err) => {
      Message.error('Query Error!')
    })
  }
  useEffect(() => {
    known_query('', 0, 10)
    return () => {
      setdata({ data: [], total: 0 }); // 清理状态以防止内存泄漏
    };
  }, [])


  // 点击翻页
  const [pagination, setPagination] = useState({
    sizeCanChange: true,
    showTotal: true,
    pageSize: 10,
    current: 1,
    pageSizeChangeResetCurrent: true,
  });

  const [loading, setLoading] = useState(false);
  function onChangeTable(pagination) {
    const { current, pageSize } = pagination;
    known_query(gettype, current - 1, pageSize)
    setLoading(true);
    setTimeout(() => {
      setPagination((pagination) => ({ ...pagination, current, pageSize }));
      setLoading(false);
    }, 600);
  }


  // 创建known
  const [createmodal_visible, setcreatemodal_visible] = useState(false);

  const [createform] = Form.useForm();
  const [createformloading, setcreateformloading] = useState(false);
  // 创建known方法
  const create_known = () => {

    try {
      // 创建FormData实例
      const formData = new FormData();

      const newknown = createform.getFieldsValue()
      newknown.leng = newknown.type == 'text' ? newknown.content.length : newknown.upload.length; // 给 leng 赋值为 content 的长度

      if (newknown.type === 'text') {
        // 将普通表单字段添加到formData
        Object.entries(newknown).forEach(([key, value]) => {
          formData.append(key, value);
        });
        console.log(formData);
      }
      else {
        // 将普通表单字段添加到formData
        Object.entries(newknown).forEach(([key, value]) => {
          if (key == 'upload') {
            formData.append(key, JSON.stringify(value));
          }
          else {
            formData.append(key, value);
          }
        });
        // 添加上传的文件到formData
        if (newknown.upload.length > 0) {
          newknown.upload.forEach(file => {
            formData.append('files', file.originFile);
          });
        }
      }

      apiClient.post('/api/known_create', formData).then((res) => {
        const { msg, status, data } = res.data;
        if (status === 'success') {
          Message.success(msg);
          setcreateformloading(false)
          
          setcreatemodal_visible(false);

          known_query()
        }
        else {
          Message.error(msg);
          setcreateformloading(false)
        }
      }).catch((err) => {
        Message.error('Create Error!')
        setcreateformloading(false)
      })
    }
    catch (err) {
      console.log(err)
      Message.error('Create Error!')
      setcreateformloading(false)
    }
  }

  // upload file
  // 限制单个文件大小
  const handleBeforeUpload = (file) => {
    const maxSizeInMB = 50; // 最大文件大小限制，单位：MB
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      Message.error(`文件过大，最大单个允许 ${maxSizeInMB} MB`);
      return false;
    }

    // 判断上传是否成功
    // if(file.response.status != 'success'){
    //   return false;
    // }
    return true; // 阻止默认上传动作
  };




  // 删除agent方法
  const delknown = (item) => {
    Modal.warning({
      title: '删除Known',
      content: (
        <div>
          <p>您确定要删除名为 {item.title} 的 Known 吗？</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <Button type="secondary" onClick={() => {
              Modal.destroyAll(); // 关闭所有模态框
            }}>
              {t['cancel']}
            </Button>
            <Button
              type="primary"
              status='warning'
              style={{ marginLeft: '12px' }}
              onClick={() => {
                // 在这里添加删除操作的代码
                apiClient.post('/api/known_del', { key: item.key }).then((res) => {
                  const { msg, status, data } = res.data;
                  if (status === 'success') {
                    Message.success(msg);
                    known_query();
                    Modal.destroyAll(); // 关闭所有模态框
                  } else {
                    Message.error(msg);
                  }
                }).catch((err) => {
                  Message.error('Delete Error！');
                });
              }}>
              {t['confirm']}
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
      <div className={styles.known_toolbar}>
        <Button
          type='primary'
          size='small'
          onClick={() => {
            createform.resetFields()
            setcreatemodal_visible(true)
          }}
        > {t['create']} </Button>
        <div className={styles.known_toolbar_tag}>
          {/* 去重 */}
          {datatype.map((item, index) => (
            <Button
              type={gettype == item ? 'primary' : 'secondary'}
              size='mini'
              key={item}
              onClick={() => {
                setLoading(true);
                known_query(item)
                setTimeout(() => {
                  setPagination((pagination) => ({ ...pagination, current:1, pageSize:10 }));
                  setLoading(false);
                }, 600);
              }}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>
      <div className={styles.known_content}>
        <Table
          loading={loading}
          columns={columns}
          pagination={pagination}
          data={data.data}
          style={{
            width: '98%',
          }}
          size='mini'
          onChange={onChangeTable}
          renderPagination={(paginationNode) => (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 10,
              }}
            >
              {paginationNode}
            </div>
          )}
        />

      </div>


      <Modal
        title='Create'
        visible={createmodal_visible}
        onOk={() => {
          setcreateformloading(true)
          create_known()
        }}
        okButtonProps={{ loading: createformloading }} // 添加 loading 属性
        onCancel={() => {
          if(!createformloading){
            setcreatemodal_visible(false)
          }
        }}
      >
        <Form
          form={createform}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 20 }}
          // onFinish={onFinish}
          initialValues={{
            type: 'text',
          }}
        >
          <Form.Item
            label="Title"
            field="title"
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input autoComplete="off" />
          </Form.Item>

          <Form.Item
            label="Desc"
            field="desc"
          >
            <Input.TextArea />
          </Form.Item>

          <FormItem label='Type' field='type' rules={[{ required: true }]}>
            <Radio.Group type='button' defaultValue={'text'} >
              <Radio value='text'>text</Radio>
              <Radio value='file'>file</Radio>
            </Radio.Group>
          </FormItem>

          <Form.Item shouldUpdate noStyle>
            {(values) => {
              return values.type === 'text' ?
                (
                  <div>
                    <Form.Item label="Content" field="content">
                      <Input.TextArea />
                    </Form.Item>
                  </div>
                ) :
                (
                  values.type === 'file' && (
                    <div>
                      <Form.Item label="Upload" field="upload" rules={[{ required: true }]}>
                        <Upload
                          multiple
                          name='files'
                          action='/api/known_uploadaction'
                          limit={5}
                          onExceedLimit={() => {
                            Message.warning('File count not more than 5!');
                          }}
                          beforeUpload={handleBeforeUpload}
                        />
                      </Form.Item>
                    </div>
                  ));
            }}
          </Form.Item>
        </Form>
      </Modal>


    </div>
  )

})

export default Known;
