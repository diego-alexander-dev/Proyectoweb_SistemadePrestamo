package pe.edu.utp.cajabchp_backend.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "solicitudes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Solicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_solicitud")
    private Long idSolicitud;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_estudiante", nullable = false)
    private Estudiante estudiante;

    @Column(name = "monto_solicitado", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoSolicitado;

    @Column(name = "cuotas_solicitadas", nullable = false)
    private Integer cuotasSolicitadas;

    @Column(name = "estado_solicitud", nullable = false, length = 30)
    private String estadoSolicitud;

    @Column(name = "recomendacion_sistema", length = 200)
    private String recomendacionSistema;

    @CreationTimestamp
    @Column(name = "fecha_solicitud", updatable = false)
    private LocalDateTime fechaSolicitud;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Solicitud that = (Solicitud) o;
        return Objects.equals(idSolicitud, that.idSolicitud);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idSolicitud);
    }
}
