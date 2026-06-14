<template>
  <div class="tab-bar-container">
    <div class="tab-bar">
      <button 
        class="tab-btn" 
        :class="{ active: isActive('/fincas') }" 
        @click="navigate('/fincas')"
      >
        <div class="icon-wrapper">
          <ion-icon :icon="homeOutline" />
        </div>
        <span>Fincas</span>
      </button>

      <button 
        v-if="authStore.canManageUsers" 
        class="tab-btn" 
        :class="{ active: isActive('/admin') }" 
        @click="navigate('/admin/personas')"
      >
        <div class="icon-wrapper">
          <ion-icon :icon="peopleOutline" />
        </div>
        <span>Usuarios</span>
      </button>

      <button 
        class="tab-btn" 
        :class="{ active: isActive('/perfil') }" 
        @click="navigate('/perfil')"
      >
        <div class="icon-wrapper">
          <ion-icon :icon="personOutline" />
        </div>
        <span>Perfil</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { IonIcon } from '@ionic/vue';
import { homeOutline, peopleOutline, personOutline } from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const route  = useRoute();
const authStore = useAuthStore();

function navigate(path: string) {
  router.push(path);
}

function isActive(prefix: string): boolean {
  return route.path.startsWith(prefix);
}
</script>

<style scoped>
/* Contenedor padre para asegurar el aislamiento y evitar saltos visuales */
.tab-bar-container {
  position: fixed;
  bottom: 0; 
  left: 0; 
  right: 0;
  z-index: 999;
  padding: 0 0 env(safe-area-inset-bottom); /* Manejo nativo de "notch" en móviles */
  background: #0d2b2b;
  border-top: 1px solid rgba(0, 184, 148, 0.12);
  box-shadow: 0 -8px 24px rgba(7, 26, 26, 0.5);
}

.tab-bar {
  max-width: 600px; /* Evita que se estire infinitamente en pantallas de escritorio */
  margin: 0 auto;
  height: 64px;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.tab-btn {
  background: transparent;
  border: none;
  color: rgba(232, 244, 240, 0.4); /* Blanco esmeralda opaco */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  height: 100%;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: -0.1px;
  transition: all 0.25s ease;
  -webkit-tap-highlight-color: transparent;
}

/* Envoltura para aislar los efectos del ícono */
.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 26px;
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-btn ion-icon {
  font-size: 1.35rem;
  transition: transform 0.2s ease;
}

/* Hover de cortesía para web/desktop */
@media (hover: hover) {
  .tab-btn:hover {
    color: rgba(232, 244, 240, 0.8);
  }
  .tab-btn:hover ion-icon {
    transform: translateY(-1px);
  }
}

/* Estado Activo Premium (Esmeralda Neón) */
.tab-btn.active {
  color: #00B894;
}

.tab-btn.active .icon-wrapper {
  background: rgba(0, 184, 148, 0.08); /* Sutil píldora de fondo al estar activo */
}

.tab-btn.active ion-icon {
  transform: scale(1.05);
  /* Efecto glow premium controlado */
  filter: drop-shadow(0 2px 8px rgba(0, 184, 148, 0.35));
}

/* Micro-interacción al presionar */
.tab-btn:active ion-icon {
  transform: scale(0.92);
}
</style>