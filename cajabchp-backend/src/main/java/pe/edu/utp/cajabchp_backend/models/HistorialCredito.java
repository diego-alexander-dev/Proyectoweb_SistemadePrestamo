package pe.edu.utp.cajabchp_backend.models;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "historial_credito")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistorialCredito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_historial")
    private Long idHistorial;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_estudiante", nullable = false)
    private Estudiante estudiante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_prestamo")
    private Prestamo prestamo;

    @Column(name = "evento", nullable = false, length = 80)
    private String evento;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "saldo", nullable = false, precision = 12, scale = 2)
    private BigDecimal saldo;

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
        HistorialCredito that = (HistorialCredito) o;
        return Objects.equals(idHistorial, that.idHistorial);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idHistorial);
    }
}
