package pe.edu.utp.cajabchp_backend.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.edu.utp.cajabchp_backend.dtos.ScoringResponseDTO;
import pe.edu.utp.cajabchp_backend.exception.ResourceNotFoundException;
import pe.edu.utp.cajabchp_backend.models.Estudiante;
import pe.edu.utp.cajabchp_backend.models.Prestamo;
import pe.edu.utp.cajabchp_backend.repositories.EstudianteRepository;
import pe.edu.utp.cajabchp_backend.repositories.PrestamoRepository;
import pe.edu.utp.cajabchp_backend.services.impl.ScoringServiceImpl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias de casos de frontera y validación estricta de Reglas de Negocio
 * para la feature de Scoring Híbrido y Tasas Dinámicas (RF-02 / CU-02).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas de Reglas de Negocio - Scoring Híbrido y Tasas Dinámicas")
@SuppressWarnings("null")
class ScoringReglasNegocioFronteraTest {

    @Mock
    private EstudianteRepository estudianteRepository;

    @Mock
    private PrestamoRepository prestamoRepository;

    @Mock
    private ConfiguracionService configuracionService;

    @InjectMocks
    private ScoringServiceImpl scoringService;

    @BeforeEach
    void setUp() {
        lenient().when(configuracionService.getValorBigDecimal(eq("promedio_excelencia"), any(BigDecimal.class)))
                .thenReturn(new BigDecimal("16.0"));
        lenient().when(configuracionService.getValorBigDecimal(eq("tasa_excelencia"), any(BigDecimal.class)))
                .thenReturn(new BigDecimal("8.0"));
        lenient().when(configuracionService.getValorBigDecimal(eq("tasa_base"), any(BigDecimal.class)))
                .thenReturn(new BigDecimal("10.0"));
    }

    @Test
    @DisplayName("Caso frontera: Promedio exactamente 16.0 debe aplicar tasa base del 10%")
    void debeAplicarTasaBaseEnUmbralFronteraDieciseis() {
        // Arrange: la regla indica > 16.0 para tasa de excelencia
        BigDecimal promedioFrontera = new BigDecimal("16.0");

        // Act
        BigDecimal tasa = scoringService.calcularTasaDinamica(promedioFrontera);

        // Assert
        assertEquals(new BigDecimal("10.0"), tasa, "Con promedio 16.0 exacto debe aplicar tasa base 10.0%");
    }

    @Test
    @DisplayName("Caso frontera: Promedio 16.01 debe superar el umbral y obtener tasa preferencial del 8%")
    void debeAplicarTasaExcelenciaSuperandoLigeramenteUmbral() {
        // Arrange
        BigDecimal promedioSuperior = new BigDecimal("16.01");

        // Act
        BigDecimal tasa = scoringService.calcularTasaDinamica(promedioSuperior);

        // Assert
        assertEquals(new BigDecimal("8.0"), tasa, "Con promedio > 16.0 debe asignar tasa preferencial 8.0%");
    }

    @Test
    @DisplayName("Regla de negocio: Debe calcular deuda total activa acumulada de préstamos vigentes")
    void debeCalcularDeudaTotalVigenteCorrectamente() {
        // Arrange
        Estudiante estudiante = Estudiante.builder()
                .idEstudiante(2L)
                .dni("12345678")
                .nombre("ANA")
                .apellido("TORRES")
                .promedioNotas(new BigDecimal("17.0"))
                .porcentajeAsistencia(new BigDecimal("90.0"))
                .cicloActual(6)
                .estadoUniversidad("REGULAR")
                .build();

        Prestamo p1 = Prestamo.builder()
                .idPrestamo(101L)
                .saldo(new BigDecimal("1200.50"))
                .estado("Activo")
                .build();

        Prestamo p2 = Prestamo.builder()
                .idPrestamo(102L)
                .saldo(new BigDecimal("800.25"))
                .estado("Riesgo Temprano")
                .build();

        Prestamo pCancelado = Prestamo.builder()
                .idPrestamo(103L)
                .saldo(BigDecimal.ZERO)
                .estado("Pagado")
                .build();

        when(estudianteRepository.findById(2L)).thenReturn(Optional.of(estudiante));
        when(prestamoRepository.findByEstudianteId(2L)).thenReturn(List.of(p1, p2, pCancelado));

        // Act
        ScoringResponseDTO res = scoringService.evaluarEstudiante(2L);

        // Assert
        assertNotNull(res);
        assertEquals(new BigDecimal("2000.75"), res.getDeudaVigente(), "La deuda vigente debe ser la suma de saldos activos");
        assertEquals(new BigDecimal("8.0"), res.getTasaSugerida(), "Por promedio 17.0 debe mantener tasa 8.0%");
    }

    @Test
    @DisplayName("Regla de negocio: Debe lanzar ResourceNotFoundException si el estudiante no existe")
    void debeLanzarExcepcionSiEstudianteNoExiste() {
        // Arrange
        when(estudianteRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> scoringService.evaluarEstudiante(999L));
    }
}
