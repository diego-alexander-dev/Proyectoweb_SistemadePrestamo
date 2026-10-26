package pe.edu.utp.cajabchp_backend.services.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utp.cajabchp_backend.dtos.AuthRequestDTO;
import pe.edu.utp.cajabchp_backend.dtos.AuthResponseDTO;
import pe.edu.utp.cajabchp_backend.exception.BusinessRuleException;
import pe.edu.utp.cajabchp_backend.models.Acceso;
import pe.edu.utp.cajabchp_backend.models.Usuario;
import pe.edu.utp.cajabchp_backend.repositories.AccesoRepository;
import pe.edu.utp.cajabchp_backend.repositories.UsuarioRepository;
import pe.edu.utp.cajabchp_backend.services.AuthService;

import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UsuarioRepository usuarioRepository;
    private final AccesoRepository accesoRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public AuthResponseDTO login(AuthRequestDTO request) {
        Objects.requireNonNull(request, "La solicitud de autenticación no puede ser nula");
        String username = request.getUsuario().trim();
        String password = request.getPassword().trim();

        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsuario(username);

        if (usuarioOpt.isEmpty()) {
            // Regla portal estudiante: Usuario que empieza con 'U' o 'u' y contraseña '123'
            if (username.toUpperCase().startsWith("U") && "123".equals(password)) {
                registrarAcceso(username, true, "Acceso portal estudiante");
                return AuthResponseDTO.builder()
                    .usuario(username.toUpperCase())
                    .rol("ESTUDIANTE")
                    .nombre("Estudiante " + username.toUpperCase())
                    .build();
            }

            registrarAcceso(username, false, "Usuario inexistente");
            throw new BusinessRuleException("Credenciales inválidas");
        }

        Usuario usuario = usuarioOpt.get();

        if (Boolean.TRUE.equals(usuario.getBloqueado())) {
            registrarAcceso(username, false, "Intento en cuenta bloqueada");
            throw new BusinessRuleException("El usuario se encuentra bloqueado por múltiples intentos fallidos. Contacte al administrador.");
        }

        if (Boolean.FALSE.equals(usuario.getActivo())) {
            registrarAcceso(username, false, "Intento en cuenta inactiva");
            throw new BusinessRuleException("El usuario se encuentra inactivo en el sistema");
        }

        boolean coincide = passwordEncoder.matches(password, usuario.getPasswordHash());

        if (!coincide) {
            int intentos = usuario.getIntentosFallidos() + 1;
            usuario.setIntentosFallidos(intentos);

            if (intentos >= 3) {
                usuario.setBloqueado(true);
                usuarioRepository.save(usuario);
                registrarAcceso(username, false, "Usuario bloqueado tras 3 intentos fallidos");
                throw new BusinessRuleException("El usuario ha sido bloqueado tras 3 intentos fallidos consecutivos");
            } else {
                usuarioRepository.save(usuario);
                registrarAcceso(username, false, "Contraseña incorrecta. Intento " + intentos);
                throw new BusinessRuleException("Credenciales incorrectas. Intento " + intentos + " de 3");
            }
        }

        // Éxito: restablecer intentos fallidos
        usuario.setIntentosFallidos(0);
        usuarioRepository.save(usuario);
        registrarAcceso(username, true, "Inicio de sesión exitoso");

        return AuthResponseDTO.builder()
            .usuario(usuario.getUsuario())
            .rol(usuario.getRol())
            .nombre(usuario.getNombre())
            .build();
    }

    private void registrarAcceso(String usuario, boolean exito, String detalle) {
        Acceso acceso = Acceso.builder()
            .usuario(usuario)
            .fechaHora(OffsetDateTime.now())
            .exito(exito)
            .detalle(detalle)
            .build();
        accesoRepository.save(acceso);
    }
}
