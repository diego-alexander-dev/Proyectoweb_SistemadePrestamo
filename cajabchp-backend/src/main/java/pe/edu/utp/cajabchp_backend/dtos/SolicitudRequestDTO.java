package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SolicitudRequestDTO {

    @JsonProperty("id_estudiante")
    @NotNull(message = "El id_estudiante es obligatorio")
    private Long idEstudiante;

    @JsonProperty("monto_solicitado")
    @NotNull(message = "El monto solicitado es obligatorio")
    @DecimalMin(value = "50.00", message = "El monto mínimo solicitado es S/. 50.00")
    private BigDecimal montoSolicitado;

    @JsonProperty("cuotas_solicitadas")
    @NotNull(message = "El número de cuotas solicitadas es obligatorio")
    @Min(value = 1, message = "Debe solicitar al menos 1 cuota")
    private Integer cuotasSolicitadas;

    @JsonProperty("recomendacion_sistema")
    private String recomendacionSistema;
}
