import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const usuario = sessionStorage.getItem('bchp_usuario');
  const rol = sessionStorage.getItem('bchp_rol') || '';

  // Sin sesión activa -> redirigir a Login
  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  // Si se especifican roles permitidos y el rol actual no está en la lista
  if (allowedRoles && !allowedRoles.includes(rol)) {
    if (rol === 'ESTUDIANTE') {
      return <Navigate to="/portal-estudiante" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
