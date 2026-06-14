<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/fincas/${idFinca}/animales/${numeroArete}`" />
        </ion-buttons>
        <ion-title>Pesaje</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="container">
        <div class="photo-zone" :class="{ 'has-photo': photoPreview }" @click="!photoPreview && openPhotoOptions()">
          <img v-if="photoPreview" :src="photoPreview" class="photo-img" />
          <div v-else class="photo-placeholder">
            <div class="camera-icon"><ion-icon :icon="cameraOutline" /></div>
            <p>Toca para tomar o seleccionar foto</p>
            <p class="sub">JPG, PNG · Máx. 10MB</p>
          </div>
        </div>

        <div v-if="photoBlob && !result" class="params-card">
          <h3>Parámetros</h3>
          <div class="param">
            <label>Distancia (m)</label>
            <div class="chips">
              <button v-for="d in [1,2,3,5,7]" :key="d" class="chip" :class="{active: Number(distance) === d}" @click="distance = String(d)">{{d}}m</button>
              <input v-model="distance" type="number" step="0.5" min="0.5" max="20" class="dist-input" placeholder="Otro" />
            </div>
          </div>
          <div class="param">
            <label>Ángulo</label>
            <div class="chips">
              <button v-for="a in angles" :key="a.value" class="chip" :class="{active: angle === a.value}" @click="angle = a.value">{{a.label}}</button>
            </div>
          </div>
        </div>

        <transition name="result">
          <div v-if="result" class="result-card" :class="result.bovine_detected !== false ? 'success' : 'warning'">
            <div v-if="result.peso !== undefined">
              <div class="result-header">
                <ion-icon :icon="pulseOutline" />
                <span>Peso estimado</span>
              </div>
              <div class="result-weight">
                <span class="num">{{ result.peso }}</span>
                <span class="unit">kg</span>
              </div>
              <div v-if="result.confianza" class="confidence">
                <div class="conf-label">
                  <span>Confianza</span>
                  <span>{{ Math.round(result.confianza * 100) }}%</span>
                </div>
                <div class="conf-track">
                  <div class="conf-fill" :style="{width: `${Math.round(result.confianza*100)}%`}"></div>
                </div>
              </div>
              <p v-if="distance" class="meta">
                <ion-icon :icon="informationCircleOutline" />
                {{ distance }}m · {{ angleLabel(angle) }}
              </p>
            </div>
            <div v-else class="warning-content">
              <ion-icon :icon="warningOutline" />
              <p>{{ result.warning }}</p>
            </div>
          </div>
        </transition>

        <div class="actions">
          <!-- Botones separados: Cámara y Galería -->
          <div class="photo-btns">
            <button class="action-btn photo-btn" @click="openCamera">
              <ion-icon :icon="cameraOutline" />
              Cámara
            </button>
            <button class="action-btn photo-btn" @click="openGallery">
              <ion-icon :icon="imagesOutline" />
              Galería
            </button>
          </div>

          <transition name="fade">
            <button v-if="photoBlob && !result" class="action-btn success" :disabled="loading" @click="estimar">
              <ion-icon v-if="!loading" :icon="scaleOutline" />
              <span v-if="!loading">Estimar peso</span>
              <span v-else class="loader"><span class="dot"/><span class="dot"/><span class="dot"/></span>
            </button>
          </transition>

          <transition name="fade">
            <button v-if="result" class="action-btn primary" @click="reset">
              <ion-icon :icon="refreshOutline" />
              Nueva estimación
            </button>
          </transition>

          <button class="action-btn outline" @click="showManual = !showManual">
            <ion-icon :icon="createOutline" />
            Ingresar manual
          </button>

          <transition name="fade">
            <div v-if="showManual" class="manual">
              <input v-model="manualWeight" type="number" placeholder="Peso en kg" class="form-input" />
              <button class="action-btn success" :disabled="loading" @click="guardarManual">
                {{ loading ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </transition>
        </div>

        <p class="disclaimer">
          <ion-icon :icon="informationCircleOutline" />
          Esta estimación es de apoyo en campo. Use báscula certificada para transacciones formales.
        </p>
      </div>
    </ion-content>

    <!-- Input oculto para galería -->
    <input
      ref="galleryInput"
      type="file"
      accept="image/*"
      style="display:none"
      @change="onFileSelected"
    />

    <!-- Input oculto para cámara (capture=environment = cámara trasera) -->
    <input
      ref="cameraInput"
      type="file"
      accept="image/*"
      capture="environment"
      style="display:none"
      @change="onFileSelected"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonIcon,
} from '@ionic/vue';
import {
  cameraOutline, scaleOutline, createOutline, refreshOutline,
  pulseOutline, warningOutline, informationCircleOutline, imagesOutline,
} from 'ionicons/icons';
import { historialService } from '@/services/historial.service';
import { useToast } from '@/composables/useToast';

const route = useRoute();
const toast = useToast();

const idFinca     = Number(route.params.idFinca);
const numeroArete = String(route.params.numeroArete);

const loading      = ref(false);
const photoBlob    = ref<File | null>(null);
const photoPreview = ref<string | null>(null);
const result       = ref<any>(null);
const distance     = ref<string>('3');
const angle        = ref<string>('lateral');
const manualWeight = ref('');
const showManual   = ref(false);

// Referencias a los inputs ocultos
const galleryInput = ref<HTMLInputElement | null>(null);
const cameraInput  = ref<HTMLInputElement | null>(null);

const angles = [
  { value: 'lateral',   label: 'Flanco' },
  { value: 'diagonal',  label: 'Diagonal' },
  { value: 'frontal',   label: 'Frontal' },
  { value: 'posterior', label: 'Trasero' },
];

function angleLabel(v: string) {
  return angles.find(a => a.value === v)?.label.toLowerCase() ?? v;
}

// Abrir cámara trasera directamente
function openCamera() {
  result.value = null;
  cameraInput.value?.click();
}

// Abrir galería del dispositivo
function openGallery() {
  result.value = null;
  galleryInput.value?.click();
}

// Fallback: si toca la zona de foto, ofrece ambas opciones
function openPhotoOptions() {
  openCamera();
}

// Handler compartido para ambos inputs
function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  photoBlob.value = file;
  photoPreview.value = URL.createObjectURL(file);
  result.value = null;
  // Limpiar el input para permitir seleccionar la misma foto de nuevo
  (e.target as HTMLInputElement).value = '';
}

async function estimar() {
  if (!photoBlob.value) return;
  if (!distance.value || Number(distance.value) <= 0) {
    await toast.warning('Indica la distancia.');
    return;
  }

  loading.value = true;
  try {
    const h = await historialService.createFromPhoto(
      idFinca, numeroArete, photoBlob.value,
      Number(distance.value), angle.value,
    );
    result.value = {
      bovine_detected: true,
      peso: h.peso,
      confianza: h.confianza,
    };
    await toast.success('Pesaje registrado.');
  } catch (err: any) {
    const msg = err.response?.data?.error
             ?? err.response?.data?.message
             ?? 'No se pudo estimar el peso.';
    result.value = { bovine_detected: false, warning: msg };
    await toast.error(msg);
  } finally {
    loading.value = false;
  }
}

async function guardarManual() {
  if (!manualWeight.value) return;
  loading.value = true;
  try {
    await historialService.createManual(idFinca, numeroArete, Number(manualWeight.value));
    await toast.success('Peso registrado.');
    manualWeight.value = '';
    showManual.value = false;
  } catch {
    await toast.error('Error al guardar.');
  } finally {
    loading.value = false;
  }
}

function reset() {
  result.value = null;
  photoBlob.value = null;
  photoPreview.value = null;
}
</script>

<style scoped>
ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }
ion-content { --background: #071a1a; }

.container {
  padding: 16px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.photo-zone {
  border-radius: 18px;
  overflow: hidden;
  background: #0F2E2E;
  border: 2px dashed rgba(0,184,148,0.3);
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.photo-zone.has-photo { border: none; cursor: default; }
.photo-img { width: 100%; max-height: 320px; object-fit: cover; display: block; }

.photo-placeholder { text-align: center; padding: 32px; }
.camera-icon {
  width: 60px; height: 60px; border-radius: 18px;
  background: rgba(0,184,148,0.15);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
  color: #00B894;
}
.camera-icon ion-icon { font-size: 1.8rem; }
.photo-placeholder p { color: #E8F4F0; font-weight: 600; margin: 0 0 4px; }
.photo-placeholder .sub { color: rgba(255,255,255,0.35); font-size: 0.78rem; font-weight: 400; }

.params-card {
  background: #0F2E2E;
  border: 1px solid rgba(0,184,148,0.15);
  border-radius: 16px;
  padding: 16px;
}
.params-card h3 {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 14px;
}

.param { margin-bottom: 14px; }
.param:last-child { margin-bottom: 0; }
.param label {
  display: block;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.7);
  margin-bottom: 8px;
}

.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  background: rgba(255,255,255,0.05);
  border: 1.5px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.chip.active {
  background: rgba(0,184,148,0.2);
  border-color: #00B894;
  color: #00B894;
}

.dist-input {
  background: rgba(255,255,255,0.05);
  border: 1.5px solid rgba(255,255,255,0.1);
  color: #E8F4F0;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.85rem;
  width: 80px;
  outline: none;
  font-family: inherit;
}

.result-card {
  border-radius: 20px;
  padding: 20px;
  border: 1px solid transparent;
}
.result-card.success {
  background: linear-gradient(135deg, #0F2E2E, #164545);
  border-color: rgba(0,184,148,0.3);
}
.result-card.warning {
  background: linear-gradient(135deg, #3B2A0F, #5A4014);
  border-color: rgba(241,196,15,0.4);
}

.result-header {
  display: flex; align-items: center; gap: 8px;
  color: rgba(255,255,255,0.6);
  font-size: 0.78rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 1px;
  margin-bottom: 12px;
}

.result-weight {
  display: flex; align-items: baseline; gap: 6px;
  margin-bottom: 16px;
}
.result-weight .num {
  font-size: 3.2rem; font-weight: 800;
  color: #00B894; line-height: 1;
}
.result-weight .unit {
  font-size: 1.3rem; color: rgba(255,255,255,0.5);
}

.confidence { margin-bottom: 12px; }
.conf-label {
  display: flex; justify-content: space-between;
  font-size: 0.78rem; margin-bottom: 6px;
  color: rgba(255,255,255,0.6);
}
.conf-label span:last-child { color: #00B894; font-weight: 700; }
.conf-track {
  height: 6px;
  background: rgba(255,255,255,0.08);
  border-radius: 3px;
  overflow: hidden;
}
.conf-fill {
  height: 100%;
  background: linear-gradient(90deg, #00B894, #00D2A0);
  transition: width 1s;
}

.meta {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.08);
  font-size: 0.78rem;
  color: rgba(255,255,255,0.45);
  display: flex; align-items: center; gap: 6px;
}

.warning-content {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #F1C40F;
}
.warning-content ion-icon { font-size: 1.4rem; }
.warning-content p { margin: 0; font-size: 0.95rem; }

.actions {
  display: flex; flex-direction: column; gap: 10px;
}

/* Botones de foto en fila */
.photo-btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.action-btn {
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.action-btn ion-icon { font-size: 1.2rem; }
.action-btn:disabled { opacity: 0.6; }

.action-btn.primary {
  background: rgba(255,255,255,0.05);
  color: #E8F4F0;
  border: 1.5px solid rgba(0,184,148,0.2);
}
.action-btn.success {
  background: linear-gradient(135deg, #00B894, #009B7D);
  color: white;
  box-shadow: 0 4px 16px rgba(0,184,148,0.3);
}
.action-btn.outline {
  background: transparent;
  color: rgba(255,255,255,0.6);
  border: 1.5px solid rgba(255,255,255,0.1);
}

/* Botones de foto: cámara verde, galería outline */
.photo-btn {
  background: rgba(255,255,255,0.05);
  color: #E8F4F0;
  border: 1.5px solid rgba(0,184,148,0.3);
}
.photo-btn:first-child {
  background: rgba(0,184,148,0.15);
  border-color: #00B894;
  color: #00B894;
}

.manual {
  background: #0F2E2E;
  border: 1px solid rgba(0,184,148,0.15);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-input {
  background: rgba(255,255,255,0.05);
  border: 1.5px solid rgba(255,255,255,0.1);
  color: #E8F4F0;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 0.95rem;
  outline: none;
  font-family: inherit;
}
.form-input:focus { border-color: #00B894; }

.disclaimer {
  display: flex; align-items: flex-start; gap: 6px;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.35);
  line-height: 1.5;
  margin: 0;
}
.disclaimer ion-icon { font-size: 0.95rem; flex-shrink: 0; margin-top: 1px; }

.loader { display: flex; gap: 5px; }
.dot {
  width: 7px; height: 7px;
  background: currentColor;
  border-radius: 50%;
  animation: pulse 1.2s ease-in-out infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse {
  0%,80%,100% { transform: scale(0.6); opacity: 0.4; }
  40%         { transform: scale(1);   opacity: 1; }
}

.result-enter-active, .fade-enter-active { transition: all 0.3s; }
.result-leave-active, .fade-leave-active { transition: all 0.2s; }
.result-enter-from, .fade-enter-from { opacity: 0; transform: translateY(8px); }
.result-leave-to, .fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>