import api from './api';
import type { Finca } from '@/types';

export const fincaService = {
  async getAll(): Promise<Finca[]> {
    const response = await api.get('/fincas');
    return response.data.data ?? response.data;
  },

  async getOne(id: number): Promise<Finca> {
    const response = await api.get(`/fincas/${id}`);
    return response.data.data ?? response.data;
  },

  async create(data: Partial<Finca>): Promise<Finca> {
    const response = await api.post('/fincas', data);
    return response.data.data ?? response.data;
  },

  async update(id: number, data: Partial<Finca>): Promise<Finca> {
    const response = await api.put(`/fincas/${id}`, data);
    return response.data.data ?? response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/fincas/${id}`);
  },
};