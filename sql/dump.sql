--
-- PostgreSQL database dump
--

\restrict fWgBfQcl3QXcDLcxW4IWMS9A2KRvR8zANBLzNYeRdVwIZd3M4ydiq6uzoAzuTLw

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2026-03-10 20:33:04

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

DROP DATABASE avaliacoes;
--
-- TOC entry 5055 (class 1262 OID 16398)
-- Name: avaliacoes; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE avaliacoes WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Portuguese_Brazil.1252';


ALTER DATABASE avaliacoes OWNER TO postgres;

\unrestrict fWgBfQcl3QXcDLcxW4IWMS9A2KRvR8zANBLzNYeRdVwIZd3M4ydiq6uzoAzuTLw
\connect avaliacoes
\restrict fWgBfQcl3QXcDLcxW4IWMS9A2KRvR8zANBLzNYeRdVwIZd3M4ydiq6uzoAzuTLw

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

--
-- TOC entry 6 (class 2615 OID 16399)
-- Name: dados; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA dados;


ALTER SCHEMA dados OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 16506)
-- Name: feedback; Type: TABLE; Schema: dados; Owner: postgres
--

CREATE TABLE dados.feedback (
    id smallint NOT NULL,
    descricao character varying,
    id_respostas character varying,
    ativo boolean DEFAULT true NOT NULL
);


ALTER TABLE dados.feedback OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16529)
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: dados; Owner: postgres
--

CREATE SEQUENCE dados.feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE dados.feedback_id_seq OWNER TO postgres;

--
-- TOC entry 5056 (class 0 OID 0)
-- Dependencies: 228
-- Name: feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: dados; Owner: postgres
--

ALTER SEQUENCE dados.feedback_id_seq OWNED BY dados.feedback.id;


--
-- TOC entry 221 (class 1259 OID 16409)
-- Name: perguntas; Type: TABLE; Schema: dados; Owner: postgres
--

CREATE TABLE dados.perguntas (
    id bigint NOT NULL,
    descricao character varying NOT NULL,
    sala_id bigint CONSTRAINT perguntas_sala_not_null NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    ordem_exibicao integer DEFAULT 1 NOT NULL
);


ALTER TABLE dados.perguntas OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16502)
-- Name: perguntas_id_seq; Type: SEQUENCE; Schema: dados; Owner: postgres
--

CREATE SEQUENCE dados.perguntas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE dados.perguntas_id_seq OWNER TO postgres;

--
-- TOC entry 5057 (class 0 OID 0)
-- Dependencies: 225
-- Name: perguntas_id_seq; Type: SEQUENCE OWNED BY; Schema: dados; Owner: postgres
--

ALTER SEQUENCE dados.perguntas_id_seq OWNED BY dados.perguntas.id;


--
-- TOC entry 222 (class 1259 OID 16439)
-- Name: respostas; Type: TABLE; Schema: dados; Owner: postgres
--

CREATE TABLE dados.respostas (
    id integer NOT NULL,
    pergunta_id integer NOT NULL,
    sala_id integer NOT NULL,
    nota integer NOT NULL,
    data_hora timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id_respostas character varying,
    ativo boolean DEFAULT true NOT NULL,
    CONSTRAINT respostas_nota_check CHECK (((nota >= 0) AND (nota <= 10)))
);


ALTER TABLE dados.respostas OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16501)
-- Name: respostas_id_seq; Type: SEQUENCE; Schema: dados; Owner: postgres
--

CREATE SEQUENCE dados.respostas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE dados.respostas_id_seq OWNER TO postgres;

--
-- TOC entry 5058 (class 0 OID 0)
-- Dependencies: 224
-- Name: respostas_id_seq; Type: SEQUENCE OWNED BY; Schema: dados; Owner: postgres
--

ALTER SEQUENCE dados.respostas_id_seq OWNED BY dados.respostas.id;


--
-- TOC entry 220 (class 1259 OID 16400)
-- Name: salas; Type: TABLE; Schema: dados; Owner: postgres
--

CREATE TABLE dados.salas (
    id bigint NOT NULL,
    descricao character varying NOT NULL,
    ativo boolean DEFAULT true NOT NULL
);


