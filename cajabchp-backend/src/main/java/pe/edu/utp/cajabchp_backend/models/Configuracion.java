package pe.edu.utp.cajabchp_backend.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "configuracion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Configuracion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_configuracion")
    private Long idConfiguracion;

    @Column(name = "parametro", nullable = false, unique = true, length = 50)
    private String parametro;

    @Column(name = "valor", nullable = false, length = 80)
    private String valor;

    @Column(name = "fecha_modificacion")
    private LocalDate fechaModificacion;

    @PrePersist
    @PreUpdate
    public void prePersistOrUpdate() {
        this.fechaModificacion = LocalDate.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Configuracion that = (Configuracion) o;
        return Objects.equals(idConfiguracion, that.idConfiguracion);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idConfiguracion);
    }
}
