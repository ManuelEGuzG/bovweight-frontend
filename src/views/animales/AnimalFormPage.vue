<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/fincas/${idFinca}/animales`" />
        </ion-buttons>
        <ion-title>Nuevo Animal</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="form-wrapper">
        <div class="form-field">
          <label>Número de arete *</label>
          <input v-model="form.numero_arete" class="form-input" placeholder="CR-004-2024" />
          <span class="hint">Identificador único SENASA del animal</span>
        </div>

        <div class="form-field">
          <label>Nombre</label>
          <input v-model="form.nombre" class="form-input" placeholder="Lucero" />
        </div>

        <div class="form-field">
          <label>Sexo *</label>
          <select v-model="form.sexo" class="form-input">
            <option value="hembra">Hembra</option>
            <option value="macho">Macho</option>
          </select>
        </div>

        <div class="form-field">
          <label>Raza *</label>
          <select v-model="form.raza" class="form-input">
            <option value="Brahman">Brahman</option>
            <option value="Holstein">Holstein</option>
            <option value="Jersey">Jersey</option>
            <option value="Angus">Angus</option>
            <option value="Simmental">Simmental</option>
            <option value="Charolais">Charolais</option>
            <option value="Criollo">Criollo</option>
            <option value="Otra">Otra</option>
          </select>
        </div>

        <div class="form-field">
          <label>Fecha de nacimiento</label>
          <input v-model="form.fecha_nacimiento" type="date" class="form-input" />
        </div>

        <div class="form-field">
          <label>Estado *</label>
          <select v-model="form.id_estado" class="form-input">
            <option v-for="estado in estados" :key="estado.id_estado" :value="estado.id_estado">
              {{ estado.nombre_estado }}
            </option>
          </select>
        </div>

        <div class="form-field">
          <label>Notas</label>
          <textarea v-model="form.nota_general" class="form-input" rows="4" />
        </div>

        <button class="submit-btn" :disabled="saving" @click="handleCreate">
          <ion-icon v-if="!saving" :icon="checkmarkOutline" />
          {{ saving ? 'Guardando...' : 'Crear animal' }}
        </button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonIcon,
} from '@ionic/vue';
import { checkmarkOutline } from 'ionicons/icons';
import { animalService } from '@/services/animal.service';
import { catalogoService } from '@/services/catalogo.service';
import { useToast } from '@/composables/useToast';
import type { EstadoAnimal } from '@/types';

const route   = useRoute();
const router  = useRouter();
const toast   = useToast();

const idFinca = Number(route.params.idFinca);
const saving  = ref(false);
const estados = ref<EstadoAnimal[]>([]);

const form = ref({
  numero_arete:     '',
  nombre:           '',
  sexo:             'hembra' as 'hembra' | 'macho',
  raza:             'Brahman',
  fecha_nacimiento: '',
  id_estado:        null as number | null,
  nota_general:     '',
});

onMounted(async () => {
  try {
    estados.value = await catalogoService.getEstados();
    const bien = estados.value.find(e => e.nombre_estado === 'Bien');
    if (bien) form.value.id_estado = bien.id_estado;
  } catch {
    await toast.error('Error al cargar estados.');
  }
});

async function handleCreate() {
  // Validar campos obligatorios
  if (!form.value.numero_arete.trim()) {
    await toast.warning('El número de arete es obligatorio.');
    return;
  }
  if (!form.value.sexo || !form.value.raza) {
    await toast.warning('Completa los campos obligatorios.');
    return;
  }
  if (!form.value.id_estado) {
    await toast.warning('Selecciona un estado.');
    return;
  }

  saving.value = true;
  try {
    const data: any = {
      numero_arete: form.value.numero_arete.trim(),
      nombre:       form.value.nombre || undefined,
      sexo:         form.value.sexo,
      raza:         form.value.raza,
      fecha_nacimiento: form.value.fecha_nacimiento || undefined,
      id_estado:    form.value.id_estado,
      nota_general: form.value.nota_general || undefined,
    };
    await animalService.create(idFinca, data);
    await toast.success('Animal registrado correctamente.');
    router.replace(`/fincas/${idFinca}/animales`);
  } catch (err: any) {
    const msg = err.response?.data?.errors?.numero_arete?.[0]
             ?? err.response?.data?.message
             ?? 'Error al crear el animal.';
    await toast.error(msg);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }
ion-content { --background: #071a1a; }

.form-wrapper {
  padding: 20px 16px 100px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field { display: flex; flex-direction: column; gap: 6px; }

.form-field label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.hint {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.35);
  font-style: italic;
  margin-top: 2px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  margin-top: 12px;
  box-shadow: 0 4px 16px rgba(0,184,148,0.3);
}
.submit-btn:disabled { opacity: 0.6; }
</style>