package pe.edu.utp.cajabchp_backend.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.utp.cajabchp_backend.dtos.PrestamoDTO;
import pe.edu.utp.cajabchp_backend.dtos.PrestamoRequestDTO;
import pe.edu.utp.cajabchp_backend.dtos.PrestamoUpdateDTO;
import pe.edu.utp.cajabchp_backend.services.PrestamoService;

import java.util.List;

@RestController
@RequestMapping("/api/prestamos")
@RequiredArgsConstructor
public class PrestamoController {

    private final PrestamoService prestamoService;

    @GetMapping
    public ResponseEntity<List<PrestamoDTO>> listar() {
        return ResponseEntity.ok(prestamoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrestamoDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(prestamoService.obtenerPorId(id));
    }

    @GetMapping("/estudiante/{idEstudiante}")
    public ResponseEntity<List<PrestamoDTO>> listarPorEstudiante(@PathVariable Long idEstudiante) {
        return ResponseEntity.ok(prestamoService.listarPorEstudiante(idEstudiante));
    }

    @PostMapping
    public ResponseEntity<PrestamoDTO> registrar(@Valid @RequestBody PrestamoRequestDTO dto) {
        PrestamoDTO creado = prestamoService.registrar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PrestamoDTO> actualizar(@PathVariable Long id, @RequestBody PrestamoUpdateDTO dto) {
        return ResponseEntity.ok(prestamoService.actualizar(id, dto));
    }
}
