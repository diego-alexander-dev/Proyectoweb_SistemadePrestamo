--
-- PostgreSQL database dump
--

\restrict PcPPONf6QgL0pnNvaVZMVzxO4ejdQ6mdoGaSzcvgRYgU6JtAFmWIYaLVbxFE1DH

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: boletas_digitales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.boletas_digitales (
    id_boleta integer NOT NULL,
    id_prestamo integer,
    id_estudiante integer,
    fecha_emision timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    qr_binario bytea,
    monto_total numeric(10,2)
);


ALTER TABLE public.boletas_digitales OWNER TO postgres;

--
-- Name: boletas_digitales_id_boleta_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.boletas_digitales_id_boleta_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.boletas_digitales_id_boleta_seq OWNER TO postgres;

--
-- Name: boletas_digitales_id_boleta_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.boletas_digitales_id_boleta_seq OWNED BY public.boletas_digitales.id_boleta;


--
-- Name: estudiantes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.estudiantes (
    id_estudiante integer NOT NULL,
    dni character varying(8) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    edad integer NOT NULL,
    telefono character varying(9),
    correo character varying(150),
    promedio_notas numeric(4,2) DEFAULT 11.0,
    porcentaje_asistencia numeric(5,2) DEFAULT 100.0,
    estado_universidad character varying(20) DEFAULT 'ACTIVO'::character varying,
    ciclo_actual integer DEFAULT 1,
    fecha_registro date DEFAULT CURRENT_DATE,
    CONSTRAINT estudiantes_ciclo_actual_check CHECK (((ciclo_actual >= 1) AND (ciclo_actual <= 10))),
    CONSTRAINT estudiantes_edad_check CHECK (((edad >= 18) AND (edad <= 50)))
);


ALTER TABLE public.estudiantes OWNER TO postgres;

--
-- Name: estudiantes_id_estudiante_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.estudiantes_id_estudiante_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.estudiantes_id_estudiante_seq OWNER TO postgres;

--
-- Name: estudiantes_id_estudiante_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.estudiantes_id_estudiante_seq OWNED BY public.estudiantes.id_estudiante;


--
-- Name: pagos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pagos (
    id_pago integer NOT NULL,
    id_prestamo integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    cuota_numero integer NOT NULL,
    metodo_pago character varying(30) DEFAULT 'EFECTIVO'::character varying,
    fecha_pago date DEFAULT CURRENT_DATE,
    estado character varying(20) DEFAULT 'Completado'::character varying,
    CONSTRAINT pagos_monto_check CHECK ((monto > (0)::numeric))
);


ALTER TABLE public.pagos OWNER TO postgres;

--
-- Name: pagos_id_pago_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pagos_id_pago_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pagos_id_pago_seq OWNER TO postgres;

--
-- Name: pagos_id_pago_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pagos_id_pago_seq OWNED BY public.pagos.id_pago;


--
-- Name: prestamos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prestamos (
    id_prestamo integer NOT NULL,
    id_estudiante integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    cuotas integer NOT NULL,
    tasa_interes numeric(5,2) DEFAULT 10.00,
    saldo numeric(10,2) NOT NULL,
    estado character varying(20) DEFAULT 'Activo'::character varying,
    fecha_inicio date DEFAULT CURRENT_DATE,
    dias_mora integer DEFAULT 0 NOT NULL,
    interes_mora numeric(10,2) DEFAULT 0.00 NOT NULL,
    codigo_qr bytea,
    CONSTRAINT prestamos_cuotas_check CHECK (((cuotas >= 1) AND (cuotas <= 24)))
);


ALTER TABLE public.prestamos OWNER TO postgres;

--
-- Name: prestamos_id_prestamo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prestamos_id_prestamo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prestamos_id_prestamo_seq OWNER TO postgres;

--
-- Name: prestamos_id_prestamo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prestamos_id_prestamo_seq OWNED BY public.prestamos.id_prestamo;


