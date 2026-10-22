import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { getEstudiantes, getPrestamos, getPagos } from '../services/api';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const soles = (n) => `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const iniciales = (nombre) =>
  (nombre || '?').split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('');

const Dashboard = () => {
  const navigate = useNavigate();

  const [estudiantes, setEstudiantes] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vistaChip, setVistaChip] = useState('ingresos'); // antes: botones sin onClick, no hacían nada

  useEffect(() => {
    (async () => {
      try {
        const r = await getEstudiantes();
        if (r.data) setEstudiantes(r.data);
      } catch (e) { void e; }
      try {
        const r = await getPrestamos();
        if (r.data) setPrestamos(r.data);
      } catch (e) { void e; }
      try {
        const r = await getPagos();
        if (r.data) setPagos(r.data);
      } catch (e) { void e; }
      setCargando(false);
    })();
  }, []);

  // ===== KPIs reales (antes hardcodeados: 148 / 52 / S/ 64.500 / S/ 11.280) =====
  const prestamosVigentes = prestamos.filter((p) => p.estado === 'Activo');
  const fondoOtorgado = prestamos.reduce((s, p) => s + (Number(p.monto) || 0), 0);
  const cuotasPorCobrar = prestamosVigentes.reduce((s, p) => s + (Number(p.saldo) || 0), 0);

  const kpis = [
    { label: 'Estudiantes registrados', value: String(estudiantes.length), note: 'Padrón activo', cls: 'bx-k' },
    { label: 'Préstamos vigentes', value: String(prestamosVigentes.length), note: 'Con cronograma', cls: 'bx-k' },
    { label: 'Fondo otorgado', value: soles(fondoOtorgado), note: 'Suma histórica desembolsada', cls: 'bx-k' },
    { label: 'Cuotas por cobrar', value: soles(cuotasPorCobrar), note: 'Saldo de préstamos activos', cls: 'bx-k', orange: true },
  ];

  // ===== Últimos préstamos: reales, ya no hay campo "carrera" en el modelo de datos =====
  // (estudiantes no tiene carrera en su ficha, así que se cambió esa columna por "Inicio")
  const ultimosPrestamos = [...prestamos]
    .sort((a, b) => Number(b.id_prestamo) - Number(a.id_prestamo))
    .slice(0, 5);

  // ===== Serie mensual real (últimos 6 meses): colocaciones (prestamos) vs recaudación (pagos) =====
  const { serieColoc, serieRecau, maxSerie } = useMemo(() => {
    const hoy = new Date();
    const claves = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      claves.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MESES[d.getMonth()] });
    }
    const coloc = claves.map((c) => ({ ...c, total: 0 }));
    const recau = claves.map((c) => ({ ...c, total: 0 }));

    prestamos.forEach((p) => {
      const key = String(p.fecha_inicio || '').slice(0, 7);
      const i = coloc.findIndex((c) => c.key === key);
      if (i >= 0) coloc[i].total += Number(p.monto) || 0;
    });
    pagos.forEach((pg) => {
      const key = String(pg.fecha_pago || '').slice(0, 7);
      const i = recau.findIndex((c) => c.key === key);
      if (i >= 0) recau[i].total += Number(pg.monto) || 0;
    });

    const max = Math.max(1, ...coloc.map((c) => c.total), ...recau.map((c) => c.total));
    return { serieColoc: coloc, serieRecau: recau, maxSerie: max };
  }, [prestamos, pagos]);

  const puntos = (serie) =>
    serie.map((s, i) => {
      const x = 10 + i * (540 / (serie.length - 1));
      const y = 205 - (s.total / maxSerie) * 165;
      return [x, y];
    });

  const pathDe = (serie) => puntos(serie).map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ');
  const totalRecaudadoSerie = serieRecau.reduce((s, r) => s + r.total, 0);
  const totalColocadoSerie = serieColoc.reduce((s, r) => s + r.total, 0);
  const totalDestacado = vistaChip === 'egresos' ? totalColocadoSerie : totalRecaudadoSerie;
  const etiquetaDestacada = vistaChip === 'egresos' ? 'Colocado' : 'Recaudado';

  return (
    <div className="bx-app" translate="no">
      <Sidebar />

      <main className="bx-main">
        <div className="bx-hd">
          <div>
            <h1>Panel de control general</h1>
            <span>Monitoreo operativo de beneficiarios y créditos otorgados</span>
          </div>
          <button className="bx-btn" onClick={() => navigate('/prestamos?nuevo=true')}>
            + Nuevo préstamo
          </button>
        </div>

        <div className="bx-g bx-g4">
          {kpis.map((k) => (
            <div className="bx-c" key={k.label}>
              <div className="bx-k">{k.label}</div>
              <div className="bx-v" style={k.orange ? { color: 'var(--bx-or)' } : undefined}>{k.value}</div>
              <div className={k.cls}>{k.note}</div>
            </div>
          ))}
        </div>

        <div className="bx-g bx-g2">
          <div className="bx-c">
            <h3>
              Colocaciones vs. recaudación
              <span style={{ float: 'right' }}>
                <button
                  className={`bx-chip ${vistaChip === 'egresos' ? 'on' : ''}`}
                  onClick={() => setVistaChip('egresos')}
                  title="Resaltar colocaciones (dinero prestado)"
                >
                  Egresos
                </button>
                <button
                  className={`bx-chip ${vistaChip === 'ingresos' ? 'on' : ''}`}
                  onClick={() => setVistaChip('ingresos')}
                  title="Resaltar recaudación (pagos recibidos)"
                >
                  Ingresos
                </button>
              </span>
            </h3>
            <svg className="bx-svg" viewBox="0 0 560 220" role="img" aria-label="Gráfico de colocaciones y recaudación">
              <defs>
                <linearGradient id="bxl" x1="0" x2="1">
                  <stop offset="0" stopColor="#ff5a36" />
                  <stop offset="1" stopColor="#c026a8" />
                </linearGradient>
              </defs>
              <g stroke="#1d1d22" strokeDasharray="4 5">
                <path d="M0 40H560M0 95H560M0 150H560M0 205H560" />
              </g>
              <path d={pathDe(serieColoc)} fill="none" stroke="url(#bxl)" strokeWidth="3.5" opacity={vistaChip === 'egresos' ? 1 : 0.35} />
              <path d={pathDe(serieRecau)} fill="none" stroke="#1e78c8" strokeWidth="2.5" strokeDasharray="6 5" opacity={vistaChip === 'ingresos' ? 1 : 0.35} />
              <g fill="#8b8b93" fontSize="11" textAnchor="middle">
                {serieColoc.map((s, i) => (
                  <text key={s.key} x={puntos(serieColoc)[i][0]} y="216">{s.label}</text>
                ))}
              </g>
              {totalDestacado > 0 && (
                <>
                  <rect x="352" y="14" width="150" height="26" rx="13" fill="#ff5a36" />
                  <text x="427" y="31" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">
                    {etiquetaDestacada}: {soles(totalDestacado)}
                  </text>
                </>
              )}
            </svg>
            {prestamos.length === 0 && pagos.length === 0 && !cargando && (
              <div className="bx-k" style={{ marginTop: 8 }}>Sin datos aún para graficar (no hay préstamos ni pagos registrados).</div>
            )}
          </div>

          <div className="bx-c bx-blue">
            <h3>Estado del servicio</h3>
            <div className="bx-k" style={{ marginBottom: 14 }}>
              Fondo habilitado para matrícula y cuotas del período lectivo.
            </div>
            <div className="bx-li"><span>Interés social fijado</span><b>1,5% mensual</b></div>
            <div className="bx-li"><span>Plazo máximo</span><b>Hasta 6 meses</b></div>
            <div className="bx-li"><span>Saldo activo en cartera</span><b style={{ color: 'var(--bx-gr)' }}>{soles(cuotasPorCobrar)}</b></div>
          </div>
        </div>

        <div className="bx-c">
          <h3>
            Últimos préstamos registrados
            <button
              onClick={() => navigate('/prestamos')}
              style={{ float: 'right', color: 'var(--bx-or)', fontSize: 12, background: 'none', border: 0, cursor: 'pointer' }}
            >
              Ver todos
            </button>
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="bx-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Alumno</th>
                  <th style={{ textAlign: 'left' }}>Inicio</th>
                  <th style={{ textAlign: 'left' }}>Monto</th>
                  <th style={{ textAlign: 'left' }}>Cuotas</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ultimosPrestamos.map((p) => (
                  <tr key={p.id_prestamo}>
                    <td style={{ textAlign: 'left' }}>
                      <span className="bx-av">{iniciales(p.estudiante_nombre)}</span>
                      {p.estudiante_nombre || `Estudiante #${p.id_estudiante}`}
                    </td>
                    <td style={{ textAlign: 'left' }}>{p.fecha_inicio}</td>
                    <td style={{ textAlign: 'left' }}>{soles(p.monto)}</td>
                    <td style={{ textAlign: 'left' }}>{p.cuotas}</td>
                    <td>
                      <span className={`bx-b ${p.estado === 'Activo' ? 'bx-b-gr' : 'bx-b-bl'}`}>{p.estado}</span>
                    </td>
                  </tr>
                ))}
                {ultimosPrestamos.length === 0 && (
                  <tr><td colSpan={5} className="bx-k" style={{ textAlign: 'center' }}>
                    {cargando ? 'Cargando...' : 'Aún no hay préstamos registrados.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;