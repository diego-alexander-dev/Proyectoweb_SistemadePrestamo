package pe.edu.utp.cajabchp_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.edu.utp.cajabchp_backend.models.Prestamo;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrestamoRepository extends JpaRepository<Prestamo, Long> {

    @Query("SELECT p FROM Prestamo p JOIN FETCH p.estudiante ORDER BY p.idPrestamo DESC")
    List<Prestamo> findAllWithEstudiante();

    @Query("SELECT p FROM Prestamo p JOIN FETCH p.estudiante WHERE p.idPrestamo = :id")
    Optional<Prestamo> findByIdWithEstudiante(@Param("id") Long id);

    @Query("SELECT p FROM Prestamo p JOIN FETCH p.estudiante WHERE p.estudiante.idEstudiante = :idEstudiante ORDER BY p.idPrestamo DESC")
    List<Prestamo> findByEstudianteId(@Param("idEstudiante") Long idEstudiante);

    List<Prestamo> findByEstado(String estado);
}
