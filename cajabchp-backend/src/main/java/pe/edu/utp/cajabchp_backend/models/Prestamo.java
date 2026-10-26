package pe.edu.utp.cajabchp_backend.models;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "prestamos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prestamo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_prestamo")
    private Long idPrestamo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_estudiante", nullable = false)
    private Estudiante estudiante;

    @Column(name = "monto", nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(name = "cuotas", nullable = false)
    private Integer cuotas;

    @Column(name = "tasa_interes", nullable = false, precision = 5, scale = 2)
    private BigDecimal tasaInteres;

    @Column(name = "saldo", nullable = false, precision = 12, scale = 2)
    private BigDecimal saldo;

    @Column(name = "estado", nullable = false, length = 30)
    private String estado;

    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @Column(name = "dias_mora", nullable = false)
    private Integer diasMora;

    @Column(name = "interes_mora", nullable = false, precision = 12, scale = 2)
    private BigDecimal interesMora;

    @PrePersist
    public void prePersist() {
        if (this.fechaInicio == null) {
            this.fechaInicio = LocalDate.now();
        }
        if (this.estado == null) {
            this.estado = "Activo";
        }
        if (this.diasMora == null) {
            this.diasMora = 0;
        }
        if (this.interesMora == null) {
            this.interesMora = BigDecimal.ZERO;
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Prestamo that = (Prestamo) o;
        return Objects.equals(idPrestamo, that.idPrestamo);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idPrestamo);
    }
}
