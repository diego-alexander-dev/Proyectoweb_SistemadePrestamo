package pe.edu.utp.cajabchp_backend.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.edu.utp.cajabchp_backend.dtos.ScoringResponseDTO;
import pe.edu.utp.cajabchp_backend.models.Estudiante;
import pe.edu.utp.cajabchp_backend.repositories.EstudianteRepository;
import pe.edu.utp.cajabchp_backend.repositories.PrestamoRepository;
import pe.edu.utp.cajabchp_backend.services.impl.ScoringServiceImpl;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScoringServiceTest {

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
    @DisplayName("Debe aplicar tasa de excelencia (8%) si el promedio supera 16")
    void debeAplicarTasaExcelenciaCuandoPromedioSuperaUmbral() {
        // Arrange
        BigDecimal promedioExcelente = new BigDecimal("17.5");

        // Act
        BigDecimal tasa = scoringService.calcularTasaDinamica(promedioExcelente);

        // Assert
        assertEquals(new BigDecimal("8.0"), tasa);
    }

    @Test
    @DisplayName("Debe aplicar tasa base (10%) si el promedio es menor o igual a 16")
    void debeAplicarTasaBaseCuandoPromedioEsMenorOIgualAlUmbral() {
        // Arrange
        BigDecimal promedioNormal = new BigDecimal("15.0");

        // Act
        BigDecimal tasa = scoringService.calcularTasaDinamica(promedioNormal);

        // Assert
        assertEquals(new BigDecimal("10.0"), tasa);
    }

    @Test
    @DisplayName("Debe calcular score y dictamen idéntico a Solicitudes.jsx")
    void debeCalcularScoreYDictamenIdenticoAlFrontend() {
        // Arrange
        // promedio=18 (18/20*40=36 pts), asistencia=95 (95/100*40=38 pts), ciclo=5 (20 pts) -> total 94 pts -> EXCELENTE
        Estudiante estudiante = Estudiante.builder()
                .idEstudiante(1L)
                .dni("87654321")
                .nombre("CARLOS")
                .apellido("GUTIERREZ")
                .promedioNotas(new BigDecimal("18.0"))
                .porcentajeAsistencia(new BigDecimal("95.0"))
                .cicloActual(5)
                .estadoUniversidad("REGULAR")
                .build();

        when(estudianteRepository.findById(1L)).thenReturn(Optional.of(estudiante));
        when(prestamoRepository.findByEstudianteId(1L)).thenReturn(Collections.emptyList());

        // Act
        ScoringResponseDTO response = scoringService.evaluarEstudiante(1L);

        // Assert
        assertNotNull(response);
        assertEquals(94, response.getScore());
        assertEquals("EXCELENTE", response.getDictamen());
        assertEquals(new BigDecimal("8.0"), response.getTasaSugerida());
        assertEquals(BigDecimal.ZERO, response.getDeudaVigente());
    }
}
