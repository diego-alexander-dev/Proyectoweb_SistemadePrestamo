package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoringResponseDTO {

    private Integer score;
    private String dictamen;

    @JsonProperty("tasa_sugerida")
    private BigDecimal tasaSugerida;

    @JsonProperty("deuda_vigente")
    private BigDecimal deudaVigente;

    private BigDecimal promedio;
    private BigDecimal asistencia;
}
