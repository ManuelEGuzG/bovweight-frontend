<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Mi Perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="container animate-fade-in">
        
        <!-- Tarjeta Hero del Usuario -->
        <div class="profile-hero">
          <div class="avatar">
            <ion-icon :icon="personOutline" />
          </div>
          <h1>{{ persona?.nombre }} {{ persona?.apellidos }}</h1>
          <div class="badge-container">
            <span class="rol-badge">{{ persona?.rol?.nombre || 'Usuario' }}</span>
          </div>
          <p class="cedula">Cédula: {{ persona?.cedula || '—' }}</p>
        </div>

        <!-- Layout de Bloques Adaptativos -->
        <div class="profile-grid">
          
          <!-- Bloque: Información Personal -->
          <div class="card">
            <h3>Información personal</h3>

            <div class="form-field">
              <label>Nombre</label>
              <input v-model="form.nombre" class="form-input" placeholder="Tu nombre" />
            </div>

            <div class="form-field">
              <label>Apellidos</label>
              <input v-model="form.apellidos" class="form-input" placeholder="Tus apellidos" />
            </div>

            <div class="form-field">
              <label>Correo electrónico</label>
              <input v-model="form.correo" type="email" class="form-input" placeholder="nombre@correo.com" />
            </div>

            <div class="form-field">
              <label>Contacto</label>
              <input v-model="form.contacto" class="form-input" placeholder="Número de teléfono" />
            </div>

            <button class="save-btn" :disabled="saving" @click="handleUpdate">
              {{ saving ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>

          <!-- Bloque: Seguridad / Contraseña -->
          <div class="card">
            <h3>Cambiar contraseña</h3>

            <div class="form-field">
              <label>Contraseña actual</label>
              <input v-model="passForm.contrasena_actual" type="password" class="form-input" placeholder="••••••••" />
            </div>

            <div class="form-field">
              <label>Nueva contraseña</label>
              <input v-model="passForm.contrasena" type="password" class="form-input" placeholder="Mínimo 8 caracteres" />
            </div>

            <div class="form-field">
              <label>Confirmar nueva contraseña</label>
              <input v-model="passForm.contrasena_confirmation" type="password" class="form-input" placeholder="Repite la contraseña" />
            </div>

            <button class="save-btn" :disabled="changingPass" @click="handleChangePassword">
              {{ changingPass ? 'Cambiando...' : 'Cambiar contraseña' }}
            </button>
          </div>
        </div>

        <!-- Acción de Cierre de Sesión Extendida -->
        <div class="logout-wrapper">
          <button class="logout-btn" @click="handleLogout">
            <ion-icon :icon="logOutOutline" />
            <span>Cerrar sesión</span>
          </button>
        </div>

      </div>

      <AppTabBar />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon,
} from '@ionic/vue';
import { personOutline, logOutOutline } from 'ionicons/icons';
import { personaService } from '@/services/persona.service';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/composables/useToast';
import AppTabBar from '@/components/AppTabBar.vue';

const router    = useRouter();
const authStore = useAuthStore();
const toast     = useToast();

const persona = computed(() => authStore.persona);

const saving      = ref(false);
const changingPass = ref(false);

const form = ref({
  nombre:    '',
  apellidos: '',
  correo:    '',
  contacto:  '',
});

const passForm = ref({
  contrasena_actual:        '',
  contrasena:               '',
  contrasena_confirmation:  '',
});

onMounted(() => {
  if (persona.value) {
    form.value = {
      nombre:    persona.value.nombre ?? '',
      apellidos: persona.value.apellidos ?? '',
      correo:    persona.value.correo ?? '',
      contacto:  persona.value.contacto ?? '',
    };
  }
});

async function handleUpdate() {
  if (!form.value.nombre.trim() || !form.value.apellidos.trim() || !form.value.correo.trim()) {
    await toast.warning('Los campos Nombre, Apellidos y Correo son obligatorios.');
    return;
  }
  
  saving.value = true;
  try {
    const updated = await personaService.updatePerfil({
      nombre:    form.value.nombre,
      apellidos: form.value.apellidos,
      correo:    form.value.correo,
      contacto:  form.value.contacto || undefined,
    });
    authStore.persona = updated;
    await toast.success('Perfil actualizado.');
  } catch (err: any) {
    const msg = err.response?.data?.message ?? 'Error al actualizar.';
    await toast.error(msg);
  } finally {
    saving.value = false;
  }
}

async function handleChangePassword() {
  if (!passForm.value.contrasena_actual || !passForm.value.contrasena) {
    await toast.warning('Completa todos los campos de contraseña.');
    return;
  }

  if (passForm.value.contrasena !== passForm.value.contrasena_confirmation) {
    await toast.warning('Las contraseñas no coinciden.');
    return;
  }

  if (passForm.value.contrasena.length < 8) {
    await toast.warning('La contraseña debe tener al menos 8 caracteres.');
    return;
  }

  changingPass.value = true;
  try {
    await personaService.updatePerfil({
      contrasena_actual:       passForm.value.contrasena_actual,
      contrasena:              passForm.value.contrasena,
      contrasena_confirmation: passForm.value.contrasena_confirmation,
    });
    await toast.success('Contraseña cambiada correctamente.');
    passForm.value = { contrasena_actual: '', contrasena: '', contrasena_confirmation: '' };
  } catch (err: any) {
    const msg = err.response?.data?.errors?.contrasena_actual?.[0]
              ?? err.response?.data?.message
              ?? 'Error al cambiar la contraseña.';
    await toast.error(msg);
  } finally {
    changingPass.value = false;
  }
}

async function handleLogout() {
  await authStore.logout();
  router.replace('/login');
}
</script>

<style scoped>
ion-toolbar { 
  --background: #0d2b2b; 
  --color: #E8F4F0; 
  font-family: 'Inter', sans-serif;
}
ion-content { --background: #071a1a; }

.container {
  padding: 24px 16px 120px;
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Hero del Perfil */
.profile-hero {
  background: linear-gradient(135deg, #0F2E2E 0%, #143D3D 100%);
  border: 1.5px solid rgba(0, 184, 148, 0.22);
  border-radius: 20px;
  padding: 32px 20px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(7, 26, 26, 0.4);
}

.avatar {
  width: 84px; 
  height: 84px;
  background: rgba(0, 184, 148, 0.15);
  border: 1px solid rgba(0, 184, 148, 0.25);
  border-radius: 24px;
  display: flex; 
  align-items: center; 
  justify-content: center;
  margin: 0 auto 16px;
  color: #00B894;
  box-shadow: 0 4px 14px rgba(0, 184, 148, 0.1);
}
.avatar ion-icon { font-size: 2.6rem; }

.profile-hero h1 {
  font-size: 1.45rem;
  font-weight: 800;
  color: #E8F4F0;
  margin: 0 0 10px;
  letter-spacing: -0.5px;
}

.badge-container {
  margin-bottom: 8px;
}

.rol-badge {
  display: inline-block;
  background: rgba(0, 184, 148, 0.15);
  color: #00B894;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: 1px solid rgba(0, 184, 148, 0.15);
}

.cedula {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.45);
  margin: 0;
  font-weight: 500;
}

/* Contenedor de bloques (Mobile First) */
.profile-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* Tarjetas de Formulario */
.card {
  background: #0F2E2E;
  border: 1.5px solid rgba(0, 184, 148, 0.12);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(7, 26, 26, 0.2);
}

.card h3 {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin: 0 0 16px;
  font-weight: 700;
}

.form-field {
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field label {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.form-input {
  background: rgba(7, 26, 26, 0.3);
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

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

/* Botones de Guardar */
.save-btn {
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
  margin-top: 10px;
  box-shadow: 0 4px 16px rgba(0, 184, 148, 0.2);
  transition: all 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  filter: brightness(1.05);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 184, 148, 0.3);
}

.save-btn:disabled { 
  opacity: 0.5; 
  box-shadow: none;
  cursor: not-allowed;
}

/* Bloque de Salida */
.logout-wrapper {
  margin-top: 16px;
}

.logout-btn {
  width: 100%;
  padding: 15px;
  background: transparent;
  border: 1.5px solid rgba(231, 76, 60, 0.35);
  color: #E74C3C;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  transition: all 0.25s ease;
}

.logout-btn:hover {
  background: rgba(231, 76, 60, 0.08);
  border-color: #E74C3C;
}

.logout-btn ion-icon {
  font-size: 1.2rem;
}

/* Animaciones */
.animate-fade-in {
  animation: fadeInUp 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Consultas de Medios para Escritorio */
@media (min-width: 768px) {
  .profile-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  .logout-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }

  .logout-btn {
    width: 240px;
  }
}
</style>