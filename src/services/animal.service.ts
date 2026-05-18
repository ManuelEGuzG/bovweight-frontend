import api from './api';
import type { Animal } from '@/types';

export const animalService = {
  async getAll(idFinca: number): Promise<Animal[]> {
    const response = await api.get(`/fincas/${idFinca}/animales`);
    return response.data.data ?? response.data;
  },

  async getOne(idFinca: number, numeroArete: string): Promise<Animal> {
    const response = await api.get(`/fincas/${idFinca}/animales/${numeroArete}`);
    return response.data.data ?? response.data;
  },

  async create(idFinca: number, data: Partial<Animal>): Promise<Animal> {
    const response = await api.post(`/fincas/${idFinca}/animales`, data);
    return response.data.data ?? response.data;
  },

  async update(idFinca: number, numeroArete: string, data: Partial<Animal>): Promise<Animal> {
    const response = await api.put(`/fincas/${idFinca}/animales/${numeroArete}`, data);
    return response.data.data ?? response.data;
  },

  async delete(idFinca: number, numeroArete: string): Promise<void> {
    await api.delete(`/fincas/${idFinca}/animales/${numeroArete}`);
  },

  async cambiarEstado(idFinca: number, numeroArete: string, idEstado: number): Promise<Animal> {
    const response = await api.patch(
      `/fincas/${idFinca}/animales/${numeroArete}/estado`,
      { id_estado: idEstado }
    );
    return response.data.animal ?? response.data;
  },
};