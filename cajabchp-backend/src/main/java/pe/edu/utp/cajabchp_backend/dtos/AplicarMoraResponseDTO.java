package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AplicarMoraResponseDTO {

    @JsonProperty("cuotas_afectadas")
    private int cuotasAfectadas;

    @JsonProperty("monto_mora_aplicado")
    private BigDecimal montoMoraAplicado;

    private PrestamoDTO prestamo;
}
