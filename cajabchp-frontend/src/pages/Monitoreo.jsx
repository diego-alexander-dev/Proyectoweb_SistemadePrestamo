import { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { getEstudiantes, getPrestamos } from '../services/api';
import { ShieldAlert, ShieldCheck, Siren, Undo2, Ban, TrendingDown, TrendingUp, PieChart } from 'lucide-react';

// ===== Estructuras equivalentes a las internas de VentanaMonitoreo.java =====
// Cola FIFO de alertas de auditoría (misma disciplina que ColaAlertas)
class ColaAlertas {
  constructor() { this.items = []; }
  encolar(mensaje) { this.items.push({ mensaje, timestamp: Date.now() }); }
  desencolar() { return this.items.shift() || null; }
  get isEmpty() { return this.items.length === 0; }
}

// Persisten a nivel de módulo, igual que los campos static/instancia de la ventana Java
const colaInfracciones = new ColaAlertas();
const pilaRespaldosSaldos = []; // Pila LIFO nativa (push/pop) de instantáneas {id_prestamo: saldo}
let HASH_MAESTRO_ESTUDIANTES = ''; // equivalente a SeguridadBCHP.HASH_MAESTRO_ESTUDIANTES

const sha256Hex = async (texto) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

const FILTROS = [
  'Ver Todo el Alumnado',
  'Rendimiento Deficiente (<12)',
  'Faltas Criticas (<70%)',
  'Alumnos Retirados de U'
];

const soles = (n) => `S/. ${Number(n || 0).toFixed(2)}`;

const Monitoreo = () => {
  const [estudiantes, setEstudiantes] = useState([
    { id_estudiante: 1, nombre: 'DIEGO', apellido: 'HUACHACA', promedio_notas: 16.5, porcentaje_asistencia: 92.0, estado_universidad: 'ACTIVO' },
    { id_estudiante: 2, nombre: 'DIANA', apellido: 'APOLINARIO', promedio_notas: 14.0, porcentaje_asistencia: 85.0, estado_universidad: 'ACTIVO' },
    { id_estudiante: 3, nombre: 'EDUARDO', apellido: 'CAMAC', promedio_notas: 10.0, porcentaje_asistencia: 65.0, estado_universidad: 'ALERTA' },
    { id_estudiante: 4, nombre: 'MARIA', apellido: 'QUISPE', promedio_notas: 18.0, porcentaje_asistencia: 98.0, estado_universidad: 'ACTIVO' },
    { id_estudiante: 10, nombre: 'VALERIA', apellido: 'GUTIERREZ', promedio_notas: 9.0, porcentaje_asistencia: 50.0, estado_universidad: 'RETIRADO' }
  ]);

  const [prestamos, setPrestamos] = useState([
    { id_prestamo: 1, id_estudiante: 1, monto: 5000.0, cuotas: 12, tasa_interes: 10.0, saldo: 5500.0, estado: 'Activo' },
    { id_prestamo: 2, id_estudiante: 1, monto: 1000.0, cuotas: 3, tasa_interes: 10.0, saldo: 1100.0, estado: 'Activo' },
    { id_prestamo: 3, id_estudiante: 2, monto: 2000.0, cuotas: 6, tasa_interes: 10.0, saldo: 2200.0, estado: 'Activo' },
    { id_prestamo: 10, id_estudiante: 10, monto: 5000.0, cuotas: 12, tasa_interes: 10.0, saldo: 800.0, estado: 'Activo' }
  ]);

  useEffect(() => {
    (async () => {
      try {
        const r = await getEstudiantes();
        if (r.data && r.data.length > 0) setEstudiantes(r.data);
      } catch (e) { void e; }
      try {
        const r = await getPrestamos();
        if (r.data && r.data.length > 0) setPrestamos(r.data);
      } catch (e) { void e; }
    })();
  }, []);

  const [criterioFiltro, setCriterioFiltro] = useState(0);
  const [alertaSeguridad, setAlertaSeguridad] = useState(null); // texto del JOptionPane crítico
  const [comboBloqueado, setComboBloqueado] = useState(false); // comboFiltroCumplimiento.setEnabled(false)
  const [rollbackHabilitado, setRollbackHabilitado] = useState(false); // btnRollback.setEnabled(true)
  const [mensajeAlerta, setMensajeAlerta] = useState(null); // resultado de "Atender Alerta"
  const [mensajeRollback, setMensajeRollback] = useState(null);
  const [colaLen, setColaLen] = useState(0);
  const [pilaLen, setPilaLen] = useState(0);
  const primerCalculo = useRef(true);

  // ===== JOIN prestamos + estudiantes (equivalente al INNER JOIN del sqlData) =====
  // Memoizado: antes se recalculaba en cada render, lo que impedía que el
  // React Compiler preservara la memoización de "auditar" (useCallback).
  const filas = useMemo(
    () =>
      prestamos.map((p) => {
        const est = estudiantes.find((e) => String(e.id_estudiante) === String(p.id_estudiante));
        return {
          id_prestamo: p.id_prestamo,
          id_estudiante: p.id_estudiante,
          nombreCompleto: est ? `${est.nombre} ${est.apellido}` : `Estudiante #${p.id_estudiante}`,
          monto: Number(p.monto),
          saldo: Number(p.saldo),
          tasa_interes: Number(p.tasa_interes),
          estado: p.estado,
          nota: est ? Number(est.promedio_notas) : 0,
          asistencia: est ? Number(est.porcentaje_asistencia) : 0,
          estadoMatricula: est ? est.estado_universidad : '—'
        };
      }),
    [prestamos, estudiantes]
  );

  // ===== KPIs (SUM(monto + monto*tasa/100), SUM(saldo)) =====
  const emitido = filas.reduce((s, f) => s + f.monto * (1 + f.tasa_interes / 100), 0);
  const saldoExpuesto = filas.reduce((s, f) => s + f.saldo, 0);
  const recuperado = emitido - saldoExpuesto;

  // ===== Filtro + dictamen (misma tabla de decisión que procesarMatrizCumplimiento) =====
  const filasVisibles = filas.filter((f) => {
    if (criterioFiltro === 0) return true;
    if (criterioFiltro === 1) return f.nota < 12.0;
    if (criterioFiltro === 2) return f.asistencia < 70.0;
    if (criterioFiltro === 3) return String(f.estadoMatricula).toUpperCase() === 'RETIRADO';
    return true;
  });
  const dictamenDe = (f) => {
    if (String(f.estadoMatricula).toUpperCase() === 'RETIRADO') return { txt: 'RESTRICCION: SUSPENDER CREDITO', cls: 'block' };
    if (f.nota < 12.0 || f.asistencia < 70.0) return { txt: 'RIESGO DE DESERCION DETECTADO', cls: 'risk' };
    return { txt: 'SITUACION ESTABLE - APTO', cls: 'ok' };
  };

  // ===== Árbol por saldo: mínimo y máximo (equivalente a ArbolPrestamo) =====
  const maxDeuda = filas.length ? filas.reduce((a, b) => (b.saldo > a.saldo ? b : a)) : null;
  const minDeuda = filas.length ? filas.reduce((a, b) => (b.saldo < a.saldo ? b : a)) : null;

  // ===== Gráfico BI: saldo activo agrupado por estado_universidad =====
  const barras = (() => {
    const mapa = new Map();
    filas.filter((f) => f.estado === 'Activo').forEach((f) => {
      mapa.set(f.estadoMatricula, (mapa.get(f.estadoMatricula) || 0) + f.saldo);
    });
    return Array.from(mapa.entries()).map(([estado, saldo]) => ({ estado, saldo }));
  })();
  const totalBarras = barras.reduce((s, b) => s + b.saldo, 0) || 1;
  const barrasOrdenadas = [...barras].sort((a, b) => b.saldo - a.saldo);
  const colorEstado = (estado) => {
    const e = String(estado).toUpperCase();
    if (e === 'RETIRADO') return { from: '#f43f5e', to: '#fb923c' };
    if (e === 'ALERTA') return { from: '#f59e0b', to: '#fbbf24' };
    return { from: '#22d3ee', to: '#6366f1' };
  };

  // ===== Auditoría criptográfica: cadena inmutable + SHA-256 + cola + pila =====
  // Antes: useCallback(auditar) + useEffect separado que lo invocaba
  // (disparaba "set-state-in-effect" y rompía la memoización porque
  // dependía de "filas", que no estaba memoizado).
  // Ahora: un único efecto asíncrono con bandera de cancelación (cleanup),
  // que es el patrón recomendado por React para efectos con async/await.
  useEffect(() => {
    let cancelado = false;

    (async () => {
      const cadenaInmutable = filas.map((f) => `${f.nombreCompleto}${f.nota}${f.estadoMatricula}${f.saldo}`).join('');
      const snapshotActual = Object.fromEntries(filas.map((f) => [f.id_prestamo, f.saldo]));
      const hashDelMomento = await sha256Hex(cadenaInmutable);

      if (cancelado) return; // el efecto se re-disparó antes de terminar: descartamos este resultado

      if (primerCalculo.current) primerCalculo.current = false;

      if (!HASH_MAESTRO_ESTUDIANTES) {
        HASH_MAESTRO_ESTUDIANTES = hashDelMomento;
        pilaRespaldosSaldos.push(snapshotActual);
        setPilaLen(pilaRespaldosSaldos.length);
        return;
      }

      if (hashDelMomento === HASH_MAESTRO_ESTUDIANTES) {
        setRollbackHabilitado(false);
      } else {
        colaInfracciones.encolar('VIOLACION DE INTEGRIDAD - Saldos alterados fuera del sistema.');
        setColaLen(colaInfracciones.items.length);
        setAlertaSeguridad(
          'Se ha identificado una manipulación externa de los saldos. La firma SHA-256 no coincide. Active el Protocolo de Rollback para restaurar la base de datos.'
        );
        setComboBloqueado(true);
        setRollbackHabilitado(true);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [filas]);

  const procesarProximaAlerta = () => {
    if (colaInfracciones.isEmpty) {
      setMensajeAlerta({ tipo: 'ok', texto: 'El flujo de auditoría se encuentra limpio. Cero anomalías.' });
      return;
    }
    const incidente = colaInfracciones.desencolar();
    setColaLen(colaInfracciones.items.length);
    setMensajeAlerta({
      tipo: 'warn',
      texto: `Desencolando próximo incidente (FIFO): ${incidente.mensaje} — Estado: MITIGADO.`
    });
    if (colaInfracciones.isEmpty) setComboBloqueado(false);
  };

  const ejecutarRollback = () => {
    if (pilaRespaldosSaldos.length === 0) {
      setMensajeRollback({ tipo: 'err', texto: 'No hay respaldos en la pila para restaurar.' });
      return;
    }
    const respaldoLimpio = pilaRespaldosSaldos.pop();
    setPilaLen(pilaRespaldosSaldos.length);

    setPrestamos((prev) =>
      prev.map((p) =>
        Object.prototype.hasOwnProperty.call(respaldoLimpio, p.id_prestamo)
          ? { ...p, saldo: respaldoLimpio[p.id_prestamo] }
          : p
      )
    );

    HASH_MAESTRO_ESTUDIANTES = '';
    setMensajeRollback({
      tipo: 'ok',
      texto: `Rollback completado. Se restauraron ${Object.keys(respaldoLimpio).length} registros desde la pila LIFO.`
    });
    setAlertaSeguridad(null);
    setRollbackHabilitado(false);
    setComboBloqueado(false);
  };

  return (
    <div className="bx-app" translate="no">
      <Sidebar />

      <main className="bx-main">
        <div className="bx-hd">
          <div>
            <h1>Monitoreo académico</h1>
            <span>Reportes, cumplimiento y restricciones</span>
          </div>
        </div>

        <div className="bx-kpi3">
          <div className="bx-kpi blue">
            <div className="t">Capital adjudicado total</div>
            <div className="v">{soles(emitido)}</div>
          </div>
          <div className="bx-kpi green">
            <div className="t">Total recuperado</div>
            <div className="v">{soles(recuperado)}</div>
          </div>
          <div className="bx-kpi red">
            <div className="t">Saldo activo expuesto</div>
            <div className="v">{soles(saldoExpuesto)}</div>
          </div>
        </div>

        {alertaSeguridad && (
          <div className="bx-aviso err">
            <ShieldAlert size={16} />
            <div><b>ALERTA DE SEGURIDAD CRÍTICA</b><br />{alertaSeguridad}</div>
          </div>
        )}

        <div className="bx-g" style={{ gridTemplateColumns: '1fr 1fr 260px' }}>
          <div className="bx-c">
            <h3>Seguimiento de alumnos y restricciones financieras</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="bx-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Estudiante</th>
                    <th style={{ textAlign: 'left' }}>Promedio</th>
                    <th style={{ textAlign: 'left' }}>Asistencia</th>
                    <th style={{ textAlign: 'left' }}>Saldo deuda</th>
                    <th style={{ textAlign: 'left' }}>Situación</th>
                    <th>Dictamen del sistema</th>
                  </tr>
                </thead>
                <tbody>
                  {filasVisibles.map((f) => {
                    const d = dictamenDe(f);
                    return (
                      <tr key={f.id_prestamo}>
                        <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>{f.nombreCompleto}</td>
                        <td style={{ textAlign: 'left' }}>{f.nota}</td>
                        <td style={{ textAlign: 'left' }}>{f.asistencia}%</td>
                        <td style={{ textAlign: 'left' }}>{soles(f.saldo)}</td>
                        <td style={{ textAlign: 'left' }}>{f.estadoMatricula}</td>
                        <td><span className={`bx-dict ${d.cls}`}>{d.txt}</span></td>
                      </tr>
                    );
                  })}
                  {filasVisibles.length === 0 && (
                    <tr><td colSpan={6} className="bx-k" style={{ textAlign: 'center' }}>Sin resultados para este filtro.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bx-c mzn-panel">
            <div className="mzn-head">
              <PieChart size={16} />
              <div>
                <h3 style={{ margin: 0 }}>Panorama de riesgo</h3>
                <span className="mzn-sub">Extremos de la cartera y exposición por situación</span>
              </div>
            </div>

            <div className="mzn-risk-grid">
              <div className="mzn-risk-card mzn-risk-low">
                <div className="mzn-risk-icon"><TrendingDown size={18} /></div>
                <div className="mzn-risk-body">
                  <span className="mzn-risk-tag">Menor riesgo</span>
                  <span className="mzn-risk-name">{minDeuda ? minDeuda.nombreCompleto : '—'}</span>
                  <span className="mzn-risk-amount">{minDeuda ? soles(minDeuda.saldo) : soles(0)}</span>
                </div>
              </div>
              <div className="mzn-risk-card mzn-risk-high">
                <div className="mzn-risk-icon"><TrendingUp size={18} /></div>
                <div className="mzn-risk-body">
                  <span className="mzn-risk-tag">Mayor riesgo</span>
                  <span className="mzn-risk-name">{maxDeuda ? maxDeuda.nombreCompleto : '—'}</span>
                  <span className="mzn-risk-amount">{maxDeuda ? soles(maxDeuda.saldo) : soles(0)}</span>
                </div>
              </div>
            </div>

            <div className="mzn-divider" />

            <div className="mzn-exposure-head">
              <h4 style={{ margin: 0 }}>Exposición por situación</h4>
              <span className="mzn-sub">{soles(totalBarras)} en total</span>
            </div>

            {barrasOrdenadas.length > 0 ? (
              <div className="mzn-ranking">
                {barrasOrdenadas.map((b) => {
                  const pct = Math.round((b.saldo / totalBarras) * 100);
                  const c = colorEstado(b.estado);
                  return (
                    <div className="mzn-rank-row" key={b.estado}>
                      <div className="mzn-rank-top">
                        <span className="mzn-rank-label">{b.estado}</span>
                        <span className="mzn-rank-value">{soles(b.saldo)} <b>· {pct}%</b></span>
                      </div>
                      <div className="mzn-rank-track">
                        <div
                          className="mzn-rank-fill"
                          style={{
                            width: `${Math.max(pct, 3)}%`,
                            background: `linear-gradient(90deg, ${c.from}, ${c.to})`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bx-k">Sin créditos activos para graficar.</div>
            )}

            <style>{`
              .mzn-panel { display: flex; flex-direction: column; gap: 14px; }
              .mzn-head { display: flex; align-items: flex-start; gap: 10px; color: #a5b4fc; }
              .mzn-sub { font-size: 12px; color: #8b93a7; }
              .mzn-risk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
              .mzn-risk-card {
                display: flex; align-items: center; gap: 10px;
                padding: 12px; border-radius: 12px;
                background: rgba(255,255,255,0.03);
                border-left: 3px solid transparent;
              }
              .mzn-risk-low { border-left-color: #22d3ee; }
              .mzn-risk-high { border-left-color: #f43f5e; }
              .mzn-risk-icon {
                width: 34px; height: 34px; border-radius: 10px;
                display: flex; align-items: center; justify-content: center;
                background: rgba(255,255,255,0.06); flex-shrink: 0;
              }
              .mzn-risk-low .mzn-risk-icon { color: #22d3ee; }
              .mzn-risk-high .mzn-risk-icon { color: #f43f5e; }
              .mzn-risk-body { display: flex; flex-direction: column; min-width: 0; }
              .mzn-risk-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #8b93a7; }
              .mzn-risk-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
              .mzn-risk-amount { font-size: 14px; font-weight: 700; }
              .mzn-divider { height: 1px; background: rgba(255,255,255,0.08); }
              .mzn-exposure-head { display: flex; align-items: baseline; justify-content: space-between; }
              .mzn-ranking { display: flex; flex-direction: column; gap: 12px; }
              .mzn-rank-top { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
              .mzn-rank-label { font-weight: 600; }
              .mzn-rank-value { color: #c3c9d9; }
              .mzn-rank-value b { color: #fff; }
              .mzn-rank-track { height: 10px; border-radius: 999px; background: rgba(255,255,255,0.06); overflow: hidden; }
              .mzn-rank-fill { height: 100%; border-radius: 999px; transition: width 0.6s ease; }
            `}</style>
          </div>

          <div className="bx-c bx-side">
            <div>
              <div className="lbl">Filtrar por regla</div>
              <select
                className="bx-in"
                style={{ cursor: comboBloqueado ? 'not-allowed' : 'pointer' }}
                value={criterioFiltro}
                disabled={comboBloqueado}
                onChange={(e) => setCriterioFiltro(Number(e.target.value))}
              >
                {FILTROS.map((f, i) => (
                  <option key={f} value={i}>{f}</option>
                ))}
              </select>
              {comboBloqueado && (
                <div className="bx-k" style={{ marginTop: 6, color: 'var(--bx-rd)' }}>
                  Bloqueado por auditoría hasta atender la alerta.
                </div>
              )}
            </div>

            <button className="bx-abtn amber" onClick={procesarProximaAlerta}>
              <Siren size={15} />
              Atender alerta de intrusión
              {colaLen > 0 && <span className="bx-badgecount">{colaLen}</span>}
            </button>
            {mensajeAlerta && (
              <div className={`bx-aviso ${mensajeAlerta.tipo === 'ok' ? 'ok' : 'err'}`}>
                {mensajeAlerta.tipo === 'ok' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                {mensajeAlerta.texto}
              </div>
            )}

            <button className="bx-abtn red" onClick={ejecutarRollback} disabled={!rollbackHabilitado}>
              <Undo2 size={15} />
              Pánico: Rollback DB
              {pilaLen > 0 && <span className="bx-badgecount">{pilaLen}</span>}
            </button>
            {mensajeRollback && (
              <div className={`bx-aviso ${mensajeRollback.tipo === 'err' ? 'err' : 'ok'}`}>
                {mensajeRollback.tipo === 'err' ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                {mensajeRollback.texto}
              </div>
            )}

            <button className="bx-abtn ghost" disabled title="Sin acción asociada en el sistema original">
              <Ban size={15} />
              Bloquear deserción
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Monitoreo;