--
-- Name: solicitudes_prestamo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitudes_prestamo (
    id_solicitud integer NOT NULL,
    id_estudiante integer NOT NULL,
    monto_solicitado numeric(10,2) NOT NULL,
    cuotas_solicitadas integer NOT NULL,
    fecha_solicitud date DEFAULT CURRENT_DATE,
    estado_solicitud character varying(20) DEFAULT 'PENDIENTE'::character varying,
    recomendacion_sistema character varying(30) DEFAULT 'SIN EVALUAR'::character varying,
    observacion character varying(255),
    atendido_por character varying(50) DEFAULT 'ASISTENTE'::character varying,
    CONSTRAINT solicitudes_prestamo_cuotas_solicitadas_check CHECK (((cuotas_solicitadas >= 1) AND (cuotas_solicitadas <= 24)))
);


ALTER TABLE public.solicitudes_prestamo OWNER TO postgres;

--
-- Name: solicitudes_prestamo_id_solicitud_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.solicitudes_prestamo_id_solicitud_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.solicitudes_prestamo_id_solicitud_seq OWNER TO postgres;

--
-- Name: solicitudes_prestamo_id_solicitud_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.solicitudes_prestamo_id_solicitud_seq OWNED BY public.solicitudes_prestamo.id_solicitud;


--
-- Name: vista_solicitudes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_solicitudes AS
 SELECT s.id_solicitud,
    (((e.nombre)::text || ' '::text) || (e.apellido)::text) AS estudiante,
    e.dni,
    e.promedio_notas,
    e.porcentaje_asistencia,
    e.estado_universidad,
    s.monto_solicitado,
    s.cuotas_solicitadas,
    s.estado_solicitud,
    s.recomendacion_sistema,
    s.atendido_por,
    s.fecha_solicitud
   FROM (public.solicitudes_prestamo s
     JOIN public.estudiantes e ON ((s.id_estudiante = e.id_estudiante)));


ALTER VIEW public.vista_solicitudes OWNER TO postgres;

--
-- Name: boletas_digitales id_boleta; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boletas_digitales ALTER COLUMN id_boleta SET DEFAULT nextval('public.boletas_digitales_id_boleta_seq'::regclass);


--
-- Name: estudiantes id_estudiante; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estudiantes ALTER COLUMN id_estudiante SET DEFAULT nextval('public.estudiantes_id_estudiante_seq'::regclass);


--
-- Name: pagos id_pago; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos ALTER COLUMN id_pago SET DEFAULT nextval('public.pagos_id_pago_seq'::regclass);


--
-- Name: prestamos id_prestamo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamos ALTER COLUMN id_prestamo SET DEFAULT nextval('public.prestamos_id_prestamo_seq'::regclass);


--
-- Name: solicitudes_prestamo id_solicitud; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_prestamo ALTER COLUMN id_solicitud SET DEFAULT nextval('public.solicitudes_prestamo_id_solicitud_seq'::regclass);


--
-- Data for Name: boletas_digitales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.boletas_digitales (id_boleta, id_prestamo, id_estudiante, fecha_emision, qr_binario, monto_total) FROM stdin;
\.


