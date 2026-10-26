package pe.edu.utp.cajabchp_backend.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import pe.edu.utp.cajabchp_backend.dtos.AuthRequestDTO;
import pe.edu.utp.cajabchp_backend.dtos.AuthResponseDTO;
import pe.edu.utp.cajabchp_backend.exception.BusinessRuleException;
import pe.edu.utp.cajabchp_backend.models.Usuario;
import pe.edu.utp.cajabchp_backend.repositories.AccesoRepository;
import pe.edu.utp.cajabchp_backend.repositories.UsuarioRepository;
import pe.edu.utp.cajabchp_backend.services.impl.AuthServiceImpl;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private AccesoRepository accesoRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthServiceImpl authService;

    private Usuario usuarioAdmin;

    @BeforeEach
    void setUp() {
        usuarioAdmin = Usuario.builder()
                .idUsuario(1L)
                .usuario("admin")
                .passwordHash("$2a$10$hashedPassword")
                .rol("ADMIN")
                .nombre("Administrador Principal")
                .activo(true)
                .bloqueado(false)
                .intentosFallidos(0)
                .build();
    }

    @Test
    @DisplayName("Debe autenticar correctamente con credenciales válidas y reiniciar intentos fallidos")
    void debeAutenticarCorrectamenteYReiniciarIntentos() {
        // Arrange
        usuarioAdmin.setIntentosFallidos(2);
        AuthRequestDTO request = AuthRequestDTO.builder().usuario("admin").password("1234").build();

        when(usuarioRepository.findByUsuario("admin")).thenReturn(Optional.of(usuarioAdmin));
        when(passwordEncoder.matches("1234", "$2a$10$hashedPassword")).thenReturn(true);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        AuthResponseDTO response = authService.login(request);

        // Assert
        assertNotNull(response);
        assertEquals("admin", response.getUsuario());
        assertEquals("ADMIN", response.getRol());
        assertEquals(0, usuarioAdmin.getIntentosFallidos(), "Los intentos fallidos deben reiniciarse a 0");
        verify(accesoRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Debe bloquear usuario al tercer intento fallido consecutivo")
    void debeBloquearUsuarioTrasTresIntentosFallidosConsecutivos() {
        // Arrange: ya tiene 2 intentos fallidos
        usuarioAdmin.setIntentosFallidos(2);
        AuthRequestDTO request = AuthRequestDTO.builder().usuario("admin").password("clave_errada").build();

        when(usuarioRepository.findByUsuario("admin")).thenReturn(Optional.of(usuarioAdmin));
        when(passwordEncoder.matches("clave_errada", "$2a$10$hashedPassword")).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        // Act & Assert
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> authService.login(request));
        assertTrue(ex.getMessage().contains("bloqueado tras 3 intentos fallidos"));
        assertEquals(Boolean.TRUE, usuarioAdmin.getBloqueado());
        assertEquals(3, usuarioAdmin.getIntentosFallidos());
        verify(accesoRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Debe permitir acceso al portal estudiante con usuario U y clave 123")
    void debePermitirLoginEstudianteConReglaUPasaporte() {
        // Arrange
        AuthRequestDTO request = AuthRequestDTO.builder().usuario("U21203456").password("123").build();
        when(usuarioRepository.findByUsuario("U21203456")).thenReturn(Optional.empty());

        // Act
        AuthResponseDTO response = authService.login(request);

        // Assert
        assertNotNull(response);
        assertEquals("U21203456", response.getUsuario());
        assertEquals("ESTUDIANTE", response.getRol());
        assertEquals("Estudiante U21203456", response.getNombre());
        verify(accesoRepository, times(1)).save(any());
    }
}
