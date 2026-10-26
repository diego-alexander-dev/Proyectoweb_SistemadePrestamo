package pe.edu.utp.cajabchp_backend.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.Objects;

@Entity
@Table(name = "accesos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Acceso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_acceso")
    private Long idAcceso;

    @Column(name = "usuario", length = 50)
    private String usuario;

    @Column(name = "fecha_hora")
    private OffsetDateTime fechaHora;

    @Column(name = "exito", nullable = false)
    private Boolean exito;

    @Column(name = "detalle", length = 200)
    private String detalle;

    @PrePersist
    public void prePersist() {
        if (this.fechaHora == null) {
            this.fechaHora = OffsetDateTime.now();
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Acceso acceso = (Acceso) o;
        return Objects.equals(idAcceso, acceso.idAcceso);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idAcceso);
    }
}
