package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TramoMorosidadDTO {

    private String categoria; // 'AL DIA', 'VENCIDO', 'MOROSO', 'CRITICO'
    private String rangoDias;

    @JsonProperty("cantidad_prestamos")
    private long cantidadPrestamos;

    @JsonProperty("monto_saldo")
    private BigDecimal montoSaldo;

    @JsonProperty("monto_mora")
    private BigDecimal montoMora;
}
