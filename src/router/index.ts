import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { authService } from '@/services/auth.service';

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: () => {
    // Decide a dónde mandar según si está autenticado
    return localStorage.getItem('CapacitorStorage.auth_token') ? '/fincas' : '/login';
  }
},

  {
    path: '/login',
    component: () => import('@/views/auth/LoginPage.vue'),
  },

  // Fincas
  {
    path: '/fincas',
    component: () => import('@/views/fincas/FincasPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/fincas/:idFinca',
    component: () => import('@/views/fincas/FincaDetailPage.vue'),
    meta: { requiresAuth: true },
  },

  // Animales
  {
    path: '/fincas/:idFinca/animales',
    component: () => import('@/views/animales/AnimalesPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/fincas/:idFinca/animales/nuevo',
    component: () => import('@/views/animales/AnimalFormPage.vue'),
    meta: { requiresAuth: true, blockVet: true },
  },
  {
    path: '/fincas/:idFinca/animales/:numeroArete',
    component: () => import('@/views/animales/AnimalDetailPage.vue'),
    meta: { requiresAuth: true },
  },

  // Pesajes
  {
    path: '/fincas/:idFinca/animales/:numeroArete/pesar',
    component: () => import('@/views/pesajes/PesajePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/fincas/:idFinca/animales/:numeroArete/historial',
    component: () => import('@/views/pesajes/HistorialPage.vue'),
    meta: { requiresAuth: true },
  },

  // Recetas (veterinario)
  {
    path: '/fincas/:idFinca/animales/:numeroArete/recetas',
    component: () => import('@/views/recetas/RecetasPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/fincas/:idFinca/animales/:numeroArete/recetas/nueva',
    component: () => import('@/views/recetas/RecetaFormPage.vue'),
    meta: { requiresAuth: true, requiresVet: true },
  },

  // Reportes
  {
    path: '/fincas/:idFinca/reporte',
    component: () => import('@/views/reportes/ReportePage.vue'),
    meta: { requiresAuth: true },
  },

  // Perfil
  {
    path: '/perfil',
    component: () => import('@/views/perfil/PerfilPage.vue'),
    meta: { requiresAuth: true },
  },

  // Admin
  {
  path: '/admin/personas',
  component: () => import('@/views/admin/PersonasPage.vue'),
  meta: { requiresAuth: true, requiresGestion: true },
},
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const isAuth = await authService.isAuthenticated();

  if (to.path === '/login' && !isAuth) return true;
  if (to.path === '/login' && isAuth)  return '/fincas';

  if (to.meta.requiresAuth && !isAuth) return '/login';

  if (to.meta.requiresAuth && isAuth) {
    const persona = await authService.getStoredPersona();
    const rol     = persona?.rol?.nombre;

    if (to.meta.requiresGestion && rol !== 'Administrador' && rol !== 'Ganadero') return '/fincas';
    if (to.meta.requiresVet   && rol !== 'Veterinario')   return '/fincas';
    if (to.meta.blockVet      && rol === 'Veterinario')   return '/fincas';
  }

  return true;
});

export default router;