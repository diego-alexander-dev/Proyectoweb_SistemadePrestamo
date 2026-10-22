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
public class EstudianteDTO {

    @JsonProperty("id_estudiante")
    private Long idEstudiante;

    private String dni;
    private String nombre;
    private String apellido;
    private Integer edad;
    private String telefono;
    private String correo;

    @JsonProperty("promedio_notas")
    private BigDecimal promedioNotas;

    @JsonProperty("porcentaje_asistencia")
    private BigDecimal porcentajeAsistencia;

    @JsonProperty("estado_universidad")
    private String estadoUniversidad;

    @JsonProperty("ciclo_actual")
    private Integer cicloActual;

    @JsonProperty("fecha_registro")
    private LocalDateTime fechaRegistro;
}
