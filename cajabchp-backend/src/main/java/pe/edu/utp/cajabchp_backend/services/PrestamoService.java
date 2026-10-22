package pe.edu.utp.cajabchp_backend.services;

import pe.edu.utp.cajabchp_backend.dtos.PrestamoDTO;
import pe.edu.utp.cajabchp_backend.dtos.PrestamoRequestDTO;
import pe.edu.utp.cajabchp_backend.dtos.PrestamoUpdateDTO;

import java.util.List;

public interface PrestamoService {
    List<PrestamoDTO> listarTodos();
    PrestamoDTO obtenerPorId(Long id);
    List<PrestamoDTO> listarPorEstudiante(Long idEstudiante);
    PrestamoDTO registrar(PrestamoRequestDTO dto);
    PrestamoDTO actualizar(Long id, PrestamoUpdateDTO dto);
}
