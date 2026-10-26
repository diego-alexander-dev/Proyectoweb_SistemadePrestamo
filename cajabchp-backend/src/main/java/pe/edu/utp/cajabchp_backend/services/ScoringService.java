package pe.edu.utp.cajabchp_backend.services;

import pe.edu.utp.cajabchp_backend.dtos.ScoringResponseDTO;

import java.math.BigDecimal;

public interface ScoringService {

    ScoringResponseDTO evaluarEstudiante(Long idEstudiante);

    BigDecimal calcularTasaDinamica(BigDecimal promedioNotas);
}
