import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getEstudiantes, postEstudiante } from '../services/api';
import { 
  UserPlus, 
  Search, 
  X, 
  GraduationCap, 
  CheckCircle2, 
  Loader2
} from 'lucide-react';

const Estudiantes = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [modalAbierto, setModalAbierto] = useState(searchParams.get('nuevo') === 'true');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  const [estudiantes, setEstudiantes] = useState([
    {
      id_estudiante: 1,
      dni: '12345678',
      nombre: 'DIEGO',
      apellido: 'HUACHACA',
      edad: 21,
      telefono: '987654321',
      correo: 'diego.huachaca@utp.edu.pe',
      promedio_notas: 16.5,
      porcentaje_asistencia: 92.0,
      estado_universidad: 'ACTIVO',
      ciclo_actual: 5
    },
    {
      id_estudiante: 2,
      dni: '87654321',
      nombre: 'DIANA',
      apellido: 'APOLINARIO',
      edad: 20,
      telefono: '912345678',
      correo: 'diana.apolinario@utp.edu.pe',
      promedio_notas: 14.0,
      porcentaje_asistencia: 85.0,
      estado_universidad: 'ACTIVO',
      ciclo_actual: 4
    },
    {
      id_estudiante: 3,
      dni: '11223344',
      nombre: 'EDUARDO',
      apellido: 'CAMAC',
      edad: 22,
      telefono: '956789012',
      correo: 'eduardo.camac@utp.edu.pe',
      promedio_notas: 10.0,
      porcentaje_asistencia: 65.0,
      estado_universidad: 'ALERTA',
      ciclo_actual: 6
    },
    {
      id_estudiante: 4,
      dni: '99887766',
      nombre: 'MARIA',
      apellido: 'QUISPE',
      edad: 19,
      telefono: '945678901',
      correo: 'maria.quispe@utp.edu.pe',
      promedio_notas: 18.0,
      porcentaje_asistencia: 98.0,
      estado_universidad: 'ACTIVO',
      ciclo_actual: 3
    }
  ]);

  useEffect(() => {
    const cargarEstudiantes = async () => {
      try {
        const res = await getEstudiantes();
        if (res.data && res.data.length > 0) {
          setEstudiantes(res.data);
        }
      } catch {
        // En desarrollo desconectado no emitir advertencias de consola
      }
    };
    cargarEstudiantes();
  }, []);

  const [nuevo, setNuevo] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    edad: 20,
    telefono: '',
    correo: '',
    ciclo_actual: 1,
    promedio_notas: 14.0,
    porcentaje_asistencia: 100.0
  });

  const handleChange = (e) => {
    setNuevo({ ...nuevo, [e.target.name]: e.target.value });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setCargando(true);

    const payload = {
      dni: nuevo.dni.trim(),
      nombre: nuevo.nombre.toUpperCase().trim(),
      apellido: nuevo.apellido.toUpperCase().trim(),
      edad: parseInt(nuevo.edad, 10),
      telefono: nuevo.telefono.trim(),
      correo: nuevo.correo.toLowerCase().trim(),
      ciclo_actual: parseInt(nuevo.ciclo_actual, 10),
      promedio_notas: parseFloat(nuevo.promedio_notas) || 11.0,
      porcentaje_asistencia: parseFloat(nuevo.porcentaje_asistencia) || 100.0,
      estado_universidad: 'ACTIVO'
    };

    try {
      await postEstudiante(payload);
      const res = await getEstudiantes();
      if (res.data) setEstudiantes(res.data);
    } catch {
      setEstudiantes((prev) => [
        { ...payload, id_estudiante: prev.length + 1 },
        ...prev
      ]);
    }

    // Cerrar primero el modal para evitar conflicto de reconciliación en el DOM
    setModalAbierto(false);
    setCargando(false);
    setNuevo({
      dni: '',
      nombre: '',
      apellido: '',
      edad: 20,
      telefono: '',
      correo: '',
      ciclo_actual: 1,
      promedio_notas: 14.0,
      porcentaje_asistencia: 100.0
    });
  };
  

  const filtrados = estudiantes.filter((est) => 
    (est.nombre + ' ' + est.apellido).toLowerCase().includes(busqueda.toLowerCase()) ||
    est.dni.includes(busqueda)
  );

  // Indicadores derivados (solo lectura, no alteran la lógica)
  const total = estudiantes.length;
  const promedioGeneral = total
    ? estudiantes.reduce((acc, e) => acc + (Number(e.promedio_notas) || 0), 0) / total
    : 0;
  const enRiesgo = estudiantes.filter((e) => e.estado_universidad !== 'ACTIVO').length;
  const ciclosBajos = estudiantes.filter((e) => Number(e.ciclo_actual) <= 5).length;
  const pctBajos = total ? ciclosBajos / total : 0;
  const CIRC = 464.9;

  const badgeEstado = (estado) =>
    estado === 'ACTIVO' ? 'bx-b-gr' : estado === 'ALERTA' ? 'bx-b-am' : 'bx-b-rd';

  return (
    <div className="bx-app" translate="no">
      <Sidebar />

      <main className="bx-main">
        <div className="bx-hd">
          <div>
            <h1>Registro de estudiantes</h1>
            <span>Cartera activa del semestre</span>
          </div>
          <button onClick={() => setModalAbierto(true)} className="bx-btn">
            <UserPlus size={16} />
            Nuevo Estudiante
          </button>
        </div>

        <div className="bx-g" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
          <div className="bx-c">
            <div className="bx-k">Total en cartera</div>
            <div className="bx-v">{total}</div>
            <div className="bx-up">▲ Estudiantes registrados</div>
          </div>
          <div className="bx-c">
            <div className="bx-k">Promedio general</div>
            <div className="bx-v">
              {promedioGeneral.toFixed(1).replace('.', ',')} <small style={{ fontSize: 13, color: 'var(--bx-mu)' }}>/ 20</small>
            </div>
            <div className="bx-up">▲ Promedio de la cartera</div>
          </div>
          <div className="bx-c">
            <div className="bx-k">En riesgo académico</div>
            <div className="bx-v" style={{ color: 'var(--bx-am)' }}>{enRiesgo}</div>
            <div className="bx-k">Requieren seguimiento</div>
          </div>
        </div>

        <div className="bx-g bx-g2">
          <div className="bx-c">
            <div className="bx-toolbar">
              <div className="bx-search">
                <Search size={17} />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por DNI o nombres..."
                  className="bx-in"
                />
              </div>
              <span className="bx-pill">Total en Cartera: {estudiantes.length}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="bx-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>DNI</th>
                    <th style={{ textAlign: 'left' }}>Estudiante</th>
                    <th style={{ textAlign: 'left' }}>Ciclo / Edad</th>
                    <th style={{ textAlign: 'left' }}>Contacto</th>
                    <th style={{ textAlign: 'left' }}>Promedio / Asistencia</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((est) => (
                    <tr key={est.id_estudiante || est.dni}>
                      <td style={{ textAlign: 'left', color: 'var(--bx-or)', fontWeight: 700 }}>{est.dni}</td>
                      <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                        <span className="bx-av">{(est.nombre || ' ')[0]}{(est.apellido || ' ')[0]}</span>
                        {est.nombre} {est.apellido}
                      </td>
                      <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                        Ciclo {est.ciclo_actual} • <span className="bx-k">{est.edad} años</span>
                      </td>
                      <td style={{ textAlign: 'left' }}>
                        <div>{est.correo}</div>
                        <span className="bx-k">{est.telefono}</span>
                      </td>
                      <td style={{ textAlign: 'left', minWidth: 150 }}>
                        <div>
                          <b>{est.promedio_notas}</b> <span className="bx-k">/ 20 ({est.porcentaje_asistencia}%)</span>
                        </div>
                        <div className="bx-bar" style={{ marginTop: 6 }}>
                          <i style={{ width: `${Math.min(100, Number(est.porcentaje_asistencia) || 0)}%` }} />
                        </div>
                      </td>
                      <td>
                        <span className={`bx-b ${badgeEstado(est.estado_universidad)}`}>
                          <CheckCircle2 size={11} />
                          {est.estado_universidad}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bx-c">
            <h3>Distribución por ciclo</h3>
            <svg className="bx-svg" viewBox="0 0 200 200" style={{ maxWidth: 170, margin: '0 auto' }} role="img" aria-label="Distribución por ciclo">
              <defs>
                <linearGradient id="bxa" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ff5a36" />
                  <stop offset="1" stopColor="#c026a8" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="74" fill="none" stroke="#1d1d22" strokeWidth="16" />
              <circle
                cx="100" cy="100" r="74" fill="none" stroke="url(#bxa)" strokeWidth="16" strokeLinecap="round"
                strokeDasharray={`${pctBajos * CIRC} ${CIRC}`} transform="rotate(-90 100 100)"
              />
              <text x="100" y="98" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="700">{Math.round(pctBajos * 100)}%</text>
              <text x="100" y="118" textAnchor="middle" fill="#8b8b93" fontSize="11">ciclos 1 al 5</text>
            </svg>
            <div className="bx-li" style={{ marginTop: 12 }}><span>Ciclos 1 al 5</span><b>{ciclosBajos}</b></div>
            <div className="bx-li"><span>Ciclos 6 al 10</span><b>{total - ciclosBajos}</b></div>
          </div>
        </div>
      </main>

      {/* Modal Deslizable */}
      {modalAbierto && (
        <div className="bx-overlay">
          <div className="bx-drawer">
            <div className="bx-dh">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="bx-ico"><GraduationCap size={22} /></div>
                <div>
                  <h2>Alta de Estudiante</h2>
                  <p>Tabla: estudiantes</p>
                </div>
              </div>
              <button onClick={() => setModalAbierto(false)} className="bx-x" aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            <div className="bx-db">
              <form id="form-estudiante" onSubmit={handleGuardar}>
                <div className="bx-box">
                  <span className="bx-tt">Datos Personales</span>
                  <div className="bx-r2">
                    <div>
                      <label className="bx-lbl">DNI (8 dígitos)</label>
                      <input
                        type="text"
                        name="dni"
                        required
                        maxLength={8}
                        value={nuevo.dni}
                        onChange={handleChange}
                        placeholder="72849103"
                        className="bx-in"
                      />
                    </div>
                    <div>
                      <label className="bx-lbl">Edad</label>
                      <input
                        type="number"
                        name="edad"
                        min="18"
                        max="50"
                        required
                        value={nuevo.edad}
                        onChange={handleChange}
                        className="bx-in"
                      />
                    </div>
                  </div>

                  <div className="bx-r2">
                    <div>
                      <label className="bx-lbl">Nombres</label>
                      <input
                        type="text"
                        name="nombre"
                        required
                        value={nuevo.nombre}
                        onChange={handleChange}
                        placeholder="MATEO"
                        className="bx-in"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    <div>
                      <label className="bx-lbl">Apellidos</label>
                      <input
                        type="text"
                        name="apellido"
                        required
                        value={nuevo.apellido}
                        onChange={handleChange}
                        placeholder="FLORES"
                        className="bx-in"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bx-box">
                  <span className="bx-tt">Académico & Contacto</span>
                  <div className="bx-r2">
                    <div>
                      <label className="bx-lbl">Ciclo Actual (1-10)</label>
                      <input
                        type="number"
                        name="ciclo_actual"
                        min="1"
                        max="10"
                        required
                        value={nuevo.ciclo_actual}
                        onChange={handleChange}
                        className="bx-in"
                      />
                    </div>
                    <div>
                      <label className="bx-lbl">Teléfono (9 dígitos)</label>
                      <input
                        type="text"
                        name="telefono"
                        maxLength={9}
                        value={nuevo.telefono}
                        onChange={handleChange}
                        placeholder="987654321"
                        className="bx-in"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="bx-lbl">Correo Institucional</label>
                    <input
                      type="email"
                      name="correo"
                      value={nuevo.correo}
                      onChange={handleChange}
                      placeholder="alumno@utp.edu.pe"
                      className="bx-in"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="bx-df">
              <button type="button" onClick={() => setModalAbierto(false)} className="bx-ghost">
                Cancelar
              </button>
              <button type="submit" form="form-estudiante" disabled={cargando} className="bx-btn">
                {cargando ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Estudiante</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estudiantes;