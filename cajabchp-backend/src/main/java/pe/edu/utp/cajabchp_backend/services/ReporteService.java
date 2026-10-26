package pe.edu.utp.cajabchp_backend.services;

import pe.edu.utp.cajabchp_backend.dtos.ReporteMorosidadDTO;

public interface ReporteService {

    ReporteMorosidadDTO generarReporteMorosidad();

    byte[] exportarReporteMorosidadCsv();
}
