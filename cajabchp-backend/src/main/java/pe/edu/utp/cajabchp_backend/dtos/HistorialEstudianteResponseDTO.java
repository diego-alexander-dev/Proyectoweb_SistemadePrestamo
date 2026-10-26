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
public class HistorialEstudianteResponseDTO {

    @JsonProperty("id_estudiante")
    private Long idEstudiante;

    private String dni;

    @JsonProperty("nombre_completo")
    private String nombreCompleto;

    @JsonProperty("saldo_total_deuda")
    private BigDecimal saldoTotalDeuda;

    private List<HistorialEventoDTO> eventos;

    @JsonProperty("cuotas_vencidas")
    private List<CuotaMoraDetalleDTO> cuotasVencidas;
}
