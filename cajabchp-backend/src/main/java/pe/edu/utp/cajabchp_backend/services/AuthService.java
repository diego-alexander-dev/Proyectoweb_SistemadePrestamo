package pe.edu.utp.cajabchp_backend.services;

import pe.edu.utp.cajabchp_backend.dtos.AuthRequestDTO;
import pe.edu.utp.cajabchp_backend.dtos.AuthResponseDTO;

public interface AuthService {

    AuthResponseDTO login(AuthRequestDTO request);
}
