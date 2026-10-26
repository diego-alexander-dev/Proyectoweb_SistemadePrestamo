package pe.edu.utp.cajabchp_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.edu.utp.cajabchp_backend.models.Solicitud;

import java.util.List;
import java.util.Optional;

@Repository
public interface SolicitudRepository extends JpaRepository<Solicitud, Long> {

    @Query("SELECT s FROM Solicitud s JOIN FETCH s.estudiante ORDER BY s.idSolicitud DESC")
    List<Solicitud> findAllWithEstudiante();

    @Query("SELECT s FROM Solicitud s JOIN FETCH s.estudiante WHERE s.idSolicitud = :id")
    Optional<Solicitud> findByIdWithEstudiante(@Param("id") Long id);

    @Query("SELECT s FROM Solicitud s JOIN FETCH s.estudiante WHERE s.estadoSolicitud = :estado ORDER BY s.idSolicitud DESC")
    List<Solicitud> findByEstadoSolicitudWithEstudiante(@Param("estado") String estado);

    boolean existsByEstudianteIdEstudiante(Long idEstudiante);
}
