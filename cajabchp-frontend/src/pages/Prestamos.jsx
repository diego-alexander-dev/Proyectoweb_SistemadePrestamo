import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getPrestamos, postPrestamo, getEstudiantes } from '../services/api';
import { 
  CreditCard, 
  Search, 
  PlusCircle, 
  X, 
  Calculator, 
  CheckCircle2, 
  Clock,
  Loader2
} from 'lucide-react';

const Prestamos = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [modalAbierto, setModalAbierto] = useState(searchParams.get('nuevo') === 'true');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  const [prestamos, setPrestamos] = useState([
    {
      id_prestamo: 1,
      id_estudiante: 1,
      estudiante_nombre: 'DIEGO HUACHACA',
      monto: 5000.00,
      cuotas: 12,
      tasa_interes: 10.00,
      saldo: 5500.00,
      estado: 'Activo',
      fecha_inicio: '2026-09-02',
      dias_mora: 0,
      interes_mora: 0.00
    },
    {
      id_prestamo: 2,
      id_estudiante: 1,
      estudiante_nombre: 'DIEGO HUACHACA',
      monto: 1000.00,
      cuotas: 3,
      tasa_interes: 10.00,
      saldo: 1100.00,
      estado: 'Activo',
      fecha_inicio: '2026-09-02',
      dias_mora: 0,
      interes_mora: 0.00
    },
    {
      id_prestamo: 3,
      id_estudiante: 2,
      estudiante_nombre: 'DIANA APOLINARIO',
      monto: 2000.00,
      cuotas: 6,
      tasa_interes: 10.00,
      saldo: 2200.00,
      estado: 'Activo',
      fecha_inicio: '2026-08-28',
      dias_mora: 5,
      interes_mora: 15.50
    },
    {
      id_prestamo: 10,
      id_estudiante: 10,
      estudiante_nombre: 'VALERIA GUTIERREZ',
      monto: 5000.00,
      cuotas: 12,
      tasa_interes: 10.00,
      saldo: 0.00,
      estado: 'Pagado',
      fecha_inicio: '2026-05-10',
      dias_mora: 0,
      interes_mora: 0.00
    }
  ]);

  const [estudiantesLista, setEstudiantesLista] = useState([
    { id_estudiante: 1, nombre: 'DIEGO', apellido: 'HUACHACA', dni: '12345678' },
    { id_estudiante: 2, nombre: 'DIANA', apellido: 'APOLINARIO', dni: '87654321' },
    { id_estudiante: 3, nombre: 'EDUARDO', apellido: 'CAMAC', dni: '11223344' },
    { id_estudiante: 4, nombre: 'MARIA', apellido: 'QUISPE', dni: '99887766' },
    { id_estudiante: 6, nombre: 'LUCIA', apellido: 'TORRES', dni: '33221100' },
    { id_estudiante: 8, nombre: 'ANDREA', apellido: 'FLORES', dni: '66554433' },
    { id_estudiante: 10, nombre: 'VALERIA', apellido: 'GUTIERREZ', dni: '88776655' }
  ]);

 useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resPrestamos = await getPrestamos();
        if (resPrestamos.data && resPrestamos.data.length > 0) {
          setPrestamos(resPrestamos.data);
        }
      } catch (e) {
        void e;
      }

      try {
        const resEstudiantes = await getEstudiantes();
        if (resEstudiantes.data && resEstudiantes.data.length > 0) {
          setEstudiantesLista(resEstudiantes.data);
        }
      } catch (e) {
        void e;
      }
    };

    cargarDatos();
  }, []);
  const [nuevo, setNuevo] = useState({
    id_estudiante: 1,
    monto: 1000,
    cuotas: 6,
    tasa_interes: 10.00
  });

  const handleChange = (e) => {
    setNuevo({ ...nuevo, [e.target.name]: e.target.value });
  };

  const montoNum = parseFloat(nuevo.monto) || 0;
  const cuotasNum = parseInt(nuevo.cuotas) || 1;
  const tasaNum = parseFloat(nuevo.tasa_interes) || 10.00;
  const interesTotal = montoNum * (tasaNum / 100);
  const saldoCalculado = montoNum + interesTotal;
  const cuotaMensualCalculada = cuotasNum > 0 ? (saldoCalculado / cuotasNum).toFixed(2) : '0.00';

  const handleGuardar = async (e) => {
    e.preventDefault();
    setCargando(true);

    const payload = {
      id_estudiante: parseInt(nuevo.id_estudiante),
      monto: montoNum,
      cuotas: cuotasNum,
      tasa_interes: tasaNum,
      saldo: saldoCalculado,
      estado: 'Activo',
      dias_mora: 0,
      interes_mora: 0.00
    };

    try {
      await postPrestamo(payload);
      const resActualizada = await getPrestamos();
      if (resActualizada.data) setPrestamos(resActualizada.data);
    } catch {
      const estudianteSeleccionado = estudiantesLista.find(
        (est) => est.id_estudiante === payload.id_estudiante
      );

      const nuevoRegistro = {
        ...payload,
        id_prestamo: prestamos.length + 1,
        estudiante_nombre: estudianteSeleccionado 
          ? `${estudianteSeleccionado.nombre} ${estudianteSeleccionado.apellido}` 
          : 'ESTUDIANTE REGISTRADO',
        fecha_inicio: new Date().toISOString().split('T')[0]
      };

      setPrestamos([nuevoRegistro, ...prestamos]);
    } finally {
      setCargando(false);
      setModalAbierto(false);
      setNuevo({
        id_estudiante: 1,
        monto: 1000,
        cuotas: 6,
        tasa_interes: 10.00
      });
    }
  };

  const prestamosFiltrados = prestamos.filter((p) => 
    (p.estudiante_nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    String(p.id_prestamo).includes(busqueda)
  );

  // Solo presentación: porcentaje pagado e iniciales
  const pctPagado = (p) => {
    const totalDeuda = Number(p.monto) * (1 + Number(p.tasa_interes) / 100);
    if (!totalDeuda) return 0;
    return Math.max(0, Math.min(100, (1 - Number(p.saldo) / totalDeuda) * 100));
  };
  const iniciales = (nombre) =>
    (nombre || '?').split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('');

  return (
    <div className="bx-app" translate="no">
      <Sidebar />

      <main className="bx-main">
        <div className="bx-hd">
          <div>
            <h1>Gestión de préstamos</h1>
            <span>Colocaciones activas y cobranza</span>
          </div>
          <button onClick={() => setModalAbierto(true)} className="bx-btn">
            <PlusCircle size={16} />
            Nuevo Préstamo
          </button>
        </div>

        <div className="bx-c">
          <div className="bx-toolbar">
            <div className="bx-search">
              <Search size={17} />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por ID o nombre de beneficiario..."
                className="bx-in"
              />
            </div>
            <span className="bx-pill">Colocaciones: {prestamos.length}</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="bx-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>ID</th>
                  <th style={{ textAlign: 'left' }}>Estudiante</th>
                  <th style={{ textAlign: 'left' }}>Monto Capital</th>
                  <th style={{ textAlign: 'left' }}>Plazo & Tasa</th>
                  <th style={{ textAlign: 'left' }}>Saldo Actual</th>
                  <th style={{ textAlign: 'left' }}>Estado de Mora</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {prestamosFiltrados.map((p) => (
                  <tr key={p.id_prestamo}>
                    <td style={{ textAlign: 'left' }}>
                      <b style={{ color: 'var(--bx-or)' }}>#{p.id_prestamo}</b>
                      <div className="bx-k" style={{ fontSize: 10 }}>{p.fecha_inicio}</div>
                    </td>
                    <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                      <span className="bx-av">{iniciales(p.estudiante_nombre)}</span>
                      {p.estudiante_nombre || `Estudiante #${p.id_estudiante}`}
                    </td>
                    <td style={{ textAlign: 'left', fontWeight: 700 }}>
                      S/ {Number(p.monto).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'left' }}>
                      <div>{p.cuotas} meses</div>
                      <span className="bx-k">Tasa: {Number(p.tasa_interes).toFixed(2)}%</span>
                    </td>
                    <td style={{ textAlign: 'left', minWidth: 130 }}>
                      <b>S/ {Number(p.saldo).toFixed(2)}</b>
                      <div className="bx-bar" style={{ marginTop: 6 }}>
                        <i style={{ width: `${pctPagado(p)}%` }} />
                      </div>
                    </td>
                    <td style={{ textAlign: 'left' }}>
                      {p.dias_mora > 0 ? (
                        <span style={{ color: 'var(--bx-rd)', fontWeight: 700, fontSize: 12 }}>
                          {p.dias_mora} días (S/ {Number(p.interes_mora).toFixed(2)})
                        </span>
                      ) : (
                        <span style={{ color: 'var(--bx-gr)', fontWeight: 600, fontSize: 12 }}>Al día</span>
                      )}
                    </td>
                    <td>
                      <span className={`bx-b ${p.estado === 'Activo' ? 'bx-b-gr' : 'bx-b-bl'}`}>
                        {p.estado === 'Activo' ? <Clock size={11} /> : <CheckCircle2 size={11} />}
                        {p.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Desembolso */}
      {modalAbierto && (
        <div className="bx-overlay">
          <div className="bx-drawer">
            <div className="bx-dh">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="bx-ico"><CreditCard size={22} /></div>
                <div>
                  <h2>Aprobar y Desembolsar</h2>
                  <p>Tabla: prestamos • Fondo Educativo</p>
                </div>
              </div>
              <button onClick={() => setModalAbierto(false)} className="bx-x" aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            <div className="bx-db">
              <form id="prestamo-form" onSubmit={handleGuardar}>
                <div className="bx-box">
                  <span className="bx-tt">1. Estudiante Beneficiario</span>
                  <div>
                    <label className="bx-lbl">Padrón de Estudiantes Registrados</label>
                    <select
                      name="id_estudiante"
                      value={nuevo.id_estudiante}
                      onChange={handleChange}
                      className="bx-in"
                      style={{ cursor: 'pointer' }}
                    >
                      {estudiantesLista.map((est) => (
                        <option key={est.id_estudiante} value={est.id_estudiante}>
                          {est.dni} — {est.nombre} {est.apellido}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bx-box">
                  <span className="bx-tt">2. Parámetros Financieros</span>

                  <div className="bx-r2">
                    <div>
                      <label className="bx-lbl">Monto a Desembolsar (S/)</label>
                      <input
                        type="number"
                        name="monto"
                        step="50"
                        min="100"
                        required
                        value={nuevo.monto}
                        onChange={handleChange}
                        className="bx-in"
                        style={{ fontWeight: 700 }}
                      />
                    </div>

                    <div>
                      <label className="bx-lbl">Plazo (Cuotas: 1 a 24)</label>
                      <input
                        type="number"
                        name="cuotas"
                        min="1"
                        max="24"
                        required
                        value={nuevo.cuotas}
                        onChange={handleChange}
                        className="bx-in"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="bx-lbl">Tasa de Interés (%)</label>
                    <input
                      type="number"
                      name="tasa_interes"
                      step="0.5"
                      value={nuevo.tasa_interes}
                      onChange={handleChange}
                      className="bx-in"
                    />
                  </div>
                </div>

                <div className="bx-sim">
                  <div className="bx-li" style={{ borderTop: 0, paddingTop: 0 }}>
                    <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calculator size={14} />
                      Simulación Contable
                    </span>
                    <span className="bx-tag">ALGORITMOS DB</span>
                  </div>

                  <div className="bx-r2" style={{ margin: '4px 0 14px' }}>
                    <div>
                      <div className="bx-k">Interés calculado</div>
                      <b style={{ fontSize: 15 }}>S/ {interesTotal.toFixed(2)}</b>
                    </div>
                    <div>
                      <div className="bx-k">Saldo final (capital + int)</div>
                      <b style={{ fontSize: 15, color: 'var(--bx-or)' }}>S/ {saldoCalculado.toFixed(2)}</b>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,.3)', borderRadius: 14, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="bx-k">Cuota mensual ({cuotasNum} cuotas):</span>
                    <span style={{ fontSize: 24, fontWeight: 700 }}>S/ {cuotaMensualCalculada}</span>
                  </div>
                </div>
              </form>
            </div>

            <div className="bx-df">
              <button type="button" onClick={() => setModalAbierto(false)} className="bx-ghost">
                Cancelar
              </button>
              <button type="submit" form="prestamo-form" disabled={cargando} className="bx-btn">
                {cargando && <Loader2 size={14} className="animate-spin" />}
                Aprobar y Desembolsar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prestamos;