package pe.edu.utp.cajabchp_backend.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfiguracionUpdateDTO {

    @NotBlank(message = "El parámetro es obligatorio")
    private String parametro;

    @NotBlank(message = "El valor es obligatorio")
    private String valor;
}
