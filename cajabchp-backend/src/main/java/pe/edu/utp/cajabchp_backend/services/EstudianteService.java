package pe.edu.utp.cajabchp_backend.services;

import pe.edu.utp.cajabchp_backend.dtos.EstudianteDTO;
import pe.edu.utp.cajabchp_backend.dtos.EstudianteRequestDTO;

import java.util.List;

public interface EstudianteService {
    List<EstudianteDTO> listarTodos();
    EstudianteDTO obtenerPorId(Long id);
    EstudianteDTO registrar(EstudianteRequestDTO dto);
    EstudianteDTO actualizar(Long id, EstudianteRequestDTO dto);
    void eliminar(Long id);
}
