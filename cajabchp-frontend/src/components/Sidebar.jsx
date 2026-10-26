import { NavLink, useNavigate } from 'react-router-dom';
import BchpLogo from '../components/LogoBCHP';

const itemsOperador = [
  { to: '/dashboard', label: 'Director del panel' },
  { to: '/estudiantes', label: 'Registro de estudiantes' },
  { to: '/prestamos', label: 'Gestionar préstamos' },
  { to: '/amortizaciones', label: 'Procesar amortizaciones' },
  { to: '/monitoreo', label: 'Monitoreo académico' },
  { to: '/solicitudes', label: 'Evaluación de solicitudes' },
  { to: '/morosidad', label: 'Control morosidad' },
];

const itemsAdminExtra = [
  { to: '/auditoria', label: 'Auditoría financiera' },
  { to: '/configuracion', label: 'Configuración general' },
  { to: '/usuarios', label: 'Gestión de usuarios' },
];

const itemsEstudiante = [
  { to: '/portal-estudiante', label: 'Portal del estudiante' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const usuario = sessionStorage.getItem('bchp_usuario') || 'Usuario';
  const rol = sessionStorage.getItem('bchp_rol') || 'OPERADOR';

  const menuItems = rol === 'ESTUDIANTE'
    ? itemsEstudiante
    : rol === 'ADMIN'
      ? [...itemsOperador, ...itemsAdminExtra]
      : itemsOperador;

  const handleCerrarSesion = () => {
    sessionStorage.clear();
    navigate('/');
  };

  return (
    <aside className="bx-sb">
      <div style={{ margin: '0 6px 26px' }}>
        <BchpLogo size={30} />
      </div>

      {menuItems.map((it) => (
        <NavLink key={it.to} to={it.to} className="bx-link">
          <i />
          {it.label}
        </NavLink>
      ))}

      <div className="bx-op">
        <div style={{ fontWeight: 600, color: '#f4f4f5' }}>{usuario}</div>
        <div>Rol: {rol}</div>
        <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.7 }}>Ventanilla activa</div>
      </div>
      <button className="bx-out" onClick={handleCerrarSesion}>
        Cerrar sesión
      </button>
    </aside>
  );
};

export default Sidebar;