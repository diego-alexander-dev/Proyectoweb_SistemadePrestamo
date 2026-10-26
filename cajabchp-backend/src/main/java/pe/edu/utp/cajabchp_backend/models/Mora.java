package pe.edu.utp.cajabchp_backend.models;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "mora")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mora")
    private Long idMora;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cuota", nullable = false, unique = true)
    private Cuota cuota;

    @Column(name = "dias_mora", nullable = false)
    private Integer diasMora;

    @Column(name = "monto_mora", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoMora;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @PrePersist
    public void prePersist() {
        if (this.fecha == null) {
            this.fecha = LocalDate.now();
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Mora mora = (Mora) o;
        return Objects.equals(idMora, mora.idMora);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idMora);
    }
}
