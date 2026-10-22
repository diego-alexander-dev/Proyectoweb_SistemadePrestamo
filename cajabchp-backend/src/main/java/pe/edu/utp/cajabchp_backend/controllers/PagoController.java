package pe.edu.utp.cajabchp_backend.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.utp.cajabchp_backend.dtos.PagoDTO;
import pe.edu.utp.cajabchp_backend.dtos.PagoRequestDTO;
import pe.edu.utp.cajabchp_backend.services.PagoService;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
public class PagoController {

    private final PagoService pagoService;

    @GetMapping
    public ResponseEntity<List<PagoDTO>> listar() {
        return ResponseEntity.ok(pagoService.listarTodos());
    }

    @GetMapping("/prestamo/{idPrestamo}")
    public ResponseEntity<List<PagoDTO>> listarPorPrestamo(@PathVariable Long idPrestamo) {
        return ResponseEntity.ok(pagoService.listarPorPrestamo(idPrestamo));
    }

    @PostMapping
    public ResponseEntity<PagoDTO> registrarPago(@Valid @RequestBody PagoRequestDTO dto) {
        PagoDTO creado = pagoService.registrarPago(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }
}
