package pe.edu.utp.cajabchp_backend.security;

public final class UserContext {

    private static final ThreadLocal<String> CURRENT_USER = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_ROLE = new ThreadLocal<>();

    private UserContext() {}

    public static void set(String usuario, String rol) {
        CURRENT_USER.set(usuario != null && !usuario.isBlank() ? usuario.trim() : "sistema");
        CURRENT_ROLE.set(rol != null && !rol.isBlank() ? rol.trim().toUpperCase() : null);
    }

    public static String getUsuario() {
        String u = CURRENT_USER.get();
        return (u != null && !u.isBlank()) ? u : "sistema";
    }

    public static String getRol() {
        return CURRENT_ROLE.get();
    }

    public static boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(getRol());
    }

    public static boolean isOperador() {
        return "OPERADOR".equalsIgnoreCase(getRol()) || isAdmin();
    }

    public static void clear() {
        CURRENT_USER.remove();
        CURRENT_ROLE.remove();
    }
}
