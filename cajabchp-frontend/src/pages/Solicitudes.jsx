import { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { getSolicitudes, putSolicitudEstado, getScoringEstudiante, BACKEND_ACTIVO } from '../services/api';
import {
  Gauge,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  KeyRound,
  Download,
  Users,
  TrendingUp,
  Clock,
  X,
  FileCheck2
} from 'lucide-react';

// ===== Utilidades criptográficas (equivalente a SeguridadBCHP.calcularSHA256) =====
const sha256Hex = async (texto) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

const OTP_UMBRAL = 2000.0; // mismo umbral que "montoReal >= 2000.00" en el sistema original
const OTP_VENTANA_SEG = 120; // el token se genera por bloques de 120s (2 min), igual que Java

const ESTADOS = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'ESCALADO'];

const soles = (n) => `S/. ${Number(n || 0).toFixed(2)}`;
const solId = (id) => `SOL-${String(id).padStart(3, '0')}`;
const iniciales = (nombre) =>
  (nombre || '?').split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('');

const Solicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([
    { id_solicitud: 1, id_estudiante: 1, nombreCompleto: 'DIEGO HUACHACA', promedio: 16.5, asistencia: 92, ciclo: 5, monto_solicitado: 3000, cuotas_solicitadas: 12, estado_solicitud: 'PENDIENTE', recomendacion_sistema: 'APTO - ALTA PRIORIDAD' },
    { id_solicitud: 2, id_estudiante: 2, nombreCompleto: 'DIANA APOLINARIO', promedio: 13.0, asistencia: 85, ciclo: 4, monto_solicitado: 1200, cuotas_solicitadas: 6, estado_solicitud: 'PENDIENTE', recomendacion_sistema: 'APTO - PRIORIDAD MEDIA' },
    { id_solicitud: 3, id_estudiante: 3, nombreCompleto: 'EDUARDO CAMAC', promedio: 10.0, asistencia: 65, ciclo: 2, monto_solicitado: 800, cuotas_solicitadas: 6, estado_solicitud: 'PENDIENTE', recomendacion_sistema: 'REVISAR - RIESGO ACADEMICO' },
    { id_solicitud: 4, id_estudiante: 4, nombreCompleto: 'MARIA QUISPE', promedio: 18.0, asistencia: 98, ciclo: 6, monto_solicitado: 4500, cuotas_solicitadas: 18, estado_solicitud: 'PENDIENTE', recomendacion_sistema: 'APTO - ALTA PRIORIDAD' },
    { id_solicitud: 5, id_estudiante: 6, nombreCompleto: 'LUCIA TORRES', promedio: 15.5, asistencia: 88, ciclo: 8, monto_solicitado: 2500, cuotas_solicitadas: 12, estado_solicitud: 'ESCALADO', recomendacion_sistema: 'ESCALADO - VALIDAR DOCUMENTOS' },
    { id_solicitud: 6, id_estudiante: 8, nombreCompleto: 'ANDREA FLORES', promedio: 12.0, asistencia: 70, ciclo: 3, monto_solicitado: 1500, cuotas_solicitadas: 9, estado_solicitud: 'APROBADO', recomendacion_sistema: 'APTO - PRIORIDAD MEDIA' },
    { id_solicitud: 7, id_estudiante: 10, nombreCompleto: 'VALERIA GUTIERREZ', promedio: 9.0, asistencia: 50, ciclo: 10, monto_solicitado: 900, cuotas_solicitadas: 6, estado_solicitud: 'RECHAZADO', recomendacion_sistema: 'NO APTO - PROMEDIO INSUFICIENTE' }
  ]);

  const [filtroEstado, setFiltroEstado] = useState('PENDIENTE');
  const [toast, setToast] = useState(null);
  const [scoreModal, setScoreModal] = useState(null); // { solicitud, score, dictamen, color, tasa_sugerida, deuda_vigente }
  const [otpModal, setOtpModal] = useState(null); // { solicitud, token, restante, input, error }
  const [contratoModal, setContratoModal] = useState(null); // { solicitud, firma, texto, tasa }
  const otpTimerRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await getSolicitudes();
        if (r.data && r.data.length > 0) setSolicitudes(r.data);
      } catch (e) {
        if (BACKEND_ACTIVO) {
          const msg = e.response?.data?.message || 'Error al conectar con el servidor de solicitudes';
          setToast({ tipo: 'error', texto: msg });
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ===== Filtro por estado =====
  const solicitudesFiltradas = useMemo(
    () => solicitudes.filter((s) => s.estado_solicitud === filtroEstado),
    [solicitudes, filtroEstado]
  );

  // ===== Agrupación por rendimiento =====
  const altoRendimiento = solicitudesFiltradas.filter((s) => s.promedio >= 15.0);
  const regular = solicitudesFiltradas.filter((s) => s.promedio < 15.0);

  const contadorPorEstado = (estado) => solicitudes.filter((s) => s.estado_solicitud === estado).length;

  // ===== Calcular Score (con tasa dinámica y deuda vigente del servidor) =====
  const calcularScore = async (s) => {
    const ptsPromedio = (s.promedio / 20.0) * 40.0;
    const ptsAsistencia = (s.asistencia / 100.0) * 40.0;
    let ptsCiclo = 0;
    if (s.ciclo >= 4 && s.ciclo <= 7) ptsCiclo = 20.0;
    else if (s.ciclo >= 1 && s.ciclo <= 3) ptsCiclo = 15.0;
    else if (s.ciclo >= 8 && s.ciclo <= 10) ptsCiclo = 10.0;

    let scoreTotal = Math.round(ptsPromedio + ptsAsistencia + ptsCiclo);
    let dictamen;
    let color;
    let tasaSugerida = s.promedio > 16.0 ? 8.0 : 10.0;
    let deudaVigente = 0.0;

    if (scoreTotal >= 80) { dictamen = 'EXCELENTE'; color = '#34d399'; }
    else if (scoreTotal >= 60) { dictamen = 'ACEPTABLE'; color = '#fbbf24'; }
    else { dictamen = 'CRÍTICO'; color = '#fb7185'; }

    if (BACKEND_ACTIVO && s.id_estudiante) {
      try {
        const scRes = await getScoringEstudiante(s.id_estudiante);
        if (scRes.data) {
          scoreTotal = scRes.data.score;
          dictamen = scRes.data.dictamen;
          tasaSugerida = scRes.data.tasa_sugerida;
          deudaVigente = scRes.data.deuda_vigente || 0.0;
          if (scoreTotal >= 80) color = '#34d399';
          else if (scoreTotal >= 60) color = '#fbbf24';
          else color = '#fb7185';
        }
      } catch (err) {
        void err;
      }
    }

    setScoreModal({
      solicitud: s,
      score: scoreTotal,
      dictamen,
      color,
      tasa_sugerida: tasaSugerida,
      deuda_vigente: deudaVigente
    });
  };

  // ===== Actualiza estado con validación estricta y tasa real del servidor =====
  const aplicarEstado = async (s, nuevoEstado) => {
    if (BACKEND_ACTIVO) {
      try {
        await putSolicitudEstado(s.id_solicitud, { estado_solicitud: nuevoEstado });
        setSolicitudes((prev) =>
          prev.map((x) => (x.id_solicitud === s.id_solicitud ? { ...x, estado_solicitud: nuevoEstado } : x))
        );
      } catch (e) {
        const msg = e.response?.data?.message || 'No se pudo guardar en el servidor';
        setToast({ tipo: 'error', texto: msg });
        return; // Detiene sin modificar estado local si falla en servidor
      }
    } else {
      setSolicitudes((prev) =>
        prev.map((x) => (x.id_solicitud === s.id_solicitud ? { ...x, estado_solicitud: nuevoEstado } : x))
      );
    }

    if (nuevoEstado === 'APROBADO') {
      const tasaAsignada = s.promedio > 16.0 ? 8.0 : 10.0;
      const firma = await sha256Hex(`${s.nombreCompleto}${s.monto_solicitado}${s.id_solicitud}`);
      const texto =
        `SISTEMA BCHP - CONTRATO DE CRÉDITO EDUCATIVO\n\n` +
        `Por medio del presente documento, se certifica la aprobación y desembolso del crédito universitario ` +
        `a favor del estudiante: ${s.nombreCompleto.toUpperCase()}.\n\n` +
        `CONDICIONES DEL FINANCIAMIENTO:\n` +
        `- Monto Adjudicado: ${soles(s.monto_solicitado)}\n` +
        `- Plazo de Amortización: ${s.cuotas_solicitadas} meses.\n` +
        `- Tasa de Interés Asignada: ${tasaAsignada.toFixed(2)}% anual (${s.promedio > 16 ? 'Tasa Excelencia Académica' : 'Tasa Base Universitaria'})\n` +
        `- Fecha de Aprobación: ${new Date().toLocaleDateString()}\n\n` +
        `El estudiante se compromete a cumplir con el cronograma de pagos establecido.\n\n` +
        `FIRMA DIGITAL Y AUDITORÍA:\n${firma}\n`;
      setContratoModal({ solicitud: s, firma, texto, tasa: tasaAsignada });
      setToast({ tipo: 'ok', texto: `${solId(s.id_solicitud)} aprobada. Contrato generado con tasa ${tasaAsignada}%.` });
    } else {
      setToast({ tipo: 'warn', texto: `${solId(s.id_solicitud)} marcada como ${nuevoEstado}.` });
    }
  };

  // ===== Aprobar: exige OTP si el monto >= umbral =====
  const iniciarAprobacion = async (s) => {
    if (s.monto_solicitado >= OTP_UMBRAL) {
      const generarToken = async () => {
        const bloque = Math.floor(Date.now() / 1000 / OTP_VENTANA_SEG);
        const hash = await sha256Hex(`BCHP-OTP-${bloque}`);
        return hash.substring(0, 6).toUpperCase();
      };
      const token = await generarToken();
      const restanteInicial = OTP_VENTANA_SEG - (Math.floor(Date.now() / 1000) % OTP_VENTANA_SEG);
      setOtpModal({ solicitud: s, token, restante: restanteInicial, input: '', error: null });
    } else {
      aplicarEstado(s, 'APROBADO');
    }
  };

  // ===== Cuenta regresiva + regeneración de token cada 2 minutos, igual que "Expira en 2 min" en Java =====
  // El cuerpo del setInterval ya usa la forma funcional setOtpModal(prev => ...), que
  // siempre lee el estado más reciente, así que no necesita "otpModal" en las deps para
  // eso. El único uso directo de "otpModal" era la guarda inicial (if (!otpModal) return),
  // y ESE es el que ESLint detectaba como dependencia faltante. La solución NO es agregar
  // "otpModal" completo a las deps: como "otpModal.restante" cambia cada segundo, el efecto
  // se reiniciaría en cada tick y el setInterval jamás llegaría a completar un ciclo.
  // En vez de eso, se saca solo el id de la solicitud (lo único que realmente decide si
  // hay que iniciar/reiniciar el temporizador) y se usa esa misma variable adentro y en
  // las deps, para que la guarda y el arreglo de dependencias queden consistentes.
  const otpSolicitudId = otpModal?.solicitud?.id_solicitud;

  useEffect(() => {
    if (!otpSolicitudId) return;
    otpTimerRef.current = setInterval(async () => {
      setOtpModal((prev) => {
        if (!prev) return prev;
        const nuevoRestante = prev.restante - 1;
        if (nuevoRestante <= 0) {
          (async () => {
            const bloque = Math.floor(Date.now() / 1000 / OTP_VENTANA_SEG);
            const hash = await sha256Hex(`BCHP-OTP-${bloque}`);
            setOtpModal((p) => (p ? { ...p, token: hash.substring(0, 6).toUpperCase(), restante: OTP_VENTANA_SEG } : p));
          })();
          return prev;
        }
        return { ...prev, restante: nuevoRestante };
      });
    }, 1000);
    return () => clearInterval(otpTimerRef.current);
  }, [otpSolicitudId]);

  const confirmarOtp = () => {
    if (!otpModal) return;
    if (otpModal.input.trim().toUpperCase() === otpModal.token) {
      const s = otpModal.solicitud;
      setOtpModal(null);
      aplicarEstado(s, 'APROBADO');
    } else {
      setOtpModal((prev) => ({ ...prev, error: 'Token incorrecto. Operación abortada.' }));
    }
  };

  const descargarContrato = () => {
    if (!contratoModal) return;
    const blob = new Blob([contratoModal.texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contrato_BCHP_${solId(contratoModal.solicitud.id_solicitud)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bx-app" translate="no">
      <Sidebar />

      <main className="bx-main">
        <div className="bx-hd">
          <div>
            <h1>Evaluación de solicitudes</h1>
            <span>Mesa de control: aprobación y priorización de créditos</span>
          </div>
        </div>

        <div className="sol-toolbar">
          {ESTADOS.map((e) => (
            <button
              key={e}
              className={`sol-tab ${filtroEstado === e ? 'active' : ''}`}
              onClick={() => setFiltroEstado(e)}
            >
              {e}
              <span className="sol-tab-count">{contadorPorEstado(e)}</span>
            </button>
          ))}
        </div>

        <div className="sol-grid">
          <div className="bx-c">
            <h3 style={{ marginTop: 0 }}>Solicitudes de crédito · {filtroEstado}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="bx-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Solicitud</th>
                    <th style={{ textAlign: 'left' }}>Estudiante</th>
                    <th style={{ textAlign: 'left' }}>Promedio</th>
                    <th style={{ textAlign: 'left' }}>Monto</th>
                    <th style={{ textAlign: 'left' }}>Cuotas</th>
                    <th style={{ textAlign: 'left' }}>Recomendación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudesFiltradas.map((s) => {
                    const resuelta = s.estado_solicitud === 'APROBADO' || s.estado_solicitud === 'RECHAZADO';
                    return (
                      <tr key={s.id_solicitud}>
                        <td style={{ textAlign: 'left' }}>
                          <b style={{ color: 'var(--bx-or)' }}>{solId(s.id_solicitud)}</b>
                        </td>
                        <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                          <span className="bx-av">{iniciales(s.nombreCompleto)}</span>
                          {s.nombreCompleto}
                        </td>
                        <td style={{ textAlign: 'left' }}>
                          <span className={`sol-badge ${s.promedio >= 15 ? 'high' : 'reg'}`}>{s.promedio.toFixed(1)}</span>
                        </td>
                        <td style={{ textAlign: 'left', fontWeight: 700 }}>{soles(s.monto_solicitado)}</td>
                        <td style={{ textAlign: 'left' }}>{s.cuotas_solicitadas}</td>
                        <td style={{ textAlign: 'left' }} className="bx-k">{s.recomendacion_sistema}</td>
                        <td>
                          <div className="sol-actions">
                            <button className="sol-iconbtn score" title="Calcular score" onClick={() => calcularScore(s)}>
                              <Gauge size={15} />
                            </button>
                            <button
                              className="sol-iconbtn ok"
                              title="Aprobar solicitud"
                              disabled={resuelta}
                              onClick={() => iniciarAprobacion(s)}
                            >
                              <CheckCircle2 size={15} />
                            </button>
                            <button
                              className="sol-iconbtn no"
                              title="Rechazar solicitud"
                              disabled={resuelta}
                              onClick={() => aplicarEstado(s, 'RECHAZADO')}
                            >
                              <XCircle size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {solicitudesFiltradas.length === 0 && (
                    <tr><td colSpan={7} className="bx-k" style={{ textAlign: 'center' }}>No hay solicitudes en estado {filtroEstado}.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bx-c sol-priority">
            <div className="sol-priority-head">
              <Users size={16} />
              <div>
                <h3 style={{ margin: 0 }}>Priorización académica</h3>
                <span className="mzn-sub">Agrupado por rendimiento del solicitante</span>
              </div>
            </div>

            <div className="sol-group">
              <div className="sol-group-title high"><TrendingUp size={13} /> Alto rendimiento (≥ 15)</div>
              {altoRendimiento.length === 0 && <div className="bx-k" style={{ padding: '4px 2px' }}>Sin solicitudes en este grupo.</div>}
              {altoRendimiento.map((s) => (
                <div className="sol-chip" key={s.id_solicitud} onClick={() => calcularScore(s)}>
                  <span className="sol-av high">{iniciales(s.nombreCompleto)}</span>
                  <div className="sol-chip-info">
                    <span className="name">{s.nombreCompleto}</span>
                    <span className="bx-k">{soles(s.monto_solicitado)} · Prom. {s.promedio.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="sol-group">
              <div className="sol-group-title reg"><Clock size={13} /> Rendimiento regular (&lt; 15)</div>
              {regular.length === 0 && <div className="bx-k" style={{ padding: '4px 2px' }}>Sin solicitudes en este grupo.</div>}
              {regular.map((s) => (
                <div className="sol-chip" key={s.id_solicitud} onClick={() => calcularScore(s)}>
                  <span className="sol-av reg">{iniciales(s.nombreCompleto)}</span>
                  <div className="sol-chip-info">
                    <span className="name">{s.nombreCompleto}</span>
                    <span className="bx-k">{soles(s.monto_solicitado)} · Prom. {s.promedio.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ===== Toast ===== */}
      {toast && (
        <div className={`sol-toast ${toast.tipo}`}>
          {toast.tipo === 'ok' ? <ShieldCheck size={16} /> : <ShieldCheck size={16} />}
          {toast.texto}
        </div>
      )}

      {/* ===== Modal: Score financiero (anillo circular) ===== */}
      {scoreModal && (
        <div className="bx-overlay" onClick={() => setScoreModal(null)}>
          <div className="sol-modal" onClick={(e) => e.stopPropagation()}>
            <button className="bx-x" onClick={() => setScoreModal(null)} aria-label="Cerrar"><X size={18} /></button>
            <h3 style={{ marginTop: 0 }}>Score financiero</h3>
            <p className="bx-k">{scoreModal.solicitud.nombreCompleto} · {solId(scoreModal.solicitud.id_solicitud)}</p>

            <div className="sol-ring-wrap">
              <svg viewBox="0 0 120 120" width="150" height="150">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={scoreModal.color} strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - scoreModal.score / 100)}
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 0.7s ease' }}
                />
                <text x="60" y="55" textAnchor="middle" fontSize="26" fontWeight="700" fill="#fff">{scoreModal.score}</text>
                <text x="60" y="74" textAnchor="middle" fontSize="10" fill="#8b93a7">/ 100</text>
              </svg>
              <div className="sol-dictamen" style={{ color: scoreModal.color }}>{scoreModal.dictamen}</div>
            </div>

            <div className="sol-score-breakdown">
              <div><span>Promedio académico</span><b>{((scoreModal.solicitud.promedio / 20) * 40).toFixed(1)} pts</b></div>
              <div><span>Asistencia</span><b>{((scoreModal.solicitud.asistencia / 100) * 40).toFixed(1)} pts</b></div>
              <div><span>Ciclo actual ({scoreModal.solicitud.ciclo})</span><b>{(scoreModal.score - ((scoreModal.solicitud.promedio / 20) * 40) - ((scoreModal.solicitud.asistencia / 100) * 40)).toFixed(1)} pts</b></div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6, marginTop: 4 }}>
                <span>Tasa dinámica aplicable:</span>
                <b style={{ color: scoreModal.tasa_sugerida <= 8 ? '#34d399' : 'var(--bx-or)' }}>
                  {Number(scoreModal.tasa_sugerida || 10).toFixed(2)}% anual
                </b>
              </div>
              <div>
                <span>Deuda vigente activa:</span>
                <b style={{ color: scoreModal.deuda_vigente > 0 ? '#fb7185' : '#34d399' }}>
                  {soles(scoreModal.deuda_vigente)}
                </b>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal: Validación OTP (para montos >= S/. 2000) ===== */}
      {otpModal && (
        <div className="bx-overlay">
          <div className="sol-modal">
            <button className="bx-x" onClick={() => setOtpModal(null)} aria-label="Cerrar"><X size={18} /></button>
            <div className="sol-otp-icon"><KeyRound size={22} /></div>
            <h3 style={{ marginTop: 10, marginBottom: 4 }}>Verificación de seguridad</h3>
            <p className="bx-k">
              {solId(otpModal.solicitud.id_solicitud)} supera el umbral seguro de {soles(OTP_UMBRAL)}.<br />
              Ingresa el token OTP para continuar.
            </p>

            <input
              autoFocus
              className="bx-in sol-otp-input"
              maxLength={6}
              value={otpModal.input}
              onChange={(e) => setOtpModal((p) => ({ ...p, input: e.target.value.toUpperCase(), error: null }))}
              placeholder="••••••"
            />
            {otpModal.error && <div className="sol-otp-error">{otpModal.error}</div>}

            <div className="sol-otp-timer">
              <Clock size={12} /> Token válido por {otpModal.restante}s (entorno de pruebas: <b>{otpModal.token}</b>)
            </div>

            <button className="bx-btn" style={{ width: '100%', marginTop: 14 }} onClick={confirmarOtp}>
              Validar y aprobar
            </button>
          </div>
        </div>
      )}

      {/* ===== Modal: Contrato generado ===== */}
      {contratoModal && (
        <div className="bx-overlay" onClick={() => setContratoModal(null)}>
          <div className="sol-modal" onClick={(e) => e.stopPropagation()}>
            <button className="bx-x" onClick={() => setContratoModal(null)} aria-label="Cerrar"><X size={18} /></button>
            <div className="sol-otp-icon ok"><FileCheck2 size={22} /></div>
            <h3 style={{ marginTop: 10, marginBottom: 4 }}>Contrato generado</h3>
            <p className="bx-k">{contratoModal.solicitud.nombreCompleto} · {soles(contratoModal.solicitud.monto_solicitado)}</p>
            <div className="sol-firma">{contratoModal.firma}</div>
            <button className="bx-btn" style={{ width: '100%', marginTop: 14 }} onClick={descargarContrato}>
              <Download size={15} /> Descargar contrato
            </button>
          </div>
        </div>
      )}

      <style>{`
        .sol-toolbar { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }

        .sol-grid { display: grid; grid-template-columns: 1.7fr 1fr; gap: 16px; align-items: start; }

        .sol-badge { padding: 3px 9px; border-radius: 999px; font-weight: 700; font-size: 12px; }
        .sol-badge.high { background: rgba(52,211,153,0.15); color: #34d399; }
        .sol-badge.reg { background: rgba(251,191,36,0.15); color: #fbbf24; }

        .sol-priority-head { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 14px; color: #a5b4fc; }
        .sol-group { margin-bottom: 16px; }
        .sol-group-title {
          display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;
        }
        .sol-group-title.high { color: #34d399; }
        .sol-group-title.reg { color: #fbbf24; }
        .sol-chip {
          display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 10px;
          cursor: pointer; transition: background 0.15s ease;
        }
        .sol-chip:hover { background: rgba(255,255,255,0.05); }
        .sol-chip-info { display: flex; flex-direction: column; min-width: 0; }
        .sol-chip-info .name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sol-av {
          width: 30px; height: 30px; border-radius: 999px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700;
        }
        .sol-av.high { background: rgba(52,211,153,0.18); color: #34d399; }
        .sol-av.reg { background: rgba(251,191,36,0.18); color: #fbbf24; }

        .sol-ring-wrap { display: flex; flex-direction: column; align-items: center; margin: 10px 0 16px; }
        .sol-dictamen { font-weight: 800; letter-spacing: 0.04em; margin-top: 6px; font-size: 14px; }
        .sol-score-breakdown { display: flex; flex-direction: column; gap: 8px; }
        .sol-score-breakdown div { display: flex; justify-content: space-between; font-size: 12px; color: #c3c9d9; }
        .sol-score-breakdown b { color: #fff; }

        .sol-otp-icon {
          width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
          background: rgba(99,102,241,0.15); color: #a5b4fc;
        }
        .sol-otp-icon.ok { background: rgba(52,211,153,0.15); color: #34d399; }
        .sol-otp-input {
          text-align: center; letter-spacing: 6px; font-size: 20px; font-weight: 700; margin-top: 12px;
        }
        .sol-otp-error { color: #fb7185; font-size: 12px; margin-top: 8px; }
        .sol-otp-timer { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #8b93a7; margin-top: 10px; }
        .sol-firma {
          font-family: monospace; font-size: 11px; color: #8b93a7; background: rgba(0,0,0,0.25);
          padding: 10px; border-radius: 10px; word-break: break-all; margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default Solicitudes;