package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrestamoUpdateDTO {

    private BigDecimal saldo;

    @JsonProperty("dias_mora")
    private Integer diasMora;

    @JsonProperty("interes_mora")
    private BigDecimal interesMora;

    private String estado;
}