ALTER TABLE dados.salas OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16500)
-- Name: salas_id_seq; Type: SEQUENCE; Schema: dados; Owner: postgres
--

CREATE SEQUENCE dados.salas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE dados.salas_id_seq OWNER TO postgres;

--
-- TOC entry 5059 (class 0 OID 0)
-- Dependencies: 223
-- Name: salas_id_seq; Type: SEQUENCE OWNED BY; Schema: dados; Owner: postgres
--

ALTER SEQUENCE dados.salas_id_seq OWNED BY dados.salas.id;


--
-- TOC entry 4881 (class 2604 OID 16530)
-- Name: feedback id; Type: DEFAULT; Schema: dados; Owner: postgres
--

ALTER TABLE ONLY dados.feedback ALTER COLUMN id SET DEFAULT nextval('dados.feedback_id_seq'::regclass);


--
-- TOC entry 4875 (class 2604 OID 16505)
-- Name: perguntas id; Type: DEFAULT; Schema: dados; Owner: postgres
--

ALTER TABLE ONLY dados.perguntas ALTER COLUMN id SET DEFAULT nextval('dados.perguntas_id_seq'::regclass);


--
-- TOC entry 4878 (class 2604 OID 16504)
-- Name: respostas id; Type: DEFAULT; Schema: dados; Owner: postgres
--

ALTER TABLE ONLY dados.respostas ALTER COLUMN id SET DEFAULT nextval('dados.respostas_id_seq'::regclass);


--
-- TOC entry 4873 (class 2604 OID 16503)
-- Name: salas id; Type: DEFAULT; Schema: dados; Owner: postgres
--

ALTER TABLE ONLY dados.salas ALTER COLUMN id SET DEFAULT nextval('dados.salas_id_seq'::regclass);


--
-- TOC entry 5048 (class 0 OID 16506)
-- Dependencies: 226
-- Data for Name: feedback; Type: TABLE DATA; Schema: dados; Owner: postgres
--

INSERT INTO dados.feedback VALUES (1, 'teettetete', '1762899970255', true);
INSERT INTO dados.feedback VALUES (2, '', '1762901376489', true);
INSERT INTO dados.feedback VALUES (5, 'Teste', '1763079177270', true);
INSERT INTO dados.feedback VALUES (6, 'Poderiam oferecer arroz e feijão', '1763905456997', true);
INSERT INTO dados.feedback VALUES (7, 'Muito bom', '1764889608243', true);


--
-- TOC entry 5043 (class 0 OID 16409)
-- Dependencies: 221
-- Data for Name: perguntas; Type: TABLE DATA; Schema: dados; Owner: postgres
--

