package pe.edu.utp.cajabchp_backend.services;

import pe.edu.utp.cajabchp_backend.dtos.UsuarioCreateDTO;
import pe.edu.utp.cajabchp_backend.dtos.UsuarioDTO;
import pe.edu.utp.cajabchp_backend.dtos.UsuarioUpdateDTO;

import java.util.List;

public interface UsuarioService {

    List<UsuarioDTO> listarUsuarios();

    UsuarioDTO crearUsuario(UsuarioCreateDTO dto);

    UsuarioDTO actualizarUsuario(Long id, UsuarioUpdateDTO dto);
}
