<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="login-container">
        <!-- Panel izquierdo (branding) -->
        <div class="left-panel">
          <div class="brand">
            <div class="logo-icon">
              <ion-icon :icon="leafOutline" />
            </div>
            <h1 class="brand-title">BovWeight CR</h1>
            <p class="brand-tagline">
              Estimación de peso bovino mediante visión por computadora
            </p>
          </div>

          <div class="features">
            <div class="feature">
              <div class="feature-icon">
                <ion-icon :icon="cameraOutline" />
              </div>
              <span>Pesaje por fotografía</span>
            </div>
            <div class="feature">
              <div class="feature-icon">
                <ion-icon :icon="medkitOutline" />
              </div>
              <span>Recetas veterinarias</span>
            </div>
            <div class="feature">
              <div class="feature-icon">
                <ion-icon :icon="trendingUpOutline" />
              </div>
              <span>Historial completo</span>
            </div>
          </div>

          <p class="footer-uni">Universidad de Costa Rica · Sede Guanacaste</p>

          <div class="shape shape-1" />
          <div class="shape shape-2" />
          <div class="shape shape-3" />
        </div>

        <!-- Panel derecho (formulario) -->
        <div class="right-panel">
          <div class="form-wrapper">
            <div class="form-header">
              <h2 class="form-title">Iniciar sesión</h2>
              <p class="form-sub">Bienvenido. Ingresa tus credenciales.</p>
            </div>

            <form @submit.prevent="handleLogin" class="login-form">
              <div class="form-field">
                <label>Correo electrónico</label>
                <div class="input-wrapper">
                  <ion-icon :icon="mailOutline" class="input-icon" />
                  <input
                    v-model="correo"
                    type="email"
                    class="form-input"
                    placeholder="usuario@correo.cr"
                    autocomplete="email"
                  />
                </div>
              </div>

              <div class="form-field">
                <label>Contraseña</label>
                <div class="input-wrapper">
                  <ion-icon :icon="lockClosedOutline" class="input-icon" />
                  <input
                    v-model="contrasena"
                    type="password"
                    class="form-input"
                    placeholder="••••••••"
                    autocomplete="current-password"
                  />
                </div>
              </div>

              <button type="submit" class="login-btn" :disabled="loading">
                <span v-if="!loading">
                  Ingresar
                  <ion-icon :icon="arrowForwardOutline" />
                </span>
                <span v-else class="btn-loader">
                  <span class="dot" /><span class="dot" /><span class="dot" />
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonIcon } from '@ionic/vue';
import {
  leafOutline, cameraOutline, medkitOutline, trendingUpOutline,
  mailOutline, lockClosedOutline, arrowForwardOutline,
} from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/composables/useToast';

const router    = useRouter();
const authStore = useAuthStore();
const toast     = useToast();

const correo     = ref('');
const contrasena = ref('');
const loading    = ref(false);

