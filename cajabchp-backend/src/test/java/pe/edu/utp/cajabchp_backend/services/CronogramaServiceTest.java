package pe.edu.utp.cajabchp_backend.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.edu.utp.cajabchp_backend.dtos.CronogramaPreviewRequestDTO;
import pe.edu.utp.cajabchp_backend.dtos.CuotaDTO;
import pe.edu.utp.cajabchp_backend.models.Cuota;
import pe.edu.utp.cajabchp_backend.models.Estudiante;
import pe.edu.utp.cajabchp_backend.models.Prestamo;
import pe.edu.utp.cajabchp_backend.repositories.CuotaRepository;
import pe.edu.utp.cajabchp_backend.repositories.HistorialCreditoRepository;
import pe.edu.utp.cajabchp_backend.repositories.MoraRepository;
import pe.edu.utp.cajabchp_backend.repositories.PagoRepository;
import pe.edu.utp.cajabchp_backend.services.impl.CronogramaServiceImpl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CronogramaServiceTest {

    @Mock
    private CuotaRepository cuotaRepository;

    @Mock
    private PagoRepository pagoRepository;

    @Mock
    private MoraRepository moraRepository;

    @Mock
    private HistorialCreditoRepository historialCreditoRepository;

    @InjectMocks
    private CronogramaServiceImpl cronogramaService;

    private Prestamo prestamoDemo;

    @BeforeEach
    void setUp() {
        Estudiante estudiante = Estudiante.builder()
                .idEstudiante(1L)
                .dni("12345678")
                .nombre("JUAN")
                .apellido("PEREZ")
                .correo("juan.perez@utp.edu.pe")
                .promedioNotas(new BigDecimal("15.5"))
                .porcentajeAsistencia(new BigDecimal("90.0"))
                .cicloActual(5)
                .estadoUniversidad("REGULAR")
                .build();

        prestamoDemo = Prestamo.builder()
                .idPrestamo(100L)
                .estudiante(estudiante)
                .monto(new BigDecimal("1000.00"))
                .cuotas(3)
                .tasaInteres(new BigDecimal("10.00"))
                .saldo(new BigDecimal("1100.00"))
                .estado("Activo")
                .fechaInicio(LocalDate.now())
                .build();
    }

    @Test
    @DisplayName("La suma de las cuotas generadas debe coincidir exactamente con el saldo total")
    @SuppressWarnings("null")
    void debeGenerarCronogramaConSumaExactaYCentavosAjustados() {
        // Arrange
        when(cuotaRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        List<Cuota> cuotas = cronogramaService.generarCuotas(prestamoDemo);

        // Assert
        assertNotNull(cuotas);
        assertEquals(3, cuotas.size());

        BigDecimal sumaCuotas = cuotas.stream()
                .map(Cuota::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(new BigDecimal("1100.00"), sumaCuotas, "La suma de las cuotas debe ser exactamente igual al saldo");
        assertEquals(1, cuotas.get(0).getNumeroCuota());
        assertEquals(2, cuotas.get(1).getNumeroCuota());
        assertEquals(3, cuotas.get(2).getNumeroCuota());
        assertEquals(new BigDecimal("366.67"), cuotas.get(0).getMonto());
        assertEquals(new BigDecimal("366.67"), cuotas.get(1).getMonto());
        assertEquals(new BigDecimal("366.66"), cuotas.get(2).getMonto());
    }

    @Test
    @DisplayName("La vista previa del cronograma debe ser idéntica al cronograma real")
    void debeGenerarVistaPreviaIdenticaAlCronogramaReal() {
        // Arrange
        when(cuotaRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        CronogramaPreviewRequestDTO request = CronogramaPreviewRequestDTO.builder()
                .monto(new BigDecimal("1000.00"))
                .cuotas(3)
                .tasaInteres(new BigDecimal("10.00"))
                .fechaInicio(LocalDate.now())
                .build();

        // Act
        List<CuotaDTO> preview = cronogramaService.preview(request);
        List<Cuota> cuotasReales = cronogramaService.generarCuotas(prestamoDemo);

        // Assert
        assertEquals(cuotasReales.size(), preview.size());
        for (int i = 0; i < preview.size(); i++) {
            CuotaDTO dto = preview.get(i);
            Cuota real = cuotasReales.get(i);

            assertEquals(real.getNumeroCuota(), dto.getNumeroCuota());
            assertEquals(real.getFechaVencimiento(), dto.getFechaVencimiento());
            assertEquals(real.getMonto(), dto.getMonto());
            assertEquals(real.getEstado(), dto.getEstado());
        }
    }
}
