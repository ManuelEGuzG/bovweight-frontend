<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/fincas" />
        </ion-buttons>
        <ion-title>Gestión de Usuarios</ion-title>
        <ion-buttons slot="end">
          <ion-button class="add-user-btn" @click="showCreate = true">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="spinner-container">
        <ion-spinner name="crescent" />
      </div>

      <div v-else class="container animate-fade-in">
        <div class="header-info">
          <h2>{{ personas.length }} usuarios registrados</h2>
        </div>

        <div class="personas-grid">
          <div v-for="p in personas" :key="p.cedula" class="persona-card">
            <div class="persona-icon" :class="`rol-${rolSlug(p.rol?.nombre)}`">
              <ion-icon :icon="personOutline" />
            </div>
            
            <div class="persona-info">
              <h3>{{ p.nombre }} {{ p.apellidos }}</h3>
              <p class="correo">{{ p.correo }}</p>
              
              <div class="chips">
                <span class="chip rol" :class="`rol-${rolSlug(p.rol?.nombre)}`">
                  {{ p.rol?.nombre }}
                </span>
                <span v-if="p.fincas_count !== undefined" class="chip finca-count">
                  <ion-icon :icon="homeOutline" />
                  {{ p.fincas_count }} {{ p.fincas_count === 1 ? 'finca' : 'fincas' }}
                </span>
              </div>
            </div>
            
            <div class="actions">
              <ion-button v-if="p.rol?.nombre !== 'Administrador'" fill="clear" size="small" class="action-btn assign" @click="openAsignar(p)">
                <ion-icon :icon="businessOutline" slot="icon-only" />
              </ion-button>
              <ion-button fill="clear" size="small" class="action-btn delete" @click="confirmDelete(p)">
                <ion-icon :icon="trashOutline" slot="icon-only" />
              </ion-button>
            </div>
          </div>
        </div>
      </div>

      <ion-modal :is-open="showCreate" @did-dismiss="resetCreate" class="custom-modal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Nuevo Usuario</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="resetCreate">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        
        <ion-content class="ion-padding modal-dark-content">
          <div class="form-wrapper">
            <div class="form-grid-fields">
              <div class="form-field">
                <label>Cédula *</label>
                <input v-model="newForm.cedula" class="form-input" placeholder="102340567" />
              </div>
              <div class="form-field">
                <label>Nombre *</label>
                <input v-model="newForm.nombre" class="form-input" placeholder="Ej. Juan" />
              </div>
              <div class="form-field">
                <label>Apellidos *</label>
                <input v-model="newForm.apellidos" class="form-input" placeholder="Ej. Pérez" />
              </div>
              <div class="form-field">
                <label>Correo electrónico *</label>
                <input v-model="newForm.correo" type="email" class="form-input" placeholder="ejemplo@bovweight.com" />
              </div>
              <div class="form-field">
                <label>Contacto</label>
                <input v-model="newForm.contacto" class="form-input" placeholder="Ej. 88889999" />
              </div>
              <div class="form-field">
                <label>Rol de acceso *</label>
                <div class="select-wrapper">
                  <select v-model="newForm.id_rol" class="form-input select-input">
                    <option :value="null" disabled>Selecciona un rol</option>
                    <option v-for="r in roles" :key="r.id_rol" :value="r.id_rol">{{ r.nombre }}</option>
                  </select>
                </div>
              </div>
              <div class="form-field">
                <label>Contraseña *</label>
                <input v-model="newForm.contrasena" type="password" class="form-input" placeholder="••••••••" />
              </div>
              <div class="form-field">
                <label>Confirmar contraseña *</label>
                <input v-model="newForm.contrasena_confirmation" type="password" class="form-input" placeholder="••••••••" />
              </div>
            </div>

            <button class="submit-btn" :disabled="saving" @click="handleCreate">
              {{ saving ? 'Creando...' : 'Crear usuario' }}
            </button>
          </div>
        </ion-content>
      </ion-modal>

      <ion-modal :is-open="showAsignar" @did-dismiss="closeAsignar" class="custom-modal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Asignar Fincas</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeAsignar">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        
        <ion-content class="ion-padding modal-dark-content">
          <div v-if="selectedPersona" class="form-wrapper">
            <div class="info-banner">
              <p class="banner-title">{{ selectedPersona.nombre }} {{ selectedPersona.apellidos }}</p>
              <p class="banner-sub">{{ selectedPersona.rol?.nombre }}</p>
            </div>

            <p class="hint">Selecciona las fincas autorizadas para este usuario:</p>

            <div class="fincas-asign-list">
              <div v-for="f in todasFincas" :key="f.id_finca" class="finca-row-wrapper">
                <label class="finca-checkbox-card" :class="{ checked: fincasSeleccionadas.includes(f.id_finca) }">
                  <input type="checkbox" :value="f.id_finca" v-model="fincasSeleccionadas" />
                  <div class="checkbox-custom"></div>
                  <div class="check-content">
                    <span class="finca-nombre">{{ f.nombre }}</span>
                    <span v-if="f.ubicacion" class="finca-ubic">{{ f.ubicacion }}</span>
                  </div>
                </label>
                
                <div 
                  v-if="fincasSeleccionadas.includes(f.id_finca) && (selectedPersona.rol?.nombre === 'Ganadero')" 
                  class="dueno-action-zone"
                >
                  <label class="dueno-toggle-pill" :class="{ 'is-owner': esDueno(f.id_finca) }">
                    <input type="checkbox" :checked="esDueno(f.id_finca)" @change="toggleDueno(f.id_finca)" />
                    <span>{{ esDueno(f.id_finca) ? 'Dueño ★' : 'Asignar como Dueño' }}</span>
                  </label>
                </div>
              </div>
            </div>

            <button class="submit-btn" :disabled="syncing" @click="handleSyncFincas">
              {{ syncing ? 'Guardando...' : 'Guardar asignaciones' }}
            </button>
          </div>
        </ion-content>
      </ion-modal>

      <AppTabBar />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonBackButton, IonIcon, IonSpinner,
  IonModal, alertController,
} from '@ionic/vue';
import {
  addOutline, closeOutline, trashOutline, personOutline,
  businessOutline, homeOutline,
} from 'ionicons/icons';
import { personaService } from '@/services/persona.service';
import { fincaService } from '@/services/finca.service';
import { catalogoService } from '@/services/catalogo.service';
import { useToast } from '@/composables/useToast';
import AppTabBar from '@/components/AppTabBar.vue';
import type { Persona, Rol, Finca } from '@/types';