--
-- Data for Name: estudiantes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.estudiantes (id_estudiante, dni, nombre, apellido, edad, telefono, correo, promedio_notas, porcentaje_asistencia, estado_universidad, ciclo_actual, fecha_registro) FROM stdin;
1	12345678	DIEGO	HUACHACA	21	987654321	diego.huachaca@utp.edu.pe	16.50	92.00	ACTIVO	5	2026-07-19
2	87654321	DIANA	APOLINARIO	20	912345678	diana.apolinario@utp.edu.pe	14.00	85.00	ACTIVO	4	2026-07-19
3	11223344	EDUARDO	CAMAC	22	956789012	eduardo.camac@utp.edu.pe	10.00	65.00	ALERTA	6	2026-07-19
4	99887766	MARIA	QUISPE	19	945678901	maria.quispe@utp.edu.pe	18.00	98.00	ACTIVO	3	2026-07-19
5	55443322	CARLOS	RAMOS	23	934567890	carlos.ramos@utp.edu.pe	8.50	55.00	RETIRADO	7	2026-07-19
6	33221100	LUCIA	TORRES	21	923456789	lucia.torres@utp.edu.pe	15.50	88.00	ACTIVO	5	2026-07-19
7	44332211	JOSE	VILLANUEVA	24	967890123	jose.villanueva@utp.edu.pe	13.00	79.00	ACTIVO	8	2026-07-19
8	66554433	ANDREA	FLORES	20	978901234	andrea.flores@utp.edu.pe	17.50	95.00	ACTIVO	4	2026-07-19
9	77665544	ROBERTO	MENDOZA	25	989012345	roberto.mendoza@utp.edu.pe	9.50	60.00	ALERTA	9	2026-07-19
10	88776655	VALERIA	GUTIERREZ	19	990123456	valeria.gutierrez@utp.edu.pe	19.00	99.00	ACTIVO	2	2026-07-19
11	22110099	MIGUEL	SALCEDO	22	901234567	miguel.salcedo@utp.edu.pe	11.50	72.00	ACTIVO	6	2026-07-19
12	10293847	FERNANDA	PAREDES	21	913579246	fernanda.paredes@utp.edu.pe	12.50	81.00	ACTIVO	5	2026-07-19
13	71234569	ALEJANDRO	CASTRO	26	922334455	alejandro.castro@utp.edu.pe	14.50	88.00	ACTIVO	10	2026-07-19
14	72345670	SOFIA	ROJAS	18	933445566	sofia.rojas@utp.edu.pe	16.00	96.00	ACTIVO	1	2026-07-19
15	73456781	GABRIEL	VARGAS	20	944556677	gabriel.vargas@utp.edu.pe	10.50	68.00	ALERTA	3	2026-07-19
16	74567892	CAMILA	ESPINOZA	21	955667788	camila.espinoza@utp.edu.pe	17.00	94.00	ACTIVO	7	2026-07-19
17	75678903	LEONARDO	HUAMAN	24	966778899	leonardo.huaman@utp.edu.pe	9.00	50.00	RETIRADO	8	2026-07-19
18	76789014	ISABELLA	CONDORI	22	977889900	isabella.condori@utp.edu.pe	15.00	90.00	ACTIVO	6	2026-07-19
19	77890125	SEBASTIAN	MAMANI	23	988990011	sebastian.mamani@utp.edu.pe	13.50	82.00	ACTIVO	7	2026-07-19
20	78901236	DANIELA	CHAVEZ	19	999001122	daniela.chavez@utp.edu.pe	18.50	97.00	ACTIVO	2	2026-07-19
\.


--
-- Data for Name: pagos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pagos (id_pago, id_prestamo, monto, cuota_numero, metodo_pago, fecha_pago, estado) FROM stdin;
1	1	458.33	1	YAPE	2026-07-19	Completado
2	1	458.33	2	TRANSFERENCIA BCP	2026-07-19	Completado
3	1	458.33	3	YAPE	2026-07-19	Completado
4	2	366.67	1	YAPE	2026-07-19	Completado
5	3	366.67	1	PLIN	2026-07-19	Completado
6	3	366.67	2	PLIN	2026-07-19	Completado
7	4	275.00	1	TRANSFERENCIA BCP	2026-07-19	Completado
8	5	440.00	1	TRANSFERENCIA BCP	2026-07-19	Completado
9	5	440.00	2	PAGOEFECTIVO	2026-07-19	Completado
10	6	366.67	1	TRANSFERENCIA BCP	2026-07-19	Completado
11	7	412.50	1	YAPE	2026-07-19	Completado
12	7	412.50	2	PAGOEFECTIVO	2026-07-19	Completado
13	8	275.00	1	YAPE	2026-07-19	Completado
14	9	229.17	1	PLIN	2026-07-19	Completado
15	10	275.00	1	TRANSFERENCIA BCP	2026-07-19	Completado
16	11	458.33	1	YAPE	2026-07-19	Completado
17	11	458.33	2	YAPE	2026-07-19	Completado
18	11	458.33	3	YAPE	2026-07-19	Completado
19	11	458.33	4	PLIN	2026-07-19	Completado
20	11	458.33	5	PLIN	2026-07-19	Completado
21	11	458.33	6	PLIN	2026-07-19	Completado
22	11	458.33	7	TRANSFERENCIA BCP	2026-07-19	Completado
23	11	458.33	8	TRANSFERENCIA BCP	2026-07-19	Completado
24	11	458.33	9	TRANSFERENCIA BCP	2026-07-19	Completado
25	11	458.33	10	PAGOEFECTIVO	2026-07-19	Completado
26	11	458.33	11	PAGOEFECTIVO	2026-07-19	Completado
27	11	458.41	12	PAGOEFECTIVO	2026-07-19	Completado
28	13	320.83	1	YAPE	2026-07-19	Completado
29	14	550.00	1	YAPE	2026-07-19	Completado
30	14	550.00	2	PLIN	2026-07-19	Completado
31	14	550.00	3	TRANSFERENCIA BCP	2026-07-19	Completado
\.


