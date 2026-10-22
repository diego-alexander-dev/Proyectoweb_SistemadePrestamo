package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagoDTO {

    @JsonProperty("id_pago")
    private Long idPago;

    @JsonProperty("id_prestamo")
    private Long idPrestamo;

    private String dni;
    private BigDecimal monto;

    @JsonProperty("cuota_numero")
    private Integer cuotaNumero;

    @JsonProperty("metodo_pago")
    private String metodoPago;

    @JsonProperty("fecha_pago")
    private LocalDateTime fechaPago;
}
