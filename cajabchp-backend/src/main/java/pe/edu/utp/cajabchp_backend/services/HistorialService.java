package pe.edu.utp.cajabchp_backend.services;

import pe.edu.utp.cajabchp_backend.dtos.HistorialEstudianteResponseDTO;

public interface HistorialService {

    HistorialEstudianteResponseDTO obtenerHistorialEstudiante(Long idEstudiante);
}
