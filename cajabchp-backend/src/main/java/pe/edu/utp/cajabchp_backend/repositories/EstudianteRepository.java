package pe.edu.utp.cajabchp_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.edu.utp.cajabchp_backend.models.Estudiante;

import java.util.List;
import java.util.Optional;

@Repository
public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {

    Optional<Estudiante> findByDni(String dni);

    boolean existsByDni(String dni);

    List<Estudiante> findAllByOrderByIdEstudianteDesc();
}
