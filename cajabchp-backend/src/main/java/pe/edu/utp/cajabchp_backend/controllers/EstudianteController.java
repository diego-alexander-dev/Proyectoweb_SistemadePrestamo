package pe.edu.utp.cajabchp_backend.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.utp.cajabchp_backend.dtos.EstudianteDTO;
import pe.edu.utp.cajabchp_backend.dtos.EstudianteRequestDTO;
import pe.edu.utp.cajabchp_backend.services.EstudianteService;

import java.util.List;

@RestController
@RequestMapping("/api/estudiantes")
@RequiredArgsConstructor
public class EstudianteController {

    private final EstudianteService estudianteService;

    @GetMapping
    public ResponseEntity<List<EstudianteDTO>> listar() {
        return ResponseEntity.ok(estudianteService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EstudianteDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(estudianteService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<EstudianteDTO> registrar(@Valid @RequestBody EstudianteRequestDTO dto) {
        EstudianteDTO creado = estudianteService.registrar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EstudianteDTO> actualizar(@PathVariable Long id, @Valid @RequestBody EstudianteRequestDTO dto) {
        return ResponseEntity.ok(estudianteService.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        estudianteService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
