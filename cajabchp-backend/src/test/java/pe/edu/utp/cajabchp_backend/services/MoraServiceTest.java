package pe.edu.utp.cajabchp_backend.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.edu.utp.cajabchp_backend.dtos.AplicarMoraResponseDTO;
import pe.edu.utp.cajabchp_backend.dtos.PrestamoDTO;
import pe.edu.utp.cajabchp_backend.mappers.PrestamoMapper;
import pe.edu.utp.cajabchp_backend.models.Cuota;
import pe.edu.utp.cajabchp_backend.models.Estudiante;
import pe.edu.utp.cajabchp_backend.models.Mora;
import pe.edu.utp.cajabchp_backend.models.Prestamo;
import pe.edu.utp.cajabchp_backend.repositories.*;
import pe.edu.utp.cajabchp_backend.services.impl.MoraServiceImpl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MoraServiceTest {

    @Mock
    private PrestamoRepository prestamoRepository;

    @Mock
    private CuotaRepository cuotaRepository;

    @Mock
    private MoraRepository moraRepository;

    @Mock
    private HistorialCreditoRepository historialCreditoRepository;

    @Mock
    private ReporteRepository reporteRepository;

    @Mock
    private ConfiguracionService configuracionService;

    @Mock
    private PrestamoMapper prestamoMapper;

    @InjectMocks
    private MoraServiceImpl moraService;

    private Estudiante estudianteRegular;
    private Estudiante estudianteExcelente;
    private Prestamo prestamoRegular;
    private Cuota cuotaVencidaRegular;

    @BeforeEach
    void setUp() {
        lenient().when(configuracionService.getValorBigDecimal(eq("mora_porcentaje"), any(BigDecimal.class)))
                .thenReturn(new BigDecimal("2.0"));
        lenient().when(configuracionService.getValorBigDecimal(eq("gracia_promedio_min"), any(BigDecimal.class)))
                .thenReturn(new BigDecimal("18.0"));
        lenient().when(configuracionService.getValorInt(eq("gracia_dias"), anyInt()))
                .thenReturn(5);

        estudianteRegular = Estudiante.builder()
                .idEstudiante(1L)
                .dni("12345678")
                .nombre("JUAN")
                .apellido("PEREZ")
                .promedioNotas(new BigDecimal("14.0"))
                .build();

        estudianteExcelente = Estudiante.builder()
                .idEstudiante(2L)
                .dni("87654321")
                .nombre("MARIA")
                .apellido("QUISPE")
                .promedioNotas(new BigDecimal("19.0"))
                .build();

        prestamoRegular = Prestamo.builder()
                .idPrestamo(50L)
                .estudiante(estudianteRegular)
                .monto(new BigDecimal("1000.00"))
                .saldo(new BigDecimal("1000.00"))
                .estado("Activo")
                .diasMora(0)
                .interesMora(BigDecimal.ZERO)
                .build();

        cuotaVencidaRegular = Cuota.builder()
                .idCuota(201L)
                .prestamo(prestamoRegular)
                .numeroCuota(1)
                .monto(new BigDecimal("500.00"))
                .fechaVencimiento(LocalDate.now().minusDays(3))
                .estado("Pendiente")
                .build();

        lenient().when(prestamoMapper.toDTO(any(Prestamo.class)))
                .thenReturn(PrestamoDTO.builder().idPrestamo(50L).estado("Activo").build());
    }

    @Test
    @DisplayName("Aplicar mora debe calcular recargo de 2% una sola vez y ser idempotente en ejecuciones posteriores")
    void debeSerIdempotenteYNoDuplicarMoraElMismoDia() {
        // Arrange
        when(prestamoRepository.findById(50L)).thenReturn(Optional.of(prestamoRegular));
        when(cuotaRepository.findByPrestamoIdOrderByNumeroCuotaAsc(50L))
                .thenReturn(List.of(cuotaVencidaRegular));
        // Primera ejecución: mora no existe aún
        when(moraRepository.findByCuotaIdCuota(201L)).thenReturn(Optional.empty());

        // Act 1: Primera aplicación
        AplicarMoraResponseDTO respuesta1 = moraService.aplicarMoraPrestamo(50L);

        // Assert 1
        assertEquals(1, respuesta1.getCuotasAfectadas());
        // 500 * 2% = 10.00
        assertEquals(0, new BigDecimal("10.00").compareTo(respuesta1.getMontoMoraAplicado()));
        assertEquals(0, new BigDecimal("1010.00").compareTo(prestamoRegular.getSaldo()));
        assertEquals(0, new BigDecimal("10.00").compareTo(prestamoRegular.getInteresMora()));
        assertEquals("Vencida", cuotaVencidaRegular.getEstado());
        verify(moraRepository, times(1)).save(any(Mora.class));

        // Act 2: Segunda ejecución (idempotente): la fila de mora ya existe
        Mora moraExistente = Mora.builder()
                .idMora(1L)
                .cuota(cuotaVencidaRegular)
                .diasMora(3)
                .montoMora(new BigDecimal("10.00"))
                .fecha(LocalDate.now())
                .build();
        when(moraRepository.findByCuotaIdCuota(201L)).thenReturn(Optional.of(moraExistente));

        AplicarMoraResponseDTO respuesta2 = moraService.aplicarMoraPrestamo(50L);

        // Assert 2: No debe volver a sumar saldo ni interés de mora
        assertEquals(0, BigDecimal.ZERO.compareTo(respuesta2.getMontoMoraAplicado()), "En segunda ejecución no debe aplicar recargo adicional");
        assertEquals(0, new BigDecimal("1010.00").compareTo(prestamoRegular.getSaldo()), "El saldo se conserva sin duplicar recargo");
        assertEquals(0, new BigDecimal("10.00").compareTo(prestamoRegular.getInteresMora()));
    }

    @Test
    @DisplayName("Debe respetar período de gracia de 5 días para estudiantes con promedio >= 18")
    void debeRespetarPeriodoDeGraciaParaEstudianteDeExcelencia() {
        // Arrange: vence hace 3 días, pero promedio es 19 >= 18 -> dentro de gracia (3 <= 5)
        Prestamo prestamoExcelente = Prestamo.builder()
                .idPrestamo(60L)
                .estudiante(estudianteExcelente)
                .monto(new BigDecimal("1000.00"))
                .saldo(new BigDecimal("1000.00"))
                .estado("Activo")
                .diasMora(0)
                .interesMora(BigDecimal.ZERO)
                .build();

        Cuota cuotaVencidaGracia = Cuota.builder()
                .idCuota(301L)
                .prestamo(prestamoExcelente)
                .numeroCuota(1)
                .monto(new BigDecimal("500.00"))
                .fechaVencimiento(LocalDate.now().minusDays(3))
                .estado("Pendiente")
                .build();

        when(prestamoRepository.findById(60L)).thenReturn(Optional.of(prestamoExcelente));
        when(cuotaRepository.findByPrestamoIdOrderByNumeroCuotaAsc(60L))
                .thenReturn(List.of(cuotaVencidaGracia));

        // Act
        AplicarMoraResponseDTO respuesta = moraService.aplicarMoraPrestamo(60L);

        // Assert
        assertEquals("Vencida", cuotaVencidaGracia.getEstado());
        assertEquals(0, BigDecimal.ZERO.compareTo(respuesta.getMontoMoraAplicado()), "No debe cobrar recargo monetario en período de gracia");
        assertEquals(0, new BigDecimal("1000.00").compareTo(prestamoExcelente.getSaldo()), "El saldo no debe incrementarse");
        verify(moraRepository, never()).save(any());
    }

    @Test
    @DisplayName("Transición de Riesgo Temprano: entra cuando la cuota vence mañana y sale a Activo cuando ya no vence mañana")
    void debeTransicionarRiesgoTempranoEntradaYSalida() {
        // Caso 1: Entrada en Riesgo Temprano (cuota vence mañana)
        LocalDate manana = LocalDate.now().plusDays(1);
        when(cuotaRepository.existsCuotaPendienteConVencimiento(50L, manana)).thenReturn(true);

        moraService.evaluarRiesgoTemprano(prestamoRegular);

        assertEquals("Riesgo Temprano", prestamoRegular.getEstado(), "Debe cambiar a Riesgo Temprano si una cuota vence mañana");

        // Caso 2: Salida de Riesgo Temprano (ya no tiene cuotas venciendo mañana)
        when(cuotaRepository.existsCuotaPendienteConVencimiento(50L, manana)).thenReturn(false);

        moraService.evaluarRiesgoTemprano(prestamoRegular);

        assertEquals("Activo", prestamoRegular.getEstado(), "Debe regresar a Activo si ya no tiene cuotas venciendo mañana");
    }
}
