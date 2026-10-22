package pe.edu.utp.cajabchp_backend.services;

import pe.edu.utp.cajabchp_backend.dtos.SolicitudDTO;
import pe.edu.utp.cajabchp_backend.dtos.SolicitudRequestDTO;
import pe.edu.utp.cajabchp_backend.dtos.SolicitudUpdateDTO;

import java.util.List;

public interface SolicitudService {
    List<SolicitudDTO> listarTodas();
    List<SolicitudDTO> listarPorEstado(String estado);
    SolicitudDTO obtenerPorId(Long id);
    SolicitudDTO registrar(SolicitudRequestDTO dto);
    SolicitudDTO actualizarEstado(Long id, SolicitudUpdateDTO dto);
}
