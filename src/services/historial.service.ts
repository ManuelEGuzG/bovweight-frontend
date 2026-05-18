import api from './api';
import type { Historial, HistorialReporte } from '@/types';

export const historialService = {
  async getAll(idFinca: number, numeroArete: string) {
    const response = await api.get(
      `/fincas/${idFinca}/animales/${numeroArete}/historial`
    );
    return response.data;
  },

  async createFromPhoto(
    idFinca: number,
    numeroArete: string,
    foto: File,
    distanceMeters?: number,
    photoAngle?: string,
    notas?: string,
    tamano?: string,
  ): Promise<Historial> {
    const formData = new FormData();
    formData.append('foto', foto, foto.name);

    if (distanceMeters !== undefined) formData.append('distance_meters', String(distanceMeters));
    if (photoAngle) formData.append('photo_angle', photoAngle);
    if (notas) formData.append('notas', notas);
    if (tamano) formData.append('tamano', tamano);

    const response = await api.post(
      `/fincas/${idFinca}/animales/${numeroArete}/historial`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data ?? response.data;
  },

  async createManual(
    idFinca: number,
    numeroArete: string,
    peso: number,
    notas?: string,
  ): Promise<Historial> {
    const response = await api.post(
      `/fincas/${idFinca}/animales/${numeroArete}/historial`,
      { peso, notas }
    );
    return response.data.data ?? response.data;
  },

  async corregir(
    idFinca: number,
    numeroArete: string,
    idHistorial: number,
    pesoReal: number,
    notas?: string,
  ): Promise<Historial> {
    const response = await api.patch(
      `/fincas/${idFinca}/animales/${numeroArete}/historial/${idHistorial}/corregir`,
      { peso_real: pesoReal, notas }
    );
    return response.data.data ?? response.data;
  },

  async getReporte(idFinca: number, numeroArete: string): Promise<HistorialReporte> {
    const response = await api.get(
      `/fincas/${idFinca}/animales/${numeroArete}/historial-reporte`
    );
    return response.data;
  },
};