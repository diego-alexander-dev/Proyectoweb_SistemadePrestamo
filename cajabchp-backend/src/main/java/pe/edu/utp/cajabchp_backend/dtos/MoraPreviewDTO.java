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
public class MoraPreviewDTO {

    @JsonProperty("id_prestamo")
    private Long idPrestamo;

    @JsonProperty("cuotas_vencidas")
    private List<CuotaMoraDetalleDTO> cuotasVencidas;

    @JsonProperty("total_dias_mora")
    private int totalDiasMora;

    @JsonProperty("total_mora_estimada")
    private BigDecimal totalMoraEstimada;
}
