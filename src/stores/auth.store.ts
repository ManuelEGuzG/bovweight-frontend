import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/auth.service';
import type { Persona } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const persona = ref<Persona | null>(null);
  const token   = ref<string | null>(null);

  // ── Getters ─────────────────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value || !!persona.value);

  const isAdmin       = computed(() => persona.value?.rol?.nombre === 'Administrador');
  const isGanadero    = computed(() => persona.value?.rol?.nombre === 'Ganadero');
  const isAsistente   = computed(() => persona.value?.rol?.nombre === 'Asistente');
  const isVeterinario = computed(() => persona.value?.rol?.nombre === 'Veterinario');

  // ── Permisos derivados ──────────────────────────────────────────────────
  const canManageUsers = computed(() => isAdmin.value || isGanadero.value);
  const canEditFincas   = computed(() => isAdmin.value || isGanadero.value || isAsistente.value);
  const canCreateFincas = computed(() => isAdmin.value || isGanadero.value);
  const canDeleteFincas = computed(() => isAdmin.value || isGanadero.value);
  const canWeigh        = computed(() => true);
  const canCreateReceta = computed(() => isVeterinario.value);

  // ── Acciones ────────────────────────────────────────────────────────────
  async function login(correo: string, contrasena: string) {
    const result = await authService.login(correo, contrasena);
    persona.value = result.persona;
    token.value   = result.token;
    return result;
  }

  async function logout() {
    try {
      await authService.logout();
    } finally {
      $reset();
    }
  }

  async function loadPersona() {
    try {
      const stored = await authService.getStoredPersona();
      const isAuth = await authService.isAuthenticated();
      if (stored && isAuth) {
        persona.value = stored;
        token.value   = 'stored';
      }
    } catch {
      $reset();
    }
  }

  function $reset() {
    persona.value = null;
    token.value   = null;
  }

  return {
    persona, token,
    isAuthenticated, isAdmin, isGanadero, isAsistente, isVeterinario,
    canManageUsers, canEditFincas, canCreateFincas, canDeleteFincas,
    canWeigh, canCreateReceta,
    login, logout, loadPersona, $reset,
  };
});