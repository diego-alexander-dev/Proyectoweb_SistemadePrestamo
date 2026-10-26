package pe.edu.utp.cajabchp_backend.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utp.cajabchp_backend.dtos.ScoringResponseDTO;
import pe.edu.utp.cajabchp_backend.exception.ResourceNotFoundException;
import pe.edu.utp.cajabchp_backend.models.Estudiante;
import pe.edu.utp.cajabchp_backend.models.Prestamo;
import pe.edu.utp.cajabchp_backend.repositories.EstudianteRepository;
import pe.edu.utp.cajabchp_backend.repositories.PrestamoRepository;
import pe.edu.utp.cajabchp_backend.services.ConfiguracionService;
import pe.edu.utp.cajabchp_backend.services.ScoringService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ScoringServiceImpl implements ScoringService {

    private final EstudianteRepository estudianteRepository;
    private final PrestamoRepository prestamoRepository;
    private final ConfiguracionService configuracionService;

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public ScoringResponseDTO evaluarEstudiante(Long idEstudiante) {
        Objects.requireNonNull(idEstudiante, "El ID de estudiante no puede ser nulo");
        Estudiante estudiante = estudianteRepository.findById(idEstudiante)
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante con ID " + idEstudiante + " no encontrado"));

        double prom = estudiante.getPromedioNotas() != null ? estudiante.getPromedioNotas().doubleValue() : 0.0;
        double asis = estudiante.getPorcentajeAsistencia() != null ? estudiante.getPorcentajeAsistencia().doubleValue() : 0.0;
        int ciclo = estudiante.getCicloActual() != null ? estudiante.getCicloActual() : 1;

        // Fórmula portada exactamente desde Solicitudes.jsx
        double ptsPromedio = (prom / 20.0) * 40.0;
        double ptsAsistencia = (asis / 100.0) * 40.0;
        double ptsCiclo = 0.0;
        if (ciclo >= 4 && ciclo <= 7) {
            ptsCiclo = 20.0;
        } else if (ciclo >= 1 && ciclo <= 3) {
            ptsCiclo = 15.0;
        } else if (ciclo >= 8 && ciclo <= 10) {
            ptsCiclo = 10.0;
        }

        int scoreTotal = (int) Math.round(ptsPromedio + ptsAsistencia + ptsCiclo);

        String dictamen;
        if (scoreTotal >= 80) {
            dictamen = "EXCELENTE";
        } else if (scoreTotal >= 60) {
            dictamen = "ACEPTABLE";
        } else {
            dictamen = "CRÍTICO";
        }

        // Deuda vigente: suma de saldos de préstamos Activo y Riesgo Temprano
        List<Prestamo> prestamos = prestamoRepository.findByEstudianteId(idEstudiante);
        BigDecimal deudaVigente = prestamos.stream()
            .filter(p -> "Activo".equalsIgnoreCase(p.getEstado()) || "Riesgo Temprano".equalsIgnoreCase(p.getEstado()))
            .map(Prestamo::getSaldo)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal tasaSugerida = calcularTasaDinamica(estudiante.getPromedioNotas());

        return ScoringResponseDTO.builder()
            .score(scoreTotal)
            .dictamen(dictamen)
            .tasaSugerida(tasaSugerida)
            .deudaVigente(deudaVigente)
            .promedio(estudiante.getPromedioNotas())
            .asistencia(estudiante.getPorcentajeAsistencia())
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calcularTasaDinamica(BigDecimal promedioNotas) {
        BigDecimal prom = promedioNotas != null ? promedioNotas : BigDecimal.ZERO;
        BigDecimal promedioExcelencia = configuracionService.getValorBigDecimal("promedio_excelencia", new BigDecimal("16"));
        BigDecimal tasaExcelencia = configuracionService.getValorBigDecimal("tasa_excelencia", new BigDecimal("8"));
        BigDecimal tasaBase = configuracionService.getValorBigDecimal("tasa_base", new BigDecimal("10"));

        if (prom.compareTo(promedioExcelencia) > 0) {
            return tasaExcelencia;
        }
        return tasaBase;
    }
}
