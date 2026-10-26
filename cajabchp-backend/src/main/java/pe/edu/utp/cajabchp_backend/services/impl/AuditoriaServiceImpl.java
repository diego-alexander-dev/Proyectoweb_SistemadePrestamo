package pe.edu.utp.cajabchp_backend.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utp.cajabchp_backend.dtos.AuditoriaDTO;
import pe.edu.utp.cajabchp_backend.models.AuditoriaFinanciera;
import pe.edu.utp.cajabchp_backend.repositories.AuditoriaFinancieraRepository;
import pe.edu.utp.cajabchp_backend.services.AuditoriaService;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class AuditoriaServiceImpl implements AuditoriaService {

    private final AuditoriaFinancieraRepository auditoriaFinancieraRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<AuditoriaDTO> consultarAuditoria(String tabla, String usuario, LocalDate fechaInicio, LocalDate fechaFin, Pageable pageable) {
        String tablaFiltro = (tabla != null && !tabla.isBlank() && !"TODAS".equalsIgnoreCase(tabla)) ? tabla.trim() : null;
        String usuarioFiltro = (usuario != null && !usuario.isBlank()) ? usuario.trim() : null;

        OffsetDateTime desde = fechaInicio != null ? fechaInicio.atStartOfDay().atOffset(ZoneOffset.UTC) : null;
        OffsetDateTime hasta = fechaFin != null ? fechaFin.atTime(LocalTime.MAX).atOffset(ZoneOffset.UTC) : null;

        Page<AuditoriaFinanciera> page = auditoriaFinancieraRepository.findWithFilters(tablaFiltro, usuarioFiltro, desde, hasta, pageable);

        return page.map(a -> AuditoriaDTO.builder()
            .idAuditoria(a.getIdAuditoria())
            .tabla(a.getTabla())
            .operacion(a.getOperacion())
            .usuario(a.getUsuario())
            .fechaHora(a.getFechaHora())
            .valorAnterior(a.getValorAnterior())
            .build());
    }
}
