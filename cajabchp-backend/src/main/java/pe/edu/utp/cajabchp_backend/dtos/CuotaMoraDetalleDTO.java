package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CuotaMoraDetalleDTO {

    @JsonProperty("id_cuota")
    private Long idCuota;

    @JsonProperty("numero_cuota")
    private Integer numeroCuota;

    @JsonProperty("fecha_vencimiento")
    private LocalDate fechaVencimiento;

    @JsonProperty("monto_cuota")
    private BigDecimal montoCuota;

    @JsonProperty("dias_mora")
    private Integer diasMora;

    @JsonProperty("monto_mora")
    private BigDecimal montoMora;
}
