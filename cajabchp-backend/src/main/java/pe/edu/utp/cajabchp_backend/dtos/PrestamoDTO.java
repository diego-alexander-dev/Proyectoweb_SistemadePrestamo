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
public class PrestamoDTO {

    @JsonProperty("id_prestamo")
    private Long idPrestamo;

    @JsonProperty("id_estudiante")
    private Long idEstudiante;

    private String dni;

    @JsonProperty("estudiante_nombre")
    private String estudianteNombre;

    private BigDecimal monto;
    private Integer cuotas;

    @JsonProperty("tasa_interes")
    private BigDecimal tasaInteres;

    private BigDecimal saldo;
    private String estado;

    @JsonProperty("fecha_inicio")
    private LocalDate fechaInicio;

    @JsonProperty("dias_mora")
    private Integer diasMora;

    @JsonProperty("interes_mora")
    private BigDecimal interesMora;
}
