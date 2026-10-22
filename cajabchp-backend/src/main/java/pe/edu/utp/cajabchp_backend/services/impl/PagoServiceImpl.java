package pe.edu.utp.cajabchp_backend.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utp.cajabchp_backend.dtos.PagoDTO;
import pe.edu.utp.cajabchp_backend.dtos.PagoRequestDTO;
import pe.edu.utp.cajabchp_backend.exception.BusinessRuleException;
import pe.edu.utp.cajabchp_backend.exception.ResourceNotFoundException;
import pe.edu.utp.cajabchp_backend.mappers.PagoMapper;
import pe.edu.utp.cajabchp_backend.models.Pago;
import pe.edu.utp.cajabchp_backend.models.Prestamo;
import pe.edu.utp.cajabchp_backend.repositories.PagoRepository;
import pe.edu.utp.cajabchp_backend.repositories.PrestamoRepository;
import pe.edu.utp.cajabchp_backend.services.PagoService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class PagoServiceImpl implements PagoService {

    private final PagoRepository pagoRepository;
    private final PrestamoRepository prestamoRepository;
    private final PagoMapper pagoMapper;

    @Override
    @Transactional(readOnly = true)
    public List<PagoDTO> listarTodos() {
        return pagoRepository.findAllWithPrestamoAndEstudiante()
            .stream()
            .map(pagoMapper::toDTO)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PagoDTO> listarPorPrestamo(Long idPrestamo) {
        Objects.requireNonNull(idPrestamo, "El ID de préstamo no puede ser nulo");
        return pagoRepository.findByPrestamoId(idPrestamo)
            .stream()
            .map(pagoMapper::toDTO)
            .toList();
    }

    @Override
    @Transactional
    public PagoDTO registrarPago(PagoRequestDTO dto) {
        Objects.requireNonNull(dto, "Los datos de pago no pueden ser nulos");

        Prestamo prestamo = prestamoRepository.findByIdWithEstudiante(dto.getIdPrestamo())
            .orElseThrow(() -> new ResourceNotFoundException("Préstamo con ID " + dto.getIdPrestamo() + " no encontrado"));

        if ("Pagado".equalsIgnoreCase(prestamo.getEstado()) && prestamo.getSaldo().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("El préstamo ya se encuentra completamente pagado (Saldo S/. 0.00)");
        }

        // Crear y guardar el pago
        Pago nuevoPago = pagoMapper.toEntity(dto, prestamo);
        Pago pagoGuardado = pagoRepository.save(nuevoPago);

        // Descontar saldo del préstamo de forma atómica
        BigDecimal nuevoSaldo = prestamo.getSaldo().subtract(dto.getMonto());
        if (nuevoSaldo.compareTo(BigDecimal.ZERO) <= 0) {
            prestamo.setSaldo(BigDecimal.ZERO);
            prestamo.setEstado("Pagado");
            prestamo.setDiasMora(0);
            prestamo.setInteresMora(BigDecimal.ZERO);
        } else {
            prestamo.setSaldo(nuevoSaldo);
        }

        prestamoRepository.save(prestamo);
        return pagoMapper.toDTO(pagoGuardado);
    }
}
