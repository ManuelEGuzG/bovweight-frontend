<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/fincas/${idFinca}`" />
        </ion-buttons>
        <ion-title>Reporte de Finca</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" color="primary" />
      </div>

      <div v-else-if="data" class="container">
        <div class="hero">
          <h1>{{ data.finca.nombre }}</h1>
          <p v-if="data.finca.ubicacion">{{ data.finca.ubicacion }}</p>
        </div>

        <div class="summary">
          <div class="summary-stat">
            <ion-icon :icon="leafOutline" />
            <div>
              <span class="num">{{ data.total_animales }}</span>
              <span class="label">Animales registrados</span>
            </div>
          </div>
        </div>

        <!-- Botones de exportar y compartir -->
        <div class="export-section">
          <h2 class="section-title">
            <ion-icon :icon="downloadOutline" />
            Exportar y compartir
          </h2>

          <div class="export-grid">
            <button class="export-btn excel" :disabled="downloading" @click="exportExcel">
              <ion-icon :icon="documentOutline" />
              <div class="btn-content">
                <span class="btn-title">Excel</span>
                <span class="btn-sub">Hoja de cálculo</span>
              </div>
            </button>

            <button class="export-btn pdf" :disabled="downloading" @click="exportPdf">
              <ion-icon :icon="documentTextOutline" />
              <div class="btn-content">
                <span class="btn-title">PDF</span>
                <span class="btn-sub">Documento</span>
              </div>
            </button>

            <button class="export-btn whatsapp" @click="shareWhatsApp">
              <ion-icon :icon="logoWhatsapp" />
              <div class="btn-content">
                <span class="btn-title">WhatsApp</span>
                <span class="btn-sub">Compartir resumen</span>
              </div>
            </button>
          </div>
        </div>

        <h2 class="section-title">
          <ion-icon :icon="listOutline" />
          Listado de animales
        </h2>

        <div v-if="data.animales.length === 0" class="empty">
          <p>Esta finca no tiene animales registrados.</p>
        </div>

        <div v-else class="animales-list">
          <div v-for="a in data.animales" :key="a.numero_arete" class="animal-row">
            <div class="row-icon" :class="`sex-${a.sexo}`">
              <ion-icon :icon="a.sexo === 'macho' ? maleOutline : femaleOutline" />
            </div>
            <div class="row-info">
              <div class="row-header">
                <h3>{{ a.nombre ?? 'Sin nombre' }}</h3>
                <span v-if="a.estado" class="estado" :class="`estado-${estadoSlug(a.estado)}`">
                  {{ a.estado }}
                </span>
              </div>
              <p class="row-tag">{{ a.numero_arete }} · {{ a.raza }}</p>
              <div class="row-stats">
                <span v-if="a.ultimo_peso" class="stat">
                  <ion-icon :icon="scaleOutline" />
                  {{ a.ultimo_peso }} kg
                </span>
                <span v-if="a.ultima_fecha" class="stat date">
                  <ion-icon :icon="calendarOutline" />
                  {{ formatDate(a.ultima_fecha) }}
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
  leafOutline, listOutline, maleOutline, femaleOutline,
  scaleOutline, calendarOutline, downloadOutline,
  documentOutline, documentTextOutline, logoWhatsapp,
} from 'ionicons/icons';
import api from '@/services/api';
import { reporteService } from '@/services/reporte.service';
import { useToast } from '@/composables/useToast';

const route = useRoute();
const toast = useToast();

const idFinca     = Number(route.params.idFinca);
const data        = ref<any>(null);
const loading     = ref(false);
const downloading = ref(false);

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const response = await api.get(`/fincas/${idFinca}/reporte`);
    data.value = response.data;
  } catch {
    await toast.error('Error al cargar el reporte.');
  } finally {
    loading.value = false;
  }
}

async function exportExcel() {
  downloading.value = true;
  try {
    const blob = await reporteService.downloadExcel(idFinca);
    downloadFile(blob, `Reporte_${data.value.finca.nombre}_${getDate()}.xlsx`);
    await toast.success('Reporte Excel descargado.');
  } catch {
    await toast.error('Error al descargar Excel.');
  } finally {
    downloading.value = false;
  }
}

async function exportPdf() {
  downloading.value = true;
  try {
    const blob = await reporteService.downloadPdf(idFinca);
    downloadFile(blob, `Reporte_${data.value.finca.nombre}_${getDate()}.pdf`);
    await toast.success('Reporte PDF descargado.');
  } catch {
    await toast.error('Error al descargar PDF.');
  } finally {
    downloading.value = false;
  }
}

function shareWhatsApp() {
  const finca = data.value.finca;
  const total = data.value.total_animales;

  // Resumen de estados
  const porEstado: Record<string, number> = {};
  data.value.animales.forEach((a: any) => {
    if (a.estado) {
      porEstado[a.estado] = (porEstado[a.estado] || 0) + 1;
    }
  });

  let mensaje = `📊 *Reporte BovWeight CR*\n\n`;
  mensaje += `🏡 *${finca.nombre}*\n`;
  if (finca.ubicacion) mensaje += `📍 ${finca.ubicacion}\n`;
  if (finca.hectareas) mensaje += `📐 ${finca.hectareas} hectáreas\n`;
  mensaje += `\n🐄 *Total animales:* ${total}\n`;

  if (Object.keys(porEstado).length > 0) {
    mensaje += `\n*Por estado:*\n`;
    for (const [estado, cantidad] of Object.entries(porEstado)) {
      mensaje += `• ${estado}: ${cantidad}\n`;
    }
  }

  // Top 5 más pesados
  const pesados = data.value.animales
    .filter((a: any) => a.ultimo_peso)
    .sort((a: any, b: any) => b.ultimo_peso - a.ultimo_peso)
    .slice(0, 5);

  if (pesados.length > 0) {
    mensaje += `\n*🏆 Animales con mayor peso:*\n`;
    pesados.forEach((a: any) => {
      mensaje += `• ${a.numero_arete} (${a.nombre ?? 'Sin nombre'}): ${a.ultimo_peso} kg\n`;
    });
  }

  mensaje += `\n_Generado el ${formatDate(new Date().toISOString())}_`;
  mensaje += `\n_BovWeight CR · UCR_`;

  const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}

function downloadFile(blob: Blob, filename: string) {
  const url  = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function getDate(): string {
  return new Date().toISOString().split('T')[0];
}

function estadoSlug(nombre: string): string {
  return nombre.toLowerCase().replace(/\s+/g, '-')
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

.container { padding: 20px 16px 40px; }

.hero {
  background: linear-gradient(135deg, #0F2E2E, #164545);
  border: 1px solid rgba(0,184,148,0.2);
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 14px;
}
.hero h1 {
  font-size: 1.4rem;
  font-weight: 800;
  color: #E8F4F0;
  margin: 0 0 4px;
}
.hero p {
  color: rgba(255,255,255,0.55);
  font-size: 0.85rem;
  margin: 0;
}

.summary {
  background: #0F2E2E;
  border: 1px solid rgba(0,184,148,0.1);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 20px;
}

.summary-stat { display: flex; align-items: center; gap: 14px; }
.summary-stat ion-icon { font-size: 2rem; color: #00B894; }
.summary-stat .num {
  display: block;
  font-size: 1.8rem;
  font-weight: 800;
  color: #E8F4F0;
  line-height: 1;
}
.summary-stat .label {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.5);
  margin-top: 2px;
}

/* Export Section */
.export-section { margin-bottom: 24px; }

.export-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

.export-btn {
  background: #0F2E2E;
  border: 1.5px solid rgba(0,184,148,0.15);
  border-radius: 14px;
  padding: 16px 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-family: inherit;
  transition: all 0.2s;
  color: #E8F4F0;
}

.export-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(0,184,148,0.4);
}

.export-btn:disabled { opacity: 0.5; }

.export-btn ion-icon {
  font-size: 1.8rem;
}

.btn-content { text-align: center; }

.btn-title {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: #E8F4F0;
}

.btn-sub {
  display: block;
  font-size: 0.68rem;
  color: rgba(255,255,255,0.5);
  margin-top: 2px;
}

.export-btn.excel ion-icon { color: #21A366; }
.export-btn.pdf ion-icon { color: #E74C3C; }
.export-btn.whatsapp ion-icon { color: #25D366; }

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin: 0 0 14px;
}

.empty {
  text-align: center;
  padding: 40px;
  color: rgba(255,255,255,0.4);
  background: #0F2E2E;
  border-radius: 14px;
}

.animales-list { display: flex; flex-direction: column; gap: 8px; }

.animal-row {
  background: #0F2E2E;
  border: 1px solid rgba(0,184,148,0.1);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.row-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.row-icon ion-icon { font-size: 1.4rem; }
.row-icon.sex-macho   { background: rgba(52,152,219,0.15); color: #3498DB; }
.row-icon.sex-hembra  { background: rgba(255,107,129,0.15); color: #FF6B81; }

.row-info { flex: 1; min-width: 0; }

.row-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}
.row-header h3 {
  font-size: 0.92rem;
  font-weight: 700;
  color: #E8F4F0;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.estado {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 8px;
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

.row-tag {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.5);
  margin: 0 0 6px;
}

.row-stats { display: flex; gap: 12px; }

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  color: rgba(255,255,255,0.6);
  font-weight: 600;
}
.stat ion-icon { font-size: 0.85rem; color: #00B894; }
.stat.date { color: rgba(255,255,255,0.4); font-weight: 400; }
.stat.date ion-icon { color: rgba(255,255,255,0.4); }
</style>