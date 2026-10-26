package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoraProcesarResponseDTO {

    @JsonProperty("prestamos_en_mora")
    private long prestamosEnMora;

    @JsonProperty("monto_en_mora")
    private BigDecimal montoEnMora;

    private BigDecimal porcentaje;

    private String resumen;
}
