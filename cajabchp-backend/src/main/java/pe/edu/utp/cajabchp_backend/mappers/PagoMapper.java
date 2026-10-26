package pe.edu.utp.cajabchp_backend.mappers;

import org.springframework.stereotype.Component;
import pe.edu.utp.cajabchp_backend.dtos.PagoDTO;
import pe.edu.utp.cajabchp_backend.dtos.PagoRequestDTO;
import pe.edu.utp.cajabchp_backend.models.Pago;
import pe.edu.utp.cajabchp_backend.models.Prestamo;

@Component
public class PagoMapper {

    public PagoDTO toDTO(Pago entity) {
        if (entity == null) return null;

        Long idPrestamo = null;
        String dni = null;
        Integer cuotaNumero = entity.getCuotaNumero();

        if (entity.getCuota() != null) {
            cuotaNumero = entity.getCuota().getNumeroCuota();
            if (entity.getCuota().getPrestamo() != null) {
                idPrestamo = entity.getCuota().getPrestamo().getIdPrestamo();
                if (entity.getCuota().getPrestamo().getEstudiante() != null) {
                    dni = entity.getCuota().getPrestamo().getEstudiante().getDni();
                }
            }
        }
        if (idPrestamo == null && entity.getPrestamo() != null) {
            idPrestamo = entity.getPrestamo().getIdPrestamo();
            if (dni == null && entity.getPrestamo().getEstudiante() != null) {
                dni = entity.getPrestamo().getEstudiante().getDni();
            }
        }

        return PagoDTO.builder()
            .idPago(entity.getIdPago())
            .idPrestamo(idPrestamo)
            .dni(dni)
            .monto(entity.getMonto())
            .cuotaNumero(cuotaNumero)
            .metodoPago(entity.getMetodoPago())
            .fechaPago(entity.getFechaPago())
            .build();
    }

    public Pago toEntity(PagoRequestDTO dto, Prestamo prestamo) {
        if (dto == null) return null;

        return Pago.builder()
            .prestamo(prestamo)
            .monto(dto.getMonto())
            .cuotaNumero(dto.getCuotaNumero())
            .metodoPago(dto.getMetodoPago().trim().toUpperCase())
            .build();
    }
}
