import { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  getPrestamos, 
  getEstudiantes, 
  getPagos, 
  postPago, 
  getCuotasPrestamo, 
  anularPago, 
  BACKEND_ACTIVO 
} from '../services/api';
import { Search, Loader2, CheckCircle2, AlertCircle, Wallet, Ban, Coins } from 'lucide-react';

const METODOS = ['YAPE', 'PLIN', 'TRANSFERENCIA BCP', 'PAGOEFECTIVO'];

const haceMeses = (n, dia) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  d.setDate(dia);
  return d.toISOString().slice(0, 10);
};
const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`;
const codCredito = (id) => `CR-${String(id).padStart(3, '0')}`;
const codPago = (id) => `PAG-${String(id).padStart(4, '0')}`;

const Amortizaciones = () => {
  const montoRef = useRef(null);
  const rolUsuario = sessionStorage.getItem('bchp_rol') || 'OPERADOR';
  const esAdmin = rolUsuario === 'ADMIN';

  const [prestamos, setPrestamos] = useState([
    { id_prestamo: 1, id_estudiante: 1, estudiante_nombre: 'DIEGO HUACHACA', monto: 5000.0, cuotas: 12, tasa_interes: 10.0, saldo: 5500.0, estado: 'Activo', dias_mora: 0 },
    { id_prestamo: 2, id_estudiante: 1, estudiante_nombre: 'DIEGO HUACHACA', monto: 1000.0, cuotas: 3, tasa_interes: 10.0, saldo: 1100.0, estado: 'Activo', dias_mora: 0 },
    { id_prestamo: 3, id_estudiante: 2, estudiante_nombre: 'DIANA APOLINARIO', monto: 2000.0, cuotas: 6, tasa_interes: 10.0, saldo: 2200.0, estado: 'Riesgo Temprano', dias_mora: 0 },
  ]);

  const [estudiantesLista, setEstudiantesLista] = useState([
    { id_estudiante: 1, nombre: 'DIEGO', apellido: 'HUACHACA', dni: '12345678' },
    { id_estudiante: 2, nombre: 'DIANA', apellido: 'APOLINARIO', dni: '87654321' },
  ]);

  const [pagos, setPagos] = useState([
    { id_pago: 1, id_prestamo: 1, dni: '12345678', monto: 458.33, cuota_numero: 1, metodo_pago: 'TRANSFERENCIA BCP', fecha_pago: haceMeses(1, 10) }
  ]);

  // Cuotas reales del préstamo seleccionado
  const [cuotasBackend, setCuotasBackend] = useState([]);
  const [cargandoCuotas, setCargandoCuotas] = useState(false);
  const [errorCuotas, setErrorCuotas] = useState('');

  const [idSel, setIdSel] = useState('');
  const [metodo, setMetodo] = useState('YAPE');
  const [montoPago, setMontoPago] = useState('');
  const [cuotaNum, setCuotaNum] = useState('');
  const [montoRecibidoEfectivo, setMontoRecibidoEfectivo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const cargarDatos = async () => {
    try {
      const r = await getPrestamos();
      if (r.data && r.data.length > 0) setPrestamos(r.data);
    } catch (e) {
      if (BACKEND_ACTIVO) setAviso({ tipo: 'err', texto: e.response?.data?.message || 'Error al cargar créditos' });
    }
    try {
      const r = await getEstudiantes();
      if (r.data && r.data.length > 0) setEstudiantesLista(r.data);
    } catch {
      // Ignorar en offline
    }
    try {
      const r = await getPagos();
      if (r.data && r.data.length > 0) setPagos(r.data);
    } catch (e) {
      if (BACKEND_ACTIVO) setAviso({ tipo: 'err', texto: e.response?.data?.message || 'Error al cargar pagos' });
    }
  };

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const resPrestamos = await getPrestamos();
        if (!cancelado && resPrestamos.data && resPrestamos.data.length > 0) {
          setPrestamos(resPrestamos.data);
          if (resPrestamos.data[0]) setIdSel(String(resPrestamos.data[0].id_prestamo));
        }
      } catch (e) {
        if (!cancelado && BACKEND_ACTIVO) setAviso({ tipo: 'err', texto: e.response?.data?.message || 'Error al cargar préstamos' });
      }

      try {
        const resEstudiantes = await getEstudiantes();
        if (!cancelado && resEstudiantes.data && resEstudiantes.data.length > 0) {
          setEstudiantesLista(resEstudiantes.data);
        }
      } catch (e) {
        if (!cancelado && BACKEND_ACTIVO) setAviso({ tipo: 'err', texto: e.response?.data?.message || 'Error al cargar estudiantes' });
      }

      try {
        const resPagos = await getPagos();
        if (!cancelado && resPagos.data && resPagos.data.length > 0) {
          setPagos(resPagos.data);
        }
      } catch (e) {
        if (!cancelado && BACKEND_ACTIVO) setAviso({ tipo: 'err', texto: e.response?.data?.message || 'Error al cargar pagos' });
      }
    })();
    return () => { cancelado = true; };
  }, []);

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  // Créditos cobrables: incluye "Activo" y "Riesgo Temprano" con saldo mayor a 0
  const activos = prestamos.filter((p) => 
    (p.estado === 'Activo' || p.estado === 'Riesgo Temprano') && Number(p.saldo) > 0
  );
  const sel = activos.find((p) => String(p.id_prestamo) === String(idSel)) || activos[0];

  // Cargar cronograma real del préstamo seleccionado
  useEffect(() => {
    let cancelado = false;
    if (!sel?.id_prestamo) return;

    (async () => {
      setCargandoCuotas(true);
      setErrorCuotas('');
      if (BACKEND_ACTIVO) {
        try {
          const resp = await getCuotasPrestamo(sel.id_prestamo);
          if (cancelado) return;
          const cuotasData = resp.data || [];
          setCuotasBackend(cuotasData);

          // Preseleccionar la primera cuota pendiente o vencida
          const primeraPendiente = cuotasData.find(c => c.estado === 'Pendiente' || c.estado === 'Vencida');
          if (primeraPendiente) {
            setCuotaNum(String(primeraPendiente.numero_cuota));
            setMontoPago(Number(primeraPendiente.pendiente || primeraPendiente.monto).toFixed(2));
          }
        } catch (err) {
          if (!cancelado) {
            setErrorCuotas(err.response?.data?.message || 'No se pudo cargar el cronograma desde el servidor');
            setCuotasBackend([]);
          }
        } finally {
          if (!cancelado) setCargandoCuotas(false);
        }
      } else {
        // Cronograma simulado offline
        const total = Number(sel.monto) * (1 + Number(sel.tasa_interes) / 100);
        const cBase = total / Number(sel.cuotas);
        const sim = [];
        for (let i = 1; i <= Number(sel.cuotas); i++) {
          sim.push({
            id_cuota: i,
            numero_cuota: i,
            fecha_vencimiento: `2026-11-${String(i * 5).padStart(2, '0')}`,
            monto: cBase,
            pendiente: cBase,
            pagado: 0,
            estado: 'Pendiente',
            dias_mora: 0,
            monto_mora: 0
          });
        }
        if (!cancelado) {
          setCuotasBackend(sim);
          if (sim[0]) {
            setCuotaNum(String(sim[0].numero_cuota));
            setMontoPago(sim[0].monto.toFixed(2));
          }
          setCargandoCuotas(false);
        }
      }
    })();
    return () => { cancelado = true; };
  }, [sel?.id_prestamo, sel?.monto, sel?.tasa_interes, sel?.cuotas]);

  const dniDe = (pg) => {
    if (pg.dni) return pg.dni;
    const pr = prestamos.find((p) => String(p.id_prestamo) === String(pg.id_prestamo));
    const es = estudiantesLista.find((e) => String(e.id_estudiante) === String(pr?.id_estudiante));
    return es ? es.dni : '—';
  };

  const handleSeleccionarCuota = (c) => {
    setCuotaNum(String(c.numero_cuota));
    const pendiente = Number(c.pendiente !== undefined ? c.pendiente : c.monto);
    setMontoPago(pendiente.toFixed(2));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!sel) {
      setAviso({ tipo: 'err', texto: 'No hay créditos activos para cobrar.' });
      return;
    }
    const montoAbono = parseFloat(montoPago);
    const cuota = parseInt(cuotaNum, 10);
    if (Number.isNaN(montoAbono) || Number.isNaN(cuota)) {
      setAviso({ tipo: 'err', texto: 'Error de validación en la transacción.' });
      return;
    }
    if (montoAbono <= 0) {
      setAviso({ tipo: 'err', texto: 'El monto debe ser mayor a cero.' });
      return;
    }

    setCargando(true);
    const payload = {
      id_prestamo: sel.id_prestamo,
      monto: montoAbono,
      cuota_numero: cuota,
      metodo_pago: metodo
    };

    if (BACKEND_ACTIVO) {
      try {
        await postPago(payload);
        await cargarDatos();
        // Recargar cronograma del crédito
        const respCuotas = await getCuotasPrestamo(sel.id_prestamo);
        setCuotasBackend(respCuotas.data || []);

        setAviso({ tipo: 'ok', texto: `Pago de S/. ${montoAbono.toFixed(2)} registrado exitosamente para la cuota ${cuota}.` });
        setMontoPago('');
        setMontoRecibidoEfectivo('');
      } catch (err) {
        setAviso({ tipo: 'err', texto: err.response?.data?.message || 'No se pudo registrar el pago en el servidor.' });
      } finally {
        setCargando(false);
      }
    } else {
      const saldoActual = Number(sel.saldo);
      setPrestamos((prev) =>
        prev.map((p) =>
          p.id_prestamo === sel.id_prestamo
            ? {
                ...p,
                saldo: Math.max(saldoActual - montoAbono, 0),
                estado: saldoActual - montoAbono <= 0 ? 'Pagado' : 'Activo'
              }
            : p
        )
      );
      setPagos((prev) => [
        {
          ...payload,
          id_pago: prev.reduce((m, x) => Math.max(m, Number(x.id_pago) || 0), 0) + 1,
          dni: dniDe({ id_prestamo: sel.id_prestamo }),
          fecha_pago: new Date().toISOString().slice(0, 10)
        },
        ...prev
      ]);
      setAviso({ tipo: 'ok', texto: 'Amortización procesada en modo local.' });
      setMontoPago('');
      setMontoRecibidoEfectivo('');
      setCargando(false);
    }
  };

  const handleAnularPago = async (idPago) => {
    if (!window.confirm(`¿Está seguro de que desea anular el pago #${idPago}? Se devolverá el saldo al préstamo y se reabrirá la cuota.`)) {
      return;
    }

    setCargando(true);
    if (BACKEND_ACTIVO) {
      try {
        await anularPago(idPago);
        await cargarDatos();
        if (sel?.id_prestamo) {
          const respCuotas = await getCuotasPrestamo(sel.id_prestamo);
          setCuotasBackend(respCuotas.data || []);
        }
        setAviso({ tipo: 'ok', texto: `Pago #${idPago} anulado exitosamente.` });
      } catch (err) {
        setAviso({ tipo: 'err', texto: err.response?.data?.message || 'No se pudo anular el pago' });
      } finally {
        setCargando(false);
      }
    } else {
      setPagos(prev => prev.filter(p => p.id_pago !== idPago));
      setAviso({ tipo: 'ok', texto: `[Modo local] Pago #${idPago} anulado` });
      setCargando(false);
    }
  };

  // Cálculo de vuelto para PAGOEFECTIVO
  const vueltoCalculado = useMemo(() => {
    if (metodo !== 'PAGOEFECTIVO') return 0;
    const recibido = parseFloat(montoRecibidoEfectivo) || 0;
    const aPagar = parseFloat(montoPago) || 0;
    return Math.max(0, recibido - aPagar);
  }, [metodo, montoRecibidoEfectivo, montoPago]);

  const pagosFiltrados = pagos
    .filter((pg) => {
      const q = busqueda.trim().toLowerCase();
      if (!q) return true;
      return (
        codPago(pg.id_pago).toLowerCase().includes(q) ||
        codCredito(pg.id_prestamo).toLowerCase().includes(q) ||
        String(dniDe(pg)).includes(q)
      );
    })
    .sort((a, b) => Number(b.id_pago) - Number(a.id_pago));

  const saldoPorCobrar = activos.reduce((s, p) => s + Number(p.saldo), 0);
  const totalAmortizado = pagos.reduce((s, pg) => s + Number(pg.monto || 0), 0);
  const enMora = prestamos.filter((p) => Number(p.dias_mora) > 0 && Number(p.saldo) > 0).length;

  // Cuotas pendientes o vencidas del crédito seleccionado
  const cuotasCobrables = cuotasBackend.filter(c => c.estado === 'Pendiente' || c.estado === 'Vencida');

  return (
    <div className="bx-app" translate="no">
      <Sidebar />

      <main className="bx-main">
        <div className="bx-hd">
          <div>
            <h1>Procesar amortizaciones</h1>
            <span>Cobros en ventanilla y cronograma oficial de cuotas</span>
          </div>
          <button className="bx-btn" onClick={() => montoRef.current && montoRef.current.focus()}>
            <Wallet size={16} />
            Registrar pago
          </button>
        </div>

        <div className="bx-g bx-g4">
          <div className="bx-c">
            <div className="bx-k">Saldo por cobrar</div>
            <div className="bx-v" style={{ color: 'var(--bx-or)' }}>{soles(saldoPorCobrar)}</div>
            <div className="bx-k">{activos.length} créditos vigentes</div>
          </div>
          <div className="bx-c">
            <div className="bx-k">Total amortizado</div>
            <div className="bx-v">{soles(totalAmortizado)}</div>
            <div className="bx-up">▲ Recaudado en ventanilla</div>
          </div>
          <div className="bx-c">
            <div className="bx-k">Pagos registrados</div>
            <div className="bx-v">{pagos.length}</div>
            <div className="bx-k">Historial global</div>
          </div>
          <div className="bx-c">
            <div className="bx-k">Créditos en mora</div>
            <div className="bx-v" style={{ color: enMora ? 'var(--bx-am)' : undefined }}>{enMora}</div>
            <div className="bx-k">Con días de atraso</div>
          </div>
        </div>

        <div className="bx-g bx-g2">
          {/* Panel de Cronograma Oficial del Préstamo */}
          <div className="bx-c">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>
                {sel ? `Cronograma · ${codCredito(sel.id_prestamo)} (${sel.estudiante_nombre || 'Estudiante'})` : 'Cronograma'}
              </h3>
              {sel?.estado === 'Riesgo Temprano' && (
                <span className="bx-b bx-b-am">Riesgo Temprano</span>
              )}
            </div>

            {errorCuotas && (
              <div className="bx-k" style={{ color: 'var(--bx-rd)', padding: '10px 0' }}>
                {errorCuotas}
              </div>
            )}

            {cargandoCuotas ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} />
              </div>
            ) : cuotasBackend.length > 0 ? (
              <div style={{ overflowX: 'auto', maxHeight: '320px' }}>
                <table className="bx-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Cuota</th>
                      <th>Vencimiento</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Mora</th>
                      <th style={{ textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuotasBackend.map((c) => {
                      const esPendienteOVencida = c.estado === 'Pendiente' || c.estado === 'Vencida';
                      const seleccionada = String(cuotaNum) === String(c.numero_cuota);

                      return (
                        <tr key={c.id_cuota || c.numero_cuota} style={{ background: seleccionada ? 'rgba(255,90,54,0.12)' : undefined }}>
                          <td style={{ fontWeight: 700 }}>Cuota {c.numero_cuota}</td>
                          <td>{c.fecha_vencimiento}</td>
                          <td style={{ fontWeight: 600 }}>S/ {Number(c.monto).toFixed(2)}</td>
                          <td>
                            <span className={`bx-b ${c.estado === 'Pagada' ? 'bx-b-gr' : c.estado === 'Vencida' ? 'bx-b-rd' : 'bx-b-am'}`}>
                              {c.estado}
                            </span>
                          </td>
                          <td>
                            {Number(c.monto_mora) > 0 ? (
                              <span style={{ color: 'var(--bx-rd)', fontWeight: 700 }}>S/ {Number(c.monto_mora).toFixed(2)}</span>
                            ) : (
                              <span style={{ color: 'var(--bx-mu)' }}>-</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {esPendienteOVencida ? (
                              <button
                                type="button"
                                className={`bx-chip ${seleccionada ? 'on' : ''}`}
                                onClick={() => handleSeleccionarCuota(c)}
                              >
                                {seleccionada ? 'Seleccionada' : 'Cobrar'}
                              </button>
                            ) : (
                              <span style={{ color: 'var(--bx-gr)', fontSize: '11px' }}>✓ Cancelada</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bx-k" style={{ padding: '20px 0', textAlign: 'center' }}>
                {sel ? 'No hay cuotas registradas para este crédito.' : 'Sin créditos seleccionados.'}
              </div>
            )}
          </div>

          {/* Formulario de Amortización */}
          <div className="bx-c">
            <h3>Registrar amortización</h3>
            <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="bx-lbl">Seleccione crédito a amortizar</label>
                <select
                  className="bx-in"
                  style={{ cursor: 'pointer' }}
                  value={sel ? sel.id_prestamo : ''}
                  onChange={(e) => setIdSel(e.target.value)}
                >
                  {activos.length === 0 && <option value="">Sin créditos activos con saldo</option>}
                  {activos.map((p) => {
                    const est = estudiantesLista.find((x) => String(x.id_estudiante) === String(p.id_estudiante));
                    const ape = est ? est.apellido : (p.estudiante_nombre || '').split(' ').slice(-1)[0];
                    return (
                      <option key={p.id_prestamo} value={p.id_prestamo}>
                        {codCredito(p.id_prestamo)} ({ape}) - Saldo: S/.{Number(p.saldo).toFixed(2)} [{p.estado}]
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="bx-lbl">Seleccione cuota a cancelar</label>
                <select
                  className="bx-in"
                  value={cuotaNum}
                  onChange={(e) => {
                    const cNum = e.target.value;
                    setCuotaNum(cNum);
                    const cObj = cuotasBackend.find(c => String(c.numero_cuota) === String(cNum));
                    if (cObj) {
                      setMontoPago(Number(cObj.pendiente !== undefined ? cObj.pendiente : cObj.monto).toFixed(2));
                    }
                  }}
                  required
                >
                  {cuotasCobrables.length === 0 && <option value="">No hay cuotas pendientes</option>}
                  {cuotasCobrables.map((c) => (
                    <option key={c.numero_cuota} value={c.numero_cuota}>
                      Cuota {c.numero_cuota} · Vence: {c.fecha_vencimiento} · Pendiente: S/ {Number(c.pendiente || c.monto).toFixed(2)} {Number(c.monto_mora) > 0 ? `(+ S/ ${c.monto_mora} mora)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="bx-lbl">Método de pago</label>
                <div className="bx-methods" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {METODOS.map((m) => (
                    <button type="button" key={m} className={`bx-chip ${metodo === m ? 'on' : ''}`} onClick={() => setMetodo(m)}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bx-r2">
                <div>
                  <label className="bx-lbl">Monto a amortizar (S/.)</label>
                  <input
                    ref={montoRef}
                    type="number"
                    step="0.01"
                    required
                    value={montoPago}
                    onChange={(e) => setMontoPago(e.target.value)}
                    className="bx-in"
                    style={{ fontWeight: 700 }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="bx-lbl">N° Cuota Enviado</label>
                  <input
                    type="number"
                    readOnly
                    value={cuotaNum}
                    className="bx-in"
                    style={{ background: '#121217', color: 'var(--bx-or)', fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Si es PAGOEFECTIVO, mostrar Monto recibido y calcular vuelto en vivo */}
              {metodo === 'PAGOEFECTIVO' && (
                <div style={{ background: '#0e0e12', border: '1px solid var(--bx-line)', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--bx-gr)', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
                    <Coins size={15} /> Pago en Efectivo y Vuelto
                  </div>
                  <div className="bx-r2">
                    <div>
                      <label className="bx-lbl">Monto recibido (S/.)</label>
                      <input
                        type="number"
                        step="0.10"
                        className="bx-in"
                        placeholder="Ej. 500.00"
                        value={montoRecibidoEfectivo}
                        onChange={(e) => setMontoRecibidoEfectivo(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="bx-lbl">Vuelto a entregar</label>
                      <div className="bx-in" style={{ fontWeight: 800, color: 'var(--bx-gr)', fontSize: '15px' }}>
                        S/ {vueltoCalculado.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {aviso && (
                <div className={`bx-aviso ${aviso.tipo}`} role="status">
                  {aviso.tipo === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  {aviso.texto}
                </div>
              )}

              <button type="submit" disabled={cargando} className="bx-btn" style={{ justifyContent: 'center' }}>
                {cargando && <Loader2 size={14} className="animate-spin" />}
                Procesar y confirmar pago
              </button>
            </form>
          </div>
        </div>

        {/* Historial de Pagos con Opción de Anular para ADMIN */}
        <div className="bx-c">
          <div className="bx-toolbar">
            <h3 style={{ margin: 0 }}>Historial de pagos registrados</h3>
            <div className="bx-search">
              <Search size={17} />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por código de pago, crédito o DNI..."
                className="bx-in"
              />
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="bx-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>ID pago</th>
                  <th style={{ textAlign: 'left' }}>Ref. crédito</th>
                  <th style={{ textAlign: 'left' }}>DNI alumno</th>
                  <th style={{ textAlign: 'left' }}>Monto abonado</th>
                  <th style={{ textAlign: 'left' }}>Cuota N°</th>
                  <th style={{ textAlign: 'left' }}>Método</th>
                  <th>Fecha</th>
                  {esAdmin && <th style={{ textAlign: 'center' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.map((pg) => (
                  <tr key={pg.id_pago}>
                    <td style={{ textAlign: 'left', color: 'var(--bx-or)', fontWeight: 700 }}>{codPago(pg.id_pago)}</td>
                    <td style={{ textAlign: 'left' }}>{codCredito(pg.id_prestamo)}</td>
                    <td style={{ textAlign: 'left' }}>{dniDe(pg)}</td>
                    <td style={{ textAlign: 'left', fontWeight: 700 }}>{soles(pg.monto)}</td>
                    <td style={{ textAlign: 'left' }}>{pg.cuota_numero}</td>
                    <td style={{ textAlign: 'left' }}>
                      <span className={`bx-b ${pg.metodo_pago === 'YAPE' || pg.metodo_pago === 'PLIN' ? 'bx-b-mg' : 'bx-b-bl'}`}>{pg.metodo_pago}</span>
                    </td>
                    <td>{String(pg.fecha_pago).slice(0, 10)}</td>
                    {esAdmin && (
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="bx-chip"
                          onClick={() => handleAnularPago(pg.id_pago)}
                          title="Anular pago y restituir saldo a la cuota"
                          style={{ color: 'var(--bx-rd)' }}
                        >
                          <Ban size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          Anular
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {pagosFiltrados.length === 0 && (
                  <tr><td colSpan={esAdmin ? 8 : 7} style={{ textAlign: 'center' }} className="bx-k">Sin pagos que coincidan con la búsqueda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Amortizaciones;