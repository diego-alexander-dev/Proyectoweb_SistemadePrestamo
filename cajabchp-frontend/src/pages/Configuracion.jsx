import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getConfiguracion, putConfiguracion, BACKEND_ACTIVO } from '../services/api';
import { Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react';

const parametrosInfo = {
  tasa_base: { label: 'Tasa de Interés Base (%)', desc: 'Tasa asignada por defecto a los préstamos estudiantiles regulares' },
  tasa_excelencia: { label: 'Tasa de Interés Excelencia (%)', desc: 'Tasa preferencial para estudiantes con alto rendimiento académico' },
  promedio_excelencia: { label: 'Promedio Mínimo para Excelencia', desc: 'Promedio de notas requerido para acceder a la tasa de excelencia' },
  mora_porcentaje: { label: 'Porcentaje de Mora (%)', desc: 'Recargo monetario porcentual aplicado una sola vez sobre cuotas vencidas' },
  gracia_promedio_min: { label: 'Promedio para Período de Gracia', desc: 'Promedio mínimo para exoneración temporal de recargo de mora' },
  gracia_dias: { label: 'Días de Período de Gracia', desc: 'Días posteriores al vencimiento sin recargo para alumnos con promedio superior' },
};

const Configuracion = () => {
  const [parametros, setParametros] = useState([]);
  const [valoresEditados, setValoresEditados] = useState({});
  const [cargando, setCargando] = useState(false);
  const [guardandoParametro, setGuardandoParametro] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [recargaTick, setRecargaTick] = useState(0);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      if (!BACKEND_ACTIVO) {
        setParametros([
          { id_configuracion: 1, parametro: 'tasa_base', valor: '10', fecha_modificacion: '2026-10-25' },
          { id_configuracion: 2, parametro: 'tasa_excelencia', valor: '8', fecha_modificacion: '2026-10-25' },
          { id_configuracion: 3, parametro: 'promedio_excelencia', valor: '16', fecha_modificacion: '2026-10-25' },
          { id_configuracion: 4, parametro: 'mora_porcentaje', valor: '2', fecha_modificacion: '2026-10-25' },
          { id_configuracion: 5, parametro: 'gracia_promedio_min', valor: '18', fecha_modificacion: '2026-10-25' },
          { id_configuracion: 6, parametro: 'gracia_dias', valor: '5', fecha_modificacion: '2026-10-25' },
        ]);
        setValoresEditados({
          tasa_base: '10',
          tasa_excelencia: '8',
          promedio_excelencia: '16',
          mora_porcentaje: '2',
          gracia_promedio_min: '18',
          gracia_dias: '5',
        });
        return;
      }

      setCargando(true);
      setMensajeError('');
      try {
        const resp = await getConfiguracion();
        if (!cancelado) {
          const lista = resp.data || [];
          setParametros(lista);
          const mapa = {};
          lista.forEach(p => {
            mapa[p.parametro] = p.valor;
          });
          setValoresEditados(mapa);
        }
      } catch (err) {
        if (!cancelado) {
          setMensajeError(err.response?.data?.message || err.message || 'Error al cargar configuración');
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    })();
    return () => { cancelado = true; };
  }, [recargaTick]);

  const handleChangeValor = (param, val) => {
    setValoresEditados(prev => ({
      ...prev,
      [param]: val
    }));
  };

  const guardarParametro = async (param) => {
    const val = valoresEditados[param];
    if (val === undefined || val.trim() === '') {
      setMensajeError(`El valor para ${param} no puede estar vacío`);
      return;
    }

    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      setMensajeError(`El parámetro ${param} debe ser un número mayor o igual a 0`);
      return;
    }

    setGuardandoParametro(param);
    setMensajeExito('');
    setMensajeError('');

    if (BACKEND_ACTIVO) {
      try {
        await putConfiguracion({
          parametro: param,
          valor: val.trim()
        });
        setMensajeExito(`Parámetro "${param}" actualizado exitosamente a ${val}`);
        setRecargaTick((t) => t + 1);
      } catch (err) {
        setMensajeError(err.response?.data?.message || err.message || 'No se pudo guardar en el servidor');
      } finally {
        setGuardandoParametro('');
      }
    } else {
      setTimeout(() => {
        setMensajeExito(`[Modo local] Parámetro "${param}" actualizado a ${val}`);
        setGuardandoParametro('');
      }, 300);
    }
  };

  return (
    <div className="bx-app">
      <Sidebar />
      <main className="bx-main">
        <header className="bx-hd">
          <div>
            <h1>Configuración del Sistema</h1>
            <span>Parámetros financieros globales, tasas dinámicas y reglas de mora (Solo Administrador)</span>
          </div>
          <span className="bx-pill">6 parámetros activos</span>
        </header>

        {mensajeExito && (
          <div className="bx-c" style={{ borderLeft: '4px solid var(--bx-gr)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="var(--bx-gr)" />
            <span style={{ color: 'var(--bx-gr)', fontWeight: 600 }}>{mensajeExito}</span>
          </div>
        )}

        {mensajeError && (
          <div className="bx-c" style={{ borderLeft: '4px solid var(--bx-rd)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} color="var(--bx-rd)" />
            <span style={{ color: 'var(--bx-rd)', fontWeight: 600 }}>{mensajeError}</span>
          </div>
        )}

        <div className="bx-c">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {cargando ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} />
              </div>
            ) : (
              parametros.map((p) => {
                const info = parametrosInfo[p.parametro] || { label: p.parametro, desc: 'Parámetro de configuración' };
                const estaGuardando = guardandoParametro === p.parametro;
                const valorActual = valoresEditados[p.parametro] !== undefined ? valoresEditados[p.parametro] : p.valor;
                const modificado = valorActual !== p.valor;

                return (
                  <div key={p.id_configuracion || p.parametro} style={{
                    background: '#0e0e12',
                    border: '1px solid var(--bx-line)',
                    borderRadius: '16px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>{info.label}</span>
                        <span className="bx-b bx-b-bl" style={{ fontSize: '10px' }}>{p.parametro}</span>
                      </div>
                      <p className="bx-k" style={{ marginTop: '6px', minHeight: '36px' }}>{info.desc}</p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          step="any"
                          className="bx-in"
                          style={{ fontSize: '16px', fontWeight: 700 }}
                          value={valorActual}
                          onChange={(e) => handleChangeValor(p.parametro, e.target.value)}
                        />
                        <button
                          className="bx-btn"
                          disabled={estaGuardando || !modificado}
                          onClick={() => guardarParametro(p.parametro)}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {estaGuardando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Guardar
                        </button>
                      </div>
                      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--bx-mu)' }}>
                        <span>Valor actual: <strong>{p.valor}</strong></span>
                        <span>Modif: {p.fecha_modificacion || '-'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Configuracion;
