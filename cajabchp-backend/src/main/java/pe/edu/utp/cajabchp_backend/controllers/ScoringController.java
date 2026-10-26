package pe.edu.utp.cajabchp_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.utp.cajabchp_backend.dtos.ScoringResponseDTO;
import pe.edu.utp.cajabchp_backend.services.ScoringService;

@RestController
@RequestMapping("/api/scoring")
@RequiredArgsConstructor
public class ScoringController {

    private final ScoringService scoringService;

    @GetMapping("/estudiante/{id}")
    public ResponseEntity<ScoringResponseDTO> obtenerScoringEstudiante(@PathVariable Long id) {
        return ResponseEntity.ok(scoringService.evaluarEstudiante(id));
    }
}
