import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getAuditoria, BACKEND_ACTIVO } from '../services/api';
import { Loader2, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const Auditoria = () => {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorAviso, setErrorAviso] = useState('');
  const [filtroTabla, setFiltroTabla] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [modalJson, setModalJson] = useState(null);
  const [recargaTick, setRecargaTick] = useState(0);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      if (!BACKEND_ACTIVO) {
        setErrorAviso('Auditoría disponible únicamente con el servidor activo');
        return;
      }
      setCargando(true);
      setErrorAviso('');
      try {
        const params = {
          page,
          size: 15,
        };
        if (filtroTabla) params.tabla = filtroTabla;
        if (filtroUsuario) params.usuario = filtroUsuario;
        if (fechaInicio) params.fechaInicio = fechaInicio;
        if (fechaFin) params.fechaFin = fechaFin;

        const resp = await getAuditoria(params);
        if (!cancelado) {
          const data = resp.data;
          setRegistros(data.content || []);
          setTotalPages(data.totalPages || 0);
          setTotalElements(data.totalElements || 0);
        }
      } catch (err) {
        if (!cancelado) {
          setErrorAviso(err.response?.data?.message || err.message || 'Error al consultar auditoría');
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    })();
    return () => { cancelado = true; };
  }, [page, recargaTick, filtroTabla, filtroUsuario, fechaInicio, fechaFin]);

  const handleBuscar = (e) => {
    e.preventDefault();
    setPage(0);
    setRecargaTick((t) => t + 1);
  };

  const formatearFechaHora = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bx-app">
      <Sidebar />
      <main className="bx-main">
        <header className="bx-hd">
          <div>
            <h1>Auditoría Financiera</h1>
            <span>Trazabilidad inmutable de transacciones registradas por PostgreSQL</span>
          </div>
          <span className="bx-pill">Total: {totalElements} registros</span>
        </header>

        {errorAviso && (
          <div className="bx-c" style={{ borderLeft: '4px solid var(--bx-rd)', padding: '12px 18px' }}>
            <span style={{ color: 'var(--bx-rd)', fontWeight: 600 }}>Aviso: </span>
            <span>{errorAviso}</span>
          </div>
        )}

        {/* Filtros */}
        <div className="bx-c">
          <form onSubmit={handleBuscar} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
            <div>
              <label className="bx-k" style={{ display: 'block', marginBottom: '4px' }}>TABLA</label>
              <select className="bx-in" value={filtroTabla} onChange={(e) => setFiltroTabla(e.target.value)}>
                <option value="">Todas las tablas</option>
                <option value="prestamos">prestamos</option>
                <option value="cuotas">cuotas</option>
                <option value="pagos">pagos</option>
                <option value="mora">mora</option>
                <option value="solicitudes">solicitudes</option>
              </select>
            </div>

            <div>
              <label className="bx-k" style={{ display: 'block', marginBottom: '4px' }}>USUARIO</label>
              <input
                className="bx-in"
                placeholder="Filtrar por usuario..."
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
              />
            </div>

            <div>
              <label className="bx-k" style={{ display: 'block', marginBottom: '4px' }}>DESDE</label>
              <input
                type="date"
                className="bx-in"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div>
              <label className="bx-k" style={{ display: 'block', marginBottom: '4px' }}>HASTA</label>
              <input
                type="date"
                className="bx-in"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>

            <button type="submit" className="bx-btn" disabled={cargando} style={{ height: '42px' }}>
              {cargando ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Filtrar
            </button>
          </form>
        </div>

        {/* Tabla de registros */}
        <div className="bx-c" style={{ overflowX: 'auto' }}>
          <table className="bx-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>TABLA</th>
                <th>OPERACIÓN</th>
                <th>USUARIO</th>
                <th>FECHA Y HORA</th>
                <th style={{ textAlign: 'center' }}>VALOR ANTERIOR</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', display: 'block' }} />
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--bx-mu)' }}>
                    No se encontraron registros de auditoría financiera con los filtros aplicados
                  </td>
                </tr>
              ) : (
                registros.map((reg) => (
                  <tr key={reg.id_auditoria}>
                    <td>#{reg.id_auditoria}</td>
                    <td>
                      <span className="bx-b bx-b-bl">{reg.tabla}</span>
                    </td>
                    <td>
                      <span className={`bx-b ${reg.operacion === 'DELETE' ? 'bx-b-rd' : 'bx-b-am'}`}>
                        {reg.operacion}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{reg.usuario || 'sistema'}</td>
                    <td>{formatearFechaHora(reg.fecha_hora)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {reg.valor_anterior ? (
                        <button
                          className="bx-chip on"
                          onClick={() => setModalJson(reg.valor_anterior)}
                          title="Ver estado anterior"
                        >
                          <Eye size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          Ver detalle
                        </button>
                      ) : (
                        <span style={{ color: 'var(--bx-mu)' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--bx-line)' }}>
              <span className="bx-k">Página {page + 1} de {totalPages}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="bx-chip"
                  disabled={page === 0 || cargando}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                >
                  <ChevronLeft size={14} style={{ display: 'inline' }} /> Anterior
                </button>
                <button
                  className="bx-chip"
                  disabled={page >= totalPages - 1 || cargando}
                  onClick={() => setPage(p => p + 1)}
                >
                  Siguiente <ChevronRight size={14} style={{ display: 'inline' }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal para ver JSON de valor anterior legible */}
        {modalJson && (
          <div className="bx-overlay" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="bx-c" style={{ width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3>Valor Anterior del Registro (Auditoría)</h3>
                <button className="bx-out" onClick={() => setModalJson(null)} style={{ fontSize: '18px' }}>✕</button>
              </div>
              <pre style={{
                background: '#070709',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--bx-line)',
                fontSize: '12px',
                color: '#3ddc97',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {typeof modalJson === 'string' ? modalJson : JSON.stringify(modalJson, null, 2)}
              </pre>
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button className="bx-ghost" onClick={() => setModalJson(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Auditoria;
