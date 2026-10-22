-- ============================================================================
-- SISTEMA CAJA BCHP - ESQUEMA DE BASE DE DATOS POSTGRESQL (ALGORITMOS1)
-- ============================================================================

-- 1. TABLA: estudiantes
CREATE TABLE IF NOT EXISTS estudiantes (
    id_estudiante BIGSERIAL PRIMARY KEY,
    dni VARCHAR(15) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    edad INTEGER NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(120),
    promedio_notas NUMERIC(4, 2) NOT NULL DEFAULT 14.00,
    porcentaje_asistencia NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    estado_universidad VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    ciclo_actual INTEGER NOT NULL DEFAULT 1,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA: prestamos
CREATE TABLE IF NOT EXISTS prestamos (
    id_prestamo BIGSERIAL PRIMARY KEY,
    id_estudiante BIGINT NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    cuotas INTEGER NOT NULL,
    tasa_interes NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    saldo NUMERIC(12, 2) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'Activo',
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    dias_mora INTEGER NOT NULL DEFAULT 0,
    interes_mora NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_prestamos_estudiante FOREIGN KEY (id_estudiante) 
        REFERENCES estudiantes(id_estudiante) ON DELETE CASCADE
);

-- 3. TABLA: pagos (amortizaciones)
CREATE TABLE IF NOT EXISTS pagos (
    id_pago BIGSERIAL PRIMARY KEY,
    id_prestamo BIGINT NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    cuota_numero INTEGER NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_pagos_prestamo FOREIGN KEY (id_prestamo) 
        REFERENCES prestamos(id_prestamo) ON DELETE CASCADE
);

-- 4. TABLA: solicitudes
CREATE TABLE IF NOT EXISTS solicitudes (
    id_solicitud BIGSERIAL PRIMARY KEY,
    id_estudiante BIGINT NOT NULL,
    monto_solicitado NUMERIC(12, 2) NOT NULL,
    cuotas_solicitadas INTEGER NOT NULL,
    estado_solicitud VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    recomendacion_sistema VARCHAR(200),
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_solicitudes_estudiante FOREIGN KEY (id_estudiante) 
        REFERENCES estudiantes(id_estudiante) ON DELETE CASCADE
);

-- ============================================================================
-- ÍNDICES ESTRATÉGICOS PARA CONSULTAS Y RENDIMIENTO
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_estudiantes_dni ON estudiantes(dni);
CREATE INDEX IF NOT EXISTS idx_prestamos_id_estudiante ON prestamos(id_estudiante);
CREATE INDEX IF NOT EXISTS idx_prestamos_estado ON prestamos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_id_prestamo ON pagos(id_prestamo);
CREATE INDEX IF NOT EXISTS idx_solicitudes_id_estudiante ON solicitudes(id_estudiante);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes(estado_solicitud);
