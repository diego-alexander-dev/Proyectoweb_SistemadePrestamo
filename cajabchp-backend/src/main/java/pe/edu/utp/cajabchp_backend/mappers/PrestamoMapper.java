package pe.edu.utp.cajabchp_backend.mappers;

import org.springframework.stereotype.Component;
import pe.edu.utp.cajabchp_backend.dtos.PrestamoDTO;
import pe.edu.utp.cajabchp_backend.dtos.PrestamoRequestDTO;
import pe.edu.utp.cajabchp_backend.models.Estudiante;
import pe.edu.utp.cajabchp_backend.models.Prestamo;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class PrestamoMapper {

    public PrestamoDTO toDTO(Prestamo entity) {
        if (entity == null) return null;

        String dni = null;
        String nombreCompleto = null;
        Long idEstudiante = null;

        if (entity.getEstudiante() != null) {
            idEstudiante = entity.getEstudiante().getIdEstudiante();
            dni = entity.getEstudiante().getDni();
            nombreCompleto = (entity.getEstudiante().getNombre() + " " + entity.getEstudiante().getApellido()).trim();
        }

        return PrestamoDTO.builder()
            .idPrestamo(entity.getIdPrestamo())
            .idEstudiante(idEstudiante)
            .dni(dni)
            .estudianteNombre(nombreCompleto)
            .monto(entity.getMonto())
            .cuotas(entity.getCuotas())
            .tasaInteres(entity.getTasaInteres())
            .saldo(entity.getSaldo())
            .estado(entity.getEstado())
            .fechaInicio(entity.getFechaInicio())
            .diasMora(entity.getDiasMora())
            .interesMora(entity.getInteresMora())
            .build();
    }

    public Prestamo toEntity(PrestamoRequestDTO dto, Estudiante estudiante) {
        if (dto == null) return null;

        return Prestamo.builder()
            .estudiante(estudiante)
            .monto(dto.getMonto())
            .cuotas(dto.getCuotas())
            .tasaInteres(dto.getTasaInteres())
            .saldo(dto.getSaldo())
            .estado("Activo")
            .fechaInicio(dto.getFechaInicio() != null ? dto.getFechaInicio() : LocalDate.now())
            .diasMora(0)
            .interesMora(BigDecimal.ZERO)
            .build();
    }
}