--
-- Data for Name: prestamos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prestamos (id_prestamo, id_estudiante, monto, cuotas, tasa_interes, saldo, estado, fecha_inicio, dias_mora, interes_mora, codigo_qr) FROM stdin;
1	1	5000.00	12	10.00	5500.00	Activo	2026-07-19	0	0.00	\N
2	1	1000.00	3	10.00	1100.00	Activo	2026-07-19	0	0.00	\N
3	2	2000.00	6	10.00	2200.00	Activo	2026-07-19	5	15.50	\N
4	3	3000.00	12	10.00	3300.00	Activo	2026-07-19	15	50.00	\N
5	4	4000.00	10	10.00	4400.00	Activo	2026-07-19	0	0.00	\N
6	5	6000.00	18	10.00	6600.00	Activo	2026-07-19	45	180.00	\N
7	6	3000.00	8	10.00	3300.00	Activo	2026-07-19	0	0.00	\N
8	7	1500.00	6	10.00	1650.00	Activo	2026-07-19	12	45.00	\N
9	8	5000.00	24	10.00	5500.00	Activo	2026-07-19	0	0.00	\N
10	9	2000.00	8	10.00	2200.00	Activo	2026-07-19	5	20.00	\N
11	10	5000.00	12	10.00	0.00	Pagado	2026-07-19	0	0.00	\N
12	11	2500.00	6	10.00	2750.00	Activo	2026-07-19	0	0.00	\N
13	13	3500.00	12	10.00	3850.00	Activo	2026-07-19	0	0.00	\N
14	16	1500.00	3	10.00	0.00	Pagado	2026-07-19	0	0.00	\N
15	18	2000.00	6	10.00	2200.00	Activo	2026-07-19	0	0.00	\N
\.


--
-- Data for Name: solicitudes_prestamo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitudes_prestamo (id_solicitud, id_estudiante, monto_solicitado, cuotas_solicitadas, fecha_solicitud, estado_solicitud, recomendacion_sistema, observacion, atendido_por) FROM stdin;
16	1	3000.00	6	2026-07-19	PENDIENTE	Aprobacion Recomendada	Promedio 16.5, asistencia 92%	ASISTENTE
17	2	2000.00	12	2026-07-19	PENDIENTE	Revision Manual	Asistencia justa: 85%	ASISTENTE
18	3	1500.00	6	2026-07-19	PENDIENTE	Denegacion Recomendada	Promedio bajo y asistencia 65%	ASISTENTE
19	4	5000.00	24	2026-07-19	APROBADO	Aprobacion Recomendada	Promedio 18.0, asistencia 98%	ASISTENTE
20	6	3000.00	8	2026-07-19	APROBADO	Aprobacion Recomendada	Cumple todos los criterios	ASISTENTE
21	7	1500.00	6	2026-07-19	PENDIENTE	Revision Manual	Asistencia 79%, revisar manualmente	ASISTENTE
22	8	5000.00	12	2026-07-19	APROBADO	Aprobacion Recomendada	Promedio 17.5, sin deuda previa	ASISTENTE
23	9	1000.00	3	2026-07-19	DENEGADO	Denegacion Recomendada	Promedio 9.5 y asistencia 60%	ASISTENTE
24	10	5000.00	12	2026-07-19	APROBADO	Aprobacion Recomendada	Promedio 19.0, pago prestamo anterior	ASISTENTE
25	11	2500.00	6	2026-07-19	PENDIENTE	Revision Manual	Promedio 11.5, asistencia limite 72%	ASISTENTE
26	12	2000.00	8	2026-07-19	ESCALADO	Revision Manual	Caso especial, enviado al admin	ASISTENTE
27	13	1000.00	3	2026-07-19	APROBADO	Aprobacion Recomendada	Estudiante de decimo ciclo, fiable	ASISTENTE
28	15	2500.00	12	2026-07-19	DENEGADO	Denegacion Recomendada	Asistencia 68%, riesgo alto	ASISTENTE
29	17	4000.00	24	2026-07-19	DENEGADO	Denegacion Recomendada	Estudiante retirado, no elegible	SISTEMA
30	20	1500.00	6	2026-07-19	APROBADO	Aprobacion Recomendada	Excelente promedio 18.5	ASISTENTE
\.


