import api from './api';
import type { Persona, Finca } from '@/types';

export const personaService = {
  async getAll(): Promise<Persona[]> {
    const response = await api.get('/personas');
    return response.data.data ?? response.data;
  },

  async create(data: {
    cedula: string;
    nombre: string;
    apellidos: string;
    correo: string;
    contrasena: string;
    contrasena_confirmation: string;
    contacto?: string;
    id_rol: number;
  }): Promise<Persona> {
    const response = await api.post('/personas', data);
    return response.data.data ?? response.data;
  },

  async delete(cedula: string): Promise<void> {
    await api.delete(`/personas/${cedula}`);
  },

  async getFincas(cedula: string): Promise<Finca[]> {
    const response = await api.get(`/personas/${cedula}/fincas`);
    return response.data.data ?? response.data;
  },

  async syncFincas(cedula: string, fincas: { id_finca: number; es_dueno?: boolean }[]): Promise<void> {
    await api.put(`/personas/${cedula}/fincas`, { fincas });
  },

  async updatePerfil(data: {
    nombre?: string;
    apellidos?: string;
    correo?: string;
    contacto?: string;
    contrasena_actual?: string;
    contrasena?: string;
    contrasena_confirmation?: string;
  }): Promise<Persona> {
    const response = await api.put('/perfil', data);
    return response.data.persona ?? response.data;
  },
};