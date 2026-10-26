package pe.edu.utp.cajabchp_backend.security;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
@Order(10)
public class AuditUserAspect {

    @PersistenceContext
    private EntityManager entityManager;

    @Before("@annotation(org.springframework.transaction.annotation.Transactional) || @within(org.springframework.transaction.annotation.Transactional)")
    public void setAuditUser(JoinPoint joinPoint) {
        String usuario = UserContext.getUsuario();
        try {
            entityManager.createNativeQuery("SELECT set_config('bchp.usuario', :usr, true)")
                         .setParameter("usr", usuario)
                         .getSingleResult();
        } catch (Exception e) {
            log.warn("No se pudo configurar bchp.usuario en la sesión JDBC: {}", e.getMessage());
        }
    }
}
