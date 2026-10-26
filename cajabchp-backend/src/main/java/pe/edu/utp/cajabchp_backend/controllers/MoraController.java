package pe.edu.utp.cajabchp_backend.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.utp.cajabchp_backend.dtos.MoraProcesarResponseDTO;
import pe.edu.utp.cajabchp_backend.services.MoraService;

@RestController
@RequestMapping("/api/mora")
@RequiredArgsConstructor
public class MoraController {

    private final MoraService moraService;

    @PostMapping("/procesar")
    public ResponseEntity<MoraProcesarResponseDTO> procesarMora() {
        return ResponseEntity.ok(moraService.procesarMoraGeneral());
    }
}
