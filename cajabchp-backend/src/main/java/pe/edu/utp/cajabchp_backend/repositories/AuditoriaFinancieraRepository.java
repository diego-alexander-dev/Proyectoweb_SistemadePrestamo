package pe.edu.utp.cajabchp_backend.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.edu.utp.cajabchp_backend.models.AuditoriaFinanciera;

import java.time.OffsetDateTime;

@Repository
public interface AuditoriaFinancieraRepository extends JpaRepository<AuditoriaFinanciera, Long>, JpaSpecificationExecutor<AuditoriaFinanciera> {

    @Query("SELECT a FROM AuditoriaFinanciera a WHERE " +
           "(:tabla IS NULL OR a.tabla = :tabla) AND " +
           "(:usuario IS NULL OR a.usuario = :usuario) AND " +
           "(:desde IS NULL OR a.fechaHora >= :desde) AND " +
           "(:hasta IS NULL OR a.fechaHora <= :hasta) " +
           "ORDER BY a.idAuditoria DESC")
    Page<AuditoriaFinanciera> findWithFilters(
            @Param("tabla") String tabla,
            @Param("usuario") String usuario,
            @Param("desde") OffsetDateTime desde,
            @Param("hasta") OffsetDateTime hasta,
            Pageable pageable
    );
}
