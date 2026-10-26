package pe.edu.utp.cajabchp_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.utp.cajabchp_backend.dtos.HistorialEstudianteResponseDTO;
import pe.edu.utp.cajabchp_backend.services.HistorialService;

@RestController
@RequestMapping("/api/historial")
@RequiredArgsConstructor
public class HistorialController {

    private final HistorialService historialService;

    @GetMapping("/estudiante/{id}")
    public ResponseEntity<HistorialEstudianteResponseDTO> obtenerHistorialEstudiante(@PathVariable Long id) {
        return ResponseEntity.ok(historialService.obtenerHistorialEstudiante(id));
    }
}
