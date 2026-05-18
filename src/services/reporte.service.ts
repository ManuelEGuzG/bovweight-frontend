import api from './api';

export const reporteService = {
  async downloadExcel(idFinca: number): Promise<Blob> {
    const response = await api.get(`/fincas/${idFinca}/reporte/excel`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async downloadPdf(idFinca: number): Promise<Blob> {
    const response = await api.get(`/fincas/${idFinca}/reporte/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};