INSERT INTO dados.perguntas VALUES (1, 'Como você avalia o ambiente na Sala Alice (decoração, iluminação e conforto)?', 1, true, 1);
INSERT INTO dados.perguntas VALUES (2, 'Como você avalia o acesso ao buffet e às bebidas a partir da Sala Alice?', 1, true, 2);
INSERT INTO dados.perguntas VALUES (3, 'Como você avalia nossos painéis e pinturas para fotos na Sala?', 1, true, 3);
INSERT INTO dados.perguntas VALUES (5, 'Como você avalia a limpeza e organização na Sala ?', 1, true, 4);
INSERT INTO dados.perguntas VALUES (6, 'Como você avalia nosso atendimento?', 1, true, 5);
INSERT INTO dados.perguntas VALUES (8, 'Como você avalia a qualidade da nossa comida?', 1, true, 6);
INSERT INTO dados.perguntas VALUES (10, 'Como você avalia nossa variedade de opções (doces, salgados, bebidas)?', 1, true, 7);
INSERT INTO dados.perguntas VALUES (12, 'Como você avalia o tempo de espera nas filas?', 1, true, 8);
INSERT INTO dados.perguntas VALUES (9, 'Como você avalia as bebidas (chopp, café, sucos)?', 1, true, 9);
INSERT INTO dados.perguntas VALUES (4, 'Quão confortável é o ambiente em relação ao ruído?', 1, true, 10);
INSERT INTO dados.perguntas VALUES (7, 'Como você avalia nosso ambiente em geral?', 1, true, 11);
INSERT INTO dados.perguntas VALUES (11, 'Como você avalia sua satisfação geral?', 1, true, 12);
INSERT INTO dados.perguntas VALUES (34, 'teste', 3, false, 2);
INSERT INTO dados.perguntas VALUES (13, 'Como você avalia nossa sinalização e informações na Recepção?', 2, true, 1);
INSERT INTO dados.perguntas VALUES (14, 'Como você avalia o tempo de espera na Recepção?', 2, true, 2);
INSERT INTO dados.perguntas VALUES (16, 'Como você avalia nosso atendimento?', 2, true, 3);
INSERT INTO dados.perguntas VALUES (15, 'Como você avalia a limpeza e organização na Sala ?', 2, true, 4);
INSERT INTO dados.perguntas VALUES (19, 'Como você avalia as bebidas (chopp, café, sucos)?', 2, true, 5);
INSERT INTO dados.perguntas VALUES (20, 'Como você avalia nossa variedade de opções (doces, salgados, bebidas)?', 2, true, 6);
INSERT INTO dados.perguntas VALUES (22, 'Como você avalia o tempo de espera nas filas?', 2, true, 7);
INSERT INTO dados.perguntas VALUES (18, 'Como você avalia a qualidade da nossa comida?', 2, true, 8);
INSERT INTO dados.perguntas VALUES (17, 'Como você avalia nosso ambiente em geral?', 2, true, 9);
INSERT INTO dados.perguntas VALUES (21, 'Como você avalia sua satisfação geral?', 2, true, 10);
INSERT INTO dados.perguntas VALUES (23, 'Como você avalia o ambiente na Sala dos Fundos (decoração, conforto e proximidade ao buffet)?', 3, true, 1);
INSERT INTO dados.perguntas VALUES (24, 'Como você avalia o acesso ao buffet e às bebidas a partir da Sala dos Fundos?', 3, true, 2);
INSERT INTO dados.perguntas VALUES (26, 'Como você avalia a limpeza e organização na Sala ?', 3, true, 3);
INSERT INTO dados.perguntas VALUES (29, 'Como você avalia a qualidade da nossa comida?', 3, true, 4);
INSERT INTO dados.perguntas VALUES (30, 'Como você avalia as bebidas (chopp, café, sucos)?', 3, true, 5);
INSERT INTO dados.perguntas VALUES (31, 'Como você avalia nossa variedade de opções (doces, salgados, bebidas)?', 3, true, 6);
INSERT INTO dados.perguntas VALUES (33, 'Como você avalia o tempo de espera nas filas?', 3, true, 7);
INSERT INTO dados.perguntas VALUES (27, 'Como você avalia nosso atendimento?', 3, true, 8);
INSERT INTO dados.perguntas VALUES (25, 'Quão confortável é o ambiente em relação ao ruído?', 3, true, 9);
INSERT INTO dados.perguntas VALUES (28, 'Como você avalia nosso ambiente em geral?', 3, true, 10);
INSERT INTO dados.perguntas VALUES (32, 'Como você avalia sua satisfação geral?', 3, true, 11);


--
-- TOC entry 5044 (class 0 OID 16439)
-- Dependencies: 222
-- Data for Name: respostas; Type: TABLE DATA; Schema: dados; Owner: postgres
--