async function handleLogin() {
  if (!correo.value || !contrasena.value) {
    await toast.warning('Completa todos los campos.');
    return;
  }

  loading.value = true;
  try {
    await authStore.login(correo.value, contrasena.value);
    await toast.success('¡Bienvenido!');
    router.replace('/fincas');
  } catch (err: any) {
    const msg = err.response?.data?.errors?.correo?.[0]
             ?? err.response?.data?.message
             ?? 'No se pudo iniciar sesión.';
    await toast.error(msg);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
ion-content {
  --background: #071a1a;
}

.login-container {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background: #071a1a;
}

/* ─── Panel izquierdo ──────────────────────────────────────── */
.left-panel {
  flex: 1.1;
  background: linear-gradient(135deg, #071a1a 0%, #0F2E2E 50%, #164545 100%);
  position: relative;
  overflow: hidden;
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
}

.brand { position: relative; z-index: 2; }

.logo-icon {
  width: 68px;
  height: 68px;
  background: rgba(0, 184, 148, 0.15);
  border: 1.5px solid rgba(0, 184, 148, 0.3);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  backdrop-filter: blur(10px);
}
.logo-icon ion-icon {
  font-size: 2rem;
  color: #00B894;
}

.brand-title {
  font-size: 2.6rem;
  font-weight: 800;
  margin: 0 0 14px;
  letter-spacing: -1px;
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #ffffff, #00FFB7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-tagline {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.65);
  max-width: 360px;
  line-height: 1.6;
  margin: 0;
}

.features {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.feature-icon {
  width: 38px;
  height: 38px;
  background: rgba(0, 184, 148, 0.12);
  border: 1px solid rgba(0, 184, 148, 0.25);
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.feature-icon ion-icon {
  font-size: 1.1rem;
  color: #00B894;
}

.footer-uni {
  position: relative;
  z-index: 2;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
}

/* Decoraciones */
.shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.35;
}
.shape-1 {
  width: 320px;
  height: 320px;
  background: #00B894;
  top: -100px;
  right: -80px;
}
.shape-2 {
  width: 220px;
  height: 220px;
  background: #00FFB7;
  bottom: 80px;
  left: -60px;
  opacity: 0.2;
}
.shape-3 {
  width: 280px;
  height: 280px;
  background: #00B894;
  bottom: -120px;
  right: 80px;
  opacity: 0.15;
}

/* ─── Panel derecho ───────────────────────────────────────── */
.right-panel {
  flex: 1;
  background: #071a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
}

.form-header {
  margin-bottom: 36px;
}

.form-title {
  font-size: 2rem;
  font-weight: 800;
  color: #E8F4F0;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
  font-family: 'Inter', sans-serif;
}

.form-sub {
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field label {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  font-size: 1.15rem;
  color: rgba(255, 255, 255, 0.35);
  pointer-events: none;
  transition: color 0.2s;
}

.form-input {
  width: 100%;
  background: #0F2E2E;
  border: 1.5px solid rgba(0, 184, 148, 0.15);
  border-radius: 12px;
  padding: 14px 16px 14px 44px;
  font-size: 0.95rem;
  color: #E8F4F0;
  outline: none;
  font-family: inherit;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.form-input:focus {
  border-color: #00B894;
  background: #143838;
  box-shadow: 0 0 0 4px rgba(0, 184, 148, 0.1);
}

.form-input:focus + .input-icon,
.input-wrapper:focus-within .input-icon {
  color: #00B894;
}

.login-btn {
  margin-top: 16px;
  height: 52px;
  background: linear-gradient(135deg, #00B894, #009B7D);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  box-shadow: 0 6px 20px rgba(0, 184, 148, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.login-btn ion-icon {
  font-size: 1.2rem;
  transition: transform 0.2s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(0, 184, 148, 0.4);
}

.login-btn:hover:not(:disabled) ion-icon {
  transform: translateX(4px);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-loader {
  display: flex;
  align-items: center;
  gap: 5px;
}
.dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: dotPulse 1.2s ease-in-out infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotPulse {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%           { transform: scale(1);   opacity: 1; }
}

/* ─── Responsive: móvil ───────────────────────────────────── */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .left-panel {
    padding: 40px 28px 50px;
    min-height: auto;
    flex: 0 0 auto;
  }

  .logo-icon {
    width: 56px;
    height: 56px;
    margin-bottom: 20px;
  }
  .logo-icon ion-icon { font-size: 1.7rem; }

  .brand-title { font-size: 2rem; }
  .brand-tagline { font-size: 0.9rem; }

  .features {
    flex-direction: row;
    gap: 12px;
    margin-top: 24px;
  }
  .feature {
    flex-direction: column;
    text-align: center;
    gap: 6px;
    flex: 1;
    font-size: 0.7rem;
  }
  .feature-icon {
    width: 42px;
    height: 42px;
  }

  .footer-uni { display: none; }

  .right-panel {
    padding: 32px 24px 50px;
    flex: 1;
  }

  .form-title { font-size: 1.6rem; }
  .form-header { margin-bottom: 24px; }
}
</style>