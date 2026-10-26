import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Estudiantes from './pages/Estudiantes';
import Prestamos from './pages/Prestamos';
import ProcesarAmortizaciones from './pages/ProcesarAmortizaciones';
import Monitoreo from './pages/Monitoreo';
import Solicitudes from './pages/Solicitudes';
import Morosidad from './pages/Morosidad';
import PortalEstudiante from './pages/PortalEstudiante';
import Auditoria from './pages/Auditoria';
import Configuracion from './pages/Configuracion';
import Usuarios from './pages/Usuarios';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Módulos Operativos (ADMIN y OPERADOR) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERADOR']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estudiantes"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERADOR']}>
              <Estudiantes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prestamos"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERADOR']}>
              <Prestamos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/amortizaciones"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERADOR']}>
              <ProcesarAmortizaciones />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoreo"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERADOR']}>
              <Monitoreo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/solicitudes"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERADOR']}>
              <Solicitudes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/morosidad"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERADOR']}>
              <Morosidad />
            </ProtectedRoute>
          }
        />

        {/* Módulos de Administración (Solo ADMIN) */}
        <Route
          path="/auditoria"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Auditoria />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracion"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Configuracion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Usuarios />
            </ProtectedRoute>
          }
        />

        {/* Portal del Estudiante (Solo ESTUDIANTE) */}
        <Route
          path="/portal-estudiante"
          element={
            <ProtectedRoute allowedRoles={['ESTUDIANTE']}>
              <PortalEstudiante />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;