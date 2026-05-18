<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/fincas/${idFinca}/animales/${numeroArete}`" />
        </ion-buttons>
        <ion-title>Recetas</ion-title>
        <ion-buttons v-if="authStore.canCreateReceta" slot="end">
          <ion-button @click="$router.push(`/fincas/${idFinca}/animales/${numeroArete}/recetas/nueva`)">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" color="primary" />
      </div>

      <div v-else-if="recetas.length === 0" class="empty">
        <ion-icon :icon="medkitOutline" />
        <h3>Sin recetas registradas</h3>
        <p v-if="authStore.canCreateReceta">Toca + para emitir una nueva receta</p>
        <p v-else>El veterinario aún no ha emitido recetas.</p>
      </div>

      <div v-else class="container">
        <div v-for="receta in recetas" :key="receta.id_receta" class="receta-card">
          <div class="receta-header">
            <div class="med-icon">
              <ion-icon :icon="medkitOutline" />
            </div>
            <div class="med-info">
              <h3>{{ receta.medicamento?.nombre }}</h3>
              <p>{{ formatDate(receta.fecha_emision) }}</p>
            </div>
            <ion-button v-if="canDelete(receta)" fill="clear" color="danger" size="small" @click="confirmDelete(receta)">
              <ion-icon :icon="trashOutline" slot="icon-only" />
            </ion-button>
          </div>

          <div class="details">
            <div class="row"><span>Dosis</span><span class="value">{{ receta.dosis }}</span></div>
            <div class="row"><span>Frecuencia</span><span class="value">{{ receta.frecuencia }}</span></div>
            <div class="row"><span>Duración</span><span class="value">{{ receta.duracion_dias }} días</span></div>
            <div v-if="receta.veterinario" class="row">
              <span>Veterinario</span>
              <span class="value">{{ receta.veterinario.nombre_completo }}</span>
            </div>
          </div>

          <div v-if="receta.diagnostico" class="diagnostico">
            <h4>Diagnóstico</h4>
            <p>{{ receta.diagnostico }}</p>
          </div>

          <div v-if="receta.notas" class="notas">
            <p>{{ receta.notas }}</p>
          </div>
        </div>
      </div>

      <AppTabBar />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonBackButton, IonIcon, IonSpinner,
  alertController,
} from '@ionic/vue';
import { addOutline, medkitOutline, trashOutline } from 'ionicons/icons';
import { recetaService } from '@/services/receta.service';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/composables/useToast';
import AppTabBar from '@/components/AppTabBar.vue';
import type { Receta } from '@/types';

const route     = useRoute();
const authStore = useAuthStore();
const toast     = useToast();

const idFinca     = Number(route.params.idFinca);
const numeroArete = String(route.params.numeroArete);

const recetas = ref<Receta[]>([]);
const loading = ref(false);

onMounted(load);

async function load() {
  loading.value = true;
  try {
    recetas.value = await recetaService.getAll(idFinca, numeroArete);
  } catch {
    await toast.error('Error al cargar las recetas.');
  } finally {
    loading.value = false;
  }
}

function canDelete(r: Receta): boolean {
  if (authStore.isAdmin) return true;
  return authStore.persona?.cedula === r.veterinario?.cedula;
}

async function confirmDelete(r: Receta) {
  const alert = await alertController.create({
    header: 'Eliminar receta',
    message: `¿Eliminar receta de ${r.medicamento?.nombre}?`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { text: 'Eliminar', role: 'destructive', handler: () => handleDelete(r.id_receta) },
    ],
  });
  await alert.present();
}

async function handleDelete(id: number) {
  try {
    await recetaService.delete(idFinca, numeroArete, id);
    await toast.success('Receta eliminada.');
    await load();
  } catch {
    await toast.error('Error al eliminar.');
  }
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('es-CR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
</script>


<style scoped>
ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }
ion-content { --background: #071a1a; }

.empty {
  text-align: center;
  padding: 80px 32px;
  color: rgba(255,255,255,0.4);
}
.empty ion-icon { font-size: 4rem; opacity: 0.3; margin-bottom: 16px; }
.empty h3 { color: rgba(255,255,255,0.7); margin: 0 0 8px; }

.container { padding: 20px 16px 100px; display: flex; flex-direction: column; gap: 12px; }

.receta-card {
  background: #0F2E2E;
  border: 1px solid rgba(0,184,148,0.1);
  border-radius: 16px;
  padding: 16px;
}

.receta-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.med-icon {
  width: 44px; height: 44px;
  background: rgba(0,184,148,0.15);
  color: #00B894;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.med-icon ion-icon { font-size: 1.4rem; }

.med-info { flex: 1; min-width: 0; }
.med-info h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #E8F4F0;
  margin: 0 0 2px;
}
.med-info p {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.5);
  margin: 0;
}

.details {
  background: rgba(0,0,0,0.2);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}
.details .row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 0.85rem;
  color: rgba(255,255,255,0.5);
}
.details .row .value { color: #E8F4F0; font-weight: 600; }

.diagnostico {
  background: rgba(0,184,148,0.05);
  border-left: 3px solid #00B894;
  border-radius: 4px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.diagnostico h4 {
  font-size: 0.7rem;
  color: #00B894;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 4px;
  font-weight: 700;
}
.diagnostico p {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.85);
  margin: 0;
  line-height: 1.5;
}

.notas {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.55);
  font-style: italic;
  padding: 8px 12px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
}
.notas p { margin: 0; }
</style>