import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// Version: 2025.11.12 - Fix SSL Protocol Error
console.log('App Version: 2025.11.12');

createApp(App).use(router).mount('#app');
