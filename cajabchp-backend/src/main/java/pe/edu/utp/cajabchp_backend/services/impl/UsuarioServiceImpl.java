package pe.edu.utp.cajabchp_backend.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utp.cajabchp_backend.dtos.UsuarioCreateDTO;
import pe.edu.utp.cajabchp_backend.dtos.UsuarioDTO;
import pe.edu.utp.cajabchp_backend.dtos.UsuarioUpdateDTO;
import pe.edu.utp.cajabchp_backend.exception.BusinessRuleException;
import pe.edu.utp.cajabchp_backend.exception.ResourceNotFoundException;
import pe.edu.utp.cajabchp_backend.models.Usuario;
import pe.edu.utp.cajabchp_backend.repositories.UsuarioRepository;
import pe.edu.utp.cajabchp_backend.services.UsuarioService;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioDTO> listarUsuarios() {
        return usuarioRepository.findAll().stream()
            .map(this::toDTO)
            .toList();
    }

    @Override
    @Transactional
    public UsuarioDTO crearUsuario(UsuarioCreateDTO dto) {
        Objects.requireNonNull(dto, "Los datos del usuario no pueden ser nulos");
        String username = dto.getUsuario().trim().toLowerCase();

        if (usuarioRepository.existsByUsuario(username)) {
            throw new BusinessRuleException("El nombre de usuario '" + username + "' ya está registrado");
        }

        String rol = dto.getRol().trim().toUpperCase();
        if (!"ADMIN".equals(rol) && !"OPERADOR".equals(rol)) {
            throw new BusinessRuleException("El rol debe ser ADMIN u OPERADOR");
        }

        Usuario usuario = Usuario.builder()
            .usuario(username)
            .passwordHash(passwordEncoder.encode(dto.getPassword().trim()))
            .rol(rol)
            .nombre(dto.getNombre().trim())
            .activo(true)
            .intentosFallidos(0)
            .bloqueado(false)
            .build();

        Usuario guardado = usuarioRepository.save(usuario);
        return toDTO(guardado);
    }

    @Override
    @Transactional
    public UsuarioDTO actualizarUsuario(Long id, UsuarioUpdateDTO dto) {
        Objects.requireNonNull(id, "El ID de usuario no puede ser nulo");
        Objects.requireNonNull(dto, "Los datos de actualización no pueden ser nulos");

        Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario con ID " + id + " no encontrado"));

        if (dto.getRol() != null && !dto.getRol().isBlank()) {
            String nuevoRol = dto.getRol().trim().toUpperCase();
            if (!"ADMIN".equals(nuevoRol) && !"OPERADOR".equals(nuevoRol)) {
                throw new BusinessRuleException("El rol debe ser ADMIN u OPERADOR");
            }
            usuario.setRol(nuevoRol);
        }

        if (dto.getActivo() != null) {
            usuario.setActivo(dto.getActivo());
        }

        if (dto.getBloqueado() != null) {
            usuario.setBloqueado(dto.getBloqueado());
            if (!dto.getBloqueado()) {
                usuario.setIntentosFallidos(0);
            }
        }

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            usuario.setPasswordHash(passwordEncoder.encode(dto.getPassword().trim()));
        }

        if (dto.getNombre() != null && !dto.getNombre().isBlank()) {
            usuario.setNombre(dto.getNombre().trim());
        }

        Usuario actualizado = usuarioRepository.save(usuario);
        return toDTO(actualizado);
    }

    private UsuarioDTO toDTO(Usuario u) {
        return UsuarioDTO.builder()
            .idUsuario(u.getIdUsuario())
            .usuario(u.getUsuario())
            .rol(u.getRol())
            .nombre(u.getNombre())
            .activo(u.getActivo())
            .intentosFallidos(u.getIntentosFallidos())
            .bloqueado(u.getBloqueado())
            .build();
    }
}
