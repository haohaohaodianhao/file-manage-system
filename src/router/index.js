import { createRouter, createWebHistory } from 'vue-router';
import Layout from '../components/layout/index.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/file',
    children: [
      {
        path: 'file',
        name: 'File',
        component: () => import('../views/file/index.vue'),
        meta: { title: '文件管理', requiresAuth: true }
      },
      {
        path: 'tag',
        name: 'Tag',
        component: () => import('../views/tag/index.vue'),
        meta: { title: '标签管理', requiresAuth: true }
      },
      {
        path: 'backup',
        name: 'Backup',
        component: () => import('../views/backup/index.vue'),
        meta: { title: '备份管理', requiresAuth: true }
      },
      {
        path: 'log',
        name: 'Log',
        component: () => import('../views/log/index.vue'),
        meta: { title: '日志管理', requiresAuth: true, requiresAdmin: true }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else if (to.meta.requiresAdmin && userRole !== 'admin') {
    next('/file');
  } else {
    next();
  }
});

export default router;
