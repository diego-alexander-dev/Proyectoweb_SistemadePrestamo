package pe.edu.utp.cajabchp_backend.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.utp.cajabchp_backend.dtos.ConfiguracionDTO;
import pe.edu.utp.cajabchp_backend.dtos.ConfiguracionUpdateDTO;
import pe.edu.utp.cajabchp_backend.services.ConfiguracionService;

import java.util.List;

@RestController
@RequestMapping("/api/configuracion")
@RequiredArgsConstructor
public class ConfiguracionController {

    private final ConfiguracionService configuracionService;

    @GetMapping
    public ResponseEntity<List<ConfiguracionDTO>> listar() {
        return ResponseEntity.ok(configuracionService.listarTodas());
    }

    @PutMapping
    public ResponseEntity<ConfiguracionDTO> actualizar(@Valid @RequestBody ConfiguracionUpdateDTO dto) {
        return ResponseEntity.ok(configuracionService.actualizar(dto));
    }
}
