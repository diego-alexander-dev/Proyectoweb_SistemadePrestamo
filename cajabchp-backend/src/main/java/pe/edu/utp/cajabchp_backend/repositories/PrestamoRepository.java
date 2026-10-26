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

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Prestamo p WHERE p.idPrestamo = :id")
    Optional<Prestamo> findByIdForUpdate(@Param("id") Long id);

    List<Prestamo> findByEstado(String estado);

    List<Prestamo> findByEstadoIn(List<String> estados);

    boolean existsByEstudianteIdEstudiante(Long idEstudiante);

    boolean existsByEstudianteIdEstudianteAndEstado(Long idEstudiante, String estado);

    @Query("SELECT COUNT(p) FROM Prestamo p WHERE p.estado IN ('Activo', 'Riesgo Temprano')")
    long countPrestamosVigentes();

    @Query("SELECT COUNT(p) FROM Prestamo p WHERE p.estado = 'Riesgo Temprano'")
    long countPrestamosRiesgoTemprano();
}
