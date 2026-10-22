package pe.edu.utp.cajabchp_backend.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utp.cajabchp_backend.dtos.SolicitudDTO;
import pe.edu.utp.cajabchp_backend.dtos.SolicitudRequestDTO;
import pe.edu.utp.cajabchp_backend.dtos.SolicitudUpdateDTO;
import pe.edu.utp.cajabchp_backend.exception.BusinessRuleException;
import pe.edu.utp.cajabchp_backend.exception.ResourceNotFoundException;
import pe.edu.utp.cajabchp_backend.mappers.SolicitudMapper;
import pe.edu.utp.cajabchp_backend.models.Estudiante;
import pe.edu.utp.cajabchp_backend.models.Prestamo;
import pe.edu.utp.cajabchp_backend.models.Solicitud;
import pe.edu.utp.cajabchp_backend.repositories.EstudianteRepository;
import pe.edu.utp.cajabchp_backend.repositories.PrestamoRepository;
import pe.edu.utp.cajabchp_backend.repositories.SolicitudRepository;
import pe.edu.utp.cajabchp_backend.services.SolicitudService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class SolicitudServiceImpl implements SolicitudService {

    private final SolicitudRepository solicitudRepository;
    private final EstudianteRepository estudianteRepository;
    private final PrestamoRepository prestamoRepository;
    private final SolicitudMapper solicitudMapper;

    @Override
    @Transactional(readOnly = true)
    public List<SolicitudDTO> listarTodas() {
        return solicitudRepository.findAllWithEstudiante()
            .stream()
            .map(solicitudMapper::toDTO)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SolicitudDTO> listarPorEstado(String estado) {
        Objects.requireNonNull(estado, "El estado no puede ser nulo");
        return solicitudRepository.findByEstadoSolicitudWithEstudiante(estado.trim().toUpperCase())
            .stream()
            .map(solicitudMapper::toDTO)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SolicitudDTO obtenerPorId(Long id) {
        Objects.requireNonNull(id, "El ID de solicitud no puede ser nulo");
        Solicitud solicitud = solicitudRepository.findByIdWithEstudiante(id)
            .orElseThrow(() -> new ResourceNotFoundException("Solicitud con ID " + id + " no encontrada"));
        return solicitudMapper.toDTO(solicitud);
    }

    @Override
    @Transactional
    public SolicitudDTO registrar(SolicitudRequestDTO dto) {
        Objects.requireNonNull(dto, "Los datos de la solicitud no pueden ser nulos");

        Estudiante estudiante = estudianteRepository.findById(dto.getIdEstudiante())
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante ID " + dto.getIdEstudiante() + " no encontrado"));

        if ("RETIRADO".equalsIgnoreCase(estudiante.getEstadoUniversidad())) {
            throw new BusinessRuleException("No se pueden recibir solicitudes de alumnos con estado universitario RETIRADO");
        }

        String recomendacion = calcularRecomendacionCrediticia(estudiante);
        Solicitud nueva = solicitudMapper.toEntity(dto, estudiante, recomendacion);
        Solicitud guardada = solicitudRepository.save(nueva);
        return solicitudMapper.toDTO(guardada);
    }

    @Override
    @Transactional
    public SolicitudDTO actualizarEstado(Long id, SolicitudUpdateDTO dto) {
        Objects.requireNonNull(id, "El ID de solicitud no puede ser nulo");
        Objects.requireNonNull(dto, "Los datos de actualización no pueden ser nulos");

        Solicitud solicitud = solicitudRepository.findByIdWithEstudiante(id)
            .orElseThrow(() -> new ResourceNotFoundException("Solicitud con ID " + id + " no encontrada"));

        String nuevoEstado = dto.getEstadoSolicitud().trim().toUpperCase();
        String estadoAnterior = solicitud.getEstadoSolicitud();
        solicitud.setEstadoSolicitud(nuevoEstado);
        Solicitud actualizada = solicitudRepository.save(solicitud);

        // Si la solicitud pasa a estado APROBADO y antes no lo estaba, generar el préstamo activo automáticamente
        if ("APROBADO".equals(nuevoEstado) && !"APROBADO".equals(estadoAnterior)) {
            BigDecimal tasaInteres = new BigDecimal("10.00");
            BigDecimal factorInteres = BigDecimal.ONE.add(tasaInteres.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
            BigDecimal saldoCalculado = solicitud.getMontoSolicitado().multiply(factorInteres).setScale(2, RoundingMode.HALF_UP);

            Prestamo prestamoDesembolsado = Prestamo.builder()
                .estudiante(solicitud.getEstudiante())
                .monto(solicitud.getMontoSolicitado())
                .cuotas(solicitud.getCuotasSolicitadas())
                .tasaInteres(tasaInteres)
                .saldo(saldoCalculado)
                .estado("Activo")
                .fechaInicio(LocalDate.now())
                .diasMora(0)
                .interesMora(BigDecimal.ZERO)
                .build();

            prestamoRepository.save(prestamoDesembolsado);
        }

        return solicitudMapper.toDTO(actualizada);
    }

    private String calcularRecomendacionCrediticia(Estudiante e) {
        double promedio = e.getPromedioNotas() != null ? e.getPromedioNotas().doubleValue() : 0.0;
        double asistencia = e.getPorcentajeAsistencia() != null ? e.getPorcentajeAsistencia().doubleValue() : 0.0;

        if (promedio < 10.5) {
            return "NO APTO - PROMEDIO INSUFICIENTE";
        }
        if (asistencia < 70.0 || promedio < 12.0) {
            return "REVISAR - RIESGO ACADEMICO";
        }
        if (promedio >= 15.0 && asistencia >= 85.0) {
            return "APTO - ALTA PRIORIDAD";
        }
        return "APTO - PRIORIDAD MEDIA";
    }
}
