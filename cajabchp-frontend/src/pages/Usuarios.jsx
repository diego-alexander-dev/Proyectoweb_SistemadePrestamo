import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getUsuarios, postUsuario, putUsuario, BACKEND_ACTIVO } from '../services/api';
import { Loader2, UserPlus, Shield, Lock, Unlock, CheckCircle2, AlertCircle, KeyRound, UserCheck, UserX } from 'lucide-react';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  // Modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalClave, setModalClave] = useState(null); // id_usuario
  const [nuevaClave, setNuevaClave] = useState('');

  // Formulario nuevo usuario
  const [formNuevo, setFormNuevo] = useState({
    usuario: '',
    password: '',
    nombre: '',
    rol: 'OPERADOR',
  });

  const cargarUsuarios = async () => {
    if (!BACKEND_ACTIVO) {
      setUsuarios([
        { id_usuario: 1, usuario: 'admin', rol: 'ADMIN', nombre: 'Administrador Principal', activo: true, bloqueado: false, intentos_fallidos: 0 },
        { id_usuario: 2, usuario: 'asistente', rol: 'OPERADOR', nombre: 'Asistente de Créditos', activo: true, bloqueado: false, intentos_fallidos: 0 },
      ]);
      return;
    }

    setCargando(true);
    setMensajeError('');
    try {
      const resp = await getUsuarios();
      setUsuarios(resp.data || []);
    } catch (err) {
      setMensajeError(err.response?.data?.message || err.message || 'Error al cargar usuarios');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let cancelado = false;
    (async () => {
      if (!BACKEND_ACTIVO) {
        setUsuarios([
          { id_usuario: 1, usuario: 'admin', rol: 'ADMIN', nombre: 'Administrador del Sistema', activo: true, intentos_fallidos: 0, bloqueado: false },
          { id_usuario: 2, usuario: 'asistente', rol: 'OPERADOR', nombre: 'Operador de Créditos', activo: true, intentos_fallidos: 0, bloqueado: false },
        ]);
        return;
      }
      setCargando(true);
      setMensajeError('');
      try {
        const resp = await getUsuarios();
        if (!cancelado) setUsuarios(resp.data || []);
      } catch (err) {
        if (!cancelado) setMensajeError(err.response?.data?.message || err.message || 'Error al cargar usuarios');
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => { cancelado = true; };
  }, []);

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    if (!formNuevo.usuario.trim() || !formNuevo.password.trim() || !formNuevo.nombre.trim()) {
      setMensajeError('Todos los campos son obligatorios');
      return;
    }

    setCargando(true);
    setMensajeExito('');
    setMensajeError('');

    if (BACKEND_ACTIVO) {
      try {
        await postUsuario({
          usuario: formNuevo.usuario.trim(),
          password: formNuevo.password.trim(),
          nombre: formNuevo.nombre.trim(),
          rol: formNuevo.rol,
        });
        setMensajeExito(`Usuario ${formNuevo.usuario} creado exitosamente con rol ${formNuevo.rol}`);
        setModalCrear(false);
        setFormNuevo({ usuario: '', password: '', nombre: '', rol: 'OPERADOR' });
        await cargarUsuarios();
      } catch (err) {
        setMensajeError(err.response?.data?.message || err.message || 'No se pudo crear el usuario');
      } finally {
        setCargando(false);
      }
    } else {
      setTimeout(() => {
        setMensajeExito(`[Modo local] Usuario ${formNuevo.usuario} registrado`);
        setModalCrear(false);
        setCargando(false);
      }, 300);
    }
  };

  const handleToggleBloqueo = async (usr) => {
    const nuevoEstado = !usr.bloqueado;
    setCargando(true);
    setMensajeExito('');
    setMensajeError('');

    if (BACKEND_ACTIVO) {
      try {
        await putUsuario(usr.id_usuario, {
          bloqueado: nuevoEstado,
        });
        setMensajeExito(`Usuario ${usr.usuario} ${nuevoEstado ? 'bloqueado' : 'desbloqueado con éxito'}`);
        await cargarUsuarios();
      } catch (err) {
        setMensajeError(err.response?.data?.message || err.message || 'No se pudo actualizar el bloqueo');
      } finally {
        setCargando(false);
      }
    } else {
      usr.bloqueado = nuevoEstado;
      setMensajeExito(`[Modo local] Estado de bloqueo actualizado`);
      setCargando(false);
    }
  };

  const handleToggleActivo = async (usr) => {
    const nuevoEstado = !usr.activo;
    setCargando(true);
    setMensajeExito('');
    setMensajeError('');

    if (BACKEND_ACTIVO) {
      try {
        await putUsuario(usr.id_usuario, {
          activo: nuevoEstado,
        });
        setMensajeExito(`Usuario ${usr.usuario} ${nuevoEstado ? 'activado' : 'desactivado'}`);
        await cargarUsuarios();
      } catch (err) {
        setMensajeError(err.response?.data?.message || err.message || 'No se pudo actualizar el estado');
      } finally {
        setCargando(false);
      }
    } else {
      usr.activo = nuevoEstado;
      setMensajeExito(`[Modo local] Estado actualizado`);
      setCargando(false);
    }
  };

  const handleCambiarClave = async (e) => {
    e.preventDefault();
    if (!nuevaClave.trim() || nuevaClave.trim().length < 4) {
      setMensajeError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    setCargando(true);
    setMensajeExito('');
    setMensajeError('');

    if (BACKEND_ACTIVO) {
      try {
        await putUsuario(modalClave.id_usuario, {
          password: nuevaClave.trim(),
        });
        setMensajeExito(`Contraseña de ${modalClave.usuario} actualizada correctamente`);
        setModalClave(null);
        setNuevaClave('');
        await cargarUsuarios();
      } catch (err) {
        setMensajeError(err.response?.data?.message || err.message || 'No se pudo cambiar la contraseña');
      } finally {
        setCargando(false);
      }
    } else {
      setMensajeExito(`[Modo local] Contraseña actualizada`);
      setModalClave(null);
      setNuevaClave('');
      setCargando(false);
    }
  };

  return (
    <div className="bx-app">
      <Sidebar />
      <main className="bx-main">
        <header className="bx-hd">
          <div>
            <h1>Gestión de Usuarios</h1>
            <span>Control de operadores, roles, activación de cuentas y restablecimiento de contraseñas</span>
          </div>
          <button className="bx-btn" onClick={() => setModalCrear(true)}>
            <UserPlus size={16} />
            Crear Operador
          </button>
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

        <div className="bx-c" style={{ overflowX: 'auto' }}>
          <table className="bx-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>USUARIO</th>
                <th>NOMBRE</th>
                <th>ROL</th>
                <th>ESTADO</th>
                <th>BLOQUEO</th>
                <th style={{ textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {cargando && usuarios.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : (
                usuarios.map((usr) => (
                  <tr key={usr.id_usuario}>
                    <td>#{usr.id_usuario}</td>
                    <td style={{ fontWeight: 700 }}>{usr.usuario}</td>
                    <td>{usr.nombre}</td>
                    <td>
                      <span className={`bx-b ${usr.rol === 'ADMIN' ? 'bx-b-am' : 'bx-b-bl'}`}>
                        <Shield size={12} /> {usr.rol}
                      </span>
                    </td>
                    <td>
                      <span className={`bx-b ${usr.activo ? 'bx-b-gr' : 'bx-b-rd'}`}>
                        {usr.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      {usr.bloqueado ? (
                        <span className="bx-b bx-b-rd" title={`Intentos fallidos: ${usr.intentos_fallidos}`}>
                          <Lock size={12} /> Bloqueado ({usr.intentos_fallidos})
                        </span>
                      ) : (
                        <span className="bx-b bx-b-gr">
                          <Unlock size={12} /> Normal
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {usr.bloqueado && (
                          <button
                            className="bx-chip on"
                            onClick={() => handleToggleBloqueo(usr)}
                            title="Desbloquear cuenta de usuario"
                          >
                            <Unlock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            Desbloquear
                          </button>
                        )}
                        <button
                          className="bx-chip"
                          onClick={() => handleToggleActivo(usr)}
                          title={usr.activo ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {usr.activo ? <UserX size={12} style={{ display: 'inline', marginRight: '4px' }} /> : <UserCheck size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                          {usr.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          className="bx-chip"
                          onClick={() => setModalClave(usr)}
                          title="Restablecer contraseña"
                        >
                          <KeyRound size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          Clave
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Crear Usuario */}
        {modalCrear && (
          <div className="bx-overlay" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="bx-c" style={{ width: '90%', maxWidth: '480px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3>Registrar Nuevo Operador</h3>
                <button className="bx-out" onClick={() => setModalCrear(false)}>✕</button>
              </div>

              <form onSubmit={handleCrearUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="bx-k" style={{ display: 'block', marginBottom: '4px' }}>USUARIO (LOGIN)</label>
                  <input
                    className="bx-in"
                    placeholder="Ej. operador1, cajero2"
                    value={formNuevo.usuario}
                    onChange={(e) => setFormNuevo({ ...formNuevo, usuario: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="bx-k" style={{ display: 'block', marginBottom: '4px' }}>NOMBRE COMPLETO</label>
                  <input
                    className="bx-in"
                    placeholder="Ej. Carlos Mendoza"
                    value={formNuevo.nombre}
                    onChange={(e) => setFormNuevo({ ...formNuevo, nombre: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="bx-k" style={{ display: 'block', marginBottom: '4px' }}>ROL ASIGNADO</label>
                  <select
                    className="bx-in"
                    value={formNuevo.rol}
                    onChange={(e) => setFormNuevo({ ...formNuevo, rol: e.target.value })}
                  >
                    <option value="OPERADOR">OPERADOR (Ventanilla / Préstamos / Pagos)</option>
                    <option value="ADMIN">ADMIN (Acceso Total y Auditoría)</option>
                  </select>
                </div>

                <div>
                  <label className="bx-k" style={{ display: 'block', marginBottom: '4px' }}>CONTRASEÑA INICIAL</label>
                  <input
                    type="password"
                    className="bx-in"
                    placeholder="••••••••"
                    value={formNuevo.password}
                    onChange={(e) => setFormNuevo({ ...formNuevo, password: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <button type="button" className="bx-ghost" onClick={() => setModalCrear(false)}>Cancelar</button>
                  <button type="submit" className="bx-btn" disabled={cargando}>
                    {cargando ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    Crear Usuario
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Cambiar Clave */}
        {modalClave && (
          <div className="bx-overlay" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="bx-c" style={{ width: '90%', maxWidth: '420px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3>Restablecer Contraseña</h3>
                <button className="bx-out" onClick={() => setModalClave(null)}>✕</button>
              </div>

              <p className="bx-k" style={{ marginBottom: '14px' }}>
                Usuario: <strong>{modalClave.usuario}</strong> ({modalClave.nombre})
              </p>

              <form onSubmit={handleCambiarClave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="bx-k" style={{ display: 'block', marginBottom: '4px' }}>NUEVA CONTRASEÑA</label>
                  <input
                    type="password"
                    className="bx-in"
                    placeholder="Mínimo 4 caracteres"
                    value={nuevaClave}
                    onChange={(e) => setNuevaClave(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <button type="button" className="bx-ghost" onClick={() => setModalClave(null)}>Cancelar</button>
                  <button type="submit" className="bx-btn" disabled={cargando}>
                    {cargando ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                    Actualizar Clave
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Usuarios;
