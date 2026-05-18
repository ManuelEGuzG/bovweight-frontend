import { Preferences } from '@capacitor/preferences';
import api from './api';
import type { AuthResponse, Persona } from '@/types';

export const authService = {
  async login(correo: string, contrasena: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', { correo, contrasena });
    const { persona, token } = response.data;

    await Preferences.set({ key: 'auth_token',   value: token });
    await Preferences.set({ key: 'auth_persona', value: JSON.stringify(persona) });

    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignorar errores de red al cerrar sesión
    }
    await Preferences.remove({ key: 'auth_token' });
    await Preferences.remove({ key: 'auth_persona' });
  },

  async me(): Promise<Persona> {
    const response = await api.get<Persona>('/auth/me');
    return response.data;
  },

  async getStoredPersona(): Promise<Persona | null> {
    const { value } = await Preferences.get({ key: 'auth_persona' });
    return value ? (JSON.parse(value) as Persona) : null;
  },

  async isAuthenticated(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'auth_token' });
    return !!value;
  },
};