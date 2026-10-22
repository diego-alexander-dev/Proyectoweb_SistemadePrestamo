package pe.edu.utp.cajabchp_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.edu.utp.cajabchp_backend.models.Pago;

import java.util.List;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {

    @Query("SELECT pg FROM Pago pg JOIN FETCH pg.prestamo p JOIN FETCH p.estudiante ORDER BY pg.idPago DESC")
    List<Pago> findAllWithPrestamoAndEstudiante();

    @Query("SELECT pg FROM Pago pg JOIN FETCH pg.prestamo p JOIN FETCH p.estudiante WHERE p.idPrestamo = :idPrestamo ORDER BY pg.idPago DESC")
    List<Pago> findByPrestamoId(@Param("idPrestamo") Long idPrestamo);
}
