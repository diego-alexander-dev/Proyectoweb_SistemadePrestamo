package pe.edu.utp.cajabchp_backend.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.utp.cajabchp_backend.dtos.SolicitudDTO;
import pe.edu.utp.cajabchp_backend.dtos.SolicitudRequestDTO;
import pe.edu.utp.cajabchp_backend.dtos.SolicitudUpdateDTO;
import pe.edu.utp.cajabchp_backend.services.SolicitudService;

import java.util.List;

@RestController
@RequestMapping("/api/solicitudes")
@RequiredArgsConstructor
public class SolicitudController {

    private final SolicitudService solicitudService;

    @GetMapping
    public ResponseEntity<List<SolicitudDTO>> listar(@RequestParam(required = false) String estado) {
        if (estado != null && !estado.isBlank()) {
            return ResponseEntity.ok(solicitudService.listarPorEstado(estado));
        }
        return ResponseEntity.ok(solicitudService.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SolicitudDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(solicitudService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<SolicitudDTO> registrar(@Valid @RequestBody SolicitudRequestDTO dto) {
        SolicitudDTO creada = solicitudService.registrar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SolicitudDTO> actualizarEstado(
        @PathVariable Long id,
        @Valid @RequestBody SolicitudUpdateDTO dto
    ) {
        return ResponseEntity.ok(solicitudService.actualizarEstado(id, dto));
    }
}
