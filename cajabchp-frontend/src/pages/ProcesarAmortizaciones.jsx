import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { getPrestamos, getEstudiantes, getPagos, postPago } from '../services/api';
import { Search, Loader2, CheckCircle2, AlertCircle, Wallet } from 'lucide-react';

const METODOS = ['YAPE', 'PLIN', 'TRANSFERENCIA BCP', 'PAGOEFECTIVO'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const CIRC = 464.9;

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

  const [prestamos, setPrestamos] = useState([
    { id_prestamo: 1, id_estudiante: 1, estudiante_nombre: 'DIEGO HUACHACA', monto: 5000.0, cuotas: 12, tasa_interes: 10.0, saldo: 5500.0, estado: 'Activo', dias_mora: 0 },
    { id_prestamo: 2, id_estudiante: 1, estudiante_nombre: 'DIEGO HUACHACA', monto: 1000.0, cuotas: 3, tasa_interes: 10.0, saldo: 1100.0, estado: 'Activo', dias_mora: 0 },
    { id_prestamo: 3, id_estudiante: 2, estudiante_nombre: 'DIANA APOLINARIO', monto: 2000.0, cuotas: 6, tasa_interes: 10.0, saldo: 2200.0, estado: 'Activo', dias_mora: 5 },
    { id_prestamo: 10, id_estudiante: 10, estudiante_nombre: 'VALERIA GUTIERREZ', monto: 5000.0, cuotas: 12, tasa_interes: 10.0, saldo: 0.0, estado: 'Pagado', dias_mora: 0 }
  ]);

  const [estudiantesLista, setEstudiantesLista] = useState([
    { id_estudiante: 1, nombre: 'DIEGO', apellido: 'HUACHACA', dni: '12345678' },
    { id_estudiante: 2, nombre: 'DIANA', apellido: 'APOLINARIO', dni: '87654321' },
    { id_estudiante: 10, nombre: 'VALERIA', apellido: 'GUTIERREZ', dni: '88776655' }
  ]);

  const [pagos, setPagos] = useState([
    { id_pago: 1, id_prestamo: 10, dni: '88776655', monto: 458.33, cuota_numero: 11, metodo_pago: 'PAGOEFECTIVO', fecha_pago: haceMeses(4, 12) },
    { id_pago: 2, id_prestamo: 10, dni: '88776655', monto: 458.33, cuota_numero: 12, metodo_pago: 'YAPE', fecha_pago: haceMeses(3, 15) },
    { id_pago: 3, id_prestamo: 3, dni: '87654321', monto: 366.67, cuota_numero: 1, metodo_pago: 'PLIN', fecha_pago: haceMeses(2, 8) },
    { id_pago: 4, id_prestamo: 1, dni: '12345678', monto: 458.33, cuota_numero: 1, metodo_pago: 'TRANSFERENCIA BCP', fecha_pago: haceMeses(1, 10) }
  ]);

  useEffect(() => {
    const cargar = async () => {
      try {
        const r = await getPrestamos();
        if (r.data && r.data.length > 0) setPrestamos(r.data);
      } catch (e) { void e; }
      try {
        const r = await getEstudiantes();
        if (r.data && r.data.length > 0) setEstudiantesLista(r.data);
      } catch (e) { void e; }
      try {
        const r = await getPagos();
        if (r.data && r.data.length > 0) setPagos(r.data);
      } catch (e) { void e; }
    };
    cargar();
  }, []);

  const [idSel, setIdSel] = useState('');
  const [metodo, setMetodo] = useState('YAPE');
  const [montoPago, setMontoPago] = useState('');
  const [cuotaNum, setCuotaNum] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 4500);
    return () => clearTimeout(t);
  }, [aviso]);

  // Créditos con saldo pendiente (igual que el combo de RegistroPagos)
  const activos = prestamos.filter((p) => Number(p.saldo) > 0);
  const sel = activos.find((p) => String(p.id_prestamo) === String(idSel)) || activos[0];

  const dniDe = (pg) => {
    if (pg.dni) return pg.dni;
    const pr = prestamos.find((p) => String(p.id_prestamo) === String(pg.id_prestamo));
    const es = estudiantesLista.find((e) => String(e.id_estudiante) === String(pr?.id_estudiante));
    return es ? es.dni : '—';
  };

  const recargarDatos = async () => {
    try {
      const r = await getPrestamos();
      if (r.data) setPrestamos(r.data);
    } catch (e) { void e; }
    try {
      const r = await getPagos();
      if (r.data) setPagos(r.data);
    } catch (e) { void e; }
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

    try {
      await postPago(payload);
      await recargarDatos();
    } catch {
      // Modo desconectado: misma regla SQL (saldo = max(saldo - monto, 0), estado Pagado si llega a 0)
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
    }

    setAviso({ tipo: 'ok', texto: 'Amortización procesada y saldo actualizado.' });
    setMontoPago('');
    setCuotaNum('');
    setCargando(false);
  };

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

  // ---- Indicadores derivados (solo lectura) ----
  const saldoPorCobrar = activos.reduce((s, p) => s + Number(p.saldo), 0);
  const totalAmortizado = pagos.reduce((s, pg) => s + Number(pg.monto || 0), 0);
  const enMora = prestamos.filter((p) => Number(p.dias_mora) > 0 && Number(p.saldo) > 0).length;

  // Serie mensual de los últimos 6 meses
  const serie = (() => {
    const hoy = new Date();
    const arr = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      arr.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MESES[d.getMonth()], total: 0 });
    }
    pagos.forEach((pg) => {
      const m = arr.find((x) => x.key === String(pg.fecha_pago).slice(0, 7));
      if (m) m.total += Number(pg.monto) || 0;
    });
    return arr;
  })();
  const maxSerie = Math.max(...serie.map((s) => s.total), 0);
  const escala = maxSerie || 1;
  const pts = serie.map((s, i) => [40 + i * 96, 180 - (s.total / escala) * 130]);
  const trazo = pts
    .map((p, i) => {
      if (i === 0) return `M${p[0]} ${p[1]}`;
      const mx = (pts[i - 1][0] + p[0]) / 2;
      return `C${mx} ${pts[i - 1][1]} ${mx} ${p[1]} ${p[0]} ${p[1]}`;
    })
    .join(' ');
  const iMax = maxSerie > 0 ? serie.findIndex((s) => s.total === maxSerie) : -1;

  // ---- Crédito seleccionado ----
  const totalDeuda = sel ? Number(sel.monto) * (1 + Number(sel.tasa_interes) / 100) : 0;
  const pctPagado = sel && totalDeuda ? Math.max(0, Math.min(100, (1 - Number(sel.saldo) / totalDeuda) * 100)) : 0;
  const cuotaSugerida = sel && Number(sel.cuotas) > 0 ? totalDeuda / Number(sel.cuotas) : 0;
  const pagosSel = sel ? pagos.filter((pg) => String(pg.id_prestamo) === String(sel.id_prestamo)) : [];
  const cuotasPagadas = new Set(pagosSel.map((pg) => Number(pg.cuota_numero))).size;
  const proxima = sel ? Math.min(cuotasPagadas + 1, Number(sel.cuotas)) : 0;

  const usarCuotaSugerida = () => {
    if (!sel) return;
    setMontoPago(Math.min(cuotaSugerida, Number(sel.saldo)).toFixed(2));
    setCuotaNum(String(proxima));
  };

  return (
    <div className="bx-app" translate="no">
      <Sidebar />

      <main className="bx-main">
        <div className="bx-hd">
          <div>
            <h1>Procesar amortizaciones</h1>
            <span>Cobros y cronograma de cuotas</span>
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
            <div className="bx-k">{activos.length} créditos con saldo</div>
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
          <div className="bx-c">
            <h3>Recaudación mensual</h3>
            <svg className="bx-svg" viewBox="0 0 560 220" role="img" aria-label="Recaudación de los últimos seis meses">
              <defs>
                <linearGradient id="bxam" x1="0" x2="1">
                  <stop offset="0" stopColor="#ff5a36" />
                  <stop offset="1" stopColor="#c026a8" />
                </linearGradient>
              </defs>
              <g stroke="#1d1d22" strokeDasharray="4 5">
                <path d="M0 50H560M0 100H560M0 150H560M0 180H560" />
              </g>
              <path d={trazo} fill="none" stroke="url(#bxam)" strokeWidth="3.5" strokeLinecap="round" />
              {iMax >= 0 && (
                <g>
                  <circle cx={pts[iMax][0]} cy={pts[iMax][1]} r="7" fill="#ff5a36" stroke="#fff" strokeWidth="2" />
                  <rect x={Math.min(Math.max(pts[iMax][0] - 52, 4), 452)} y={Math.max(pts[iMax][1] - 42, 4)} width="104" height="26" rx="13" fill="#ff5a36" />
                  <text x={Math.min(Math.max(pts[iMax][0], 56), 504)} y={Math.max(pts[iMax][1] - 25, 21)} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">
                    + {soles(maxSerie).replace('.00', '')}
                  </text>
                </g>
              )}
              <g fill="#8b8b93" fontSize="11" textAnchor="middle">
                {serie.map((s, i) => (
                  <text key={s.key} x={pts[i][0]} y="208" fill={i === iMax ? '#fff' : '#8b8b93'} fontWeight={i === iMax ? 700 : 400}>{s.label}</text>
                ))}
              </g>
            </svg>
          </div>

          <div className="bx-c">
            <h3>Registrar amortización</h3>
            <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="bx-lbl">Seleccione crédito</label>
                <select
                  className="bx-in"
                  style={{ cursor: 'pointer' }}
                  value={sel ? sel.id_prestamo : ''}
                  onChange={(e) => setIdSel(e.target.value)}
                >
                  {activos.length === 0 && <option value="">Sin créditos activos</option>}
                  {activos.map((p) => {
                    const est = estudiantesLista.find((x) => String(x.id_estudiante) === String(p.id_estudiante));
                    const ape = est ? est.apellido : (p.estudiante_nombre || '').split(' ').slice(-1)[0];
                    return (
                      <option key={p.id_prestamo} value={p.id_prestamo}>
                        {codCredito(p.id_prestamo)} ({ape}) - Saldo: S/.{Number(p.saldo).toFixed(2)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="bx-lbl">Método de pago</label>
                <div className="bx-methods">
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
                  <label className="bx-lbl">Número de cuota</label>
                  <input
                    type="number"
                    required
                    value={cuotaNum}
                    onChange={(e) => setCuotaNum(e.target.value)}
                    className="bx-in"
                    placeholder="1"
                  />
                </div>
              </div>

              <button type="button" className="bx-link-btn" style={{ textAlign: 'left' }} onClick={usarCuotaSugerida}>
                Usar cuota sugerida ({soles(cuotaSugerida)} · cuota {proxima || '—'})
              </button>

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

        <div className="bx-g bx-g2">
          <div className="bx-c">
            <div className="bx-toolbar">
              <h3 style={{ margin: 0 }}>Historial de pagos</h3>
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
                    </tr>
                  ))}
                  {pagosFiltrados.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center' }} className="bx-k">Sin pagos que coincidan con la búsqueda.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bx-c">
            <h3>{sel ? `Cronograma · ${codCredito(sel.id_prestamo)}` : 'Cronograma'}</h3>
            {sel ? (
              <>
                <svg className="bx-svg" viewBox="0 0 200 200" style={{ maxWidth: 160, margin: '0 auto' }} role="img" aria-label="Porcentaje pagado del crédito">
                  <circle cx="100" cy="100" r="74" fill="none" stroke="#1d1d22" strokeWidth="16" />
                  <circle cx="100" cy="100" r="74" fill="none" stroke="url(#bxam)" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${(pctPagado / 100) * CIRC} ${CIRC}`} transform="rotate(-90 100 100)" />
                  <text x="100" y="98" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="700">{Math.round(pctPagado)}%</text>
                  <text x="100" y="118" textAnchor="middle" fill="#8b8b93" fontSize="11">pagado</text>
                </svg>
                <div className="bx-tl" aria-label="Cuotas del crédito">
                  {Array.from({ length: Number(sel.cuotas) || 0 }, (_, i) => (
                    <i key={i} className={i + 1 <= cuotasPagadas ? 'ok' : i + 1 === proxima ? 'now' : ''} />
                  ))}
                </div>
                <div className="bx-k" style={{ marginBottom: 8 }}>
                  {cuotasPagadas} de {sel.cuotas} cuotas pagadas · próxima: cuota {proxima}
                </div>
                <div className="bx-li"><span>Estudiante</span><b>{sel.estudiante_nombre}</b></div>
                <div className="bx-li"><span>Cuota sugerida</span><b>{soles(cuotaSugerida)}</b></div>
                <div className="bx-li"><span>Saldo actual</span><b>{soles(sel.saldo)}</b></div>
                <div className="bx-li">
                  <span>Estado de mora</span>
                  {Number(sel.dias_mora) > 0
                    ? <b style={{ color: 'var(--bx-rd)' }}>{sel.dias_mora} días</b>
                    : <b style={{ color: 'var(--bx-gr)' }}>Al día</b>}
                </div>
              </>
            ) : (
              <div className="bx-k">No hay créditos activos para cobrar.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Amortizaciones;