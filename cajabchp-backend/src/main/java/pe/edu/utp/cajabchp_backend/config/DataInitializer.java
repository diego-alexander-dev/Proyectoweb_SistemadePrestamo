package pe.edu.utp.cajabchp_backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import pe.edu.utp.cajabchp_backend.models.Usuario;
import pe.edu.utp.cajabchp_backend.repositories.UsuarioRepository;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Inicialización de usuario ADMIN
        if (!usuarioRepository.existsByUsuario("admin")) {
            Usuario admin = Usuario.builder()
                .usuario("admin")
                .passwordHash(passwordEncoder.encode("1234"))
                .rol("ADMIN")
                .nombre("Administrador Principal")
                .activo(true)
                .intentosFallidos(0)
                .bloqueado(false)
                .build();
            usuarioRepository.save(admin);
            log.info("Usuario inicial 'admin' creado exitosamente con rol ADMIN");
        }

        // Inicialización de usuario OPERADOR
        if (!usuarioRepository.existsByUsuario("asistente")) {
            Usuario asistente = Usuario.builder()
                .usuario("asistente")
                .passwordHash(passwordEncoder.encode("1234"))
                .rol("OPERADOR")
                .nombre("Asistente Operativo")
                .activo(true)
                .intentosFallidos(0)
                .bloqueado(false)
                .build();
            usuarioRepository.save(asistente);
            log.info("Usuario inicial 'asistente' creado exitosamente con rol OPERADOR");
        }
    }
}
