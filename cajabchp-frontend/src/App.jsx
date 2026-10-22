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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/estudiantes" element={<Estudiantes />} />
        <Route path="/prestamos" element={<Prestamos />} />
        <Route path="/amortizaciones" element={<ProcesarAmortizaciones />} />
        <Route path="/monitoreo" element={<Monitoreo />} />
        <Route path="/solicitudes" element={<Solicitudes />} />
        <Route path="/morosidad" element={<Morosidad />} />
        <Route path="/portal-estudiante" element={<PortalEstudiante />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;