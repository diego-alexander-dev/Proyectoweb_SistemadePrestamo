package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfiguracionDTO {

    @JsonProperty("id_configuracion")
    private Long idConfiguracion;

    private String parametro;
    private String valor;

    @JsonProperty("fecha_modificacion")
    private LocalDate fechaModificacion;
}
