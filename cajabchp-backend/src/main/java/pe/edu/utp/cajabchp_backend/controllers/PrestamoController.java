package pe.edu.utp.cajabchp_backend.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.utp.cajabchp_backend.dtos.AplicarMoraResponseDTO;
import pe.edu.utp.cajabchp_backend.dtos.CronogramaPreviewRequestDTO;
import pe.edu.utp.cajabchp_backend.dtos.CuotaDTO;
import pe.edu.utp.cajabchp_backend.dtos.MoraPreviewDTO;
import pe.edu.utp.cajabchp_backend.dtos.PrestamoDTO;
import pe.edu.utp.cajabchp_backend.dtos.PrestamoRequestDTO;
import pe.edu.utp.cajabchp_backend.dtos.PrestamoUpdateDTO;
import pe.edu.utp.cajabchp_backend.services.CronogramaService;
import pe.edu.utp.cajabchp_backend.services.MoraService;
import pe.edu.utp.cajabchp_backend.services.PrestamoService;

import java.util.List;

@RestController
@RequestMapping("/api/prestamos")
@RequiredArgsConstructor
public class PrestamoController {

    private final PrestamoService prestamoService;
    private final CronogramaService cronogramaService;
    private final MoraService moraService;

    @GetMapping
    public ResponseEntity<List<PrestamoDTO>> listar() {
        return ResponseEntity.ok(prestamoService.listarTodos());
    }

    @GetMapping("/riesgo-temprano")
    public ResponseEntity<List<PrestamoDTO>> listarRiesgoTemprano() {
        return ResponseEntity.ok(prestamoService.listarRiesgoTemprano());
    }

    @GetMapping("/estudiante/{idEstudiante}")
    public ResponseEntity<List<PrestamoDTO>> listarPorEstudiante(@PathVariable Long idEstudiante) {
        return ResponseEntity.ok(prestamoService.listarPorEstudiante(idEstudiante));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrestamoDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(prestamoService.obtenerPorId(id));
    }

    @GetMapping("/{id}/cuotas")
    public ResponseEntity<List<CuotaDTO>> listarCuotas(@PathVariable Long id) {
        return ResponseEntity.ok(cronogramaService.listarCuotasPorPrestamo(id));
    }

    @PostMapping("/cronograma-preview")
    public ResponseEntity<List<CuotaDTO>> cronogramaPreview(@Valid @RequestBody CronogramaPreviewRequestDTO dto) {
        return ResponseEntity.ok(cronogramaService.preview(dto));
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

    @PatchMapping("/{id}/anular")
    public ResponseEntity<PrestamoDTO> anular(@PathVariable Long id) {
        return ResponseEntity.ok(prestamoService.anular(id));
    }

    @PostMapping("/{id}/aplicar-mora")
    public ResponseEntity<AplicarMoraResponseDTO> aplicarMora(@PathVariable Long id) {
        return ResponseEntity.ok(moraService.aplicarMoraPrestamo(id));
    }

    @GetMapping("/{id}/mora-preview")
    public ResponseEntity<MoraPreviewDTO> moraPreview(@PathVariable Long id) {
        return ResponseEntity.ok(moraService.previewMoraPrestamo(id));
    }
}
