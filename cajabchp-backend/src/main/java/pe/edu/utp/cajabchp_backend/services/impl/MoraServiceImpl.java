package pe.edu.utp.cajabchp_backend.services.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utp.cajabchp_backend.dtos.AplicarMoraResponseDTO;
import pe.edu.utp.cajabchp_backend.dtos.CuotaMoraDetalleDTO;
import pe.edu.utp.cajabchp_backend.dtos.MoraPreviewDTO;
import pe.edu.utp.cajabchp_backend.dtos.MoraProcesarResponseDTO;
import pe.edu.utp.cajabchp_backend.exception.BusinessRuleException;
import pe.edu.utp.cajabchp_backend.exception.ResourceNotFoundException;
import pe.edu.utp.cajabchp_backend.mappers.PrestamoMapper;
import pe.edu.utp.cajabchp_backend.models.*;
import pe.edu.utp.cajabchp_backend.repositories.*;
import pe.edu.utp.cajabchp_backend.services.ConfiguracionService;
import pe.edu.utp.cajabchp_backend.services.MoraService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MoraServiceImpl implements MoraService {

    private final PrestamoRepository prestamoRepository;
    private final CuotaRepository cuotaRepository;
    private final MoraRepository moraRepository;
    private final HistorialCreditoRepository historialCreditoRepository;
    private final ReporteRepository reporteRepository;
    private final ConfiguracionService configuracionService;
    private final PrestamoMapper prestamoMapper;

    @Value("${bchp.mora.job.enabled:false}")
    private boolean moraJobEnabled;

    @Scheduled(cron = "${bchp.mora.cron:0 0 0 * * *}")
    public void tareaProgramadaMoraDiaria() {
        if (!moraJobEnabled) {
            log.debug("Tarea automática de morosidad desactivada (bchp.mora.job.enabled=false)");
            return;
        }
        log.info("Iniciando ejecución programada automática de morosidad...");
        procesarMoraGeneral();
    }

    @Override
    @Transactional
    public MoraProcesarResponseDTO procesarMoraGeneral() {
        LocalDate hoy = LocalDate.now();
        List<Prestamo> prestamos = prestamoRepository.findByEstadoIn(List.of("Activo", "Riesgo Temprano"));

        long prestamosEnMora = 0;
        BigDecimal montoTotalMora = BigDecimal.ZERO;

        for (Prestamo prestamo : prestamos) {
            aplicarLogicaMoraPrestamo(prestamo, hoy);
            if (prestamo.getDiasMora() > 0) {
                prestamosEnMora++;
            }
            montoTotalMora = montoTotalMora.add(prestamo.getInteresMora());
        }

        long totalVigentes = prestamos.size();
        BigDecimal porcentaje = BigDecimal.ZERO;
        if (totalVigentes > 0) {
            porcentaje = new BigDecimal(prestamosEnMora)
                .multiply(new BigDecimal("100"))
                .divide(new BigDecimal(totalVigentes), 2, RoundingMode.HALF_UP);
        }

        String descripcion = String.format("Préstamos en mora: %d, Monto en mora: S/. %s, Porcentaje: %s%%",
            prestamosEnMora, montoTotalMora.toPlainString(), porcentaje.toPlainString());

        Reporte reporte = Reporte.builder()
            .tipoReporte("MOROSIDAD_AUTO")
            .usuario("sistema")
            .fechaGeneracion(hoy)
            .descripcion(descripcion)
            .build();
        reporteRepository.save(reporte);

        return MoraProcesarResponseDTO.builder()
            .prestamosEnMora(prestamosEnMora)
            .montoEnMora(montoTotalMora)
            .porcentaje(porcentaje)
            .resumen(descripcion)
            .build();
    }

    @Override
    @Transactional
    public AplicarMoraResponseDTO aplicarMoraPrestamo(Long idPrestamo) {
        Objects.requireNonNull(idPrestamo, "El ID de préstamo no puede ser nulo");
        Prestamo prestamo = prestamoRepository.findById(idPrestamo)
            .orElseThrow(() -> new ResourceNotFoundException("Préstamo con ID " + idPrestamo + " no encontrado"));

        if (!"Activo".equalsIgnoreCase(prestamo.getEstado()) && !"Riesgo Temprano".equalsIgnoreCase(prestamo.getEstado())) {
            throw new BusinessRuleException("Solo se puede aplicar mora a préstamos con estado Activo o Riesgo Temprano");
        }

        LocalDate hoy = LocalDate.now();
        ResultadoMoraPrestamo res = aplicarLogicaMoraPrestamo(prestamo, hoy);

        if (res.cuotasAfectadas == 0 && res.montoMoraAplicado.compareTo(BigDecimal.ZERO) == 0 && prestamo.getDiasMora() == 0) {
            throw new BusinessRuleException("El préstamo no tiene cuotas vencidas");
        }

        return AplicarMoraResponseDTO.builder()
            .cuotasAfectadas(res.cuotasAfectadas)
            .montoMoraAplicado(res.montoMoraAplicado)
            .prestamo(prestamoMapper.toDTO(prestamo))
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public MoraPreviewDTO previewMoraPrestamo(Long idPrestamo) {
        Objects.requireNonNull(idPrestamo, "El ID de préstamo no puede ser nulo");
        Prestamo prestamo = prestamoRepository.findById(idPrestamo)
            .orElseThrow(() -> new ResourceNotFoundException("Préstamo con ID " + idPrestamo + " no encontrado"));

        LocalDate hoy = LocalDate.now();
        List<Cuota> cuotas = cuotaRepository.findByPrestamoIdOrderByNumeroCuotaAsc(idPrestamo);

        double promedioEstudiante = prestamo.getEstudiante() != null && prestamo.getEstudiante().getPromedioNotas() != null
            ? prestamo.getEstudiante().getPromedioNotas().doubleValue() : 0.0;
        double graciaPromedioMin = configuracionService.getValorBigDecimal("gracia_promedio_min", new BigDecimal("18")).doubleValue();
        int graciaDias = configuracionService.getValorInt("gracia_dias", 5);
        BigDecimal moraPorcentaje = configuracionService.getValorBigDecimal("mora_porcentaje", new BigDecimal("2"));

        List<CuotaMoraDetalleDTO> listaVencidas = new ArrayList<>();
        int maxDiasMora = 0;
        BigDecimal totalMoraEstimada = BigDecimal.ZERO;

        for (Cuota c : cuotas) {
            if ("Pagada".equalsIgnoreCase(c.getEstado()) || "Anulada".equalsIgnoreCase(c.getEstado())) {
                continue;
            }

            if (c.getFechaVencimiento().isBefore(hoy)) {
                int diasVencido = (int) ChronoUnit.DAYS.between(c.getFechaVencimiento(), hoy);
                if (diasVencido > maxDiasMora) {
                    maxDiasMora = diasVencido;
                }

                boolean enGracia = (promedioEstudiante >= graciaPromedioMin && diasVencido <= graciaDias);
                BigDecimal montoMoraCuota = BigDecimal.ZERO;

                if (!enGracia) {
                    // Si ya tiene mora registrada, leemos el monto registrado, si no, lo calculamos
                    Optional<Mora> moraExistente = moraRepository.findByCuotaIdCuota(c.getIdCuota());
                    if (moraExistente.isPresent()) {
                        montoMoraCuota = moraExistente.get().getMontoMora();
                    } else {
                        montoMoraCuota = c.getMonto().multiply(moraPorcentaje)
                            .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                    }
                }

                totalMoraEstimada = totalMoraEstimada.add(montoMoraCuota);

                listaVencidas.add(CuotaMoraDetalleDTO.builder()
                    .idCuota(c.getIdCuota())
                    .numeroCuota(c.getNumeroCuota())
                    .fechaVencimiento(c.getFechaVencimiento())
                    .montoCuota(c.getMonto())
                    .diasMora(diasVencido)
                    .montoMora(montoMoraCuota)
                    .build());
            }
        }

        return MoraPreviewDTO.builder()
            .idPrestamo(idPrestamo)
            .cuotasVencidas(listaVencidas)
            .totalDiasMora(maxDiasMora)
            .totalMoraEstimada(totalMoraEstimada)
            .build();
    }

    @Override
    public void evaluarRiesgoTemprano(Prestamo prestamo) {
        if (prestamo == null || "Pagado".equalsIgnoreCase(prestamo.getEstado()) || "Anulado".equalsIgnoreCase(prestamo.getEstado())) {
            return;
        }

        LocalDate manana = LocalDate.now().plusDays(1);
        boolean tieneCuotaManana = cuotaRepository.existsCuotaPendienteConVencimiento(prestamo.getIdPrestamo(), manana);

        if ("Activo".equalsIgnoreCase(prestamo.getEstado()) && tieneCuotaManana) {
            prestamo.setEstado("Riesgo Temprano");
        } else if ("Riesgo Temprano".equalsIgnoreCase(prestamo.getEstado()) && !tieneCuotaManana) {
            prestamo.setEstado("Activo");
        }
    }

    private ResultadoMoraPrestamo aplicarLogicaMoraPrestamo(Prestamo prestamo, LocalDate hoy) {
        List<Cuota> cuotas = cuotaRepository.findByPrestamoIdOrderByNumeroCuotaAsc(prestamo.getIdPrestamo());

        double promedioEstudiante = prestamo.getEstudiante() != null && prestamo.getEstudiante().getPromedioNotas() != null
            ? prestamo.getEstudiante().getPromedioNotas().doubleValue() : 0.0;
        double graciaPromedioMin = configuracionService.getValorBigDecimal("gracia_promedio_min", new BigDecimal("18")).doubleValue();
        int graciaDias = configuracionService.getValorInt("gracia_dias", 5);
        BigDecimal moraPorcentaje = configuracionService.getValorBigDecimal("mora_porcentaje", new BigDecimal("2"));

        int maxDiasMora = 0;
        int cuotasAfectadas = 0;
        BigDecimal montoMoraTotalAplicado = BigDecimal.ZERO;

        for (Cuota cuota : cuotas) {
            if ("Pagada".equalsIgnoreCase(cuota.getEstado()) || "Anulada".equalsIgnoreCase(cuota.getEstado())) {
                continue;
            }

            // a) Cuota "Pendiente" con vencimiento anterior a hoy -> "Vencida"
            if (cuota.getFechaVencimiento().isBefore(hoy)) {
                if ("Pendiente".equalsIgnoreCase(cuota.getEstado())) {
                    cuota.setEstado("Vencida");
                    cuotaRepository.save(cuota);
                }

                int diasVencido = (int) ChronoUnit.DAYS.between(cuota.getFechaVencimiento(), hoy);
                if (diasVencido > maxDiasMora) {
                    maxDiasMora = diasVencido;
                }

                // b) Periodo de gracia: si promedio >= 18, mora monetaria empieza pasados 5 días
                boolean aplicaMoraMonetaria = !(promedioEstudiante >= graciaPromedioMin && diasVencido <= graciaDias);

                if (aplicaMoraMonetaria) {
                    Optional<Mora> moraOpt = moraRepository.findByCuotaIdCuota(cuota.getIdCuota());
                    if (moraOpt.isEmpty()) {
                        // c) Primera vez que genera mora: se crea fila en mora y se suma UNA sola vez
                        BigDecimal montoMora = cuota.getMonto().multiply(moraPorcentaje)
                            .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

                        Mora nuevaMora = Mora.builder()
                            .cuota(cuota)
                            .diasMora(diasVencido)
                            .montoMora(montoMora)
                            .fecha(hoy)
                            .build();
                        moraRepository.save(nuevaMora);

                        cuota.setMonto(cuota.getMonto().add(montoMora));
                        cuotaRepository.save(cuota);

                        prestamo.setSaldo(prestamo.getSaldo().add(montoMora));
                        prestamo.setInteresMora(prestamo.getInteresMora().add(montoMora));

                        historialCreditoRepository.save(HistorialCredito.builder()
                            .estudiante(prestamo.getEstudiante())
                            .prestamo(prestamo)
                            .evento("RECARGO_MORA_CUOTA_" + cuota.getNumeroCuota())
                            .fecha(hoy)
                            .saldo(prestamo.getSaldo())
                            .build());

                        cuotasAfectadas++;
                        montoMoraTotalAplicado = montoMoraTotalAplicado.add(montoMora);
                    } else {
                        // Ya existe mora, solo actualizamos días de mora de manera idempotente
                        Mora moraExistente = moraOpt.get();
                        moraExistente.setDiasMora(diasVencido);
                        moraRepository.save(moraExistente);
                    }
                }
            }
        }

        prestamo.setDiasMora(maxDiasMora);

        // d) Riesgo Temprano
        evaluarRiesgoTemprano(prestamo);

        prestamoRepository.save(prestamo);

        return new ResultadoMoraPrestamo(cuotasAfectadas, montoMoraTotalAplicado);
    }

    private record ResultadoMoraPrestamo(int cuotasAfectadas, BigDecimal montoMoraAplicado) {}
}
