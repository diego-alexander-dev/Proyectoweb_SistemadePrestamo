package pe.edu.utp.cajabchp_backend.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.edu.utp.cajabchp_backend.dtos.PagoDTO;
import pe.edu.utp.cajabchp_backend.dtos.PagoRequestDTO;
import pe.edu.utp.cajabchp_backend.exception.BusinessRuleException;
import pe.edu.utp.cajabchp_backend.mappers.PagoMapper;
import pe.edu.utp.cajabchp_backend.models.Cuota;
import pe.edu.utp.cajabchp_backend.models.Estudiante;
import pe.edu.utp.cajabchp_backend.models.Pago;
import pe.edu.utp.cajabchp_backend.models.Prestamo;
import pe.edu.utp.cajabchp_backend.repositories.CuotaRepository;
import pe.edu.utp.cajabchp_backend.repositories.HistorialCreditoRepository;
import pe.edu.utp.cajabchp_backend.repositories.PagoRepository;
import pe.edu.utp.cajabchp_backend.repositories.PrestamoRepository;
import pe.edu.utp.cajabchp_backend.services.impl.PagoServiceImpl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PagoServiceTest {

    @Mock
    private PagoRepository pagoRepository;

    @Mock
    private PrestamoRepository prestamoRepository;

    @Mock
    private CuotaRepository cuotaRepository;

    @Mock
    private HistorialCreditoRepository historialCreditoRepository;

    @Mock
    private PagoMapper pagoMapper;

    @Mock
    private MoraService moraService;

    @InjectMocks
    private PagoServiceImpl pagoService;

    private Prestamo prestamo;
    private Cuota cuota;
    private Estudiante estudiante;

    @BeforeEach
    void setUp() {
        estudiante = Estudiante.builder()
                .idEstudiante(1L)
                .dni("11223344")
                .nombre("ANA")
                .apellido("LOPEZ")
                .build();

        prestamo = Prestamo.builder()
                .idPrestamo(10L)
                .estudiante(estudiante)
                .monto(new BigDecimal("1000.00"))
                .saldo(new BigDecimal("500.00"))
                .cuotas(2)
                .tasaInteres(new BigDecimal("10.00"))
                .estado("Activo")
                .diasMora(0)
                .interesMora(BigDecimal.ZERO)
                .build();

        cuota = Cuota.builder()
                .idCuota(101L)
                .prestamo(prestamo)
                .numeroCuota(1)
                .monto(new BigDecimal("250.00"))
                .fechaVencimiento(LocalDate.now().plusDays(10))
                .estado("Pendiente")
                .build();
    }

    @Test
    @DisplayName("Debe registrar pago parcial: el saldo disminuye y la cuota permanece Pendiente")
    void debeRegistrarPagoParcialDeCuotaYActualizarSaldo() {
        // Arrange
        PagoRequestDTO request = PagoRequestDTO.builder()
                .idPrestamo(10L)
                .cuotaNumero(1)
                .monto(new BigDecimal("100.00"))
                .metodoPago("TRANSFERENCIA")
                .build();

        when(prestamoRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(prestamo));
        when(cuotaRepository.findByPrestamoIdAndNumeroCuota(10L, 1)).thenReturn(Optional.of(cuota));
        when(pagoRepository.findByPrestamoId(10L)).thenReturn(Collections.emptyList());
        when(pagoRepository.save(any(Pago.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(pagoMapper.toDTO(any(Pago.class))).thenReturn(PagoDTO.builder().idPago(1L).monto(new BigDecimal("100.00")).build());

        // Act
        PagoDTO resultado = pagoService.registrarPago(request);

        // Assert
        assertNotNull(resultado);
        assertEquals(new BigDecimal("400.00"), prestamo.getSaldo());
        assertEquals("Pendiente", cuota.getEstado());
        verify(pagoRepository, times(1)).save(any(Pago.class));
        verify(historialCreditoRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Debe registrar pago total de cuota: cuota pasa a estado Pagada")
    void debeRegistrarPagoTotalDeCuotaYMarcarlaPagada() {
        // Arrange
        PagoRequestDTO request = PagoRequestDTO.builder()
                .idPrestamo(10L)
                .cuotaNumero(1)
                .monto(new BigDecimal("250.00"))
                .metodoPago("EFECTIVO")
                .build();

        when(prestamoRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(prestamo));
        when(cuotaRepository.findByPrestamoIdAndNumeroCuota(10L, 1)).thenReturn(Optional.of(cuota));
        when(pagoRepository.findByPrestamoId(10L)).thenReturn(Collections.emptyList());
        when(pagoRepository.save(any(Pago.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(pagoMapper.toDTO(any(Pago.class))).thenReturn(PagoDTO.builder().idPago(2L).monto(new BigDecimal("250.00")).build());

        // Act
        PagoDTO resultado = pagoService.registrarPago(request);

        // Assert
        assertNotNull(resultado);
        assertEquals(new BigDecimal("250.00"), prestamo.getSaldo());
        assertEquals("Pagada", cuota.getEstado());
        verify(cuotaRepository, times(1)).save(cuota);
    }

    @Test
    @DisplayName("Debe rechazar pago con monto mayor al pendiente de la cuota")
    void debeLanzarExcepcionSiMontoSuperaPendienteDeCuota() {
        // Arrange: cuota es de 250, intento pagar 300
        PagoRequestDTO request = PagoRequestDTO.builder()
                .idPrestamo(10L)
                .cuotaNumero(1)
                .monto(new BigDecimal("300.00"))
                .metodoPago("YAPE")
                .build();

        when(prestamoRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(prestamo));
        when(cuotaRepository.findByPrestamoIdAndNumeroCuota(10L, 1)).thenReturn(Optional.of(cuota));
        when(pagoRepository.findByPrestamoId(10L)).thenReturn(Collections.emptyList());

        // Act & Assert
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> pagoService.registrarPago(request));
        assertTrue(ex.getMessage().contains("supera el saldo pendiente"));
    }

    @Test
    @DisplayName("Debe rechazar pago si la cuota ya está Pagada")
    void debeLanzarExcepcionSiCuotaYaEstaPagada() {
        // Arrange
        cuota.setEstado("Pagada");
        PagoRequestDTO request = PagoRequestDTO.builder()
                .idPrestamo(10L)
                .cuotaNumero(1)
                .monto(new BigDecimal("50.00"))
                .metodoPago("YAPE")
                .build();

        when(prestamoRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(prestamo));
        when(cuotaRepository.findByPrestamoIdAndNumeroCuota(10L, 1)).thenReturn(Optional.of(cuota));

        // Act & Assert
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> pagoService.registrarPago(request));
        assertTrue(ex.getMessage().contains("ya se encuentra pagada"));
    }

    @Test
    @DisplayName("Debe anular pago, devolver saldo al préstamo y reabrir la cuota")
    void debeAnularPagoYRestituirSaldoYReabrirCuota() {
        // Arrange
        cuota.setEstado("Pagada");
        prestamo.setSaldo(new BigDecimal("250.00"));

        Pago pago = Pago.builder()
                .idPago(55L)
                .prestamo(prestamo)
                .cuota(cuota)
                .monto(new BigDecimal("250.00"))
                .estado("REGISTRADO")
                .fechaPago(LocalDate.now())
                .build();

        when(pagoRepository.findById(55L)).thenReturn(Optional.of(pago));
        when(prestamoRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(prestamo));
        when(pagoRepository.save(any(Pago.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(pagoMapper.toDTO(any(Pago.class))).thenReturn(PagoDTO.builder().idPago(55L).build());

        // Act
        PagoDTO anulado = pagoService.anular(55L);

        // Assert
        assertNotNull(anulado);
        assertEquals("ANULADO", pago.getEstado());
        assertEquals(new BigDecimal("500.00"), prestamo.getSaldo(), "El saldo debe ser restituido sumando el monto anulado");
        assertEquals("Pendiente", cuota.getEstado(), "La cuota debe reabrirse a Pendiente");
        verify(historialCreditoRepository, times(1)).save(any());
    }
}
