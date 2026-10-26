package pe.edu.utp.cajabchp_backend.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;

import java.time.OffsetDateTime;
import java.util.Objects;

@Entity
@Table(name = "auditoria_financiera")
@Immutable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditoriaFinanciera {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_auditoria")
    private Long idAuditoria;

    @Column(name = "tabla", nullable = false, length = 50)
    private String tabla;

    @Column(name = "operacion", nullable = false, length = 20)
    private String operacion;

    @Column(name = "usuario", length = 50)
    private String usuario;

    @Column(name = "fecha_hora")
    private OffsetDateTime fechaHora;

    @Column(name = "valor_anterior", columnDefinition = "jsonb")
    private String valorAnterior;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AuditoriaFinanciera that = (AuditoriaFinanciera) o;
        return Objects.equals(idAuditoria, that.idAuditoria);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idAuditoria);
    }
}
