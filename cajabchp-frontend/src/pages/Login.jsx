import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import BchpLogo from '../components/LogoBCHP';
import { loginUser, BACKEND_ACTIVO } from '../services/api';

const MAX_INTENTOS = 3;

const Login = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [pass, setPass] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const bloqueado = intentosFallidos >= MAX_INTENTOS;

  const validarAcceso = async (e) => {
    e.preventDefault();
    if (bloqueado) {
      setError('Acceso bloqueado por múltiples intentos fallidos. Reinicie el sistema.');
      return;
    }

    const user = usuario.trim();
    if (!user || !pass) {
      setError('Ingrese su usuario y contraseña');
      return;
    }

    setCargando(true);
    setError('');

    if (BACKEND_ACTIVO) {
      try {
        const resp = await loginUser({ usuario: user, password: pass });
        const data = resp.data;
        sessionStorage.setItem('bchp_usuario', data.usuario);
        sessionStorage.setItem('bchp_rol', data.rol);
        sessionStorage.setItem('bchp_nombre', data.nombre);
        setIntentosFallidos(0);

        if (data.rol === 'ESTUDIANTE') {
          navigate('/portal-estudiante');
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Credenciales incorrectas';
        setError(msg);
        if (msg.toLowerCase().includes('bloquead')) {
          setIntentosFallidos(MAX_INTENTOS);
        } else {
          setIntentosFallidos(prev => prev + 1);
        }
        setPass('');
      } finally {
        setCargando(false);
      }
    } else {
      // Modo desconectado / fallback local
      setTimeout(() => {
        if (user === 'admin' && pass === '1234') {
          sessionStorage.setItem('bchp_usuario', 'admin');
          sessionStorage.setItem('bchp_rol', 'ADMIN');
          sessionStorage.setItem('bchp_nombre', 'Administrador Principal');
          setIntentosFallidos(0);
          navigate('/dashboard');
        } else if (user === 'asistente' && pass === '1234') {
          sessionStorage.setItem('bchp_usuario', 'asistente');
          sessionStorage.setItem('bchp_rol', 'OPERADOR');
          sessionStorage.setItem('bchp_nombre', 'Asistente de Créditos');
          setIntentosFallidos(0);
          navigate('/dashboard');
        } else if (user.toUpperCase().startsWith('U') && pass === '123') {
          sessionStorage.setItem('bchp_usuario', user.toUpperCase());
          sessionStorage.setItem('bchp_rol', 'ESTUDIANTE');
          sessionStorage.setItem('bchp_nombre', 'Estudiante ' + user.toUpperCase());
          setIntentosFallidos(0);
          navigate('/portal-estudiante');
        } else {
          const fallidos = intentosFallidos + 1;
          setIntentosFallidos(fallidos);
          const restantes = MAX_INTENTOS - fallidos;
          setError(
            restantes > 0
              ? `Credenciales incorrectas. Intentos restantes: ${restantes}`
              : 'Has agotado los intentos permitidos. Acceso bloqueado.'
          );
          setPass('');
        }
        setCargando(false);
      }, 400);
    }
  };

  return (
    <div className="lg-app" translate="no">
      <div className="lg-frame">
        <div className="lg-side">
          <div className="lg-logo">
            <BchpLogo size={34} />
          </div>
          <h1 className="lg-h1">
            Créditos que impulsan
            <br />
            <span>tu continuidad académica.</span>
          </h1>
          <p className="lg-p">
            Fondo rotatorio de asistencia económica para estudiantes universitarios, con evaluación
            de riesgo y desembolso ágil en ventanilla.
          </p>
        </div>

        <div className="lg-form">
          <h2>Acceso al sistema</h2>
          <div className="lg-sub">Ingresa tus credenciales de operador</div>

          <form onSubmit={validarAcceso}>
            <label className="lg-lbl" htmlFor="usuario">USUARIO INSTITUCIONAL</label>
            <input
              id="usuario"
              className="lg-in"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="admin, asistente o U21304921"
              disabled={bloqueado}
              autoComplete="username"
            />

            <label className="lg-lbl" htmlFor="pass">CONTRASEÑA</label>
            <input
              id="pass"
              className="lg-in"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              disabled={bloqueado}
              autoComplete="current-password"
            />

            {error && <div className="lg-err">{error}</div>}

            <button type="submit" className="lg-btn" disabled={cargando || bloqueado}>
              {cargando && <Loader2 size={14} className="animate-spin" />}
              Ingresar al sistema →
            </button>
          </form>

          <div className="lg-foot">Ventanilla asistencial · Caja BCHP</div>
        </div>
      </div>
    </div>
  );
};

export default Login;