<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/fincas/${idFinca}/animales`" />
        </ion-buttons>
        <ion-title>Nuevo Animal</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="form-container animate-fade-in">
        <div class="form-card">
          <!-- Campo: Número de Arete -->
          <div class="form-field">
            <label>Número de arete <span class="required">*</span></label>
            <input 
              v-model="form.numero_arete" 
              class="form-input text-upper" 
              placeholder="CR-004-2024" 
              maxlength="20"
            />
            <span class="hint">Identificador único oficial del animal</span>
          </div>

          <!-- Campo: Nombre -->
          <div class="form-field">
            <label>Nombre o Alias</label>
            <input v-model="form.nombre" class="form-input" placeholder="Ej: Lucero" />
          </div>

          <!-- Fila Doble Responsiva (Sexo y Raza) -->
          <div class="form-row">
            <div class="form-field half">
              <label>Sexo <span class="required">*</span></label>
              <div class="select-wrapper">
                <select v-model="form.sexo" class="form-input clean-select">
                  <option value="hembra">Hembra</option>
                  <option value="macho">Macho</option>
                </select>
              </div>
            </div>

            <div class="form-field half">
              <label>Raza <span class="required">*</span></label>
              <div class="select-wrapper">
                <select v-model="form.raza" class="form-input clean-select">
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
            </div>
          </div>

          <!-- Fila Doble Responsiva (Fecha Nacimiento y Estado) -->
          <div class="form-row">
            <div class="form-field half">
              <label>Fecha de nacimiento</label>
              <input v-model="form.fecha_nacimiento" type="date" class="form-input date-input" />
            </div>

            <div class="form-field half">
              <label>Estado inicial <span class="required">*</span></label>
              <div class="select-wrapper">
                <select v-model="form.id_estado" class="form-input clean-select">
                  <option v-for="estado in estados" :key="estado.id_estado" :value="estado.id_estado">
                    {{ estado.nombre_estado }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Campo: Notas -->
          <div class="form-field">
            <label>Notas generales</label>
            <textarea 
              v-model="form.nota_general" 
              class="form-input textarea-input" 
              rows="4" 
              placeholder="Detalles de fierro, marcas específicas o procedencia..."
            />
          </div>

          <!-- Botón de Envío -->
          <button class="submit-btn" :disabled="saving" @click="handleCreate">
            <ion-icon v-if="!saving" :icon="checkmarkOutline" />
            <span>{{ saving ? 'Guardando registro...' : 'Registrar animal' }}</span>
          </button>
        </div>
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
    await toast.error('Error al cargar la lista de estados.');
  }
});

async function handleCreate() {
  if (!form.value.numero_arete.trim()) {
    await toast.warning('El número de arete es obligatorio.');
    return;
  }
  if (!form.value.sexo || !form.value.raza) {
    await toast.warning('Faltan campos obligatorios.');
    return;
  }
  if (!form.value.id_estado) {
    await toast.warning('Selecciona un estado válido.');
    return;
  }

  saving.value = true;
  try {
    const data: any = {
      numero_arete: form.value.numero_arete.trim().toUpperCase(),
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

/* Contenedor Adaptivo */
.form-container {
  padding: 16px;
  max-width: 768px;
  margin: 0 auto 120px;
}

.form-card {
  background: #0F2E2E;
  border: 1.5px solid rgba(0, 184, 148, 0.08);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 6px 24px rgba(7, 26, 26, 0.3);
}

/* Campos del formulario */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.required {
  color: #E74C3C;
}

.hint {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 1px;
}

/* Entradas de Datos */
.form-input {
  background: #071a1a;
  border: 1.5px solid rgba(0, 184, 148, 0.15);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 0.92rem;
  color: #E8F4F0;
  font-family: inherit;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.25s, box-shadow 0.25s;
}

.form-input:focus {
  border-color: #00B894;
  box-shadow: 0 0 0 3px rgba(0, 184, 148, 0.08);
}

.text-upper {
  text-transform: uppercase;
}

/* Selects personalizados para ocultar flecha nativa molesta */
.select-wrapper {
  position: relative;
  width: 100%;
}
.select-wrapper::after {
  content: '▼';
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.3);
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}
.clean-select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 32px;
  cursor: pointer;
}
.clean-select option {
  background: #071a1a;
  color: #E8F4F0;
}

/* Inputs Especiales */
.date-input {
  color-scheme: dark; /* Fuerza al navegador a usar el calendario oscuro */
  cursor: pointer;
}
.textarea-input {
  resize: none;
  line-height: 1.4;
}

/* Botón de Guardado */
.submit-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #00B894 0%, #009B7D 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  margin-top: 10px;
  box-shadow: 0 4px 16px rgba(0, 184, 148, 0.25);
  transition: transform 0.2s, opacity 0.2s;
}
.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.05);
}
.submit-btn:active:not(:disabled) {
  transform: translateY(1px);
}
.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Control de filas multi-columna en layouts más grandes */
.form-row {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Animación */
.animate-fade-in {
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Soporte pantallas anchas */
@media (min-width: 576px) {
  .form-row {
    flex-direction: row;
    gap: 16px;
  }
  .form-field.half {
    flex: 1;
    width: 50%;
  }
}
</style>