package pe.edu.utp.cajabchp_backend.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "reportes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reporte")
    private Long idReporte;

    @Column(name = "tipo_reporte", nullable = false, length = 50)
    private String tipoReporte;

    @Column(name = "usuario", length = 50)
    private String usuario;

    @Column(name = "fecha_generacion")
    private LocalDate fechaGeneracion;

    @Column(name = "descripcion", length = 150)
    private String descripcion;

    @PrePersist
    public void prePersist() {
        if (this.fechaGeneracion == null) {
            this.fechaGeneracion = LocalDate.now();
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Reporte reporte = (Reporte) o;
        return Objects.equals(idReporte, reporte.idReporte);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idReporte);
    }
}
