package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReporteMorosidadDTO {

    @JsonProperty("prestamos_vigentes")
    private long prestamosVigentes;

    @JsonProperty("prestamos_en_mora")
    private long prestamosEnMora;

    @JsonProperty("porcentaje_morosidad")
    private BigDecimal porcentajeMorosidad;

    @JsonProperty("monto_total_mora")
    private BigDecimal montoTotalMora;

    @JsonProperty("saldo_total_mora")
    private BigDecimal saldoTotalMora;

    private List<TramoMorosidadDTO> tramos;
    private List<PrestamoDTO> prestamos;
}
