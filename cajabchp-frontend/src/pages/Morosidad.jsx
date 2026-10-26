import { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import {
  getPrestamos,
  getMoraPreview,
  postAplicarMora,
  exportReporteMorosidadCsv,
  BACKEND_ACTIVO
} from '../services/api';
import {
  AlertTriangle,
  ArrowUpDown,
  BellRing,
  ListChecks,
  X,
  Inbox,
  Wallet,
  Users,
  Download
} from 'lucide-react';

const soles = (n) => `S/. ${Number(n || 0).toFixed(2)}`;
const prestId = (id) => `P-${String(id).padStart(3, '0')}`;

// ===== Reglas de negocio (idénticas a Controlmorosidad.java) =====
const calcularEstadoMora = (dias) => {
  if (dias === 0) return 'AL DIA';
  if (dias <= 15) return 'VENCIDO';
  if (dias <= 30) return 'MOROSO';
  return 'CRITICO';
};
const calcularNivelRiesgo = (dias, saldo) => {
  if (dias === 0) return 'BAJO';
  if (dias <= 15 && saldo < 2000) return 'MEDIO';
  if (dias <= 30) return 'ALTO';
  return 'CRITICO';
};

const COLOR_ESTADO = { 'AL DIA': '#34d399', VENCIDO: '#fbbf24', MOROSO: '#fb923c', CRITICO: '#fb7185' };
const COLOR_RIESGO = { BAJO: '#34d399', MEDIO: '#fbbf24', ALTO: '#fb923c', CRITICO: '#fb7185' };

// ===== Criterios de orden (idéntico a valorComparacion) =====
const criterioValor = (p, criterio) => {
  switch (criterio) {
    case 0: return -Number(p.saldo || 0); // Mayor deuda primero
    case 1: return Number(p.saldo || 0); // Menor deuda primero
    case 2: return -Number(p.dias_mora || 0); // Más días de mora primero
    case 3: return String(p.estudiante_nombre || '').trim().toLowerCase(); // Nombre completo alfabético A-Z
    case 4: return new Date(p.fecha_inicio || '1970-01-01').getTime(); // Fecha de inicio cronológica
    default: return 0;
  }
};

const CRITERIOS = ['Mayor deuda', 'Menor deuda', 'Más días de mora', 'Nombre', 'Fecha de inicio'];
const ALGORITMOS = ['Burbuja', 'Selección', 'Inserción', 'Merge Sort', 'Quick Sort', 'Heap Sort'];

// ===== Los 6 algoritmos de ordenamiento, portados 1:1 desde Controlmorosidad.java =====
const ordenBurbuja = (arr, c) => {
  const d = [...arr];
  for (let i = 0; i < d.length - 1; i++)
    for (let j = 0; j < d.length - i - 1; j++)
      if (criterioValor(d[j], c) > criterioValor(d[j + 1], c)) [d[j], d[j + 1]] = [d[j + 1], d[j]];
  return d;
};
const ordenSeleccion = (arr, c) => {
  const d = [...arr];
  for (let i = 0; i < d.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < d.length; j++) if (criterioValor(d[j], c) < criterioValor(d[minIdx], c)) minIdx = j;
    [d[i], d[minIdx]] = [d[minIdx], d[i]];
  }
  return d;
};
const ordenInsercion = (arr, c) => {
  const d = [...arr];
  for (let i = 1; i < d.length; i++) {
    const key = d[i];
    const keyVal = criterioValor(key, c);
    let j = i - 1;
    while (j >= 0 && criterioValor(d[j], c) > keyVal) { d[j + 1] = d[j]; j--; }
    d[j + 1] = key;
  }
  return d;
};
const merge = (d, izq, mid, der, c) => {
  const izqList = d.slice(izq, mid + 1);
  const derList = d.slice(mid + 1, der + 1);
  let i = 0, j = 0, k = izq;
  while (i < izqList.length && j < derList.length) {
    d[k++] = criterioValor(izqList[i], c) <= criterioValor(derList[j], c) ? izqList[i++] : derList[j++];
  }
  while (i < izqList.length) d[k++] = izqList[i++];
  while (j < derList.length) d[k++] = derList[j++];
};
const mergeSortRec = (d, izq, der, c) => {
  if (izq < der) {
    const mid = Math.floor((izq + der) / 2);
    mergeSortRec(d, izq, mid, c);
    mergeSortRec(d, mid + 1, der, c);
    merge(d, izq, mid, der, c);
  }
};
const ordenMergeSort = (arr, c) => { const d = [...arr]; mergeSortRec(d, 0, d.length - 1, c); return d; };

