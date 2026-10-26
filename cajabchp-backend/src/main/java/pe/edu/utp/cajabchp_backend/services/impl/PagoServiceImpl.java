package pe.edu.utp.cajabchp_backend.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utp.cajabchp_backend.dtos.PagoDTO;
import pe.edu.utp.cajabchp_backend.dtos.PagoRequestDTO;
import pe.edu.utp.cajabchp_backend.exception.BusinessRuleException;
import pe.edu.utp.cajabchp_backend.exception.ResourceNotFoundException;
import pe.edu.utp.cajabchp_backend.mappers.PagoMapper;
import pe.edu.utp.cajabchp_backend.models.Cuota;
import pe.edu.utp.cajabchp_backend.models.HistorialCredito;
import pe.edu.utp.cajabchp_backend.models.Pago;
import pe.edu.utp.cajabchp_backend.models.Prestamo;
import pe.edu.utp.cajabchp_backend.repositories.CuotaRepository;
import pe.edu.utp.cajabchp_backend.repositories.HistorialCreditoRepository;
import pe.edu.utp.cajabchp_backend.repositories.PagoRepository;
import pe.edu.utp.cajabchp_backend.repositories.PrestamoRepository;
import pe.edu.utp.cajabchp_backend.services.MoraService;
import pe.edu.utp.cajabchp_backend.services.PagoService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class PagoServiceImpl implements PagoService {

    private final PagoRepository pagoRepository;
    private final PrestamoRepository prestamoRepository;
    private final CuotaRepository cuotaRepository;
    private final HistorialCreditoRepository historialCreditoRepository;
    private final MoraService moraService;
    private final PagoMapper pagoMapper;

    @Override
    @Transactional(readOnly = true)
    public List<PagoDTO> listarTodos() {
        return pagoRepository.findAllWithPrestamoAndEstudiante()
            .stream()
            .map(pagoMapper::toDTO)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PagoDTO> listarPorPrestamo(Long idPrestamo) {
        Objects.requireNonNull(idPrestamo, "El ID de préstamo no puede ser nulo");
        return pagoRepository.findByPrestamoId(idPrestamo)
            .stream()
            .map(pagoMapper::toDTO)
            .toList();
    }

    @Override
    @Transactional
    @SuppressWarnings("null")
    public PagoDTO registrarPago(PagoRequestDTO dto) {
        Objects.requireNonNull(dto, "Los datos de pago no pueden ser nulos");

        // 1. Bloqueo pesimista del préstamo para evitar condiciones de carrera y pérdida de actualizaciones
        Prestamo prestamo = prestamoRepository.findByIdForUpdate(dto.getIdPrestamo())
            .orElseThrow(() -> new ResourceNotFoundException("Préstamo con ID " + dto.getIdPrestamo() + " no encontrado"));

        if ("Anulado".equalsIgnoreCase(prestamo.getEstado())) {
            throw new BusinessRuleException("No se pueden registrar pagos a un préstamo anulado");
        }
        if ("Pagado".equalsIgnoreCase(prestamo.getEstado())) {
            throw new BusinessRuleException("El préstamo ya se encuentra totalmente pagado");
        }

        // 2. Resolver la cuota correspondiente por (id_prestamo, cuota_numero)
        Cuota cuota = cuotaRepository.findByPrestamoIdAndNumeroCuota(prestamo.getIdPrestamo(), dto.getCuotaNumero())
            .orElseThrow(() -> new BusinessRuleException("La cuota número " + dto.getCuotaNumero() + " no existe para el préstamo ID " + prestamo.getIdPrestamo()));

        // 3. Validaciones de la cuota
        if ("Pagada".equalsIgnoreCase(cuota.getEstado())) {
            throw new BusinessRuleException("La cuota número " + dto.getCuotaNumero() + " ya se encuentra pagada");
        }
        if ("Anulada".equalsIgnoreCase(cuota.getEstado())) {
            throw new BusinessRuleException("La cuota número " + dto.getCuotaNumero() + " se encuentra anulada");
        }

        // Calcular lo acumulado previamente de pagos no anulados de esa cuota
        List<Pago> pagosPrevios = pagoRepository.findByPrestamoId(prestamo.getIdPrestamo());
        BigDecimal acumuladoPrevio = pagosPrevios.stream()
            .filter(p -> (p.getCuota() != null && Objects.equals(p.getCuota().getIdCuota(), cuota.getIdCuota())) ||
                         (p.getCuota() == null && Objects.equals(p.getCuotaNumero(), cuota.getNumeroCuota())))
            .filter(p -> !"ANULADO".equalsIgnoreCase(p.getEstado()))
            .map(Pago::getMonto)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendienteCuota = cuota.getMonto().subtract(acumuladoPrevio);
        if (pendienteCuota.compareTo(BigDecimal.ZERO) < 0) {
            pendienteCuota = BigDecimal.ZERO;
        }

        if (dto.getMonto().compareTo(pendienteCuota) > 0) {
            throw new BusinessRuleException("El monto a pagar (S/. " + dto.getMonto() + ") supera el saldo pendiente de la cuota (S/. " + pendienteCuota + ")");
        }

        if (dto.getMonto().compareTo(prestamo.getSaldo()) > 0) {
            throw new BusinessRuleException("El monto a pagar (S/. " + dto.getMonto() + ") supera el saldo total del préstamo (S/. " + prestamo.getSaldo() + ")");
        }

        // 4. Guardar el pago asociado a su cuota
        Pago nuevoPago = Pago.builder()
            .prestamo(prestamo)
            .cuota(cuota)
            .monto(dto.getMonto())
            .cuotaNumero(dto.getCuotaNumero())
            .metodoPago(dto.getMetodoPago().trim().toUpperCase())
            .fechaPago(LocalDate.now())
            .estado("REGISTRADO")
            .build();

        Pago pagoGuardado = pagoRepository.save(nuevoPago);

        // 5. Marcar cuota "Pagada" cuando lo acumulado cubre su monto (tolerancia 0.01)
        BigDecimal nuevoAcumulado = acumuladoPrevio.add(dto.getMonto());
        if (nuevoAcumulado.compareTo(cuota.getMonto().subtract(new BigDecimal("0.01"))) >= 0) {
            cuota.setEstado("Pagada");
            cuotaRepository.save(cuota);
        }

        // 6. Actualizar saldo del préstamo = max(saldo - monto, 0)
        BigDecimal nuevoSaldo = prestamo.getSaldo().subtract(dto.getMonto());
        if (nuevoSaldo.compareTo(BigDecimal.ZERO) <= 0) {
            nuevoSaldo = BigDecimal.ZERO;
            prestamo.setSaldo(nuevoSaldo);
            prestamo.setEstado("Pagado");
            prestamo.setDiasMora(0);
            prestamo.setInteresMora(BigDecimal.ZERO);

            // Marcar todas las cuotas restantes como Pagada
            List<Cuota> todasCuotas = cuotaRepository.findByPrestamoIdOrderByNumeroCuotaAsc(prestamo.getIdPrestamo());
            for (Cuota c : todasCuotas) {
                if (!"Pagada".equalsIgnoreCase(c.getEstado())) {
                    c.setEstado("Pagada");
                    cuotaRepository.save(c);
                }
            }
        } else {
            prestamo.setSaldo(nuevoSaldo);
            recalcularDiasMoraYEstado(prestamo);
        }

        prestamoRepository.save(prestamo);

        // 7. Registrar evento en historial de crédito
        historialCreditoRepository.save(HistorialCredito.builder()
            .estudiante(prestamo.getEstudiante())
            .prestamo(prestamo)
            .evento("PAGO_CUOTA_" + dto.getCuotaNumero())
            .fecha(LocalDate.now())
            .saldo(prestamo.getSaldo())
            .build());

        return pagoMapper.toDTO(pagoGuardado);
    }

    @Override
    @Transactional
    @SuppressWarnings("null")
    public PagoDTO anular(Long idPago) {
        Objects.requireNonNull(idPago, "El ID de pago no puede ser nulo");
        Pago pago = pagoRepository.findById(idPago)
            .orElseThrow(() -> new ResourceNotFoundException("Pago con ID " + idPago + " no encontrado"));

        if ("ANULADO".equalsIgnoreCase(pago.getEstado())) {
            throw new BusinessRuleException("El pago ya se encuentra anulado");
        }

        Prestamo prestamo = prestamoRepository.findByIdForUpdate(pago.getPrestamo().getIdPrestamo())
            .orElseThrow(() -> new ResourceNotFoundException("Préstamo asociado no encontrado"));

        pago.setEstado("ANULADO");
        pagoRepository.save(pago);

        // Devolver monto al saldo del préstamo
        prestamo.setSaldo(prestamo.getSaldo().add(pago.getMonto()));
        if ("Pagado".equalsIgnoreCase(prestamo.getEstado())) {
            prestamo.setEstado("Activo");
        }

        // Reabrir la cuota si corresponde
        Cuota cuota = pago.getCuota();
        if (cuota != null) {
            List<Pago> pagosRestantes = pagoRepository.findByPrestamoId(prestamo.getIdPrestamo());
            BigDecimal pagadoCuota = pagosRestantes.stream()
                .filter(p -> p.getCuota() != null && Objects.equals(p.getCuota().getIdCuota(), cuota.getIdCuota()))
                .filter(p -> !"ANULADO".equalsIgnoreCase(p.getEstado()))
                .map(Pago::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (pagadoCuota.compareTo(cuota.getMonto().subtract(new BigDecimal("0.01"))) < 0) {
                if (cuota.getFechaVencimiento().isBefore(LocalDate.now())) {
                    cuota.setEstado("Vencida");
                } else {
                    cuota.setEstado("Pendiente");
                }
                cuotaRepository.save(cuota);
            }
        }

        recalcularDiasMoraYEstado(prestamo);
        prestamoRepository.save(prestamo);

        // Registrar anulación en historial crediticio
        historialCreditoRepository.save(HistorialCredito.builder()
            .estudiante(prestamo.getEstudiante())
            .prestamo(prestamo)
            .evento("ANULACION_PAGO_" + idPago)
            .fecha(LocalDate.now())
            .saldo(prestamo.getSaldo())
            .build());

        return pagoMapper.toDTO(pago);
    }

    private void recalcularDiasMoraYEstado(Prestamo prestamo) {
        LocalDate hoy = LocalDate.now();
        List<Cuota> cuotas = cuotaRepository.findByPrestamoIdOrderByNumeroCuotaAsc(prestamo.getIdPrestamo());

        int maxDiasMora = 0;
        for (Cuota c : cuotas) {
            if ("Pagada".equalsIgnoreCase(c.getEstado()) || "Anulada".equalsIgnoreCase(c.getEstado())) {
                continue;
            }
            if (c.getFechaVencimiento().isBefore(hoy)) {
                int dias = (int) ChronoUnit.DAYS.between(c.getFechaVencimiento(), hoy);
                if (dias > maxDiasMora) {
                    maxDiasMora = dias;
                }
            }
        }
        prestamo.setDiasMora(maxDiasMora);

        moraService.evaluarRiesgoTemprano(prestamo);
    }
}
