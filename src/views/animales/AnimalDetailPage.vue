<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/fincas/${idFinca}/animales`" />
        </ion-buttons>
        <ion-title>Detalle Animal</ion-title>
        <ion-buttons v-if="canEdit" slot="end">
          <ion-button class="edit-toolbar-btn" @click="showEdit = true">
            <ion-icon :icon="createOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="spinner-container">
        <ion-spinner name="crescent" />
      </div>

      <div v-else-if="animal" class="detail-container animate-fade-in">
        
        <div class="detail-column-main">
          
          <div class="hero-card">
            <div class="hero-icon" :class="`sex-${animal.sexo}`">
              <ion-icon :icon="animal.sexo === 'macho' ? maleOutline : femaleOutline" />
            </div>
            <div class="hero-info">
              <h1>{{ animal.nombre ?? 'Sin nombre asignado' }}</h1>
              <p class="arete-code">{{ animal.numero_arete }}</p>
              <div class="chips">
                <span class="chip">{{ animal.raza }}</span>
                <span class="chip sex-text">{{ animal.sexo === 'macho' ? 'Macho' : 'Hembra' }}</span>
                <span v-if="age" class="chip accent">{{ age }}</span>
              </div>
            </div>
          </div>

          <div class="weight-card">
            <p class="weight-label">Último Peso Registrado</p>
            <div class="weight-value">
              <span class="weight-num">{{ animal.ultimo_peso ?? '—' }}</span>
              <span class="weight-unit" v-if="animal.ultimo_peso">kg</span>
            </div>
            <p v-if="animal.ultima_fecha" class="weight-date">
              <ion-icon :icon="calendarOutline" />
              <span>Control: {{ formatDate(animal.ultima_fecha) }}</span>
            </p>
          </div>

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
        </div>

        <div class="detail-column-side">
          
          <div class="estado-card">
            <div class="estado-header">
              <span class="estado-label">Condición Sanitaria</span>
              <span v-if="animal.estado" class="estado-chip" :class="`estado-${estadoSlug(animal.estado.nombre_estado)}`">
                {{ animal.estado.nombre_estado }}
              </span>
            </div>
            <button class="estado-btn" @click="showEstadoSheet = true">
              <ion-icon :icon="swapVerticalOutline" />
              <span>Cambiar condición</span>
            </button>
          </div>

          <div class="info-card">
            <h3>Ficha Técnica</h3>
            <div class="info-row">
              <span class="info-label">Fecha de nacimiento</span>
              <span class="value">{{ animal.fecha_nacimiento ? formatDate(animal.fecha_nacimiento) : 'No registrada' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Raza dominante</span>
              <span class="value">{{ animal.raza }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Sexo</span>
              <span class="value">{{ animal.sexo === 'macho' ? 'Macho' : 'Hembra' }}</span>
            </div>
            <div v-if="animal.nota_general" class="info-row full">
              <span class="info-label">Notas Generales</span>
              <p class="notes">{{ animal.nota_general }}</p>
            </div>
          </div>

          <div v-if="canEdit" class="danger-zone">
            <button class="danger-btn" @click="confirmDelete">
              <ion-icon :icon="trashOutline" />
              <span>Remover del sistema</span>
            </button>
          </div>
        </div>

      </div>

      <ion-action-sheet
        :is-open="showEstadoSheet"
        header="Seleccionar nueva condición"
        :buttons="estadoButtons"
        @did-dismiss="showEstadoSheet = false"
        class="bovweight-action-sheet"
      />

      <ion-modal :is-open="showEdit" @did-dismiss="showEdit = false" class="responsive-modal">
        <ion-header class="ion-no-border">
          <ion-toolbar>
            <ion-title>Editar Ficha</ion-title>
            <ion-buttons slot="end">
              <ion-button class="close-modal-btn" @click="showEdit = false">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        
        <ion-content class="ion-padding modal-content-dark">
          <div v-if="editForm" class="form-wrapper">
            <div class="form-field">
              <label>Nombre o Alias</label>
              <input v-model="editForm.nombre" class="form-input" placeholder="Ej: Lucero" />
            </div>
            
            <div class="form-row">
              <div class="form-field half">
                <label>Sexo</label>
                <div class="select-wrapper">
                  <select v-model="editForm.sexo" class="form-input clean-select">
                    <option value="hembra">Hembra</option>
                    <option value="macho">Macho</option>
                  </select>
                </div>
              </div>
              
              <div class="form-field half">
                <label>Raza</label>
                <div class="select-wrapper">
                  <select v-model="editForm.raza" class="form-input clean-select">
                    <option v-for="r in razas" :key="r" :value="r">{{ r }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-field">
              <label>Fecha de nacimiento</label>
              <input v-model="editForm.fecha_nacimiento" type="date" class="form-input date-input" />
            </div>

            <div class="form-field">
              <label>Notas generales o marcas</label>
              <textarea v-model="editForm.nota_general" class="form-input textarea-input" rows="4" placeholder="Detalles particulares..." />
            </div>

            <button class="submit-btn" :disabled="saving" @click="handleUpdate">
              <span>{{ saving ? 'Guardando...' : 'Confirmar cambios' }}</span>
            </button>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>

    <AppTabBar />
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
  const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
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
  try {
    estados.value = await catalogoService.getEstados();
  } catch {
    console.error('Error al obtener catálogos.');
  }
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
    await toast.error('Error al cargar datos del animal.');
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
    await toast.success('Registro actualizado.');
    showEdit.value = false;
    await loadAnimal();
  } catch {
    await toast.error('No se pudieron guardar los cambios.');
  } finally {
    saving.value = false;
  }
}

async function handleCambiarEstado(idEstado: number) {
  try {
    await animalService.cambiarEstado(idFinca, numeroArete, idEstado);
    await toast.success('Condición sanitaria cambiada.');
    await loadAnimal();
  } catch {
    await toast.error('Error al cambiar condición.');
  }
}

async function confirmDelete() {
  const alert = await alertController.create({
    header: 'Eliminar Animal',
    message: `¿Remover permanentemente el registro de ${animal.value?.nombre ?? animal.value?.numero_arete}?`,
    cssClass: 'custom-alert-danger',
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
    await toast.success('Registro eliminado.');
    router.replace(`/fincas/${idFinca}/animales`);
  } catch {
    await toast.error('Error al eliminar.');
  }
}

function estadoSlug(nombre: string): string {
  return nombre.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
}
</script>

<style>
ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }
ion-content { --background: #071a1a; }

.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}
.spinner-container ion-spinner {
  --color: #00B894;
  width: 40px;
  height: 40px;
}

/* =========================================================================
   DISEÑO ADAPTATIVO POR BLOQUES DE FLUJO (EVITA SUPERPOSICIÓN)
   ========================================================================= */
.detail-container {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  /* El relleno inferior asegura espacio para el scroll sin pisar el TabBar */
  padding-bottom: 40px; 
}

.detail-column-main, .detail-column-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

/* Fichas e Identificadores */
.hero-card {
  background: #0F2E2E;
  border: 1px solid rgba(0, 184, 148, 0.05);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.hero-icon {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.hero-icon ion-icon { font-size: 1.6rem; }
.hero-icon.sex-macho { background: rgba(52, 152, 219, 0.1); color: #3498DB; }
.hero-icon.sex-hembra { background: rgba(255, 107, 129, 0.1); color: #FF6B81; }

.hero-info { flex: 1; min-width: 0; }
.hero-info h1 { font-size: 1.2rem; font-weight: 800; color: #E8F4F0; margin: 0 0 2px; }
.arete-code { font-size: 0.8rem; font-weight: 700; color: #00B894; margin: 0 0 6px; }

.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chip {
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}
.chip.accent { background: rgba(0, 184, 148, 0.1); color: #00B894; }

/* Tarjeta del Peso */
.weight-card {
  background: #0F2E2E;
  border: 1px solid rgba(0, 184, 148, 0.08);
  border-radius: 14px;
  padding: 14px;
  text-align: center;
}
.weight-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  margin: 0 0 4px;
}
.weight-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  margin-bottom: 2px;
}
.weight-num { font-size: 2.4rem; font-weight: 900; color: #00B894; line-height: 1; }
.weight-unit { font-size: 1rem; font-weight: 700; color: rgba(255, 255, 255, 0.3); }
.weight-date {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.weight-date ion-icon { color: #00B894; font-size: 0.8rem; }

/* Botones de acción fluida */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.action-card {
  background: #0F2E2E;
  border: 1px solid rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  padding: 10px 4px;
  color: #E8F4F0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-family: inherit;
  font-size: 0.68rem;
  font-weight: 700;
}
.action-card ion-icon { font-size: 1.25rem; color: #00B894; }
.action-card.primary { background: linear-gradient(135deg, #00B894 0%, #009B7D 100%); color: #FFFFFF; }
.action-card.primary ion-icon { color: #FFFFFF; }

/* Bloque Sanitario */
.estado-card {
  background: #0F2E2E;
  border: 1px solid rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  padding: 12px;
}
.estado-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.estado-label { font-size: 0.65rem; color: rgba(255, 255, 255, 0.35); text-transform: uppercase; font-weight: 700; }
.estado-chip { font-size: 0.62rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }

.estado-bien           { background: rgba(0, 184, 148, 0.12); color: #00B894; }
.estado-enfermo        { background: rgba(231, 76, 60, 0.12); color: #E74C3C; }
.estado-medicado       { background: rgba(243, 156, 18, 0.12); color: #F39C12; }
.estado-en-tratamiento { background: rgba(243, 156, 18, 0.12); color: #F39C12; }
.estado-muerto         { background: rgba(127, 140, 141, 0.12); color: #95A5A6; }
.estado-vendido        { background: rgba(155, 89, 182, 0.12); color: #9B59B6; }

.estado-btn {
  width: 100%;
  background: rgba(0, 184, 148, 0.04);
  border: 1px solid rgba(0, 184, 148, 0.18);
  color: #00B894;
  border-radius: 8px;
  padding: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* Ficha de datos */
.info-card {
  background: #0F2E2E;
  border: 1px solid rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  padding: 12px;
}
.info-card h3 { font-size: 0.65rem; color: rgba(255, 255, 255, 0.35); text-transform: uppercase; margin: 0 0 6px; font-weight: 700; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.04); font-size: 0.8rem; }
.info-row:last-of-type { border-bottom: none; }
.info-label { color: rgba(255, 255, 255, 0.4); }
.info-row .value { color: #E8F4F0; font-weight: 600; }
.info-row.full { flex-direction: column; align-items: flex-start; gap: 4px; padding-bottom: 0; }
.notes {
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.78rem;
  line-height: 1.4;
  margin: 0;
  background: #071a1a;
  padding: 8px;
  border-radius: 6px;
  width: 100%;
  box-sizing: border-box;
  word-break: break-word;
}

/* Remoción */
.danger-zone { margin-top: 2px; }
.danger-btn {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 1px solid rgba(231, 76, 60, 0.18);
  color: #E74C3C;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* Estilos Inyectados para Superposiciones de Ionic */
.bovweight-action-sheet { --background: #0F2E2E !important; --backdrop-opacity: 0.65 !important; }
.bovweight-action-sheet .action-sheet-title { background: #0d2b2b !important; color: #00B894 !important; font-weight: 700 !important; font-size: 0.78rem !important; text-transform: uppercase !important; text-align: center !important; border-bottom: 1px solid rgba(0, 184, 148, 0.12) !important; }
.bovweight-action-sheet .action-sheet-button { background: #0F2E2E !important; color: #E8F4F0 !important; font-size: 0.88rem !important; font-weight: 600 !important; border-bottom: 1px solid rgba(255, 255, 255, 0.03) !important; }
.bovweight-action-sheet .action-sheet-button.ion-activated { background: #164545 !important; color: #00B894 !important; }
.bovweight-action-sheet .action-sheet-cancel { background: #0d2b2b !important; color: #E74C3C !important; font-weight: 700 !important; }

ion-modal.responsive-modal { --background: #071a1a; }
ion-modal.responsive-modal ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }
.close-modal-btn, .edit-toolbar-btn { --color: #E8F4F0; font-size: 1.1rem; }
.modal-content-dark { --background: #071a1a; }
.form-wrapper { display: flex; flex-direction: column; gap: 12px; }
.form-field { display: flex; flex-direction: column; gap: 4px; }
.form-field label { font-size: 0.65rem; font-weight: 700; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; }
.form-input { background: #0F2E2E; border: 1px solid rgba(0, 184, 148, 0.12); border-radius: 8px; padding: 10px; font-size: 0.85rem; color: #E8F4F0; font-family: inherit; outline: none; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #00B894; }
.form-row { display: flex; gap: 10px; }
.form-field.half { flex: 1; width: 50%; }
.select-wrapper { position: relative; width: 100%; }
.select-wrapper::after { content: '▼'; font-size: 0.55rem; color: rgba(255, 255, 255, 0.2); position: absolute; right: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.clean-select { appearance: none; -webkit-appearance: none; padding-right: 24px; cursor: pointer; }
.clean-select option { background: #071a1a; color: #E8F4F0; }
.date-input { color-scheme: dark; }
.textarea-input { resize: none; }
.submit-btn { width: 100%; height: 42px; background: linear-gradient(135deg, #00B894 0%, #009B7D 100%); color: white; border: none; border-radius: 8px; font-size: 0.88rem; font-weight: 700; cursor: pointer; margin-top: 2px; }

.animate-fade-in { animation: fadeIn 0.25s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }

/* =========================================================================
   MEDIA QUERIES: REORGANIZACIÓN COMPLETA PARA PANTALLAS DE ESCRITORIO
   ========================================================================= */
@media (min-width: 768px) {
  .detail-container {
    flex-direction: row;
    align-items: flex-start;
    gap: 20px;
    padding: 24px;
    max-width: 1024px;
    margin: 0 auto;
    padding-bottom: 24px;
  }
  .detail-column-main { flex: 1.1; gap: 16px; }
  .detail-column-side { flex: 0.9; gap: 16px; }
  
  .hero-card { padding: 18px; gap: 16px; border-radius: 16px; }
  .hero-icon { width: 64px; height: 64px; border-radius: 12px; }
  .hero-icon ion-icon { font-size: 2rem; }
  .hero-info h1 { font-size: 1.35rem; }
  
  .weight-card { padding: 20px; border-radius: 16px; }
  .weight-num { font-size: 3rem; }
  
  .actions-grid { gap: 10px; }
  .action-card { padding: 14px 6px; font-size: 0.72rem; gap: 6px; border-radius: 12px; }
  .action-card ion-icon { font-size: 1.45rem; }

  .estado-card, .info-card { padding: 16px; border-radius: 14px; }
  .info-row { font-size: 0.85rem; padding: 10px 0; }
  
  .bovweight-action-sheet .action-sheet-container { max-width: 400px !important; margin: 0 auto !important; border-radius: 14px 14px 0 0 !important; overflow: hidden !important; }
  ion-modal.responsive-modal { --height: 75%; --width: 460px; --border-radius: 16px; }
}
</style>