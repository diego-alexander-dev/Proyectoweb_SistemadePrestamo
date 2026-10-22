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
import pe.edu.utp.cajabchp_backend.models.Estudiante;
import pe.edu.utp.cajabchp_backend.models.Prestamo;
import pe.edu.utp.cajabchp_backend.repositories.EstudianteRepository;
import pe.edu.utp.cajabchp_backend.repositories.PrestamoRepository;
import pe.edu.utp.cajabchp_backend.services.PrestamoService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class PrestamoServiceImpl implements PrestamoService {

    private final PrestamoRepository prestamoRepository;
    private final EstudianteRepository estudianteRepository;
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
    @Transactional
    public PrestamoDTO registrar(PrestamoRequestDTO dto) {
        Objects.requireNonNull(dto, "Los datos del préstamo no pueden ser nulos");

        Estudiante estudiante = estudianteRepository.findById(dto.getIdEstudiante())
            .orElseThrow(() -> new ResourceNotFoundException("No se puede crear el préstamo: Estudiante ID " + dto.getIdEstudiante() + " no encontrado"));

        if ("RETIRADO".equalsIgnoreCase(estudiante.getEstadoUniversidad())) {
            throw new BusinessRuleException("No se puede desembolsar préstamos a un estudiante con estado RETIRADO");
        }

        Prestamo nuevo = prestamoMapper.toEntity(dto, estudiante);
        Prestamo guardado = prestamoRepository.save(nuevo);
        return prestamoMapper.toDTO(guardado);
    }

    @Override
    @Transactional
    public PrestamoDTO actualizar(Long id, PrestamoUpdateDTO dto) {
        Objects.requireNonNull(id, "El ID de préstamo no puede ser nulo");
        Objects.requireNonNull(dto, "Los datos de actualización no pueden ser nulos");

        Prestamo prestamo = prestamoRepository.findByIdWithEstudiante(id)
            .orElseThrow(() -> new ResourceNotFoundException("Préstamo con ID " + id + " no encontrado"));

        if (dto.getSaldo() != null) {
            if (dto.getSaldo().compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessRuleException("El saldo no puede ser negativo");
            }
            prestamo.setSaldo(dto.getSaldo());
            if (dto.getSaldo().compareTo(BigDecimal.ZERO) == 0) {
                prestamo.setEstado("Pagado");
            }
        }

        if (dto.getDiasMora() != null) {
            prestamo.setDiasMora(Math.max(0, dto.getDiasMora()));
        }

        if (dto.getInteresMora() != null) {
            prestamo.setInteresMora(dto.getInteresMora().max(BigDecimal.ZERO));
        }

        if (dto.getEstado() != null && !dto.getEstado().isBlank()) {
            prestamo.setEstado(dto.getEstado().trim());
        }

        Prestamo actualizado = prestamoRepository.save(prestamo);
        return prestamoMapper.toDTO(actualizado);
    }
}
