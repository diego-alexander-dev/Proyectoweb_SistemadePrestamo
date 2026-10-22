package pe.edu.utp.cajabchp_backend.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "estudiantes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Estudiante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_estudiante")
    private Long idEstudiante;

    @Column(name = "dni", nullable = false, unique = true, length = 15)
    private String dni;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "apellido", nullable = false, length = 100)
    private String apellido;

    @Column(name = "edad", nullable = false)
    private Integer edad;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "correo", length = 120)
    private String correo;

    @Column(name = "promedio_notas", nullable = false, precision = 4, scale = 2)
    private BigDecimal promedioNotas;

    @Column(name = "porcentaje_asistencia", nullable = false, precision = 5, scale = 2)
    private BigDecimal porcentajeAsistencia;

    @Column(name = "estado_universidad", nullable = false, length = 20)
    private String estadoUniversidad;

    @Column(name = "ciclo_actual", nullable = false)
    private Integer cicloActual;

    @CreationTimestamp
    @Column(name = "fecha_registro", updatable = false)
    private LocalDateTime fechaRegistro;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Estudiante that = (Estudiante) o;
        return Objects.equals(idEstudiante, that.idEstudiante);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idEstudiante);
    }
}
