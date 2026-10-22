import { NavLink, useNavigate } from 'react-router-dom';
import BchpLogo from '../components/LogoBCHP';

const items = [
  { to: '/dashboard', label: 'Director del panel' },
  { to: '/estudiantes', label: 'Registro de estudiantes' },
  { to: '/prestamos', label: 'Gestionar préstamos' },
  { to: '/amortizaciones', label: 'Procesar amortizaciones' },
  { to: '/monitoreo', label: 'Monitoreo académico' },
  { to: '/solicitudes', label: 'Evaluación de solicitudes' },
  { to: '/morosidad', label: 'Control morosidad' },
];

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <aside className="bx-sb">
      <div style={{ margin: '0 6px 26px' }}>
        <BchpLogo size={30} />
      </div>

      {items.map((it) => (
        <NavLink key={it.to} to={it.to} className="bx-link">
          <i />
          {it.label}
        </NavLink>
      ))}

      <div className="bx-op">Operador de caja · Ventanilla activa</div>
      <button className="bx-out" onClick={() => navigate('/')}>
        Cerrar sesión
      </button>
    </aside>
  );
};

export default Sidebar;