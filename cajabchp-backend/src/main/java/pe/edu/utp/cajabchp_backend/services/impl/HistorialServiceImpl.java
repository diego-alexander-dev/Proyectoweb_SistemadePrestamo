package pe.edu.utp.cajabchp_backend.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utp.cajabchp_backend.dtos.CuotaMoraDetalleDTO;
import pe.edu.utp.cajabchp_backend.dtos.HistorialEstudianteResponseDTO;
import pe.edu.utp.cajabchp_backend.dtos.HistorialEventoDTO;
import pe.edu.utp.cajabchp_backend.exception.ResourceNotFoundException;
import pe.edu.utp.cajabchp_backend.models.Cuota;
import pe.edu.utp.cajabchp_backend.models.Estudiante;
import pe.edu.utp.cajabchp_backend.models.Mora;
import pe.edu.utp.cajabchp_backend.models.Prestamo;
import pe.edu.utp.cajabchp_backend.repositories.*;
import pe.edu.utp.cajabchp_backend.services.HistorialService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class HistorialServiceImpl implements HistorialService {

    private final EstudianteRepository estudianteRepository;
    private final HistorialCreditoRepository historialCreditoRepository;
    private final PrestamoRepository prestamoRepository;
    private final CuotaRepository cuotaRepository;
    private final MoraRepository moraRepository;

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public HistorialEstudianteResponseDTO obtenerHistorialEstudiante(Long idEstudiante) {
        Objects.requireNonNull(idEstudiante, "El ID de estudiante no puede ser nulo");
        Estudiante estudiante = estudianteRepository.findById(idEstudiante)
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante con ID " + idEstudiante + " no encontrado"));

        List<HistorialEventoDTO> eventos = historialCreditoRepository.findByEstudianteIdOrderByFechaDesc(idEstudiante)
            .stream()
            .map(h -> HistorialEventoDTO.builder()
                .idHistorial(h.getIdHistorial())
                .idPrestamo(h.getPrestamo() != null ? h.getPrestamo().getIdPrestamo() : null)
                .evento(h.getEvento())
                .fecha(h.getFecha())
                .saldo(h.getSaldo())
                .build())
            .toList();

        List<Prestamo> prestamos = prestamoRepository.findByEstudianteId(idEstudiante);
        BigDecimal saldoTotalDeuda = prestamos.stream()
            .filter(p -> "Activo".equalsIgnoreCase(p.getEstado()) || "Riesgo Temprano".equalsIgnoreCase(p.getEstado()))
            .map(Prestamo::getSaldo)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDate hoy = LocalDate.now();
        List<CuotaMoraDetalleDTO> cuotasVencidas = new ArrayList<>();

        for (Prestamo p : prestamos) {
            if ("Pagado".equalsIgnoreCase(p.getEstado()) || "Anulado".equalsIgnoreCase(p.getEstado())) {
                continue;
            }
            List<Cuota> cuotas = cuotaRepository.findByPrestamoIdOrderByNumeroCuotaAsc(p.getIdPrestamo());
            for (Cuota c : cuotas) {
                if ("Vencida".equalsIgnoreCase(c.getEstado()) || ("Pendiente".equalsIgnoreCase(c.getEstado()) && c.getFechaVencimiento().isBefore(hoy))) {
                    int dias = (int) ChronoUnit.DAYS.between(c.getFechaVencimiento(), hoy);
                    Optional<Mora> m = moraRepository.findByCuotaIdCuota(c.getIdCuota());
                    BigDecimal montoMora = m.map(Mora::getMontoMora).orElse(BigDecimal.ZERO);

                    cuotasVencidas.add(CuotaMoraDetalleDTO.builder()
                        .idCuota(c.getIdCuota())
                        .numeroCuota(c.getNumeroCuota())
                        .fechaVencimiento(c.getFechaVencimiento())
                        .montoCuota(c.getMonto())
                        .diasMora(dias)
                        .montoMora(montoMora)
                        .build());
                }
            }
        }

        return HistorialEstudianteResponseDTO.builder()
            .idEstudiante(estudiante.getIdEstudiante())
            .dni(estudiante.getDni())
            .nombreCompleto((estudiante.getNombre() + " " + estudiante.getApellido()).trim())
            .saldoTotalDeuda(saldoTotalDeuda)
            .eventos(eventos)
            .cuotasVencidas(cuotasVencidas)
            .build();
    }
}
