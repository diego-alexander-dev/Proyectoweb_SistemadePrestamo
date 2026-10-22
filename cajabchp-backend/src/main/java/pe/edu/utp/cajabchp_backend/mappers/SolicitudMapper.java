package pe.edu.utp.cajabchp_backend.mappers;

import org.springframework.stereotype.Component;
import pe.edu.utp.cajabchp_backend.dtos.SolicitudDTO;
import pe.edu.utp.cajabchp_backend.dtos.SolicitudRequestDTO;
import pe.edu.utp.cajabchp_backend.models.Estudiante;
import pe.edu.utp.cajabchp_backend.models.Solicitud;

import java.math.BigDecimal;

@Component
public class SolicitudMapper {

    public SolicitudDTO toDTO(Solicitud entity) {
        if (entity == null) return null;

        Long idEstudiante = null;
        String nombreCompleto = null;
        BigDecimal promedio = null;
        BigDecimal asistencia = null;
        Integer ciclo = null;

        if (entity.getEstudiante() != null) {
            idEstudiante = entity.getEstudiante().getIdEstudiante();
            nombreCompleto = (entity.getEstudiante().getNombre() + " " + entity.getEstudiante().getApellido()).trim();
            promedio = entity.getEstudiante().getPromedioNotas();
            asistencia = entity.getEstudiante().getPorcentajeAsistencia();
            ciclo = entity.getEstudiante().getCicloActual();
        }

        return SolicitudDTO.builder()
            .idSolicitud(entity.getIdSolicitud())
            .idEstudiante(idEstudiante)
            .nombreCompleto(nombreCompleto)
            .promedio(promedio)
            .asistencia(asistencia)
            .ciclo(ciclo)
            .montoSolicitado(entity.getMontoSolicitado())
            .cuotasSolicitadas(entity.getCuotasSolicitadas())
            .estadoSolicitud(entity.getEstadoSolicitud())
            .recomendacionSistema(entity.getRecomendacionSistema())
            .fechaSolicitud(entity.getFechaSolicitud())
            .build();
    }

    public Solicitud toEntity(SolicitudRequestDTO dto, Estudiante estudiante, String recomendacion) {
        if (dto == null) return null;

        return Solicitud.builder()
            .estudiante(estudiante)
            .montoSolicitado(dto.getMontoSolicitado())
            .cuotasSolicitadas(dto.getCuotasSolicitadas())
            .estadoSolicitud("PENDIENTE")
            .recomendacionSistema(recomendacion != null ? recomendacion : dto.getRecomendacionSistema())
            .build();
    }
}
