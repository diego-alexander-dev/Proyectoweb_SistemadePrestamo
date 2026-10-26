package pe.edu.utp.cajabchp_backend.models;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "solicitudes_prestamo")
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

    @Column(name = "monto_solicitado", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoSolicitado;

    @Column(name = "cuotas_solicitadas", nullable = false)
    private Integer cuotasSolicitadas;

    @Column(name = "estado_solicitud", nullable = false, length = 20)
    private String estadoSolicitud;

    @Column(name = "recomendacion_sistema", length = 30)
    private String recomendacionSistema;

    @Column(name = "observacion", length = 255)
    private String observacion;

    @Column(name = "atendido_por", length = 50)
    private String atendidoPor;

    @Column(name = "fecha_solicitud")
    private LocalDate fechaSolicitud;

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
