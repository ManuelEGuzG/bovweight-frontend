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
      <div v-if="loading" class="spinner-container">
        <ion-spinner name="crescent" />
      </div>

      <div v-else-if="data" class="container animate-fade-in">
        <div class="dashboard-hero">
          <div class="hero-details">
            <h1>{{ data.finca.nombre }}</h1>
            <p v-if="data.finca.ubicacion">
              <ion-icon :icon="calendarOutline" class="inline-icon" />
              {{ data.finca.ubicacion }}
            </p>
          </div>
          <div class="hero-metric-card">
            <div class="metric-icon-wrapper">
              <ion-icon :icon="leafOutline" />
            </div>
            <div class="metric-data">
              <span class="num">{{ data.total_animales }}</span>
              <span class="label">Animales activos</span>
            </div>
          </div>
        </div>

        <div class="export-section">
          <h2 class="section-title">
            <ion-icon :icon="downloadOutline" />
            Exportar y compartir
          </h2>

          <div class="export-grid">
            <button class="export-btn excel" :disabled="downloading" @click="exportExcel">
              <div class="icon-circle">
                <ion-icon :icon="documentOutline" />
              </div>
              <div class="btn-content">
                <span class="btn-title">Excel</span>
                <span class="btn-sub">Hoja de cálculo</span>
              </div>
            </button>

            <button class="export-btn pdf" :disabled="downloading" @click="exportPdf">
              <div class="icon-circle">
                <ion-icon :icon="documentTextOutline" />
              </div>
              <div class="btn-content">
                <span class="btn-title">PDF</span>
                <span class="btn-sub">Documento oficial</span>
              </div>
            </button>

            <button class="export-btn whatsapp" @click="shareWhatsApp">
              <div class="icon-circle">
                <ion-icon :icon="logoWhatsapp" />
              </div>
              <div class="btn-content">
                <span class="btn-title">WhatsApp</span>
                <span class="btn-sub">Enviar resumen</span>
              </div>
            </button>
          </div>
        </div>

        <div class="list-section">
          <h2 class="section-title">
            <ion-icon :icon="listOutline" />
            Listado detallado
          </h2>

          <div v-if="data.animales.length === 0" class="empty-state">
            <p>Esta finca no cuenta con animales registrados actualmente.</p>
          </div>

          <div v-else class="animales-grid">
            <div v-for="a in data.animales" :key="a.numero_arete" class="animal-card">
              <div class="animal-avatar" :class="`sex-${a.sexo}`">
                <ion-icon :icon="a.sexo === 'macho' ? maleOutline : femaleOutline" />
              </div>
              
              <div class="animal-details">
                <div class="card-top-row">
                  <h3>{{ a.nombre ?? 'Sin nombre' }}</h3>
                  <span v-if="a.estado" class="estado-badge" :class="`estado-${estadoSlug(a.estado)}`">
                    {{ a.estado }}
                  </span>
                </div>
                
                <p class="animal-meta">
                  <span class="arete-id">#{{ a.numero_arete }}</span>
                  <span class="separator">·</span>
                  <span class="raza-text">{{ a.raza }}</span>
                </p>
                
                <div class="card-stats-row">
                  <span v-if="a.ultimo_peso" class="stat-pill weight">
                    <ion-icon :icon="scaleOutline" />
                    {{ a.ultimo_peso }} kg
                  </span>
                  <span v-if="a.ultima_fecha" class="stat-pill date">
                    <ion-icon :icon="calendarOutline" />
                    {{ formatDate(a.ultima_fecha) }}
                  </span>
                </div>
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
    await toast.error('Error al descargar el Excel.');
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
    await toast.error('Error al descargar el PDF.');
  } finally {
    downloading.value = false;
  }
}