const particion = (d, bajo, alto, c) => {
  const pivot = criterioValor(d[alto], c);
  let i = bajo - 1;
  for (let j = bajo; j < alto; j++) if (criterioValor(d[j], c) <= pivot) { i++; [d[i], d[j]] = [d[j], d[i]]; }
  [d[i + 1], d[alto]] = [d[alto], d[i + 1]];
  return i + 1;
};
const quickSortRec = (d, bajo, alto, c) => {
  if (bajo < alto) {
    const pi = particion(d, bajo, alto, c);
    quickSortRec(d, bajo, pi - 1, c);
    quickSortRec(d, pi + 1, alto, c);
  }
};
const ordenQuickSort = (arr, c) => { const d = [...arr]; quickSortRec(d, 0, d.length - 1, c); return d; };

const heapify = (d, n, i, c) => {
  let mayor = i, izq = 2 * i + 1, der = 2 * i + 2;
  if (izq < n && criterioValor(d[izq], c) > criterioValor(d[mayor], c)) mayor = izq;
  if (der < n && criterioValor(d[der], c) > criterioValor(d[mayor], c)) mayor = der;
  if (mayor !== i) { [d[i], d[mayor]] = [d[mayor], d[i]]; heapify(d, n, mayor, c); }
};
const ordenHeapSort = (arr, c) => {
  const d = [...arr];
  const n = d.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(d, n, i, c);
  for (let i = n - 1; i > 0; i--) { [d[0], d[i]] = [d[i], d[0]]; heapify(d, i, 0, c); }
  return d;
};
const aplicarOrden = (arr, criterio, algoritmo) => {
  switch (algoritmo) {
    case 0: return ordenBurbuja(arr, criterio);
    case 1: return ordenSeleccion(arr, criterio);
    case 2: return ordenInsercion(arr, criterio);
    case 3: return ordenMergeSort(arr, criterio);
    case 4: return ordenQuickSort(arr, criterio);
    case 5: return ordenHeapSort(arr, criterio);
    default: return arr;
  }
};

