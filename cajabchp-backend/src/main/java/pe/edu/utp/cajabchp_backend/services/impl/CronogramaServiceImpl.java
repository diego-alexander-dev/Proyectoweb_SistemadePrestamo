package pe.edu.utp.cajabchp_backend.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utp.cajabchp_backend.dtos.CronogramaPreviewRequestDTO;
import pe.edu.utp.cajabchp_backend.dtos.CuotaDTO;
import pe.edu.utp.cajabchp_backend.exception.ResourceNotFoundException;
import pe.edu.utp.cajabchp_backend.models.Cuota;
import pe.edu.utp.cajabchp_backend.models.Mora;
import pe.edu.utp.cajabchp_backend.models.Pago;
import pe.edu.utp.cajabchp_backend.models.Prestamo;
import pe.edu.utp.cajabchp_backend.repositories.CuotaRepository;
import pe.edu.utp.cajabchp_backend.repositories.MoraRepository;
import pe.edu.utp.cajabchp_backend.repositories.PagoRepository;
import pe.edu.utp.cajabchp_backend.repositories.PrestamoRepository;
import pe.edu.utp.cajabchp_backend.services.CronogramaService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CronogramaServiceImpl implements CronogramaService {

    private final CuotaRepository cuotaRepository;
    private final PrestamoRepository prestamoRepository;
    private final PagoRepository pagoRepository;
    private final MoraRepository moraRepository;

    @Override
    @Transactional
    public List<Cuota> generarCuotas(Prestamo prestamo) {
        Objects.requireNonNull(prestamo, "El préstamo no puede ser nulo");
        int numCuotas = prestamo.getCuotas();
        BigDecimal monto = prestamo.getMonto();
        BigDecimal tasa = prestamo.getTasaInteres();
        LocalDate fechaInicio = prestamo.getFechaInicio() != null ? prestamo.getFechaInicio() : LocalDate.now();

        BigDecimal factor = BigDecimal.ONE.add(tasa.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP));
        BigDecimal totalEsperado = monto.multiply(factor).setScale(2, RoundingMode.HALF_UP);
        BigDecimal cuotaBase = totalEsperado.divide(new BigDecimal(numCuotas), 2, RoundingMode.HALF_UP);
        BigDecimal acumulado = BigDecimal.ZERO;

        List<Cuota> cuotas = new ArrayList<>();

        for (int k = 1; k <= numCuotas; k++) {
            BigDecimal cuotaMonto;
            if (k == numCuotas) {
                cuotaMonto = totalEsperado.subtract(acumulado);
            } else {
                cuotaMonto = cuotaBase;
                acumulado = acumulado.add(cuotaMonto);
            }

            LocalDate fechaVencimiento = fechaInicio.plusMonths(k);

            Cuota cuota = Cuota.builder()
                .prestamo(prestamo)
                .numeroCuota(k)
                .fechaVencimiento(fechaVencimiento)
                .monto(cuotaMonto)
                .estado("Pendiente")
                .build();

            cuotas.add(cuota);
        }

        return cuotaRepository.saveAll(cuotas);
    }

    @Override
    public List<CuotaDTO> preview(CronogramaPreviewRequestDTO request) {
        Objects.requireNonNull(request, "Los datos de la vista previa no pueden ser nulos");
        int numCuotas = request.getCuotas();
        BigDecimal monto = request.getMonto();
        BigDecimal tasa = request.getTasaInteres();
        LocalDate fechaInicio = request.getFechaInicio() != null ? request.getFechaInicio() : LocalDate.now();

        BigDecimal factor = BigDecimal.ONE.add(tasa.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP));
        BigDecimal totalEsperado = monto.multiply(factor).setScale(2, RoundingMode.HALF_UP);
        BigDecimal cuotaBase = totalEsperado.divide(new BigDecimal(numCuotas), 2, RoundingMode.HALF_UP);
        BigDecimal acumulado = BigDecimal.ZERO;

        List<CuotaDTO> lista = new ArrayList<>();

        for (int k = 1; k <= numCuotas; k++) {
            BigDecimal cuotaMonto;
            if (k == numCuotas) {
                cuotaMonto = totalEsperado.subtract(acumulado);
            } else {
                cuotaMonto = cuotaBase;
                acumulado = acumulado.add(cuotaMonto);
            }

            LocalDate fechaVencimiento = fechaInicio.plusMonths(k);

            CuotaDTO dto = CuotaDTO.builder()
                .numeroCuota(k)
                .fechaVencimiento(fechaVencimiento)
                .monto(cuotaMonto)
                .estado("Pendiente")
                .pagado(BigDecimal.ZERO)
                .pendiente(cuotaMonto)
                .diasMora(0)
                .montoMora(BigDecimal.ZERO)
                .build();

            lista.add(dto);
        }

        return lista;
    }

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public List<CuotaDTO> listarCuotasPorPrestamo(Long idPrestamo) {
        Objects.requireNonNull(idPrestamo, "El ID de préstamo no puede ser nulo");
        if (!prestamoRepository.existsById(idPrestamo)) {
            throw new ResourceNotFoundException("Préstamo con ID " + idPrestamo + " no encontrado");
        }

        List<Cuota> cuotas = cuotaRepository.findByPrestamoIdOrderByNumeroCuotaAsc(idPrestamo);
        List<Pago> pagos = pagoRepository.findByPrestamoId(idPrestamo);

        return cuotas.stream().map(c -> {
            BigDecimal pagado = pagos.stream()
                .filter(p -> (p.getCuota() != null && Objects.equals(p.getCuota().getIdCuota(), c.getIdCuota())) ||
                             (p.getCuota() == null && Objects.equals(p.getCuotaNumero(), c.getNumeroCuota())))
                .filter(p -> !"ANULADO".equalsIgnoreCase(p.getEstado()))
                .map(Pago::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal pendiente = c.getMonto().subtract(pagado);
            if (pendiente.compareTo(BigDecimal.ZERO) < 0) {
                pendiente = BigDecimal.ZERO;
            }

            Optional<Mora> moraOpt = moraRepository.findByCuotaIdCuota(c.getIdCuota());
            int diasMora = moraOpt.map(Mora::getDiasMora).orElse(0);
            BigDecimal montoMora = moraOpt.map(Mora::getMontoMora).orElse(BigDecimal.ZERO);

            return CuotaDTO.builder()
                .idCuota(c.getIdCuota())
                .numeroCuota(c.getNumeroCuota())
                .fechaVencimiento(c.getFechaVencimiento())
                .monto(c.getMonto())
                .estado(c.getEstado())
                .pagado(pagado)
                .pendiente(pendiente)
                .diasMora(diasMora)
                .montoMora(montoMora)
                .build();
        }).toList();
    }
}
