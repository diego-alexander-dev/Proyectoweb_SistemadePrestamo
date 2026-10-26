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
import pe.edu.utp.cajabchp_backend.models.HistorialCredito;
import pe.edu.utp.cajabchp_backend.models.Prestamo;
import pe.edu.utp.cajabchp_backend.models.Solicitud;
import pe.edu.utp.cajabchp_backend.repositories.EstudianteRepository;
import pe.edu.utp.cajabchp_backend.repositories.HistorialCreditoRepository;
import pe.edu.utp.cajabchp_backend.repositories.PrestamoRepository;
import pe.edu.utp.cajabchp_backend.repositories.SolicitudRepository;
import pe.edu.utp.cajabchp_backend.security.UserContext;
import pe.edu.utp.cajabchp_backend.services.CronogramaService;
import pe.edu.utp.cajabchp_backend.services.MoraService;
import pe.edu.utp.cajabchp_backend.services.ScoringService;
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
    private final HistorialCreditoRepository historialCreditoRepository;
    private final CronogramaService cronogramaService;
    private final ScoringService scoringService;
    private final MoraService moraService;
    private final SolicitudMapper solicitudMapper;

    private static final List<String> ESTADOS_VALIDOS = List.of("PENDIENTE", "APROBADO", "RECHAZADO", "ESCALADO");

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
        String estadoNormalizado = estado.trim().toUpperCase();
        return solicitudRepository.findByEstadoSolicitudWithEstudiante(estadoNormalizado)
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
        nueva.setAtendidoPor(UserContext.getUsuario());
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
        if (!ESTADOS_VALIDOS.contains(nuevoEstado)) {
            throw new BusinessRuleException("Estado de solicitud inválido: '" + nuevoEstado + "'. Los estados válidos son: PENDIENTE, APROBADO, RECHAZADO o ESCALADO");
        }

        // Una solicitud ya APROBADA no puede generar otro préstamo ni cambiar de estado
        if ("APROBADO".equalsIgnoreCase(solicitud.getEstadoSolicitud())) {
            throw new BusinessRuleException("La solicitud ya se encuentra APROBADA y no puede cambiar de estado ni generar otro préstamo");
        }

        String estadoAnterior = solicitud.getEstadoSolicitud();
        solicitud.setEstadoSolicitud(nuevoEstado);
        solicitud.setAtendidoPor(UserContext.getUsuario());

        // Si la solicitud pasa a estado APROBADO, validar que el estudiante no esté RETIRADO y generar el préstamo
        if ("APROBADO".equals(nuevoEstado) && !"APROBADO".equals(estadoAnterior)) {
            Estudiante estudiante = solicitud.getEstudiante();
            if ("RETIRADO".equalsIgnoreCase(estudiante.getEstadoUniversidad())) {
                throw new BusinessRuleException("No se puede aprobar la solicitud porque el estudiante está en estado RETIRADO");
            }

            // Tasa dinámica calculada por el servidor
            BigDecimal tasaDinamica = scoringService.calcularTasaDinamica(estudiante.getPromedioNotas());
            BigDecimal factorInteres = BigDecimal.ONE.add(tasaDinamica.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP));
            BigDecimal saldoCalculado = solicitud.getMontoSolicitado().multiply(factorInteres).setScale(2, RoundingMode.HALF_UP);

            Prestamo prestamoDesembolsado = Prestamo.builder()
                .estudiante(estudiante)
                .monto(solicitud.getMontoSolicitado())
                .cuotas(solicitud.getCuotasSolicitadas())
                .tasaInteres(tasaDinamica)
                .saldo(saldoCalculado)
                .estado("Activo")
                .fechaInicio(LocalDate.now())
                .diasMora(0)
                .interesMora(BigDecimal.ZERO)
                .build();

            Prestamo prestamoGuardado = prestamoRepository.save(prestamoDesembolsado);

            // Generar cuotas exactas
            cronogramaService.generarCuotas(prestamoGuardado);

            // Evaluar riesgo temprano
            moraService.evaluarRiesgoTemprano(prestamoGuardado);
            prestamoGuardado = prestamoRepository.save(prestamoGuardado);

            // Registrar desembolso en historial de crédito
            historialCreditoRepository.save(HistorialCredito.builder()
                .estudiante(estudiante)
                .prestamo(prestamoGuardado)
                .evento("DESEMBOLSO_SOLICITUD_" + solicitud.getIdSolicitud())
                .fecha(LocalDate.now())
                .saldo(prestamoGuardado.getSaldo())
                .build());
        }

        Solicitud actualizada = solicitudRepository.save(solicitud);
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
