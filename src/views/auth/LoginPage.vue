<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="login-container">
        <div class="left-panel animate-fade-in">
          <div class="brand">
            <div class="logo-icon">
              <img src="/logo.png" alt="BovWeight CR" class="logo-img" />
            </div>
            <h1 class="brand-title">BovWeight CR</h1>
            <p class="brand-tagline">
              Estimación de peso bovino mediante visión por computadora
            </p>
          </div>

          <div class="features">
            <div class="feature" style="--delay: 1">
              <div class="feature-icon">
                <ion-icon :icon="cameraOutline" />
              </div>
              <span>Pesaje por fotografía</span>
            </div>
            <div class="feature" style="--delay: 2">
              <div class="feature-icon">
                <ion-icon :icon="medkitOutline" />
              </div>
              <span>Recetas veterinarias</span>
            </div>
            <div class="feature" style="--delay: 3">
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

        <div class="right-panel">
          <div class="form-wrapper animate-slide-up">
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
  cameraOutline, medkitOutline, trendingUpOutline,
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
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo-icon:hover {
  transform: rotate(5deg) scale(1.05);
}

.logo-img {
  width: 44px;
  height: 44px;
  object-fit: contain;
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
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease forwards;
  animation-delay: calc(var(--delay) * 0.1s);
  opacity: 0;
}

.feature:hover {
  transform: translateX(6px);
  color: #00FFB7;
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
  transition: all 0.3s ease;
}

.feature:hover .feature-icon {
  background: rgba(0, 255, 183, 0.2);
  border-color: #00FFB7;
  box-shadow: 0 0 12px rgba(0, 255, 183, 0.2);
}

.feature-icon ion-icon {
  font-size: 1.1rem;
  color: #00B894;
  transition: color 0.3s;
}

.feature:hover .feature-icon ion-icon {
  color: #00FFB7;
}

.footer-uni {
  position: relative;
  z-index: 2;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
  letter-spacing: 0.5px;
}

/* Decoraciones */
.shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
  pointer-events: none;
  will-change: transform;
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
  opacity: 0.18;
}
.shape-3 {
  width: 280px;
  height: 280px;
  background: #00B894;
  bottom: -120px;
  right: 80px;
  opacity: 0.12;
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
  color: rgba(255, 255, 255, 0.45);
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
  color: rgba(255, 255, 255, 0.45);
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
  color: rgba(255, 255, 255, 0.3);
  pointer-events: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
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
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.22);
}

.form-input:focus {
  border-color: #00B894;
  background: #123434;
  box-shadow: 0 0 0 4px rgba(0, 184, 148, 0.12);
}

.form-input:focus + .input-icon,
.input-wrapper:focus-within .input-icon {
  color: #00FFB7;
  transform: scale(1.05);
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
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 6px 20px rgba(0, 184, 148, 0.25);
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
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(0, 184, 148, 0.35);
  filter: brightness(1.05);
}

.login-btn:hover:not(:disabled) ion-icon {
  transform: translateX(4px);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 4px 12px rgba(0, 184, 148, 0.2);
}

.login-btn:disabled {
  opacity: 0.5;
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

/* ─── Animaciones nativas CSS ─────────────────────────────── */
.animate-fade-in {
  animation: fadeIn 0.8s ease forwards;
}

.animate-slide-up {
  animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dotPulse {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%           { transform: scale(1);   opacity: 1; }
}

/* ─── Responsive: tabletas y móviles ──────────────────────── */
@media (max-width: 992px) {
  .left-panel {
    padding: 45px 35px;
  }
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .left-panel {
    padding: 40px 24px 36px;
    min-height: auto;
    flex: 0 0 auto;
    gap: 32px;
  }

  .logo-icon {
    width: 56px;
    height: 56px;
    margin-bottom: 16px;
  }

  .logo-img {
    width: 36px;
    height: 36px;
  }

  .brand-title { font-size: 2rem; }
  .brand-tagline { font-size: 0.9rem; max-width: 100%; }

  .features {
    flex-direction: row;
    gap: 12px;
    margin-top: 8px;
  }
  
  .feature {
    flex-direction: column;
    text-align: center;
    gap: 8px;
    flex: 1;
    font-size: 0.75rem;
    opacity: 1; /* Asegurar visibilidad inmediata en móvil */
    animation: none;
  }
  
  .feature:hover {
    transform: none;
  }
  
  .feature-icon {
    width: 44px;
    height: 44px;
    margin: 0 auto;
  }

  .footer-uni { display: none; }

  .right-panel {
    padding: 40px 24px 60px;
    flex: 1;
    align-items: flex-start; /* Evita que se centre verticalmente si despliega el teclado */
  }

  .form-wrapper {
    max-width: 100%;
  }

  .form-title { font-size: 1.75rem; }
  .form-header { margin-bottom: 28px; }
}
</style>