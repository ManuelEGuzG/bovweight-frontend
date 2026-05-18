<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Mi Perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="container">
        <div class="profile-hero">
          <div class="avatar">
            <ion-icon :icon="personOutline" />
          </div>
          <h1>{{ persona?.nombre }} {{ persona?.apellidos }}</h1>
          <p class="rol-badge">{{ persona?.rol?.nombre }}</p>
          <p class="cedula">Cédula: {{ persona?.cedula }}</p>
        </div>

        <div class="card">
          <h3>Información personal</h3>

          <div class="form-field">
            <label>Nombre</label>
            <input v-model="form.nombre" class="form-input" />
          </div>

          <div class="form-field">
            <label>Apellidos</label>
            <input v-model="form.apellidos" class="form-input" />
          </div>

          <div class="form-field">
            <label>Correo electrónico</label>
            <input v-model="form.correo" type="email" class="form-input" />
          </div>

          <div class="form-field">
            <label>Contacto</label>
            <input v-model="form.contacto" class="form-input" placeholder="Teléfono" />
          </div>

          <button class="save-btn" :disabled="saving" @click="handleUpdate">
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>

        <div class="card">
          <h3>Cambiar contraseña</h3>

          <div class="form-field">
            <label>Contraseña actual</label>
            <input v-model="passForm.contrasena_actual" type="password" class="form-input" />
          </div>

          <div class="form-field">
            <label>Nueva contraseña</label>
            <input v-model="passForm.contrasena" type="password" class="form-input" />
          </div>

          <div class="form-field">
            <label>Confirmar nueva contraseña</label>
            <input v-model="passForm.contrasena_confirmation" type="password" class="form-input" />
          </div>

          <button class="save-btn" :disabled="changingPass" @click="handleChangePassword">
            {{ changingPass ? 'Cambiando...' : 'Cambiar contraseña' }}
          </button>
        </div>

        <button class="logout-btn" @click="handleLogout">
          <ion-icon :icon="logOutOutline" />
          Cerrar sesión
        </button>
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
    await toast.warning('Completa todos los campos.');
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
ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }
ion-content { --background: #071a1a; }

.container {
  padding: 20px 16px 100px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.profile-hero {
  background: linear-gradient(135deg, #0F2E2E, #164545);
  border: 1px solid rgba(0,184,148,0.2);
  border-radius: 18px;
  padding: 28px 20px;
  text-align: center;
}

.avatar {
  width: 80px; height: 80px;
  background: rgba(0,184,148,0.2);
  border-radius: 24px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
  color: #00B894;
}
.avatar ion-icon { font-size: 2.4rem; }

.profile-hero h1 {
  font-size: 1.3rem;
  font-weight: 800;
  color: #E8F4F0;
  margin: 0 0 8px;
}

.rol-badge {
  display: inline-block;
  background: rgba(0,184,148,0.2);
  color: #00B894;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 0 0 6px;
}

.cedula {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.4);
  margin: 0;
}

.card {
  background: #0F2E2E;
  border: 1px solid rgba(0,184,148,0.1);
  border-radius: 16px;
  padding: 18px;
}

.card h3 {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 14px;
  font-weight: 700;
}

.form-field {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.form-input {
  background: rgba(0,0,0,0.2);
  border: 1.5px solid rgba(0,184,148,0.15);
  border-radius: 10px;
  padding: 11px 13px;
  font-size: 0.9rem;
  color: #E8F4F0;
  font-family: inherit;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus { border-color: #00B894; }

.save-btn {
  width: 100%;
  height: 44px;
  background: linear-gradient(135deg, #00B894, #009B7D);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  margin-top: 8px;
}
.save-btn:disabled { opacity: 0.6; }

.logout-btn {
  width: 100%;
  padding: 14px;
  background: transparent;
  border: 1.5px solid rgba(231,76,60,0.4);
  color: #E74C3C;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  margin-top: 8px;
}
.logout-btn:hover {
  background: rgba(231,76,60,0.1);
  border-color: #E74C3C;
}
</style>