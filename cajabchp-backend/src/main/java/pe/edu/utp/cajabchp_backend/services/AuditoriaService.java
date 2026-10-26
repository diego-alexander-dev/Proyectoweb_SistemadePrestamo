package pe.edu.utp.cajabchp_backend.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import pe.edu.utp.cajabchp_backend.dtos.AuditoriaDTO;

import java.time.LocalDate;

public interface AuditoriaService {

    Page<AuditoriaDTO> consultarAuditoria(String tabla, String usuario, LocalDate fechaInicio, LocalDate fechaFin, Pageable pageable);
}