function shareWhatsApp() {
  const finca = data.value.finca;
  const total = data.value.total_animales;

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

  const pesados = data.value.animales
    .filter((a: any) => a.ultimo_peso)
    .sort((a: any, b: any) => b.ultimo_peso - a.ultimo_peso)
    .slice(0, 5);

  if (pesados.length > 0) {
    mensaje += `\n*🏆 Top 5 más pesados:*\n`;
    pesados.forEach((a: any) => {
      mensaje += `• ${a.numero_arete} (${a.nombre ?? 'Sin nombre'}): ${a.ultimo_peso} kg\n`;
    });
  }

  mensaje += `\n_Generado el ${formatDate(new Date().toISOString())}_`;
  mensaje += `\n_BovWeight CR_`;

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

.spinner-container { padding: 60px 0; text-align: center; }
ion-spinner { --color: #00B894; }

.container { padding: 20px 16px 60px; max-width: 1000px; margin: 0 auto; }

/* Dashboard Header Layout */
.dashboard-hero {
  background: linear-gradient(135deg, #0F2E2E 0%, #133A3A 100%);
  border: 1.5px solid rgba(0, 184, 148, 0.18);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 6px 20px rgba(7, 26, 26, 0.25);
}

.hero-details h1 {
  font-size: 1.45rem;
  font-weight: 800;
  color: #E8F4F0;
  margin: 0 0 6px;
  letter-spacing: -0.3px;
}
.hero-details p {
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.85rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.inline-icon { font-size: 0.95rem; color: #00B894; }

/* Métrica Integrada */
.hero-metric-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(7, 26, 26, 0.4);
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}
.metric-icon-wrapper {
  width: 44px; height: 44px;
  background: rgba(0, 184, 148, 0.12);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #00B894; font-size: 1.5rem;
}
.metric-data .num {
  display: block;
  font-size: 1.7rem;
  font-weight: 800;
  color: #E8F4F0;
  line-height: 1.1;
}
.metric-data .label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Títulos de las Secciones */
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin: 0 0 14px;
}

/* Bloque de Exportaciones */
.export-section { margin-bottom: 28px; }
.export-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.export-btn {
  background: #0F2E2E;
  border: 1.5px solid rgba(0, 184, 148, 0.12);
  border-radius: 16px;
  padding: 16px 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-family: inherit;
  transition: all 0.25s ease;
  color: #E8F4F0;
}
.export-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(0, 184, 148, 0.35);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.export-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.icon-circle {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: rgba(7, 26, 26, 0.4);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem;
  transition: transform 0.25s;
}
.export-btn:hover .icon-circle { transform: scale(1.05); }

.export-btn.excel .icon-circle { color: #21A366; background: rgba(33, 163, 102, 0.08); }
.export-btn.pdf .icon-circle { color: #E74C3C; background: rgba(231, 76, 60, 0.08); }
.export-btn.whatsapp .icon-circle { color: #25D366; background: rgba(37, 211, 102, 0.08); }

.btn-content { text-align: center; }
.btn-title { display: block; font-size: 0.88rem; font-weight: 700; color: #E8F4F0; }
.btn-sub { display: block; font-size: 0.68rem; color: rgba(255, 255, 255, 0.4); margin-top: 2px; }

/* Lista de Animales */
.empty-state {
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.4);
  background: #0F2E2E;
  border-radius: 16px;
  border: 1px dashed rgba(0, 184, 148, 0.15);
}

.animales-grid { display: flex; flex-direction: column; gap: 10px; }

.animal-card {
  background: #0F2E2E;
  border: 1.5px solid rgba(0, 184, 148, 0.08);
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 4px 12px rgba(7, 26, 26, 0.15);
}

/* Avatares de Género */
.animal-avatar {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  font-size: 1.4rem;
}
.animal-avatar.sex-macho   { background: rgba(52, 152, 219, 0.12); color: #3498DB; border: 1px solid rgba(52, 152, 219, 0.2); }
.animal-avatar.sex-hembra  { background: rgba(255, 107, 129, 0.12); color: #FF6B81; border: 1px solid rgba(255, 107, 129, 0.2); }

.animal-details { flex: 1; min-width: 0; }

.card-top-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.card-top-row h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #E8F4F0;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Badges de Estados */
.estado-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}
.estado-bien           { background: rgba(0, 184, 148, 0.12); color: #00B894; border: 1px solid rgba(0, 184, 148, 0.15); }
.estado-enfermo        { background: rgba(231, 76, 60, 0.12); color: #E74C3C; border: 1px solid rgba(231, 76, 60, 0.15); }
.estado-medicado, 
.estado-en-tratamiento { background: rgba(243, 156, 18, 0.12); color: #F39C12; border: 1px solid rgba(243, 156, 18, 0.15); }
.estado-muerto         { background: rgba(149, 165, 166, 0.12); color: #95A5A6; border: 1px solid rgba(149, 165, 166, 0.15); }
.estado-vendido        { background: rgba(155, 89, 182, 0.12); color: #af7ac5; border: 1px solid rgba(155, 89, 182, 0.15); }

.animal-meta {
  font-size: 0.8rem;
  margin: 3px 0 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.arete-id { color: #00B894; font-weight: 700; }
.raza-text { color: rgba(255, 255, 255, 0.4); }
.separator { color: rgba(255, 255, 255, 0.2); }

/* Fila de Métricas Inferiores */
.card-stats-row { display: flex; gap: 8px; flex-wrap: wrap; }
.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  padding: 3px 9px;
  border-radius: 8px;
  background: rgba(7, 26, 26, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.03);
}
.stat-pill ion-icon { font-size: 0.85rem; }
.stat-pill.weight { color: #E8F4F0; font-weight: 700; }
.stat-pill.weight ion-icon { color: #00B894; }
.stat-pill.date { color: rgba(255, 255, 255, 0.4); }
.stat-pill.date ion-icon { color: rgba(255, 255, 255, 0.3); }

/* Animación Entrada */
.animate-fade-in {
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Distribución en Tablets y Escritorio */
@media (min-width: 768px) {
  .dashboard-hero {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .hero-metric-card { min-width: 220px; }
  .export-grid { gap: 16px; }
  .export-btn { padding: 20px 12px; }
  .animales-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>