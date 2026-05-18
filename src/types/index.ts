export interface Rol {
  id_rol: number;
  nombre: 'Administrador' | 'Ganadero' | 'Asistente' | 'Veterinario';
}

export interface EstadoAnimal {
  id_estado: number;
  nombre_estado: 'Bien' | 'Enfermo' | 'Medicado' | 'En tratamiento' | 'Muerto' | 'Vendido';
}

export interface Medicamento {
  id_medicamento: number;
  nombre: string;
  descripcion?: string | null;
}

export interface Persona {
  cedula: string;
  nombre: string;
  apellidos: string;
  nombre_completo?: string;
  correo: string;
  contacto?: string | null;
  activo: boolean;
  rol?: Rol;
  fincas_count?: number;
}

export interface Finca {
  id_finca: number;
  nombre: string;
  ubicacion?: string | null;
  hectareas?: number | null;
  notas?: string | null;
  activo: boolean;
  animales_count?: number;
  es_dueno?: boolean;
  created_at?: string;
}

export interface Animal {
  numero_arete: string;
  nombre?: string | null;
  id_finca: number;
  sexo: 'macho' | 'hembra';
  raza: string;
  fecha_nacimiento?: string | null;
  nota_general?: string | null;
  activo: boolean;
  estado?: EstadoAnimal;
  ultimo_peso?: number | null;
  ultima_fecha?: string | null;
  historiales?: Historial[];
}

export interface Historial {
  id_historial: number;
  numero_arete: string;
  peso: number;
  peso_real?: number | null;
  confianza?: number | null;
  caja_deteccion?: number[] | null;
  tamano?: string | null;
  notas?: string | null;
  foto?: string | null;
  fecha_de_foto?: string;
  metodo: 'fotografia' | 'manual';
  asignador?: { cedula: string; nombre: string };
  medicamento?: Medicamento;
  created_at?: string;
}

export interface Receta {
  id_receta: number;
  numero_arete: string;
  dosis: string;
  frecuencia: string;
  duracion_dias: number;
  fecha_emision: string;
  diagnostico?: string | null;
  notas?: string | null;
  medicamento?: Medicamento;
  veterinario?: { cedula: string; nombre_completo: string };
  created_at?: string;
}

export interface AuthResponse {
  message: string;
  persona: Persona;
  token: string;
}

export interface HistorialReporte {
  animal: { numero_arete: string; nombre?: string };
  ganancia_total: number | null;
  historial: {
    id: number;
    fecha: string;
    peso_kg: number;
    metodo: string;
    ganancia_kg: number | null;
  }[];
}