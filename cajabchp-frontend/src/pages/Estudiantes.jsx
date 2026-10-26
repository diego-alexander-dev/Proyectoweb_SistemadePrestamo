import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getEstudiantes, postEstudiante, getHistorialEstudiante, BACKEND_ACTIVO } from '../services/api';
import { 
  UserPlus, 
  Search, 
  X, 
  GraduationCap, 
  CheckCircle2, 
  Loader2,
  AlertTriangle,
  History,
  AlertCircle
} from 'lucide-react';

const Estudiantes = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [modalAbierto, setModalAbierto] = useState(searchParams.get('nuevo') === 'true');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorAviso, setErrorAviso] = useState('');

  // Modal Historial
  const [historialModal, setHistorialModal] = useState(null); // datos estudiante
  const [historialDatos, setHistorialDatos] = useState(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

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
      estado_universidad: 'REGULAR',
      ciclo_actual: 5,
      riesgo_temprano: false
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
      estado_universidad: 'REGULAR',
      ciclo_actual: 4,
      riesgo_temprano: true
    }
  ]);

  const cargarEstudiantes = async () => {
    try {
      const res = await getEstudiantes();
      if (res.data && res.data.length > 0) {
        setEstudiantes(res.data);
      }
    } catch (e) {
      if (BACKEND_ACTIVO) {
        setErrorAviso(e.response?.data?.message || 'Error al cargar estudiantes del servidor');
      }
    }
  };

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const res = await getEstudiantes();
        if (!cancelado && res.data && res.data.length > 0) {
          setEstudiantes(res.data);
        }
      } catch (e) {
        if (!cancelado && BACKEND_ACTIVO) {
          setErrorAviso(e.response?.data?.message || 'Error al cargar estudiantes del servidor');
        }
      }
    })();
    return () => { cancelado = true; };
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
    setErrorAviso('');

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
      estado_universidad: 'REGULAR'
    };

    if (BACKEND_ACTIVO) {
      try {
        await postEstudiante(payload);
        await cargarEstudiantes();
        setModalAbierto(false);
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
      } catch (err) {
        // En backend activo NO modificar estado local y mostrar error
        const msg = err.response?.data?.message || err.message || 'No se pudo guardar en el servidor';
        setErrorAviso(msg);
      } finally {
        setCargando(false);
      }
    } else {
      setEstudiantes((prev) => [
        { ...payload, id_estudiante: prev.length + 1, riesgo_temprano: false },
        ...prev
      ]);
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
    }
  };

  const abrirHistorial = async (est) => {
    setHistorialModal(est);
    setCargandoHistorial(true);
    setHistorialDatos(null);

    if (BACKEND_ACTIVO && est.id_estudiante) {
      try {
        const resp = await getHistorialEstudiante(est.id_estudiante);
        setHistorialDatos(resp.data);
      } catch (err) {
        setErrorAviso(err.response?.data?.message || 'No se pudo cargar el historial crediticio');
      } finally {
        setCargandoHistorial(false);
      }
    } else {
      setTimeout(() => {
        setHistorialDatos({
          id_estudiante: est.id_estudiante,
          dni: est.dni,
          estudiante_nombre: `${est.nombre} ${est.apellido}`,
          promedio: est.promedio_notas,
          saldo_total_vigente: 1200.00,
          total_cuotas_vencidas: 1,
          eventos: [
            { id_historial: 1, evento: 'DESEMBOLSO - Préstamo #101', fecha: '2026-09-01', saldo: 1200.00, id_prestamo: 101 },
            { id_historial: 2, evento: 'PAGO - Cuota 1', fecha: '2026-09-20', saldo: 800.00, id_prestamo: 101 },
          ],
          cuotas_vencidas_detalle: [
            { id_cuota: 5, id_prestamo: 101, numero_cuota: 2, fecha_vencimiento: '2026-10-15', monto: 400.00, estado: 'Vencida', dias_mora: 10, monto_mora: 8.00 }
          ]
        });
        setCargandoHistorial(false);
      }, 300);
    }
  };

  const filtrados = estudiantes.filter((est) => 
    (est.nombre + ' ' + est.apellido).toLowerCase().includes(busqueda.toLowerCase()) ||
    est.dni.includes(busqueda)
  );

  const total = estudiantes.length;
  const promedioGeneral = total
    ? estudiantes.reduce((acc, e) => acc + (Number(e.promedio_notas) || 0), 0) / total
    : 0;
  const enRiesgo = estudiantes.filter((e) => e.estado_universidad !== 'REGULAR' && e.estado_universidad !== 'ACTIVO').length;
  const ciclosBajos = estudiantes.filter((e) => Number(e.ciclo_actual) <= 5).length;
  const pctBajos = total ? ciclosBajos / total : 0;
  const CIRC = 464.9;

  const badgeEstado = (estado) =>
    (estado === 'ACTIVO' || estado === 'REGULAR') ? 'bx-b-gr' : estado === 'ALERTA' ? 'bx-b-am' : 'bx-b-rd';

  return (
    <div className="bx-app" translate="no">
      <Sidebar />

      <main className="bx-main">
        <div className="bx-hd">
          <div>
            <h1>Registro de estudiantes</h1>
            <span>Cartera activa del semestre y seguimiento crediticio</span>
          </div>
          <button onClick={() => setModalAbierto(true)} className="bx-btn">
            <UserPlus size={16} />
            Nuevo Estudiante
          </button>
        </div>

        {errorAviso && (
          <div className="bx-c" style={{ borderLeft: '4px solid var(--bx-rd)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} color="var(--bx-rd)" />
            <span style={{ color: 'var(--bx-rd)', fontWeight: 600 }}>{errorAviso}</span>
          </div>
        )}

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
                    <th style={{ textAlign: 'left' }}>Promedio / Asistencia</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'center' }}>Historial</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((est) => (
                    <tr key={est.id_estudiante || est.dni}>
                      <td style={{ textAlign: 'left', color: 'var(--bx-or)', fontWeight: 700 }}>{est.dni}</td>
                      <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                        <span className="bx-av">{(est.nombre || ' ')[0]}{(est.apellido || ' ')[0]}</span>
                        {est.nombre} {est.apellido}
                        {est.riesgo_temprano && (
                          <span className="bx-b bx-b-am" style={{ marginLeft: '8px' }} title="Tiene cuotas próximas a vencer mañana">
                            <AlertTriangle size={10} /> Riesgo Temprano
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                        Ciclo {est.ciclo_actual} • <span className="bx-k">{est.edad} años</span>
                      </td>
                      <td style={{ textAlign: 'left', minWidth: 140 }}>
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
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="bx-chip on"
                          onClick={() => abrirHistorial(est)}
                          title="Ver historial financiero y crediticio"
                        >
                          <History size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          Historial
                        </button>
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

        {/* Modal Historial Financiero */}
        {historialModal && (
          <div className="bx-overlay" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="bx-c" style={{ width: '90%', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Historial Crediticio del Estudiante</h3>
                  <span className="bx-k">{historialModal.nombre} {historialModal.apellido} · DNI {historialModal.dni}</span>
                </div>
                <button className="bx-out" onClick={() => setHistorialModal(null)} style={{ fontSize: '18px' }}>✕</button>
              </div>

              {cargandoHistorial ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} />
                </div>
              ) : historialDatos ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#0e0e12', padding: '12px', borderRadius: '12px' }}>
                    <div>
                      <div className="bx-k">Deuda Total Vigente</div>
                      <div className="bx-v" style={{ fontSize: '18px', color: 'var(--bx-or)' }}>S/ {Number(historialDatos.saldo_total_vigente || 0).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="bx-k">Cuotas Vencidas</div>
                      <div className="bx-v" style={{ fontSize: '18px', color: historialDatos.total_cuotas_vencidas > 0 ? 'var(--bx-rd)' : 'var(--bx-gr)' }}>
                        {historialDatos.total_cuotas_vencidas || 0}
                      </div>
                    </div>
                    <div>
                      <div className="bx-k">Promedio Académico</div>
                      <div className="bx-v" style={{ fontSize: '18px' }}>{historialDatos.promedio || '-'}</div>
                    </div>
                  </div>

                  {/* Cuotas Vencidas si existen */}
                  {historialDatos.cuotas_vencidas_detalle && historialDatos.cuotas_vencidas_detalle.length > 0 && (
                    <div>
                      <h4 style={{ color: 'var(--bx-rd)', fontSize: '13px', marginBottom: '8px' }}>⚠ Cuotas Vencidas con Recargo de Mora</h4>
                      <table className="bx-table">
                        <thead>
                          <tr>
                            <th>Préstamo</th>
                            <th>Cuota</th>
                            <th>Vencimiento</th>
                            <th>Monto</th>
                            <th>Días Mora</th>
                            <th>Recargo Mora</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historialDatos.cuotas_vencidas_detalle.map((cv) => (
                            <tr key={cv.id_cuota}>
                              <td>#{cv.id_prestamo}</td>
                              <td>Cuota {cv.numero_cuota}</td>
                              <td>{cv.fecha_vencimiento}</td>
                              <td>S/ {Number(cv.monto_cuota || cv.monto || 0).toFixed(2)}</td>
                              <td style={{ color: 'var(--bx-rd)', fontWeight: 700 }}>{cv.dias_mora} días</td>
                              <td style={{ color: 'var(--bx-rd)', fontWeight: 700 }}>S/ {Number(cv.monto_mora || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Lista de Eventos */}
                  <div>
                    <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>Línea de Tiempo de Eventos Financieros</h4>
                    {historialDatos.eventos && historialDatos.eventos.length > 0 ? (
                      <table className="bx-table">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Evento</th>
                            <th>Saldo Resultante</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historialDatos.eventos.map((ev) => (
                            <tr key={ev.id_historial}>
                              <td>{ev.fecha}</td>
                              <td style={{ fontWeight: 600 }}>{ev.evento}</td>
                              <td style={{ color: 'var(--bx-gr)' }}>S/ {Number(ev.saldo || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="bx-k" style={{ padding: '16px', textAlign: 'center' }}>
                        No hay eventos registrados en el historial de este estudiante.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button className="bx-ghost" onClick={() => setHistorialModal(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Alta de Estudiante */}
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
      </main>
    </div>
  );
};

export default Estudiantes;