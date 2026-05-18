import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { IonicVue } from '@ionic/vue';
import { Preferences } from '@capacitor/preferences';

import App from './App.vue';
import router from './router';

import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

import './theme/variables.css';

import { useAuthStore } from './stores/auth.store';

/**
 * Si es la PRIMERA vez que se abre la pestaña en esta sesión del navegador,
 * borrar el token para forzar el login. Si solo es una recarga (F5),
 * mantener la sesión.
 *
 * sessionStorage se borra al cerrar la pestaña pero NO al recargar.
 */
async function handleSessionStart() {
  const sessionMarker = sessionStorage.getItem('app_session_started');

  if (!sessionMarker) {
    // Primera carga en esta pestaña → borrar token
    await Preferences.remove({ key: 'auth_token' });
    await Preferences.remove({ key: 'auth_persona' });
    sessionStorage.setItem('app_session_started', '1');
  }
  // Si ya hay marcador → es una recarga, conservar la sesión
}

const app = createApp(App)
  .use(IonicVue)
  .use(createPinia())
  .use(router);

handleSessionStart().then(async () => {
  await router.isReady();

  // Cargar la persona desde el storage (si quedó algo guardado tras la recarga)
  const authStore = useAuthStore();
  await authStore.loadPersona();

  app.mount('#app');
});