INSERT INTO dados.respostas VALUES (1, 23, 3, 6, '2025-11-06 02:11:20.816', NULL, true);
INSERT INTO dados.respostas VALUES (2, 24, 3, 4, '2025-11-06 02:11:20.816', NULL, true);
INSERT INTO dados.respostas VALUES (3, 25, 3, 8, '2025-11-06 02:11:20.816', NULL, true);
INSERT INTO dados.respostas VALUES (4, 26, 3, 3, '2025-11-06 02:11:20.816', NULL, true);
INSERT INTO dados.respostas VALUES (5, 27, 3, 6, '2025-11-06 02:11:20.816', NULL, true);
INSERT INTO dados.respostas VALUES (6, 28, 3, 7, '2025-11-06 02:11:20.816', NULL, true);
INSERT INTO dados.respostas VALUES (7, 29, 3, 6, '2025-11-06 02:11:20.816', NULL, true);
INSERT INTO dados.respostas VALUES (8, 30, 3, 5, '2025-11-06 02:11:20.816', NULL, true);
INSERT INTO dados.respostas VALUES (9, 31, 3, 4, '2025-11-06 02:11:20.816', NULL, true);
INSERT INTO dados.respostas VALUES (10, 32, 3, 5, '2025-11-06 02:11:20.816', NULL, true);
INSERT INTO dados.respostas VALUES (11, 33, 3, 7, '2025-11-06 02:11:20.816', NULL, true);
INSERT INTO dados.respostas VALUES (443, 13, 2, 7, '2025-11-14 00:12:57.27', '1763079177270', true);
INSERT INTO dados.respostas VALUES (444, 14, 2, 9, '2025-11-14 00:12:57.27', '1763079177270', true);
INSERT INTO dados.respostas VALUES (445, 15, 2, 7, '2025-11-14 00:12:57.27', '1763079177270', true);
INSERT INTO dados.respostas VALUES (446, 16, 2, 5, '2025-11-14 00:12:57.27', '1763079177270', true);
INSERT INTO dados.respostas VALUES (447, 17, 2, 8, '2025-11-14 00:12:57.27', '1763079177270', true);
INSERT INTO dados.respostas VALUES (448, 18, 2, 6, '2025-11-14 00:12:57.27', '1763079177270', true);
INSERT INTO dados.respostas VALUES (449, 19, 2, 6, '2025-11-14 00:12:57.27', '1763079177270', true);
INSERT INTO dados.respostas VALUES (450, 20, 2, 10, '2025-11-14 00:12:57.27', '1763079177270', true);
INSERT INTO dados.respostas VALUES (451, 21, 2, 5, '2025-11-14 00:12:57.27', '1763079177270', true);
INSERT INTO dados.respostas VALUES (452, 22, 2, 8, '2025-11-14 00:12:57.27', '1763079177270', true);
INSERT INTO dados.respostas VALUES (453, 13, 2, 8, '2025-11-14 00:26:26.598', '1763079986597', true);
INSERT INTO dados.respostas VALUES (454, 14, 2, 8, '2025-11-14 00:26:26.598', '1763079986597', true);
INSERT INTO dados.respostas VALUES (455, 15, 2, 8, '2025-11-14 00:26:26.598', '1763079986597', true);
INSERT INTO dados.respostas VALUES (456, 16, 2, 8, '2025-11-14 00:26:26.598', '1763079986597', true);
INSERT INTO dados.respostas VALUES (457, 17, 2, 8, '2025-11-14 00:26:26.598', '1763079986597', true);
INSERT INTO dados.respostas VALUES (458, 18, 2, 8, '2025-11-14 00:26:26.598', '1763079986597', true);
INSERT INTO dados.respostas VALUES (459, 19, 2, 8, '2025-11-14 00:26:26.598', '1763079986597', true);
INSERT INTO dados.respostas VALUES (460, 20, 2, 8, '2025-11-14 00:26:26.598', '1763079986597', true);
INSERT INTO dados.respostas VALUES (461, 21, 2, 8, '2025-11-14 00:26:26.598', '1763079986597', true);
INSERT INTO dados.respostas VALUES (462, 22, 2, 8, '2025-11-14 00:26:26.598', '1763079986597', true);
INSERT INTO dados.respostas VALUES (463, 23, 3, 7, '2025-11-23 13:44:16.998', '1763905456997', true);
INSERT INTO dados.respostas VALUES (464, 24, 3, 9, '2025-11-23 13:44:16.999', '1763905456997', true);
INSERT INTO dados.respostas VALUES (465, 25, 3, 4, '2025-11-23 13:44:16.999', '1763905456997', true);
INSERT INTO dados.respostas VALUES (466, 26, 3, 8, '2025-11-23 13:44:16.999', '1763905456997', true);
INSERT INTO dados.respostas VALUES (467, 27, 3, 9, '2025-11-23 13:44:16.999', '1763905456997', true);
INSERT INTO dados.respostas VALUES (468, 28, 3, 8, '2025-11-23 13:44:16.999', '1763905456997', true);
INSERT INTO dados.respostas VALUES (469, 29, 3, 10, '2025-11-23 13:44:16.999', '1763905456997', true);
INSERT INTO dados.respostas VALUES (470, 30, 3, 10, '2025-11-23 13:44:16.999', '1763905456997', true);
INSERT INTO dados.respostas VALUES (471, 31, 3, 10, '2025-11-23 13:44:16.999', '1763905456997', true);
INSERT INTO dados.respostas VALUES (472, 32, 3, 8, '2025-11-23 13:44:16.999', '1763905456997', true);
INSERT INTO dados.respostas VALUES (473, 33, 3, 8, '2025-11-23 13:44:16.999', '1763905456997', true);
INSERT INTO dados.respostas VALUES (474, 1, 1, 7, '2025-11-23 14:14:59.973', '1763907299972', true);
INSERT INTO dados.respostas VALUES (475, 2, 1, 6, '2025-11-23 14:14:59.973', '1763907299972', true);
INSERT INTO dados.respostas VALUES (476, 3, 1, 6, '2025-11-23 14:14:59.973', '1763907299972', true);
INSERT INTO dados.respostas VALUES (477, 5, 1, 8, '2025-11-23 14:14:59.973', '1763907299972', true);
INSERT INTO dados.respostas VALUES (478, 6, 1, 5, '2025-11-23 14:14:59.973', '1763907299972', true);
INSERT INTO dados.respostas VALUES (479, 7, 1, 9, '2025-11-23 14:14:59.973', '1763907299972', true);
INSERT INTO dados.respostas VALUES (480, 8, 1, 10, '2025-11-23 14:14:59.973', '1763907299972', true);
INSERT INTO dados.respostas VALUES (481, 10, 1, 10, '2025-11-23 14:14:59.973', '1763907299972', true);
INSERT INTO dados.respostas VALUES (482, 11, 1, 9, '2025-11-23 14:14:59.973', '1763907299972', true);
INSERT INTO dados.respostas VALUES (483, 12, 1, 7, '2025-11-23 14:14:59.973', '1763907299972', true);
INSERT INTO dados.respostas VALUES (484, 9, 1, 10, '2025-11-23 14:14:59.973', '1763907299972', true);
INSERT INTO dados.respostas VALUES (485, 4, 1, 10, '2025-11-23 14:14:59.973', '1763907299972', true);
INSERT INTO dados.respostas VALUES (486, 1, 1, 3, '2025-11-23 15:16:45.983', '1763911005982', true);
INSERT INTO dados.respostas VALUES (487, 2, 1, 8, '2025-11-23 15:16:45.983', '1763911005982', true);
INSERT INTO dados.respostas VALUES (488, 3, 1, 7, '2025-11-23 15:16:45.983', '1763911005982', true);
INSERT INTO dados.respostas VALUES (489, 5, 1, 4, '2025-11-23 15:16:45.983', '1763911005982', true);
INSERT INTO dados.respostas VALUES (490, 6, 1, 7, '2025-11-23 15:16:45.983', '1763911005982', true);
INSERT INTO dados.respostas VALUES (491, 7, 1, 8, '2025-11-23 15:16:45.983', '1763911005982', true);
INSERT INTO dados.respostas VALUES (492, 8, 1, 9, '2025-11-23 15:16:45.983', '1763911005982', true);
INSERT INTO dados.respostas VALUES (493, 10, 1, 7, '2025-11-23 15:16:45.983', '1763911005982', true);
INSERT INTO dados.respostas VALUES (494, 11, 1, 8, '2025-11-23 15:16:45.983', '1763911005982', true);
INSERT INTO dados.respostas VALUES (495, 12, 1, 7, '2025-11-23 15:16:45.983', '1763911005982', true);
INSERT INTO dados.respostas VALUES (496, 9, 1, 9, '2025-11-23 15:16:45.983', '1763911005982', true);
INSERT INTO dados.respostas VALUES (497, 4, 1, 7, '2025-11-23 15:16:45.983', '1763911005982', true);
INSERT INTO dados.respostas VALUES (498, 23, 3, 8, '2025-11-23 16:27:17.455', '1763915237454', true);
INSERT INTO dados.respostas VALUES (499, 24, 3, 6, '2025-11-23 16:27:17.456', '1763915237454', true);
INSERT INTO dados.respostas VALUES (500, 26, 3, 10, '2025-11-23 16:27:17.456', '1763915237454', true);
INSERT INTO dados.respostas VALUES (501, 29, 3, 8, '2025-11-23 16:27:17.456', '1763915237454', true);
INSERT INTO dados.respostas VALUES (502, 30, 3, 7, '2025-11-23 16:27:17.456', '1763915237454', true);
INSERT INTO dados.respostas VALUES (503, 32, 3, 9, '2025-11-23 16:27:17.456', '1763915237454', true);
INSERT INTO dados.respostas VALUES (504, 31, 3, 7, '2025-11-23 16:27:17.456', '1763915237454', true);
INSERT INTO dados.respostas VALUES (505, 33, 3, 8, '2025-11-23 16:27:17.456', '1763915237454', true);
INSERT INTO dados.respostas VALUES (506, 27, 3, 7, '2025-11-23 16:27:17.456', '1763915237454', true);
INSERT INTO dados.respostas VALUES (507, 28, 3, 8, '2025-11-23 16:27:17.456', '1763915237454', true);
INSERT INTO dados.respostas VALUES (508, 25, 3, 8, '2025-11-23 16:27:17.456', '1763915237454', true);
INSERT INTO dados.respostas VALUES (509, 23, 3, 10, '2025-11-23 16:28:20.618', '1763915300617', true);
INSERT INTO dados.respostas VALUES (510, 24, 3, 8, '2025-11-23 16:28:20.618', '1763915300617', true);
INSERT INTO dados.respostas VALUES (511, 26, 3, 7, '2025-11-23 16:28:20.618', '1763915300617', true);
INSERT INTO dados.respostas VALUES (512, 29, 3, 10, '2025-11-23 16:28:20.618', '1763915300617', true);
INSERT INTO dados.respostas VALUES (513, 30, 3, 10, '2025-11-23 16:28:20.618', '1763915300617', true);
INSERT INTO dados.respostas VALUES (514, 32, 3, 8, '2025-11-23 16:28:20.618', '1763915300617', true);
INSERT INTO dados.respostas VALUES (515, 31, 3, 10, '2025-11-23 16:28:20.618', '1763915300617', true);
INSERT INTO dados.respostas VALUES (516, 33, 3, 3, '2025-11-23 16:28:20.618', '1763915300617', true);
INSERT INTO dados.respostas VALUES (517, 27, 3, 10, '2025-11-23 16:28:20.618', '1763915300617', true);
INSERT INTO dados.respostas VALUES (518, 28, 3, 10, '2025-11-23 16:28:20.618', '1763915300617', true);
INSERT INTO dados.respostas VALUES (519, 25, 3, 8, '2025-11-23 16:28:20.618', '1763915300617', true);
INSERT INTO dados.respostas VALUES (520, 13, 2, 5, '2025-11-27 02:04:10.008', '1764209050008', true);
INSERT INTO dados.respostas VALUES (521, 14, 2, 9, '2025-11-27 02:04:10.009', '1764209050008', true);
INSERT INTO dados.respostas VALUES (522, 16, 2, 8, '2025-11-27 02:04:10.009', '1764209050008', true);
INSERT INTO dados.respostas VALUES (523, 15, 2, 9, '2025-11-27 02:04:10.009', '1764209050008', true);
INSERT INTO dados.respostas VALUES (524, 19, 2, 7, '2025-11-27 02:04:10.009', '1764209050008', true);
INSERT INTO dados.respostas VALUES (525, 20, 2, 10, '2025-11-27 02:04:10.009', '1764209050008', true);
INSERT INTO dados.respostas VALUES (526, 22, 2, 7, '2025-11-27 02:04:10.009', '1764209050008', true);
INSERT INTO dados.respostas VALUES (527, 18, 2, 9, '2025-11-27 02:04:10.009', '1764209050008', true);
INSERT INTO dados.respostas VALUES (528, 21, 2, 7, '2025-11-27 02:04:10.009', '1764209050008', true);
INSERT INTO dados.respostas VALUES (529, 17, 2, 9, '2025-11-27 02:04:10.009', '1764209050008', true);
INSERT INTO dados.respostas VALUES (530, 13, 2, 7, '2025-11-27 17:38:54.031', '1764265134031', true);
INSERT INTO dados.respostas VALUES (531, 14, 2, 9, '2025-11-27 17:38:54.031', '1764265134031', true);
INSERT INTO dados.respostas VALUES (532, 16, 2, 8, '2025-11-27 17:38:54.031', '1764265134031', true);
INSERT INTO dados.respostas VALUES (533, 15, 2, 9, '2025-11-27 17:38:54.031', '1764265134031', true);
INSERT INTO dados.respostas VALUES (534, 19, 2, 7, '2025-11-27 17:38:54.031', '1764265134031', true);
INSERT INTO dados.respostas VALUES (535, 20, 2, 8, '2025-11-27 17:38:54.031', '1764265134031', true);
INSERT INTO dados.respostas VALUES (536, 22, 2, 7, '2025-11-27 17:38:54.031', '1764265134031', true);
INSERT INTO dados.respostas VALUES (537, 18, 2, 9, '2025-11-27 17:38:54.031', '1764265134031', true);
INSERT INTO dados.respostas VALUES (538, 17, 2, 8, '2025-11-27 17:38:54.031', '1764265134031', true);
INSERT INTO dados.respostas VALUES (539, 21, 2, 8, '2025-11-27 17:38:54.031', '1764265134031', true);
INSERT INTO dados.respostas VALUES (540, 13, 2, 9, '2025-12-04 23:06:48.243', '1764889608243', true);
INSERT INTO dados.respostas VALUES (541, 14, 2, 7, '2025-12-04 23:06:48.243', '1764889608243', true);
INSERT INTO dados.respostas VALUES (542, 16, 2, 7, '2025-12-04 23:06:48.243', '1764889608243', true);
INSERT INTO dados.respostas VALUES (543, 15, 2, 9, '2025-12-04 23:06:48.243', '1764889608243', true);
INSERT INTO dados.respostas VALUES (544, 19, 2, 5, '2025-12-04 23:06:48.243', '1764889608243', true);
INSERT INTO dados.respostas VALUES (545, 20, 2, 10, '2025-12-04 23:06:48.243', '1764889608243', true);
INSERT INTO dados.respostas VALUES (546, 22, 2, 5, '2025-12-04 23:06:48.243', '1764889608243', true);
INSERT INTO dados.respostas VALUES (547, 18, 2, 10, '2025-12-04 23:06:48.243', '1764889608243', true);
INSERT INTO dados.respostas VALUES (548, 17, 2, 8, '2025-12-04 23:06:48.243', '1764889608243', true);
INSERT INTO dados.respostas VALUES (549, 21, 2, 9, '2025-12-04 23:06:48.243', '1764889608243', true);
INSERT INTO dados.respostas VALUES (550, 13, 2, 8, '2025-12-04 23:19:18.532', '1764890358531', true);
INSERT INTO dados.respostas VALUES (551, 14, 2, 9, '2025-12-04 23:19:18.532', '1764890358531', true);
INSERT INTO dados.respostas VALUES (552, 16, 2, 7, '2025-12-04 23:19:18.532', '1764890358531', true);
INSERT INTO dados.respostas VALUES (553, 15, 2, 10, '2025-12-04 23:19:18.532', '1764890358531', true);
INSERT INTO dados.respostas VALUES (554, 19, 2, 7, '2025-12-04 23:19:18.532', '1764890358531', true);
INSERT INTO dados.respostas VALUES (555, 20, 2, 8, '2025-12-04 23:19:18.532', '1764890358531', true);
INSERT INTO dados.respostas VALUES (556, 22, 2, 6, '2025-12-04 23:19:18.532', '1764890358531', true);
INSERT INTO dados.respostas VALUES (557, 18, 2, 7, '2025-12-04 23:19:18.532', '1764890358531', true);
INSERT INTO dados.respostas VALUES (558, 17, 2, 4, '2025-12-04 23:19:18.532', '1764890358531', true);
INSERT INTO dados.respostas VALUES (559, 21, 2, 7, '2025-12-04 23:19:18.532', '1764890358531', true);


