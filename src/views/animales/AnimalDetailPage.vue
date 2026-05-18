<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/fincas/${idFinca}/animales`" />
        </ion-buttons>
        <ion-title>Detalle Animal</ion-title>
        <ion-buttons v-if="canEdit" slot="end">
          <ion-button @click="showEdit = true">
            <ion-icon :icon="createOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" color="primary" />
      </div>

      <div v-else-if="animal" class="container">
        <div class="hero-card">
          <div class="hero-icon" :class="`sex-${animal.sexo}`">
            <ion-icon :icon="animal.sexo === 'macho' ? maleOutline : femaleOutline" />
          </div>
          <div class="hero-info">
            <h1>{{ animal.nombre ?? 'Sin nombre' }}</h1>
            <p>{{ animal.numero_arete }}</p>
            <div class="chips">
              <span class="chip">{{ animal.raza }}</span>
              <span class="chip">{{ animal.sexo === 'macho' ? 'Macho' : 'Hembra' }}</span>
              <span v-if="age" class="chip accent">{{ age }}</span>
            </div>
          </div>
        </div>

        <!-- Estado actual con cambio rápido -->
        <div class="estado-card">
          <div class="estado-header">
            <span class="estado-label">Estado actual</span>
            <span v-if="animal.estado" class="estado-chip" :class="`estado-${estadoSlug(animal.estado.nombre_estado)}`">
              {{ animal.estado.nombre_estado }}
            </span>
          </div>
          <button class="estado-btn" @click="showEstadoSheet = true">
            <ion-icon :icon="swapVerticalOutline" />
            Cambiar estado
          </button>
        </div>

        <!-- Peso actual -->
        <div class="weight-card">
          <p class="weight-label">Último peso</p>
          <div class="weight-value">
            <span class="weight-num">{{ animal.ultimo_peso ?? '—' }}</span>
            <span class="weight-unit">{{ animal.ultimo_peso ? 'kg' : '' }}</span>
          </div>
          <p v-if="animal.ultima_fecha" class="weight-date">
            <ion-icon :icon="calendarOutline" />
            {{ formatDate(animal.ultima_fecha) }}
          </p>
        </div>

        <!-- Acciones principales -->
        <div class="actions-grid">
          <button
            v-if="authStore.canWeigh"
            class="action-card primary"
            @click="$router.push(`/fincas/${idFinca}/animales/${numeroArete}/pesar`)"
          >
            <ion-icon :icon="scaleOutline" />
            <span>Nuevo pesaje</span>
          </button>

          <button
            class="action-card"
            @click="$router.push(`/fincas/${idFinca}/animales/${numeroArete}/historial`)"
          >
            <ion-icon :icon="trendingUpOutline" />
            <span>Historial</span>
          </button>

          <button
            class="action-card"
            @click="$router.push(`/fincas/${idFinca}/animales/${numeroArete}/recetas`)"
          >
            <ion-icon :icon="medkitOutline" />
            <span>Recetas</span>
          </button>
        </div>

        <!-- Datos adicionales -->
        <div class="info-card">
          <h3>Información</h3>
          <div class="info-row">
            <span>Fecha de nacimiento</span>
            <span class="value">{{ animal.fecha_nacimiento ? formatDate(animal.fecha_nacimiento) : '—' }}</span>
          </div>
          <div class="info-row">
            <span>Raza</span>
            <span class="value">{{ animal.raza }}</span>
          </div>
          <div class="info-row">
            <span>Sexo</span>
            <span class="value">{{ animal.sexo === 'macho' ? 'Macho' : 'Hembra' }}</span>
          </div>
          <div v-if="animal.nota_general" class="info-row full">
            <span>Notas</span>
            <p class="notes">{{ animal.nota_general }}</p>
          </div>
        </div>

        <div v-if="canEdit" class="danger-zone">
          <button class="danger-btn" @click="confirmDelete">
            <ion-icon :icon="trashOutline" />
            Eliminar animal
          </button>
        </div>
      </div>

      <!-- Sheet cambiar estado -->
      <ion-action-sheet
        :is-open="showEstadoSheet"
        header="Cambiar estado del animal"
        :buttons="estadoButtons"
        @did-dismiss="showEstadoSheet = false"
      />

      <!-- Modal editar -->
      <ion-modal :is-open="showEdit" @did-dismiss="showEdit = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Editar Animal</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showEdit = false">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div v-if="editForm" class="form-wrapper">
            <div class="form-field">
              <label>Nombre</label>
              <input v-model="editForm.nombre" class="form-input" />
            </div>
            <div class="form-field">
              <label>Sexo</label>
              <select v-model="editForm.sexo" class="form-input">
                <option value="hembra">Hembra</option>
                <option value="macho">Macho</option>
              </select>
            </div>
            <div class="form-field">
              <label>Raza</label>
              <select v-model="editForm.raza" class="form-input">
                <option v-for="r in razas" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
            <div class="form-field">
              <label>Fecha de nacimiento</label>
              <input v-model="editForm.fecha_nacimiento" type="date" class="form-input" />
            </div>
            <div class="form-field">
              <label>Notas</label>
              <textarea v-model="editForm.nota_general" class="form-input" rows="3" />
            </div>
            <button class="submit-btn" :disabled="saving" @click="handleUpdate">
              {{ saving ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </ion-content>
      </ion-modal>

      <AppTabBar />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonBackButton, IonIcon, IonSpinner,
  IonModal, IonActionSheet, alertController,
} from '@ionic/vue';
import {
  createOutline, closeOutline, scaleOutline, trendingUpOutline,
  medkitOutline, trashOutline, calendarOutline, maleOutline,
  femaleOutline, swapVerticalOutline,
} from 'ionicons/icons';
import { animalService } from '@/services/animal.service';
import { catalogoService } from '@/services/catalogo.service';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/composables/useToast';
import AppTabBar from '@/components/AppTabBar.vue';
import type { Animal, EstadoAnimal } from '@/types';

const route     = useRoute();
const router    = useRouter();
const authStore = useAuthStore();
const toast     = useToast();

const idFinca     = Number(route.params.idFinca);
const numeroArete = String(route.params.numeroArete);

const animal   = ref<Animal | null>(null);
const loading  = ref(false);
const saving   = ref(false);
const showEdit = ref(false);
const showEstadoSheet = ref(false);
const editForm = ref<any>(null);
const estados  = ref<EstadoAnimal[]>([]);

const razas = ['Brahman','Holstein','Jersey','Angus','Simmental','Charolais','Criollo','Otra'];

const canEdit = computed(() => authStore.canEditFincas);

const age = computed(() => {
  if (!animal.value?.fecha_nacimiento) return null;
  const birth = new Date(animal.value.fecha_nacimiento);
  const now = new Date();
  const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12
                    + (now.getMonth() - birth.getMonth());
  if (totalMonths < 1) return 'Menos de 1 mes';
  if (totalMonths < 12) return `${totalMonths} ${totalMonths === 1 ? 'mes' : 'meses'}`;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return m > 0 ? `${y}a ${m}m` : `${y} ${y === 1 ? 'año' : 'años'}`;
});

const estadoButtons = computed(() => [
  ...estados.value.map(e => ({
    text: e.nombre_estado,
    handler: () => handleCambiarEstado(e.id_estado),
  })),
  { text: 'Cancelar', role: 'cancel' as const },
]);

onMounted(async () => {
  await loadAnimal();
  estados.value = await catalogoService.getEstados();
});

async function loadAnimal() {
  loading.value = true;
  try {
    animal.value = await animalService.getOne(idFinca, numeroArete);
    editForm.value = {
      nombre:           animal.value.nombre ?? '',
      sexo:             animal.value.sexo,
      raza:             animal.value.raza,
      fecha_nacimiento: animal.value.fecha_nacimiento ?? '',
      nota_general:     animal.value.nota_general ?? '',
    };
  } catch {
    await toast.error('Error al cargar el animal.');
  } finally {
    loading.value = false;
  }
}

async function handleUpdate() {
  saving.value = true;
  try {
    await animalService.update(idFinca, numeroArete, {
      nombre: editForm.value.nombre || null,
      sexo:   editForm.value.sexo,
      raza:   editForm.value.raza,
      fecha_nacimiento: editForm.value.fecha_nacimiento || null,
      nota_general: editForm.value.nota_general || null,
    });
    await toast.success('Animal actualizado.');
    showEdit.value = false;
    await loadAnimal();
  } catch {
    await toast.error('Error al actualizar.');
  } finally {
    saving.value = false;
  }
}

async function handleCambiarEstado(idEstado: number) {
  try {
    await animalService.cambiarEstado(idFinca, numeroArete, idEstado);
    await toast.success('Estado actualizado.');
    await loadAnimal();
  } catch {
    await toast.error('Error al cambiar estado.');
  }
}

async function confirmDelete() {
  const alert = await alertController.create({
    header: 'Eliminar animal',
    message: `¿Seguro que deseas eliminar a ${animal.value?.nombre ?? animal.value?.numero_arete}?`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { text: 'Eliminar', role: 'destructive', handler: handleDelete },
    ],
  });
  await alert.present();
}

async function handleDelete() {
  try {
    await animalService.delete(idFinca, numeroArete);
    await toast.success('Animal eliminado.');
    router.replace(`/fincas/${idFinca}/animales`);
  } catch {
    await toast.error('Error al eliminar.');
  }
}

function estadoSlug(nombre: string): string {
  return nombre.toLowerCase()
    .replace(/\s+/g, '-')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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

.container {
  padding: 20px 16px 100px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-card {
  background: linear-gradient(135deg, #0F2E2E, #164545);
  border: 1px solid rgba(0,184,148,0.2);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.hero-icon {
  width: 70px; height: 70px;
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.hero-icon ion-icon { font-size: 2.2rem; }
.hero-icon.sex-macho { background: rgba(52,152,219,0.2); color: #3498DB; }
.hero-icon.sex-hembra { background: rgba(255,107,129,0.2); color: #FF6B81; }

.hero-info { flex: 1; min-width: 0; }
.hero-info h1 { font-size: 1.4rem; font-weight: 800; color: #E8F4F0; margin: 0 0 2px; }
.hero-info p { font-size: 0.85rem; color: rgba(255,255,255,0.5); margin: 0 0 8px; }

.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.7);
  font-size: 0.7rem; font-weight: 600;
  padding: 3px 9px; border-radius: 8px;
}
.chip.accent { background: rgba(0,184,148,0.15); color: #00B894; }

.estado-card {
  background: #0F2E2E;
  border: 1px solid rgba(0,184,148,0.1);
  border-radius: 14px;
  padding: 14px;
}

.estado-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.estado-label {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.estado-chip {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.estado-bien      { background: rgba(0,184,148,0.15); color: #00B894; }
.estado-enfermo   { background: rgba(231,76,60,0.15); color: #E74C3C; }
.estado-medicado  { background: rgba(243,156,18,0.15); color: #F39C12; }
.estado-en-tratamiento { background: rgba(243,156,18,0.15); color: #F39C12; }
.estado-muerto    { background: rgba(127,140,141,0.15); color: #95A5A6; }
.estado-vendido   { background: rgba(155,89,182,0.15); color: #9B59B6; }

.estado-btn {
  width: 100%;
  background: rgba(0,184,148,0.1);
  border: 1.5px solid rgba(0,184,148,0.3);
  color: #00B894;
  border-radius: 10px;
  padding: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: inherit;
}

.weight-card {
  background: #0F2E2E;
  border: 1px solid rgba(0,184,148,0.15);
  border-radius: 18px;
  padding: 20px;
  text-align: center;
}
.weight-label {
  font-size: 0.72rem; font-weight: 600;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase; letter-spacing: 1px;
  margin: 0 0 8px;
}
.weight-value {
  display: flex; align-items: baseline;
  justify-content: center; gap: 6px;
  margin-bottom: 6px;
}
.weight-num {
  font-size: 3rem; font-weight: 800;
  color: #00B894; line-height: 1;
}
.weight-unit {
  font-size: 1.2rem;
  color: rgba(255,255,255,0.5);
}
.weight-date {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.4);
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

.action-card {
  background: #0F2E2E;
  border: 1.5px solid rgba(0,184,148,0.15);
  border-radius: 14px;
  padding: 16px 8px;
  color: #E8F4F0;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
}
.action-card ion-icon { font-size: 1.5rem; color: #00B894; }
.action-card.primary {
  background: linear-gradient(135deg, #00B894, #009B7D);
  border-color: transparent;
  color: white;
}
.action-card.primary ion-icon { color: white; }

.info-card {
  background: #0F2E2E;
  border: 1px solid rgba(0,184,148,0.1);
  border-radius: 14px;
  padding: 16px;
}
.info-card h3 {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 12px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  font-size: 0.85rem;
  color: rgba(255,255,255,0.5);
}
.info-row:last-child { border-bottom: none; }
.info-row .value { color: #E8F4F0; font-weight: 600; }
.info-row.full { flex-direction: column; align-items: flex-start; gap: 6px; }
.notes {
  color: rgba(255,255,255,0.75);
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
}

.danger-zone {
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.danger-btn {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1.5px solid rgba(231,76,60,0.4);
  color: #E74C3C;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
}

ion-modal { --height: 100%; --width: 100%; --border-radius: 0; --background: #071a1a; }
ion-modal ion-content { --background: #071a1a; }
ion-modal ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }
@media (min-width: 768px) {
  ion-modal { --height: 80%; --width: 500px; --border-radius: 20px; }
}

.form-wrapper { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label {
  font-size: 0.75rem; font-weight: 600;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase; letter-spacing: 0.8px;
}
.form-input {
  background: #0F2E2E;
  border: 1.5px solid rgba(0,184,148,0.2);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 0.9rem;
  color: #E8F4F0;
  font-family: inherit;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus { border-color: #00B894; }
.submit-btn {
  width: 100%; height: 48px;
  background: linear-gradient(135deg, #00B894, #009B7D);
  color: white; border: none; border-radius: 12px;
  font-weight: 600; cursor: pointer; font-family: inherit;
}
.submit-btn:disabled { opacity: 0.6; }
</style>