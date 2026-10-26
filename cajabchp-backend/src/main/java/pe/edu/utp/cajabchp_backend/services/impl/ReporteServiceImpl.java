package pe.edu.utp.cajabchp_backend.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utp.cajabchp_backend.dtos.PrestamoDTO;
import pe.edu.utp.cajabchp_backend.dtos.ReporteMorosidadDTO;
import pe.edu.utp.cajabchp_backend.dtos.TramoMorosidadDTO;
import pe.edu.utp.cajabchp_backend.mappers.PrestamoMapper;
import pe.edu.utp.cajabchp_backend.models.Prestamo;
import pe.edu.utp.cajabchp_backend.models.Reporte;
import pe.edu.utp.cajabchp_backend.repositories.PrestamoRepository;
import pe.edu.utp.cajabchp_backend.repositories.ReporteRepository;
import pe.edu.utp.cajabchp_backend.security.UserContext;
import pe.edu.utp.cajabchp_backend.services.ReporteService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReporteServiceImpl implements ReporteService {

    private final PrestamoRepository prestamoRepository;
    private final ReporteRepository reporteRepository;
    private final PrestamoMapper prestamoMapper;

    @Override
    @Transactional
    public ReporteMorosidadDTO generarReporteMorosidad() {
        List<Prestamo> prestamosVigentes = prestamoRepository.findByEstadoIn(List.of("Activo", "Riesgo Temprano"));

        long totalVigentes = prestamosVigentes.size();
        long enMora = 0;
        BigDecimal montoTotalMora = BigDecimal.ZERO;
        BigDecimal saldoTotalMora = BigDecimal.ZERO;

        // Tramos: AL DIA (0), VENCIDO (1-15), MOROSO (16-30), CRITICO (>30)
        long countAlDia = 0, countVencido = 0, countMoroso = 0, countCritico = 0;
        BigDecimal saldoAlDia = BigDecimal.ZERO, saldoVencido = BigDecimal.ZERO, saldoMoroso = BigDecimal.ZERO, saldoCritico = BigDecimal.ZERO;
        BigDecimal moraAlDia = BigDecimal.ZERO, moraVencido = BigDecimal.ZERO, moraMoroso = BigDecimal.ZERO, moraCritico = BigDecimal.ZERO;

        List<PrestamoDTO> prestamosDTO = new ArrayList<>();

        for (Prestamo p : prestamosVigentes) {
            prestamosDTO.add(prestamoMapper.toDTO(p));
            int dias = p.getDiasMora() != null ? p.getDiasMora() : 0;
            BigDecimal saldo = p.getSaldo() != null ? p.getSaldo() : BigDecimal.ZERO;
            BigDecimal mora = p.getInteresMora() != null ? p.getInteresMora() : BigDecimal.ZERO;

            if (dias > 0) {
                enMora++;
                montoTotalMora = montoTotalMora.add(mora);
                saldoTotalMora = saldoTotalMora.add(saldo);
            }

            if (dias == 0) {
                countAlDia++;
                saldoAlDia = saldoAlDia.add(saldo);
                moraAlDia = moraAlDia.add(mora);
            } else if (dias <= 15) {
                countVencido++;
                saldoVencido = saldoVencido.add(saldo);
                moraVencido = moraVencido.add(mora);
            } else if (dias <= 30) {
                countMoroso++;
                saldoMoroso = saldoMoroso.add(saldo);
                moraMoroso = moraMoroso.add(mora);
            } else {
                countCritico++;
                saldoCritico = saldoCritico.add(saldo);
                moraCritico = moraCritico.add(mora);
            }
        }

        BigDecimal porcentaje = BigDecimal.ZERO;
        if (totalVigentes > 0) {
            porcentaje = new BigDecimal(enMora)
                .multiply(new BigDecimal("100"))
                .divide(new BigDecimal(totalVigentes), 2, RoundingMode.HALF_UP);
        }

        List<TramoMorosidadDTO> tramos = List.of(
            TramoMorosidadDTO.builder().categoria("AL DIA").rangoDias("0 días").cantidadPrestamos(countAlDia).montoSaldo(saldoAlDia).montoMora(moraAlDia).build(),
            TramoMorosidadDTO.builder().categoria("VENCIDO").rangoDias("1 - 15 días").cantidadPrestamos(countVencido).montoSaldo(saldoVencido).montoMora(moraVencido).build(),
            TramoMorosidadDTO.builder().categoria("MOROSO").rangoDias("16 - 30 días").cantidadPrestamos(countMoroso).montoSaldo(saldoMoroso).montoMora(moraMoroso).build(),
            TramoMorosidadDTO.builder().categoria("CRITICO").rangoDias("> 30 días").cantidadPrestamos(countCritico).montoSaldo(saldoCritico).montoMora(moraCritico).build()
        );

        String usuario = UserContext.getUsuario();
        Reporte reporte = Reporte.builder()
            .tipoReporte("REPORTE_MOROSIDAD_JSON")
            .usuario(usuario)
            .fechaGeneracion(LocalDate.now())
            .descripcion(String.format("Reporte generado por %s: %d vigentes, %d en mora (%s%%)",
                usuario, totalVigentes, enMora, porcentaje))
            .build();
        reporteRepository.save(reporte);

        return ReporteMorosidadDTO.builder()
            .prestamosVigentes(totalVigentes)
            .prestamosEnMora(enMora)
            .porcentajeMorosidad(porcentaje)
            .montoTotalMora(montoTotalMora)
            .saldoTotalMora(saldoTotalMora)
            .tramos(tramos)
            .prestamos(prestamosDTO)
            .build();
    }

    @Override
    @Transactional
    public byte[] exportarReporteMorosidadCsv() {
        ReporteMorosidadDTO data = generarReporteMorosidad();

        StringBuilder sb = new StringBuilder();
        // BOM UTF-8 para compatibilidad absoluta con Microsoft Excel
        sb.append('\uFEFF');

        sb.append("ID Prestamo,DNI,Estudiante,Monto,Saldo,Tasa %,Cuotas,Dias Mora,Interes Mora,Estado,Nivel Riesgo\n");

        for (PrestamoDTO p : data.getPrestamos()) {
            int dias = p.getDiasMora() != null ? p.getDiasMora() : 0;
            BigDecimal saldo = p.getSaldo() != null ? p.getSaldo() : BigDecimal.ZERO;

            String riesgo;
            if (dias == 0) riesgo = "BAJO";
            else if (dias <= 15 && saldo.compareTo(new BigDecimal("2000")) < 0) riesgo = "MEDIO";
            else if (dias <= 30) riesgo = "ALTO";
            else riesgo = "CRITICO";

            sb.append(String.format("\"P-%03d\",\"%s\",\"%s\",%.2f,%.2f,%.2f,%d,%d,%.2f,\"%s\",\"%s\"\n",
                p.getIdPrestamo(),
                p.getDni() != null ? p.getDni() : "",
                p.getEstudianteNombre() != null ? p.getEstudianteNombre() : "",
                p.getMonto() != null ? p.getMonto() : BigDecimal.ZERO,
                saldo,
                p.getTasaInteres() != null ? p.getTasaInteres() : BigDecimal.ZERO,
                p.getCuotas() != null ? p.getCuotas() : 0,
                dias,
                p.getInteresMora() != null ? p.getInteresMora() : BigDecimal.ZERO,
                p.getEstado() != null ? p.getEstado() : "",
                riesgo
            ));
        }

        String usuario = UserContext.getUsuario();
        Reporte reporte = Reporte.builder()
            .tipoReporte("REPORTE_MOROSIDAD_CSV")
            .usuario(usuario)
            .fechaGeneracion(LocalDate.now())
            .descripcion("Exportación CSV descargada por " + usuario)
            .build();
        reporteRepository.save(reporte);

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }
}
