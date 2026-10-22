package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagoRequestDTO {

    @JsonProperty("id_prestamo")
    @NotNull(message = "El id_prestamo es obligatorio")
    private Long idPrestamo;

    @NotNull(message = "El monto del pago es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto del pago debe ser mayor a 0")
    private BigDecimal monto;

    @JsonProperty("cuota_numero")
    @NotNull(message = "El número de cuota es obligatorio")
    @Min(value = 1, message = "El número de cuota debe ser mayor o igual a 1")
    private Integer cuotaNumero;

    @JsonProperty("metodo_pago")
    @NotBlank(message = "El método de pago es obligatorio (ej. YAPE, PLIN, TRANSFERENCIA)")
    private String metodoPago;
}
