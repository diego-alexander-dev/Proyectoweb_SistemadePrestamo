package pe.edu.utp.cajabchp_backend.services;

import pe.edu.utp.cajabchp_backend.dtos.CronogramaPreviewRequestDTO;
import pe.edu.utp.cajabchp_backend.dtos.CuotaDTO;
import pe.edu.utp.cajabchp_backend.models.Cuota;
import pe.edu.utp.cajabchp_backend.models.Prestamo;

import java.util.List;

public interface CronogramaService {

    List<Cuota> generarCuotas(Prestamo prestamo);

    List<CuotaDTO> preview(CronogramaPreviewRequestDTO request);

    List<CuotaDTO> listarCuotasPorPrestamo(Long idPrestamo);
}
