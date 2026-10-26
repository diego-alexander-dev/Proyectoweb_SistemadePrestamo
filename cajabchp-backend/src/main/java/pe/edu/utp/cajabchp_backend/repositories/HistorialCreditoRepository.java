package pe.edu.utp.cajabchp_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.edu.utp.cajabchp_backend.models.HistorialCredito;

import java.util.List;

@Repository
public interface HistorialCreditoRepository extends JpaRepository<HistorialCredito, Long> {

    @Query("SELECT h FROM HistorialCredito h LEFT JOIN FETCH h.prestamo WHERE h.estudiante.idEstudiante = :idEstudiante ORDER BY h.fecha DESC, h.idHistorial DESC")
    List<HistorialCredito> findByEstudianteIdOrderByFechaDesc(@Param("idEstudiante") Long idEstudiante);
}
