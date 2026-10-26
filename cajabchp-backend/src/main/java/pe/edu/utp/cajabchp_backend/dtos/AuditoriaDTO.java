package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditoriaDTO {

    @JsonProperty("id_auditoria")
    private Long idAuditoria;

    private String tabla;
    private String operacion;
    private String usuario;

    @JsonProperty("fecha_hora")
    private OffsetDateTime fechaHora;

    @JsonProperty("valor_anterior")
    private String valorAnterior;
}
