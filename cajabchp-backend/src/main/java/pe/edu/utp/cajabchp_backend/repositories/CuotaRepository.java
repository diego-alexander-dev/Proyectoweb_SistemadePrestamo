package pe.edu.utp.cajabchp_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.edu.utp.cajabchp_backend.models.Cuota;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CuotaRepository extends JpaRepository<Cuota, Long> {

    @Query("SELECT c FROM Cuota c WHERE c.prestamo.idPrestamo = :idPrestamo ORDER BY c.numeroCuota ASC")
    List<Cuota> findByPrestamoIdOrderByNumeroCuotaAsc(@Param("idPrestamo") Long idPrestamo);

    @Query("SELECT c FROM Cuota c WHERE c.prestamo.idPrestamo = :idPrestamo AND c.numeroCuota = :numeroCuota")
    Optional<Cuota> findByPrestamoIdAndNumeroCuota(@Param("idPrestamo") Long idPrestamo, @Param("numeroCuota") Integer numeroCuota);

    @Query("SELECT c FROM Cuota c JOIN FETCH c.prestamo p JOIN FETCH p.estudiante WHERE c.estado = 'Pendiente' AND c.fechaVencimiento < :hoy")
    List<Cuota> findCuotasVencidasPendientes(@Param("hoy") LocalDate hoy);

    @Query("SELECT c FROM Cuota c JOIN FETCH c.prestamo p JOIN FETCH p.estudiante WHERE c.prestamo.idPrestamo = :idPrestamo AND c.estado = 'Pendiente' AND c.fechaVencimiento < :hoy")
    List<Cuota> findCuotasVencidasPendientesByPrestamo(@Param("idPrestamo") Long idPrestamo, @Param("hoy") LocalDate hoy);

    @Query("SELECT c FROM Cuota c WHERE c.prestamo.idPrestamo = :idPrestamo AND c.estado = 'Vencida'")
    List<Cuota> findCuotasVencidasByPrestamo(@Param("idPrestamo") Long idPrestamo);

    @Query("SELECT c FROM Cuota c WHERE c.prestamo.estudiante.idEstudiante = :idEstudiante AND c.estado = 'Vencida'")
    List<Cuota> findCuotasVencidasByEstudiante(@Param("idEstudiante") Long idEstudiante);

    @Query("SELECT COUNT(c) > 0 FROM Cuota c WHERE c.prestamo.idPrestamo = :idPrestamo AND c.estado = 'Pendiente' AND c.fechaVencimiento = :fecha")
    boolean existsCuotaPendienteConVencimiento(@Param("idPrestamo") Long idPrestamo, @Param("fecha") LocalDate fecha);
}
