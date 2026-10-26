package pe.edu.utp.cajabchp_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.edu.utp.cajabchp_backend.models.Mora;

import java.util.Optional;

@Repository
public interface MoraRepository extends JpaRepository<Mora, Long> {

    Optional<Mora> findByCuotaIdCuota(Long idCuota);

    boolean existsByCuotaIdCuota(Long idCuota);
}
