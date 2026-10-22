package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SolicitudUpdateDTO {

    @JsonProperty("estado_solicitud")
    @NotBlank(message = "El estado de la solicitud no puede estar vacío (ej. APROBADO, RECHAZADO, ESCALADO)")
    private String estadoSolicitud;
}
