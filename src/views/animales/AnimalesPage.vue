<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/fincas/${idFinca}`" />
        </ion-buttons>
        <ion-title>Animales</ion-title>
        <ion-buttons v-if="canAdd" slot="end">
          <ion-button class="add-btn" @click="$router.push(`/fincas/${idFinca}/animales/nuevo`)">
            <ion-icon slot="icon-only" :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Buscador Integrado Estilizado -->
      <div v-if="animales.length > 0" class="search-container">
        <div class="search-wrapper">
          <ion-icon :icon="searchOutline" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Buscar por arete, nombre o raza..." 
            class="custom-search-input"
          />
          <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
            <ion-icon :icon="closeCircle" />
          </button>
        </div>
      </div>

      <!-- Cabecera de Conteo -->
      <div class="list-header animate-fade-in">
        <h2>
          {{ filteredAnimales.length }} 
          {{ filteredAnimales.length === 1 ? 'animal encontrado' : 'animales encontrados' }}
        </h2>
      </div>

      <!-- Estado de Carga -->
      <div v-if="loading" class="spinner-container">
        <ion-spinner name="crescent" />
      </div>

      <!-- Estado Vacío (Sin registros en la finca) -->
      <div v-else-if="animales.length === 0" class="empty-state animate-fade-in">
        <div class="empty-icon-wrapper">
          <ion-icon :icon="leafOutline" />
        </div>
        <h3>No hay animales registrados</h3>
        <p v-if="canAdd">Comenzá agregando el primer animal con el botón superior.</p>
      </div>

      <!-- Estado Vacío (Con filtros activos) -->
      <div v-else-if="filteredAnimales.length === 0" class="empty-state animate-fade-in">
        <div class="empty-icon-wrapper alert">
          <ion-icon :icon="searchOutline" />
        </div>
        <h3>Sin resultados</h3>
        <p>No se encontraron animales que coincidan con "{{ searchQuery }}".</p>
      </div>

      <!-- Grid Adaptivo de Tarjetas -->
      <div v-else class="animales-grid animate-fade-in">
        <div
          v-for="animal in filteredAnimales"
          :key="animal.numero_arete"
          class="animal-card"
          @click="$router.push(`/fincas/${idFinca}/animales/${animal.numero_arete}`)"
        >
          <div class="animal-avatar" :class="`sex-${animal.sexo}`">
            <ion-icon :icon="animal.sexo === 'macho' ? maleOutline : femaleOutline" />
          </div>

          <div class="animal-details">
            <div class="card-top-row">
              <h3>{{ animal.nombre ?? 'Sin nombre' }}</h3>
              <span 
                v-if="animal.estado" 
                class="estado-badge" 
                :class="`estado-${estadoSlug(animal.estado.nombre_estado)}`"
              >
                {{ animal.estado.nombre_estado }}
              </span>
            </div>
            
            <p class="animal-meta">
              <span class="arete-id">#{{ animal.numero_arete }}</span>
              <span class="separator">·</span>
              <span class="raza-text">{{ animal.raza }}</span>
            </p>
            
            <div v-if="animal.ultimo_peso" class="card-stats-row">
              <span class="stat-pill weight">
                <ion-icon :icon="scaleOutline" />
                {{ animal.ultimo_peso }} kg
              </span>
            </div>
          </div>

          <ion-icon :icon="chevronForwardOutline" class="chevron-arrow" />
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
  scaleOutline, chevronForwardOutline, searchOutline, closeCircle
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
const searchQuery = ref('');

const canAdd = computed(() => authStore.canEditFincas);

// Filtro en tiempo real local para evitar peticiones innecesarias
const filteredAnimales = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return animales.value;
  
  return animales.value.filter(animal => {
    const nombre = (animal.nombre ?? '').toLowerCase();
    const arete = animal.numero_arete.toString().toLowerCase();
    const raza = (animal.raza ?? '').toLowerCase();
    return nombre.includes(query) || arete.includes(query) || raza.includes(query);
  });
});

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

.spinner-container { padding: 60px 0; text-align: center; }
ion-spinner { --color: #00B894; }

/* Buscador Custom Minimalista */
.search-container {
  padding: 16px 16px 8px;
}
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #0F2E2E;
  border: 1.5px solid rgba(0, 184, 148, 0.12);
  border-radius: 14px;
  padding: 0 12px;
  transition: border-color 0.25s;
}
.search-wrapper:focus-within {
  border-color: rgba(0, 184, 148, 0.4);
}
.search-icon {
  color: rgba(255, 255, 255, 0.3);
  font-size: 1.2rem;
}
.custom-search-input {
  width: 100%;
  background: transparent;
  border: none;
  padding: 12px 8px;
  color: #E8F4F0;
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
}
.custom-search-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}
.clear-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
}

/* Cabecera conteo */
.list-header { padding: 12px 20px 8px; }
.list-header h2 {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin: 0;
}

/* Estado Vacío */
.empty-state {
  text-align: center;
  padding: 60px 32px;
  color: rgba(255, 255, 255, 0.4);
}
.empty-icon-wrapper {
  width: 70px; height: 70px;
  background: rgba(0, 184, 148, 0.08);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  color: #00B894; font-size: 2.2rem;
}
.empty-icon-wrapper.alert {
  background: rgba(243, 156, 18, 0.08);
  color: #F39C12;
}
.empty-state h3 { color: #E8F4F0; font-size: 1.1rem; font-weight: 600; margin: 0 0 6px; }
.empty-state p { font-size: 0.88rem; margin: 0; line-height: 1.4; }

/* Grid de Animales */
.animales-grid {
  padding: 0 16px 120px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.animal-card {
  background: #0F2E2E;
  border: 1.5px solid rgba(0, 184, 148, 0.08);
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(7, 26, 26, 0.15);
  transition: border-color 0.25s, transform 0.2s;
}
.animal-card:hover {
  border-color: rgba(0, 184, 148, 0.3);
  transform: translateY(-1px);
}

/* Avatar de Género */
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
  margin: 3px 0 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.arete-id { color: #00B894; font-weight: 700; }
.raza-text { color: rgba(255, 255, 255, 0.4); }
.separator { color: rgba(255, 255, 255, 0.2); }

/* Bloque Peso */
.card-stats-row { display: flex; gap: 8px; }
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
.stat-pill.weight { color: #E8F4F0; font-weight: 700; }
.stat-pill.weight ion-icon { color: #00B894; font-size: 0.85rem; }

.chevron-arrow {
  color: rgba(255, 255, 255, 0.25);
  font-size: 1.1rem;
  flex-shrink: 0;
  transition: transform 0.2s;
}
.animal-card:hover .chevron-arrow {
  transform: translateX(2px);
  color: rgba(0, 184, 148, 0.6);
}

/* Animaciones */
.animate-fade-in {
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Soporte Responsivo (Tablets y Desktop) */
@media (min-width: 768px) {
  .search-container { max-width: 500px; margin: 0 auto; padding-top: 24px; }
  .list-header { max-width: 1000px; margin: 0 auto; padding-left: 16px; }
  .animales-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    max-width: 1000px;
    margin: 0 auto;
  }
}
</style>