<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/fincas" />
        </ion-buttons>
        <ion-title>Gestión de Usuarios</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="showCreate = true">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" color="primary" />
      </div>

      <div v-else class="container">
        <div class="header-info">
          <h2>{{ personas.length }} usuarios activos</h2>
        </div>

        <div class="personas-list">
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
                <span v-if="p.fincas_count !== undefined" class="chip">
                  <ion-icon :icon="homeOutline" />
                  {{ p.fincas_count }} {{ p.fincas_count === 1 ? 'finca' : 'fincas' }}
                </span>
              </div>
            </div>
            <div class="actions">
              <ion-button v-if="p.rol?.nombre !== 'Administrador'" fill="clear" size="small" @click="openAsignar(p)">
                <ion-icon :icon="businessOutline" slot="icon-only" />
              </ion-button>
              <ion-button fill="clear" color="danger" size="small" @click="confirmDelete(p)">
                <ion-icon :icon="trashOutline" slot="icon-only" />
              </ion-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal crear -->
      <ion-modal :is-open="showCreate" @did-dismiss="resetCreate">
        <ion-header>
          <ion-toolbar>
            <ion-title>Nuevo Usuario</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="resetCreate"><ion-icon :icon="closeOutline" /></ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="form-wrapper">
            <div class="form-field">
              <label>Cédula *</label>
              <input v-model="newForm.cedula" class="form-input" placeholder="123456789" />
            </div>
            <div class="form-field">
              <label>Nombre *</label>
              <input v-model="newForm.nombre" class="form-input" />
            </div>
            <div class="form-field">
              <label>Apellidos *</label>
              <input v-model="newForm.apellidos" class="form-input" />
            </div>
            <div class="form-field">
              <label>Correo *</label>
              <input v-model="newForm.correo" type="email" class="form-input" />
            </div>
            <div class="form-field">
              <label>Contacto</label>
              <input v-model="newForm.contacto" class="form-input" />
            </div>
            <div class="form-field">
              <label>Rol *</label>
              <select v-model="newForm.id_rol" class="form-input">
                <option :value="null" disabled>Selecciona un rol</option>
                <option v-for="r in roles" :key="r.id_rol" :value="r.id_rol">{{ r.nombre }}</option>
              </select>
            </div>
            <div class="form-field">
              <label>Contraseña *</label>
              <input v-model="newForm.contrasena" type="password" class="form-input" />
            </div>
            <div class="form-field">
              <label>Confirmar contraseña *</label>
              <input v-model="newForm.contrasena_confirmation" type="password" class="form-input" />
            </div>

            <button class="submit-btn" :disabled="saving" @click="handleCreate">
              {{ saving ? 'Creando...' : 'Crear usuario' }}
            </button>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Modal asignar fincas -->
      <ion-modal :is-open="showAsignar" @did-dismiss="closeAsignar">
        <ion-header>
          <ion-toolbar>
            <ion-title>Asignar Fincas</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeAsignar"><ion-icon :icon="closeOutline" /></ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div v-if="selectedPersona" class="form-wrapper">
            <div class="info-banner">
              <p class="banner-title">{{ selectedPersona.nombre }} {{ selectedPersona.apellidos }}</p>
              <p class="banner-sub">{{ selectedPersona.rol?.nombre }}</p>
            </div>

            <p class="hint">Selecciona las fincas a las que tendrá acceso:</p>

            <div class="fincas-asign">
              <label v-for="f in todasFincas" :key="f.id_finca" class="finca-checkbox">
                <input type="checkbox" :value="f.id_finca" v-model="fincasSeleccionadas" />
                <div class="check-content">
                  <span class="finca-nombre">{{ f.nombre }}</span>
                  <span v-if="f.ubicacion" class="finca-ubic">{{ f.ubicacion }}</span>
                </div>
                <label v-if="fincasSeleccionadas.includes(f.id_finca) && (selectedPersona.rol?.nombre === 'Ganadero')" class="dueno-toggle">
                  <input type="checkbox" :checked="esDueno(f.id_finca)" @change="toggleDueno(f.id_finca)" />
                  <span>Dueño</span>
                </label>
              </label>
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

const personas    = ref<Persona[]>([]);
const roles       = ref<Rol[]>([]);
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
  } catch {
    /* ignore */
  }
}

async function loadFincas() {
  try {
    todasFincas.value = await fincaService.getAll();
  } catch {
    /* ignore */
  }
}