--
-- TOC entry 5042 (class 0 OID 16400)
-- Dependencies: 220
-- Data for Name: salas; Type: TABLE DATA; Schema: dados; Owner: postgres
--

INSERT INTO dados.salas VALUES (1, 'Sala Alice', true);
INSERT INTO dados.salas VALUES (2, 'Recepção', true);
INSERT INTO dados.salas VALUES (3, 'Sala dos Fundos', true);
INSERT INTO dados.salas VALUES (4, 'teste', false);


--
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 228
-- Name: feedback_id_seq; Type: SEQUENCE SET; Schema: dados; Owner: postgres
--

SELECT pg_catalog.setval('dados.feedback_id_seq', 7, true);


--
-- TOC entry 5061 (class 0 OID 0)
-- Dependencies: 225
-- Name: perguntas_id_seq; Type: SEQUENCE SET; Schema: dados; Owner: postgres
--

SELECT pg_catalog.setval('dados.perguntas_id_seq', 34, true);


--
-- TOC entry 5062 (class 0 OID 0)
-- Dependencies: 224
-- Name: respostas_id_seq; Type: SEQUENCE SET; Schema: dados; Owner: postgres
--

SELECT pg_catalog.setval('dados.respostas_id_seq', 559, true);


--
-- TOC entry 5063 (class 0 OID 0)
-- Dependencies: 223
-- Name: salas_id_seq; Type: SEQUENCE SET; Schema: dados; Owner: postgres
--

