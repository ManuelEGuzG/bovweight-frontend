<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/fincas/${idFinca}`" />
        </ion-buttons>
        <ion-title>Animales</ion-title>
        <ion-buttons v-if="canAdd" slot="end">
          <ion-button @click="$router.push(`/fincas/${idFinca}/animales/nuevo`)">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="header">
        <h2>{{ animales.length }} {{ animales.length === 1 ? 'animal' : 'animales' }}</h2>
      </div>

      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" color="primary" />
      </div>

      <div v-else-if="animales.length === 0" class="empty-state">
        <ion-icon :icon="leafOutline" />
        <h3>No hay animales registrados</h3>
        <p v-if="canAdd">Agrega el primer animal con el botón +</p>
      </div>

      <div v-else class="animales-list">
        <div
          v-for="animal in animales"
          :key="animal.numero_arete"
          class="animal-card"
          @click="$router.push(`/fincas/${idFinca}/animales/${animal.numero_arete}`)"
        >
          <div class="animal-icon" :class="`sex-${animal.sexo}`">
            <ion-icon :icon="animal.sexo === 'macho' ? maleOutline : femaleOutline" />
          </div>

          <div class="animal-info">
            <div class="animal-header">
              <h3>{{ animal.nombre ?? 'Sin nombre' }}</h3>
              <span v-if="animal.estado" class="estado-chip" :class="`estado-${estadoSlug(animal.estado.nombre_estado)}`">
                {{ animal.estado.nombre_estado }}
              </span>
            </div>
            <p class="animal-tag">{{ animal.numero_arete }} · {{ animal.raza }}</p>
            <p v-if="animal.ultimo_peso" class="animal-peso">
              <ion-icon :icon="scaleOutline" />
              {{ animal.ultimo_peso }} kg
            </p>
          </div>

          <ion-icon :icon="chevronForwardOutline" class="chevron" />
        </div>
      </div>

      <AppTabBar />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonBackButton, IonIcon, IonSpinner,
} from '@ionic/vue';
import {
  addOutline, leafOutline, maleOutline, femaleOutline,
  scaleOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { animalService } from '@/services/animal.service';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/composables/useToast';
import AppTabBar from '@/components/AppTabBar.vue';
import type { Animal } from '@/types';

const route     = useRoute();
const authStore = useAuthStore();
const toast     = useToast();

const idFinca   = Number(route.params.idFinca);
const animales  = ref<Animal[]>([]);
const loading   = ref(false);

const canAdd = computed(() => authStore.canEditFincas);

onMounted(loadAnimales);

async function loadAnimales() {
  loading.value = true;
  try {
    animales.value = await animalService.getAll(idFinca);
  } catch {
    await toast.error('Error al cargar los animales.');
  } finally {
    loading.value = false;
  }
}

function estadoSlug(nombre: string): string {
  return nombre.toLowerCase()
    .replace(/\s+/g, '-')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
</script>

<style scoped>
ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }
ion-content { --background: #071a1a; }

.header {
  padding: 20px 20px 12px;
}
.header h2 {
  color: rgba(255,255,255,0.5);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 80px 32px;
  color: rgba(255,255,255,0.4);
}
.empty-state ion-icon { font-size: 4rem; opacity: 0.3; margin-bottom: 16px; }
.empty-state h3 { color: rgba(255,255,255,0.7); font-weight: 600; margin: 0 0 8px; }
.empty-state p { font-size: 0.9rem; margin: 0; }

.animales-list {
  padding: 0 16px 100px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.animal-card {
  background: #0F2E2E;
  border: 1px solid rgba(0,184,148,0.1);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.15s;
}
.animal-card:hover {
  border-color: rgba(0,184,148,0.3);
  transform: translateY(-1px);
}

.animal-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.animal-icon ion-icon { font-size: 1.5rem; }
.animal-icon.sex-macho   { background: rgba(52,152,219,0.15); color: #3498DB; }
.animal-icon.sex-hembra  { background: rgba(255,107,129,0.15); color: #FF6B81; }

.animal-info { flex: 1; min-width: 0; }

.animal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.animal-header h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #E8F4F0;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.estado-chip {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.estado-bien      { background: rgba(0,184,148,0.15); color: #00B894; }
.estado-enfermo   { background: rgba(231,76,60,0.15); color: #E74C3C; }
.estado-medicado  { background: rgba(243,156,18,0.15); color: #F39C12; }
.estado-en-tratamiento { background: rgba(243,156,18,0.15); color: #F39C12; }
.estado-muerto    { background: rgba(127,140,141,0.15); color: #95A5A6; }
.estado-vendido   { background: rgba(155,89,182,0.15); color: #9B59B6; }

.animal-tag {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.5);
  margin: 0 0 4px;
}

.animal-peso {
  font-size: 0.82rem;
  color: #00B894;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}
.animal-peso ion-icon { font-size: 0.9rem; }

.chevron {
  color: rgba(255,255,255,0.3);
  font-size: 1.2rem;
  flex-shrink: 0;
}
</style>