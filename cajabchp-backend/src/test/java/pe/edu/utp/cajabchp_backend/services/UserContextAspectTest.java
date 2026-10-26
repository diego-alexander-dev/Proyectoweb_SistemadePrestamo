package pe.edu.utp.cajabchp_backend.services;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.edu.utp.cajabchp_backend.security.AuditUserAspect;
import pe.edu.utp.cajabchp_backend.security.UserContext;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserContextAspectTest {

    @Mock
    private EntityManager entityManager;

    @Mock
    private Query query;

    @InjectMocks
    private AuditUserAspect auditUserAspect;

    @AfterEach
    void tearDown() {
        UserContext.clear();
    }

    @Test
    @DisplayName("UserContext debe almacenar y recuperar usuario y rol correctamente")
    void debeGestionarUsuarioYRolEnContexto() {
        // Act
        UserContext.set("admin_prueba", "ADMIN");

        // Assert
        assertEquals("admin_prueba", UserContext.getUsuario());
        assertEquals("ADMIN", UserContext.getRol());
        assertTrue(UserContext.isAdmin());

        UserContext.clear();
        assertEquals("sistema", UserContext.getUsuario());
        assertFalse(UserContext.isAdmin());
    }

    @Test
    @DisplayName("AuditUserAspect debe invocar set_config en PostgreSQL con el usuario del contexto")
    void debeConfigurarUsuarioEnPostgreSQLParaAuditoria() {
        // Arrange
        UserContext.set("cajero1", "OPERADOR");

        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(eq("usr"), eq("cajero1"))).thenReturn(query);
        when(query.getSingleResult()).thenReturn("cajero1");

        // Act
        auditUserAspect.setAuditUser(null);

        // Assert
        verify(entityManager, times(1)).createNativeQuery("SELECT set_config('bchp.usuario', :usr, true)");
        verify(query, times(1)).setParameter("usr", "cajero1");
        verify(query, times(1)).getSingleResult();
    }
}
