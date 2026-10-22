package pe.edu.utp.cajabchp_backend.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utp.cajabchp_backend.dtos.EstudianteDTO;
import pe.edu.utp.cajabchp_backend.dtos.EstudianteRequestDTO;
import pe.edu.utp.cajabchp_backend.exception.BusinessRuleException;
import pe.edu.utp.cajabchp_backend.exception.ResourceNotFoundException;
import pe.edu.utp.cajabchp_backend.mappers.EstudianteMapper;
import pe.edu.utp.cajabchp_backend.models.Estudiante;
import pe.edu.utp.cajabchp_backend.repositories.EstudianteRepository;
import pe.edu.utp.cajabchp_backend.services.EstudianteService;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class EstudianteServiceImpl implements EstudianteService {

    private final EstudianteRepository estudianteRepository;
    private final EstudianteMapper estudianteMapper;

    @Override
    @Transactional(readOnly = true)
    public List<EstudianteDTO> listarTodos() {
        return estudianteRepository.findAllByOrderByIdEstudianteDesc()
            .stream()
            .map(estudianteMapper::toDTO)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EstudianteDTO obtenerPorId(Long id) {
        Objects.requireNonNull(id, "El ID de estudiante no puede ser nulo");
        Estudiante estudiante = estudianteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante con ID " + id + " no encontrado"));
        return estudianteMapper.toDTO(estudiante);
    }

    @Override
    @Transactional
    public EstudianteDTO registrar(EstudianteRequestDTO dto) {
        Objects.requireNonNull(dto, "Los datos del estudiante no pueden ser nulos");

        if (estudianteRepository.existsByDni(dto.getDni().trim())) {
            throw new BusinessRuleException("Ya existe un estudiante registrado con el DNI " + dto.getDni());
        }

        Estudiante nuevo = estudianteMapper.toEntity(dto);
        Estudiante guardado = estudianteRepository.save(nuevo);
        return estudianteMapper.toDTO(guardado);
    }

    @Override
    @Transactional
    public EstudianteDTO actualizar(Long id, EstudianteRequestDTO dto) {
        Objects.requireNonNull(id, "El ID de estudiante no puede ser nulo");
        Objects.requireNonNull(dto, "Los datos de actualización no pueden ser nulos");

        Estudiante estudiante = estudianteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante con ID " + id + " no encontrado"));

        if (!estudiante.getDni().equals(dto.getDni().trim()) && estudianteRepository.existsByDni(dto.getDni().trim())) {
            throw new BusinessRuleException("El DNI " + dto.getDni() + " ya está asignado a otro estudiante");
        }

        estudiante.setDni(dto.getDni().trim());
        estudiante.setNombre(dto.getNombre().trim().toUpperCase());
        estudiante.setApellido(dto.getApellido().trim().toUpperCase());
        estudiante.setEdad(dto.getEdad());
        estudiante.setTelefono(dto.getTelefono());
        estudiante.setCorreo(dto.getCorreo() != null ? dto.getCorreo().trim().toLowerCase() : null);
        estudiante.setPromedioNotas(dto.getPromedioNotas());
        estudiante.setPorcentajeAsistencia(dto.getPorcentajeAsistencia());
        if (dto.getEstadoUniversidad() != null) {
            estudiante.setEstadoUniversidad(dto.getEstadoUniversidad());
        }
        estudiante.setCicloActual(dto.getCicloActual());

        Estudiante actualizado = estudianteRepository.save(estudiante);
        return estudianteMapper.toDTO(actualizado);
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        Objects.requireNonNull(id, "El ID no puede ser nulo");
        if (!estudianteRepository.existsById(id)) {
            throw new ResourceNotFoundException("Estudiante con ID " + id + " no encontrado");
        }
        estudianteRepository.deleteById(id);
    }
}