SELECT pg_catalog.setval('dados.salas_id_seq', 4, true);


--
-- TOC entry 4891 (class 2606 OID 16513)
-- Name: feedback feedback_pk; Type: CONSTRAINT; Schema: dados; Owner: postgres
--

ALTER TABLE ONLY dados.feedback
    ADD CONSTRAINT feedback_pk PRIMARY KEY (id);


--
-- TOC entry 4885 (class 2606 OID 16408)
-- Name: salas newtable_pk; Type: CONSTRAINT; Schema: dados; Owner: postgres
--

ALTER TABLE ONLY dados.salas
    ADD CONSTRAINT newtable_pk PRIMARY KEY (id);


--
-- TOC entry 4887 (class 2606 OID 16418)
-- Name: perguntas perguntas_pk; Type: CONSTRAINT; Schema: dados; Owner: postgres
--

ALTER TABLE ONLY dados.perguntas
    ADD CONSTRAINT perguntas_pk PRIMARY KEY (id);


--
-- TOC entry 4889 (class 2606 OID 16449)
-- Name: respostas respostas_pkey; Type: CONSTRAINT; Schema: dados; Owner: postgres
--

ALTER TABLE ONLY dados.respostas
    ADD CONSTRAINT respostas_pkey PRIMARY KEY (id);


