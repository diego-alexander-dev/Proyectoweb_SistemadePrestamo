package pe.edu.utp.cajabchp_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.edu.utp.cajabchp_backend.models.Acceso;

import java.util.List;

@Repository
public interface AccesoRepository extends JpaRepository<Acceso, Long> {

    List<Acceso> findTop50ByOrderByFechaHoraDesc();
}
