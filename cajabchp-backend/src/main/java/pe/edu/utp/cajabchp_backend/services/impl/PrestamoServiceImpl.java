package pe.edu.utp.cajabchp_backend.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utp.cajabchp_backend.dtos.PrestamoDTO;
import pe.edu.utp.cajabchp_backend.dtos.PrestamoRequestDTO;
import pe.edu.utp.cajabchp_backend.dtos.PrestamoUpdateDTO;
import pe.edu.utp.cajabchp_backend.exception.BusinessRuleException;
import pe.edu.utp.cajabchp_backend.exception.ResourceNotFoundException;
import pe.edu.utp.cajabchp_backend.mappers.PrestamoMapper;
import pe.edu.utp.cajabchp_backend.models.Cuota;
import pe.edu.utp.cajabchp_backend.models.Estudiante;
import pe.edu.utp.cajabchp_backend.models.HistorialCredito;
import pe.edu.utp.cajabchp_backend.models.Prestamo;
import pe.edu.utp.cajabchp_backend.repositories.*;
import pe.edu.utp.cajabchp_backend.security.UserContext;
import pe.edu.utp.cajabchp_backend.services.CronogramaService;
import pe.edu.utp.cajabchp_backend.services.MoraService;
import pe.edu.utp.cajabchp_backend.services.PrestamoService;
import pe.edu.utp.cajabchp_backend.services.ScoringService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class PrestamoServiceImpl implements PrestamoService {

    private final PrestamoRepository prestamoRepository;
    private final EstudianteRepository estudianteRepository;
    private final CuotaRepository cuotaRepository;
    private final PagoRepository pagoRepository;
    private final HistorialCreditoRepository historialCreditoRepository;
    private final CronogramaService cronogramaService;
    private final ScoringService scoringService;
    private final MoraService moraService;
    private final PrestamoMapper prestamoMapper;

    @Override
    @Transactional(readOnly = true)
    public List<PrestamoDTO> listarTodos() {
        return prestamoRepository.findAllWithEstudiante()
            .stream()
            .map(prestamoMapper::toDTO)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PrestamoDTO obtenerPorId(Long id) {
        Objects.requireNonNull(id, "El ID de préstamo no puede ser nulo");
        Prestamo prestamo = prestamoRepository.findByIdWithEstudiante(id)
            .orElseThrow(() -> new ResourceNotFoundException("Préstamo con ID " + id + " no encontrado"));
        return prestamoMapper.toDTO(prestamo);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrestamoDTO> listarPorEstudiante(Long idEstudiante) {
        Objects.requireNonNull(idEstudiante, "El ID de estudiante no puede ser nulo");
        return prestamoRepository.findByEstudianteId(idEstudiante)
            .stream()
            .map(prestamoMapper::toDTO)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrestamoDTO> listarRiesgoTemprano() {
        return prestamoRepository.findByEstado("Riesgo Temprano")
            .stream()
            .map(prestamoMapper::toDTO)
            .toList();
    }

    @Override
    @Transactional
    public PrestamoDTO registrar(PrestamoRequestDTO dto) {
        Objects.requireNonNull(dto, "Los datos del préstamo no pueden ser nulos");

        Estudiante estudiante = estudianteRepository.findById(dto.getIdEstudiante())
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante ID " + dto.getIdEstudiante() + " no encontrado"));

        if ("RETIRADO".equalsIgnoreCase(estudiante.getEstadoUniversidad())) {
            throw new BusinessRuleException("No se pueden desembolsar préstamos a estudiantes en estado RETIRADO");
        }

        // Tasa dinámica del servidor (a menos que el usuario autenticado sea ADMIN)
        BigDecimal tasaFinal;
        if (UserContext.isAdmin() && dto.getTasaInteres() != null) {
            tasaFinal = dto.getTasaInteres();
        } else {
            tasaFinal = scoringService.calcularTasaDinamica(estudiante.getPromedioNotas());
        }

        // El saldo del préstamo SIEMPRE lo calcula el servidor: monto * (1 + tasa/100)
        BigDecimal factorInteres = BigDecimal.ONE.add(tasaFinal.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP));
        BigDecimal saldoCalculado = dto.getMonto().multiply(factorInteres).setScale(2, RoundingMode.HALF_UP);

        LocalDate fechaInicio = dto.getFechaInicio() != null ? dto.getFechaInicio() : LocalDate.now();

        Prestamo nuevo = Prestamo.builder()
            .estudiante(estudiante)
            .monto(dto.getMonto())
            .cuotas(dto.getCuotas())
            .tasaInteres(tasaFinal)
            .saldo(saldoCalculado)
            .estado("Activo")
            .fechaInicio(fechaInicio)
            .diasMora(0)
            .interesMora(BigDecimal.ZERO)
            .build();

        Prestamo guardado = prestamoRepository.save(nuevo);

        // Generar cronograma de cuotas
        cronogramaService.generarCuotas(guardado);

        // Evaluar riesgo temprano
        moraService.evaluarRiesgoTemprano(guardado);
        guardado = prestamoRepository.save(guardado);

        // Registrar evento en historial crediticio
        historialCreditoRepository.save(HistorialCredito.builder()
            .estudiante(estudiante)
            .prestamo(guardado)
            .evento("DESEMBOLSO_PRESTAMO")
            .fecha(fechaInicio)
            .saldo(guardado.getSaldo())
            .build());

        return prestamoMapper.toDTO(guardado);
    }

    @Override
    @Transactional
    public PrestamoDTO actualizar(Long id, PrestamoUpdateDTO dto) {
        Objects.requireNonNull(id, "El ID de préstamo no puede ser nulo");
        Objects.requireNonNull(dto, "Los datos de actualización no pueden ser nulos");

        Prestamo prestamo = prestamoRepository.findByIdWithEstudiante(id)
            .orElseThrow(() -> new ResourceNotFoundException("Préstamo con ID " + id + " no encontrado"));

        // Se conservan solo datos de estado general; saldo, dias_mora e interes_mora son controlados exclusivamente por el servidor
        if (dto.getEstado() != null && !dto.getEstado().isBlank()) {
            prestamo.setEstado(dto.getEstado().trim());
        }

        Prestamo actualizado = prestamoRepository.save(prestamo);
        return prestamoMapper.toDTO(actualizado);
    }

    @Override
    @Transactional
    public PrestamoDTO anular(Long id) {
        Objects.requireNonNull(id, "El ID de préstamo no puede ser nulo");
        Prestamo prestamo = prestamoRepository.findByIdWithEstudiante(id)
            .orElseThrow(() -> new ResourceNotFoundException("Préstamo con ID " + id + " no encontrado"));

        if ("Anulado".equalsIgnoreCase(prestamo.getEstado())) {
            throw new BusinessRuleException("El préstamo ya se encuentra anulado");
        }

        if (!pagoRepository.findByPrestamoId(id).isEmpty()) {
            throw new BusinessRuleException("No se puede anular un préstamo que tiene pagos registrados. Debe anular los pagos primero.");
        }

        prestamo.setEstado("Anulado");
        prestamo.setSaldo(BigDecimal.ZERO);
        prestamoRepository.save(prestamo);

        List<Cuota> cuotas = cuotaRepository.findByPrestamoIdOrderByNumeroCuotaAsc(id);
        for (Cuota c : cuotas) {
            c.setEstado("Anulada");
            cuotaRepository.save(c);
        }

        historialCreditoRepository.save(HistorialCredito.builder()
            .estudiante(prestamo.getEstudiante())
            .prestamo(prestamo)
            .evento("ANULACION_PRESTAMO")
            .fecha(LocalDate.now())
            .saldo(BigDecimal.ZERO)
            .build());

        return prestamoMapper.toDTO(prestamo);
    }
}
