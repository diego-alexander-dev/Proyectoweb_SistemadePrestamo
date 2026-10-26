package pe.edu.utp.cajabchp_backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioDTO {

    @JsonProperty("id_usuario")
    private Long idUsuario;

    private String usuario;
    private String rol;
    private String nombre;
    private Boolean activo;

    @JsonProperty("intentos_fallidos")
    private Integer intentosFallidos;

    private Boolean bloqueado;
}
