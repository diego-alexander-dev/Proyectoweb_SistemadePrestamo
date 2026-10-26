package pe.edu.utp.cajabchp_backend.dtos;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponseDTO {

    private String usuario;
    private String rol;
    private String nombre;
}
