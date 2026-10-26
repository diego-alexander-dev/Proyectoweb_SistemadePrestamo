import axios from 'axios';

// Cambiar a true únicamente cuando el servidor backend esté encendido
export const BACKEND_ACTIVO = true;
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar X-Usuario y X-Rol en todas las peticiones desde sessionStorage
api.interceptors.request.use((config) => {
  const usuario = sessionStorage.getItem('bchp_usuario');
  const rol = sessionStorage.getItem('bchp_rol');
  if (usuario) {
    config.headers['X-Usuario'] = usuario;
  }
  if (rol) {
    config.headers['X-Rol'] = rol;
  }
  return config;
}, (error) => Promise.reject(error));

// ----------------- AUTENTICACIÓN -----------------
export const loginUser = (credenciales) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.post('/auth/login', credenciales);
};

// ----------------- ESTUDIANTES -----------------
export const getEstudiantes = () => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get('/estudiantes');
};

export const postEstudiante = (datos) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.post('/estudiantes', datos);
};

export const deleteEstudiante = (id) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.delete(`/estudiantes/${id}`);
};

// ----------------- PRÉSTAMOS -----------------
export const getPrestamos = () => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get('/prestamos');
};

export const getPrestamosRiesgoTemprano = () => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get('/prestamos/riesgo-temprano');
};

export const postPrestamo = (datos) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  // Regla obligatoria: nunca enviar saldo desde el cliente al registrar préstamo
  const payloadSinSaldo = { ...datos };
  delete payloadSinSaldo.saldo;
  return api.post('/prestamos', payloadSinSaldo);
};

export const putPrestamo = (id, datos) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.put(`/prestamos/${id}`, datos);
};

export const anularPrestamo = (id) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.patch(`/prestamos/${id}/anular`);
};

export const getCuotasPrestamo = (idPrestamo) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get(`/prestamos/${idPrestamo}/cuotas`);
};

export const previewCronograma = (datos) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.post('/prestamos/cronograma-preview', datos);
};

// ----------------- PAGOS -----------------
export const getPagos = () => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get('/pagos');
};

export const postPago = (datos) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.post('/pagos', datos);
};

export const anularPago = (idPago) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.patch(`/pagos/${idPago}/anular`);
};

// ----------------- SOLICITUDES -----------------
export const getSolicitudes = (estado) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  const url = estado ? `/solicitudes?estado=${encodeURIComponent(estado)}` : '/solicitudes';
  return api.get(url);
};

export const postSolicitud = (datos) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.post('/solicitudes', datos);
};

export const putSolicitudEstado = (id, datos) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.put(`/solicitudes/${id}`, datos);
};

// ----------------- SCORING -----------------
export const getScoringEstudiante = (idEstudiante) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get(`/scoring/estudiante/${idEstudiante}`);
};

// ----------------- MORA -----------------
export const getMoraPreview = (idPrestamo) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get(`/prestamos/${idPrestamo}/mora-preview`);
};

export const postAplicarMora = (idPrestamo) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.post(`/prestamos/${idPrestamo}/aplicar-mora`);
};

export const postProcesarMoraGeneral = () => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.post('/mora/procesar');
};

// ----------------- HISTORIAL -----------------
export const getHistorialEstudiante = (idEstudiante) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get(`/historial/estudiante/${idEstudiante}`);
};

// ----------------- REPORTES -----------------
export const getReporteMorosidad = () => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get('/reportes/morosidad');
};

export const exportReporteMorosidadCsv = () => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get('/reportes/morosidad/export', { responseType: 'blob' });
};

// ----------------- AUDITORÍA -----------------
export const getAuditoria = (params) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get('/auditoria', { params });
};

// ----------------- CONFIGURACIÓN -----------------
export const getConfiguracion = () => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get('/configuracion');
};

export const putConfiguracion = (datos) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.put('/configuracion', datos);
};

// ----------------- USUARIOS -----------------
export const getUsuarios = () => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get('/usuarios');
};

export const postUsuario = (datos) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.post('/usuarios', datos);
};

export const putUsuario = (id, datos) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.put(`/usuarios/${id}`, datos);
};

export default api;