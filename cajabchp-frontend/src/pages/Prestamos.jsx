import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { 
  getPrestamos, 
  postPrestamo, 
  getEstudiantes, 
  getScoringEstudiante, 
  previewCronograma, 
  anularPrestamo, 
  BACKEND_ACTIVO 
} from '../services/api';
import { 
  CreditCard, 
  Search, 
  PlusCircle, 
  X, 
  Calculator, 
  CheckCircle2, 
  Clock,
  Loader2,
  AlertTriangle,
  Ban,
  Printer,
  Sparkles,
  AlertCircle
} from 'lucide-react';

const Prestamos = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const rolUsuario = sessionStorage.getItem('bchp_rol') || 'OPERADOR';
  const esAdmin = rolUsuario === 'ADMIN';

  const [modalAbierto, setModalAbierto] = useState(searchParams.get('nuevo') === 'true');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorAviso, setErrorAviso] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Voucher imprimible
  const [voucherModal, setVoucherModal] = useState(null);

  // Scoring y cronograma preview
  const [scoringData, setScoringData] = useState(null);
  const [cronogramaPreviewLista, setCronogramaPreviewLista] = useState([]);
  const [cargandoPreview, setCargandoPreview] = useState(false);

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
      id_estudiante: 2,
      estudiante_nombre: 'DIANA APOLINARIO',
      monto: 2000.00,
      cuotas: 6,
      tasa_interes: 8.00,
      saldo: 2160.00,
      estado: 'Riesgo Temprano',
      fecha_inicio: '2026-08-28',
      dias_mora: 0,
      interes_mora: 0.00
    }
  ]);

  const [estudiantesLista, setEstudiantesLista] = useState([
    { id_estudiante: 1, nombre: 'DIEGO', apellido: 'HUACHACA', dni: '12345678', promedio_notas: 16.5 },
    { id_estudiante: 2, nombre: 'DIANA', apellido: 'APOLINARIO', dni: '87654321', promedio_notas: 14.0 },
  ]);

  const cargarDatos = async () => {
    try {
      const resPrestamos = await getPrestamos();
      if (resPrestamos.data && resPrestamos.data.length > 0) {
        setPrestamos(resPrestamos.data);
      }
    } catch (e) {
      if (BACKEND_ACTIVO) setErrorAviso(e.response?.data?.message || 'Error al cargar préstamos');
    }

    try {
      const resEstudiantes = await getEstudiantes();
      if (resEstudiantes.data && resEstudiantes.data.length > 0) {
        setEstudiantesLista(resEstudiantes.data);
      }
    } catch (e) {
      if (BACKEND_ACTIVO) setErrorAviso(e.response?.data?.message || 'Error al cargar estudiantes');
    }
  };

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const resPrestamos = await getPrestamos();
        if (!cancelado && resPrestamos.data && resPrestamos.data.length > 0) {
          setPrestamos(resPrestamos.data);
        }
      } catch (e) {
        if (!cancelado && BACKEND_ACTIVO) setErrorAviso(e.response?.data?.message || 'Error al cargar préstamos');
      }

      try {
        const resEstudiantes = await getEstudiantes();
        if (!cancelado && resEstudiantes.data && resEstudiantes.data.length > 0) {
          setEstudiantesLista(resEstudiantes.data);
        }
      } catch (e) {
        if (!cancelado && BACKEND_ACTIVO) setErrorAviso(e.response?.data?.message || 'Error al cargar estudiantes');
      }
    })();
    return () => { cancelado = true; };
  }, []);

  const [nuevo, setNuevo] = useState({
    id_estudiante: 1,
    monto: 1000,
    cuotas: 6,
    tasa_interes: 10.00
  });

  // Al abrir el modal o cambiar el estudiante, consultar el scoring y tasa dinámica
  useEffect(() => {
    if (!modalAbierto || !nuevo.id_estudiante) return;

    const consultarScoring = async () => {
      if (BACKEND_ACTIVO) {
        try {
          const resp = await getScoringEstudiante(nuevo.id_estudiante);
          const sc = resp.data;
          setScoringData(sc);
          if (sc.tasa_sugerida) {
            setNuevo(prev => ({ ...prev, tasa_interes: Number(sc.tasa_sugerida) }));
          }
        } catch {
          setScoringData(null);
        }
      } else {
        const est = estudiantesLista.find(e => e.id_estudiante === Number(nuevo.id_estudiante));
        const prom = est ? Number(est.promedio_notas || 14) : 14;
        const tasa = prom > 16 ? 8.0 : 10.0;
        setScoringData({
          score: prom > 16 ? 88 : 68,
          dictamen: prom > 16 ? 'EXCELENTE' : 'ACEPTABLE',
          tasa_sugerida: tasa,
          deuda_vigente: 0,
          promedio: prom,
          asistencia: 90
        });
        setNuevo(prev => ({ ...prev, tasa_interes: tasa }));
      }
    };

    consultarScoring();
  }, [modalAbierto, nuevo.id_estudiante, estudiantesLista]);

  // Al cambiar monto, cuotas o tasa, obtener la vista previa del cronograma
  useEffect(() => {
    if (!modalAbierto) return;

    const timer = setTimeout(async () => {
      const m = parseFloat(nuevo.monto) || 0;
      const c = parseInt(nuevo.cuotas) || 1;
      const t = parseFloat(nuevo.tasa_interes) || 10.00;
      if (m <= 0 || c <= 0) return;

      setCargandoPreview(true);
      if (BACKEND_ACTIVO) {
        try {
          const resp = await previewCronograma({
            monto: m,
            cuotas: c,
            tasa_interes: t
          });
          setCronogramaPreviewLista(resp.data || []);
        } catch {
          setCronogramaPreviewLista([]);
        } finally {
          setCargandoPreview(false);
        }
      } else {
        const factor = 1 + (t / 100);
        const total = m * factor;
        const cuotaBase = +(total / c).toFixed(2);
        let acumulado = 0;
        const cuotasLocales = [];
        const hoy = new Date();
        for (let i = 1; i <= c; i++) {
          const venc = new Date(hoy.getFullYear(), hoy.getMonth() + i, hoy.getDate()).toISOString().split('T')[0];
          let valorCuota = cuotaBase;
          if (i === c) {
            valorCuota = +(total - acumulado).toFixed(2);
          } else {
            acumulado += cuotaBase;
          }
          cuotasLocales.push({
            numero_cuota: i,
            fecha_vencimiento: venc,
            monto: valorCuota,
            estado: 'Pendiente'
          });
        }
        setCronogramaPreviewLista(cuotasLocales);
        setCargandoPreview(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [modalAbierto, nuevo.monto, nuevo.cuotas, nuevo.tasa_interes]);

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
    setErrorAviso('');
    setMensajeExito('');

    // Payload SIN saldo (lo calcula el servidor)
    const payload = {
      id_estudiante: parseInt(nuevo.id_estudiante),
      monto: montoNum,
      cuotas: cuotasNum,
      tasa_interes: tasaNum,
    };

    if (BACKEND_ACTIVO) {
      try {
        const resp = await postPrestamo(payload);
        const prestamoCreado = resp.data;
        setMensajeExito(`Préstamo #${prestamoCreado.id_prestamo} desembolsado exitosamente.`);
        await cargarDatos();
        setModalAbierto(false);

        // Abrir voucher imprimible
        const estudianteSeleccionado = estudiantesLista.find(
          (est) => est.id_estudiante === payload.id_estudiante
        );
        setVoucherModal({
          ...prestamoCreado,
          estudiante_nombre: estudianteSeleccionado ? `${estudianteSeleccionado.nombre} ${estudianteSeleccionado.apellido}` : prestamoCreado.estudiante_nombre,
          dni: estudianteSeleccionado?.dni || '',
        });
      } catch (err) {
        setErrorAviso(err.response?.data?.message || err.message || 'No se pudo desembolsar el préstamo en el servidor');
      } finally {
        setCargando(false);
      }
    } else {
      const estudianteSeleccionado = estudiantesLista.find(
        (est) => est.id_estudiante === payload.id_estudiante
      );
      const nuevoRegistro = {
        ...payload,
        saldo: saldoCalculado,
        id_prestamo: prestamos.length + 1,
        estudiante_nombre: estudianteSeleccionado 
          ? `${estudianteSeleccionado.nombre} ${estudianteSeleccionado.apellido}` 
          : 'ESTUDIANTE REGISTRADO',
        fecha_inicio: new Date().toISOString().split('T')[0],
        estado: 'Activo',
        dias_mora: 0,
        interes_mora: 0.00
      };
      setPrestamos([nuevoRegistro, ...prestamos]);
      setModalAbierto(false);
      setCargando(false);
      setVoucherModal({
        ...nuevoRegistro,
        dni: estudianteSeleccionado?.dni || ''
      });
    }
  };

  const handleAnularPrestamo = async (idPrestamo) => {
    if (!window.confirm(`¿Está seguro de que desea anular el préstamo #${idPrestamo}? Esta acción no se puede revertir y anulará sus cuotas asociadas.`)) {
      return;
    }

    setCargando(true);
    setErrorAviso('');
    setMensajeExito('');

    if (BACKEND_ACTIVO) {
      try {
        await anularPrestamo(idPrestamo);
        setMensajeExito(`Préstamo #${idPrestamo} anulado exitosamente.`);
        await cargarDatos();
      } catch (err) {
        setErrorAviso(err.response?.data?.message || err.message || 'No se pudo anular el préstamo');
      } finally {
        setCargando(false);
      }
    } else {
      setPrestamos(prev => prev.map(p => p.id_prestamo === idPrestamo ? { ...p, estado: 'Anulado' } : p));
      setMensajeExito(`[Modo local] Préstamo #${idPrestamo} anulado`);
      setCargando(false);
    }
  };

  const prestamosFiltrados = prestamos.filter((p) => 
    (p.estudiante_nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    String(p.id_prestamo).includes(busqueda)
  );

  const pctPagado = (p) => {
    const totalDeuda = Number(p.monto) * (1 + Number(p.tasa_interes) / 100);
    if (!totalDeuda) return 0;
    return Math.max(0, Math.min(100, (1 - Number(p.saldo) / totalDeuda) * 100));
  };

  const iniciales = (nombre) =>
    (nombre || '?').split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('');

  const badgeClaseEstado = (estado) => {
    if (estado === 'Activo') return 'bx-b-gr';
    if (estado === 'Riesgo Temprano') return 'bx-b-am';
    if (estado === 'Pagado') return 'bx-b-bl';
    return 'bx-b-rd';
  };

  return (
    <div className="bx-app" translate="no">
      <Sidebar />

      <main className="bx-main">
        <div className="bx-hd">
          <div>
            <h1>Gestión de préstamos</h1>
            <span>Colocaciones activas, scoring dinámico y cobranza</span>
          </div>
          <button onClick={() => setModalAbierto(true)} className="bx-btn">
            <PlusCircle size={16} />
            Nuevo Préstamo
          </button>
        </div>

        {mensajeExito && (
          <div className="bx-c" style={{ borderLeft: '4px solid var(--bx-gr)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="var(--bx-gr)" />
            <span style={{ color: 'var(--bx-gr)', fontWeight: 600 }}>{mensajeExito}</span>
          </div>
        )}

        {errorAviso && (
          <div className="bx-c" style={{ borderLeft: '4px solid var(--bx-rd)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} color="var(--bx-rd)" />
            <span style={{ color: 'var(--bx-rd)', fontWeight: 600 }}>{errorAviso}</span>
          </div>
        )}

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
                  {esAdmin && <th style={{ textAlign: 'center' }}>Acciones</th>}
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
                      <span className={`bx-b ${badgeClaseEstado(p.estado)}`}>
                        {p.estado === 'Activo' ? <Clock size={11} /> : p.estado === 'Riesgo Temprano' ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                        {p.estado}
                      </span>
                    </td>
                    {esAdmin && (
                      <td style={{ textAlign: 'center' }}>
                        {p.estado !== 'Anulado' && p.estado !== 'Pagado' && (
                          <button
                            className="bx-chip"
                            onClick={() => handleAnularPrestamo(p.id_prestamo)}
                            title="Anular préstamo sin pagos (Solo Administrador)"
                            style={{ color: 'var(--bx-rd)' }}
                          >
                            <Ban size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            Anular
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Desembolso con Scoring y Cronograma Preview */}
      {modalAbierto && (
        <div className="bx-overlay">
          <div className="bx-drawer" style={{ maxWidth: '640px' }}>
            <div className="bx-dh">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="bx-ico"><CreditCard size={22} /></div>
                <div>
                  <h2>Aprobar y Desembolsar</h2>
                  <p>Evaluación de riesgo crediticio y cronograma de cuotas</p>
                </div>
              </div>
              <button onClick={() => setModalAbierto(false)} className="bx-x" aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            <div className="bx-db" style={{ overflowY: 'auto' }}>
              <form id="prestamo-form" onSubmit={handleGuardar}>
                <div className="bx-box">
                  <span className="bx-tt">1. Estudiante Beneficiario</span>
                  <div>
                    <label className="bx-lbl">Seleccione al Estudiante</label>
                    <select
                      name="id_estudiante"
                      value={nuevo.id_estudiante}
                      onChange={handleChange}
                      className="bx-in"
                      style={{ cursor: 'pointer' }}
                    >
                      {estudiantesLista.map((est) => (
                        <option key={est.id_estudiante} value={est.id_estudiante}>
                          {est.dni} — {est.nombre} {est.apellido} {est.promedio_notas ? `(Prom: ${est.promedio_notas})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Panel de Scoring Crediticio */}
                  {scoringData && (
                    <div style={{ marginTop: '12px', background: '#09090c', border: '1px solid var(--bx-line)', borderRadius: '12px', padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--bx-or)', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
                        <Sparkles size={14} />
                        Scoring Crediticio Automático
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
                        <div style={{ background: '#121217', padding: '8px', borderRadius: '8px' }}>
                          <span className="bx-k" style={{ fontSize: '10px' }}>SCORE</span>
                          <div style={{ fontWeight: 800, fontSize: '16px', color: scoringData.score >= 80 ? 'var(--bx-gr)' : 'var(--bx-am)' }}>
                            {scoringData.score} pts
                          </div>
                        </div>
                        <div style={{ background: '#121217', padding: '8px', borderRadius: '8px' }}>
                          <span className="bx-k" style={{ fontSize: '10px' }}>DICTAMEN</span>
                          <div style={{ fontWeight: 800, fontSize: '13px', marginTop: '2px', color: scoringData.dictamen === 'EXCELENTE' ? 'var(--bx-gr)' : 'var(--bx-or)' }}>
                            {scoringData.dictamen}
                          </div>
                        </div>
                        <div style={{ background: '#121217', padding: '8px', borderRadius: '8px' }}>
                          <span className="bx-k" style={{ fontSize: '10px' }}>TASA DINÁMICA</span>
                          <div style={{ fontWeight: 800, fontSize: '16px', color: '#6db4ff' }}>
                            {scoringData.tasa_sugerida}%
                          </div>
                        </div>
                        <div style={{ background: '#121217', padding: '8px', borderRadius: '8px' }}>
                          <span className="bx-k" style={{ fontSize: '10px' }}>DEUDA VIGENTE</span>
                          <div style={{ fontWeight: 800, fontSize: '14px', marginTop: '2px' }}>
                            S/ {Number(scoringData.deuda_vigente || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                    <label className="bx-lbl">
                      Tasa de Interés (%) {!esAdmin && <span style={{ color: 'var(--bx-mu)', fontSize: '11px' }}>(Fijada por el sistema según promedio)</span>}
                    </label>
                    <input
                      type="number"
                      name="tasa_interes"
                      step="0.5"
                      readOnly={!esAdmin}
                      value={nuevo.tasa_interes}
                      onChange={handleChange}
                      className="bx-in"
                      style={{ background: !esAdmin ? '#121217' : undefined, color: !esAdmin ? '#3ddc97' : undefined, fontWeight: 700 }}
                    />
                  </div>
                </div>

                <div className="bx-sim">
                  <div className="bx-li" style={{ borderTop: 0, paddingTop: 0 }}>
                    <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calculator size={14} />
                      Simulación Contable Servidor
                    </span>
                    <span className="bx-tag">CRONOGRAMA REAL</span>
                  </div>

                  <div className="bx-r2" style={{ margin: '4px 0 14px' }}>
                    <div>
                      <div className="bx-k">Interés calculado</div>
                      <b style={{ fontSize: 15 }}>S/ {interesTotal.toFixed(2)}</b>
                    </div>
                    <div>
                      <div className="bx-k">Saldo final estimado</div>
                      <b style={{ fontSize: 15, color: 'var(--bx-or)' }}>S/ {saldoCalculado.toFixed(2)}</b>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,.3)', borderRadius: 14, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="bx-k">Cuota mensual ({cuotasNum} cuotas):</span>
                    <span style={{ fontSize: 24, fontWeight: 700 }}>S/ {cuotaMensualCalculada}</span>
                  </div>
                </div>

                {/* Vista Previa del Cronograma de Cuotas */}
                <div className="bx-box" style={{ marginTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="bx-tt" style={{ margin: 0 }}>3. Vista Previa de Cuotas</span>
                    {cargandoPreview && <Loader2 size={12} className="animate-spin" />}
                  </div>

                  {cronogramaPreviewLista.length > 0 ? (
                    <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      <table className="bx-table" style={{ fontSize: '12px' }}>
                        <thead>
                          <tr>
                            <th>N°</th>
                            <th>Vencimiento</th>
                            <th style={{ textAlign: 'right' }}>Monto Cuota</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cronogramaPreviewLista.map((c) => (
                            <tr key={c.numero_cuota}>
                              <td>Cuota {c.numero_cuota}</td>
                              <td>{c.fecha_vencimiento}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>S/ {Number(c.monto).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <span className="bx-k" style={{ fontSize: '11px' }}>Ingrese monto y cuotas válidas para generar la vista previa</span>
                  )}
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

      {/* Modal Voucher Imprimible */}
      {voucherModal && (
        <div className="bx-overlay" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="bx-c" style={{ width: '90%', maxWidth: '480px', background: '#fff', color: '#000', borderRadius: '16px', padding: '24px' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #ccc', paddingBottom: '14px', marginBottom: '14px' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800 }}>CAJA BCHP - FONDO EDUCATIVO</h2>
              <div style={{ fontSize: '12px', color: '#666' }}>COMPROBANTE DE DESEMBOLSO DE CRÉDITO</div>
              <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '6px' }}>Préstamo #{voucherModal.id_prestamo}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Fecha de Emisión:</span>
                <strong>{voucherModal.fecha_inicio || new Date().toISOString().split('T')[0]}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Beneficiario:</span>
                <strong>{voucherModal.estudiante_nombre}</strong>
              </div>
              {voucherModal.dni && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>DNI:</span>
                  <strong>{voucherModal.dni}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Monto Capital:</span>
                <strong>S/ {Number(voucherModal.monto).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Tasa de Interés:</span>
                <strong>{voucherModal.tasa_interes}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Plazo Acordado:</span>
                <strong>{voucherModal.cuotas} cuotas mensuales</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '8px', fontSize: '15px' }}>
                <span>Total a Amortizar:</span>
                <strong style={{ color: '#ff5a36' }}>S/ {Number(voucherModal.saldo).toFixed(2)}</strong>
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '2px dashed #ccc', paddingTop: '16px' }}>
              <p style={{ fontSize: '11px', color: '#888', margin: '0 0 16px' }}>
                Conserve este comprobante para sus pagos en ventanilla universitaria.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ background: '#000', color: '#fff', border: 0, padding: '10px 18px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={16} /> Imprimir Voucher
                </button>
                <button
                  type="button"
                  onClick={() => setVoucherModal(null)}
                  style={{ background: '#eee', color: '#333', border: 0, padding: '10px 18px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prestamos;