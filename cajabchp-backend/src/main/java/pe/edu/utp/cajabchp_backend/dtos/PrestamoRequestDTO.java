package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrestamoRequestDTO {

    @JsonProperty("id_estudiante")
    @NotNull(message = "El id_estudiante es obligatorio")
    private Long idEstudiante;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "1.00", message = "El monto debe ser al menos S/. 1.00")
    private BigDecimal monto;

    @NotNull(message = "El número de cuotas es obligatorio")
    @Min(value = 1, message = "Debe haber al menos 1 cuota")
    private Integer cuotas;

    @JsonProperty("tasa_interes")
    @NotNull(message = "La tasa de interés es obligatoria")
    @DecimalMin(value = "0.00", message = "La tasa no puede ser negativa")
    private BigDecimal tasaInteres;

    @NotNull(message = "El saldo inicial es obligatorio")
    @DecimalMin(value = "0.00", message = "El saldo no puede ser negativo")
    private BigDecimal saldo;
}