const Morosidad = () => {
  const [prestamos, setPrestamos] = useState([
    { id_prestamo: 1, estudiante_nombre: 'DIEGO HUACHACA', dni: '12345678', monto: 5000, saldo: 5500, dias_mora: 0, interes_mora: 0, estado: 'Activo', fecha_inicio: '2026-09-02' },
    { id_prestamo: 2, estudiante_nombre: 'DIANA APOLINARIO', dni: '87654321', monto: 2000, saldo: 2200, dias_mora: 8, interes_mora: 15.5, estado: 'Activo', fecha_inicio: '2026-08-28' },
    { id_prestamo: 3, estudiante_nombre: 'EDUARDO CAMAC', dni: '11223344', monto: 1500, saldo: 1600, dias_mora: 20, interes_mora: 40.0, estado: 'Activo', fecha_inicio: '2026-07-15' },
    { id_prestamo: 4, estudiante_nombre: 'EDUARDO CAMAC', dni: '11223344', monto: 900, saldo: 950, dias_mora: 34, interes_mora: 65.0, estado: 'Activo', fecha_inicio: '2026-06-20' },
    { id_prestamo: 5, estudiante_nombre: 'VALERIA GUTIERREZ', dni: '88776655', monto: 5000, saldo: 4800, dias_mora: 45, interes_mora: 120.0, estado: 'Activo', fecha_inicio: '2026-05-10' },
    { id_prestamo: 6, estudiante_nombre: 'MARIA QUISPE', dni: '99887766', monto: 3000, saldo: 3100, dias_mora: 0, interes_mora: 0, estado: 'Activo', fecha_inicio: '2026-09-05' }
  ]);

  const [vista, setVista] = useState(0); // 0 Activas, 1 Vencidas, 2 Estudiantes Morosos
  const [criterio, setCriterio] = useState(0);
  const [algoritmo, setAlgoritmo] = useState(0);
  const [orden, setOrden] = useState(null);
  const [estadoLbl, setEstadoLbl] = useState('');
  const [cola, setCola] = useState([]);
  const [toast, setToast] = useState(null);
  const [moraModal, setMoraModal] = useState(null); // { prestamo, cuotas_vencidas, dias_mora_maximo, mora_total_a_aplicar, detalle_cuotas }
  const [colaAbierta, setColaAbierta] = useState(false);
  const selRef = useRef(null);

  const cargarPrestamos = async () => {
    try {
      const r = await getPrestamos();
      if (r.data && r.data.length > 0) setPrestamos(r.data);
    } catch (e) {
      if (BACKEND_ACTIVO) {
        const msg = e.response?.data?.message || 'Error al conectar con el servidor';
        setToast({ tipo: 'error', texto: msg });
      }
    }
  };

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const r = await getPrestamos();
        if (!cancelado && r.data && r.data.length > 0) setPrestamos(r.data);
      } catch (e) {
        if (!cancelado && BACKEND_ACTIVO) {
          const msg = e.response?.data?.message || 'Error al conectar con el servidor';
          setToast({ tipo: 'error', texto: msg });
        }
      }
    })();
    return () => { cancelado = true; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ===== deudasActivas incluye "Activo" y "Riesgo Temprano" =====
  const deudasActivas = useMemo(
    () => prestamos.filter((p) => (p.estado === 'Activo' || p.estado === 'Riesgo Temprano') && p.saldo > 0),
    [prestamos]
  );
  const deudasVencidas = useMemo(() => deudasActivas.filter((p) => p.dias_mora > 0), [deudasActivas]);

  const estudiantesMorosos = useMemo(() => {
    const mapa = new Map();
    deudasActivas.filter((p) => p.dias_mora > 0).forEach((p) => {
      const key = p.dni;
      const acc = mapa.get(key) || { estudiante: p.estudiante_nombre, dni: p.dni, saldo: 0, dias_mora: 0, interes_mora: 0 };
      acc.saldo += p.saldo;
      acc.dias_mora = Math.max(acc.dias_mora, p.dias_mora);
      acc.interes_mora += p.interes_mora;
      mapa.set(key, acc);
    });
    return Array.from(mapa.values()).sort((a, b) => b.dias_mora - a.dias_mora);
  }, [deudasActivas]);

  const filasBase = vista === 0 ? deudasActivas : vista === 1 ? deudasVencidas : estudiantesMorosos;

  const filas = useMemo(() => {
    if (vista === 2) return filasBase;
    if (!orden) return filasBase;
    return aplicarOrden(filasBase, orden.criterio, orden.algoritmo);
  }, [filasBase, orden, vista]);

  // ===== KPIs =====
  const totalEnMora = deudasVencidas.reduce((s, p) => s + (Number(p.saldo) || 0), 0);
  const criticos = deudasVencidas.filter((p) => calcularNivelRiesgo(p.dias_mora, p.saldo) === 'CRITICO').length;

  const cambiarVista = (i) => {
    setVista(i);
    setOrden(null);
    setEstadoLbl(i === 2 ? `Morosos: ${(i === 0 ? deudasActivas : i === 1 ? deudasVencidas : estudiantesMorosos).length}` : `Registros: ${(i === 0 ? deudasActivas : deudasVencidas).length}`);
    selRef.current = null;
  };

  const ordenar = () => {
    if (vista === 2) {
      setToast({ tipo: 'warn', texto: 'La vista "Estudiantes Morosos" no admite reordenamiento manual.' });
      return;
    }
    if (filasBase.length < 2) return;
    setOrden({ criterio, algoritmo });
    setEstadoLbl(`Ordenado por: ${CRITERIOS[criterio]} usando ${ALGORITMOS[algoritmo]}`);
  };

  // ===== Aplicar Mora vía Servidor =====
  const abrirMora = async (p) => {
    if (BACKEND_ACTIVO) {
      try {
        const previewRes = await getMoraPreview(p.id_prestamo);
        const data = previewRes.data;
        setMoraModal({
          prestamo: p,
          cuotas_vencidas: data.cuotas_vencidas,
          dias_mora_maximo: data.dias_mora_maximo,
          mora_total_a_aplicar: data.mora_total_a_aplicar,
          detalle_cuotas: data.detalle_cuotas || []
        });
      } catch (err) {
        const msg = err.response?.data?.message || 'Error al obtener vista previa de mora';
        setToast({ tipo: 'error', texto: msg });
      }
    } else {
      // Modo desconectado local
      const recargoLocal = p.saldo * 0.02;
      setMoraModal({
        prestamo: p,
        cuotas_vencidas: p.dias_mora > 0 ? 1 : 0,
        dias_mora_maximo: p.dias_mora || 0,
        mora_total_a_aplicar: recargoLocal,
        detalle_cuotas: []
      });
    }
  };

  const confirmarMora = async () => {
    if (!moraModal) return;
    const { prestamo } = moraModal;

    if (BACKEND_ACTIVO) {
      try {
        const res = await postAplicarMora(prestamo.id_prestamo);
        const { cuotas_afectadas, monto_mora_aplicado } = res.data;
        setToast({
          tipo: 'ok',
          texto: `Mora aplicada con éxito: S/. ${Number(monto_mora_aplicado).toFixed(2)} sobre ${cuotas_afectadas} cuota(s).`
        });
        setMoraModal(null);
        await cargarPrestamos();
      } catch (e) {
        const msg = e.response?.data?.message || 'No se pudo aplicar la mora en el servidor';
        setToast({ tipo: 'error', texto: msg });
        setMoraModal(null);
      }
    } else {
      const recargo = prestamo.saldo * 0.02;
      const nuevoSaldo = prestamo.saldo + recargo;
      setPrestamos((prev) =>
        prev.map((p) => (p.id_prestamo === prestamo.id_prestamo ? { ...p, saldo: nuevoSaldo, interes_mora: recargo } : p))
      );
      setMoraModal(null);
      setToast({ tipo: 'ok', texto: `Mora aplicada a ${prestId(prestamo.id_prestamo)}. Nuevo saldo: ${soles(nuevoSaldo)}` });
    }
  };

  // ===== Exportar CSV de morosidad =====
  const descargarCsv = async () => {
    if (BACKEND_ACTIVO) {
      try {
        const res = await exportReporteMorosidadCsv();
        const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'reporte_morosidad.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setToast({ tipo: 'ok', texto: 'Reporte CSV de morosidad exportado exitosamente.' });
      } catch (e) {
        const msg = e.response?.data?.message || 'Error al exportar el reporte CSV';
        setToast({ tipo: 'error', texto: msg });
      }
    } else {
      // Fallback local
      const csvHeader = 'ID,Estudiante,DNI,Monto,Saldo,Dias Mora,Interes Mora,Estado\n';
      const csvRows = deudasVencidas.map(p => `${p.id_prestamo},"${p.estudiante_nombre}",${p.dni},${p.monto},${p.saldo},${p.dias_mora},${p.interes_mora},${p.estado}`).join('\n');
      const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte_morosidad_local.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setToast({ tipo: 'ok', texto: 'Reporte local generado.' });
    }
  };

  // ===== Notificar (encolar FIFO) =====
  const notificar = (p) => {
    const mensaje = `Su préstamo presenta retraso en los pagos. Saldo pendiente: ${soles(p.saldo)}. Regularice su situación para evitar mayores recargos.`;
    setCola((prev) => [...prev, { idPrestamo: p.id_prestamo, nombreEstudiante: p.estudiante_nombre, mensaje }]);
    setColaAbierta(true);
    setToast({ tipo: 'ok', texto: `Notificación encolada para ${p.estudiante_nombre}.` });
  };

  // ===== Procesar Cola (desencolar todo, FIFO) =====
  const procesarCola = () => {
    if (cola.length === 0) {
      setToast({ tipo: 'warn', texto: 'La cola de notificaciones está vacía.' });
      return;
    }
    setToast({ tipo: 'ok', texto: `Cola procesada: ${cola.length} notificación(es) enviada(s).` });
    setCola([]);
  };

  const columnas = vista === 2
    ? ['Estudiante', 'DNI', 'Saldo pendiente', 'Días de mora', 'Interés mora', 'Nivel riesgo']
    : ['ID', 'Estudiante', 'DNI', 'Monto original', 'Saldo actual', 'Días mora', 'Interés mora', 'Estado', 'Nivel riesgo', 'Acciones'];

  return (
    <div className="bx-app" translate="no">
      <Sidebar />

      <main className="bx-main">
        <div className="bx-hd">
          <div>
            <h1>Control de morosidad</h1>
            <span>Clasificación de riesgo, mora y cobranza</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="bx-btn" onClick={descargarCsv}>
              <Download size={16} /> Exportar reporte (CSV)
            </button>
            <button className="bx-ghost" onClick={() => setColaAbierta(true)} style={{ position: 'relative' }}>
              <Inbox size={16} /> Cola de notificaciones
              {cola.length > 0 && <span className="mor-badge-count">{cola.length}</span>}
            </button>
          </div>
        </div>

        <div className="mor-kpis">
          <div className="mor-kpi">
            <div className="ico wallet"><Wallet size={16} /></div>
            <div>
              <div className="bx-k">Total en mora</div>
              <div className="v">{soles(totalEnMora)}</div>
            </div>
          </div>
          <div className="mor-kpi">
            <div className="ico crit"><AlertTriangle size={16} /></div>
            <div>
              <div className="bx-k">Riesgo crítico</div>
              <div className="v">{criticos} préstamo(s)</div>
            </div>
          </div>
          <div className="mor-kpi">
            <div className="ico users"><Users size={16} /></div>
            <div>
              <div className="bx-k">Estudiantes morosos</div>
              <div className="v">{estudiantesMorosos.length}</div>
            </div>
          </div>
        </div>

        <div className="bx-c">
          <div className="mor-toolbar">
            <div className="mor-tabs">
              {['Deudas Activas', 'Deudas Vencidas', 'Estudiantes Morosos'].map((v, i) => (
                <button key={v} className={`sol-tab ${vista === i ? 'active' : ''}`} onClick={() => cambiarVista(i)}>{v}</button>
              ))}
            </div>

            <div className="mor-controls">
              <select className="bx-in" value={criterio} onChange={(e) => setCriterio(Number(e.target.value))} disabled={vista === 2}>
                {CRITERIOS.map((c, i) => <option key={c} value={i}>{c}</option>)}
              </select>
              <select className="bx-in" value={algoritmo} onChange={(e) => setAlgoritmo(Number(e.target.value))} disabled={vista === 2}>
                {ALGORITMOS.map((a, i) => <option key={a} value={i}>{a}</option>)}
              </select>
              <button className="bx-ghost" onClick={ordenar}><ArrowUpDown size={14} /> Ordenar</button>
              <button className="bx-ghost" onClick={procesarCola}><ListChecks size={14} /> Procesar cola</button>
            </div>
          </div>

          {estadoLbl && <div className="bx-k" style={{ marginBottom: 10 }}>{estadoLbl}</div>}

          <div style={{ overflowX: 'auto' }}>
            <table className="bx-table">
              <thead>
                <tr>{columnas.map((c) => <th key={c} style={{ textAlign: c === 'Acciones' ? 'center' : 'left' }}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {vista !== 2 ? filas.map((p) => {
                  const estadoMora = calcularEstadoMora(p.dias_mora);
                  const riesgo = calcularNivelRiesgo(p.dias_mora, p.saldo);
                  return (
                    <tr key={p.id_prestamo}>
                      <td style={{ textAlign: 'left' }}><b style={{ color: 'var(--bx-or)' }}>{prestId(p.id_prestamo)}</b></td>
                      <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>{p.estudiante_nombre}</td>
                      <td style={{ textAlign: 'left' }} className="bx-k">{p.dni}</td>
                      <td style={{ textAlign: 'left' }}>{soles(p.monto)}</td>
                      <td style={{ textAlign: 'left', fontWeight: 700 }}>{soles(p.saldo)}</td>
                      <td style={{ textAlign: 'left' }}>{p.dias_mora}</td>
                      <td style={{ textAlign: 'left' }}>{soles(p.interes_mora)}</td>
                      <td style={{ textAlign: 'left' }}><span className="mor-pill" style={{ color: COLOR_ESTADO[estadoMora] }}>{estadoMora}</span></td>
                      <td style={{ textAlign: 'left' }}><span className="mor-pill" style={{ color: COLOR_RIESGO[riesgo] }}>{riesgo}</span></td>
                      <td>
                        <div className="sol-actions">
                          <button className="sol-iconbtn score" title="Aplicar mora" onClick={() => abrirMora(p)}><AlertTriangle size={14} /></button>
                          <button className="sol-iconbtn ok" title="Notificar" onClick={() => notificar(p)}><BellRing size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : filas.map((e) => {
                  const riesgo = calcularNivelRiesgo(e.dias_mora, e.saldo);
                  return (
                    <tr key={e.dni}>
                      <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>{e.estudiante}</td>
                      <td style={{ textAlign: 'left' }} className="bx-k">{e.dni}</td>
                      <td style={{ textAlign: 'left', fontWeight: 700 }}>{soles(e.saldo)}</td>
                      <td style={{ textAlign: 'left' }}>{e.dias_mora}</td>
                      <td style={{ textAlign: 'left' }}>{soles(e.interes_mora)}</td>
                      <td style={{ textAlign: 'left' }}><span className="mor-pill" style={{ color: COLOR_RIESGO[riesgo] }}>{riesgo}</span></td>
                    </tr>
                  );
                })}
                {filas.length === 0 && (
                  <tr><td colSpan={columnas.length} className="bx-k" style={{ textAlign: 'center' }}>Sin registros para esta vista.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ===== Toast ===== */}
      {toast && <div className={`sol-toast ${toast.tipo}`}>{toast.texto}</div>}

      {/* ===== Modal: Aplicar Mora ===== */}
      {moraModal && (
        <div className="bx-overlay" onClick={() => setMoraModal(null)}>
          <div className="sol-modal" onClick={(e) => e.stopPropagation()}>
            <button className="bx-x" onClick={() => setMoraModal(null)} aria-label="Cerrar"><X size={18} /></button>
            <h3 style={{ marginTop: 0 }}>Aplicar mora de servidor</h3>
            <p className="bx-k">{prestId(moraModal.prestamo.id_prestamo)} · {moraModal.prestamo.estudiante_nombre}</p>

            {moraModal.cuotas_vencidas === 0 ? (
              <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: 14, borderRadius: 10, color: '#fbbf24', fontSize: 13, margin: '14px 0' }}>
                Este préstamo no tiene cuotas vencidas pendientes de mora. El servidor no generará recargos.
              </div>
            ) : (
              <div className="mor-mora-preview">
                <div><span>Cuotas vencidas detectadas</span><b style={{ color: '#fb7185' }}>{moraModal.cuotas_vencidas} cuota(s)</b></div>
                <div><span>Días máximos de mora</span><b>{moraModal.dias_mora_maximo} día(s)</b></div>
                <div><span>Saldo actual del préstamo</span><b>{soles(moraModal.prestamo.saldo)}</b></div>
                <div><span>Mora monetaria calculada (2%)</span><b style={{ color: 'var(--bx-or)' }}>{soles(moraModal.mora_total_a_aplicar)}</b></div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6, marginTop: 4 }}>
                  <span>Nuevo saldo estimado</span>
                  <b style={{ color: 'var(--bx-or)', fontSize: 14 }}>
                    {soles(Number(moraModal.prestamo.saldo) + Number(moraModal.mora_total_a_aplicar || 0))}
                  </b>
                </div>
              </div>
            )}

            <button
              className="bx-btn"
              style={{ width: '100%', marginTop: 14 }}
              disabled={moraModal.cuotas_vencidas === 0}
              onClick={confirmarMora}
            >
              Confirmar aplicación de mora
            </button>
          </div>
        </div>
      )}

      {/* ===== Panel: Cola de notificaciones (FIFO) ===== */}
      {colaAbierta && (
        <div className="bx-overlay" onClick={() => setColaAbierta(false)}>
          <div className="sol-modal mor-cola" onClick={(e) => e.stopPropagation()}>
            <button className="bx-x" onClick={() => setColaAbierta(false)} aria-label="Cerrar"><X size={18} /></button>
            <h3 style={{ marginTop: 0 }}>Cola de notificaciones (FIFO)</h3>
            {cola.length === 0 ? (
              <div className="bx-k">No hay notificaciones pendientes.</div>
            ) : (
              <div className="mor-cola-list">
                {cola.map((n, i) => (
                  <div className="mor-cola-item" key={`${n.idPrestamo}-${i}`}>
                    <span className="pos">{i + 1}{i === 0 ? ' · frente' : ''}</span>
                    <div>
                      <b>{n.nombreEstudiante}</b>
                      <div className="bx-k">{n.mensaje.slice(0, 60)}…</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="bx-btn" style={{ width: '100%', marginTop: 14 }} onClick={procesarCola}>
              <ListChecks size={15} /> Procesar toda la cola
            </button>
          </div>
        </div>
      )}

      <style>{`
        .mor-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
        .mor-kpi { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); border-radius: 14px; padding: 14px; }
        .mor-kpi .ico { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mor-kpi .ico.wallet { background: rgba(99,102,241,0.15); color: #a5b4fc; }
        .mor-kpi .ico.crit { background: rgba(251,113,133,0.15); color: #fb7185; }
        .mor-kpi .ico.users { background: rgba(34,211,238,0.15); color: #22d3ee; }
        .mor-kpi .v { font-size: 17px; font-weight: 700; }

        .mor-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 6px; }
        .mor-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .mor-controls { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .mor-controls select { padding: 8px 10px; font-size: 12px; }

        .mor-pill { font-weight: 700; font-size: 12px; }

        .mor-badge-count {
          position: absolute; top: -6px; right: -6px; background: #fb7185; color: #fff;
          border-radius: 999px; font-size: 10px; padding: 1px 6px; font-weight: 700;
        }

        .mor-mora-preview { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
        .mor-mora-preview div { display: flex; justify-content: space-between; font-size: 12px; color: #c3c9d9; }

        .mor-cola { width: 420px; }
        .mor-cola-list { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; }
        .mor-cola-item { display: flex; gap: 10px; align-items: flex-start; padding: 8px; border-radius: 10px; background: rgba(255,255,255,0.04); }
        .mor-cola-item .pos { font-size: 10px; color: #8b93a7; min-width: 46px; }
      `}</style>
    </div>
  );
};

export default Morosidad;