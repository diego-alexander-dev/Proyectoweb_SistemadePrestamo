package pe.edu.utp.cajabchp_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.utp.cajabchp_backend.dtos.ReporteMorosidadDTO;
import pe.edu.utp.cajabchp_backend.services.ReporteService;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;

    @GetMapping("/morosidad")
    public ResponseEntity<ReporteMorosidadDTO> obtenerReporteMorosidad() {
        return ResponseEntity.ok(reporteService.generarReporteMorosidad());
    }

    @GetMapping("/morosidad/export")
    public ResponseEntity<byte[]> exportarReporteMorosidadCsv() {
        byte[] csv = reporteService.exportarReporteMorosidadCsv();
        String fecha = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String filename = "reporte_morosidad_" + fecha + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .body(csv);
    }
}