--
-- TOC entry 4892 (class 2606 OID 16419)
-- Name: perguntas perguntas_salas_fk; Type: FK CONSTRAINT; Schema: dados; Owner: postgres
--

ALTER TABLE ONLY dados.perguntas
    ADD CONSTRAINT perguntas_salas_fk FOREIGN KEY (sala_id) REFERENCES dados.salas(id);


--
-- TOC entry 4893 (class 2606 OID 16450)
-- Name: respostas respostas_pergunta_id_fkey; Type: FK CONSTRAINT; Schema: dados; Owner: postgres
--

ALTER TABLE ONLY dados.respostas
    ADD CONSTRAINT respostas_pergunta_id_fkey FOREIGN KEY (pergunta_id) REFERENCES dados.perguntas(id);


--
-- TOC entry 4894 (class 2606 OID 16455)
-- Name: respostas respostas_sala_id_fkey; Type: FK CONSTRAINT; Schema: dados; Owner: postgres
--

ALTER TABLE ONLY dados.respostas
    ADD CONSTRAINT respostas_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES dados.salas(id);


-- Completed on 2026-03-10 20:33:04

--
-- PostgreSQL database dump complete
--

\unrestrict fWgBfQcl3QXcDLcxW4IWMS9A2KRvR8zANBLzNYeRdVwIZd3M4ydiq6uzoAzuTLw