const toast = useToast();

const personas     = ref<Persona[]>([]);
const roles        = ref<Rol[]>([]);
const todasFincas = ref<Finca[]>([]);
const loading     = ref(false);
const saving      = ref(false);
const syncing     = ref(false);

const showCreate  = ref(false);
const showAsignar = ref(false);
const selectedPersona     = ref<Persona | null>(null);
const fincasSeleccionadas = ref<number[]>([]);
const fincasDuenos        = ref<Set<number>>(new Set());

const newForm = ref({
  cedula: '', nombre: '', apellidos: '', correo: '',
  contacto: '', id_rol: null as number | null,
  contrasena: '', contrasena_confirmation: '',
});

onMounted(async () => {
  await Promise.all([loadPersonas(), loadRoles(), loadFincas()]);
});

async function loadPersonas() {
  loading.value = true;
  try {
    personas.value = await personaService.getAll();
  } catch {
    await toast.error('Error al cargar usuarios.');
  } finally {
    loading.value = false;
  }
}

async function loadRoles() {
  try {
    roles.value = await catalogoService.getRoles();
  } catch { /* ignore */ }
}

async function loadFincas() {
  try {
    todasFincas.value = await fincaService.getAll();
  } catch { /* ignore */ }
}

async function handleCreate() {
  if (!newForm.value.cedula.trim() || !newForm.value.nombre.trim() || !newForm.value.apellidos.trim()
      || !newForm.value.correo.trim() || !newForm.value.id_rol || !newForm.value.contrasena) {
    await toast.warning('Completa los campos obligatorios.');
    return;
  }

  if (newForm.value.contrasena !== newForm.value.contrasena_confirmation) {
    await toast.warning('Las contraseñas no coinciden.');
    return;
  }

  saving.value = true;
  try {
    await personaService.create({
      cedula:    newForm.value.cedula.trim(),
      nombre:    newForm.value.nombre.trim(),
      apellidos: newForm.value.apellidos.trim(),
      correo:    newForm.value.correo.trim(),
      contacto:  newForm.value.contacto.trim() || undefined,
      id_rol:    newForm.value.id_rol!,
      contrasena: newForm.value.contrasena,
      contrasena_confirmation: newForm.value.contrasena_confirmation,
    });
    await toast.success('Usuario creado con éxito.');
    resetCreate();
    await loadPersonas();
  } catch (err: any) {
    const msg = err.response?.data?.errors?.cedula?.[0]
              ?? err.response?.data?.errors?.correo?.[0]
              ?? err.response?.data?.message
              ?? 'Error al crear el usuario.';
    await toast.error(msg);
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(p: Persona) {
  const alert = await alertController.create({
    header: 'Desactivar Cuenta',
    message: `¿Estás seguro de que deseas revocar el acceso a ${p.nombre} ${p.apellidos}?`,
    cssClass: 'custom-alert-dark',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { text: 'Desactivar', role: 'destructive', handler: () => handleDelete(p.cedula) },
    ],
  });
  await alert.present();
}

async function handleDelete(cedula: string) {
  try {
    await personaService.delete(cedula);
    await toast.success('Usuario desactivado del sistema.');
    await loadPersonas();
  } catch {
    await toast.error('Error al remover el acceso.');
  }
}

async function openAsignar(p: Persona) {
  selectedPersona.value = p;
  fincasSeleccionadas.value = [];
  fincasDuenos.value = new Set();
  showAsignar.value = true;

  try {
    const asignadas = await personaService.getFincas(p.cedula);
    fincasSeleccionadas.value = asignadas.map(f => f.id_finca);
    asignadas.forEach(f => {
      if (f.es_dueno) fincasDuenos.value.add(f.id_finca);
    });
  } catch { /* ignore */ }
}

function esDueno(idFinca: number): boolean {
  return fincasDuenos.value.has(idFinca);
}

function toggleDueno(idFinca: number) {
  if (fincasDuenos.value.has(idFinca)) {
    fincasDuenos.value.delete(idFinca);
  } else {
    fincasDuenos.value.add(idFinca);
  }
}

async function handleSyncFincas() {
  if (!selectedPersona.value) return;

  syncing.value = true;
  try {
    const data = fincasSeleccionadas.value.map(id => ({
      id_finca: id,
      es_dueno: fincasDuenos.value.has(id),
    }));
    await personaService.syncFincas(selectedPersona.value.cedula, data);
    await toast.success('Asignaciones de fincas sincronizadas.');
    closeAsignar();
    await loadPersonas();
  } catch {
    await toast.error('Error al sincronizar fincas.');
  } finally {
    syncing.value = false;
  }
}

function closeAsignar() {
  showAsignar.value = false;
  selectedPersona.value = null;
  fincasSeleccionadas.value = [];
  fincasDuenos.value = new Set();
}

function resetCreate() {
  showCreate.value = false;
  newForm.value = {
    cedula: '', nombre: '', apellidos: '', correo: '',
    contacto: '', id_rol: null,
    contrasena: '', contrasena_confirmation: '',
  };
}

function rolSlug(nombre?: string): string {
  if (!nombre) return '';
  return nombre.toLowerCase()
    .replace(/\s+/g, '-')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
</script>

<style scoped>
/* Estructura de barra de herramientas */
ion-toolbar { 
  --background: #0d2b2b; 
  --color: #E8F4F0; 
  font-family: 'Inter', sans-serif;
}
ion-content { --background: #071a1a; }

.spinner-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}
ion-spinner { --color: #00B894; }

.container { padding: 20px 16px 120px; max-width: 1000px; margin: 0 auto; }

.header-info { padding-bottom: 16px; }
.header-info h2 {
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin: 0;
}

/* Rejilla adaptativa de tarjetas */
.personas-grid { 
  display: grid; 
  grid-template-columns: 1fr; 
  gap: 12px; 
}

.persona-card {
  background: #0F2E2E;
  border: 1.5px solid rgba(0, 184, 148, 0.12);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 4px 16px rgba(7, 26, 26, 0.2);
}

/* Avatares según el Rol */
.persona-icon {
  width: 52px; height: 52px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.persona-icon ion-icon { font-size: 1.5rem; }

.persona-icon.rol-administrador { background: rgba(155, 89, 182, 0.12); color: #af7ac5; border: 1px solid rgba(155, 89, 182, 0.2); }
.persona-icon.rol-ganadero      { background: rgba(0, 184, 148, 0.12);  color: #00B894; border: 1px solid rgba(0, 184, 148, 0.2); }
.persona-icon.rol-asistente     { background: rgba(52, 152, 219, 0.12); color: #5dade2; border: 1px solid rgba(52, 152, 219, 0.2); }
.persona-icon.rol-veterinario   { background: rgba(243, 156, 18, 0.12); color: #f4b41a; border: 1px solid rgba(243, 156, 18, 0.2); }

.persona-info { flex: 1; min-width: 0; }
.persona-info h3 {
  font-size: 0.98rem;
  font-weight: 700;
  color: #E8F4F0;
  margin: 0 0 4px;
  letter-spacing: -0.2px;
}
.correo {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.45);
  margin: 0 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chips { display: flex; gap: 6px; flex-wrap: wrap; }
.chip {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 8px;
  background: rgba(7, 26, 26, 0.4);
  color: rgba(255, 255, 255, 0.55);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.chip ion-icon { font-size: 0.85rem; }
.chip.rol { text-transform: uppercase; letter-spacing: 0.6px; }

.chip.rol.rol-administrador { background: rgba(155, 89, 182, 0.1); color: #af7ac5; border-color: rgba(155, 89, 182, 0.15); }
.chip.rol.rol-ganadero      { background: rgba(0, 184, 148, 0.1);  color: #00B894; border-color: rgba(0, 184, 148, 0.15); }
.chip.rol.rol-asistente     { background: rgba(52, 152, 219, 0.1); color: #5dade2; border-color: rgba(52, 152, 219, 0.15); }
.chip.rol.rol-veterinario   { background: rgba(243, 156, 18, 0.1); color: #f4b41a; border-color: rgba(243, 156, 18, 0.15); }

/* Acciones en Fila */
.actions { display: flex; gap: 4px; }
.action-btn {
  --padding-start: 8px;
  --padding-end: 8px;
  margin: 0;
}
.action-btn.assign { --color: rgba(255, 255, 255, 0.4); }
.action-btn.assign:hover { --color: #00B894; }
.action-btn.delete { --color: rgba(231, 76, 60, 0.5); }
.action-btn.delete:hover { --color: #E74C3C; }

/* Estilos de Modales Avanzados */
.custom-modal {
  --background: #071a1a;
}
.modal-dark-content {
  --background: #071a1a;
  --color: #E8F4F0;
}

.form-wrapper { display: flex; flex-direction: column; gap: 16px; padding-top: 10px; }

.form-grid-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.form-input {
  background: rgba(7, 26, 26, 0.4);
  border: 1.5px solid rgba(0, 184, 148, 0.15);
  border-radius: 12px;
  padding: 13px 16px;
  font-size: 0.95rem;
  color: #E8F4F0;
  font-family: inherit;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.25s ease;
}
.form-input:focus {
  border-color: #00B894;
  background: #123434;
  box-shadow: 0 0 0 4px rgba(0, 184, 148, 0.1);
}
.form-input::placeholder { color: rgba(255,255,255,0.25); }

/* Wrapper para estilizar el selector nativo */
.select-wrapper { position: relative; width: 100%; }
.select-input {
  appearance: none;
  cursor: pointer;
  padding-right: 40px;
}
.select-wrapper::after {
  content: '▼';
  font-size: 0.65rem;
  color: #00B894;
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Banner Informativo de Asignación */
.info-banner {
  background: linear-gradient(135deg, #0F2E2E 0%, #143D3D 100%);
  border: 1.5px solid rgba(0, 184, 148, 0.2);
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.banner-title { font-size: 1.05rem; font-weight: 700; color: #E8F4F0; margin: 0; }
.banner-sub { font-size: 0.78rem; color: #00B894; margin: 4px 0 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

.hint { font-size: 0.88rem; color: rgba(255, 255, 255, 0.5); margin: 4px 0; font-weight: 500; }

/* Lista de Casillas de Fincas */
.fincas-asign-list { display: flex; flex-direction: column; gap: 12px; }

.finca-row-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.finca-checkbox-card {
  background: #0F2E2E;
  border: 1.5px solid rgba(0, 184, 148, 0.12);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.finca-checkbox-card input[type="checkbox"] {
  position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0;
}

/* Checkbox personalizado */
.checkbox-custom {
  height: 20px; width: 20px;
  background: rgba(7, 26, 26, 0.4);
  border: 1.5px solid rgba(0, 184, 148, 0.3);
  border-radius: 6px;
  flex-shrink: 0;
  position: relative;
  transition: all 0.2s ease;
}

.finca-checkbox-card:hover .checkbox-custom { border-color: #00B894; }

.finca-checkbox-card.checked {
  border-color: #00B894;
  background: rgba(0, 184, 148, 0.04);
}

.finca-checkbox-card.checked .checkbox-custom {
  background: #00B894;
  border-color: #00B894;
}

.finca-checkbox-card.checked .checkbox-custom::after {
  content: ""; position: absolute; display: block;
  left: 6px; top: 2px; width: 5px; height: 10px;
  border: solid white; border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.check-content { flex: 1; min-width: 0; }
.finca-nombre { display: block; font-size: 0.95rem; font-weight: 700; color: #E8F4F0; }
.finca-ubic { font-size: 0.78rem; color: rgba(255, 255, 255, 0.45); margin-top: 2px; }

/* Sub-píldora para Dueño */
.dueno-action-zone {
  padding-left: 34px;
  display: flex;
}

.dueno-toggle-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(7, 26, 26, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dueno-toggle-pill input { position: absolute; opacity: 0; width: 0; height: 0; }

.dueno-toggle-pill.is-owner {
  background: rgba(243, 156, 18, 0.15);
  border-color: rgba(243, 156, 18, 0.4);
  color: #F39C12;
  box-shadow: 0 2px 8px rgba(243, 156, 18, 0.1);
}

/* Botón de Envío */
.submit-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #00B894, #009B7D);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  margin-top: 12px;
  box-shadow: 0 4px 16px rgba(0, 184, 148, 0.2);
  transition: all 0.25s ease;
}
.submit-btn:hover:not(:disabled) {
  filter: brightness(1.05);
  box-shadow: 0 6px 20px rgba(0, 184, 148, 0.3);
}
.submit-btn:disabled { opacity: 0.5; box-shadow: none; cursor: not-allowed; }

/* Animaciones */
.animate-fade-in {
  animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Ajustes de Pantalla Mediana/Grande (Escritorio) */
@media (min-width: 768px) {
  .personas-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
  
  .form-grid-fields { grid-template-columns: repeat(2, 1fr); gap: 16px; }
  
  ion-modal {
    --height: 85%; --width: 650px;
    --max-height: 750px; --border-radius: 24px;
  }
}
</style>