--
-- Name: boletas_digitales_id_boleta_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.boletas_digitales_id_boleta_seq', 1, false);


--
-- Name: estudiantes_id_estudiante_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estudiantes_id_estudiante_seq', 20, true);


--
-- Name: pagos_id_pago_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pagos_id_pago_seq', 31, true);


--
-- Name: prestamos_id_prestamo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prestamos_id_prestamo_seq', 15, true);


--
-- Name: solicitudes_prestamo_id_solicitud_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.solicitudes_prestamo_id_solicitud_seq', 30, true);


--
-- Name: boletas_digitales boletas_digitales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boletas_digitales
    ADD CONSTRAINT boletas_digitales_pkey PRIMARY KEY (id_boleta);


--
-- Name: estudiantes estudiantes_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estudiantes
    ADD CONSTRAINT estudiantes_dni_key UNIQUE (dni);


--
-- Name: estudiantes estudiantes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estudiantes
    ADD CONSTRAINT estudiantes_pkey PRIMARY KEY (id_estudiante);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id_pago);


--
-- Name: prestamos prestamos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamos
    ADD CONSTRAINT prestamos_pkey PRIMARY KEY (id_prestamo);


--
-- Name: solicitudes_prestamo solicitudes_prestamo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_prestamo
    ADD CONSTRAINT solicitudes_prestamo_pkey PRIMARY KEY (id_solicitud);


--
-- Name: boletas_digitales boletas_digitales_id_estudiante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boletas_digitales
    ADD CONSTRAINT boletas_digitales_id_estudiante_fkey FOREIGN KEY (id_estudiante) REFERENCES public.estudiantes(id_estudiante) ON DELETE CASCADE;


--
-- Name: boletas_digitales boletas_digitales_id_prestamo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boletas_digitales
    ADD CONSTRAINT boletas_digitales_id_prestamo_fkey FOREIGN KEY (id_prestamo) REFERENCES public.prestamos(id_prestamo) ON DELETE CASCADE;


--
-- Name: pagos pagos_id_prestamo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_id_prestamo_fkey FOREIGN KEY (id_prestamo) REFERENCES public.prestamos(id_prestamo) ON DELETE CASCADE;


--
-- Name: prestamos prestamos_id_estudiante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamos
    ADD CONSTRAINT prestamos_id_estudiante_fkey FOREIGN KEY (id_estudiante) REFERENCES public.estudiantes(id_estudiante) ON DELETE CASCADE;


--
-- Name: solicitudes_prestamo solicitudes_prestamo_id_estudiante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_prestamo
    ADD CONSTRAINT solicitudes_prestamo_id_estudiante_fkey FOREIGN KEY (id_estudiante) REFERENCES public.estudiantes(id_estudiante) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict PcPPONf6QgL0pnNvaVZMVzxO4ejdQ6mdoGaSzcvgRYgU6JtAFmWIYaLVbxFE1DH

