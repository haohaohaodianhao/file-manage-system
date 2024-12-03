import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

const service = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 15000
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 如果是二进制数据，直接返回
    if (response.config.responseType === 'blob') {
      return response.data;
    }

    const res = response.data;
    if (!res.Success) {
      ElMessage.error(res.Msg || '请求失败');
      return Promise.reject(new Error(res.Msg || '请求失败'));
    }
    return res;
  },
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          ElMessage.error('请重新登录');
          localStorage.removeItem('token');
          router.push('/login');
          break;
        case 403:
          ElMessage.error('没有权限');
          break;
        default:
          ElMessage.error(error.response.data?.Msg || '请求失败');
      }
    } else {
      ElMessage.error('网络错误');
    }
    return Promise.reject(error);
  }
);

export default service; 