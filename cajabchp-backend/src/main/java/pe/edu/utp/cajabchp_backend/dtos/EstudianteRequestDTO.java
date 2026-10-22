package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstudianteRequestDTO {

    @NotBlank(message = "El DNI es obligatorio")
    @Size(min = 8, max = 15, message = "El DNI debe contener entre 8 y 15 caracteres")
    private String dni;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(max = 100, message = "El apellido no puede exceder 100 caracteres")
    private String apellido;

    @NotNull(message = "La edad es obligatoria")
    @Min(value = 16, message = "La edad mínima permitida es 16 años")
    @Max(value = 100, message = "La edad máxima permitida es 100 años")
    private Integer edad;

    private String telefono;

    @Email(message = "El formato del correo institucional es inválido")
    private String correo;

    @JsonProperty("promedio_notas")
    @NotNull(message = "El promedio de notas es obligatorio")
    @DecimalMin(value = "0.00", message = "El promedio no puede ser menor a 0")
    @DecimalMax(value = "20.00", message = "El promedio no puede superar 20")
    private BigDecimal promedioNotas;

    @JsonProperty("porcentaje_asistencia")
    @NotNull(message = "El porcentaje de asistencia es obligatorio")
    @DecimalMin(value = "0.00", message = "La asistencia no puede ser menor a 0%")
    @DecimalMax(value = "100.00", message = "La asistencia no puede ser mayor a 100%")
    private BigDecimal porcentajeAsistencia;

    @JsonProperty("estado_universidad")
    private String estadoUniversidad;

    @JsonProperty("ciclo_actual")
    @NotNull(message = "El ciclo actual es obligatorio")
    @Min(value = 1, message = "El ciclo mínimo es 1")
    @Max(value = 14, message = "El ciclo máximo es 14")
    private Integer cicloActual;
}
