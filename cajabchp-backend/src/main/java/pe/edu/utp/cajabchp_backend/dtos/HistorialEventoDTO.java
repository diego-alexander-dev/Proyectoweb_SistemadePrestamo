package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistorialEventoDTO {

    @JsonProperty("id_historial")
    private Long idHistorial;

    @JsonProperty("id_prestamo")
    private Long idPrestamo;

    private String evento;
    private LocalDate fecha;
    private BigDecimal saldo;
}
