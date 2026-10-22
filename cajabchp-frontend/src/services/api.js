import axios from 'axios';

// Cambiar a true únicamente cuando el servidor backend esté encendido
const BACKEND_ACTIVO = true;
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getEstudiantes = () => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get('/estudiantes');
};

export const postEstudiante = (datos) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.post('/estudiantes', datos);
};

export const getPrestamos = () => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get('/prestamos');
};

export const postPrestamo = (datos) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.post('/prestamos', datos);
};
export const getPagos = () => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get('/pagos');
};

export const postPago = (datos) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.post('/pagos', datos);
};

export const getSolicitudes = () => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.get('/solicitudes');
};

export const putSolicitudEstado = (id, datos) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.put(`/solicitudes/${id}`, datos);
};

export const putPrestamo = (id, datos) => {
  if (!BACKEND_ACTIVO) return Promise.reject(new Error("OFFLINE"));
  return api.put(`/prestamos/${id}`, datos);
};

export default api;