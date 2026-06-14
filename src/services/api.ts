import axios from 'axios';
import { Preferences } from '@capacitor/preferences';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.0.18:8000/api/v1',
 // const BASE_URL = 'http://192.168.86.43:8000/api/v1'; 'http://localhost:8000/api/v1';'http://192.168.0.18:8000/';
  headers: { 'Accept': 'application/json' },
});

// Interceptor request: agregar Bearer token
api.interceptors.request.use(async (config) => {
  const { value } = await Preferences.get({ key: 'auth_token' });
  if (value) {
    config.headers.Authorization = `Bearer ${value}`;
  }
  return config;
});

// Interceptor response: manejar 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await Preferences.remove({ key: 'auth_token' });
      await Preferences.remove({ key: 'auth_persona' });
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;