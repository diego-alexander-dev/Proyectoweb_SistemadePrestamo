package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SolicitudDTO {

    @JsonProperty("id_solicitud")
    private Long idSolicitud;

    @JsonProperty("id_estudiante")
    private Long idEstudiante;

    private String nombreCompleto;
    private BigDecimal promedio;
    private BigDecimal asistencia;
    private Integer ciclo;

    @JsonProperty("monto_solicitado")
    private BigDecimal montoSolicitado;

    @JsonProperty("cuotas_solicitadas")
    private Integer cuotasSolicitadas;

    @JsonProperty("estado_solicitud")
    private String estadoSolicitud;

    @JsonProperty("recomendacion_sistema")
    private String recomendacionSistema;

    @JsonProperty("fecha_solicitud")
    private LocalDateTime fechaSolicitud;
}
