import api from './api';
import type { Rol, EstadoAnimal, Medicamento } from '@/types';

export const catalogoService = {
  async getRoles(): Promise<Rol[]> {
    const response = await api.get('/roles');
    return response.data;
  },

  async getEstados(): Promise<EstadoAnimal[]> {
    const response = await api.get('/estados');
    return response.data;
  },

  async getMedicamentos(): Promise<Medicamento[]> {
    const response = await api.get('/medicamentos');
    return response.data;
  },

  async crearMedicamento(nombre: string, descripcion?: string): Promise<Medicamento> {
    const response = await api.post('/medicamentos', { nombre, descripcion });
    return response.data;
  },
};