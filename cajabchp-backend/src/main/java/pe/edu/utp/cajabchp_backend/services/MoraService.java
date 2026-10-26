package pe.edu.utp.cajabchp_backend.services;

import pe.edu.utp.cajabchp_backend.dtos.AplicarMoraResponseDTO;
import pe.edu.utp.cajabchp_backend.dtos.MoraPreviewDTO;
import pe.edu.utp.cajabchp_backend.dtos.MoraProcesarResponseDTO;
import pe.edu.utp.cajabchp_backend.models.Prestamo;

public interface MoraService {

    MoraProcesarResponseDTO procesarMoraGeneral();

    AplicarMoraResponseDTO aplicarMoraPrestamo(Long idPrestamo);

    MoraPreviewDTO previewMoraPrestamo(Long idPrestamo);

    void evaluarRiesgoTemprano(Prestamo prestamo);
}
