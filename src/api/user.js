import request from '@/utils/request';

// 用户登录
export function login(data) {
  return request({
    url: '/users/login',
    method: 'post',
    data
  });
}

// 用户注册
export function register(data) {
  return request({
    url: '/users/register',
    method: 'post',
    data
  });
} 