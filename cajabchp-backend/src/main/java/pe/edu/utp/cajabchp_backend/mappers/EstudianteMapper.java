package pe.edu.utp.cajabchp_backend.mappers;

import org.springframework.stereotype.Component;
import pe.edu.utp.cajabchp_backend.dtos.EstudianteDTO;
import pe.edu.utp.cajabchp_backend.dtos.EstudianteRequestDTO;
import pe.edu.utp.cajabchp_backend.models.Estudiante;

import java.util.Objects;

@Component
public class EstudianteMapper {

    public EstudianteDTO toDTO(Estudiante entity) {
        if (entity == null) return null;
        return EstudianteDTO.builder()
            .idEstudiante(entity.getIdEstudiante())
            .dni(entity.getDni())
            .nombre(entity.getNombre())
            .apellido(entity.getApellido())
            .edad(entity.getEdad())
            .telefono(entity.getTelefono())
            .correo(entity.getCorreo())
            .promedioNotas(entity.getPromedioNotas())
            .porcentajeAsistencia(entity.getPorcentajeAsistencia())
            .estadoUniversidad(entity.getEstadoUniversidad())
            .cicloActual(entity.getCicloActual())
            .fechaRegistro(entity.getFechaRegistro())
            .build();
    }

    public Estudiante toEntity(EstudianteRequestDTO dto) {
        if (dto == null) return null;
        return Estudiante.builder()
            .dni(dto.getDni().trim())
            .nombre(dto.getNombre().trim().toUpperCase())
            .apellido(dto.getApellido().trim().toUpperCase())
            .edad(dto.getEdad())
            .telefono(dto.getTelefono())
            .correo(dto.getCorreo() != null ? dto.getCorreo().trim().toLowerCase() : null)
            .promedioNotas(dto.getPromedioNotas())
            .porcentajeAsistencia(dto.getPorcentajeAsistencia())
            .estadoUniversidad(Objects.requireNonNullElse(dto.getEstadoUniversidad(), "ACTIVO"))
            .cicloActual(dto.getCicloActual())
            .build();
    }
}
