import { createRouter, createWebHistory } from 'vue-router';
import Login from './Login.vue'
import Home from './Home.vue';

const routes = [
  { path: '/', component: Login },
  { path: '/home', component: Home }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;