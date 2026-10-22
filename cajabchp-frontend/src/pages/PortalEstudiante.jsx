import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BchpLogo from '../components/LogoBCHP';
import { getEstudiantes, getPrestamos, getPagos } from '../services/api';
import { 
  GraduationCap, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  LogOut, 
  Send, 
  Wallet
} from 'lucide-react';

const soles = (n) => `S/. ${Number(n || 0).toFixed(2)}`;

const PortalEstudiante = () => {
  const navigate = useNavigate();

  // Datos del estudiante en sesión (U21304921 - Diego Huachaca)
  const [estudiante, setEstudiante] = useState({
    id_estudiante: 1,
    dni: '12345678',
    nombre: 'DIEGO',
    apellido: 'HUACHACA',
    correo: 'diego.huachaca@utp.edu.pe',
    ciclo_actual: 5,
    promedio_notas: 16.5,
    porcentaje_asistencia: 92.0,
    estado_universidad: 'ACTIVO'
  });

  const [prestamos, setPrestamos] = useState([
    {
      id_prestamo: 1,
      monto: 5000.00,
      cuotas: 12,
      tasa_interes: 10.00,
      saldo: 5500.00,
      estado: 'Activo',
      fecha_inicio: '2026-09-02',
      dias_mora: 0,
      interes_mora: 0.00
    }
  ]);

  const [pagos, setPagos] = useState([
    {
      id_pago: 4,
      monto: 458.33,
      cuota_numero: 1,
      metodo_pago: 'TRANSFERENCIA BCP',
      fecha_pago: '2026-09-10'
    }
  ]);

  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    monto: '1500',
    cuotas: '6',
    motivo: 'Matrícula y cuotas académicas de ciclo 2026-II'
  });

  useEffect(() => {
    (async () => {
      try {
        const resEst = await getEstudiantes();
        if (resEst.data && resEst.data.length > 0) {
          const actual = resEst.data[0];
          setEstudiante(actual);
        }
      } catch (e) { void e; }

      try {
        const resPrest = await getPrestamos();
        if (resPrest.data && resPrest.data.length > 0) {
          setPrestamos(resPrest.data.slice(0, 2));
        }
      } catch (e) { void e; }

      try {
        const resPagos = await getPagos();
        if (resPagos.data && resPagos.data.length > 0) {
          setPagos(resPagos.data.slice(0, 3));
        }
      } catch (e) { void e; }
    })();
  }, []);

  const enviarSolicitud = (e) => {
    e.preventDefault();
    setSolicitudEnviada(true);
    setTimeout(() => {
      setSolicitudEnviada(false);
      setNuevaSolicitud({ monto: '', cuotas: '6', motivo: '' });
    }, 4000);
  };

  const prestamoActivo = prestamos.find(p => p.estado === 'Activo') || prestamos[0];

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0d', color: '#f4f4f5', padding: '24px 32px' }}>
      {/* Header institucional */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '28px',
        borderBottom: '1px solid #1c1c20',
        paddingBottom: '16px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <BchpLogo size={32} />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--bx-mu)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Portal del Estudiante · Caja BCHP
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
              Bienvenido, {estudiante.nombre} {estudiante.apellido}
            </h2>
          </div>
        </div>

        <button 
          onClick={() => navigate('/')} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: '#15151a', 
            border: '1px solid #27272a', 
            color: '#ff4d5e', 
            padding: '8px 16px', 
            borderRadius: '10px', 
            fontSize: '13px', 
            cursor: 'pointer' 
          }}
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </header>

      {/* Grid principal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '20px' }}>
        
        {/* Columna Izquierda: Ficha Académica y Préstamos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tarjeta de Resumen Académico */}
          <div className="bx-c" style={{ background: 'linear-gradient(135deg, rgba(255,90,54,0.12), #101014 60%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={18} color="var(--bx-or)" />
                Situación Académica Universitaria
              </h3>
              <span className="bx-b bx-b-gr">{estudiante.estado_universidad || 'ACTIVO'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              <div style={{ background: '#141418', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--bx-mu)' }}>DNI / Código</div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>{estudiante.dni}</div>
              </div>
              <div style={{ background: '#141418', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--bx-mu)' }}>Ciclo Académico</div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>{estudiante.ciclo_actual}° Ciclo</div>
              </div>
              <div style={{ background: '#141418', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--bx-mu)' }}>Promedio Ponderado</div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px', color: '#3ddc97' }}>
                  {Number(estudiante.promedio_notas || 0).toFixed(1)} / 20.0
                </div>
              </div>
              <div style={{ background: '#141418', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--bx-mu)' }}>Asistencia</div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px', color: '#6db4ff' }}>
                  {Number(estudiante.porcentaje_asistencia || 0).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* Préstamo Activo */}
          <div className="bx-c">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <CreditCard size={18} color="var(--bx-or)" />
              Mi Crédito Educativo Vigente
            </h3>

            {prestamoActivo ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '18px' }}>
                  <div style={{ background: '#141418', padding: '14px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--bx-mu)' }}>Monto Otorgado</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                      {soles(prestamoActivo.monto)}
                    </div>
                  </div>
                  <div style={{ background: '#141418', padding: '14px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--bx-mu)' }}>Saldo por Amortizar</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--bx-or)', marginTop: '4px' }}>
                      {soles(prestamoActivo.saldo)}
                    </div>
                  </div>
                  <div style={{ background: '#141418', padding: '14px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--bx-mu)' }}>Plazo Acordado</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                      {prestamoActivo.cuotas} cuotas
                    </div>
                  </div>
                </div>

                <div style={{ 
                  background: '#121216', 
                  borderRadius: '12px', 
                  padding: '14px', 
                  border: '1px solid #1f1f26',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px' 
                }}>
                  <Clock size={20} color="#ffb020" />
                  <div style={{ fontSize: '13px' }}>
                    <b>Próximo vencimiento de cuota:</b> 30 del presente mes. 
                    <span style={{ color: 'var(--bx-mu)', display: 'block', fontSize: '11px', marginTop: '2px' }}>
                      Puedes abonar por ventanilla institucional o transferir vía YAPE / BCP reportando tu DNI.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--bx-mu)' }}>
                No tienes créditos educativos activos en este momento.
              </div>
            )}
          </div>

          {/* Historial de Amortizaciones */}
          <div className="bx-c">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Wallet size={18} color="#3ddc97" />
              Historial de Pagos y Amortizaciones
            </h3>

            <table className="bx-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Recibo</th>
                  <th style={{ textAlign: 'left' }}>Cuota N°</th>
                  <th style={{ textAlign: 'left' }}>Método</th>
                  <th style={{ textAlign: 'left' }}>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Monto Pagado</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'left', fontWeight: 600 }}>RC-{String(p.id_pago || idx + 1).padStart(4, '0')}</td>
                    <td style={{ textAlign: 'left' }}>Cuota {p.cuota_numero}</td>
                    <td style={{ textAlign: 'left' }}>
                      <span className="bx-b bx-b-bl">{p.metodo_pago}</span>
                    </td>
                    <td style={{ textAlign: 'left', color: 'var(--bx-mu)' }}>{String(p.fecha_pago).slice(0, 10)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#3ddc97' }}>{soles(p.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Columna Derecha: Formulario de Nueva Solicitud */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="bx-c" style={{ border: '1px solid #23232b' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Send size={18} color="var(--bx-or)" />
              Solicitar Nuevo Crédito Educativo
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--bx-mu)', marginBottom: '18px', lineHeight: 1.5 }}>
              Completa el requerimiento de fondos para matrícula, pensiones o materiales. Nuestro comité evaluará tu historial de notas y asistencia.
            </p>

            {solicitudEnviada ? (
              <div style={{ 
                background: 'rgba(61,220,151,0.12)', 
                border: '1px solid rgba(61,220,151,0.3)', 
                borderRadius: '12px', 
                padding: '20px', 
                textAlign: 'center' 
              }}>
                <CheckCircle2 size={36} color="#3ddc97" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ margin: '0 0 6px', color: '#3ddc97', fontSize: '16px' }}>¡Solicitud Registrada con Éxito!</h4>
                <p style={{ fontSize: '12px', color: '#d4d4d8', margin: 0 }}>
                  Tu expediente ha sido enviado a la mesa de control. El tiempo promedio de respuesta es de 24 a 48 horas.
                </p>
              </div>
            ) : (
              <form onSubmit={enviarSolicitud} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--bx-mu)', marginBottom: '6px', fontWeight: 600 }}>
                    MONTO SOLICITADO (S/.)
                  </label>
                  <input 
                    type="number" 
                    min="100" 
                    max="10000"
                    step="50"
                    required
                    value={nuevaSolicitud.monto} 
                    onChange={e => setNuevaSolicitud({ ...nuevaSolicitud, monto: e.target.value })}
                    style={{ 
                      width: '100%', 
                      background: '#141418', 
                      border: '1px solid #27272a', 
                      color: '#fff', 
                      padding: '10px 14px', 
                      borderRadius: '10px', 
                      fontSize: '14px',
                      boxSizing: 'border-box' 
                    }}
                    placeholder="Ej. 1500"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--bx-mu)', marginBottom: '6px', fontWeight: 600 }}>
                    PLAZO DESEADO (MESES)
                  </label>
                  <select 
                    value={nuevaSolicitud.cuotas} 
                    onChange={e => setNuevaSolicitud({ ...nuevaSolicitud, cuotas: e.target.value })}
                    style={{ 
                      width: '100%', 
                      background: '#141418', 
                      border: '1px solid #27272a', 
                      color: '#fff', 
                      padding: '10px 14px', 
                      borderRadius: '10px', 
                      fontSize: '14px',
                      boxSizing: 'border-box' 
                    }}
                  >
                    <option value="3">3 meses (Cuota corta)</option>
                    <option value="6">6 meses (Semestral)</option>
                    <option value="9">9 meses</option>
                    <option value="12">12 meses (Anual)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--bx-mu)', marginBottom: '6px', fontWeight: 600 }}>
                    MOTIVO DEL CRÉDITO
                  </label>
                  <textarea 
                    rows={3} 
                    required
                    value={nuevaSolicitud.motivo} 
                    onChange={e => setNuevaSolicitud({ ...nuevaSolicitud, motivo: e.target.value })}
                    style={{ 
                      width: '100%', 
                      background: '#141418', 
                      border: '1px solid #27272a', 
                      color: '#fff', 
                      padding: '10px 14px', 
                      borderRadius: '10px', 
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      resize: 'none' 
                    }}
                    placeholder="Describe brevemente el fin del financiamiento..."
                  />
                </div>

                <div style={{ background: '#121216', padding: '12px', borderRadius: '10px', fontSize: '12px', color: 'var(--bx-mu)' }}>
                  Tasa de interés preferencial: <b>10.00% anual</b>. Sin comisiones de apertura.
                </div>

                <button 
                  type="submit" 
                  className="bx-btn" 
                  style={{ justifyContent: 'center', marginTop: '6px' }}
                >
                  <Send size={15} />
                  Enviar Solicitud a Evaluación
                </button>
              </form>
            )}
          </div>

          {/* Información de Ayuda y Contacto */}
          <div className="bx-c" style={{ background: '#121216' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '14px' }}>Canales de Atención Estudiantil</h4>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--bx-mu)', lineHeight: 1.8 }}>
              <li>Ventanilla de Caja: Lunes a Viernes de 08:00 a 18:00 hrs.</li>
              <li>Consultas WhatsApp: +51 987 654 321</li>
              <li>Correo de soporte: bienestar.caja@utp.edu.pe</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PortalEstudiante;
