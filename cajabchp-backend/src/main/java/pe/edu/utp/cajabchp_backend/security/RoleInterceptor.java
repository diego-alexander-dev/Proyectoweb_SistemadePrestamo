package pe.edu.utp.cajabchp_backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import pe.edu.utp.cajabchp_backend.exception.AccessDeniedBusinessException;

@Component
public class RoleInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String uri = request.getRequestURI();
        String method = request.getMethod();

        // Endpoints públicos de autenticación
        if (uri.startsWith("/api/auth/")) {
            return true;
        }

        String rol = UserContext.getRol();

        // 1. Endpoints exclusivos para ADMIN
        if (uri.startsWith("/api/usuarios")) {
            if (!"ADMIN".equalsIgnoreCase(rol)) {
                throw new AccessDeniedBusinessException("Acceso denegado: solo el rol ADMIN puede acceder al módulo de usuarios");
            }
        }

        if (uri.startsWith("/api/auditoria")) {
            if (!"ADMIN".equalsIgnoreCase(rol)) {
                throw new AccessDeniedBusinessException("Acceso denegado: solo el rol ADMIN puede consultar registros de auditoría");
            }
        }

        if (uri.startsWith("/api/configuracion") && "PUT".equalsIgnoreCase(method)) {
            if (!"ADMIN".equalsIgnoreCase(rol)) {
                throw new AccessDeniedBusinessException("Acceso denegado: solo el rol ADMIN puede modificar parámetros del sistema");
            }
        }

        if ((uri.matches("^/api/pagos/\\d+/anular$") || uri.matches("^/api/prestamos/\\d+/anular$")) && "PATCH".equalsIgnoreCase(method)) {
            if (!"ADMIN".equalsIgnoreCase(rol)) {
                throw new AccessDeniedBusinessException("Acceso denegado: solo el rol ADMIN puede realizar anulaciones financieras");
            }
        }

        // 2. Restricciones para rol ESTUDIANTE (no puede ejecutar operaciones administrativas u operativas)
        if ("ESTUDIANTE".equalsIgnoreCase(rol)) {
            boolean esOperacionProhibidaEstudiante = 
                (uri.startsWith("/api/estudiantes") && !"GET".equalsIgnoreCase(method)) ||
                (uri.startsWith("/api/prestamos") && !"GET".equalsIgnoreCase(method)) ||
                (uri.startsWith("/api/pagos") && !"GET".equalsIgnoreCase(method)) ||
                (uri.startsWith("/api/mora")) ||
                (uri.startsWith("/api/solicitudes") && "PUT".equalsIgnoreCase(method)) ||
                (uri.startsWith("/api/reportes"));

            if (esOperacionProhibidaEstudiante) {
                throw new AccessDeniedBusinessException("Acceso denegado: el rol ESTUDIANTE no tiene permisos para esta acción operativa");
            }
        }

        return true;
    }
}
