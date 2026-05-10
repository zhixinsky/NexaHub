import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import AdminLayout from '../layouts/AdminLayout.vue';
import ActivityManage from '../pages/ActivityManage.vue';
import ContentManage from '../pages/ContentManage.vue';
import Dashboard from '../pages/Dashboard.vue';
import CategoryManage from '../pages/CategoryManage.vue';
import FileManage from '../pages/FileManage.vue';
import GoodsManage from '../pages/GoodsManage.vue';
import PageManage from '../pages/PageManage.vue';
import SystemSettings from '../pages/SystemSettings.vue';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AdminLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: Dashboard,
        meta: { title: '工作台' }
      },
      {
        path: 'content',
        name: 'content',
        component: ContentManage,
        meta: { title: '内容管理' }
      },
      {
        path: 'activity',
        name: 'activity',
        component: ActivityManage,
        meta: { title: '活动管理' }
      },
      {
        path: 'goods',
        name: 'goods',
        component: GoodsManage,
        meta: { title: '商品管理' }
      },
      {
        path: 'pages',
        name: 'pages',
        component: PageManage,
        meta: { title: '页面管理' }
      },
      {
        path: 'diy',
        redirect: '/pages',
        meta: { title: '页面管理' }
      },
      {
        path: 'resources/files',
        name: 'resources-files',
        component: FileManage,
        meta: { title: '文件管理' }
      },
      {
        path: 'resources/categories',
        name: 'resources-categories',
        component: CategoryManage,
        meta: { title: '分类管理' }
      },
      {
        path: 'settings',
        name: 'settings',
        component: SystemSettings,
        meta: { title: '系统设置' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes
});
