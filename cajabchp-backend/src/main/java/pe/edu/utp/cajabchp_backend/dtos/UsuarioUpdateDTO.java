package pe.edu.utp.cajabchp_backend.dtos;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioUpdateDTO {

    private String rol;
    private Boolean activo;
    private Boolean bloqueado;
    private String password;
    private String nombre;
}
