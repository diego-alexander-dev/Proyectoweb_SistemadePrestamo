package pe.edu.utp.cajabchp_backend.services;

import pe.edu.utp.cajabchp_backend.dtos.PagoDTO;
import pe.edu.utp.cajabchp_backend.dtos.PagoRequestDTO;

import java.util.List;

public interface PagoService {

    List<PagoDTO> listarTodos();

    List<PagoDTO> listarPorPrestamo(Long idPrestamo);

    PagoDTO registrarPago(PagoRequestDTO dto);

    PagoDTO anular(Long idPago);
}
