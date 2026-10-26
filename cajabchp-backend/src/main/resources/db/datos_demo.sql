-- ============================================================================
-- SISTEMA CAJA BCHP - DATOS DEMO (SOLO SI estudiantes ESTÁ VACÍA)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM estudiantes) THEN
        -- Inserción de Estudiantes Iniciales
        INSERT INTO estudiantes (id_estudiante, dni, nombre, apellido, edad, telefono, correo, promedio_notas, porcentaje_asistencia, estado_universidad, ciclo_actual, fecha_registro)
        VALUES 
            (1, '12345678', 'DIEGO', 'HUACHACA', 21, '987654321', 'diego.huachaca@utp.edu.pe', 16.50, 92.00, 'ACTIVO', 5, CURRENT_DATE),
            (2, '87654321', 'DIANA', 'APOLINARIO', 20, '912345678', 'diana.apolinario@utp.edu.pe', 14.00, 85.00, 'ACTIVO', 4, CURRENT_DATE),
            (3, '11223344', 'EDUARDO', 'CAMAC', 22, '956789012', 'eduardo.camac@utp.edu.pe', 10.00, 65.00, 'ALERTA', 6, CURRENT_DATE),
            (4, '99887766', 'MARIA', 'QUISPE', 19, '945678901', 'maria.quispe@utp.edu.pe', 18.00, 98.00, 'ACTIVO', 3, CURRENT_DATE),
            (5, '33221100', 'LUCIA', 'TORRES', 23, '978123456', 'lucia.torres@utp.edu.pe', 15.50, 88.00, 'ACTIVO', 8, CURRENT_DATE),
            (6, '66554433', 'ANDREA', 'FLORES', 20, '965432109', 'andrea.flores@utp.edu.pe', 12.00, 70.00, 'ACTIVO', 3, CURRENT_DATE),
            (7, '88776655', 'VALERIA', 'GUTIERREZ', 24, '932145678', 'valeria.gutierrez@utp.edu.pe', 9.00, 50.00, 'RETIRADO', 10, CURRENT_DATE)
        ON CONFLICT (dni) DO NOTHING;

        PERFORM setval('estudiantes_id_estudiante_seq', COALESCE((SELECT MAX(id_estudiante) FROM estudiantes), 1));

        -- Inserción de Préstamos Iniciales
        INSERT INTO prestamos (id_prestamo, id_estudiante, monto, cuotas, tasa_interes, saldo, estado, fecha_inicio, dias_mora, interes_mora)
        VALUES
            (1, 1, 5000.00, 12, 10.00, 5500.00, 'Activo', '2026-09-02', 0, 0.00),
            (2, 1, 1000.00, 3, 10.00, 1100.00, 'Activo', '2026-09-02', 0, 0.00),
            (3, 2, 2000.00, 6, 10.00, 2200.00, 'Activo', '2026-08-28', 5, 15.50),
            (4, 7, 5000.00, 12, 10.00, 0.00, 'Pagado', '2026-05-10', 0, 0.00)
        ON CONFLICT (id_prestamo) DO NOTHING;

        PERFORM setval('prestamos_id_prestamo_seq', COALESCE((SELECT MAX(id_prestamo) FROM prestamos), 1));

        -- Inserción de Solicitudes Iniciales
        INSERT INTO solicitudes (id_solicitud, id_estudiante, monto_solicitado, cuotas_solicitadas, estado_solicitud, recomendacion_sistema, fecha_solicitud)
        VALUES
            (1, 1, 3000.00, 12, 'PENDIENTE', 'APTO - ALTA PRIORIDAD', CURRENT_DATE),
            (2, 2, 1200.00, 6, 'PENDIENTE', 'APTO - PRIORIDAD MEDIA', CURRENT_DATE),
            (3, 3, 800.00, 6, 'PENDIENTE', 'REVISAR - RIESGO ACADEMICO', CURRENT_DATE),
            (4, 4, 4500.00, 18, 'PENDIENTE', 'APTO - ALTA PRIORIDAD', CURRENT_DATE),
            (5, 5, 2500.00, 12, 'ESCALADO', 'ESCALADO - VALIDAR DOCUMENTOS', CURRENT_DATE),
            (6, 6, 1500.00, 9, 'APROBADO', 'APTO - PRIORIDAD MEDIA', CURRENT_DATE),
            (7, 7, 900.00, 6, 'RECHAZADO', 'NO APTO - PROMEDIO INSUFICIENTE', CURRENT_DATE)
        ON CONFLICT (id_solicitud) DO NOTHING;

        PERFORM setval('solicitudes_id_solicitud_seq', COALESCE((SELECT MAX(id_solicitud) FROM solicitudes), 1));

        -- Inserción de Pagos Iniciales
        INSERT INTO pagos (id_pago, id_prestamo, monto, cuota_numero, metodo_pago, fecha_pago, estado)
        VALUES
            (1, 4, 458.33, 11, 'PAGOEFECTIVO', (CURRENT_DATE - INTERVAL '4 months')::DATE, 'REGISTRADO'),
            (2, 4, 458.33, 12, 'YAPE', (CURRENT_DATE - INTERVAL '3 months')::DATE, 'REGISTRADO'),
            (3, 3, 366.67, 1, 'PLIN', (CURRENT_DATE - INTERVAL '2 months')::DATE, 'REGISTRADO'),
            (4, 1, 458.33, 1, 'TRANSFERENCIA BCP', (CURRENT_DATE - INTERVAL '1 month')::DATE, 'REGISTRADO')
        ON CONFLICT (id_pago) DO NOTHING;

        PERFORM setval('pagos_id_pago_seq', COALESCE((SELECT MAX(id_pago) FROM pagos), 1));
    END IF;
END $$;
