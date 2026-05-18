<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/fincas/${idFinca}/animales/${numeroArete}`" />
        </ion-buttons>
        <ion-title>Historial de Pesos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" color="primary" />
      </div>

      <div v-else-if="history.length === 0" class="empty">
        <ion-icon :icon="pulseOutline" />
        <h3>Sin historial</h3>
        <p>Aún no hay pesajes registrados.</p>
      </div>

      <div v-else class="container">
        <div class="summary">
          <div class="stat">
            <span class="label">Pesajes</span>
            <span class="value">{{ history.length }}</span>
          </div>
          <div class="divider" />
          <div class="stat">
            <span class="label">Último peso</span>
            <span class="value accent">{{ history[0]?.peso_kg }}<small>kg</small></span>
          </div>
          <div v-if="totalGain !== null" class="divider" />
          <div v-if="totalGain !== null" class="stat">
            <span class="label">Ganancia total</span>
            <span class="value" :class="ganClass(totalGain)">
              {{ totalGain > 0 ? '+' : '' }}{{ totalGain }}<small>kg</small>
            </span>
          </div>
        </div>

        <div class="timeline-header">
          <ion-icon :icon="timeOutline" />
          Registro cronológico
        </div>

        <div class="timeline">
          <div
            v-for="(item, i) in history"
            :key="item.id"
            class="item"
            :class="{ latest: i === 0 }"
          >
            <div class="marker">
              <div class="dot" :class="{ latest: i === 0 }" />
              <div v-if="i !== history.length - 1" class="line" />
            </div>
            <div class="card">
              <div class="row">
                <div class="weight">
                  <span class="num">{{ item.peso_kg }}</span>
                  <span class="unit">kg</span>
                </div>
                <div v-if="item.ganancia_kg !== null" class="gain" :class="ganClass(item.ganancia_kg)">
                  <ion-icon :icon="gainIcon(item.ganancia_kg)" />
                  {{ Math.abs(item.ganancia_kg) }} kg
                </div>
              </div>
              <div class="meta">
                <span>
                  <ion-icon :icon="calendarOutline" />
                  {{ formatDate(item.fecha) }}
                </span>
                <span :class="`metodo-${item.metodo}`">
                  <ion-icon :icon="item.metodo === 'fotografia' ? cameraOutline : createOutline" />
                  {{ item.metodo === 'fotografia' ? 'IA' : 'Manual' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonIcon, IonSpinner,
} from '@ionic/vue';
import {
  pulseOutline, timeOutline, calendarOutline, cameraOutline,
  createOutline, arrowUpOutline, arrowDownOutline, removeOutline,
} from 'ionicons/icons';
import { historialService } from '@/services/historial.service';
import { useToast } from '@/composables/useToast';

interface Item {
  id: number;
  fecha: string;
  peso_kg: number;
  metodo: string;
  ganancia_kg: number | null;
}

const route = useRoute();
const toast = useToast();

const idFinca     = Number(route.params.idFinca);
const numeroArete = String(route.params.numeroArete);

const loading   = ref(false);
const history   = ref<Item[]>([]);
const totalGain = ref<number | null>(null);

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const data = await historialService.getReporte(idFinca, numeroArete);
    const raw = (data.historial ?? []) as Item[];

    const sortedAsc = [...raw].sort((a, b) =>
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    if (sortedAsc.length > 1) {
      totalGain.value = Number((sortedAsc[sortedAsc.length-1].peso_kg - sortedAsc[0].peso_kg).toFixed(2));
    }

    history.value = [...sortedAsc].reverse().map((item, i, arr) => {
      const older = arr[i + 1];
      return {
        ...item,
        ganancia_kg: older ? Number((item.peso_kg - older.peso_kg).toFixed(2)) : null,
      };
    });
  } catch {
    await toast.error('Error al cargar el historial.');
  } finally {
    loading.value = false;
  }
}

function gainIcon(g: number) {
  if (g > 0) return arrowUpOutline;
  if (g < 0) return arrowDownOutline;
  return removeOutline;
}

function ganClass(g: number) {
  if (g > 0) return 'positive';
  if (g < 0) return 'negative';
  return 'neutral';
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
.empty ion-icon { font-size: 3rem; opacity: 0.3; margin-bottom: 12px; }
.empty h3 { color: rgba(255,255,255,0.7); margin: 0 0 6px; }

.container { padding: 20px 16px 40px; }

.summary {
  background: linear-gradient(135deg, #0F2E2E, #164545);
  border: 1px solid rgba(0,184,148,0.2);
  border-radius: 18px;
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-bottom: 24px;
}
.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.label {
  font-size: 0.68rem;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #E8F4F0;
}
.value small {
  font-size: 0.8rem;
  font-weight: 400;
  color: rgba(255,255,255,0.5);
  margin-left: 3px;
}
.value.accent   { color: #00B894; }
.value.positive { color: #00B894; }
.value.negative { color: #E74C3C; }
.value.neutral  { color: rgba(255,255,255,0.7); }
.divider {
  width: 1px;
  height: 32px;
  background: rgba(255,255,255,0.08);
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 14px;
  padding-left: 4px;
}

.timeline {
  display: flex;
  flex-direction: column;
}

.item {
  display: flex;
  gap: 14px;
}

.marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  padding-top: 16px;
}
.dot {
  width: 14px; height: 14px;
  border-radius: 50%;
  background: rgba(0,184,148,0.2);
  border: 2px solid rgba(0,184,148,0.5);
}
.dot.latest {
  background: #00B894;
  border-color: #00B894;
  box-shadow: 0 0 0 4px rgba(0,184,148,0.15);
}
.line {
  width: 2px;
  flex: 1;
  background: rgba(255,255,255,0.06);
  margin-top: 4px;
}

.card {
  flex: 1;
  background: #0F2E2E;
  border: 1px solid rgba(0,184,148,0.1);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
}
.item.latest .card {
  border-color: rgba(0,184,148,0.4);
  background: linear-gradient(135deg, #0F2E2E, #164545);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.weight {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.weight .num {
  font-size: 1.5rem;
  font-weight: 800;
  color: #E8F4F0;
}
.item.latest .weight .num { color: #00B894; }
.weight .unit {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.45);
}

.gain {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 700;
}
.gain ion-icon { font-size: 0.9rem; }
.gain.positive { background: rgba(0,184,148,0.15); color: #00B894; }
.gain.negative { background: rgba(231,76,60,0.15); color: #E74C3C; }
.gain.neutral  { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); }

.meta {
  display: flex;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.05);
  font-size: 0.75rem;
  color: rgba(255,255,255,0.5);
}
.meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.metodo-fotografia { color: #00B894; }
.metodo-manual { color: #F39C12; }
</style>