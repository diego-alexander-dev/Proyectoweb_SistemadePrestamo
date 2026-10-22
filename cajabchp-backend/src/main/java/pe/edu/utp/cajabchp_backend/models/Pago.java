package pe.edu.utp.cajabchp_backend.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "pagos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pago")
    private Long idPago;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_prestamo", nullable = false)
    private Prestamo prestamo;

    @Column(name = "monto", nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(name = "cuota_numero", nullable = false)
    private Integer cuotaNumero;

    @Column(name = "metodo_pago", nullable = false, length = 50)
    private String metodoPago;

    @CreationTimestamp
    @Column(name = "fecha_pago", updatable = false)
    private LocalDateTime fechaPago;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Pago that = (Pago) o;
        return Objects.equals(idPago, that.idPago);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idPago);
    }
}