async function handleCreate() {
  if (!newForm.value.cedula || !newForm.value.nombre || !newForm.value.apellidos
      || !newForm.value.correo || !newForm.value.id_rol || !newForm.value.contrasena) {
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
      cedula:    newForm.value.cedula,
      nombre:    newForm.value.nombre,
      apellidos: newForm.value.apellidos,
      correo:    newForm.value.correo,
      contacto:  newForm.value.contacto || undefined,
      id_rol:    newForm.value.id_rol!,
      contrasena: newForm.value.contrasena,
      contrasena_confirmation: newForm.value.contrasena_confirmation,
    });
    await toast.success('Usuario creado.');
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
    header: 'Desactivar usuario',
    message: `¿Desactivar a ${p.nombre} ${p.apellidos}?`,
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
    await toast.success('Usuario desactivado.');
    await loadPersonas();
  } catch {
    await toast.error('Error al desactivar.');
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
  } catch {
    /* ignore */
  }
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
    await toast.success('Fincas asignadas correctamente.');
    closeAsignar();
    await loadPersonas();
  } catch {
    await toast.error('Error al asignar fincas.');
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
ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }
ion-content { --background: #071a1a; }

.container { padding: 16px 16px 100px; }

.header-info { padding-bottom: 14px; }
.header-info h2 {
  color: rgba(255,255,255,0.5);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin: 0;
}

.personas-list { display: flex; flex-direction: column; gap: 10px; }

.persona-card {
  background: #0F2E2E;
  border: 1px solid rgba(0,184,148,0.1);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.persona-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.persona-icon ion-icon { font-size: 1.4rem; }
.persona-icon.rol-administrador { background: rgba(155,89,182,0.15); color: #9B59B6; }
.persona-icon.rol-ganadero      { background: rgba(0,184,148,0.15);  color: #00B894; }
.persona-icon.rol-asistente     { background: rgba(52,152,219,0.15); color: #3498DB; }
.persona-icon.rol-veterinario   { background: rgba(243,156,18,0.15); color: #F39C12; }

.persona-info { flex: 1; min-width: 0; }
.persona-info h3 {
  font-size: 0.92rem;
  font-weight: 700;
  color: #E8F4F0;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.correo {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.5);
  margin: 0 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 7px;
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.6);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.chip ion-icon { font-size: 0.85rem; }

.chip.rol { text-transform: uppercase; letter-spacing: 0.5px; }
.chip.rol.rol-administrador { background: rgba(155,89,182,0.15); color: #9B59B6; }
.chip.rol.rol-ganadero      { background: rgba(0,184,148,0.15);  color: #00B894; }
.chip.rol.rol-asistente     { background: rgba(52,152,219,0.15); color: #3498DB; }
.chip.rol.rol-veterinario   { background: rgba(243,156,18,0.15); color: #F39C12; }

.actions {
  display: flex;
  gap: 4px;
}

ion-modal {
  --height: 100%; --width: 100%; --border-radius: 0;
  --background: #071a1a;
}
ion-modal ion-content { --background: #071a1a; --color: #E8F4F0; }
ion-modal ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }

@media (min-width: 768px) {
  ion-modal {
    --height: 90%; --width: 600px;
    --max-height: 800px; --border-radius: 20px;
  }
}

.form-wrapper {
  display: flex; flex-direction: column; gap: 14px;
  padding-top: 8px;
}

.info-banner {
  background: linear-gradient(135deg, rgba(0,184,148,0.1), rgba(0,184,148,0.05));
  border: 1px solid rgba(0,184,148,0.25);
  border-radius: 12px;
  padding: 14px;
}
.banner-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #E8F4F0;
  margin: 0;
}
.banner-sub {
  font-size: 0.78rem;
  color: #00B894;
  margin: 2px 0 0;
}

.hint {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.6);
  margin: 0 0 4px;
}

.form-field { display: flex; flex-direction: column; gap: 6px; }

.form-field label {
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
  letter-spacing: 0.6px;
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

.fincas-asign {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.finca-checkbox {
  background: #0F2E2E;
  border: 1.5px solid rgba(0,184,148,0.15);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.finca-checkbox:has(input:checked) {
  border-color: #00B894;
  background: rgba(0,184,148,0.05);
}

.finca-checkbox > input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #00B894;
  cursor: pointer;
}

.check-content { flex: 1; min-width: 0; }
.finca-nombre {
  display: block;
  font-size: 0.92rem;
  font-weight: 600;
  color: #E8F4F0;
}
.finca-ubic {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.45);
}

.dueno-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
}
.dueno-toggle input { accent-color: #F39C12; }

.submit-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #00B894, #009B7D);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  margin-top: 8px;
}
.submit-btn:disabled { opacity: 0.6; }
</style>