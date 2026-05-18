<template>
  <div class="tab-bar">
    <button class="tab-btn" :class="{ active: isActive('/fincas') }" @click="navigate('/fincas')">
      <ion-icon :icon="homeOutline" />
      <span>Fincas</span>
    </button>

    <button v-if="authStore.canManageUsers" class="tab-btn" :class="{ active: isActive('/admin') }" @click="navigate('/admin/personas')">
      <ion-icon :icon="peopleOutline" />
      <span>Usuarios</span>
    </button>

    <button class="tab-btn" :class="{ active: isActive('/perfil') }" @click="navigate('/perfil')">
      <ion-icon :icon="personOutline" />
      <span>Perfil</span>
    </button>
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
.tab-bar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: #0d2b2b;
  border-top: 1px solid rgba(0,184,148,0.15);
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  display: flex;
  justify-content: space-around;
  z-index: 100;
}

.tab-btn {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 14px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 500;
  transition: color 0.2s;
}

.tab-btn ion-icon {
  font-size: 1.4rem;
}

.tab-btn.active {
  color: #00B894;
}
</style>