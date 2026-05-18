import api from './api';
import type { Receta } from '@/types';

export const recetaService = {
  async getAll(idFinca: number, numeroArete: string): Promise<Receta[]> {
    const response = await api.get(
      `/fincas/${idFinca}/animales/${numeroArete}/recetas`
    );
    return response.data.data ?? response.data;
  },

  async create(
    idFinca: number,
    numeroArete: string,
    data: {
      id_medicamento: number;
      dosis: string;
      frecuencia: string;
      duracion_dias: number;
      fecha_emision?: string;
      diagnostico?: string;
      notas?: string;
    }
  ): Promise<Receta> {
    const response = await api.post(
      `/fincas/${idFinca}/animales/${numeroArete}/recetas`,
      data
    );
    return response.data.data ?? response.data;
  },

  async getOne(idFinca: number, numeroArete: string, idReceta: number): Promise<Receta> {
    const response = await api.get(
      `/fincas/${idFinca}/animales/${numeroArete}/recetas/${idReceta}`
    );
    return response.data.data ?? response.data;
  },

  async delete(idFinca: number, numeroArete: string, idReceta: number): Promise<void> {
    await api.delete(`/fincas/${idFinca}/animales/${numeroArete}/recetas/${idReceta}`);
  },
};