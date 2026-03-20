--
-- PostgreSQL database dump
--

\restrict 5qag32K4YjrHJUSsnwE3naAx3ENo8wapgt6jYgsjoo7pVhzgxTldhFAVacc35Mg

-- Dumped from database version 14.20 (Ubuntu 14.20-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.20 (Ubuntu 14.20-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.tests DROP CONSTRAINT IF EXISTS fk_users_tests;
ALTER TABLE IF EXISTS ONLY public.results DROP CONSTRAINT IF EXISTS fk_users_results;
ALTER TABLE IF EXISTS ONLY public.user_quota DROP CONSTRAINT IF EXISTS fk_user_quota_user;
ALTER TABLE IF EXISTS ONLY public.results DROP CONSTRAINT IF EXISTS fk_tests_results;
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS fk_tests_questions;
ALTER TABLE IF EXISTS ONLY public.test_invitations DROP CONSTRAINT IF EXISTS fk_test_invitations_test;
ALTER TABLE IF EXISTS ONLY public.test_invitations DROP CONSTRAINT IF EXISTS fk_test_invitations_inviter;
ALTER TABLE IF EXISTS ONLY public.test_invitations DROP CONSTRAINT IF EXISTS fk_test_invitations_guest_user;
ALTER TABLE IF EXISTS ONLY public.answers DROP CONSTRAINT IF EXISTS fk_questions_answers;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS fk_password_reset_tokens_user;
DROP INDEX IF EXISTS public.idx_users_username;
DROP INDEX IF EXISTS public.idx_users_email;
DROP INDEX IF EXISTS public.idx_users_deleted_at;
DROP INDEX IF EXISTS public.idx_user_test_status;
DROP INDEX IF EXISTS public.idx_user_quota_month_year;
DROP INDEX IF EXISTS public.idx_topics_is_predefined;
DROP INDEX IF EXISTS public.idx_topics_is_active;
DROP INDEX IF EXISTS public.idx_tests_title;
DROP INDEX IF EXISTS public.idx_tests_main_topic;
DROP INDEX IF EXISTS public.idx_tests_level;
DROP INDEX IF EXISTS public.idx_tests_is_active;
DROP INDEX IF EXISTS public.idx_test_invitations_token;
DROP INDEX IF EXISTS public.idx_test_invitations_test_id;
DROP INDEX IF EXISTS public.idx_test_invitations_is_used;
DROP INDEX IF EXISTS public.idx_test_invitations_guest_user_id;
DROP INDEX IF EXISTS public.idx_test_invitations_email;
DROP INDEX IF EXISTS public.idx_system_configs_key;
DROP INDEX IF EXISTS public.idx_sub_topic;
DROP INDEX IF EXISTS public.idx_specific_topic;
DROP INDEX IF EXISTS public.idx_results_user_updated;
DROP INDEX IF EXISTS public.idx_results_user_test_status;
DROP INDEX IF EXISTS public.idx_results_user_status;
DROP INDEX IF EXISTS public.idx_results_user_completed_time;
DROP INDEX IF EXISTS public.idx_results_updated;
DROP INDEX IF EXISTS public.idx_password_reset_tokens_user_id;
DROP INDEX IF EXISTS public.idx_password_reset_tokens_used;
DROP INDEX IF EXISTS public.idx_password_reset_tokens_token;
DROP INDEX IF EXISTS public.idx_main_topic;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_quota DROP CONSTRAINT IF EXISTS user_quota_pkey;
ALTER TABLE IF EXISTS ONLY public.topics DROP CONSTRAINT IF EXISTS topics_pkey;
ALTER TABLE IF EXISTS ONLY public.tests DROP CONSTRAINT IF EXISTS tests_pkey;
ALTER TABLE IF EXISTS ONLY public.test_invitations DROP CONSTRAINT IF EXISTS test_invitations_pkey;
ALTER TABLE IF EXISTS ONLY public.system_configs DROP CONSTRAINT IF EXISTS system_configs_pkey;
ALTER TABLE IF EXISTS ONLY public.results DROP CONSTRAINT IF EXISTS results_pkey;
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS questions_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.answers DROP CONSTRAINT IF EXISTS answers_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_quota ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.topics ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.test_invitations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_configs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.results ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.questions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.password_reset_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.answers ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.user_quota_id_seq;
DROP TABLE IF EXISTS public.user_quota;
DROP SEQUENCE IF EXISTS public.topics_id_seq;
DROP TABLE IF EXISTS public.topics;
DROP SEQUENCE IF EXISTS public.tests_id_seq;
DROP TABLE IF EXISTS public.tests;
DROP SEQUENCE IF EXISTS public.test_invitations_id_seq;
DROP TABLE IF EXISTS public.test_invitations;
DROP SEQUENCE IF EXISTS public.system_configs_id_seq;
DROP TABLE IF EXISTS public.system_configs;
DROP SEQUENCE IF EXISTS public.results_id_seq;
DROP TABLE IF EXISTS public.results;
DROP SEQUENCE IF EXISTS public.questions_id_seq;
DROP TABLE IF EXISTS public.questions;
DROP SEQUENCE IF EXISTS public.password_reset_tokens_id_seq;
DROP TABLE IF EXISTS public.password_reset_tokens;
DROP SEQUENCE IF EXISTS public.answers_id_seq;
DROP TABLE IF EXISTS public.answers;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.answers (
    id bigint NOT NULL,
    question_id bigint NOT NULL,
    answer_text text NOT NULL,
    is_correct boolean DEFAULT false
);


ALTER TABLE public.answers OWNER TO postgres;

--
-- Name: answers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.answers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.answers_id_seq OWNER TO postgres;

--
-- Name: answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.answers_id_seq OWNED BY public.answers.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    token character varying(64) NOT NULL,
    used boolean DEFAULT false,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.password_reset_tokens_id_seq OWNER TO postgres;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    id bigint NOT NULL,
    test_id bigint NOT NULL,
    question_text text NOT NULL
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.questions_id_seq OWNER TO postgres;

--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.results (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    test_id bigint NOT NULL,
    correct_answers bigint DEFAULT 0 NOT NULL,
    wrong_answers bigint DEFAULT 0 NOT NULL,
    time_taken bigint DEFAULT 0 NOT NULL,
    total_questions bigint DEFAULT 0,
    answered_questions bigint DEFAULT 0,
    status character varying(20) DEFAULT 'in_progress'::character varying,
    answers json,
    updated_at timestamp with time zone,
    started_at timestamp with time zone,
    CONSTRAINT chk_results_status CHECK (((status)::text = ANY ((ARRAY['in_progress'::character varying, 'completed'::character varying, 'expired'::character varying])::text[])))
);

ALTER TABLE public.results OWNER TO postgres;

--
-- Name: results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.results_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.results_id_seq OWNER TO postgres;

--
-- Name: results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.results_id_seq OWNED BY public.results.id;


--
-- Name: system_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_configs (
    id bigint NOT NULL,
    key character varying(100) NOT NULL,
    value text,
    description text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.system_configs OWNER TO postgres;

--
-- Name: system_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_configs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.system_configs_id_seq OWNER TO postgres;

--
-- Name: system_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_configs_id_seq OWNED BY public.system_configs.id;


--
-- Name: test_invitations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_invitations (
    id bigint NOT NULL,
    test_id bigint NOT NULL,
    invited_by bigint NOT NULL,
    message character varying(250),
    token character varying(64) NOT NULL,
    is_used boolean DEFAULT false,
    is_guest boolean DEFAULT false,
    guest_user_id bigint,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone
);


ALTER TABLE public.test_invitations OWNER TO postgres;

--
-- Name: test_invitations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_invitations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.test_invitations_id_seq OWNER TO postgres;

--
-- Name: test_invitations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_invitations_id_seq OWNED BY public.test_invitations.id;


--
-- Name: tests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tests (
    id bigint NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    created_by bigint NOT NULL,
    created_at timestamp with time zone,
    category text,
    level text,
    main_topic text DEFAULT 'General'::text NOT NULL,
    sub_topic text DEFAULT 'General'::text NOT NULL,
    specific_topic text DEFAULT 'General'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.tests OWNER TO postgres;

--
-- Name: tests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tests_id_seq OWNER TO postgres;

--
-- Name: tests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tests_id_seq OWNED BY public.tests.id;


--
-- Name: topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.topics (
    id bigint NOT NULL,
    main_topic character varying(255) NOT NULL,
    sub_topic character varying(255) NOT NULL,
    specific_topic character varying(255) NOT NULL,
    is_predefined boolean DEFAULT false NOT NULL
);


ALTER TABLE public.topics OWNER TO postgres;

--
-- Name: topics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.topics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.topics_id_seq OWNER TO postgres;

--
-- Name: topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.topics_id_seq OWNED BY public.topics.id;


--
-- Name: user_quota; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_quota (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    month_year character varying(7) NOT NULL,
    max_requests bigint DEFAULT 5 NOT NULL,
    used_requests bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.user_quota OWNER TO postgres;

--
-- Name: user_quota_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_quota_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_quota_id_seq OWNER TO postgres;

--
-- Name: user_quota_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_quota_id_seq OWNED BY public.user_quota.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying,
    registered_at timestamp with time zone,
    first_name character varying(50),
    last_name character varying(50),
    phone character varying(20),
    address text,
    birth_date date,
    country character varying(100),
    login_at timestamp with time zone,
    register_at timestamp with time zone,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_users_role CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'user'::character varying, 'guest'::character varying, 'deleted'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: answers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers ALTER COLUMN id SET DEFAULT nextval('public.answers_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- Name: results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.results ALTER COLUMN id SET DEFAULT nextval('public.results_id_seq'::regclass);


--
-- Name: system_configs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_configs ALTER COLUMN id SET DEFAULT nextval('public.system_configs_id_seq'::regclass);


--
-- Name: test_invitations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_invitations ALTER COLUMN id SET DEFAULT nextval('public.test_invitations_id_seq'::regclass);


--
-- Name: tests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tests ALTER COLUMN id SET DEFAULT nextval('public.tests_id_seq'::regclass);


--
-- Name: topics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics ALTER COLUMN id SET DEFAULT nextval('public.topics_id_seq'::regclass);


--
-- Name: user_quota id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_quota ALTER COLUMN id SET DEFAULT nextval('public.user_quota_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.answers (id, question_id, answer_text, is_correct) FROM stdin;
3950	1154	"Can I open the window?"	f
3951	1154	"Is it okay if I open the window?"	f
3952	1154	"Might I open the window?"	t
3953	1154	"Do you mind me opening the window?"	f
3954	1155	"Yes, I have."	t
3955	1155	"No, I have."	f
3956	1155	"Yes, I haven't."	f
3957	1155	"Indeed, I haven't."	f
3958	1156	"Can he have said that?"	f
3959	1156	"Could he have said that?"	t
3960	1156	"Might he said that?"	f
3961	1156	"Would he have said that?"	f
3962	1157	"I think you might be mistaken."	t
3963	1157	"You're completely wrong."	f
3964	1157	"Are you sure about that?" (with a sarcastic tone)	f
3965	1157	"That's not correct."	f
3966	1158	"No, thanks. I'm busy."	t
3967	1158	"I'm afraid I can't."	f
3968	1158	"I'd rather not."	f
3969	1158	"Unfortunately, I have a prior engagement."	f
3970	1159	"What?"	f
3971	1159	"Say that again."	f
3972	1159	"Sorry, I didn't catch your name."	t
3973	1159	"Pardon? What was your name?"	f
3974	1160	"No problem."	f
3975	1160	"You're welcome."	f
3976	1160	"It was my pleasure."	f
3977	1160	"The pleasure was entirely mine."	t
3978	1161	"amn't I"	f
3979	1161	"aren't I"	t
3980	1161	"isn't I"	f
3981	1161	"am I not"	f
3982	1162	"Will it rain tomorrow?"	f
3983	1162	"Is it going to rain tomorrow?"	f
753	232	1896	t
754	232	1856	f
755	232	1916	f
756	233	Atenas	t
757	233	Roma	f
758	233	París	f
759	234	Pierre de Coubertin	t
760	234	Jean-Marie Charles	f
761	234	Ludwig Guttmann	f
762	235	0	t
763	235	1	f
764	235	2	f
765	236	Continuación de los Juegos Olímpicos	f
766	236	Movimiento de resistencia contra la guerra	t
767	236	Cierre de los Juegos Olímpicos	f
768	237	1924	t
769	237	1914	f
770	237	1936	f
771	238	Chamonix	t
772	238	Garmisch-Partenkirchen	f
773	238	Lake Placid	f
774	239	James Connolly	t
775	239	Pierre de Coubertin	f
776	239	Jean-Marie Charles	f
777	240	15	t
778	240	20	f
779	240	25	f
780	241	Fomentar la competencia entre países	f
781	241	Promover la paz y la unidad entre naciones	t
782	241	Crear un evento deportivo para recaudar fondos	f
843	262	Proteínas y lípidos	f
844	262	Ácidos nucleicos y proteínas	t
845	262	Enzimas y carbohidratos	f
846	263	Crear energía a partir de la luz solar	f
847	263	Sintetizar proteínas y carbohidratos	t
848	263	Degradar moléculas orgánicas	f
849	264	Regula la temperatura corporal	f
850	264	Controla el tráfico de moléculas dentro y fuera de la célula	t
851	264	Produce energía para la célula	f
852	265	Fotósis	f
853	265	Respiración aeróbica	t
854	265	Fermentación	f
855	266	Membrana nuclear	f
856	266	Membrana plasmática	t
857	266	Membrana mitocondrial	f
858	267	Fotósis	f
859	267	Osmosis	f
860	267	Exocitosis	t
861	268	Célula animal	f
862	268	Célula vegetal	f
863	268	Célula procariota	t
864	269	Fermentación	f
865	269	Respiración anaeróbica	f
866	269	Síntesis proteica	t
867	270	Membrana nuclear	f
868	270	Membrana plasmática	f
869	270	Membrana citoplasmática	t
870	271	Osmosis	f
871	271	Diálogo	f
872	271	Endocitosis	t
1996	600	drink	t
1997	600	drinks	f
1998	600	drank	f
1999	601	will rain	f
2000	601	rains	t
2001	601	raining	f
2002	602	since	f
2003	602	for	t
2004	602	during	f
2005	603	give	t
2006	603	giving	f
2007	603	to give	f
2008	604	the more	f
3549	1044	Nose	f
3550	1044	Ear	f
2009	604	the most	t
2010	604	more	f
2011	605	have gone	f
2012	605	went	t
2013	605	are going	f
2014	606	can	f
2015	606	could	t
2016	606	will can	f
2017	607	wake	f
2018	607	waking	t
2019	607	woke	f
2020	608	a	f
3551	1044	Eye	t
3552	1044	Mouth	f
3553	1045	Toes	f
603	182	Es la capa exterior de la célula que la protege y regula lo que entra y sale.	t
604	182	Es el núcleo de la célula donde se encuentra el ADN.	f
605	182	Es el orgánulo que produce energía para la célula.	f
606	183	Es el proceso por el cual las células convierten los nutrientes en energía.	t
607	183	Es el proceso por el cual las células producen su propia energía.	f
608	183	Es el proceso por el cual las células se dividen y crecen.	f
609	184	Es el lugar donde se encuentran los orgánulos celulares.	t
610	184	Es el lugar donde se encuentran las membranas celulares.	f
611	184	Es el lugar donde se produce la energía para la célula.	f
612	185	Es una estructura especializada dentro de la célula que realiza una función específica.	t
613	185	Es una parte de la célula que se encarga de la reproducción.	f
614	185	Es una forma de célula que se encuentra en el cuerpo.	f
615	186	Es la molécula que contiene la información genética de la célula.	t
616	186	Es la molécula que produce energía para la célula.	f
617	186	Es la molécula que regula la temperatura del cuerpo.	f
618	187	Es el proceso por el cual las plantas producen energía a partir de la luz solar.	t
619	187	Es el proceso por el cual las células producen energía a partir de los nutrientes.	f
620	187	Es el proceso por el cual las células se dividen y crecen.	f
621	188	Es el proceso por el cual las células producen energía a partir del oxígeno.	t
622	188	Es el proceso por el cual las células producen energía a partir de la luz solar.	f
623	188	Es el proceso por el cual las células se dividen y crecen.	f
624	189	Es el orgánulo que produce energía para la célula.	t
625	189	Es el orgánulo que regula la temperatura del cuerpo.	f
626	189	Es el orgánulo que se encarga de la reproducción.	f
627	190	Es la capa que rodea el núcleo de la célula y regula lo que entra y sale.	t
628	190	Es el núcleo de la célula donde se encuentra el ADN.	f
629	190	Es el orgánulo que produce energía para la célula.	f
630	191	Es el proceso por el cual las células producen proteínas a partir de aminoácidos.	t
631	191	Es el proceso por el cual las células producen energía a partir de los nutrientes.	f
632	191	Es el proceso por el cual las células se dividen y crecen.	f
3984	1162	"Do you think it'll rain tomorrow?"	t
3985	1162	"It rains tomorrow, doesn't it?"	f
3986	1163	"Without a doubt..."	f
3987	1163	"It seems to me that..."	t
3988	1163	"The fact is..."	f
3989	1163	"I insist that..."	f
3990	1164	Strong agreement and encouragement.	f
3991	1164	Polite disagreement.	f
3992	1164	Sarcastic or humorous disagreement, suggesting what was said is very unlikely.	t
3993	1164	A request for clarification.	f
3994	1165	"where is the station"	f
3995	1165	"where the station is"	t
3996	1165	"where's the station"	f
3997	1165	"the station is where"	f
3998	1166	"Shut up and let me talk."	f
3999	1166	"If I may just interject..."	t
4000	1166	"No, that's stupid."	f
4001	1166	"Wait, I have something to say."	f
4002	1167	"I might be."	t
4003	1167	"I might be coming."	f
4004	1167	"I might."	f
4005	1167	"Might."	f
4006	1168	"In what manner?" - Formal	f
4007	1168	"Why?" - Informal	t
4008	1168	"When?" - Neutral	f
4009	1168	"How much?" - Colloquial	f
4010	1169	"I require you to print this document."	f
495	146	2008	f
4011	1169	"Would you mind printing this for me?"	t
4012	1169	"Print this, will you?"	f
4013	1169	"Can you be so kind as to possibly print this document?"	f
783	242	Definir el tamaño de la caja de un elemento	t
784	242	Establecer el alineamiento de un elemento	f
785	242	Configurar el color de fondo de un elemento	f
786	243	Usando la sintaxis :hover	f
787	243	Usando la sintaxis ::before	t
788	243	Usando la sintaxis ::after	f
789	244	Display: block es para elementos de bloque, display: inline es para elementos en línea	t
790	244	Display: block es para elementos en línea, display: inline es para elementos de bloque	f
791	244	Display: block es para elementos de bloque y en línea	f
792	245	Usando la propiedad max-width	t
793	245	Usando la propiedad width	f
794	245	Usando la propiedad padding	f
795	246	Define el ancho máximo de un elemento flexible	f
796	246	Define el ancho mínimo de un elemento flexible	f
797	246	Define el crecimiento de un elemento flexible	t
798	247	Usando la propiedad style	t
799	247	Usando la propiedad class	f
800	247	Usando la propiedad id	f
801	248	Define la alineación de los contenidos de un contenedor flexible	t
802	248	Define el ancho máximo de un contenedor flexible	f
803	248	Define el alto máximo de un contenedor flexible	f
804	249	Usando la propiedad min-height	t
805	249	Usando la propiedad height	f
806	249	Usando la propiedad padding	f
807	250	Define las columnas de un grid	t
808	250	Define las filas de un grid	f
633	192	Evaluar la belleza de la obra literaria	f
634	192	Análizar el contexto histórico y social de la obra	f
635	192	Interpretar y evaluar la obra literaria desde diferentes perspectivas	t
636	193	La novela que se desarrolla en un solo día	f
637	193	La novela que se centra en la biografía de un personaje histórico	f
638	193	La novela que se desarrolla en varios años y cubre varios temas	t
639	194	Proporcionar información sobre la vida del autor	f
640	194	Influenciar la opinión pública sobre la obra literaria	f
641	194	Ayudar a la comprensión y apreciación de la obra literaria	t
642	195	La forma en que el autor describe el entorno	f
643	195	La forma en que el autor cuenta la historia	t
644	195	La forma en que el autor describe a los personajes	f
645	196	Evaluar la originalidad de la obra literaria	f
646	196	Análizar la influencia de la cultura en la obra literaria	f
647	196	Ayudar a la comprensión y análisis de la obra literaria	t
648	197	La poesía que se centra en la descripción de la naturaleza	f
649	197	La poesía que se centra en las emociones y sentimientos del autor	t
650	197	La poesía que se centra en la historia y la biografía	f
651	198	Influenciar la opinión pública sobre la obra literaria	t
652	198	Proporcionar información sobre la vida del autor	f
653	198	Ayudar a la comprensión y apreciación de la obra literaria	f
654	199	La forma en que el autor describe el entorno	t
655	199	La forma en que el autor cuenta la historia	f
656	199	La forma en que el autor describe a los personajes	f
657	200	Evaluar la originalidad de la obra literaria	f
658	200	Análizar la influencia de la cultura en la obra literaria	t
659	200	Ayudar a la comprensión y análisis de la obra literaria	f
660	201	La novela que se desarrolla en varios años y cubre varios temas	f
661	201	La novela que se centra en la biografía de un personaje histórico	f
662	201	La novela que se desarrolla en un solo día y tiene un tema claro	t
809	250	Define el ancho máximo de un grid	f
810	251	Usando la pseudoclase :hover	t
811	251	Usando la pseudoclase :focus	f
812	251	Usando la pseudoclase :active	f
813	252	Define un efecto de transición para un elemento	t
814	252	Define un efecto de animación para un elemento	f
815	252	Define el alineamiento de un elemento	f
816	253	Usando la propiedad text-align	f
817	253	Usando la propiedad justify-content	f
818	253	Usando la propiedad align-items	t
819	254	Define la perspectiva de un elemento 3D	t
820	254	Define el alto máximo de un elemento	f
821	254	Define el ancho mínimo de un elemento	f
822	255	Usando la pseudoclase :active	t
823	255	Usando la pseudoclase :hover	f
824	255	Usando la pseudoclase :focus	f
825	256	Define la sombra de un elemento	t
826	256	Define el alineamiento de un elemento	f
827	256	Define el tamaño de un elemento	f
828	257	Usando la propiedad max-height	t
829	257	Usando la propiedad height	f
830	257	Usando la propiedad padding	f
831	258	Define la opacidad de un elemento	t
832	258	Define el alineamiento de un elemento	f
833	258	Define el tamaño de un elemento	f
834	259	Usando la pseudoclase :active	t
835	259	Usando la pseudoclase :hover	f
836	259	Usando la pseudoclase :focus	f
837	260	Define la selección de un elemento por el usuario	t
838	260	Define el alineamiento de un elemento	f
839	260	Define el tamaño de un elemento	f
840	261	Usando la propiedad min-width	t
4014	1170	"Did he not call?"	f
4015	1170	"Didn't he call?"	t
4016	1170	"He didn't call, no?"	f
4017	1170	"Wasn't his call made?"	f
4018	1171	To express strong disagreement.	f
4019	1171	To show you are adding similar or contrasting information about yourself.	f
4020	1171	To show agreement with a positive or negative statement made by someone else.	t
4021	1171	To change the subject.	f
4022	1172	"What for?"	t
4023	1172	"What about?"	f
4024	1172	"What if?"	f
4025	1172	"What of it?"	f
4026	1173	"Is the Pope Catholic?" (Meaning: Of course he is. Similarly, "Do you think I was born yesterday?" implies 'no, I'm not naive').	t
4027	1173	"What's your point?"	f
4028	1173	"Could you repeat the question?"	f
4029	1173	"Why wouldn't it be?"	f
4030	1174	"That's okay."	f
4031	1174	"Don't worry about it."	f
4032	1174	"We're just getting started."	t
4033	1174	"Apology accepted."	f
4034	1175	A polite request for clarification.	f
4035	1175	Disbelief, shock, or a request for repetition because what was heard was surprising.	t
2503	740	Dos años.	f
4036	1175	An offer of help.	f
4037	1175	Agreement.	f
4038	1176	"Who does want to see me?"	f
496	146	2010	t
4039	1176	"Who wants to see me?"	t
4040	1176	"Is it who that wants to see me?"	f
663	202	Integral de línea	f
664	202	Integral de superficie	t
665	202	Integral de volumen	f
666	203	z = f(x,y)	t
667	203	z = f(x,y,z)	f
668	203	x = f(y,z)	f
669	204	Método de integralación directa	t
670	204	Método de integralación por partes	f
671	204	Método de integralación por sustitución	f
672	205	r = f(θ)	t
673	205	r = f(x,y)	f
674	205	x = f(y,z)	f
675	206	Teorema de Green	f
676	206	Teorema de Stokes	f
677	206	Teorema de la Integral Fundamental	t
678	207	Integral de superficie	f
679	207	Integral de volumen	t
680	207	Integral de línea	f
681	208	r = f(θ,z)	t
682	208	r = f(x,y)	f
683	208	x = f(y,z)	f
684	209	Método de integralación directa	t
685	209	Método de integralación por partes	f
686	209	Método de integralación por sustitución	f
687	210	r = f(θ,φ)	t
688	210	r = f(x,y)	f
689	210	x = f(y,z)	f
690	211	Teorema de Gauss	t
691	211	Teorema de Green	f
692	211	Teorema de Stokes	f
693	212	Medir la efectividad de las políticas económicas	f
694	212	Proporcionar información para la toma de decisiones económicas	t
695	212	Analizar la estructura de las empresas	f
696	213	La cantidad total de bienes y servicios importados	f
697	213	La cantidad total de bienes y servicios producidos dentro de un país	t
698	213	La cantidad total de divisas extranjeras recibidas por un país	f
699	214	El aumento en el valor de un activo	f
700	214	El proceso de desgaste o deterioro de un activo	t
701	214	El proceso de compra de un nuevo activo	f
702	215	Un fondo que se utiliza para financiar proyectos de infraestructura	t
703	215	Un fondo que se utiliza para financiar la deuda pública	f
704	215	Un fondo que se utiliza para financiar la inversión en activos físicos	f
705	216	El PIB es la cantidad total de bienes y servicios producidos, mientras que el PIB per cápita es la cantidad de bienes y servicios producidos por cada persona	f
706	216	El PIB es la cantidad total de bienes y servicios producidos, mientras que el PIB per cápita es la cantidad total de bienes y servicios producidos por la población	f
707	216	El PIB es la cantidad total de bienes y servicios producidos, mientras que el PIB per cápita es la cantidad de bienes y servicios producidos por cada persona en relación con la tasa de población	t
708	217	El registro de las transacciones comerciales entre países	f
709	217	El registro de las transacciones financieras entre países	f
710	217	El registro de las transacciones comerciales y financieras entre países	t
711	218	Proporciona información para la toma de decisiones políticas	f
712	218	Proporciona información para la toma de decisiones económicas	t
713	218	No proporciona información para la toma de decisiones económicas	f
714	219	La cantidad total de inversión realizada por el gobierno	f
715	219	La cantidad total de inversión realizada por los sectores privado y público	t
716	219	La cantidad total de inversión realizada por el sector público	f
717	220	El PIB es la cantidad total de bienes y servicios producidos, mientras que el PNI es la cantidad total de bienes y servicios producidos menos la depreciación	t
718	220	El PIB es la cantidad total de bienes y servicios importados, mientras que el PNI es la cantidad total de bienes y servicios producidos	f
719	220	El PIB es la cantidad total de divisas extranjeras recibidas, mientras que el PNI es la cantidad total de bienes y servicios producidos	f
720	221	El registro de las transacciones comerciales entre países	f
721	221	El registro de las transacciones financieras entre países	f
722	221	El registro de las transacciones económicas de un país en un determinado período de tiempo	t
723	222	Derecho a la libertad de expresión	f
724	222	Derecho a la vida y a la integridad física	t
725	222	Derecho a la propiedad	f
726	223	Proteger la igualdad ante la ley	t
727	223	Garantizar la libertad de expresión	f
728	223	Promover la justicia social	f
729	224	Derecho a la libertad de expresión	f
730	224	Derecho a la libertad de conciencia	f
731	224	Derecho a la libertad de reunión y de asociación	t
732	225	Protege la libertad de expresión, pero no la libertad de pensamiento	f
733	225	Garantiza la libertad de pensamiento, pero no la libertad de expresión	f
734	225	Protege tanto la libertad de pensamiento como la libertad de expresión	t
735	226	Derecho a la vida y a la integridad física	f
2021	608	an	t
2022	608	the	f
2023	609	should	t
2024	609	must	f
2025	609	have to	f
2026	610	do I come	f
2027	610	I came	t
2028	610	did I come	f
2029	611	fell	t
2030	611	felt	f
2031	611	falled	f
2032	612	older	t
2033	612	oldest	f
2034	612	more old	f
2035	613	can	f
2036	613	could	t
2037	613	will	f
2038	614	was doing	t
2039	614	did	f
2040	614	has done	f
2041	615	much	f
2042	615	many	t
2043	615	a lot	f
2044	616	am	f
2045	616	were	t
2046	616	will be	f
2047	617	go	f
2048	617	going	t
2049	617	went	f
2050	618	for drink	f
2051	618	to drink	t
2052	618	drinking	f
2053	619	know	f
2054	619	have known	t
2055	619	knew	f
2056	620	so	t
2057	620	such	f
2058	620	too	f
2059	621	cut	t
2060	621	to cut	f
2061	621	cutting	f
2062	622	too	t
2063	622	so	f
2064	622	very	f
2065	623	will finish	f
736	226	Derecho a la libertad de expresión	f
737	226	Derecho a la protección de la salud	t
738	227	Garantizar la igualdad ante la ley	t
739	227	Proteger la libertad de expresión	f
740	227	Promover la justicia social	f
741	228	Derecho a la libertad de expresión	f
742	228	Derecho a la protección de la salud	f
743	228	Derecho a la vida y a la integridad física	t
744	229	Derecho a la libertad de expresión	f
745	229	Derecho a la protección de la salud	f
746	229	Derecho a la protección de la familia	t
747	230	Garantizar la igualdad ante la ley	t
748	230	Proteger la libertad de expresión	f
749	230	Promover la justicia social	f
750	231	Derecho a la libertad de expresión	f
751	231	Derecho a la protección de la salud	f
752	231	Derecho a la vida y a la integridad física	t
841	261	Usando la propiedad width	f
842	261	Usando la propiedad padding	f
3554	1045	Fingers	t
3555	1045	Knees	f
3556	1045	Elbows	f
3557	1046	Lung	f
3558	1046	Stomach	f
3559	1046	Heart	t
3560	1046	Liver	f
3561	1047	Tongue	f
3562	1047	Nose	t
4041	1176	"Whom wants to see me?"	f
3563	1047	Eye	f
3564	1047	Ear	f
3565	1048	Thigh	f
3566	1048	Ankle	f
3567	1048	Calf	t
3568	1048	Hip	f
3569	1049	Eyes	f
3570	1049	Cheeks	f
3571	1049	Ears	t
3572	1049	Shoulders	f
3573	1050	Wrist	f
3574	1050	Shoulder	f
3575	1050	Elbow	t
3576	1050	Knuckle	f
3577	1051	Forehead	f
3578	1051	Chin	f
3579	1051	Mouth	t
3580	1051	Neck	f
3581	1052	Back	f
3582	1052	Chest	f
3583	1052	Neck	t
3584	1052	Throat	f
3585	1053	Fingers	f
3586	1053	Toes	t
3587	1053	Knees	f
3588	1053	Ankles	f
4042	1177	"I have no idea."	f
4043	1177	"That's a good question. Let me get back to you on that with more precise information."	t
3589	1054	Stomach / Abdomen	t
3590	1054	Chest	f
3591	1054	Back	f
3592	1054	Hip	f
4044	1177	"I'd rather not say."	f
4045	1177	"Why do you need to know?"	f
4046	1178	"Shall we...?" is a direct suggestion to do something together. "Should we...?" introduces more doubt or asks for consideration of the idea's advisability.	t
3593	1055	Knee	f
3594	1055	Ankle	t
3595	1055	Toe	f
3596	1055	Heel	f
3597	1056	Hips	f
3598	1056	Elbows	f
3599	1056	Shoulders	t
3600	1056	Knees	f
2066	623	will have finished	t
2067	623	finish	f
2068	624	or	f
2069	624	nor	t
2070	624	and	f
3601	1057	Muscles	f
3602	1057	Tendons	f
3603	1057	Bones	t
3604	1057	Joints	f
3605	1058	Ankle	f
3606	1058	Hip	f
3607	1058	Knee	t
3608	1058	Calf	f
3609	1059	Upper arm	f
3610	1059	Shoulder	f
3611	1059	Forearm	t
3612	1059	Wrist	f
3613	1060	Teeth	f
3614	1060	Lips	f
3615	1060	Tongue	t
3616	1060	Gums	f
3617	1061	Elbow	f
3618	1061	Knuckle	f
3619	1061	Wrist	t
3620	1061	Shoulder	f
3621	1062	Stomach	f
3622	1062	Chest	f
3623	1062	Back	t
3624	1062	Shoulders	f
3625	1063	Eyelashes	f
3626	1063	Eyebrows	f
3627	1063	Beard	f
3628	1063	Hair	t
4047	1178	They are completely interchangeable.	f
4048	1178	"Should we...?" is only used in negative contexts.	f
4049	1178	"Shall we...?" is informal, "Should we...?" is formal.	f
4507	1318	Pertenecer al Consejo de Gobierno.	f
4508	1318	Haber sido Decanos o Directores de Departamento.	f
4509	1318	Representar a los diversos ámbitos del conocimiento (Artes, Ciencias, Salud, Sociales).	t
4510	1319	Funcionarios de los cuerpos docentes y personal laboral (contratado).	t
1627	508	Para predecir variables discretas	f
2570	756	El Director General.	f
4511	1319	Profesores eméritos y profesores visitantes.	f
4512	1319	Personal investigador y personal de administración.	f
4513	1319	Catedráticos y Profesores Titulares.	f
4514	1320	No ser superior al 49% del total de PDI.	f
4515	1320	No ser superior al 30% del total de PDI.	t
497	146	2012	f
498	147	Madrid	t
499	147	Barcelona	f
4516	1320	No ser superior al 40% del total de PDI.	f
4517	1320	No ser inferior al 70% del total de PDI.	f
4518	1321	Haber sido Profesor Ayudante Doctor durante al menos dos años.	f
903	282	Absorbe la luz	f
904	282	La luz cambia de dirección	t
905	282	La luz se detiene	f
906	283	El cambio de dirección de la luz al pasar de un medio a otro	t
907	283	La absorción de la luz por un objeto	f
908	283	La propagación de la luz a través de un medio	f
909	284	Onda longitudinal	f
910	284	Onda transversal	t
911	284	Onda plana	f
912	285	La luz se ralentiza	t
913	285	La luz se acelera	f
914	285	La luz no cambia de velocidad	f
915	286	La velocidad a la que la luz se propaga en el vacío	t
916	286	La velocidad a la que la luz se propaga en un medio	f
917	286	La velocidad a la que la luz se refleja en una superficie	f
918	287	Las ondas se cancelan entre sí	f
919	287	Las ondas se suman entre sí	t
920	287	Las ondas no cambian entre sí	f
921	288	El cambio de dirección de la luz al pasar de un medio a otro	f
922	288	La superposición de ondas	t
923	288	La absorción de la luz por un objeto	f
924	289	Onda longitudinal	t
925	289	Onda transversal	f
926	289	Onda plana	f
927	290	La onda se ralentiza	t
928	290	La onda se acelera	f
929	290	La onda no cambia de velocidad	f
930	291	El cambio de dirección de la luz al pasar de un medio a otro	t
931	291	La superposición de ondas	f
932	291	La propagación de la luz a través de un medio	f
933	292	El proceso de creación de nuevos seres vivos a partir de la nada.	f
934	292	El cambio gradual de las características de las especies a lo largo del tiempo.	t
935	292	El proceso de extinción de especies.	f
936	293	Un proceso artificial que selecciona a los individuos más fuertes.	f
937	293	Un proceso natural que selecciona a los individuos mejor adaptados para sobrevivir y reproducirse.	t
938	293	Un proceso que implica la intervención directa de los científicos en la evolución de las especies.	f
939	294	Un grupo de individuos que comparten características similares y pueden reproducirse entre sí.	t
940	294	Un individuo que tiene características únicas y no puede reproducirse con otros.	f
941	294	Un grupo de individuos que viven en el mismo ecosistema.	f
942	295	El proceso de cambio gradual de las características de las especies a lo largo del tiempo.	f
943	295	El proceso de adaptación de un individuo a su entorno para sobrevivir y reproducirse.	t
944	295	El proceso de extinción de especies.	f
945	296	El proceso de cambio gradual de las características de las especies a lo largo del tiempo.	f
946	296	La variación en las características de los individuos de una especie.	t
947	296	El proceso de extinción de especies.	f
948	297	La variedad de características de los individuos de una especie.	f
949	297	La variedad de especies que existen en un ecosistema.	t
950	297	El proceso de cambio gradual de las características de las especies a lo largo del tiempo.	f
951	298	El proceso de creación de nuevos seres vivos a partir de la nada.	f
952	298	El proceso de extinción de especies que han perdido su adaptación a su entorno.	t
953	298	El proceso de cambio gradual de las características de las especies a lo largo del tiempo.	f
954	299	Un grupo de individuos que comparten características similares y pueden reproducirse entre sí.	f
955	299	Un grupo de individuos que viven en el mismo ecosistema y dependen unos de otros.	t
956	299	Un individuo que tiene características únicas y no puede reproducirse con otros.	f
957	300	El proceso de cambio gradual de las características de las especies a lo largo del tiempo.	f
4519	1321	Superar una oposición libre de carácter estatal.	f
4520	1321	La obtención previa de una acreditación nacional.	t
4521	1321	Tener publicados al menos tres artículos en revistas indexadas.	f
4522	1322	Profesor/a Ayudante Doctor.	f
4523	1322	Profesor/a Asociado.	f
4524	1322	Profesor/a Contratado Doctor.	f
4525	1322	Profesor/a Titular de Universidad (contratado).	t
4526	1323	Estar en posesión del título de Doctor.	f
958	300	El proceso por el cual las plantas producen su propia comida a partir de la energía solar.	t
959	300	El proceso de extinción de especies.	f
960	301	Un proceso natural que selecciona a los individuos mejor adaptados para sobrevivir y reproducirse.	f
961	301	Un proceso artificial que selecciona a los individuos más fuertes.	t
962	301	Un proceso que implica la intervención directa de los científicos en la evolución de las especies.	f
963	302	Je suis malade	f
964	302	Comment ça va?	t
965	302	Je suis riche	f
966	303	Adiós	f
967	303	Hasta luego	f
968	303	Buenos días	t
969	304	Je suis heureux	f
970	304	J'ai une douleur au cerveau	t
971	304	Je suis fatigué	f
972	305	Lo siento	f
973	305	Adiós	f
974	305	Gracias	t
975	306	Je suis confus	f
976	306	Où est...	t
977	306	Je suis heureux	f
978	307	Hasta luego	t
979	307	Adiós	f
980	307	Buenos días	f
981	308	Je suis déçu	f
982	308	J'adore ce lieu	t
983	308	Je suis fatigué	f
984	309	Por favor	t
985	309	Gracias	f
986	309	Lo siento	f
987	310	Je suis riche	f
988	310	Combien ça coûte?	t
989	310	Je suis heureux	f
990	311	Lo siento	t
991	311	Gracias	f
992	311	Adiós	f
4050	1179	Está marcando con sus feromonas faciales y mostrando un vínculo de seguridad y pertenencia contigo.	t
4051	1179	Tiene hambre y te está pidiendo comida de manera urgente.	f
4052	1179	Está probando tu sabor porque considera que podrías ser una posible presa.	f
4053	1180	El ronroneo, dentro de ciertas frecuencias, puede tener un efecto terapéutico y de autorregulación, tanto para él como para ti, promoviendo la calma y la curación.	t
4054	1180	Está comprobando si tu temperatura corporal es estable para asegurar su propia comodidad.	f
4055	1180	Es un comportamiento aprendido por imitación de otros gatos que ha visto en internet.	f
4056	1181	Es un marcaje por estrés o ansiedad, normalmente provocado por un cambio en su entorno (una mudanza, una nueva mascota, un bebé) que le hace sentir inseguro.	t
4057	1181	Está demostrando su dominio sobre ti y reclamando la propiedad de esos objetos.	f
4058	1181	Simplemente se ha olvidado de dónde está la bandeja y necesita que se la vuelvas a enseñar.	f
4059	1182	Te considera parte de su colonia/social group y, al percibirte como un cazador incompetente, está intentando enseñarte a cazar o aportar su parte al grupo.	t
4060	1182	Es un acto de crueldad innata y quiere asustarte o demostrar su poder.	f
4061	1182	Está jugando contigo y espera que le devuelvas el "juguete" para seguir la partida.	f
4062	1183	Es un comportamiento infantil residual. Los gatitos amasan el vientre de su madre para estimular la producción de leche. En la edad adulta, indica un estado de relajación y bienestar extremo, asociándote con la seguridad materna.	t
4063	1183	Está marcando territorio con las glándulas odoríferas que tiene entre las almohadillas.	f
4064	1183	Es un ejercicio de estiramiento muscular que realiza de forma instintiva antes de dormir.	f
4065	1184	Es muy probable que esté percibiendo sonidos de alta frecuencia (como roedores dentro de la pared), movimientos de insectos diminutos o reflejos de luz imperceptibles para ti. Su sistema auditivo y visual es diferente al nuestro.	t
4066	1184	Está teniendo alucinaciones causadas por algún tipo de trastorno neurológico felino.	f
4067	1184	Está viendo espíritus o fantasmas, una creencia popular sobre la sensibilidad felina.	f
4068	1185	Mostrar la barriga es una señal de confianza extrema (es su zona más vulnerable), pero no siempre una invitación a ser tocado. Es una demostración de que se siente seguro, no una solicitud de caricias en esa zona sensible.	t
4069	1185	Es una trampa deliberada para jugar a la lucha y cazar tu mano como si fuera una presa.	f
4070	1185	Tiene picor en la barriga y quiere que se la rasques, pero el reflejo de morder es involuntario.	f
4071	1186	Indica un estado de concentración o de leve irritación/interés. Es un "barómetro" emocional más sutil que el movimiento de toda la cola. Una punta que se mueve lentamente suele significar que está procesando algo.	t
4072	1186	Significa que está completamente dormido y la cola se mueve por espasmos musculares.	f
4073	1186	Es un signo inequívoco de que está a punto de atacar o huir.	f
2567	756	El Secretario.	f
2568	756	El Patrono de mayor edad.	f
2569	756	El Presidente (o quien le sustituya).	t
2571	757	El Presidente.	f
2572	757	El Vicepresidente.	f
2573	757	El Consejo Ejecutivo.	t
2574	757	El Director General.	f
2575	758	No puede ser reembolsado en ningún caso; el cargo es totalmente gratuito.	f
2576	758	Tiene derecho a un sueldo fijo mensual por sus funciones.	f
2577	758	Tiene derecho al reembolso de gastos debidamente justificados ocasionados por el ejercicio de sus funciones.	t
2578	758	Solo si el gasto supera los 500 euros y es previamente autorizado por el Protectorado.	f
2579	759	Actuar a través de su representante legal automáticamente.	f
2580	759	Designar expresamente a la persona física que la represente y el orden de sustitución.	t
2581	759	No puede ser patrono; el cargo solo puede recaer en personas físicas.	f
2582	759	Debe crear una comisión interna para seguir los asuntos de la Fundación.	f
2633	772	Artículo 7.	f
4074	1187	Los gatos instintivamente prefieren el agua en movimiento porque en la naturaleza el agua estancada puede estar contaminada. Además, el material del bowl (plástico) puede dejar un sabor u olor desagradable.	t
4075	1187	Es un acto de rebeldía para llamar tu atención y que le prestes más tiempo.	f
2583	760	La presencia de todos sus miembros.	f
2584	760	La mitad de sus miembros con derecho a voto, siendo uno de ellos necesariamente el Presidente.	t
2585	760	Al menos tres de sus miembros, sin importar cuáles.	f
2586	760	La presencia del Presidente y el Secretario (Director General).	f
2587	761	Libro Diario.	f
2588	761	Libro de Inventarios y Cuentas Anuales.	f
2589	761	Libro de Actas.	f
2590	761	Libro de Registro de Socios.	t
1083	342	Rey Guillermo III	f
1084	342	Rey Jorge I	f
1085	342	Rey Jorge II	t
1086	343	La victoria de Francia	f
1087	343	La victoria de Inglaterra	t
1088	343	La guerra terminó en un tratado de paz	f
1089	344	Acto de la Unión	f
1090	344	Acto de la Independencia	t
1091	344	Acto de la Colonización	f
1092	345	La victoria de Prusia	f
1093	345	La victoria de Inglaterra	t
1094	345	La guerra terminó en un tratado de paz	f
1095	346	Rey Jorge III	f
1096	346	Rey Jorge IV	f
1097	346	Rey Jorge Washington	t
1098	347	La victoria de Inglaterra	f
1099	347	La victoria de los Estados Unidos	t
1100	347	La guerra terminó en un tratado de paz	f
1101	348	Acto de la Unión	f
1102	348	Acto de la Independencia	f
1103	348	Acto de la Colonización de la India	t
1104	349	La victoria de Rusia	f
1105	349	La victoria de Inglaterra	t
1106	349	La guerra terminó en un tratado de paz	f
1107	350	Rey Jorge V	f
1108	350	Rey Jorge VI	f
1109	350	Líder Lenin	t
1110	351	La victoria de China	f
1111	351	La victoria de Inglaterra	t
1112	351	La guerra terminó en un tratado de paz	f
1113	352	John Maynard Keynes	t
1114	352	Adam Smith	f
1115	352	David Ricardo	f
1116	353	La oferta y la demanda	f
1117	353	La curva de la renta marginal	f
1118	353	El ahorro y la inversión	t
1119	354	La relación entre la inversión y el ahorro	f
1120	354	El efecto negativo de la inflación en la economía	f
1121	354	El aumento en la demanda agregada como resultado de una mayor inversión gubernamental	t
1122	355	Reducir la inflación	f
1123	355	Aumentar la oferta agregada	f
1124	355	Aumentar la demanda agregada a través de la política fiscal	t
1125	356	El efecto negativo de la inflación en la economía	f
1126	356	La relación entre la inversión y el ahorro	f
1127	356	El aumento en la demanda agregada como resultado de una mayor cantidad de dinero en circulación	t
1128	357	No considera la inflación	f
1129	357	No tiene en cuenta la tecnología y la productividad	t
1130	357	No analiza la relación entre la oferta y la demanda	f
1131	358	El consumo y la inversión privada	f
1132	358	El consumo y la inversión gubernamental	f
1133	358	La suma del consumo, la inversión, el gasto gubernamental y el cambio en los inventarios	t
1134	359	Reducir la inflación	f
1135	359	Aumentar la oferta agregada	f
1136	359	Aumentar la demanda agregada y estimular la economía	t
1137	360	El consumo y la inversión privada	f
1138	360	El consumo y la inversión gubernamental	f
1139	360	La suma del consumo, la inversión, el gasto gubernamental y la producción	t
1140	361	No considera la inflación	f
1141	361	No tiene en cuenta la tecnología y la productividad	f
1142	361	Proporciona una herramienta efectiva para analizar y abordar las depresiones económicas	t
1143	362	Almacenar datos en una estructura rígida y predefinida	f
1144	362	Ofrecer flexibilidad y escalabilidad en la gestión de datos	t
1145	362	Reemplazar a las bases de datos relacionales	f
1146	363	Soporta transacciones de nivel de base de datos	f
1147	363	No utiliza un esquema predefinido de datos	t
1148	363	Requiere una gran cantidad de código para implementar	f
1149	364	MySQL	f
1150	364	MongoDB	t
1151	364	SQL Server	f
1152	365	Soportan un mayor número de usuarios	f
1153	365	Se pueden implementar en una variedad de estructuras de datos	t
1154	365	Requieren menos recursos de hardware	f
1155	366	Significa que no se utiliza el lenguaje SQL	t
1156	366	Significa que se necesita un lenguaje de programación avanzado	f
1157	366	Significa que se requiere un gran número de expertos en bases de datos	f
1158	367	Bases de datos en la nube	f
1159	367	Documentos JSON	t
1160	367	Tablas relacionales	f
2591	762	Tres meses.	f
2592	762	Seis meses.	t
2593	762	Nueve meses.	f
2594	762	Un año.	f
500	147	Sevilla	f
501	148	La Furia Roja	t
1161	368	Motor de bases de datos relacionales	f
1162	368	Motor de almacenamiento de documentos BSON	t
1163	368	Motor de almacenamiento de texto	f
1164	369	Soporta un mayor número de relaciones entre tablas	f
1165	369	Permite la flexibilidad en la estructura de datos	t
1166	369	Requiere menos código para implementar	f
1167	370	SQL Server	f
1168	370	MongoDB	t
1169	370	MySQL	f
1170	371	Soporta transacciones de nivel de base de datos	f
1171	371	Es compatible con el estándar SQL	f
1172	371	Ofrece escalabilidad y flexibilidad en la gestión de datos	t
4076	1187	Tiene problemas de visión y el movimiento del agua le ayuda a localizar la superficie para beber.	f
4077	1188	En un entorno doméstico, el baño es un espacio cerrado y sin escapatoria donde tú estás quieto. Para un gato social, es un momento vulnerable. Te sigue para ofrecerte protección (o recibirla) mientras estás en un estado "indefenso", reforzando el vínculo de colonia.	t
4078	1188	Le fascina el sonido del agua de la cisterna y espera que la acciones para jugar.	f
4079	1188	Cree que es su deber supervisar tus funciones corporales para asegurarse de que estás sano, como haría una madre con sus crías.	f
4080	1189	Enterrar es un comportamiento para ocultar el rastro de depredadores o competidores, común en individuos que se sienten en una posición de vulnerabilidad. Dejarlos a la vista (marcaje con heces) es una señal de dominio y demarcación territorial para otros gatos.	t
4081	1189	Depende exclusivamente de la raza; algunas razas son más pulcras por naturaleza.	f
4082	1189	Los que no entierran tienen problemas de aprendizaje o pereza, y nunca aprendieron de su madre.	f
4083	1190	Está depositando feromonas de las glándulas que tiene en las mejillas, la cabeza y la base de la cola. Está "marcando" su territorio (que incluye a ti) con su olor familiar, creando un entorno seguro y reconocible.	t
2596	763	Mayoría de dos tercios del Patronato.	t
2595	763	Mayoría simple del Patronato.	f
2597	763	Unanimidad del Patronato.	f
502	148	Los Toros	f
503	148	La Armada	f
504	149	FC Barcelona	f
505	149	Atlético de Madrid	f
506	149	Real Madrid	t
507	150	Fernando Torres	f
508	150	David Villa	t
509	150	Raúl González	f
510	151	RC Celta de Vigo	f
511	151	Sevilla FC	t
512	151	Real Betis	f
559	167	Andrés Iniesta	t
560	167	Xavi Hernández	f
513	152	FC Barcelona	t
514	152	Valencia CF	f
515	152	Real Zaragoza	f
516	153	Vicente del Bosque	t
2598	763	Aprobación previa del Consejo de Gobierno de la UCM.	f
2599	764	Cumplimiento del fin fundacional.	f
2600	764	Imposibilidad de realizar su fin.	f
2601	764	Falta de recursos económicos durante un ejercicio.	t
2602	764	Cualesquiera otras causas establecidas en las leyes.	f
2454	727	Una asociación de voluntarios.	f
2451	727	Una sociedad mercantil con ánimo de lucro.	f
2452	727	Una entidad sin ánimo de lucro, con duración indefinida y patrimonio afecto a fines de interés general.	t
2453	727	Un organismo autónomo de la Administración General del Estado.	f
2487	736	El Consejo Ejecutivo.	f
2455	728	Tiene capacidad jurídica limitada a actos de administración ordinaria.	f
2456	728	Goza de plena capacidad jurídica y de obrar para cumplir con sus fines.	t
2457	728	Solo tiene capacidad para actuar dentro del ámbito de la Comunidad de Madrid.	f
1896	575	hammered out	t
1897	575	brought up	t
1898	575	called off	f
1899	575	got across	f
1900	576	To reject something immediately	f
1901	576	To celebrate something	f
1902	576	To think about something carefully for a period of time	t
1903	576	To forget about something	f
1904	577	put up with	t
1905	577	go through with	f
1906	577	get away with	f
1907	577	look forward to	f
1908	578	bore out	t
1909	578	took after	f
1910	578	went back on	f
1911	578	came across	f
1912	579	She has stolen some gardening tools	f
1913	579	She has developed a liking or aptitude for it	t
1914	579	She has moved to a place with a garden	f
1915	579	She has criticized gardening	f
1916	580	make up for	t
1917	580	do away with	f
2125	638	Rooney Mara	f
2126	638	Felicity Jones	f
2127	639	Christian Bale	t
2128	639	Ben Affleck	f
2129	639	Michael Keaton	f
2130	639	Val Kilmer	f
2131	640	Sandra Bullock	t
2132	640	Meryl Streep	f
2133	640	Cate Blanchett	f
2134	640	Julianne Moore	f
2135	641	Jon Hamm	t
2136	641	Bryan Cranston	f
2137	641	Steve Carell	f
2138	641	John Krasinski	f
2139	642	Hilary Swank	t
2140	642	Reese Witherspoon	f
2141	642	Nicole Kidman	f
2142	642	Laura Dern	f
2143	643	Samuel L. Jackson	t
2144	643	Morgan Freeman	f
2145	643	Forest Whitaker	f
2146	643	Denzel Washington	f
2147	644	Meryl Streep	t
2148	644	Katharine Hepburn	f
1918	580	fall back on	f
1919	580	run up against	f
1920	581	ran up against	t
1921	581	came in for	f
1922	581	got round to	f
1923	581	lived up to	f
1924	582	To praise someone excessively	f
1925	582	To dismiss someone with an excuse or inferior alternative	t
1926	582	To physically push someone away	f
1927	582	To invite someone to leave	f
1928	583	thrash out	t
1929	583	brush up on	f
1930	583	hold out for	f
1931	583	wriggle out of	f
1932	584	To become attached to something sentimental	f
1933	584	To begin to understand or realize something	t
2458	728	Carece de personalidad jurídica propia hasta que lo autorice el Protectorado.	f
2491	737	El Rector, el Secretario General y el Gerente de la UCM.	t
2492	737	Los profesores con más de 20 años de antigüedad.	f
2493	737	Los donantes que aporten más de un millón de euros.	f
2494	737	Los representantes de las empresas patrocinadoras.	f
2563	755	Artículo 12 (Órganos de administración y gobierno).	f
2564	755	Artículo 13 (El Patronato).	t
2565	755	Artículo 19 (Competencias del Patronato).	f
2566	755	Artículo 23 (Competencias del Consejo Ejecutivo).	f
2483	735	Exclusivamente el principio de necesidad económica.	f
2484	735	Los principios de mérito y capacidad, así como imparcialidad y no discriminación.	t
2485	735	El orden de llegada de las solicitudes (criterio de orden de petición).	f
2486	735	La condición de ser alumno o empleado de la UCM.	f
2488	736	El Director General.	f
2489	736	El Patronato.	t
2490	736	El Rector de la UCM.	f
2495	738	Tienen voz y voto y su presencia cuenta para el quórum.	f
2496	738	Son nombrados por el Consejo de Gobierno sin límite de número, tienen voz pero no voto, y no computan para el quórum.	t
2497	738	Son los patronos fundadores con carácter vitalicio.	f
1623	507	Un tipo de distribución de probabilidad	t
1624	507	Un método para predecir variables continuas a partir de variables independientes	f
1625	507	Un tipo de prueba de hipótesis	f
1626	507	Un análisis de frecuencias	f
1629	508	Para analizar la distribución de una variable	f
1630	508	Para predecir variables continuas a partir de variables independientes	t
1628	508	Para identificar la relación entre dos variables	f
1631	509	Un modelo que relaciona dos variables no lineales	f
1632	509	Un modelo que relaciona varias variables no lineales	f
1593	499	Un tipo de prueba de hipótesis	f
1443	462	Galenos	f
1444	462	Herófilo	f
1445	462	Erasmus de Rotterdam	f
1446	462	William Harvey	t
1447	463	Leonardo da Vinci	t
1448	463	Michelangelo	f
1449	463	Gabriele Falloppio	f
1450	463	Giovanni Battista Montanari	f
1451	464	Louis Pasteur	f
1452	464	Claude Bernard	f
1453	464	Charles Richet	f
1454	464	Samuel Hahnemann	t
1455	465	Pedro Pascual Madoz	t
1456	465	Antonio de las Casas	f
1457	465	Juan de la Cruz	f
1458	465	Pedro de la Torre	f
1459	466	William Harvey	f
1460	466	Robert Hooke	f
1461	466	John Locke	f
1462	466	Charles Darwin	t
1463	467	Clara Barton	f
1464	467	Florence Nightingale	t
1465	467	Mary Seacole	f
1466	467	Elizabeth Blackwell	f
1467	468	Robert Koch	t
1468	468	Gustav von Bunge	f
1469	468	Emil von Behring	f
1470	468	Friedrich Loeffler	f
1471	469	Jonas Salk	t
1472	469	Albert Sabin	f
1473	469	Walter Reed	f
1474	469	Henry Kissinger	f
1475	470	Louis Pasteur	t
1476	470	Claude Bernard	f
1477	470	Charles Richet	f
1478	470	Pierre Paul Broca	f
1479	471	Giovanni Battista Morgagni	f
1480	471	Luigi Palmieri	f
1481	471	Girolamo Fracastoro	f
1482	471	Alessandro Tiberi	t
1483	472	Florence Nightingale	t
1484	472	Elizabeth Blackwell	f
1485	472	Mary Seacole	f
1486	472	Rosalind Franklin	f
1487	473	Robert Koch	f
1488	473	Emil von Behring	t
1489	473	Friedrich Loeffler	f
1490	473	Karl Landsteiner	f
1491	474	Jonas Salk	f
1492	474	Albert Sabin	f
1493	474	Walter Reed	f
1494	474	Baruch Blumberg	t
1495	475	Claude Bernard	t
1496	475	Charles Richet	f
1497	475	Pierre Paul Broca	f
1498	475	Jean-Baptiste Boussingault	f
1499	476	Alessandro Tiberi	t
1500	476	Luigi Palmieri	f
1501	476	Girolamo Fracastoro	f
1502	476	Giovanni Battista Morgagni	f
1503	477	Florence Nightingale	t
1504	477	Elizabeth Blackwell	f
1505	477	Mary Seacole	f
1506	477	Rosalind Franklin	f
1507	478	Robert Koch	f
1508	478	Emil von Behring	t
1509	478	Friedrich Loeffler	f
1510	478	Karl Landsteiner	f
1511	479	Jonas Salk	f
1512	479	Albert Sabin	f
1513	479	Walter Reed	f
1514	479	Joseph Smadel	t
1515	480	Claude Bernard	t
1516	480	Charles Richet	f
1517	480	Pierre Paul Broca	f
1518	480	Jean-Baptiste Boussingault	f
1519	481	Alessandro Tiberi	t
1520	481	Luigi Palmieri	f
1521	481	Girolamo Fracastoro	f
1522	481	Giovanni Battista Morgagni	f
2071	625	Matthew McConaughey	t
2072	625	Leonardo DiCaprio	f
2073	625	Joaquin Phoenix	f
2074	625	Christian Bale	f
2075	626	Jennifer Lawrence	f
2076	626	Emma Stone	t
2077	626	Emma Watson	f
2078	626	Brie Larson	f
2079	627	Brad Pitt	f
2080	627	George Clooney	f
2081	627	Ryan Reynolds	t
2082	627	Mark Wahlberg	f
2083	628	Nicole Kidman	f
2084	628	Charlize Theron	t
2085	628	Cate Blanchett	f
2086	628	Hilary Swank	f
2087	629	Chris Evans	f
2088	629	Chris Hemsworth	f
2089	629	Robert Downey Jr.	t
2090	629	Mark Ruffalo	f
2091	630	Jennifer Lawrence	t
2092	630	Saoirse Ronan	f
2093	630	Natalie Portman	f
2094	630	Scarlett Johansson	f
2095	631	Bryan Cranston	f
2096	631	Eddie Redmayne	t
2097	631	Benedict Cumberbatch	f
2098	631	Michael Fassbender	f
2099	632	Amy Adams	t
2100	632	Melissa Leo	f
2101	632	Viola Davis	f
2102	632	Octavia Spencer	f
2498	738	Son los representantes legales de los beneficiarios.	f
2499	739	Siguiendo instrucciones vinculantes del Rector.	f
2500	739	Con independencia, sin trabas ni limitaciones, salvo las dispuestas en los Estatutos o el Derecho necesario.	t
2501	739	De forma gratuita, pero con derecho a una retribución por dietas fijas.	f
2502	739	Solo pueden actuar si obtienen autorización previa del Protectorado.	f
2103	633	Joaquin Phoenix	f
2504	740	Cuatro años, pudiendo ser reelegidos.	t
2505	740	Seis años, sin posibilidad de reelección.	f
2506	740	Dura lo que dure el cargo por el que fueron designados.	f
2507	741	Por muerte o declaración de fallecimiento.	f
2508	741	Por finalización del plazo de su mandato.	f
2509	741	Por no asistir a una sola reunión del Patronato.	t
2510	741	Por realizar actos lesivos a los intereses de la Fundación.	f
2511	742	El Patrono de mayor edad.	f
2512	742	El Director General de la Fundación.	f
2514	742	Es elegido por votación entre todos los patronos.	f
2513	742	El Rector de la UCM.	t
2515	743	Mayoría simple de los asistentes.	f
2516	743	Unanimidad de todos sus miembros.	f
2517	743	El voto favorable de dos tercios de sus miembros.	t
3084	899	Un grupo de senadores	t
3085	899	Un grupo de soldados	f
3086	899	Un grupo de civiles	f
3087	900	En el año 100 a.C.	f
2104	633	Heath Ledger	t
2105	633	Jared Leto	f
2106	633	Jack Nicholson	f
2107	634	Scarlett Johansson	t
2108	634	Natalie Portman	f
2109	634	Keira Knightley	f
2110	634	Emma Watson	f
2111	635	Leonardo DiCaprio	t
2112	635	Tom Hanks	f
3088	900	En el año 27 a.C.	f
3089	900	En el año 476 d.C.	t
3090	901	Julio César	f
3092	901	Cludio	t
2113	635	Denzel Washington	f
2114	635	Matt Damon	f
2115	636	Julianne Moore	t
2116	636	Kate Winslet	f
2117	636	Meryl Streep	f
2118	636	Helen Mirren	f
2119	637	Andrew Garfield	t
2120	637	Tobey Maguire	f
2121	637	Tom Holland	f
2122	637	Jesse Eisenberg	f
2123	638	Brie Larson	t
2124	638	Alicia Vikander	f
2149	644	Ingrid Bergman	f
2150	644	Cate Blanchett	f
1934	584	To start using a new material or fabric	f
1935	584	To agree with someone's opinion	f
1936	585	get round to	t
1937	585	put up with	f
1938	585	look down on	f
1939	585	stand in for	f
1940	586	To increase the debt	f
1941	586	To officially record it as a loss and stop trying to collect it	t
1942	586	To transfer it to another department	f
1943	586	To forgive it informally	f
1944	587	Let's work out a solution to this problem.	f
1945	587	I work out at the gym three times a week.	t
1946	587	The total cost didn't work out as expected.	f
1947	587	Things will work out fine in the end.	f
1948	588	To criticize something	f
1949	588	To use something as a last resort when other things have failed	t
1950	588	To remember something from the past	f
1951	588	To physically lean on something	f
1952	589	brought about	t
1953	589	called for	f
1954	589	went through	f
1955	589	set about	f
1956	590	phase out	f
1957	590	scale back	t
1958	590	wind down	f
1959	590	tail off	f
1960	591	To become very happy and talkative	f
1961	591	To suddenly refuse to talk or give information	t
1636	510	Un tipo de regresión que utiliza una recta de regresión	f
1641	511	Un tipo de regresión que utiliza varias variables independientes y una variable dependiente continua	f
1642	511	Un tipo de regresión que utiliza una recta de regresión y una variable dependiente discontinua	f
1639	511	Un tipo de regresión que utiliza una recta de regresión y una variable dependiente continua	f
1962	591	To close something tightly	f
1963	591	To clean something thoroughly	f
1964	592	To help someone through a difficult period, especially financially	t
1965	592	To overwhelm someone with work	f
1966	592	To visit someone during high tide	f
1967	592	To delay someone's plans	f
1968	593	put... off	t
1969	593	took... aback	f
1970	593	saw... through	f
1971	593	let... down	f
1972	594	To spend time in a leisurely way	t
1973	594	To waste time unproductively	f
1974	594	To measure time accurately	f
1975	594	To complain about the passage of time	f
1976	595	look into	t
1977	595	go over	f
1978	595	delve into	f
1979	595	get at	f
1980	596	To avoid dealing with a problem	f
1981	596	To prepare to deal with a problem in a direct and determined way	t
1982	596	To make a problem seem less serious	f
1983	596	To share a problem with someone else	f
1984	597	live down	f
1985	597	make up for	f
1986	597	offset	f
1987	597	counteract	t
1988	598	To eagerly accept something	f
1989	598	To be unwilling to do or accept something	t
1990	598	To make a sudden movement	f
1991	598	To joke about something	f
1992	599	He bowed out gracefully from the competition due to injury.	t
1993	599	She bowed out the window to see the parade.	f
1994	599	They bowed out the contract after careful review.	f
1995	599	I need to bow out these calculations before the meeting.	f
1640	511	Un tipo de regresión que utiliza una recta de regresión y varias variables independientes	t
1523	482	Un tipo de distribución de probabilidad	f
1528	483	Identificar la relación entre dos variables	t
1529	483	Analizar la distribución de una variable	f
1531	484	La relación entre la variable independiente y la dependiente	f
1532	484	El porcentaje de varianza explicada por la regresión	t
1533	484	La tasa de error en la predicción	f
1534	484	La relación entre la media de la variable independiente y la dependiente	f
1535	485	La razón entre la varianza de la variable independiente y la depediente	f
1537	485	La varianza de la variable independiente	f
1538	485	La relación entre la media de la variable dependiente y la independiente	f
1547	488	La relación entre la variable independiente y la dependiente	t
1548	488	El porcentaje de varianza explicada por la regresión	f
1549	488	La tasa de error en la predicción	f
1564	492	Identificar la relación entre dos variables	f
1565	492	Analizar la distribución de una variable	f
1566	492	Predecir variables continuas a partir de varias variables independientes sin utilizar una recta de regresión	t
1563	492	Calcular la regresión lineal entre dos variables	f
1567	493	Un tipo de distribución de probabilidad	t
1568	493	Un método para predecir variables continuas a partir de variables independientes	f
1569	493	Un tipo de prueba de hipótesis	f
1570	493	Un análisis de frecuencias	f
1571	494	Calcular la regresión lineal entre dos variables	f
1572	494	Identificar la relación entre dos variables	f
1573	494	Analizar la distribución de una variable	f
1574	494	Predecir variables discretas a partir de varias variables independientes	t
1599	501	Un tipo de distribución de probabilidad	t
1600	501	Un método para predecir variables continuas a partir de variables independientes	f
1601	501	Un tipo de prueba de hipótesis	f
1602	501	Un análisis de frecuencias	f
1577	495	Un tipo de distribución de probabilidad	f
1578	495	Un método para calcular la relación entre dos variables no lineales	t
1575	495	Un tipo de prueba de hipótesis	f
1576	495	Un análisis de frecuencias	f
1579	496	Un tipo de distribución de probabilidad	t
1580	496	Un método para predecir variables continuas a partir de variables independientes	f
1581	496	Un tipo de prueba de hipótesis	f
1583	497	Un tipo de distribución de probabilidad	t
1584	497	Un método para predecir variables continuas a partir de variables independientes	f
1585	497	Un tipo de prueba de hipótesis	f
1586	497	Un análisis de frecuencias	f
1590	498	Un análisis de frecuencias	f
1588	498	Un método para predecir variables continuas a partir de variables independientes	f
1587	498	Un tipo de distribución de probabilidad	t
1589	498	Un tipo de prueba de hipótesis	f
1594	499	Un análisis de frecuencias	f
1591	499	Un tipo de distribución de probabilidad	t
2162	648	shin	f
2163	648	heel	t
2164	648	calf	f
2518	743	La aprobación previa del Consejo Ejecutivo.	f
2519	744	La presencia de todos los patronos.	f
2520	744	La presencia del Presidente, el Secretario y al menos la mitad de los patronos electivos.	t
2521	744	La presencia de al menos tres patronos, sea cual sea su condición.	f
2522	744	La presencia del Presidente y dos patronos más.	f
2524	745	El Presidente del Patronato (el Rector).	t
2523	745	El Gerente de la UCM.	f
2525	745	El Director General de la Fundación.	f
2526	745	Un consejero electo elegido por sus miembros.	f
2527	746	Solo las funciones administrativas de baja cuantía.	f
2528	746	Todas las facultades del Patronato que legalmente sea posible delegar, incluyendo la representación efectiva de la Fundación.	t
2529	746	Exclusivamente la gestión del personal de la Fundación.	f
1683	522	Erwin Rommel	t
1684	522	Heinz Guderian	f
1685	522	Friedrich Paulus	f
1686	522	Gerd von Rundstedt	f
1687	523	Churchill, Roosevelt y De Gaulle	f
1688	523	Stalin, Truman y Churchill	f
1689	523	Stalin, Roosevelt y Churchill	t
1690	523	Hitler, Mussolini y Hirohito	f
1691	524	Operación Barbarroja	t
1692	524	Operación León Marino	f
1693	524	Operación Weserübung	f
1694	524	Operación Tifón	f
1695	525	Batalla de Kursk	f
1696	525	Batalla de Stalingrado	t
1697	525	Batalla de Moscú	f
1698	525	Batalla de Berlín	f
1699	526	Isoroku Yamamoto	t
1700	526	Chuichi Nagumo	f
1701	526	Mitsuo Fuchida	f
1702	526	Tomoyuki Yamashita	f
1703	527	El Imperio del Japón	f
1704	527	La Italia Fascista	t
1705	527	La Unión Soviética	f
1633	509	Un modelo que relaciona dos variables lineales	t
1634	509	Un modelo que relaciona varias variables lineales	f
1637	510	Un tipo de regresión que utiliza una recta de regresión y una variable dependiente continua	t
1638	510	Un tipo de regresión que utiliza una recta de regresión y varias variables independientes	f
1635	510	Un tipo de regresión que utiliza varias variables independientes	f
1536	485	La pendiente de la recta de regresión	t
1706	527	La España Franquista	f
1707	528	Wernher von Braun	t
1708	528	Werner Heisenberg	f
1709	528	Kurt Tank	f
1710	528	Albert Speer	f
1711	529	Proyecto Manhattan	f
1712	529	Ultra	t
1713	529	Magic	f
1714	529	Overlord	f
1715	530	Dinamarca	f
1716	530	Suecia	f
1717	530	Noruega	t
1718	530	Finlandia	f
1719	531	Batalla del Mar del Coral	f
1720	531	Batalla de Midway	t
1721	531	Batalla de Guadalcanal	f
1722	531	Batalla de Leyte	f
1723	532	Philippe Pétain	f
1724	532	Charles de Gaulle	t
1725	532	Paul Reynaud	f
1726	532	Édouard Daladier	f
1727	533	Dividirla en más de 10 estados independientes.	f
1728	533	Su desmilitarización completa y permanente.	f
1729	533	Su desindustrialización y conversión en un país principalmente agrícola.	t
1730	533	La anexión total de su territorio por parte de los países vecinos.	f
1731	534	La Wehrmacht (nombre genérico de todas las fuerzas armadas alemanas)	f
1732	534	La Luftwaffe (fuerza aérea alemana)	f
1733	534	Las Divisiones Panzer (especialmente los cuerpos Panzer del Heer)	t
1734	534	Las Waffen-SS (fuerzas combatientes de las SS)	f
1735	535	Varsovia	t
1736	535	Cracovia	f
1737	535	Lodz	f
1738	535	Vilna	f
1739	536	MI5	f
1740	536	MI6 (SIS)	f
1741	536	Ejecutivo de Operaciones Especiales (SOE)	t
1742	536	Oficina de Servicios Estratégicos (OSS)	f
1743	537	Dieppe	f
1744	537	Calais	f
1745	537	Cherburgo	f
1746	537	El Havre	f
1747	537	Cherbourg (Cherburgo)	t
1748	538	Winston Churchill	f
1749	538	Neville Chamberlain	t
1750	538	Clement Attlee	f
1751	538	Anthony Eden	f
1752	539	Batalla de las Ardenas (Ofensiva de las Ardenas)	t
1753	539	Batalla de las Ardenas (Ofensiva de las Ardenas)	f
1754	539	Batalla de la Línea Sigfrido	f
1755	539	Batalla de Aquisgrán	f
1756	540	Almirante Chester W. Nimitz	f
1757	540	General Douglas MacArthur	t
1758	540	Almirante William F. Halsey Jr.	f
1759	540	General George C. Marshall	f
1760	541	La Endlösung (Solución Final)	f
1761	541	El Holocausto	f
1762	541	El sistema de campos de concentración y exterminio	t
1763	541	La Vernichtungslager (campos de exterminio)	f
1764	542	La invasión de la URSS.	f
1765	542	La 'Solución Final de la Cuestión Judía' (el Holocausto).	t
1766	542	La producción de armas V.	f
2530	746	La aprobación de la modificación de los Estatutos y la extinción de la Fundación.	f
1767	542	El uso de trabajos forzados.	f
1768	543	Creta	f
1769	543	Malta	t
1770	543	Chipre	f
1771	543	Sicilia	f
1772	544	Almirante Raymond Spruance	f
1773	544	Almirante Ernest King	f
1774	544	Almirante William F. 'Bull' Halsey	t
1775	544	Almirante Thomas C. Kinkaid	f
1776	545	Polonia y los Estados Bálticos.	t
1777	545	Checoslovaquia y Austria.	f
1778	545	Finlandia y Rumanía.	f
1779	545	Yugoslavia y Grecia.	f
1780	546	Georgy Zhukov	f
1781	546	Aleksandr Vasilevsky	t
1782	546	Ivan Konev	f
1783	546	Konstantin Rokossovsky	f
1784	547	Batalla de Iwo Jima	f
1785	547	Batalla de Guadalcanal	t
1786	547	Batalla de Tarawa	f
1787	547	Batalla de Saipán	f
1788	548	La Wehrmacht	f
1789	548	El Partido Nazi (NSDAP)	f
1790	548	Las Schutzstaffel (SS)	t
1791	548	La Sturmabteilung (SA)	f
1792	549	Operación Overlord	t
1793	549	Operación Torch	f
1794	549	Operación Market Garden	f
1795	549	Operación Husky	f
1796	550	Hungría	f
1797	550	Rumanía	f
1798	550	Bulgaria	f
1799	550	Italia	t
1800	551	General Omar Bradley	f
1801	551	General George S. Patton	t
1802	551	General Dwight D. Eisenhower	f
1803	551	General Mark W. Clark	f
1804	552	Hiroshima	f
1805	552	Nagasaki	t
1806	552	Tokio	f
1807	552	Kokura	f
1808	553	Francia	f
1809	553	Unión Soviética	f
1810	553	Gran Bretaña	t
1811	553	China	f
1812	554	Batalla de Prokhorovka	t
1813	554	Batalla de las Ardenas	f
1814	554	Batalla de El Alamein	f
1815	554	Batalla de Stalingrado	f
1816	555	Hideki Tojo	t
1817	555	Fumimaro Konoe	f
1818	555	Kantarō Suzuki	f
1819	555	Koki Hirota	f
1820	556	Dunkerque	t
1821	556	Boulogne-sur-Mer	f
1822	556	Calais	f
1823	556	Dieppe	f
1824	557	Suecia	f
1825	557	Noruega	f
1826	557	Finlandia	t
1827	557	Dinamarca	f
1828	558	Conferencia de Teherán	f
1829	558	Conferencia de Yalta	f
1830	558	Conferencia de Potsdam	t
1831	558	Conferencia de Casablanca	f
1832	559	Bombas volantes y cohetes	t
1833	559	Aviones a reacción	f
1834	559	Tanques superpesados	f
1835	559	Submarinos avanzados	f
1836	560	Batalla del Mar de Filipinas	f
1837	560	Batalla del Golfo de Leyte	t
1838	560	Batalla del Mar de Java	f
1839	560	Batalla de Midway	f
1840	561	Armia Krajowa (Ejército Nacional)	t
1841	561	Armia Ludowa (Ejército del Pueblo)	f
1842	561	Gwardia Ludowa (Guardia del Pueblo)	f
1843	561	Żydowska Organizacja Bojowa (Organización Judía de Combate)	f
1844	562	Río Elba	f
1845	562	Río Oder	f
1846	562	Río Spree	t
1847	562	Río Rin	f
1848	563	General Bernard Montgomery	f
1849	563	Lord Louis Mountbatten	t
1850	563	General Harry Crerar	f
1851	563	General Andrew McNaughton	f
1852	564	Guerra Relámpago (Blitzkrieg)	t
1853	564	Sitzkrieg (Guerra de Broma)	f
1854	564	Drôle de Guerre (Guerra Extraña)	f
1855	564	Fall Gelb (Caso Amarillo)	f
1856	565	Joseph Goebbels	t
1857	565	Hermann Göring	f
1858	565	Albert Speer	f
1859	565	Joachim von Ribbentrop	f
1860	566	Operación Millenium	t
1861	566	Operación Gomorra	f
1862	566	Operación Chastise	f
1863	566	Batalla de Berlín (aérea)	f
1864	567	Supermarine Spitfire	t
1865	567	Hawker Hurricane	f
1866	567	Avro Lancaster	f
1867	567	De Havilland Mosquito	f
1868	568	Batalla de Tobruk	f
1869	568	Batalla de El Alamein	t
1870	568	Batalla de Gazala	f
1871	568	Batalla de Bir Hakeim	f
1872	569	Erich Hartmann	t
1873	569	Gerhard Barkhorn	f
1874	569	Günther Rall	f
1875	569	Hans-Ulrich Rudel	f
1876	570	Hungría	f
1877	570	Rumanía	f
1878	570	Bulgaria	f
1879	570	Yugoslavia	t
1880	571	Winston Churchill	t
1881	571	Clement Attlee	f
1882	571	Anthony Eden	f
1883	571	Lord Halifax	f
1884	572	Línea Maginot	f
1885	572	Línea Sigfrido (Westwall)	f
1886	572	Muro Atlántico	t
1887	572	Línea Gustav	f
2547	751	Una vez al mes.	f
2548	751	Una vez al trimestre.	f
2549	751	Dos veces al año.	t
2550	751	Una vez al año.	f
2551	752	Sí, en igualdad de condiciones con cualquier otra empresa.	f
2552	752	No, en ningún caso.	f
2553	752	No, salvo que no concurra ningún licitador y se le pueda encargar la prestación.	t
2554	752	Sí, pero solo si el importe es inferior a 50.000 euros.	f
2557	753	Artículo 7.	f
2558	753	Artículo 26.	f
2555	753	Artículo 1.	t
2556	753	Artículo 3.	f
2462	729	Al Código de Comercio, por realizar actividades mercantiles accesorias.	f
2463	730	Por decisión unilateral del Director General.	f
2464	730	Por acuerdo del Patronato, mediante modificación estatutaria y comunicación al Protectorado.	t
2465	730	Automáticamente si la UCM cambia su sede principal.	f
2466	730	Requiere una autorización expresa del Ministerio de Educación.	f
2467	731	Obtener beneficios económicos para redistribuir entre los patronos.	f
2468	731	Cooperar al cumplimiento de los fines de la Universidad Complutense de Madrid.	t
2469	731	Sustituir a la Universidad en la organización de actos académicos.	f
2470	731	Actuar exclusivamente como una entidad financiera para la investigación.	f
2471	732	Promoción y gestión de la investigación.	f
2472	732	Gestión de centros de formación y enseñanzas de idiomas.	f
2473	732	Concesión de títulos universitarios oficiales.	t
2474	732	Establecimiento y gestión de becas y ayudas.	f
2635	773	En todo el territorio español, por igual.	f
2636	773	Principalmente en la Comunidad Autónoma de Madrid, por tener allí su domicilio.	t
2637	773	Exclusivamente en el campus de la Universidad Complutense.	f
2638	773	En el extranjero, para fomentar la cooperación internacional.	f
2639	774	El balance de situación.	f
2640	774	La cuenta de resultados.	f
1888	573	'Sangre, esfuerzo, lágrimas y sudor'	f
1889	573	'Esta fue su hora más gloriosa'	f
1890	573	'Lucharemos en las playas'	t
1891	573	'El fin del principio'	f
1892	574	Volgogrado	t
1893	574	Samara	f
1894	574	Kursk	f
1895	574	Rostov	f
1525	482	Un tipo de prueba de hipótesis	f
1524	482	Un método para predecir variables continuas a partir de variables independientes	t
1526	482	Un análisis de frecuencias	f
1530	483	Realizar un análisis de varianza	f
1527	483	Calcular la regresión lineal entre dos variables	f
1540	486	Regresión lineal	t
1541	486	Regresión logística	f
1542	486	Regresión no lineal	f
1539	486	Regresión cuadrática	f
1543	487	Un tipo de distribución de probabilidad	f
1544	487	Un modelo matemático que relaciona dos variables	t
1545	487	Un análisis de frecuencias	f
1546	487	Un tipo de prueba de hipótesis	f
1550	488	La relación entre la media de la variable independiente y la dependiente	f
1582	496	Un análisis de frecuencias	f
1592	499	Un método para predecir variables continuas a partir de variables independientes	f
1596	500	Un método para predecir variables continuas a partir de variables independientes	f
1598	500	Un análisis de frecuencias	f
1595	500	Un tipo de distribución de probabilidad	t
1597	500	Un tipo de prueba de hipótesis	f
1606	502	Un análisis de frecuencias	f
1604	502	Un método para predecir variables continuas a partir de variables independientes	f
1605	502	Un tipo de prueba de hipótesis	f
1603	502	Un tipo de distribución de probabilidad	t
1614	504	Un análisis de frecuencias	f
1611	504	Un tipo de distribución de probabilidad	t
1612	504	Un método para predecir variables continuas a partir de variables independientes	f
1613	504	Un tipo de prueba de hipótesis	f
1615	505	Un tipo de distribución de probabilidad	t
1616	505	Un método para predecir variables continuas a partir de variables independientes	f
1617	505	Un tipo de prueba de hipótesis	f
1561	491	Un tipo de prueba de hipótesis	f
1559	491	Un tipo de distribución de probabilidad	t
1560	491	Un método para predecir variables continuas a partir de variables independientes	f
1562	491	Un análisis de frecuencias	f
2641	774	La memoria de las cuentas anuales.	t
2642	774	El libro de actas del Patronato.	f
2643	775	Mayoría simple.	f
2644	775	El voto favorable de al menos dos terceras partes de los patronos.	t
2645	775	Unanimidad.	f
2646	775	Aprobación previa del Consejo de Gobierno de la UCM.	f
2619	769	El Gerente de la UCM.	f
2620	769	El Director General de la Fundación.	f
2621	769	El Secretario General de la UCM.	t
2622	769	El Patrono de menor edad.	f
2623	770	Son órganos colegiados de gobierno.	f
2624	770	Son nombrados por el Patronato a propuesta del Rector.	f
2625	770	Son órganos unipersonales de apoyo a la dirección, nombrados por el Consejo Ejecutivo a propuesta.	t
2626	770	Su existencia es obligatoria según los Estatutos.	f
2627	771	En los primeros tres meses del año.	f
2165	649	groin	f
2166	649	abdomen	t
2167	649	thigh	f
2168	650	temple	f
2169	650	jaw	f
2170	650	jawline	t
2171	651	forearm	t
2172	651	bicep	f
2173	651	wrist	f
2174	652	limbs	f
2175	652	torso	f
2176	652	appendages	t
2177	653	crook of the elbow	t
2178	653	back of the hand	f
2179	653	palm	f
2180	654	collarbone	t
2181	654	shoulder blade	f
2182	654	sternum	f
2183	655	hamstring	t
2184	655	ankle	f
2185	655	shin	f
2186	656	nape	f
2187	656	throat	f
2188	656	neck	t
2189	657	flank	t
2190	657	waist	f
2191	657	rib	f
2192	658	fingertips	t
2193	658	knuckles	f
2194	658	wrists	f
2195	659	brow	f
2196	659	forehead	f
2197	659	philtrum	t
2198	660	artery	t
2199	660	vein	f
2200	660	tendon	f
2201	661	Achilles tendon	f
2202	661	calf muscle	t
2203	661	hamstring	f
2204	662	lower back	t
2205	662	spine	f
2206	662	pelvis	f
2207	663	pores	f
2208	663	hair follicles	t
2209	663	skin	f
2210	664	chin	t
2211	664	jaw	f
2212	664	cheek	f
2213	665	instep	f
2214	665	arch	t
2215	665	sole	f
2216	666	fist	t
2217	666	palm	f
2218	666	grip	f
2219	667	diaphragm	f
2220	667	thorax	t
2221	667	abdomen	f
2222	668	wrist	f
2223	668	forearm	t
2224	668	bicep	f
2225	669	deltoid	t
2226	669	pectoral	f
2227	669	trapezius	f
2228	670	temples	t
2229	670	scalp	f
2230	670	brow	f
2231	671	knuckles	f
2232	671	forearms	t
2233	671	wrists	f
2234	672	womb	t
2235	672	stomach	f
2236	672	pelvis	f
2628	771	En los últimos tres meses de cada ejercicio.	t
2629	771	Simultáneamente a la aprobación de las cuentas anuales.	f
2630	771	No hay un plazo establecido.	f
2632	772	Artículo 3.	f
2634	772	Artículo 23.	f
2631	772	Artículo 1.	t
2647	776	El Protectorado.	f
2648	776	El Consejo de Gobierno de la UCM.	f
2649	776	El Patronato.	t
2650	776	El juez del concurso de acreedores.	f
2479	734	El 50%.	f
2480	734	El 70%.	t
2481	734	El 90%.	f
2482	734	El 100%.	f
2475	733	Exclusivamente por sí misma, en sus propias instalaciones.	f
2476	733	Directamente, creando otras entidades, colaborando con terceros o solicitando subvenciones, entre otros modos.	t
2477	733	Solo a través de encargos obligatorios de la UCM.	f
2606	765	A los beneficiarios de los últimos programas de la Fundación.	f
2605	765	Al Estado para ingresar en los Presupuestos Generales.	f
2608	766	Convenios de colaboración.	f
2609	766	Encargos, de ejecución obligatoria para la Fundación.	t
2610	766	Subvenciones nominativas.	f
2611	767	Artículo 8 (Destino de rentas).	f
2612	767	Artículo 9 (Inexistencia de obligación de destinar por partes iguales).	t
2613	767	Artículo 33 (Dotación).	f
2614	767	Artículo 36 (Adquisición y afectación de bienes).	f
2615	768	Cuando no haya leído la documentación previa a la reunión.	f
2616	768	Cuando tenga un conflicto de intereses, como la aprobación de un contrato con un familiar o la acción de responsabilidad contra él.	t
2617	768	Cuando el asunto a tratar no esté dentro de su área de especialización.	f
2618	768	Siempre que lo desee, sin necesidad de justificación.	f
4084	1190	Tiene picor en la piel y se está rascando de la única forma que puede.	f
4085	1190	Está limpiando el polvo y los olores ajenos que ha detectado en esos objetos.	f
4086	1191	En el lenguaje felino, una mirada fija prolongada es una amenaza. Al cerrar los ojos lentamente en tu presencia, te está demostrando que confía en ti lo suficiente como para bajar la guardia. Es el equivalente felino a un gesto de afecto y tranquilidad.	t
4087	1191	Tiene los ojos secos y necesita parpadear para humedecerlos, y lo hace de forma exagerada para que le pongas gotas.	f
4088	1191	Está evaluando la distancia y enfocando mejor tu rostro, ya que su visión cercana no es muy nítida.	f
4089	1192	Es un comportamiento de succión consoladora, a menudo visto en gatos destetados demasiado pronto. Puede ser señal de estrés, ansiedad o incluso de una condición médica subyacente (como anemia).	t
4090	1192	Tiene una carencia nutricional específica y está intentando ingerir fibras que le faltan en la dieta.	f
4091	1192	Es un instinto de limpieza dental, usando los tejidos para limpiarse los dientes.	f
4092	1193	Además del calor y la comodidad, el contacto físico constante es una manera de reforzar el vínculo social y de sentirse seguro. Tu olor y tu calor regulan su estrés y le proporcionan una sensación de pertenencia absoluta.	t
4093	1193	Te está vigilando para asegurarse de que no te levantas y le dejas solo durante la noche.	f
4094	1193	Está enfermo y necesita monitorizar constantemente tu temperatura para saber si puede contagiarse algo.	f
2478	733	Limitándose a actividades que generen ingresos por sí mismas.	f
2603	765	A los patronos, en proporción a sus años de servicio.	f
2604	765	A entidades públicas o privadas con fines de interés general análogos, consideradas beneficiarias del mecenazgo.	t
2607	766	Contratos privados entre iguales.	f
4095	1194	El maullido dirigido a humanos es en gran parte un comportamiento aprendido. Los gatos que reciben respuesta (comida, atención, juego) cuando maúllan, refuerzan esta conducta. Los gatos silenciosos pueden comunicarse más con lenguaje corporal o no haber necesitado desarrollar ese "dialecto" con su humano.	t
4096	1194	Depende únicamente de su sexo; las hembras son mucho más vocales que los machos.	f
4097	1194	Los gatos que maúllan mucho tienen problemas de tiroides que les provocan ansiedad por vocalizar.	f
4098	1195	La hierba actúa como un desparasitante natural y un agente que ayuda a expulsar bolas de pelo y otros elementos no digeribles del tracto digestivo. El vómito es, en muchos casos, la forma de expulsar esas molestias.	t
4099	1195	Es un error alimenticio; el gato confunde la hierba con una presa y al darse cuenta de que no es nutritiva, la vomita.	f
4100	1195	Tiene dolor de estómago y la hierba le sirve para provocar el vómito y aliviar el malestar, como un antiácido natural.	f
1618	505	Un análisis de frecuencias	f
1619	506	Un tipo de distribución de probabilidad	t
1620	506	Un método para predecir variables continuas a partir de variables independientes	f
1621	506	Un tipo de prueba de hipótesis	f
1622	506	Un análisis de frecuencias	f
1554	489	Un análisis de frecuencias	f
1551	489	Un tipo de distribución de probabilidad	t
1552	489	Un método para predecir variables continuas a partir de variables independientes	f
1553	489	Un tipo de prueba de hipótesis	f
1555	490	Calcular la regresión lineal entre dos variables	f
1556	490	Identificar la relación entre dos variables	f
1557	490	Analizar la distribución de una variable	f
1558	490	Predecir variables continuas a partir de varias variables independientes	t
1607	503	Un tipo de distribución de probabilidad	t
1608	503	Un método para predecir variables continuas a partir de variables independientes	f
1609	503	Un tipo de prueba de hipótesis	f
4101	1196	Agresión redirigida o juego predatorio excesivo. El gato entra en un estado de excitación tan alto que su instinto de caza toma el control y ya no distingue el juego de una presa real. La huida es parte del patrón de caza (ataque y retirada).	t
4102	1196	Es un ataque de ira repentino porque no le ha gustado cómo jugabas y quiere castigarte.	f
4103	1196	Tiene un problema neurológico que le provoca convulsiones durante el juego intenso.	f
4104	1197	Puede ser un signo de que no se siente bien (dolor artrítico, malestar) y busca lugares más tranquilos, oscuros y aislados para descansar, instintivamente escondiéndose como lo haría un animal enfermo en la naturaleza.	t
4105	1197	Está aburrido de su entorno y busca nuevos estímulos explorando zonas inusuales para dormir.	f
4106	1197	Ha decidido que ya no eres de su agrado y quiere poner distancia social contigo.	f
4107	1198	Es una expresión de frustración y excitación predatoria extrema. Se teoriza que es una imitación del sonido de la mordida mortal o un reflejo neuromuscular relacionado con el instinto de morder el cuello de la presa.	t
4108	1198	Es un intento fallido de imitar el canto del pájaro para atraerlo y hacer que se acerque.	f
4109	1198	Tiene frío y le castañetean los dientes por la baja temperatura cerca de la ventana.	f
4527	1323	Acreditar una experiencia profesional efectiva mínima de tres años fuera de la Universidad.	t
4528	1323	Haber obtenido una evaluación positiva de la ANECA.	f
4529	1323	Haber completado un programa de formación pedagógica.	f
4530	1324	A los 65 años.	f
4531	1324	A los 67 años.	f
4532	1324	A los 70 años.	t
4533	1324	A los 72 años.	f
4534	1325	Ayudante.	f
1610	503	Un análisis de frecuencias	f
4535	1325	Profesor/a Ayudante Doctor.	f
4536	1325	Profesor/a Contratado Doctor.	t
4537	1325	Profesor/a Visitante.	f
4538	1326	Percibir las remuneraciones que les corresponda por su actividad y dedicación.	t
4539	1326	Realizar actividades políticas dentro del recinto universitario.	f
4540	1326	Negarse a someter su actividad docente a evaluación.	f
4541	1326	Utilizar los medios de la Universidad para fines personales y empresariales.	f
4542	1327	El personal funcionario de las escalas de la UCM.	f
4543	1327	El personal funcionario perteneciente a cuerpos de otras Administraciones Públicas.	f
4544	1327	El personal laboral, contratado permanente y temporal.	t
4545	1327	Todo el PAS, con independencia de su vínculo.	f
4546	1328	El grupo de adscripción.	f
4547	1328	La valoración individual del desempeño del titular del puesto.	t
1017	320	Vasco Núñez de Balboa	f
1018	320	Fernando Magallanes	f
1019	320	Vasco da Gama	t
1020	321	Manila	f
1021	321	Cebú	t
1022	321	Zamboanga	f
1023	322	Vasco Núñez de Balboa	f
1024	322	Fernando Magallanes	f
1025	322	Vasco da Gama	t
1026	323	El Estrecho de Magallanes	f
1027	323	El Estrecho de Panamá	f
1028	323	El Pasaje de Magallanes	t
1029	324	Hernando Cortés	t
1030	324	Francisco Vásquez de Coronado	f
4170	1219	Grasas	f
4171	1219	Proteínas	f
4172	1219	Carbohidratos	t
4173	1220	Mejora la digestión	f
4174	1220	Aumenta la producción de energía	f
4175	1220	Incrementa el riesgo de enfermedades cardiovasculares	t
2981	864	Nerón	f
1031	324	Gonzalo de Sandoval	f
1032	325	La Expedición de Vasco Núñez de Balboa	f
1033	325	La Expedición de Fernando Magallanes	f
1034	325	La Expedición de la Victoria	t
1035	326	Fernando Magallanes	f
1036	326	Vasco Núñez de Balboa	f
1037	326	Diogo Cão	t
1038	327	México City	t
1039	327	Veracruz	f
1040	327	Casa Blanca	f
1041	328	Juan Sebastián Elcano	t
1042	328	Fernando Magallanes	f
1043	328	Pedro Álvarez de Mendoza	f
1044	329	El Estrecho de Magallanes	f
1045	329	El Estrecho de Panamá	t
1046	329	El Pasaje de Magallanes	f
1047	330	Francisco Pizarro	t
1048	330	Gonzalo Pizarro	f
1049	330	Francisco Vásquez de Coronado	f
1050	331	La Expedición de Vasco Núñez de Balboa	f
1051	331	La Expedición de Fernando Magallanes	t
1052	331	La Expedición de la Victoria	f
993	312	Francisco Pizarro	f
994	312	Hernando Cortés	f
995	312	Francisco Vásquez de Coronado	t
996	313	Descubrir la Ruta Marítima hacia China	f
997	313	Explorar el Río Amazonas	f
998	313	Descubrir el Estrecho de Panamá	t
999	314	Juan Sebastián Elcano	f
1000	314	James Cook	f
1001	314	Willem Janszoon	t
1002	315	México City	f
1003	315	Veracruz	t
1004	315	Puebla	f
1005	316	Juan Sebastián Elcano	t
1006	316	Fernando Magallanes	f
1007	316	Pedro Álvarez de Mendoza	f
1008	317	El Canal de Panamá	f
1009	317	El Estrecho de Magallanes	f
1010	317	El Estrecho de Panamá	t
1011	318	Francisco Hernández de Córdoba	f
1012	318	Hernando Cortés	f
1013	318	Francisco Vásquez de Coronado	t
1014	319	La Expedición de Vasco Núñez de Balboa	f
1015	319	La Expedición de Juan Sebastián Elcano	f
1016	319	La Expedición de la Victoria	t
4176	1221	Proporcionan energía	f
4177	1221	Ayudan a regular el metabolismo	f
4178	1221	Son esenciales para la construcción y reparación de tejidos	t
4179	1222	Mejora la digestión	f
4180	1222	Aumenta la producción de energía	f
4181	1222	Incrementa el riesgo de diabetes y obesidad	t
4182	1223	Carbohidratos	f
4183	1223	Grasas	f
4184	1223	Proteínas	t
4185	1224	Incrementa el riesgo de enfermedades cardiovasculares	f
4186	1224	Mejora la digestión	f
4187	1224	Proporciona energía y apoya la función cerebral	t
4188	1225	Proteínas	f
4189	1225	Grasas	f
4190	1225	Carbohidratos	t
4191	1226	Incrementa el riesgo de enfermedades cardiovasculares	f
4192	1226	Mejora la digestión	f
4193	1226	Proporciona energía y apoya la función cerebral	t
4194	1227	Carbohidratos	f
4195	1227	Grasas	f
4196	1227	Proteínas	t
4197	1228	Incrementa el riesgo de enfermedades cardiovasculares	f
4198	1228	Mejora la digestión	f
4199	1228	Puede causar daño renal y hepático	t
4548	1328	El sistema de provisión (concurso, libre designación).	f
4549	1328	Los requisitos exigidos para su desempeño.	f
4550	1329	40 por 100.	f
4551	1329	50 por 100.	f
4552	1329	60 por 100.	t
4553	1329	70 por 100.	f
4554	1330	Al menos uno de los cinco.	f
4555	1330	Al menos dos de los cinco.	t
4556	1330	Al menos tres de los cinco.	f
4557	1330	La mayoría simple, es decir, tres.	f
4558	1331	Son becarios en formación predoctoral.	f
4559	1331	Son contratados para el desarrollo de proyectos concretos de investigación, con duración ligada a la obra o servicio.	t
4560	1331	Son personal laboral fijo con dedicación exclusiva a la investigación.	f
4561	1331	Son profesores asociados que realizan funciones de investigación.	f
4562	1332	Al Consejo de Gobierno.	f
4563	1332	Al/la Gerente.	f
4564	1332	Al Rector/a.	t
4565	1332	Al Defensor/a Universitario.	f
4566	1333	El Rector/a puede cambiar la dedicación de un profesor por necesidades del servicio sin su consentimiento.	f
4567	1333	Ningún profesor/a podrá ser obligado a cambiar el régimen de dedicación al que se hubiere acogido.	t
4568	1333	La dedicación a tiempo completo es obligatoria para todos los funcionarios docentes.	f
4569	1333	El cambio de dedicación a tiempo parcial solo se permite por razones de salud.	f
4570	1334	Profesor/a Ayudante Doctor y Profesor/a Contratado Doctor.	f
4571	1334	Profesor/a Asociado.	f
4572	1334	Profesor/a Visitante y Profesor/a Emérito.	t
4573	1334	Ayudante.	f
4574	1335	Los becarios no pueden colaborar en tareas docentes, mientras que los contratados sí.	f
4575	1335	Los becarios no tienen relación contractual con la Universidad, sino que son beneficiarios de ayudas.	t
4576	1335	Los becarios deben tener el título de Doctor, mientras que los contratados no.	f
4577	1335	Los becarios son asimilados al sector de estudiantes a efectos electorales.	f
4578	1336	El Comité de Empresa de PDI laboral.	f
4579	1336	La Junta de Personal Docente e Investigador.	t
4580	1336	El Consejo de Departamento.	f
4581	1336	El Claustro Universitario.	f
4582	1337	El derecho a una compensación económica equivalente al salario.	f
4583	1337	El derecho a la reserva del puesto de trabajo y al cómputo de antigüedad.	t
4584	1337	El derecho a reingresar en un puesto de categoría superior.	f
4585	1337	El derecho a percibir el 50% de las retribuciones.	f
4586	1338	Profesor/a Asociado.	f
4587	1338	Profesor/a Visitante.	f
4588	1338	Profesor/a Emérito.	f
4589	1338	Profesor/a Contratado Doctor.	t
4590	1339	Facultades.	f
4591	1339	Departamentos.	f
4592	1339	Escuelas de Doctorado.	t
4593	1339	Institutos Universitarios de Investigación.	f
4594	1340	Organizar las enseñanzas de una sola titulación.	f
4595	1340	Coordinar las enseñanzas de uno o varios ámbitos del conocimiento en uno o varios Centros.	t
4596	1340	Gestionar los recursos económicos de la Facultad.	f
4597	1340	Expedir los títulos oficiales.	f
4598	1341	Los Institutos Propios.	f
4599	1341	Los Institutos Interuniversitarios y Mixtos (y Adscritos), siempre que se determine en su creación.	t
4600	1341	Ningún instituto puede tener personalidad jurídica propia, ya que son parte de la UCM.	f
4601	1341	Solo los Institutos Mixtos, por su colaboración con entidades privadas.	f
4602	1342	El Personal Docente e Investigador adscrito.	f
4603	1342	El Personal de Administración y Servicios que desempeña sus funciones en el Centro.	f
4604	1342	Los estudiantes matriculados en las titulaciones del Centro.	t
4605	1342	El Personal Docente e Investigador que haya sido adscrito a las mismas por el Consejo de Gobierno.	f
4606	1343	Informe vinculante.	f
4607	1343	Informe preceptivo.	t
4608	1343	Informe de gestión.	f
4609	1343	Informe financiero.	f
4610	1344	Ser promovidos exclusivamente por la UCM.	f
4611	1344	Estar constituidos por la UCM con otras entidades públicas o privadas sin ánimo de lucro.	t
4612	1344	Ser centros docentes privados adscritos a la UCM.	f
4200	1229	Evaluar la originalidad de un texto	f
4201	1229	Analisar y evaluar la obra literaria en su contexto cultural y histórico	t
4202	1229	Crear una teoría personal sobre la literatura	f
4203	1230	Identificar el autor del texto	f
4204	1230	Ofrecer una explicación única y no discutible del texto	f
4205	1230	Proporcionar múltiples interpretaciones y análisis del texto	t
4206	1231	Promover la ignorancia literaria	f
4207	1231	Influenciar la opinión pública sobre la literatura	t
4208	1231	Crear una norma única de crítica literaria	f
4209	1232	Lectura superficial del texto	f
4210	1232	Análisis y evaluación del texto en su contexto cultural y histórico	t
4211	1232	Crear una teoría personal sobre la literatura sin análisis	f
4212	1233	Influenciar la opinión pública sobre la literatura	t
4213	1233	Crear una norma única de crítica literaria	f
4214	1233	Promover la ignorancia literaria	f
4215	1234	Promover la ignorancia literaria	f
4216	1234	Fomentar la comprensión y el análisis crítico de la literatura	t
4217	1234	Crear una norma única de crítica literaria	f
4218	1235	Lectura superficial del texto	f
4219	1235	Análisis y evaluación del texto en su contexto cultural y histórico	t
4220	1235	Crear una teoría personal sobre la literatura sin análisis	f
4221	1236	Promover la ignorancia literaria	f
4222	1236	Crear una norma única de crítica literaria	f
4223	1236	Influenciar la opinión pública sobre la literatura	t
4224	1237	Crear una norma única de crítica literaria	f
4225	1237	Influenciar la opinión pública sobre la literatura	t
4226	1237	Promover la ignorancia literaria	f
4227	1238	Crear una teoría personal sobre la literatura sin análisis	f
4228	1238	Lectura superficial del texto	f
4229	1238	Análisis y evaluación del texto en su contexto cultural y histórico	t
4230	1239	Crear una norma única de crítica literaria	f
4231	1239	Promover la ignorancia literaria	f
4232	1239	Influenciar la opinión pública sobre la literatura	t
4233	1240	Crear una norma única de crítica literaria	f
4234	1240	Promover la ignorancia literaria	f
4235	1240	Fomentar la comprensión y el análisis crítico de la literatura	t
4236	1241	Lectura superficial del texto	f
4237	1241	Crear una teoría personal sobre la literatura sin análisis	f
4238	1241	Análisis y evaluación del texto en su contexto cultural y histórico	t
4239	1242	Crear una norma única de crítica literaria	f
4240	1242	Promover la ignorancia literaria	f
4241	1242	Influenciar la opinión pública sobre la literatura	t
4242	1243	Promover la ignorancia literaria	f
4243	1243	Crear una norma única de crítica literaria	f
2979	864	Julio César	f
2980	864	Augusto	t
2982	865	Roma	t
2983	865	Atenas	f
2984	865	Esparta	f
2985	866	Griego	f
2986	866	Latín	t
2987	866	Etrusco	f
2988	867	Un templo	f
2989	867	Un anfiteatro	t
2990	867	Un foro	f
2991	868	En el año 500 a.C.	f
2992	868	En el año 27 a.C.	t
2993	868	En el año 100 d.C.	f
2994	869	Trajano	f
2995	869	Adriano	t
2996	869	Hadriano	f
2997	870	Un período de guerra	f
2998	870	Un período de paz	t
2999	870	Un período de hambruna	f
3000	871	El cristianismo	f
3001	871	El paganismismo	t
3002	871	El judaísmo	f
3003	872	Nerón	t
3004	872	Calígula	f
3005	872	César	f
3006	873	Un grupo de soldados	t
3007	873	Un grupo de civiles	f
3008	873	Un grupo de gladiadores	f
3009	874	La agricultura	f
3010	874	La minería	t
3011	874	El comercio	f
3012	875	Un grupo de senadores	t
3013	875	Un grupo de soldados	f
3014	875	Un grupo de civiles	f
3015	876	En el año 100 a.C.	f
3016	876	En el año 27 a.C.	f
3017	876	En el año 476 d.C.	t
3018	877	Julio César	f
3019	877	Augusto	f
2534	747	El Gerente de la Universidad Complutense.	f
2536	748	Aprobar el plan de actuación y las cuentas anuales.	f
2537	748	Ser el órgano de contratación de la Fundación y firmar contratos.	t
2538	748	Nombrar y cesar a los miembros del Patronato.	f
2539	749	Los bienes dotacionales iniciales y los afectados permanentemente a sus fines.	f
2540	749	Las herencias, legados, donaciones y subvenciones que reciba.	f
2541	749	El patrimonio personal de los patronos, en garantía de las deudas.	t
2542	749	Los bienes muebles, inmuebles y valores mobiliarios que adquiera.	f
2544	750	Al Consejo Ejecutivo, por delegación del Patronato, salvo en casos que requieran autorización del Protectorado.	t
2545	750	Exclusivamente al Patronato en pleno.	f
2546	750	Al Gerente de la Fundación.	f
3020	877	Claudio	t
3021	878	Un templo	t
3022	878	Un anfiteatro	f
3023	878	Un foro	f
3024	879	La energía hidroeléctrica	f
3025	879	La energía solar	f
3026	879	La energía animal	t
3027	880	Un anfiteatro	f
3028	880	Un templo	f
3029	880	Un mercado	t
3030	881	Trajano	f
3031	881	Adriano	f
3032	881	Augusto	t
3033	882	Un templo	f
3034	882	Un anfiteatro	t
3035	882	Un foro	f
3036	883	El cristianismo	f
3037	883	El paganismismo	t
3038	883	El judaísmo	f
3039	884	Nerón	t
3040	884	Calígula	f
3041	884	César	f
3042	885	Un grupo de soldados	t
3043	885	Un grupo de civiles	f
3044	885	Un grupo de gladiadores	f
3045	886	La agricultura	f
3046	886	La minería	t
3047	886	El comercio	f
3048	887	Un grupo de senadores	t
3049	887	Un grupo de soldados	f
3050	887	Un grupo de civiles	f
3051	888	En el año 100 a.C.	f
3052	888	En el año 27 a.C.	f
3053	888	En el año 476 d.C.	t
3054	889	Julio César	f
3055	889	Augusto	f
3056	889	Cludio	t
3057	890	Un templo	t
3058	890	Un anfiteatro	f
3059	890	Un foro	f
3060	891	La energía hidroeléctrica	f
3061	891	La energía solar	f
3062	891	La energía animal	t
3063	892	Un anfiteatro	f
3064	892	Un templo	f
3065	892	Un mercado	t
3066	893	Trajano	f
3067	893	Adriano	f
3068	893	Augusto	t
3069	894	Un templo	f
3070	894	Un anfiteatro	t
3071	894	Un foro	f
3072	895	El cristianismo	f
3073	895	El paganismismo	t
3074	895	El judaísmo	f
3075	896	Nerón	t
3076	896	Calígula	f
3077	896	César	f
3078	897	Un grupo de soldados	t
3079	897	Un grupo de civiles	f
3080	897	Un grupo de gladiadores	f
3081	898	La agricultura	f
3082	898	La minería	t
3083	898	El comercio	f
3091	901	Augusto	f
3093	902	Un templo	t
3094	902	Un anfiteatro	f
3095	902	Un foro	f
3096	903	La energía hidroeléctrica	f
3097	903	La energía solar	f
3098	903	La energía animal	t
4244	1243	Influenciar la opinión pública sobre la literatura	t
4245	1244	Crear una teoría personal sobre la literatura sin análisis	f
4246	1244	Lectura superficial del texto	f
4247	1244	Análisis y evaluación del texto en su contexto cultural y histórico	t
4248	1245	Crear una norma única de crítica literaria	f
4249	1245	Promover la ignorancia literaria	f
4250	1245	Influenciar la opinión pública sobre la literatura	t
4251	1246	Crear una norma única de crítica literaria	f
4252	1246	Promover la ignorancia literaria	f
4253	1246	Fomentar la comprensión y el análisis crítico de la literatura	t
4254	1247	Lectura superficial del texto	f
4255	1247	Crear una teoría personal sobre la literatura sin análisis	f
4256	1247	Análisis y evaluación del texto en su contexto cultural y histórico	t
4257	1248	Crear una norma única de crítica literaria	f
4258	1248	Promover la ignorancia literaria	f
4259	1248	Influenciar la opinión pública sobre la literatura	t
4613	1344	Tener su sede exclusivamente en el extranjero.	f
4614	1345	La homologación de su título extranjero.	f
4615	1345	Un permiso para ejercer la docencia otorgado por la UCM.	t
4616	1345	La acreditación nacional de la ANECA.	f
4617	1345	El título de Doctor.	f
4618	1346	Las Clínicas Universitarias.	f
4619	1346	El Hospital Clínico Veterinario.	f
4620	1346	Los Hospitales Universitarios y asociados.	t
4621	1346	Las Escuelas de Especialización Profesional.	f
4622	1347	Obtener un título de grado oficial.	f
4623	1347	El mejor ejercicio de la profesión por los titulados universitarios.	t
4624	1347	La formación de investigadores noveles.	f
4625	1347	La obtención del título de Doctor.	f
4626	1348	Las condiciones para la creación, modificación o supresión.	f
4627	1348	El contenido mínimo de sus Estatutos o Reglamento Interno.	f
4628	1348	El régimen económico y fiscal específico de cada centro.	t
4629	1348	Las normas generales que deben respetar en el ejercicio de sus competencias.	f
4630	1349	La naturaleza de los conocimientos que imparte dentro de los planes de estudio.	f
4631	1349	La Facultad o Escuela donde desarrollan su actividad la mayoría de sus miembros.	f
4632	1349	La disponibilidad de recursos materiales y personales.	f
4633	1349	La cercanía geográfica a la residencia del Director/a del Departamento.	t
4260	1249	Un género literario que se centra en la narrativa	f
4261	1249	La creación de obras de teatro y la dirección de actores	t
4262	1249	Un estilo de escritura que se enfoca en la poesía	f
4263	1250	Una conversación entre dos personajes	f
4264	1250	Un diálogo entre un personaje y el público	f
4265	1250	Una pieza de diálogo hablada por un solo personaje	t
4266	1251	Crear obras de teatro	f
4267	1251	Dirigir a actores	f
4268	1251	Desarrollar la trama y los personajes de una obra de teatro	t
4269	1252	El personaje principal de la obra	f
4270	1252	El personaje que tiene más diálogo	f
4271	1252	Un personaje que apoya al personaje principal	t
4272	1253	El comienzo de la obra	f
4273	1253	Un diálogo entre personajes	f
4274	1253	La conclusión de la trama y la resolución de los conflictos	t
4275	1254	Un texto que se centra en la narrativa	f
4276	1254	Un texto que se enfoca en la descripción	f
4277	1254	Un texto que se centra en la acción y el diálogo	t
4278	1255	Un personaje que tiene características únicas	f
4279	1255	Un personaje que se ajusta a un patrón o estereotipo	t
4280	1255	Un personaje que es muy complejo	f
4281	1256	Un estilo de teatro que se enfoca en la comedia	f
4282	1256	Un estilo de teatro que se centra en la acción y la aventura	t
4283	1256	Un estilo de teatro que se enfoca en la drama y la tragedia	f
568	170	Portugal	f
569	170	España	t
570	171	FC Barcelona	f
571	171	Real Madrid	t
572	171	Valencia CF	f
483	142	1902	f
484	142	1913	t
485	142	1920	f
486	143	FC Barcelona	t
487	143	Real Madrid	f
488	143	Athletic Club	f
489	144	FC Barcelona	f
490	144	Real Madrid	t
491	144	Valencia CF	f
492	145	3	f
493	145	5	t
494	145	7	f
4284	1257	Un texto que se centra en la narrativa	f
4285	1257	Un texto que se enfoca en la descripción	f
4286	1257	Un texto que se centra en la conversación entre personajes	t
4287	1258	Un personaje que se ajusta a un patrón o estereotipo	f
4288	1258	Un personaje que cambia y se desarrolla a lo largo de la obra	t
4289	1258	Un personaje que es muy complejo	f
4290	1259	Un estilo de dramaturgia que se enfoca en la comedia	f
4291	1259	Un estilo de dramaturgia que se centra en la acción y la aventura	f
4292	1259	Un estilo de dramaturgia que se enfoca en la experimentación y la innovación	t
4293	1260	Un texto que se centra en la narrativa	f
4294	1260	Un texto que se enfoca en la descripción	f
4295	1260	Un texto que se centra en la acción y el diálogo y que explora temas contemporáneos	t
4296	1261	Un estilo de teatro que se enfoca en la comedia	f
4297	1261	Un estilo de teatro que se centra en la acción y la aventura	f
4298	1261	Un estilo de teatro que se enfoca en la experimentación y la innovación	t
4299	1262	El personaje principal de la obra	f
4300	1262	El personaje que tiene más diálogo	f
4301	1262	Un personaje que apoya al personaje principal	t
4302	1263	El comienzo de la obra	f
4303	1263	Un diálogo entre personajes	f
4304	1263	La conclusión de la trama y la resolución de los conflictos	t
4305	1264	Un texto que se centra en la narrativa	f
4306	1264	Un texto que se enfoca en la descripción	f
4307	1264	Un texto que se centra en la acción y el diálogo	t
4308	1265	Un personaje que tiene características únicas	f
3429	1014	La muerte de Julio César en los idus de marzo.	f
3430	1014	La concesión del título de 'Augusto' a Octavio por el Senado en el 27 a.C.	t
3431	1014	La batalla de Actium, donde Octavio derrota a Marco Antonio.	f
3432	1014	La reforma del ejército llevada a cabo por Cayo Mario.	f
3433	1015	Dinastía Flavia.	f
3434	1015	Dinastía Antonina.	f
3435	1015	Dinastía Julia-Claudia.	t
3436	1015	Dinastía Severa.	f
3437	1016	Trajano.	f
3438	1016	Augusto.	t
3439	1016	Marco Aurelio.	f
3440	1016	Constantino.	f
3441	1017	Una larga guerra contra el Imperio Parto.	f
3442	1017	La presión simultánea de invasiones bárbaras en las fronteras y una serie de guerras civiles por el poder imperial.	t
3443	1017	Una plaga que diezmó exclusivamente a la ciudad de Roma.	f
4309	1265	Un personaje que se ajusta a un patrón o estereotipo	t
4310	1265	Un personaje que es muy complejo	f
4311	1266	Un estilo de teatro que se enfoca en la comedia	f
4312	1266	Un estilo de teatro que se centra en la acción y la aventura	t
4313	1266	Un estilo de teatro que se enfoca en la drama y la tragedia	f
4314	1267	Un texto que se centra en la narrativa	f
561	168	Sevilla FC	f
562	168	Real Betis	t
563	168	Málaga CF	f
564	169	Osasuna	f
565	169	Real Sociedad	t
566	169	Eibar	f
567	170	Francia	f
3444	1017	La independencia definitiva de la provincia de Britania.	f
3445	1018	Dividir el imperio en dos mitades, Oriente y Occidente, gobernadas por dos augustos y dos césares (Tetrarquía).	t
3446	1018	Convertir todas las provincias en reinos autónomos federados.	f
3447	1018	Abolir el Senado y concentrar todo el poder en el emperador.	f
3448	1018	Decretar la libertad religiosa total, incluido el cristianismo.	f
3449	1019	Constantino I.	t
3450	1019	Teodosio I.	f
3451	1019	Juliano el Apóstata.	f
2839	824	Una empresa con ánimo de lucro.	f
2840	824	Una entidad sin ánimo de lucro.	t
2841	824	Un organismo oficial del Ministerio de Educación.	f
2842	824	Una asociación de estudiantes.	f
2843	825	Gestionar las instalaciones deportivas de la Universidad.	f
2844	825	Cooperar al cumplimiento de los fines de la Universidad Complutense de Madrid.	t
2845	825	Organizar exclusivamente eventos culturales.	f
2846	825	Financiar proyectos de investigación privada.	f
2847	826	El Consejo Ejecutivo.	f
2848	826	El Director General.	f
2849	826	El Patronato.	t
2850	826	El Rector de la UCM.	f
2851	827	El Secretario General de la UCM.	f
2852	827	El Gerente de la UCM.	f
2853	827	El Director General de la Fundación.	f
2854	827	El Rector de la UCM.	t
2855	828	En la Ciudad Universitaria, dentro del campus de la UCM.	f
2856	828	En la calle Doctor Severo Ochoa nº 7, Madrid.	t
2857	828	En la sede del Rectorado de la UCM.	f
2858	828	Los Estatutos no especifican un domicilio.	f
2859	829	Expedir títulos universitarios oficiales (grados, másteres).	f
2860	829	Gestionar becas y ayudas para estudiantes y profesores.	t
2861	829	Administrar la matrícula oficial de los alumnos de la UCM.	f
2862	829	Contratar y despedir al profesorado de la Universidad.	f
2863	830	Patronos Electivos.	f
2864	830	Patronos Honoríficos.	f
2865	830	Patronos Natos.	t
2866	830	Patronos Vitalicios.	f
2867	831	El 50%.	f
2868	831	El 70%.	t
2869	831	El 90%.	f
2870	831	El 100%.	f
2871	832	El Patronato.	f
2872	832	El Consejo Ejecutivo.	f
2873	832	El Director General.	t
2874	832	El Secretario del Patronato.	f
2875	833	10 años, prorrogables.	f
2876	833	25 años.	f
2877	833	50 años.	f
2878	833	Duración indefinida.	t
2879	834	No, solo puede actuar en la Comunidad de Madrid.	f
2880	834	Sí, podrá desarrollar actividades en todo el territorio español o en el extranjero.	t
2881	834	Solo si obtiene un permiso especial del Ministerio de Asuntos Exteriores.	f
2882	834	Solo para actividades de cooperación al desarrollo.	f
2883	835	El principio del turno rotatorio.	f
2884	835	Los principios de mérito y capacidad.	t
2885	835	Exclusivamente la situación de necesidad económica.	f
2886	835	La antigüedad como estudiante en la UCM.	f
2887	836	Una vez al mes.	f
2888	836	Una vez al trimestre.	f
2889	836	Dos veces al año.	t
2890	836	Una vez al año.	f
2891	837	El Rector de la UCM de forma directa.	f
2892	837	El Patronato por mayoría absoluta.	f
2893	837	El Consejo Ejecutivo, a propuesta del Presidente (Rector).	t
2894	837	El Consejo de Gobierno de la UCM.	f
2895	838	Solo la dotación inicial de dinero.	f
2896	838	Todos sus bienes y derechos, como bienes dotacionales, donaciones, subvenciones y los ingresos de sus actividades.	t
2897	838	Exclusivamente los bienes inmuebles que posea.	f
2898	838	Solo las aportaciones de los patronos.	f
2899	839	La Gerencia.	f
2900	839	La Subdirección.	f
2901	839	El Consejo Ejecutivo.	t
2902	839	La Comisión de Control.	f
2903	840	El Acta Fundacional.	f
2904	840	El Plan de Actuación.	t
2905	840	El Reglamento de Régimen Interior.	f
2906	840	El Estatuto del Personal.	f
2907	841	Mayoría simple (mitad más uno de los asistentes).	f
2908	841	Mayoría de dos tercios de sus miembros.	t
2909	841	Unanimidad de todos los patronos.	f
2910	841	Mayoría absoluta de los miembros totales.	f
2911	842	Se reparten entre los patronos.	f
2912	842	Se devuelven a los donantes originales.	f
2913	842	Se destinan a otra fundación o entidad con fines similares de interés general.	t
2914	842	Pasan a ser propiedad del Estado.	f
2915	843	Artículo 1.	f
2916	843	Artículo 6.	t
2917	843	Artículo 12.	f
2918	843	Artículo 32.	f
3452	1019	Justiniano.	f
3453	1020	El saqueo de Roma por los visigodos de Alarico.	f
3454	1020	La deposición del último emperador, Rómulo Augústulo, por el germano Odoacro.	t
3455	1020	La batalla de Adrianópolis contra los godos.	f
3456	1020	La división definitiva del imperio entre los hijos de Teodosio.	f
3457	1021	Tributum.	t
3458	1021	Vectigal.	f
3459	1021	Annona.	f
3460	1021	Stipendium.	f
3461	1022	El Muro de Antonino.	f
3462	1022	El Limes Germanicus.	f
3463	1022	El Muro de Adriano.	t
3464	1022	La Muralla Aureliana.	f
3465	1023	Justiniano I, que ordenó la recopilación del 'Corpus Iuris Civilis'.	t
3466	1023	Teodosio II, que promulgó el 'Código Teodosiano'.	f
3467	1023	Constantino I, creador del 'Código de Constantino'.	f
3468	1023	Trajano, que ordenó las 'Institutas'.	f
3469	1024	Siria.	f
3470	1024	Galacia.	f
3471	1024	Egipto.	t
3472	1024	Macedonia.	f
3473	1025	La creación de la Guardia Pretoriana.	f
3474	1025	La profesionalización del ejército: los soldados pasaron a ser asalariados del Estado y recibían tierras al retirarse.	t
3475	1025	La división de las legiones en cohortes.	f
3476	1025	La adopción generalizada de la caballería pesada.	f
3477	1026	Pontifex Maximus.	t
3478	1026	Flamen Dialis.	f
3479	1026	Augur.	f
3480	1026	Rex Sacrorum.	f
3481	1027	Orden Ecuestre (Equites).	f
3482	1027	Orden Senatorial (Nobilitas).	t
3483	1027	Clientes.	f
3484	1027	Libertos.	f
3485	1028	La Guerra Social.	f
3486	1028	La Guerra de los Mercenarios.	f
3487	1028	La Tercera Guerra Servil.	t
3488	1028	La Revuelta de los Aliados.	f
3489	1029	El incendio de la Subura, atribuido a Claudio.	f
3490	1029	El Gran Incendio de Roma, atribuido a Nerón.	t
3491	1029	El incendio del Capitolio, atribuido a Vitelio.	f
3492	1029	El incendio del Foro, atribuido a Calígula.	f
3493	1030	El poder de convocar al Senado (ius agendi cum patribus).	f
3494	1030	El poder de veto (intercessio) sobre las decisiones de magistrados y senado.	t
3495	1030	El poder de comandar legiones (imperium militiae).	f
3496	1030	El poder de celebrar triunfos.	f
3497	1031	El río Tíber, cerca de Roma.	f
3498	1031	El río Rubicón, que separaba la Galia Cisalpina de Italia.	t
3499	1031	El río Rin, adentrándose en Germania.	f
3500	1031	El río Éufrates, frontera con Partia.	f
3501	1032	La división del imperio en dos prefecturas.	f
3502	1032	La concesión de la ciudadanía romana a casi todos los habitantes libres del imperio.	t
3503	1032	La prohibición de todos los cultos paganos.	f
3504	1032	El traslado de la capital a Constantinopla.	f
3505	1033	Los vándalos.	f
3506	1033	Los hunos.	f
3507	1033	Los visigodos, liderados por Alarico.	t
3508	1033	Los ostrogodos.	f
3509	1034	La Tetrarquía.	f
3510	1034	La Monarquía Absoluta.	f
3511	1034	El Principado.	t
3512	1034	La Dominación o Dominado.	f
3513	1035	Romanización.	f
3514	1035	Helenización.	t
3515	1035	Sincretismo.	f
3516	1035	Latinización.	f
3517	1036	La batalla de Cannas.	f
3518	1036	La batalla del Bosque de Teutoburgo.	t
3519	1036	La batalla de Adrianópolis.	f
3520	1036	La batalla de Farsalia.	f
3521	1037	Numidia y Mauritania.	f
3522	1037	Egipto y Cirenaica.	f
3523	1037	África Proconsular y Siria.	f
3524	1037	África Proconsular (Cartago) y la región de Leptis Magna (en la actual Libia).	t
3525	1038	El Circo Máximo.	f
3526	1038	El Teatro de Marcelo.	f
3527	1038	El Panteón de Agripa.	f
3528	1038	El Coliseo (Anfiteatro Flavio).	t
3529	1039	Auctoritas.	f
3530	1039	Imperium.	t
3531	1039	Dignitas.	f
3532	1039	Potestas.	f
3533	1040	Los etruscos.	f
3534	1040	Los samnitas.	t
3535	1040	Los galos.	f
3536	1040	Los griegos de la Magna Grecia.	f
3537	1041	Provincias Imperiales.	f
3538	1041	Provincias Senatoriales.	t
3539	1041	Provincias Proconsulares.	f
3540	1041	Provincias Fronterizas (Limes).	f
3541	1042	La reforma de Nerón.	f
3542	1042	La reforma de Diocleciano.	f
3543	1042	La reforma de Constantino (creación del sólido).	f
3544	1042	La reforma augustea.	t
3545	1043	Tácito.	f
3546	1043	Suetonio.	f
3547	1043	Tito Livio.	t
3548	1043	Salustio.	f
4315	1267	Un texto que se enfoca en la descripción	f
4316	1267	Un texto que se centra en la conversación entre personajes	t
4317	1268	Un personaje que se ajusta a un patrón o estereotipo	f
4318	1268	Un personaje que cambia y se desarrolla a lo largo de la obra	t
4319	1268	Un personaje que es muy complejo	f
4634	1350	El Consejo Social.	f
4635	1350	El Consejo de Gobierno.	f
4636	1350	El Rector/a, oído el Consejo de Gobierno.	t
4637	1350	La entidad promotora del Colegio.	f
4638	1351	Al Rector/a de la UCM.	f
4639	1351	Al Claustro Universitario.	f
4640	1351	A la Comunidad de Madrid.	t
4641	1351	Al Consejo de Universidades.	f
4642	1352	Los fines del Instituto.	f
4643	1352	Los órganos de gobierno y administración.	f
4320	1269	Atención selectiva	f
4321	1269	Memoria de trabajo	f
4322	1269	Memoria a largo plazo	t
4323	1270	Memoria sensorial	f
4324	1270	Memoria a largo plazo	f
4325	1270	Memoria de trabajo	t
4326	1271	Atención selectiva	t
4327	1271	Atención dividida	f
4328	1271	Atención parcial	f
4329	1272	Memoria de trabajo	f
4330	1272	Memoria sensorial	f
4331	1272	Memoria a largo plazo	t
4332	1273	Atención selectiva	t
4333	1273	Atención dividida	f
4334	1273	Atención parcial	f
4335	1274	Memoria de trabajo	f
4336	1274	Memoria sensorial	t
4337	1274	Memoria a largo plazo	f
2531	747	El Rector de la UCM de forma unilateral.	f
2532	747	El Patronato por mayoría de dos tercios.	f
2726	795	10 miembros (dos tercios de 15).	f
2533	747	El Consejo Ejecutivo, a propuesta del Presidente (Rector).	t
2535	748	Presidir las reuniones del Patronato con voto de calidad.	f
2543	750	Al Director General.	f
2559	754	En el mismo ejercicio en que se obtienen.	f
2560	754	En los cuatro años siguientes al cierre del ejercicio en que se obtuvieron.	t
2561	754	En un plazo máximo de diez años.	f
2562	754	No hay un plazo establecido, queda a criterio del Patronato.	f
2459	729	Exclusivamente a sus propios Estatutos.	f
2460	729	A sus Estatutos, las disposiciones del Patronato, los Estatutos de la UCM en lo aplicable, y el ordenamiento civil, jurídico-administrativo y tributario.	t
2461	729	Solo al derecho administrativo, por ser un medio propio de la Universidad.	f
4338	1275	Atención selectiva	f
4339	1275	Atención dividida	f
4340	1275	Atención sostenida	t
4341	1276	Memoria de trabajo	f
4342	1276	Memoria sensorial	f
4343	1276	Memoria a largo plazo	t
4344	1277	Atención selectiva	t
4345	1277	Atención dividida	f
4346	1277	Atención parcial	f
4347	1278	Memoria de trabajo	f
531	158	Athletic Club	t
532	158	Real Madrid	f
533	158	FC Barcelona	f
534	159	Cádiz CF	f
535	159	Villarreal CF	t
536	159	Las Palmas	f
537	160	Luis Suárez Miramontes	t
538	160	Alfredo Di Stéfano	f
539	160	Telmo Zarra	f
540	161	Italia	f
541	161	Alemania	f
542	161	España	t
543	162	FC Barcelona	t
544	162	Real Madrid	f
545	162	Athletic Club	f
546	163	Alicante	f
547	163	Castellón	f
548	163	Valencia	t
549	164	Deportivo de La Coruña	t
550	164	Real Madrid	f
551	164	FC Barcelona	f
552	165	Camp Nou	f
553	165	Santiago Bernabéu	t
554	165	Vicente Calderón	f
555	166	RC Deportivo de La Coruña	t
556	166	RC Celta de Vigo	f
557	166	Sporting de Gijón	f
558	167	David Villa	f
517	153	Luis Aragonés	f
518	153	Julen Lopetegui	f
519	154	Camp Nou	f
520	154	San Mamés	t
521	154	Mestalla	f
522	155	Atlético de Madrid	f
523	155	Sevilla FC	t
524	155	Villarreal CF	f
525	156	Recreativo de Huelva	t
526	156	Athletic Club	f
527	156	Real Sociedad	f
528	157	1902	t
529	157	1910	f
530	157	1929	f
4348	1278	Memoria sensorial	f
4349	1278	Memoria a largo plazo	t
4644	1352	El horario de apertura al público de sus instalaciones.	t
4645	1352	Los recursos previstos para su financiación.	f
4646	1353	El propio Consejo de Gobierno.	f
4647	1353	Un estudiante de doctorado del Departamento.	t
4648	1353	Las Facultades o Escuelas afectadas.	f
4649	1353	El Rector/a.	f
4650	1354	El Rector/a de la UCM.	f
4651	1354	El Consejo de Gobierno de la UCM.	f
4652	1354	El Gobierno de la Nación, a propuesta conjunta de Ministerios.	t
4653	1354	La Comunidad de Madrid.	f
4654	1355	Renunciar a su plaza en el Departamento.	f
4655	1355	Obtener el informe favorable del Departamento de origen.	t
4656	1355	Tener al menos dos sexenios de investigación.	f
4657	1355	Ser Catedrático de Universidad.	f
4658	1356	Las Residencias Universitarias.	t
4659	1356	Las Escuelas de Especialización Profesional.	f
4660	1356	Los Centros de Asistencia a la Investigación.	f
4661	1356	Los Colegios Mayores Adscritos.	f
4662	1357	Solo labores asistenciales para animales de compañía.	f
4663	1357	Labores asistenciales y de apoyo a la docencia y la investigación.	t
4350	1279	La necesidad de cambiar el nombre de la Universidad para incluir 'Madrid' en su denominación oficial.	f
4351	1279	La incorporación de la UCM a un nuevo distrito universitario a nivel europeo que exigía una reestructuración total.	f
4352	1279	La adaptación a la Ley Orgánica 4/2007, que introdujo reformas significativas, afectando a un número elevado de artículos y suprimiendo algunos preceptos.	t
4353	1279	Un cambio en el equipo de gobierno de la Comunidad de Madrid que requirió una revisión completa de todos los estatutos de las universidades públicas.	f
4354	1280	El Código Civil, en lo relativo a la personalidad jurídica de las instituciones.	f
4355	1280	La Ley de Propiedad Intelectual, para regular los derechos de autor del profesorado.	f
4356	1280	El Estatuto Básico del Empleado Público (TREBEP).	t
4357	1280	La Ley de Presupuestos Generales del Estado de 2016.	f
4358	1281	El Consejo de Gobierno, por mayoría simple.	f
4359	1281	El Consejo Social, por unanimidad.	f
4360	1281	El Claustro Universitario, por mayoría absoluta.	t
4361	1281	La Junta de Centro más representativa, por mayoría de dos tercios.	f
4362	1282	El Pleno del Claustro de la UCM.	f
4363	1282	El Consejo de Gobierno de la Comunidad de Madrid.	t
4364	1282	Las Cortes Generales, mediante Ley Orgánica.	f
4365	1282	El Ministerio de Universidades.	f
4366	1283	El 1 de enero del año siguiente a su publicación.	f
4367	1283	A los veinte días de su publicación en el BOCM.	f
4368	1283	El día de su aprobación por el Consejo de Gobierno de la Comunidad de Madrid.	f
4369	1283	El día siguiente al de su publicación en el Boletín Oficial de la Comunidad de Madrid (BOCM).	t
4370	1284	Ley de Educación (LOE).	f
4371	1284	Ley de Contratos del Sector Público.	f
4372	1284	Ley de la Ciencia, la Tecnología y la Innovación.	t
4373	1284	Ley de Procedimiento Administrativo Común.	f
4374	1285	Artículo 27.10.	t
4375	1285	Artículo 20.1 (libertad de cátedra).	f
4376	1285	Artículo 149.1.30.ª (competencia del Estado en la regulación de las condiciones de obtención de títulos).	f
4377	1285	Artículo 3 (pluralidad lingüística).	f
4378	1286	Un Defensor de la Igualdad.	f
4379	1286	Una Comisión de Igualdad en el Consejo de Gobierno.	f
4380	1286	Una unidad de igualdad.	t
4381	1286	Un Vicerrectorado de Igualdad.	f
4382	1287	La preparación para el ejercicio de actividades profesionales.	f
4383	1287	El fomento del desarrollo sostenible y el respeto al medio ambiente.	f
4384	1287	La obtención de beneficios económicos a través de la transferencia del conocimiento.	t
4385	1287	La difusión, valorización y transferencia del conocimiento al servicio del desarrollo económico.	f
4386	1288	Regular los colegios profesionales.	f
4387	1288	Fijar el salario mínimo interprofesional para su personal.	f
4388	1288	Expedir los títulos de carácter oficial y validez en todo el territorio nacional.	t
4389	1288	Legislar sobre la propiedad intelectual de los trabajos de sus investigadores.	f
4390	1289	El artículo 20, que reconoce la libertad de cátedra.	f
4391	1289	El artículo 27.10, que reconoce la autonomía de las Universidades.	t
4392	1289	El artículo 44, que habla de la promoción de la ciencia y la cultura.	f
4393	1289	El artículo 149.1.30.ª, sobre competencias del Estado en materia de educación.	f
4394	1290	La Ley de Contratos del Sector Público.	f
4395	1290	El Estatuto de los Trabajadores.	f
4396	1290	El Real Decreto Legislativo 5/2015 (TREBEP).	t
4397	1290	La Ley de la Ciencia, la Tecnología y la Innovación.	f
4398	1291	Norma de conflicto.	f
4399	1291	Interpretación auténtica.	f
4400	1291	Derogación expresa.	t
4401	1291	Derogación tácita.	f
4402	1292	Rango de Ley.	f
4403	1292	Rango de Decreto Legislativo.	f
2783	810	El principio de congruencia presupuestaria.	f
4404	1292	Rango de Reglamento (Decreto).	t
4405	1292	Rango de Orden Ministerial.	f
4406	1293	Ley Orgánica 2/2006 (LOE).	f
4407	1293	Ley Orgánica 4/2007.	t
4408	1293	Ley Orgánica 1/2004 (Violencia de Género).	f
4409	1293	Ley Orgánica 3/2007 (Igualdad efectiva de mujeres y hombres).	f
4410	1294	El Espacio Iberoamericano del Conocimiento.	f
4411	1294	El Espacio Europeo de Educación Superior (EEES).	t
4412	1294	El Plan Bolonia exclusivamente para estudios de posgrado.	f
4413	1294	La Red de Universidades Complutenses.	f
4414	1295	Un roel o tortillo de plata sobrecargado de un sol de oro.	f
4415	1295	Un cordón de San Francisco de plata como filiera.	f
4416	1295	Un libro abierto con las letras 'SAPIENTIAE'.	t
4417	1295	Un cisne de plata que soporta el escudo.	f
4418	1296	La docencia, la gestión y el deporte.	f
4419	1296	La docencia, el estudio y la investigación.	t
4420	1296	La investigación, la extensión universitaria y la formación continuada.	f
4421	1296	La creación de cultura, la transferencia de tecnología y la formación profesional.	f
4422	1297	A la admisión de estudiantes.	f
4423	1297	A la elaboración de los planes de estudio.	f
4424	1297	A la contratación de obras, servicios y suministros.	t
4425	1297	A la elección del Rector/a.	f
4426	1298	Patentes.	f
4427	1298	Propiedad Intelectual.	f
4428	1298	la Ciencia, la Tecnología y la Innovación.	t
4429	1298	Contratos del Sector Público.	f
4430	1299	El Claustro Universitario.	f
4431	1299	El Consejo de Gobierno.	f
4432	1299	El Defensor Universitario.	f
4433	1299	El Secretario/a General.	t
4434	1300	El Consejo Social.	f
2651	777	La exime totalmente de la Ley de Contratos del Sector Público en sus relaciones con la UCM.	f
2652	777	Permite que los encargos de la UCM a la Fundación se instrumenten sin necesidad de licitación pública, ajustándose al régimen jurídico aplicable a los medios propios.	t
2653	777	Obliga a la Fundación a someterse a la Ley de Contratos del Sector Público en todos sus actos, incluso los internos.	f
2654	777	Convierte a la Fundación en un departamento administrativo más de la Universidad, sin personalidad jurídica diferenciada.	f
2655	778	El principio de publicidad.	f
2656	778	El principio de libre concurrencia y competencia.	t
2657	778	El principio de proporcionalidad.	f
2658	778	El principio de seguridad jurídica.	f
2659	779	El Ministerio de Hacienda.	f
2660	779	El Protectorado de Fundaciones.	t
2661	779	El Consejo de Gobierno de la UCM.	f
2662	779	La Comunidad Autónoma de Madrid en materia de educación.	f
2663	780	A una subvención nominativa.	f
2664	780	A un precio de transferencia o reembolso de costes (cost-plus).	t
2665	780	A un contrato de arrendamiento de servicios.	f
2666	780	A una donación con contraprestación.	f
2667	781	Debe repartirse como dividendos entre los patronos fundadores.	f
2668	781	Puede destinarse a incrementar la dotación o las reservas, según acuerdo del Patronato, permitiendo el crecimiento del patrimonio fundacional.	t
2669	781	Debe donarse obligatoriamente a otras fundaciones análogas.	f
2670	781	Se considera beneficio fiscalmente exento que debe reinvertirse en actividades mercantiles.	f
2671	782	Los recursos generales están afectos a un fin concreto, mientras que los bienes transmitidos tienen afectación común.	f
2672	782	Los recursos generales tienen afectación común e indivisa a todos los fines, mientras que los bienes transmitidos con fin específico quedan adscritos a ese objetivo concreto.	t
2673	782	Los recursos generales pueden gastarse libremente, mientras que los bienes transmitidos no pueden ser enajenados.	f
2674	782	No existe diferencia alguna; todos los recursos se gestionan de la misma forma.	f
2675	783	Principio de adjudicación automática.	f
2676	783	Principio de discrecionalidad en la concesión y ausencia de derecho subjetivo a recibir la prestación.	t
2677	783	Principio de transparencia y publicidad.	f
2678	783	Principio de irretroactividad de las disposiciones desfavorables.	f
2679	784	Busca garantizar una mayoría de miembros externos a la UCM para evitar conflictos de interés.	f
2680	784	Busca equilibrar la presencia de personal de la UCM (PDI/PAS) con personas de reconocido prestigio externas, asegurando tanto el vínculo con la universidad como la apertura a la sociedad.	t
2681	784	Su único propósito es cumplir con el número mínimo y máximo de patronos establecido.	f
2682	784	Busca dar más peso al Rector, quien nombra a ambos grupos.	f
2683	785	El conflicto entre el deber de lealtad del patrono y su interés personal o de terceros.	t
2684	785	El conflicto entre la capacidad jurídica y la capacidad de obrar.	f
2685	785	El conflicto entre la legislación civil y la administrativa.	f
2686	785	El conflicto entre los fines fundacionales y las actividades mercantiles.	f
2687	786	Es una responsabilidad de carácter interno (patrimonial) para resarcir a la propia Fundación por los daños causados, independiente de otras responsabilidades.	t
2688	786	Sustituye y exonera de cualquier responsabilidad penal en la que pudieran incurrir.	f
2689	786	Es una responsabilidad meramente simbólica, sin consecuencias económicas.	f
2690	786	Solo se aplica a los patronos natos, no a los electivos.	f
2691	787	Quedarán exentos de responsabilidad quienes se opusieran expresamente al acuerdo o no hubiesen participado en su adopción.	t
2692	787	Tendrán derecho a ser indemnizados por la Fundación.	f
2693	787	Su voto en contra deberá constar en acta notarial para tener validez.	f
2694	787	Deberán dimitir inmediatamente de su cargo.	f
2695	788	El representante físico conserva el cargo de patrono de forma personal e irrevocable.	f
2696	788	La persona jurídica debe designar un nuevo representante, ya que el cargo lo ostenta la persona jurídica, no el representante físico.	t
2697	788	Se produce la vacante automática del puesto en el Patronato.	f
2698	788	El cargo pasa automáticamente al sustituto legal en la persona jurídica.	f
2699	789	Aceptación ante Notario en documento público independiente.	f
2700	789	Aceptación mediante comparecencia en el propio Registro de Fundaciones.	t
2701	789	Aceptación ante el Patronato, con certificación del Secretario.	f
2702	789	Aceptación tácita por el mero hecho de no renunciar en un plazo de 30 días.	f
2703	790	Los patronos natos no pueden ser cesados nunca, solo dimitir.	f
2704	790	El cese de un patrono nato está vinculado al cese en el cargo de la UCM que motiva su pertenencia, mientras que el de un electivo sigue otras reglas (final de mandato, renuncia, etc.).	t
2705	790	Los patronos electivos solo cesan por muerte o incapacidad, nunca por finalización de mandato.	f
2706	790	No existe diferencia; las causas de cese son idénticas para todos los tipos de patronos.	f
4435	1300	El Claustro Universitario.	t
4436	1300	El Consejo de Gobierno.	f
4437	1300	La Junta de Centro.	f
4438	1301	El Claustro.	f
4439	1301	El Consejo de Dirección.	t
4440	1301	El Consejo Social.	f
2707	791	Tiene derecho a voto en la decisión sobre su propia revocación.	f
2708	791	Su voto no se computa (se excluye) para el cálculo de la mayoría de dos tercios requerida.	t
2709	791	Su voto cuenta doble, ya que es el afectado.	f
2710	791	Debe abstenerse obligatoriamente, pero su presencia sí cuenta para el quórum de constitución.	f
2714	792	Solo es válida si asisten todos los patronos sin excepción.	f
2711	792	Debe grabarse la convocatoria y enviarse por correo certificado.	f
2712	792	La apreciación de la urgencia es discrecional del Presidente, y la convocatoria verbal debe permitir acreditar su recepción por los destinatarios.	t
2713	792	Requiere la autorización previa del Protectorado.	f
2715	793	Que se asegure la comunicación en tiempo real y, por tanto, la unidad de acto.	t
2716	793	Que todos los patronos utilicen el mismo modelo de dispositivo.	f
2717	793	Que la reunión sea grabada íntegramente y archivada.	f
2718	793	Que se celebre fuera del horario laboral.	f
2719	794	La adquisición y enajenación de bienes inmuebles.	f
2720	794	La aprobación de las cuentas, el plan de actuación, la modificación de estatutos, la fusión y la extinción, así como los actos que requieran autorización del Protectorado.	t
2721	794	La selección de beneficiarios de las prestaciones.	f
2722	794	El nombramiento de apoderados generales.	f
2723	795	7 miembros (la mitad de 15 es 7.5, redondeando al alza = 8).	f
2724	795	8 miembros (la mitad de 15 es 7.5, redondeando al alza = 8).	t
2725	795	La mitad más uno, es decir, 8 miembros (7.5 +1).	f
2727	796	Cuando el Presidente lo decida unilateralmente.	f
2728	796	Cuando estén presentes todos los patronos y acepten por unanimidad celebrar la reunión.	t
2729	796	En reuniones que traten exclusivamente asuntos urgentes declarados por el Secretario.	f
2730	796	En la primera reunión del año, que se considera convocada automáticamente.	f
2731	797	Sus miembros deben ser necesariamente abogados en ejercicio.	f
2732	797	Todos sus miembros con voto (natos y electivos) son, a su vez, miembros del Patronato.	t
2733	797	La mayoría de sus miembros deben ser externos a la UCM.	f
2734	797	El Director General, que es el Secretario, tiene voto dirimente.	f
2735	798	En cualquier persona, incluso ajena a la Fundación.	f
2736	798	En otro Patrono (dado que son también patronos), para actos concretos y con instrucciones por escrito.	t
2737	798	Exclusivamente en el Presidente del Consejo Ejecutivo.	f
2738	798	No pueden delegar su voto; la asistencia debe ser personal.	f
2739	799	Constituir y cancelar imposiciones a plazo fijo, abrir cuentas de crédito o contratar seguros.	t
2740	799	Formular el plan de actuación para su aprobación por el Patronato.	f
2741	799	Ejercitar acciones judiciales en defensa de los intereses de la Fundación.	f
2742	799	Nombrar al Director General a propuesta del Presidente.	f
2743	800	Directamente sobre el personal de la Fundación.	f
2744	800	A través del Consejo Ejecutivo, que tiene delegadas las facultades de ejecución.	t
2745	800	A través del Secretario del Patronato.	f
2746	800	Mediante informes directos al Protectorado.	f
2747	801	El Director General está subordinado al Consejo que lo nombra, pero asiste a sus reuniones con voz para informar y asesorar, sin capacidad de voto para evitar un conflicto de roles.	t
2748	801	El Director General tiene superior jerarquía que el Consejo Ejecutivo, por lo que no vota para no influir en sus decisiones.	f
2749	801	Es una relación de igualdad, ya que el Director General es también patrono.	f
2750	801	El Director General solo se relaciona con el Patronato, no con el Consejo Ejecutivo.	f
2751	802	Debe atenerse a los presupuestos y planes de actuación aprobados por el Patronato y a las delegaciones del Consejo Ejecutivo, y no puede realizar actos que requieran autorización del Protectorado o acuerdos reservados al Patronato.	t
2752	802	No tiene límite alguno; puede contratar libremente en nombre de la Fundación.	f
2753	802	Solo puede contratar por importes inferiores a 50.000 euros.	f
2754	802	Necesita la firma mancomunada del Presidente para cualquier contrato.	f
2755	803	El Subdirector se nombra a propuesta del Director General, mientras que el Gerente se nombra a propuesta conjunta del Gerente de la UCM y del Director General de la Fundación.	t
2756	803	El Subdirector es un cargo obligatorio, el Gerente es optativo.	f
2757	803	El Gerente debe ser un funcionario de la UCM, el Subdirector no.	f
2758	803	El Subdirector tiene voto en el Consejo Ejecutivo, el Gerente no.	f
2759	804	Facilitar el seguimiento de la afectación de bienes a fines específicos (Art. 9) y el control del Protectorado sobre el patrimonio.	t
2760	804	Determinar el valor fiscal de los bienes para el pago de impuestos.	f
2761	804	Permitir a los donantes reclamar la propiedad si la Fundación se extingue.	f
2762	804	Es un requisito meramente formal sin consecuencias prácticas.	f
2763	805	En la enajenación o gravamen de bienes que precisen autorización del Protectorado.	t
2764	805	En la inversión de los rendimientos del patrimonio.	f
2765	805	En la aceptación de donaciones simples.	f
2766	805	En la contratación de suministros y servicios.	f
2767	806	Otorga amplia discrecionalidad para adaptar la cartera de inversiones, limitada por el deber de diligencia de un representante leal (Art. 15) y la finalidad de cumplir los fines fundacionales.	t
2768	806	Otorga discrecionalidad absoluta, sin límite legal alguno.	f
2769	806	No otorga discrecionalidad; las inversiones deben seguir un plan preaprobado por el Protectorado.	f
2770	806	Solo permite modificar inversiones en valores mobiliarios, no en inmuebles.	f
2771	807	Limita la responsabilidad de la Fundación por las deudas de la herencia al valor de los bienes heredados.	t
2772	807	Acelera el proceso de adjudicación de los bienes hereditarios.	f
2773	807	Obliga a la Fundación a aceptar la herencia íntegramente, sin posibilidad de renuncia.	f
2774	807	Exime a la Fundación de pagar el Impuesto de Sucesiones.	f
2775	808	Debe transmitir el bien 'para un fin determinado', en cuyo caso quedará afecto a ese objetivo concreto (excepción del Art. 9), o celebrar un convenio de colaboración específico.	t
2776	808	Es imposible; la Fundación no puede aceptar donaciones con fines específicos.	f
2777	808	Debe convertirse en patrono honorífico para poder supervisar el destino de su donación.	f
2778	808	La donación se integrará en el patrimonio común, pero puede solicitar informes anuales de su uso.	f
2779	809	Entre el 1 de octubre y el 31 de diciembre.	t
2780	809	Entre el 1 de enero y el 31 de marzo del ejercicio siguiente.	f
2781	809	En cualquier momento del año, mientras se haga antes de que comience el ejercicio al que se refiera.	f
2782	809	Simultáneamente a la aprobación de las cuentas del ejercicio anterior.	f
2784	810	El principio de evaluación del desempeño y la eficacia en el uso de los recursos para los fines previstos.	t
2785	810	El principio de unidad de caja.	f
2786	810	El principio de especialidad del gasto.	f
2787	811	Generalmente, al superar unos determinados importes de activivo o volumen de ingresos durante varios ejercicios.	t
2788	811	A tener más de 50 empleados en plantilla.	f
2789	811	A recibir más de 10 donaciones en un ejercicio.	f
2790	811	A realizar actividades mercantiles, por pequeñas que sean.	f
2791	812	Tiene un papel de control de legalidad; puede oponerse si la modificación contraviene la ley.	t
2792	812	Debe aprobar previamente la modificación antes de que el Patronato la vote.	f
2793	812	Solo recibe comunicación informativa, sin capacidad de intervención.	f
2794	812	Debe autorizar la escritura pública ante notario.	f
2795	813	La cuenta de pérdidas y ganancias y cualquier otro documento que aclare suficientemente la situación patrimonial.	t
2796	813	Un informe favorable del Consejo de Gobierno de la UCM.	f
2797	813	La lista actualizada de todos los beneficiarios de la Fundación.	f
2798	813	El acta de la reunión del Consejo Ejecutivo que lo propuso.	f
2799	814	Para la extinción, la mayoría se calcula sobre los patronos presentes o representados en la sesión. Para la modificación, el artículo 39 no especifica, por lo que se aplicaría la regla general del artículo 20 (mayoría de asistentes), salvo que se interprete que requiere dos tercios de los miembros totales del Patronato, lo que es más estricto.	t
2800	814	Es exactamente el mismo: dos tercios de los miembros totales del Patronato.	f
2801	814	Para la extinción se necesita unanimidad, para la modificación solo mayoría simple.	f
2802	814	Para la extinción se necesita mayoría absoluta de los miembros totales, para la modificación dos tercios.	f
2803	815	Que desarrollen principalmente sus actividades en la Comunidad de Madrid.	t
2804	815	Que tengan su domicilio social en la ciudad de Madrid.	f
2805	815	Que estén inscritas en el Registro de Fundaciones de la Comunidad de Madrid.	f
2806	815	Que no hayan recibido nunca subvenciones de la UCM.	f
2807	816	1) Legislación civil/administrativa de derecho necesario; 2) Estatutos de la UCM (en lo aplicable); 3) Disposiciones del Patronato; 4) Los presentes Estatutos. Los Estatutos de la Fundación son la norma suprema, dentro del marco de la ley.	f
2808	816	1) Los presentes Estatutos; 2) Las disposiciones del Patronato; 3) Los Estatutos de la UCM (en lo aplicable); 4) El ordenamiento jurídico general. Los Estatutos propios son la norma primaria de la Fundación.	t
2809	816	1) La Ley de Fundaciones; 2) Los Estatutos de la UCM; 3) Los presentes Estatutos; 4) Los acuerdos del Patronato. La ley es siempre suprema.	f
2810	816	Todas las normas mencionadas tienen el mismo rango y se aplican de forma concurrente.	f
2811	817	Cesará como Patrono Nato y Presidente del Patronato (Arts. 14, 18). Cesará como Consejero Nato y Presidente del Consejo Ejecutivo (Arts. 21, 22). Su sustituto en el cargo de Rector adquirirá automáticamente estas posiciones.	t
2812	817	Solo cesa como Patrono Nato, pero puede continuar como Presidente del Patronato si este así lo decide.	f
2813	817	Cesa en todos sus cargos, y el Patronato debe elegir un nuevo Presidente entre sus miembros.	f
2814	817	No produce efecto alguno; el cargo de Rector en la Fundación es vitalicio una vez nombrado.	f
2815	818	Artículo 13.2. Para la temática singular, una donación importante o la aportación de una persona física relevante.	t
2816	818	Artículo 19. Para la preparación del plan de actuación y las cuentas.	f
2817	818	Artículo 23. Para el seguimiento de las inversiones financieras.	f
2818	818	Artículo 42. Para la liquidación en caso de extinción.	f
2819	819	Conflicto de intereses. El patrono afectado debe abstenerse de votar en acuerdos que le conciernan directa o indirectamente (relación contractual, acción de responsabilidad contra él, su revocación).	t
2820	819	Conflicto de competencias entre el Patronato y el Consejo Ejecutivo. Se resuelve dando prioridad al Patronato.	f
2821	819	Conflicto entre el deber de diligencia y la gratuidad del cargo. Se resuelve permitiendo el reembolso de gastos.	f
2822	819	Conflicto entre los fines fundacionales y las actividades mercantiles. Se resuelve sometiéndolas a las normas de competencia.	f
2823	820	1) Que su objeto esté relacionado con los fines fundacionales o sea complementario/accesorio de las actividades principales. 2) Sometimiento a las normas de defensa de la competencia.	t
2824	820	1) Que generen siempre un beneficio neto. 2) Que sean aprobadas por el Consejo de Gobierno de la UCM.	f
2825	820	1) Que no superen el 10% de los ingresos totales. 2) Que se destinen íntegramente a reservas.	f
4441	1301	La Comisión Permanente del Consejo de Gobierno.	f
2826	820	1) Que no requieran inversión inicial. 2) Que se realicen en el campus universitario.	f
2827	821	Están afectos con carácter permanente a los fines fundacionales y su enajenación o gravamen suele estar sometido a un régimen de protección y autorización más estricto por parte del Protectorado.	t
2828	821	Son los únicos bienes que pueden generar rendimientos económicos.	f
2829	821	Pueden ser libremente enajenados por el Director General sin autorización.	f
2830	821	Deben ser siempre bienes inmuebles.	f
2831	822	Que el Protectorado debe aprobar el plan de liquidación, supervisar su ejecución y autorizar el destino final de los bienes, asegurando el cumplimiento de la ley y los estatutos.	t
2832	822	Que el Protectorado asume directamente la gestión de la liquidación.	f
2833	822	Que la liquidación se realiza por un juez, informando al Protectorado.	f
2834	822	Que el control es meramente informativo; el Patronato actúa con plena autonomía.	f
2835	823	La reserva de competencias indelegables (Art. 19.2.f: aprobación de cuentas, plan, modificación de estatutos, fusión, extinción) y la necesidad de autorización del Protectorado para actos graves, que solo puede solicitar el Patronato.	t
2836	823	El derecho de veto del Rector sobre cualquier decisión del Consejo Ejecutivo.	f
2837	823	La obligación del Director General de someter todas sus decisiones a referéndum entre los patronos.	f
2838	823	La revisión mensual de todas las actuaciones por una comisión de patronos honoríficos.	f
4442	1302	La supervisión de las actividades de carácter económico de la Universidad.	f
4443	1302	La supervisión del rendimiento de los servicios universitarios.	f
4444	1302	La aprobación de los planes de estudio y la política de investigación.	t
4445	1302	La promoción de la colaboración de la sociedad en la financiación de la Universidad.	f
4446	1303	Mayoría simple.	f
4447	1303	Mayoría absoluta.	f
4448	1303	Dos tercios de sus miembros.	t
4449	1303	Tres quintos de sus miembros.	f
4450	1304	Aprobar el Reglamento de Gobierno de la UCM.	f
4451	1304	Elegir a los representantes del Claustro en el Consejo de Gobierno.	f
4452	1304	Expedir, en nombre del Rey/Reina, los títulos oficiales.	t
4453	1304	Aprobar la memoria económica de la Universidad elaborada por el/la Gerente.	f
4454	1305	Por elección directa de todos los estudiantes y profesores del Centro.	f
4455	1305	Por designación directa del Rector/a.	f
4456	1305	Por la Junta de Centro, entre Profesores Doctores con vinculación permanente adscritos al Centro.	t
4457	1305	Por el Consejo de Gobierno, a propuesta del Rector/a.	f
4458	1306	Del Claustro Universitario.	f
4459	1306	Del Consejo de Gobierno.	f
4460	1306	Del Consejo Social.	t
4461	1306	Del Consejo de Dirección (aunque no se mencione aquí, asiste).	f
4462	1307	La Ley de Contratos del Sector Público.	f
4463	1307	La Ley de Procedimiento Laboral.	f
4464	1307	La Ley de Régimen Jurídico del Sector Público.	t
4465	1307	El Código Civil.	f
4466	1308	25 por 100.	f
4467	1308	51 por 100 (como en las Juntas de Centro).	f
4468	1308	53 por 100.	t
4469	1308	62 por 100 (como en las Juntas de Centro).	f
4470	1309	Gestionar los servicios administrativos y económicos.	f
4471	1309	Asistir al Rector/a en el gobierno de la Universidad, coordinando actividades delegadas.	t
4472	1309	Presidir el Consejo de Gobierno en ausencia del Rector/a.	f
4473	1309	Representar a la Universidad en juicio.	f
4474	1310	10 por 100.	f
4475	1310	12 por 100.	t
4476	1310	25 por 100.	f
4477	1310	53 por 100.	f
4478	1311	Ser presentada por un tercio de los miembros del Claustro.	f
4479	1311	Incluir una propuesta de candidato alternativo (moción constructiva).	t
4480	1311	Ser aprobada previamente por el Consejo de Gobierno.	f
4481	1311	Obtener el apoyo de la mayoría simple del órgano colegiado que eligió al cargo.	f
4482	1312	Ser funcionario de carrera de un cuerpo docente universitario.	f
4483	1312	Ser un titulado superior, sin que pueda ejercer funciones docentes.	t
4484	1312	Tener un mínimo de diez años de experiencia en gestión universitaria.	f
4485	1312	Ser elegido por el Claustro a propuesta del Rector/a.	f
4486	1313	Dos años.	t
4487	1313	Cuatro años.	f
4488	1313	Tres años.	f
4489	1313	Un año, renovable.	f
4490	1314	Elegir y revocar al Decano/a o Director/a.	f
4491	1314	Resolver los recursos de alzada contra las decisiones del Decano/a.	t
4492	1314	Aprobar la distribución de los recursos presupuestarios atribuidos al Centro.	f
4493	1314	Proponer los planes de estudio oficiales de las titulaciones adscritas al centro.	f
4494	1315	La formación y custodia del libro de actas de los órganos del Centro.	f
4495	1315	La expedición de documentos y certificaciones de los acuerdos.	f
4496	1315	La gestión del presupuesto ordinario del Centro.	t
4497	1315	La custodia del sello oficial de la Universidad en el ámbito del Centro.	f
4498	1316	Artes y Humanidades.	f
4499	1316	Ciencias de la Salud.	f
4500	1316	Ciencias Sociales y Jurídicas.	f
4501	1316	Arquitectura e Ingeniería Civil.	t
4502	1317	El Secretario/a General.	f
4503	1317	El Rector/a.	f
4504	1317	El/la Gerente.	t
4505	1317	El Vicerrector de Economía.	f
4506	1318	Ser los más antiguos de la Universidad.	f
4664	1357	Es un centro dedicado exclusivamente a la investigación en farmacología animal.	f
4665	1357	Funciona como una clínica universitaria para estudiantes de medicina.	f
4666	1358	Un decreto del Consejo de Gobierno de la Comunidad de Madrid.	f
4667	1358	Una ley de las Cortes Generales.	f
4668	1358	Convenios u otras formas de cooperación con otras Universidades.	t
4669	1358	Un acuerdo del Claustro de la UCM.	f
4670	1359	A recibir una enseñanza crítica, abierta al pluralismo teórico.	f
4671	1359	A participar en los procesos de evaluación de la calidad de la docencia recibida.	f
4672	1359	A elegir al Rector/a de la Universidad mediante voto directo y ponderado.	t
4673	1359	A recibir una atención que facilite compaginar los estudios con la actividad laboral.	f
4674	1360	Realizar el trabajo académico con suficiente aprovechamiento.	f
4675	1360	Abstenerse de la utilización o cooperación en procedimientos fraudulentos en las pruebas de evaluación.	t
4676	1360	Asistir a clase y a las actividades académicas programadas.	f
4677	1360	Hacer un uso correcto de las instalaciones.	f
4678	1361	Dependencia jerárquica del Rector/a.	f
4679	1361	Independencia y autonomía, sin mandato imperativo.	t
4680	1361	Sometimiento a las instrucciones del Consejo de Gobierno.	f
4681	1361	Obligación de mantener la confidencialidad de todas sus actuaciones, incluso en sus informes públicos.	f
4682	1362	Por el Consejo de Gobierno, por un período de cuatro años.	f
4683	1362	Por el Rector/a, por un período de seis años.	f
4684	1362	Por el Claustro Universitario, por un período de seis años, sin posibilidad de reelección.	t
4685	1362	Por el Consejo Social, por un período de cinco años, renovable una vez.	f
4686	1363	En el Código Penal.	f
4687	1363	En la Ley de Procedimiento Administrativo Común.	f
4688	1363	En el Estatuto del Estudiante Universitario (Real Decreto 1791/2010).	t
4689	1363	En el Estatuto de los Trabajadores.	f
4690	1364	Si el solicitante no es miembro de la comunidad universitaria.	f
4691	1364	Si la queja se refiere a actuaciones del Rector/a.	f
4692	1364	Si no se han agotado todas las instancias previas previstas por la legislación universitaria.	t
4693	1364	Si la queja es anónima.	f
4694	1365	Buena fe, probidad y lealtad.	f
4695	1365	Búsqueda prioritaria de financiación externa para proyectos.	t
4696	1365	Rigor crítico y humildad intelectual.	f
4697	1365	Amor a la libertad y respeto a los demás y al entorno natural.	f
4698	1366	Comité de Bioseguridad.	f
4699	1366	Comité de Experimentación Animal.	f
4700	1366	Comité de Ética y Deontología de la UCM.	t
4701	1366	Comisión de Investigación.	f
4702	1367	Resolver los recursos de alzada en materia disciplinaria.	f
4703	1367	Actuar como tribunal en los expedientes disciplinarios.	f
4704	1367	Colaborar en la instrucción de expedientes disciplinarios y controlar la disciplina académica.	t
4705	1367	Velar por el cumplimiento de los derechos de los estudiantes.	f
4706	1368	El desempeño de cualquier actividad profesional.	f
4707	1368	Ser miembro del Claustro.	f
4708	1368	El desempeño de cualquier cargo de gobierno o de representación de la Universidad.	t
4709	1368	Percibir retribuciones de la Universidad.	f
4710	1369	El Comité de Experimentación Animal.	f
4711	1369	El Comité de Ética y Deontología.	f
4712	1369	El Comité de Bioseguridad.	t
4713	1369	La Comisión de Investigación.	f
4714	1370	En el Código Penal.	f
4715	1370	En el Reglamento de Disciplina Académica.	t
4716	1370	En el Estatuto de los Trabajadores.	f
4717	1370	En la Ley de Universidades (LOU).	f
4718	1371	Derecho de petición.	f
4719	1371	Derecho de participación.	f
4720	1371	Derecho a una buena administración y a formular quejas y sugerencias.	t
4721	1371	Derecho a la revisión de oficio.	f
4722	1372	El Rector/a.	f
4723	1372	El Vicerrector/a con competencias en materia de investigación.	t
4724	1372	El Director/a del Animalario.	f
4725	1372	El Decano de la Facultad de Veterinaria.	f
4726	1373	El Defensor puede imponerles una sanción económica.	f
4727	1373	El Defensor puede denunciar el caso al Rector/a como posible infracción disciplinaria.	t
4728	1373	No pasa nada, ya que la solicitud del Defensor no es vinculante.	f
4729	1373	El Defensor puede acudir a la vía contencioso-administrativa.	f
4730	1374	Ser Catedráticos de Universidad.	f
4731	1374	Ser Profesores Doctores de la UCM con más de quince años de antigüedad en la carrera docente.	t
4732	1374	Pertenecer al Consejo de Gobierno.	f
4733	1374	Tener reconocidos, al menos, dos sexenios de investigación.	f
4734	1375	La resolución rápida y sancionadora de los conflictos.	f
4735	1375	La solución de conflictos de forma alternativa a la vía disciplinaria o judicial.	t
4736	1375	Que los conflictos sean resueltos directamente por el Rector/a.	f
4737	1375	La publicidad de todos los conflictos para garantizar la transparencia.	f
4738	1376	Las sanciones leves, que son competencia del Consejo de Gobierno.	f
4739	1376	La separación del servicio del funcionario, que debe ser acordada por el órgano competente según la legislación de funcionarios.	t
4740	1376	Las sanciones a Catedráticos, que deben ser aprobadas por el Claustro.	f
4741	1376	Los expedientes por faltas muy graves, que son competencia de la Comunidad de Madrid.	f
4742	1377	Mayoría simple de los votos emitidos.	f
4743	1377	Mayoría absoluta de los miembros del Claustro.	t
4744	1377	Mayoría de dos tercios de los miembros del Claustro.	f
4745	1377	Un mínimo de 25 votos.	f
4746	1378	Abstenerse de procedimientos fraudulentos.	f
4747	1378	Asistir a clase.	f
4748	1378	Asumir las responsabilidades que comportan los cargos de representación para los que fueren elegidos.	t
4749	1378	Realizar el trabajo académico con suficiente aprovechamiento.	f
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (id, user_id, token, used, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.questions (id, test_id, question_text) FROM stdin;
774	69	¿Qué documento, mencionado en el artículo 38, debe incluir información sobre las actividades, recursos empleados y número de beneficiarios?
775	69	Para acordar la extinción de la Fundación, el Patronato necesita (Art. 41):
769	69	El cargo de Secretario del Patronato recae, por defecto, en:
770	69	¿Qué característica define al Subdirector y al Gerente como órganos de la Fundación?
168	31	¿Qué equipo andaluz ha ganado una Liga?
169	31	¿Qué club juega en el estadio de Anoeta?
192	34	¿Cuál es el objetivo principal de la crítica literaria?
193	34	¿Qué es el género literario de la novela épica?
194	34	¿Cuál es el papel de la crítica literaria en la sociedad?
195	34	¿Qué es el estilo literario de la narrativa?
196	34	¿Cuál es el propósito de la crítica literaria en la academia?
197	34	¿Qué es el género literario de la poesía lírica?
198	34	¿Cuál es el papel de la crítica literaria en la formación de la opinión pública?
199	34	¿Qué es el estilo literario de la prosa?
200	34	¿Cuál es el propósito de la crítica literaria en la formación de la identidad cultural?
201	34	¿Qué es el género literario de la novela corta?
202	35	¿Cuál es la región de integrales en un espacio bidimensional?
203	35	¿Cuál es la ecuación de una superficie en coordenadas cartesianas?
204	35	¿Cuál es el método para evaluar una integral de línea en 2D?
205	35	¿Cuál es la ecuación de una curva en coordenadas polares?
206	35	¿Cuál es el teorema que relaciona la derivada de una función con la integral de una función?
207	35	¿Cuál es la región de integrales en un espacio tridimensional?
208	35	¿Cuál es la ecuación de una superficie en coordenadas cilíndricas?
209	35	¿Cuál es el método para evaluar una integral de superficie en 3D?
210	35	¿Cuál es la ecuación de una curva en coordenadas esféricas?
211	35	¿Cuál es el teorema que relaciona la derivada de una función con la integral de una función en 3D?
212	36	¿Cuál es el objetivo principal de la Contabilidad Nacional?
213	36	¿Qué es el Producto Interno Bruto (PIB)?
214	36	¿Cuál es el concepto de depreciación en la Contabilidad Nacional?
215	36	¿Qué es el Fondo de Ahorro Nacional (FAN) en la Contabilidad Nacional?
216	36	¿Cuál es la diferencia entre el PIB y el PIB per cápita?
217	36	¿Qué es el concepto de balanza de pagos en la Contabilidad Nacional?
218	36	¿Cuál es la importancia de la Contabilidad Nacional en la toma de decisiones económicas?
219	36	¿Qué es el concepto de inversión neta en la Contabilidad Nacional?
220	36	¿Cuál es la diferencia entre el PIB y el Producto Neto Interno (PNI)?
221	36	¿Qué es el concepto de cuenta nacional en la Contabilidad Nacional?
222	37	¿Cuál de los siguientes derechos fundamentales se encuentra específicamente protegido en el artículo 24 de la Constitución Española?
223	37	¿Cuál es el objetivo principal del artículo 14 de la Constitución Española?
224	37	¿Cuál es el derecho fundamental que se refiere a la libertad de reunión y de asociación?
225	37	¿Cuál es el contenido del artículo 9 de la Constitución Española en cuanto a la libertad de pensamiento y de expresión?
226	37	¿Cuál es el derecho fundamental que se refiere a la protección de la salud?
227	37	¿Cuál es el objetivo principal del artículo 26 de la Constitución Española?
228	37	¿Cuál de los siguientes derechos fundamentales se encuentra específicamente protegido en el artículo 20 de la Constitución Española?
229	37	¿Cuál es el derecho fundamental que se refiere a la protección de la familia?
230	37	¿Cuál es el objetivo principal del artículo 27 de la Constitución Española?
231	37	¿Cuál de los siguientes derechos fundamentales se encuentra específicamente protegido en el artículo 30 de la Constitución Española?
242	39	¿Cuál es el objetivo principal de la propiedad CSS ?box-sizing?
243	39	¿Cómo se define un pseudoelemento en CSS?
244	39	¿Cuál es la diferencia entre display: block y display: inline?
245	39	¿Cómo se configura el ancho máximo de un elemento en CSS?
246	39	¿Qué es la propiedad CSS flex-grow?
247	39	¿Cómo se define un estilo personalizado para un elemento en CSS?
248	39	¿Qué es la propiedad CSS align-content?
249	39	¿Cómo se configura el alto mínimo de un elemento en CSS?
250	39	¿Qué es la propiedad CSS grid-template-columns?
251	39	¿Cómo se define un estilo para un elemento que se activa al pasar el ratón sobre él?
252	39	¿Qué es la propiedad CSS transition?
253	39	¿Cómo se configura el alineamiento de un elemento en CSS?
254	39	¿Qué es la propiedad CSS perspective?
255	39	¿Cómo se define un estilo para un elemento que se activa al hacer clic en él?
256	39	¿Qué es la propiedad CSS box-shadow?
257	39	¿Cómo se configura el alto máximo de un elemento en CSS?
258	39	¿Qué es la propiedad CSS opacity?
170	31	¿Qué selección ganó la Eurocopa 2012?
171	31	¿Qué club español ganó su primera UEFA Champions League en el año 1998?
771	69	El Plan de Actuación de la Fundación para el ejercicio siguiente debe ser aprobado y remitido al Protectorado (Art. 37):
182	33	¿Qué es la membrana celular?
183	33	¿Qué es el metabolismo?
184	33	¿Cuál es la función del citoplasma?
185	33	¿Qué es un orgánulo?
186	33	¿Qué es el ADN?
187	33	¿Qué es la fotosíntesis?
188	33	¿Qué es la respiración celular?
189	33	¿Qué es el mitocondrio?
190	33	¿Qué es la membrana nuclear?
191	33	¿Qué es la síntesis proteica?
232	38	¿Cuándo se celebraron los primeros Juegos Olímpicos de la era moderna?
233	38	¿Qué ciudad albergó los primeros Juegos Olímpicos de la era moderna?
234	38	¿Quién fue el fundador de los Juegos Olímpicos de la era moderna?
235	38	¿Cuántos Juegos Olímpicos se celebraron durante la Segunda Guerra Mundial?
236	38	¿Qué fue el movimiento olímpico durante la Segunda Guerra Mundial?
237	38	¿Cuándo se celebraron los primeros Juegos Olímpicos Invernales?
238	38	¿Qué ciudad albergó los primeros Juegos Olímpicos Invernales?
239	38	¿Quién fue el primer campeón olímpico de la era moderna?
240	38	¿Cuántos Juegos Olímpicos se celebraron en el siglo XX?
241	38	¿Qué fue el objetivo principal de Pierre de Coubertin al crear los Juegos Olímpicos?
259	39	¿Cómo se define un estilo para un elemento que se activa al pasar el ratón sobre él y hacer clic en él?
260	39	¿Qué es la propiedad CSS user-select?
261	39	¿Cómo se configura el ancho mínimo de un elemento en CSS?
262	40	¿Cuál es la estructura básica de la célula?
263	40	¿Cuál es el objetivo principal del metabolismo celular?
264	40	¿Cuál es la función principal de la membrana celular?
265	40	¿Cuál es el proceso por el cual la célula obtiene energía a partir de la oxidación de moléculas orgánicas?
266	40	¿Cuál es el tipo de membrana celular que contiene fosfolípidos y proteínas?
267	40	¿Cuál es el proceso por el cual la célula elimina residuos y productos de desecho?
268	40	¿Cuál es el tipo de célula que no tiene núcleo?
269	40	¿Cuál es el proceso por el cual la célula sintetiza proteínas a partir de aminoácidos?
270	40	¿Cuál es el tipo de membrana celular que contiene vesículas de transporte?
271	40	¿Cuál es el proceso por el cual la célula regula la entrada y salida de moléculas?
1237	94	¿Cuál es el papel de la crítica literaria en la formación de la opinión pública?
1238	94	¿Cuál es el proceso principal de la crítica literaria en relación con la formación de la opinión pública?
1239	94	¿Cuál es el propósito de la crítica literaria en relación con la formación de la opinión pública?
1240	94	¿Cuál es el papel de la crítica literaria en la educación?
1241	94	¿Cuál es el proceso principal de la crítica literaria?
1242	94	¿Cuál es el propósito de la crítica literaria en relación con la formación de la opinión pública?
1243	94	¿Cuál es el papel de la crítica literaria en la formación de la opinión pública?
1244	94	¿Cuál es el proceso principal de la crítica literaria en relación con la formación de la opinión pública?
1245	94	¿Cuál es el propósito de la crítica literaria en relación con la formación de la opinión pública?
1246	94	¿Cuál es el papel de la crítica literaria en la educación?
1247	94	¿Cuál es el proceso principal de la crítica literaria?
1248	94	¿Cuál es el propósito de la crítica literaria en relación con la formación de la opinión pública?
1320	99	El artículo 81 establece un objetivo de plantilla para el PDI. ¿Cuál es el porcentaje máximo recomendado para el profesorado contratado (excluyendo a los Asociados de Ciencias de la Salud)?
1321	99	Según el artículo 83, ¿qué requisito es indispensable para poder acceder a los cuerpos de funcionarios docentes universitarios (Catedrático y Titular de Universidad)?
559	58	¿Qué tipo de arma alemana, los misiles V-1 y V-2, fueron lanzados principalmente contra Londres y Amberes a partir de 1944, representando las primeras armas de crucero y balísticas?
560	58	¿Qué batalla naval en el Pacífico, librada en octubre de 1944, es considerada la mayor de la historia y selló la destrucción de la capacidad ofensiva de la flota japonesa?
561	58	¿Qué organización de resistencia polaca, leal al gobierno en el exilio en Londres, llevó a cabo el 'Alzamiento de Varsovia' en agosto de 1944?
562	58	¿Qué río en el este de Europa, que atravía la capital alemana, fue el escenario de los últimos y desesperados combates callejeros antes de la rendición en mayo de 1945?
563	58	¿Qué comandante canadiense dirigió la desastrosa incursión aliada en el puerto francés de Dieppe en agosto de 1942, una operación que sirvió de lección crucial para el Día D?
564	58	¿Qué término se utilizó para describir la rápida conquista alemana de Francia, Bélgica, Holanda y Luxemburgo entre mayo y junio de 1940?
600	60	I usually _____ coffee in the morning, but today I had tea instead.
507	56	¿Qué es la regresión de logística generalizada?
508	56	¿Por qué se utiliza la regresión lineal?
509	56	¿Qué es el modelo de regresión lineal?
510	56	¿Qué es la regresión lineal simple?
511	56	¿Qué es la regresión lineal múltiple?
282	42	¿Qué sucede cuando la luz se refleja en una superficie?
283	42	¿Qué es la refracción?
284	42	¿Qué tipo de onda es la luz?
285	42	¿Qué sucede cuando la luz pasa de un medio más denso a uno menos denso?
286	42	¿Qué es la velocidad de la luz?
287	42	¿Qué sucede cuando una onda se superpone a otra onda?
288	42	¿Qué es la interferencia?
289	42	¿Qué tipo de onda se propaga a través de un medio elástico?
290	42	¿Qué sucede cuando una onda se refracta en un medio más denso?
291	42	¿Qué es la difracción?
292	43	¿Qué es la evolución?
293	43	¿Qué es la selección natural?
294	43	¿Qué es la especie?
295	43	¿Qué es la adaptación?
296	43	¿Qué es la variación genética?
297	43	¿Qué es la biodiversidad?
298	43	¿Qué es la extinción?
299	43	¿Qué es un ecosistema?
300	43	¿Qué es la fotosíntesis?
301	43	¿Qué es la selección artificial?
302	44	¿Cómo se dice '¿Cómo estás?' en francés?
303	44	¿Qué significa 'Bonjour' en francés?
304	44	¿Cómo se dice 'Me duele la cabeza' en francés?
305	44	¿Qué significa 'Merci' en francés?
306	44	¿Cómo se dice '¿Dónde está...?' en francés?
307	44	¿Qué significa 'Au revoir' en francés?
308	44	¿Cómo se dice 'Me encanta este lugar' en francés?
309	44	¿Qué significa 'S'il vous plaît' en francés?
310	44	¿Cómo se dice '¿Cuánto cuesta?' en francés?
311	44	¿Qué significa 'Excusez-moi' en francés?
601	60	If it _____ tomorrow, we'll stay at home and watch movies.
602	60	She's been studying English _____ three years now.
603	60	Could you please _____ me the salt?
604	60	This is _____ interesting book I've ever read.
605	60	We _____ to the new restaurant last weekend.
606	60	She _____ play the piano when she was five years old.
607	60	I'm not used to _____ up so early on weekends.
608	60	They live in _____ apartment in the city center.
609	60	You look tired. You _____ go to bed earlier.
610	60	He asked me where _____ from.
611	60	The movie was so boring that I _____ asleep in the cinema.
612	60	My brother is _____ than me by two years.
613	60	I wish I _____ speak French fluently.
342	47	¿Cuál fue el nombre del líder británico que inició la expansión del Imperio Británico en el siglo XVIII?
343	47	¿Cuál fue el resultado de la Guerra de las Siete Hermanas entre Inglaterra y Francia?
344	47	¿Cuál fue el nombre del acto que permitió a Inglaterra establecer colonias en América del Norte?
345	47	¿Cuál fue el resultado de la Guerra de los Siete Años entre Inglaterra y Prusia?
346	47	¿Cuál fue el nombre del líder británico que apoyó la Revolución Americana?
347	47	¿Cuál fue el resultado de la Guerra de la Independencia de los Estados Unidos?
348	47	¿Cuál fue el nombre del acto que permitió a Inglaterra establecer colonias en la India?
349	47	¿Cuál fue el resultado de la Guerra de Crimea entre Inglaterra y Rusia?
350	47	¿Cuál fue el nombre del líder británico que apoyó la Unión Soviética en la Guerra Civil Rusa?
351	47	¿Cuál fue el resultado de la Guerra del Opio entre Inglaterra y China?
352	48	¿Quién es el principal impulsor del Modelo Keynesiano?
353	48	¿Cuál es el concepto clave del Modelo Keynesiano para explicar la depresión económica?
354	48	¿Qué es el multiplicador fiscal en el Modelo Keynesiano?
355	48	¿Cuál es el objetivo principal del gobierno en el Modelo Keynesiano durante una depresión económica?
356	48	¿Qué es el multiplicador monetario en el Modelo Keynesiano?
357	48	¿Cuál es la principal limitación del Modelo Keynesiano?
358	48	¿Qué es el agregado de la demanda en el Modelo Keynesiano?
359	48	¿Cuál es el objetivo del multiplicador fiscal en el Modelo Keynesiano?
360	48	¿Qué es el agregado de la oferta en el Modelo Keynesiano?
361	48	¿Cuál es el principal beneficio del Modelo Keynesiano?
362	49	¿Cuál es el objetivo principal de las bases de datos NoSQL?
363	49	¿Qué característica es común en las bases de datos NoSQL?
364	49	¿Cuál es un ejemplo de base de datos NoSQL?
365	49	¿Qué ventaja tienen las bases de datos NoSQL sobre las relacionales?
366	49	¿Qué significa NoSQL?
367	49	¿Qué tipo de estructura de datos se utiliza comúnmente en las bases de datos NoSQL?
368	49	¿Qué es el motor de almacenamiento de MongoDB?
369	49	¿Qué ventaja tiene la estructura de datos orientada a documentos sobre la relación?
370	49	¿Qué es un ejemplo de base de datos NoSQL que utiliza un modelo de datos orientado a documentos?
371	49	¿Cuál es una de las principales características de las bases de datos NoSQL?
522	58	¿Qué general alemán, apodado 'El Zorro del Desierto', dirigió el Afrika Korps y se vio obligado a rendirse tras la batalla de El Alamein?
523	58	La Conferencia de Yalta, celebrada en febrero de 1945, reunió a los 'Tres Grandes' para decidir el futuro de la posguerra. ¿Quiénes eran esos tres líderes?
524	58	¿Cuál fue el nombre en clave de la operación alemana para la invasión de la Unión Soviética, que comenzó el 22 de junio de 1941?
525	58	¿Qué batalla, considerada el punto de inflexión definitivo en el Frente Oriental, culminó con la rendición del 6º Ejército alemán el 2 de febrero de 1943?
526	58	¿Qué almirante japonés fue el arquitecto principal del ataque a Pearl Harbor y murió en 1943 cuando su avión fue derribado por fuerzas estadounidenses?
527	58	El Pacto de Acero, firmado en mayo de 1939, establecía una alianza militar ofensiva y defensiva entre la Alemania nazi y qué otra potencia del Eje?
528	58	¿Qué científico alemán, a menudo llamado el 'padre del programa espacial estadounidense', se rindió a las tropas aliadas y fue llevado a EE.UU. tras la guerra dentro de la Operación Paperclip?
529	58	¿Cuál fue el nombre del proyecto británico de inteligencia que logró descifrar las comunicaciones alemanas cifradas con la máquina Enigma?
530	58	¿Qué país, neutral al inicio de la guerra, fue invadido por Alemania el 9 de abril de 1940 en la 'Operación Weserübung', dando inicio a la campaña de Noruega?
531	58	¿Qué batalla aeronaval, librada en junio de 1942, marcó el límite máximo de la expansión japonesa en el Pacífico y fue ganada por EE.UU. gracias a la inteligencia de comunicaciones?
532	58	¿Qué político francés, líder de la Francia Libre desde el exilio, pronunció la famosa 'Llamada del 18 de junio' de 1940 para continuar la lucha contra la Alemania nazi?
1249	95	¿Qué es el teatro y dramaturgia?
1250	95	¿Qué es un monólogo en el teatro?
1251	95	¿Cuál es el propósito de la dramaturgia?
1252	95	¿Qué es un personaje secundario en una obra de teatro?
1253	95	¿Qué es el final de una obra de teatro?
1254	95	¿Qué es un texto dramático?
1255	95	¿Qué es un personaje estereotipado?
1256	95	¿Qué es el teatro épico?
1257	95	¿Qué es un diálogo en el teatro?
1258	95	¿Qué es un personaje dinámico?
1259	95	¿Qué es la dramaturgia contemporánea?
1260	95	¿Qué es un texto dramático moderno?
1261	95	¿Qué es el teatro de vanguardia?
1262	95	¿Qué es un personaje secundario en una obra de teatro?
1263	95	¿Qué es el final de una obra de teatro?
1264	95	¿Qué es un texto dramático?
1265	95	¿Qué es un personaje estereotipado?
1266	95	¿Qué es el teatro épico?
1267	95	¿Qué es un diálogo en el teatro?
1268	95	¿Qué es un personaje dinámico?
1014	77	¿Qué evento tradicional marca el final de la República Romana y el inicio del Imperio?
1015	77	¿Qué dinastía, conocida por emperadores como Tiberio, Calígula, Claudio y Nerón, gobernó Roma en el siglo I d.C.?
1016	77	La 'Pax Romana' fue un largo periodo de relativa paz y estabilidad. ¿Bajo el mandato de qué emperador comenzó principalmente?
1017	77	¿Cuál fue una de las principales causas de la 'Crisis del Siglo III' en el Imperio Romano?
648	65	After the long hike, I had a blister on my ________.
649	65	He felt a sharp pain in his ________, just below the ribcage.
650	65	The boxer was hit square on the ________ and collapsed.
651	65	She massaged her ________, trying to relieve the tension from typing all day.
652	65	The nerve impulse travels from the brain, down the spinal column, and into the ________.
653	65	A common site for an intravenous drip is the ________.
654	65	The diamond necklace rested perfectly in the hollow of her ________.
462	55	¿Quién fue el médico grecorromano que descubrió la circulación de la sangre?
463	55	¿Qué médico italiano descubrió la naturaleza de la malaria?
464	55	¿Quién fue el médico francés que desarrolló la teoría de la homeopatía?
465	55	¿Quién fue el médico español que descubrió la vacuna contra la viruela?
466	55	¿Quién fue el médico inglés que desarrolló la teoría de la evolución de las especies?
467	55	¿Quién fue la primera mujer médica en la historia?
468	55	¿Quién fue el médico alemán que descubrió la bacteria que causa la tuberculosis?
655	65	He pulled a muscle in his ________ while doing a high kick.
656	65	The doctor checked the patient's ________ for swollen glands.
1018	77	El emperador Diocleciano intentó resolver la crisis del imperio con una reforma administrativa clave. ¿En qué consistía?
1019	77	¿Qué emperador legalizó el cristianismo mediante el Edicto de Milán en el año 313 d.C.?
1020	77	¿Qué evento del año 476 d.C. se considera tradicionalmente el fin del Imperio Romano de Occidente?
1021	77	¿Cómo se denominaba el impuesto directo que pagaban los habitantes no ciudadanos de las provincias al fisco romano?
1022	77	¿Qué extensa obra defensiva ordenó construir el emperador Adriano en el norte de Britania para marcar el límite del imperio?
1023	77	El 'Derecho Romano' alcanzó su máxima sistematización bajo el mandato de un emperador de Oriente. ¿Quién fue y qué código mandó compilar?
1024	77	¿Qué provincia, extremadamente rica y granero del imperio, fue el feudo personal de Cleopatra antes de ser anexionada por Augusto?
1025	77	¿Qué importante reforma militar, asociada a Cayo Mario a finales de la República, permitió el reclutamiento masivo de ciudadanos sin propiedades?
1026	77	¿Qué título ostentaba el máximo sacerdote de la religión romana tradicional, cargo que asumían los emperadores?
1027	77	¿Cómo se llamaba la clase social alta y terrateniente, descendiente de los patricios y plebeyos enriquecidos, que dominaba el Senado y los altos cargos?
1028	77	¿Qué importante rebelión de esclavos, liderada por el gladiador Espartaco, tuvo lugar entre el 73 y el 71 a.C.?
1029	77	¿Qué gran incendio devastó Roma en el año 64 d.C., y a qué emperador se acusó (quizá injustamente) de haberlo provocado?
1030	77	El 'Concilium Plebis' y los 'Tribunos de la Plebe' fueron instituciones clave para defender los intereses de la plebe. ¿Qué poder especial tenían los tribunos?
469	55	¿Quién fue el médico estadounidense que desarrolló la primera vacuna contra la poliomielitis?
470	55	¿Quién fue el médico francés que desarrolló la teoría de la inmunidad humoral?
471	55	¿Quién fue el médico italiano que descubrió la naturaleza de la lepra?
472	55	¿Quién fue la primera mujer médica en ganar un Premio Nobel?
473	55	¿Quién fue el médico alemán que desarrolló la teoría de la inmunidad celular?
474	55	¿Quién fue el médico estadounidense que desarrolló la primera vacuna contra la hepatitis B?
475	55	¿Quién fue el médico francés que desarrolló la teoría de la fotosíntesis en las plantas?
476	55	¿Quién fue el médico italiano que desarrolló la teoría de la evolución de las especies en las plantas?
477	55	¿Quién fue la primera mujer médica en ganar un Premio Nobel en Medicina?
478	55	¿Quién fue el médico alemán que desarrolló la teoría de la inmunidad humoral en las enfermedades infecciosas?
479	55	¿Quién fue el médico estadounidense que desarrolló la primera vacuna contra la varicela?
480	55	¿Quién fue el médico francés que desarrolló la teoría de la fotosíntesis en las bacterias?
481	55	¿Quién fue el médico italiano que desarrolló la teoría de la evolución de las especies en las bacterias?
1031	77	¿Qué río cruzó Julio César con su ejército en el 49 a.C., dando inicio a una guerra civil contra Pompeyo, acto que generó una famosa frase?
1032	77	La 'Constitutio Antoniniana' del año 212 d.C., promulgada por Caracalla, tuvo un efecto trascendental. ¿Qué establecía?
1033	77	¿Qué pueblo bárbaro, originario de Escandinavia, saqueó Roma en el año 410 d.C., un golpe moral enorme para el imperio?
1034	77	¿Qué sistema de gobierno, instituido por Augusto, mantuvo formalmente las instituciones republicanas (Senado, magistraturas) mientras el poder real residía en el emperador?
1035	77	La cultura romana fue profundamente influenciada por la griega. ¿Cómo se llama este fenómeno de adopción y adaptación cultural?
1036	77	¿Qué importante batalla del año 9 d.C. supuso una derrota catastrófica para Roma, donde tres legiones fueron aniquiladas por tribus germánicas lideradas por Arminio?
1037	77	¿Qué provincias ricas del norte de África fueron el núcleo del poder de la familia de Septimio Severo, fundador de la dinastía Severa?
1038	77	¿Qué monumental construcción, iniciada por Vespasiano e inaugurada por Tito, era el anfiteatro más grande del mundo romano y se usaba para espectáculos públicos?
1039	77	¿Qué término se utilizaba para designar el poder militar y de mando supremo que tenían los emperadores y algunos magistrados republicanos?
657	65	She had a small tattoo on her ________, just above the hip bone.
533	58	El 'Plan Morgenthau', discutido por los Aliados hacia el final de la guerra, proponía una política de posguerra muy estricta para Alemania. ¿En qué consistía principalmente?
534	58	¿Qué unidad militar alemana de élite, conocida por sus tácticas de guerra relámpago, estaba formada por divisiones Panzer apoyadas por infantería motorizada y aviación?
535	58	¿En qué ciudad polaca los alemanes establecieron el gueto judío más grande de toda la Europa ocupada, que fue finalmente liquidado tras el levantamiento de 1943?
536	58	¿Qué organización de espionaje y operaciones especiales británica fue creada en 1940 para fomentar la resistencia y el sabotaje en la Europa ocupada?
537	58	¿Qué importante puerto francés, objetivo clave del Día D, fue capturado por fuerzas aliadas el 26 de junio de 1944 tras un largo y sangriento asedio?
538	58	El 'Acuerdo de Múnich' de 1938, que cedió los Sudetes a Alemania, es un símbolo de la política de 'apaciguamiento'. ¿Quién fue el primer ministro británico que la defendió y firmó el acuerdo?
539	58	¿Qué batalla, la última gran ofensiva alemana en el Frente Occidental, comenzó el 16 de diciembre de 1944 en las densas Ardenas?
540	58	¿Quién fue el comandante supremo aliado del Teatro de Operaciones del Pacífico Suroeste y posteriormente aceptó la rendición japonesa a bordo del USS Missouri?
541	58	¿Qué término se utilizaba para referirse al sistema de trabajo esclavo y campos de concentración que la Alemania nazi estableció para eliminar a sus enemigos políticos y raciales?
542	58	La 'Conferencia de Wannsee', celebrada en enero de 1942, es infame por tratar la organización de qué crimen masivo?
543	58	¿Qué isla del Mediterráneo, posesión británica, sufrió un intenso asedio aéreo y naval por parte de las fuerzas del Eje (Italia y Alemania) entre 1940 y 1942, siendo crucial para el control de las rutas de suministro?
544	58	¿Qué almirante estadounidense comandó la Tercera Flota y fue conocido por su agresividad y su eslogan 'Atacar, atacar, atacar'?
545	58	El 'Tratado de No Agresión Germano-Soviético', firmado en agosto de 1939, contenía un protocolo secreto que delineaba las esferas de influencia en Europa del Este. ¿Qué países se repartían?
482	56	¿Qué es la regresión lineal?
483	56	¿Cuál es el objetivo principal de la correlación de Pearson?
484	56	¿Cuál es el coeficiente de determinación (R^2) en la regresión lineal?
485	56	¿Qué es el cociente de regresión?
486	56	¿Cuál es el tipo de regresión que utiliza la recta de regresión?
487	56	¿Qué es la recta de regresión?
488	56	¿Cuál es el coeficiente de correlación de Pearson?
896	73	¿Quién fue el emperador romano que se hizo llamar 'Dios'?
897	73	¿Qué fue la Legión Romana?
898	73	¿Cuál fue la principal fuente de riqueza del Imperio Romano?
899	73	¿Qué fue el Senado Romano?
900	73	¿Cuándo se dividió el Imperio Romano?
901	73	¿Quién fue el emperador romano que conquistó Gran Bretaña?
902	73	¿Qué fue el Panteón de Roma?
903	73	¿Cuál fue la principal fuente de energía del Imperio Romano?
1040	77	¿Qué pueblo itálico, vecino y enemigo temprano de Roma, fue finalmente asimilado tras las Guerras Samnitas (siglos IV-III a.C.)?
1041	77	Durante el Imperio, el territorio se dividía en provincias. ¿Cómo se llamaban las provincias más pacíficas, bajo control directo del Senado?
1042	77	¿Qué importante reforma monetaria implementó Augusto para estabilizar la economía, creando un sistema basado en el áureo de oro y el denario de plata?
1043	77	¿Qué famoso historiador romano, autor de 'Ab Urbe Condita' (Desde la fundación de la Ciudad), narró la historia de Roma desde sus orígenes?
1044	78	What is the English word for the part of your body you use to see?
1045	78	You have five of these on each hand. What are they?
1046	78	What is the name of the organ inside your chest that pumps blood?
1047	78	Which part of your body do you use to smell things?
1048	78	What is the English word for the part of your leg between the knee and the foot?
1049	78	You have two of these, one on each side of your head, and you use them to hear.
1050	78	What is the name of the joint in the middle of your arm?
1051	78	Which part of your face do you use to smile or eat?
824	71	¿Cuál es la naturaleza jurídica principal de la Fundación General de la UCM?
825	71	¿Cuál es el fin fundamental de la Fundación, según sus Estatutos?
826	71	¿Qué órgano es el máximo de gobierno y representación de la Fundación?
827	71	¿Quién es, por su cargo, el Presidente del Patronato de la Fundación?
828	71	¿Dónde tiene su domicilio social la Fundación?
1052	78	What is the English word for the part of your body that connects your head to your shoulders?
1053	78	You have ten of these on your feet. What are they?
1054	78	Which part of your body is often called your 'belly'?
1055	78	What is the joint that connects your foot to your leg?
1056	78	You have two of these, one on each side of your body below your arms. They connect your arms to your torso.
1057	78	What is the name of the hard parts inside your body that make up your skeleton?
1058	78	Which part of your leg allows it to bend?
1059	78	What is the English word for the part of your arm between your elbow and your hand?
1060	78	You use this part of your body to taste food. It is inside your mouth.
546	58	¿Qué mariscal soviético, Jefe del Estado Mayor y brillante estratega, es considerado el principal arquitecto de las grandes ofensivas que llevaron al Ejército Rojo a Berlín?
547	58	¿Qué batalla, librada entre agosto y octubre de 1942 en el Pacífico, fue la primera gran ofensiva terrestre de los Aliados contra Japón y marcó el inicio de la contraofensiva aliada?
548	58	¿Qué organización de la Alemania nazi, dirigida por Heinrich Himmler, controlaba los campos de concentración, las SS y la Gestapo, siendo el principal instrumento del terror?
549	58	¿Qué operación aliada, la invasión anfibia más grande de la historia, comenzó el 6 de junio de 1944 con el desembarco en las playas de Normandía?
550	58	¿Qué país, originalmente aliado de Alemania, cambió de bando y declaró la guerra a Alemania el 13 de octubre de 1943, tras la caída de Mussolini?
551	58	¿Qué general estadounidense, apodado 'Sangre y Agallas', comandó el Tercer Ejército durante su rápida marcha a través de Francia en 1944?
552	58	¿Qué ciudad japonesa fue el objetivo de la segunda bomba atómica, lanzada el 9 de agosto de 1945 por el B-29 'Bockscar'?
553	58	La 'Ley de Préstamo y Arriendo', promulgada por EE.UU. en marzo de 1941, permitió proveer material de guerra a naciones cuya defensa se consideraba vital. ¿A qué país fue el principal destinatario antes de la entrada de EE.UU. en la guerra?
554	58	¿Qué batalla de tanques, la más grande de la historia, tuvo lugar en julio de 1943 cerca de la ciudad rusa de Kursk, siendo una derrota estratégica alemana de la que nunca se recuperaron?
555	58	¿Quién fue el Primer Ministro japonés durante la mayor parte de la guerra, desde octubre de 1941 hasta julio de 1944, supervisando el ataque a Pearl Harbor y la expansión inicial?
556	58	¿Qué ciudad costera francesa en el Canal de la Mancha fue el punto principal de evacuación de las tropas británicas y francesas rodeadas en Dunkerque en 1940?
557	58	¿Qué país nórdico, invadido por la URSS en la 'Guerra de Invierno' (1939-40), luchó posteriormente junto a Alemania contra los soviéticos en la 'Guerra de Continuación'?
558	58	¿Qué conferencia aliada, celebrada en julio de 1945 en la cercanía de Berlín, estableció los principios para la administración aliada de la Alemania derrotada y sentó las bases para los Juicios de Núremberg?
668	65	She wore a bracelet high up on her ________.
492	56	¿Cuál es el objetivo principal de la regresión no lineal?
493	56	¿Qué es la regresión logística?
494	56	¿Cuál es el objetivo principal de la regresión logística?
501	56	¿Qué es la regresión de logística?
495	56	¿Qué es la correlación de Spearman?
496	56	¿Qué es la regresión de Poisson?
497	56	¿Qué es la regresión de binomial?
498	56	¿Qué es la regresión de normal?
499	56	¿Qué es la regresión de gamma?
500	56	¿Qué es la regresión de Weibull?
502	56	¿Qué es la regresión de Poisson generalizada?
504	56	¿Qué es la regresión de normal generalizada?
505	56	¿Qué es la regresión de gamma generalizada?
506	56	¿Qué es la regresión de Weibull generalizada?
489	56	¿Qué es la regresión lineal múltiple?
490	56	¿Cuál es el objetivo principal de la regresión lineal múltiple?
503	56	¿Qué es la regresión de binomial generalizada?
565	58	¿Qué ministro de Propaganda del Tercer Reich fue una de las figuras más influyentes en moldear la opinión pública alemana y se suicidó tras la captura de Berlín?
566	58	¿Qué operación aérea masiva de la RAF (Real Fuerza Aérea Británica) contra la ciudad alemana de Colonia en mayo de 1942 marcó el inicio de los bombardeos de área estratégicos sobre Alemania?
567	58	¿Qué avión de combate británico, junto con el Hurricane, fue fundamental para ganar la Batalla de Inglaterra gracias a su superioridad sobre los cazas alemanes?
568	58	¿Qué batalla en el norte de África, librada en dos fases (julio y octubre-noviembre de 1942), detuvo el avance del Afrika Korps hacia el canal de Suez y fue la primera gran victoria terrestre aliada contra Alemania?
569	58	¿Qué piloto alemán, el as de la aviación de mayor puntuación en la historia, derribó oficialmente 352 aviones enemigos, la mayoría en el Frente Oriental?
570	58	¿Qué potencia del Eje en los Balcanes, inicialmente neutral, fue invadida por Alemania en abril de 1941 para asegurar el flanco sur antes de la invasión de la URSS?
571	58	¿Qué político británico sucedió a Neville Chamberlain como Primer Ministro en mayo de 1940 y se convirtió en el símbolo de la resistencia británica contra la Alemania nazi?
572	58	¿Qué término se utilizaba para referirse a la zona costera fortificada que Alemania construyó desde Noruega hasta la frontera española para evitar una invasión aliada?
573	58	¿Qué famoso discurso de Winston Churchill, pronunciado el 4 de junio de 1940 tras la evacuación de Dunkerque, incluyó la frase 'lucharemos en las playas...'?
574	58	¿Qué importante ciudad industrial soviética en el río Volga, rebautizada en 1961, fue conocida como Stalingrado durante la guerra y fue escenario de la batalla más sangrienta?
658	65	The feeling of pins and needles started in his ________.
659	65	The sculptor paid special attention to the model's ________ and cheekbones.
660	65	He applied pressure to the ________ on his forearm to stop the bleeding.
661	65	The yoga instructor emphasized stretching the ________ along the back of the leg.
662	65	She had a persistent ache in her ________, possibly from poor posture.
663	65	The cold wind made the ________ on his arms stand up.
664	65	He tapped his ________ thoughtfully with his pen.
665	65	The runner felt a strain in her ________ with every step.
666	65	The baby grabbed her father's finger with her tiny ________.
667	65	The knight's armor protected his vital organs, including his ________.
669	65	The injection was given in the ________ muscle.
670	65	He rubbed his ________, where he had been feeling a tension headache.
671	65	The climber's strong ________ allowed him to grip the small ledge.
672	65	She felt the baby kick against her ________.
829	71	De las siguientes actividades, ¿cuál SÍ puede realizar la Fundación según el artículo 6?
830	71	¿Cómo se llaman los patronos que pertenecen al Patronato por el cargo que ocupan en la UCM (como el Rector)?
831	71	¿Qué porcentaje mínimo de sus resultados debe destinar la Fundación a sus fines fundacionales?
832	71	¿Qué órgano se encarga de la dirección ejecutiva y gestión operativa del día a día de la Fundación?
833	71	¿Cuál es la duración prevista para la Fundación?
834	71	¿Puede la Fundación desarrollar actividades en el extranjero?
835	71	¿Qué principio debe guiar la selección de los beneficiarios de las actividades de la Fundación (como becas)?
836	71	¿Con qué periodicidad mínima debe reunirse el Patronato?
837	71	¿Quién nombra al Director General de la Fundación?
838	71	¿Qué contiene el patrimonio de la Fundación?
839	71	¿Qué órgano está compuesto por el Rector, el Gerente de la UCM y algunos patronos elegidos, y tiene delegadas muchas facultades del Patronato?
840	71	¿Qué documento debe aprobar el Patronato anualmente, donde se reflejan los objetivos y actividades del siguiente ejercicio?
841	71	¿Qué mayoría se necesita en el Patronato para acordar una modificación de los Estatutos?
842	71	Si la Fundación se extingue, ¿qué sucede con sus bienes restantes después de pagar deudas?
843	71	¿Qué artículo de los Estatutos define los fines y actividades de la Fundación?
1061	78	What is the joint that connects your hand to your arm?
1062	78	Which part of your body is on the back, below your neck and above your hips?
1063	78	What is the English word for the hair on top of a person's head?
1269	96	¿Cuál es el proceso psicológico que permite almacenar y recuperar información a largo plazo?
1270	96	¿Cuál es el tipo de memoria que se utiliza para realizar tareas que requieren la manipulación de información?
1271	96	¿Cuál es el mecanismo que permite enfocar la atención en un estímulo específico en un entorno complejo?
1272	96	¿Cuál es el tipo de memoria que se utiliza para almacenar información que se ha aprendido a través de la experiencia?
1273	96	¿Cuál es el proceso psicológico que permite distinguir entre información relevante e irrelevante?
614	60	She _____ her homework when I called her.
615	60	There aren't _____ students in the classroom today.
616	60	If I _____ you, I would accept the job offer.
617	60	He's looking forward to _____ on vacation next month.
618	60	This coffee is too hot _____.
619	60	They _____ each other since they were children.
620	60	The test was _____ difficult that many students failed.
621	60	I need to get my hair _____ tomorrow.
622	60	She speaks _____ quickly for me to understand.
623	60	By this time next year, I _____ my degree.
624	60	Neither my sister _____ my brother likes chocolate.
1154	90	In a very formal context, which is the most appropriate way to ask for permission?
1155	90	Someone says, "You've never been to Japan, have you?" You have been there. What is the correct, natural-sounding confirmation?
1156	90	Which question is grammatically correct to ask about a past possibility?
787	70	¿Qué garantía procesal se introduce en el artículo 15.5 para los patronos que se opongan a un acuerdo lesivo?
1157	90	How would you diplomatically and indirectly suggest that someone is wrong?
1158	90	Which response is an appropriate, polite refusal to an informal invitation (e.g., "Want to grab a drink later?")?
1159	90	What is the most natural way to ask for a repetition when you didn't hear someone's name?
1160	90	In response to "Thank you so much for your help," which reply is overly formal for everyday use?
1161	90	Which question tag is correct for the sentence: "I'm right about this, _____?"
1162	90	How would you ask a speculative question about the future with a sense of doubt?
1163	90	Which phrase is used to HEDGE (soften) an opinion or suggestion?
1164	90	What is the implied meaning of the response "You wish!" to a statement or question?
331	45	¿Qué expedición lideró por Juan Sebastián Elcano en 1519?
312	45	Quién fue el explorador que lideró la primera expedición española a través de los territorios actuales de Estados Unidos en 1540?
313	45	¿Cuál fue el objetivo principal de la Expedición de Vasco Núñez de Balboa en 1513?
314	45	¿Quién fue el primer europeo en llegar a Australia en 1606?
315	45	¿Qué ciudad fue fundada por Hernán Cortés en 1519 en la costa del Golfo de México?
316	45	¿Quién lideró la Expedición de Juan Sebastián Elcano en 1521?
317	45	¿Qué paso natural fue descubierto por Vasco Núñez de Balboa en 1513?
318	45	¿Quién fue el primer europeo en llegar a la costa del Pacífico en América del Norte en 1539?
319	45	¿Qué expedición lideró por Fernando Magallanes en 1519?
1165	90	Complete this indirect question formally: "Could you tell me ________?"
1166	90	In a debate, how might you politely but firmly interrupt to make a counterpoint?
1167	90	Which response correctly uses ellipsis (omitting words) in a natural way? Q: "Are you coming to the meeting?"
1168	90	What does the question "How come?" mean, and what is its register (level of formality)?
756	69	Cuando se produce un empate en una votación del Patronato, ¿quién tiene voto de calidad?
757	69	¿Cuál de los siguientes NO es un órgano unipersonal de la Fundación según el artículo 12?
758	69	¿Bajo qué circunstancias puede un patrono ser reembolsado de gastos, según el artículo 15?
759	69	¿Qué debe hacer una persona jurídica designada como patrono, según el artículo 16?
760	69	Según el artículo 25, para que el Consejo Ejecutivo se constituya válidamente se necesita:
761	69	¿Qué libro contable NO es obligatorio llevar según el artículo 38?
762	69	¿Cuál es el plazo máximo para que el Patronato apruebe las cuentas anuales desde el cierre del ejercicio (Art. 38)?
763	69	Para acordar la modificación de los Estatutos, se requiere (Art. 39):
772	69	¿Qué artículo prohíbe a la Fundación participar en licitaciones de la UCM, salvo excepción?
776	69	¿Quién elige libremente al destinatario final de los bienes remanentes tras la liquidación de la Fundación (Art. 42)?
734	69	Según el artículo 8, ¿qué porcentaje mínimo de los resultados de sus actividades económicas debe destinar la Fundación a sus fines?
733	69	¿Cómo puede la Fundación desarrollar sus fines, según el artículo 7?
765	69	Durante la liquidación, ¿a qué tipo de entidades se deben destinar preferentemente los bienes remanentes (Art. 42)?
766	69	Según el artículo 7, las actividades encomendadas por la UCM a la Fundación se instrumentan a través de:
767	69	¿Qué artículo establece que los recursos de la Fundación se entienden afectos a sus fines sin determinación de cuotas?
768	69	¿En qué casos debe abstenerse un patrono de votar, según el artículo 20?
1169	90	Which is the most natural way to ask for a small favor from a colleague?
1170	90	How do you form a negative question to express surprise? (e.g., You expected someone to call, but they didn't.)
1171	90	What is the function of the response "So do I" or "Neither do I"?
1172	90	Which question is asking for a reason or explanation?
1173	90	How would you rhetorically ask a question to which you expect the answer 'no', implying criticism?
1174	90	In response to "I'm sorry I'm late," which reply focuses on the present situation rather than the apology?
1175	90	What does the question "You what?" usually express when said with rising intonation?
1176	90	Which is the correct way to ask a question emphasizing the subject? (e.g., The MANAGER wants to see you, not the assistant.)
1177	90	How might you defer answering a difficult question directly in a professional setting?
1178	90	What is the nuanced difference between "Shall we...?" and "Should we...?" when making a suggestion?
625	61	¿Qué actor estadounidense ganó su primer Óscar como Mejor Actor por su interpretación en 'Dallas Buyers Club' (2013) y es conocido por su transformación física para sus papeles?
626	61	¿Qué actriz estadounidense ganó el Óscar a Mejor Actriz por 'La La Land' (2016) y es conocida por su papel en la saga de 'Harry Potter' cuando era niña?
627	61	¿Qué actor, conocido por sus papeles en 'Fight Club' y 'Ocean's Eleven', se convirtió en el hombre mejor pagado de Hollywood en 2020 y es copropietario del equipo de fútbol Wrexham AFC?
628	61	¿Qué actriz ganó el Óscar a Mejor Actriz por 'Monster' (2003), donde se transformó físicamente para interpretar a la asesina en serie Aileen Wuornos?
629	61	¿Qué actor estadounidense es conocido por interpretar a Tony Stark/Iron Man en el Universo Cinematográfico de Marvel y es fundador de la productora Team Downey?
630	61	¿Qué actriz ganó el Óscar a Mejor Actriz por 'Silver Linings Playbook' (2012) y es la actriz más joven en haber recibido cuatro nominaciones al Óscar en categorías de actuación?
631	61	¿Qué actor, conocido por su papel en la serie 'Breaking Bad', ganó el Óscar a Mejor Actor por 'The Theory of Everything' (2014) donde interpretó a Stephen Hawking?
632	61	¿Qué actriz estadounidense ganó el Óscar a Mejor Actriz de Reparto por 'The Fighter' (2010) y es conocida por sus papeles en 'American Hustle' y 'Joy'?
633	61	¿Qué actor interpretó al Joker en 'The Dark Knight' (2008), ganando un Óscar póstumo a Mejor Actor de Reparto?
634	61	¿Qué actriz es conocida por sus papeles en 'Lost in Translation', 'Her' y por interpretar a Black Widow en el Universo Cinematográfico de Marvel?
635	61	¿Qué actor ganó el Óscar a Mejor Actor por 'The Revenant' (2015) después de múltiples nominaciones, y es conocido por su activismo ambiental?
636	61	¿Qué actriz estadounidense ganó el Óscar a Mejor Actriz por 'Still Alice' (2014) y es conocida por su papel en la serie 'Grey's Anatomy'?
637	61	¿Qué actor es conocido por sus papeles en 'The Social Network', 'Steve Jobs' y por interpretar a Spider-Man en el Universo Cinematográfico de Marvel?
638	61	¿Qué actriz ganó el Óscar a Mejor Actriz por 'Room' (2015) y es conocida por dirigir y protagonizar 'Unicorn Store'?
639	61	¿Qué actor estadounidense es conocido por sus papeles en 'American Psycho', 'The Machinist' y por interpretar a Batman en la trilogía de Christopher Nolan?
640	61	¿Qué actriz ganó dos Óscar consecutivos a Mejor Actriz por 'The Blind Side' (2009) y 'The Help' (2011)?
641	61	¿Qué actor es conocido por interpretar a Don Draper en la serie 'Mad Men' y por sus papeles en películas como 'The Town' y 'Gone Girl'?
642	61	¿Qué actriz estadounidense ganó el Óscar a Mejor Actriz por 'Million Dollar Baby' (2004) y es conocida por su papel en la serie 'Big Little Lies'?
643	61	¿Qué actor es conocido por sus papeles en 'Pulp Fiction', 'Django Unchained' y por interpretar a Nick Fury en el Universo Cinematográfico de Marvel?
644	61	¿Qué actriz ganó el Óscar a Mejor Actriz por 'The Iron Lady' (2011) y mantiene el récord de más nominaciones al Óscar en la historia?
1179	91	Un gato te lame la mano o la cara de forma insistente, pero no con la lengua áspera de aseo, sino más suave. Además, su cola está quieta o baja. ¿Qué está expresando más probablemente?
491	56	¿Qué es la regresión no lineal?
1180	91	Tu gato se acerca a ti cuando estás triste o enfermo, se acurruca a tu lado y ronronea de manera constante. Más allá del cariño, ¿qué función biológica podría estar cumpliendo ese comportamiento?
1181	91	Un gato que convive contigo desde hace años de repente orina fuera de la bandeja, en un lugar muy visible como tu cama o el sofá. Has descartado problemas médicos. ¿Cuál es la causa conductual más probable?
1182	91	Tu gato te trae un "regalo" muerto (un insecto, un ratón) y lo deja a tus pies, mirándote fijamente. ¿Qué interpretación etológica tiene este acto?
577	59	Choose the phrasal verb that means 'to tolerate or endure an unpleasant situation':
578	59	Complete the sentence: 'The new evidence _____ his earlier testimony, suggesting he hadn't been entirely truthful.'
579	59	In the sentence 'She's really taken to gardening,' what does 'taken to' mean?
580	59	Which phrasal verb means 'to compensate for something' or 'to make up for a deficiency'?
581	59	Select the correct completion: 'The project _____ several unexpected obstacles that delayed completion.'
582	59	What is the meaning of 'to fob someone off'?
583	59	Complete: 'We need to _____ the details before we can sign the contract.'
584	59	What does 'to cotton on to something' mean?
585	59	Which phrasal verb means 'to finally do something after delay, especially when you should have done it earlier'?
586	59	In a business context, what does 'to write off' a debt mean?
587	59	Choose the sentence where 'work out' means 'to exercise'.
588	59	What is the meaning of 'to fall back on something'?
589	59	Complete: 'The scandal _____ the minister's resignation.'
590	59	Which phrasal verb means 'to gradually reduce something (like staff or spending)'?
591	59	What does 'to clam up' mean?
592	59	Select the correct meaning of 'to tide someone over':
593	59	Complete: 'His arrogance _____ him _____ many potential allies.'
594	59	In the context of time, what does 'to while away' mean?
595	59	Which phrasal verb means 'to investigate or examine something thoroughly'?
596	59	What is the meaning of 'to square up to a problem'?
597	59	Complete: 'The company tried to _____ the negative publicity by launching a charity campaign.'
598	59	What does 'to jib at something' mean?
599	59	Which sentence correctly uses 'to bow out'?
575	59	Complete the sentence with the correct phrasal verb: 'After months of negotiations, the two companies finally _____ a mutually beneficial agreement.'
576	59	What does 'to mull something over' mean?
1183	91	¿Qué significa realmente cuando un gato te "amasa" o "hace pan" con las patas delanteras, a menudo con las uñas fuera, sobre tu regazo o una manta suave?
1184	91	Tu gato se queda mirando fijamente a un punto vacío en la pared o al techo durante minutos, siguiendo algo con la mirada que tú no ves. Su cola puede moverse lentamente. ¿Qué está ocurriendo?
1185	91	Un gato te muestra la barriga, tumbado de espaldas en un estado aparentemente relajado. Si intentas acariciarle la barriga, a menudo te atrapa la mano con patas y mordiscos suaves. ¿Por qué hace esto?
1186	91	¿Qué indica el movimiento específico de la punta de la cola de un gato, cuando el resto del cuerpo está quieto y parece tranquilo?
1187	91	Tu gato bebe agua del grifo o de un vaso, pero ignora el agua fresca y limpia de su propio bowl. ¿A qué se puede deber esta preferencia?
1188	91	Un gato que te sigue constantemente al baño y se queda mirándote o intenta subirse a tu regazo. ¿Qué motivación hay detrás de este comportamiento?
1189	91	¿Por qué muchos gatos entierran sus excrementos meticulosamente, mientras que otros (sobre todo machos no castrados) los dejan a la vista?
1190	91	Tu gato se frota repetidamente contra tus piernas, la esquina de los muebles y otros objetos cuando llegas a casa. ¿Qué está haciendo realmente?
1191	91	¿Qué significa el "parpadeo lento" o "beso de ojos" que un gato te dirige cuando os miráis a los ojos?
1192	91	Un gato adulto que chupa o mastica obsesivamente tejidos de lana, algodón o plástico (como cables). Este comportamiento, llamado "pica", suele estar relacionado con:
1193	91	Tu gato duerme pegado a ti, a menudo con una pata sobre tu brazo o cabeza. Si te mueves, se queja suavemente y se reacomoda. ¿Por qué busca este contacto tan estrecho?
1194	91	¿Por qué algunos gatos "hablan" mucho (maúllan constantemente con distintos tonos) mientras que otros son casi silenciosos?
1195	91	Tu gato traga hierba del exterior o de una maceta que tienes para él, y luego a menudo vomita. ¿Cuál es el propósito biológico de esta conducta, a pesar del vómito?
1196	91	Cuando juegas con tu gato y de repente se "sobreestimula", pasa de mordisquear suavemente a morder y arañar con fuerza, y luego huye. Este cambio brusco se conoce como:
1197	91	Un gato que ha convivido contigo durante años empieza a dormir en lugares nuevos y poco habituales (dentro de armarios, detrás del sofá). Si es mayor, ¿qué podría indicar?
1198	91	El "cacareo" o "chatter" que hacen algunos gatos cuando ven un pájaro desde la ventana (mandíbula temblorosa, dientes castañeteando). ¿Qué representa este sonido?
1274	96	¿Cuál es el tipo de memoria que se utiliza para almacenar información que se ha aprendido a través de la observación?
1275	96	¿Cuál es el mecanismo que permite mantener la atención en una tarea durante un período prolongado de tiempo?
1276	96	¿Cuál es el tipo de memoria que se utiliza para almacenar información que se ha aprendido a través de la práctica?
1277	96	¿Cuál es el proceso psicológico que permite ignorar estímulos irrelevantes?
1278	96	¿Cuál es el tipo de memoria que se utiliza para almacenar información que se ha aprendido a través de la experiencia y la observación?
1322	99	El artículo 102 regula las figuras de contratación laboral específicas del ámbito universitario. ¿Cuál de las siguientes NO es una de esas figuras?
1323	99	¿Qué requisito fundamental deben cumplir los candidatos a Profesor Asociado, según el artículo 103?
1324	99	El artículo 100 regula la jubilación de los funcionarios docentes. ¿A qué edad se produce la jubilación forzosa, con la posibilidad de optar por hacerlo al final del curso académico?
1325	99	El artículo 104 detalla la duración de los contratos del PDI laboral. ¿Cuál de estas figuras tiene un contrato de carácter indefinido?
1326	99	El artículo 94 enumera los derechos de los funcionarios docentes. ¿Cuál de los siguientes se considera un derecho de este personal?
1327	99	¿Qué tipo de personal de administración y servicios (PAS) se rige, además de por la LOU y los Estatutos, por la legislación laboral y el convenio colectivo aplicable?
1328	99	El artículo 122 regula las Relaciones de Puestos de Trabajo (RPT) del PAS. ¿Qué información NO es necesario que contengan las RPT para cada puesto?
1329	99	Según el artículo 84, los concursos de acceso para plazas de funcionarios docentes constan de una única prueba pública. ¿Qué peso se otorga al 'curriculum vitae' en la valoración global del candidato?
1330	99	El artículo 88 establece la composición de las comisiones para los concursos de acceso. ¿Cuál es la proporción mínima de miembros externos a la UCM que deben formar parte de estas comisiones?
1331	99	El artículo 111 define a los 'investigadores contratados'. ¿Cuál es la característica principal de su relación con la Universidad?
864	73	¿Quién fue el primer emperador romano?
865	73	¿Cuál fue la capital del Imperio Romano?
866	73	¿Cuál fue la principal lengua hablada en el Imperio Romano?
868	73	¿Cuándo se fundó el Imperio Romano?
869	73	¿Quién fue el emperador romano que construyó la muralla de Adriano?
870	73	¿Qué fue la Pax Romana?
871	73	¿Cuál fue la principal religión del Imperio Romano?
872	73	¿Quién fue el emperador romano que se suicidó?
873	73	¿Qué fue la Legión Romana?
874	73	¿Cuál fue la principal fuente de riqueza del Imperio Romano?
875	73	¿Qué fue el Senado Romano?
876	73	¿Cuándo se dividió el Imperio Romano?
877	73	¿Quién fue el emperador romano que conquistó Gran Bretaña?
878	73	¿Qué fue el Panteón de Roma?
879	73	¿Cuál fue la principal fuente de energía del Imperio Romano?
880	73	¿Qué fue el Foro Romano?
881	73	¿Quién fue el emperador romano que construyó el Arco de Triunfo?
777	70	Según el artículo 1.2, la Fundación es un 'medio propio personificado' de la UCM conforme al artículo 32 de la Ley 9/2017. ¿Qué implicación práctica tiene esta calificación en relación con la contratación pública entre la Fundación y la Universidad?
778	70	El artículo 1.3 establece una prohibición de participar en licitaciones de la UCM, con una excepción. ¿Qué principio jurídico de la contratación pública busca preservar principalmente esta prohibición?
779	70	De la lectura conjunta de los artículos 2 y 3, ¿qué autoridad conserva potestades de control sobre actos específicos de la Fundación a pesar de su plena capacidad de obrar?
780	70	Según el artículo 7.4, la retribución de los encargos de la UCM se fija 'por referencia a tarifas aprobadas por la UCM en atención a los costes directos e indirectos'. ¿A qué modelo de financiación o relación económica se asemeja más este sistema?
781	70	El artículo 8 establece un destino mínimo del 70% de los resultados e ingresos a fines fundacionales. ¿Qué tratamiento recibe el 30% restante, y qué implicación tiene para el crecimiento patrimonial de la Fundación?
782	70	¿Qué diferencia sustancial existe, según el artículo 9, entre los recursos generales de la Fundación y los bienes transmitidos para un fin determinado?
783	70	El artículo 10.3 establece que 'Nadie podrá alegar... derecho alguno al goce de sus beneficios, antes de que fuesen concedidos'. ¿Qué principio del derecho administrativo de las subvenciones y ayudas refleja esta disposición?
784	70	En la composición del Patronato (Art. 14), los patronos electivos se dividen en dos grupos nombrados por órganos distintos. ¿Qué equilibrio o representatividad busca esta división en el gobierno de la Fundación?
785	70	Según el artículo 15.3, los patronos pueden contratar con la Fundación previo acuerdo expreso del Patronato y autorización del Protectorado. ¿Qué conflicto de interés potencial se regula con esta disposición?
786	70	El artículo 15.5 establece la responsabilidad solidaria de los patronos por actos contrarios a la ley o estatutos. ¿En qué se diferencia esta responsabilidad 'frente a la Fundación' de una responsabilidad penal o administrativa?
788	70	Según el artículo 16.1, una persona jurídica designada como patrono debe designar a su representante físico. Si dicho representante cesa en la persona jurídica, ¿cuál es el efecto sobre su condición de patrono de la Fundación?
789	70	El artículo 16.2 menciona varias formas de aceptar el cargo de patrono. ¿Cuál de estas formas tiene el efecto de inscripción directa en el Registro de Fundaciones sin necesidad de notificación posterior?
790	70	¿Qué diferencia fundamental existe en la causa de cese entre un patrono nato y un patrono electivo, según los artículos 16 y 17?
791	70	El artículo 17.2 establece un procedimiento de revocación de un patrono por causa justificada que requiere el voto favorable de dos tercios de los miembros del Patronato. ¿Qué regla específica de votación se aplica al patrono cuya revocación se propone?
792	70	Según el artículo 18.2, en casos de urgencia, el plazo de convocatoria del Patronato puede reducirse a dos días e incluso hacerse de forma verbal. ¿Qué requisito debe cumplirse para que una reunión convocada verbalmente sea válida?
793	70	El artículo 18.4 permite reuniones mediante videoconferencia. ¿Qué requisito técnico-jurídico es esencial para la validez de tales reuniones?
794	70	De las competencias del Patronato listadas en el artículo 19, ¿cuál o cuáles NO pueden ser objeto de delegación o apoderamiento según el apartado 2.f?
795	70	El artículo 20.1 establece que para el cálculo del quórum de constitución del Patronato, si el número de patronos es impar, se redondeará al alza. Si el Patronato tiene 15 miembros, ¿cuántos se necesitan para constituirse en primera convocatoria?
796	70	¿En qué circunstancia excepcional no es necesaria convocatoria previa para una reunión del Patronato, según el artículo 18.2?
797	70	¿Qué peculiaridad presenta la composición del Consejo Ejecutivo (Art. 21) en relación con la doble condición de sus miembros?
798	70	El artículo 22.3 establece que los consejeros electivos pueden delegar su representación y voto en las reuniones. ¿A quién pueden delegar, según el artículo 16.1 al que remite?
799	70	De las atribuciones delegadas del Consejo Ejecutivo (Art. 23), ¿cuál implica una potestad de naturaleza claramente discrecional en la gestión de los recursos financieros diarios?
800	70	El artículo 26 asigna al Presidente la función de 'velar por la correcta ejecución de los acuerdos adoptados por el Patronato'. ¿A través de qué órgano ejecutivo ejercita principalmente esta función de vigilancia?
801	70	El Director General es nombrado por el Consejo Ejecutivo (Art. 27) pero ejerce como Secretario del mismo sin voto (Art. 21). ¿Qué tipo de relación jerárquica y funcional se crea con este diseño orgánico?
802	70	Según el artículo 28.1.d, el Director General es 'el órgano de contratación de la Fundación'. ¿Qué límite implícito tiene esta potestad, deducible del resto de los estatutos?
803	70	Los artículos 30 y 31 regulan la Subdirección y la Gerencia. La principal diferencia en su nombramiento es:
804	70	El artículo 32.2 establece que la inscripción de la titularidad de los bienes 'hará mención a su origen o procedencia'. ¿Qué finalidad jurídica o de control puede tener este requisito?
805	70	Según el artículo 34, la administración del patrimonio corresponde al Patronato, que la ejerce a través del Consejo Ejecutivo. ¿En qué supuestos expresamente mencionados NO se delega en el Consejo Ejecutivo?
806	70	El artículo 35.2 habla de realizar modificaciones en las inversiones 'a tenor de lo que aconseje la coyuntura económica'. ¿Qué margen de discrecionalidad otorga esto al Patronato y qué límite tiene?
807	70	El artículo 36.2 establece que la aceptación de herencias por la Fundación se entenderá hecha 'siempre a beneficio de inventario'. ¿Qué protección ofrece este principio del derecho sucesorio a la Fundación?
808	70	El artículo 36.4 reafirma la regla del artículo 9 sobre la afectación común e indivisa del patrimonio. ¿Qué consecuencia tiene esto para un donante que quiera asegurarse de que su donación se use para un proyecto muy concreto?
809	70	Según el artículo 37.1, el Patronato debe aprobar y remitir el plan de actuación al Protectorado 'en los últimos tres meses de cada ejercicio'. Si el ejercicio termina el 31 de diciembre, ¿en qué periodo debe aprobarse y remitirse?
810	70	El artículo 38.3 exige que la memoria incluya 'el grado de cumplimiento del plan de actuación'. ¿Qué principio de gestión y rendición de cuentas (accountability) refuerza este requisito?
811	70	El artículo 38.5 habla de auditoría externa 'si la Fundación incurriera en los requisitos legales establecidos'. ¿A qué requisitos legales se refiere, comúnmente en la Ley de Fundaciones?
812	70	Para modificar los Estatutos (Art. 39), se requiere acuerdo del Patronato por mayoría de dos tercios, comunicación al Protectorado, escritura pública e inscripción en el Registro. ¿Qué papel juega el Protectorado en este proceso?
813	70	El artículo 40 regula la fusión. ¿Qué documento, además del balance, debe incorporarse a la resolución motivada del Patronato que acuerda la fusión?
814	70	En el acuerdo de extinción (Art. 41), el voto favorable requerido es de 'al menos dos terceras partes de los patronos presentes o representados'. ¿Cómo se diferencia este quórum del requerido para la modificación estatutaria (Art. 39)?
815	70	Los artículos 42.2 y 42.3 establecen el destino de los bienes liquidados a entidades beneficiarias del mecenazgo según la Ley 49/2002. ¿Qué requisito territorial adicional se impone a dichas entidades?
816	70	¿Qué jerarquía normativa se establece en el artículo 3.1, y qué disposición se sitúa en la cúspide de esa jerarquía para la Fundación?
817	70	Si el Rector de la UCM cesa en su cargo, ¿qué efectos automáticos produce en los órganos de la Fundación, según diversos artículos?
818	70	¿Qué artículo otorga al Patronato la facultad de crear 'Comisiones especiales', y para qué tipo de supuestos se mencionan?
819	70	¿Qué conflicto potencial se regula en el artículo 20.3, y qué medida se toma para evitarlo?
820	70	El artículo 7.2 permite actividades mercantiles 'con carácter accesorio'. ¿Qué dos condiciones vinculan estas actividades al objeto de la Fundación?
821	70	La 'dotación' de la Fundación (Art. 33) se compone de la dotación inicial y los bienes calificados como dotacionales. ¿Qué característica esencial diferencia a los bienes dotacionales de otros bienes del patrimonio?
822	70	En caso de extinción, el Patronato se constituye en comisión liquidadora 'bajo el control del Protectorado' (Art. 42.1). ¿Qué implica este control en términos prácticos?
823	70	¿Qué mecanismo de los estatutos asegura que, a pesar de la amplia delegación en el Consejo Ejecutivo y el Director General, el Patronato conserva el control último sobre las decisiones estratégicas y de mayor relevancia?
1279	97	¿Cuál es la principal razón expuesta en el Decreto 32/2017 para aprobar unos nuevos Estatutos de la UCM en lugar de una simple modificación de los anteriores?
1280	97	Según el preámbulo y el texto del Decreto, además de la Ley Orgánica de Universidades (LOU), ¿qué otra norma de carácter general se menciona como motor de cambio que conduce a la necesidad de reformar los Estatutos?
1281	97	¿Qué órgano y con qué mayoría aprobó inicialmente el texto de los nuevos Estatutos antes de su envío a la Comunidad de Madrid?
1282	97	¿Qué institución tiene la competencia final para aprobar los Estatutos de la Universidad Complutense de Madrid, previo control de legalidad, según el artículo 6.2 de la LOU?
1283	97	¿Cuándo entraron en vigor los nuevos Estatutos de la UCM según la disposición final del Decreto 32/2017?
1284	97	¿Qué ley se cita en el preámbulo que, con menor alcance que la LOU, también introdujo cambios en el sistema universitario, como la Ley 14/2011?
1285	97	Según el artículo 1, la Universidad Complutense de Madrid es una institución de Derecho Público con personalidad jurídica y patrimonio propio. ¿En qué artículo de la Constitución Española se fundamenta principalmente su autonomía?
1286	97	El artículo 2 establece el compromiso de la UCM con la no discriminación y la igualdad. ¿Qué estructura específica debe crear la Universidad para el desarrollo de las funciones relacionadas con la igualdad entre mujeres y hombres?
1287	97	Entre las funciones de la UCM al servicio de la sociedad, el artículo 3 menciona la formación en valores ciudadanos y el impulso de la cultura de la paz. ¿Cuál de los siguientes NO es un fin mencionado explícitamente en ese artículo?
1288	97	El artículo 4 enumera las competencias de la UCM en ejecución de su autonomía. ¿Cuál de las siguientes acciones está incluida explícitamente como competencia de la Universidad?
1289	97	¿Qué artículo de la Constitución Española se cita en el artículo 1 de los Estatutos como fundamento de la autonomía universitaria?
1290	97	Según el Preámbulo, ¿qué norma de 2015 se cita como Texto Refundido que afecta al Personal Docente e Investigador y de Administración y Servicios?
1291	97	La disposición 'Quedan derogados los Estatutos de la Universidad Complutense de Madrid, aprobados por Decreto 58/2003...' es un ejemplo de:
1292	97	El Decreto 32/2017 es una norma aprobada por el Consejo de Gobierno de la Comunidad de Madrid. ¿Qué rango tiene esta norma en el ordenamiento jurídico?
1293	97	Además de la LOU, ¿qué ley orgánica se menciona explícitamente en el texto como la que introdujo las reformas que motivaron la necesidad de adaptar las normas internas de las universidades?
1294	97	La referencia en el artículo 5 a la 'plena integración de sus enseñanzas, títulos y estructuras académicas' se hace en el contexto de:
1295	97	El artículo 6 describe detalladamente el escudo de la UCM. ¿Qué elemento NO forma parte de la descripción oficial del escudo?
1296	97	El artículo 3 establece que la UCM realiza el servicio público de la educación superior. ¿Cuáles son los tres pilares fundamentales a través de los cuales realiza este servicio?
1297	97	El Preámbulo menciona la necesidad de reforma debido a cambios en la 'legislación de contratos del sector público'. ¿A qué tipo de actividades de la Universidad afecta directamente esta legislación?
1298	97	La referencia a la Ley 14/2011 en el Preámbulo y en el artículo 194 sobre el patrimonio, que trata sobre los derechos de propiedad industrial e intelectual, es la Ley de:
1299	98	Según el artículo 34, ¿cuál de los siguientes es considerado un órgano de gobierno unipersonal en la UCM?
1300	98	¿Qué órgano es definido en el artículo 41 como el 'máximo órgano de representación de la comunidad universitaria'?
867	73	¿Qué fue el Coliseo?
882	73	¿Qué fue el Coliseo de Domiciano?
883	73	¿Cuál fue la principal religión de los romanos?
884	73	¿Quién fue el emperador romano que se hizo llamar 'Dios'?
885	73	¿Qué fue la Legión Romana?
886	73	¿Cuál fue la principal fuente de riqueza del Imperio Romano?
887	73	¿Qué fue el Senado Romano?
888	73	¿Cuándo se dividió el Imperio Romano?
889	73	¿Quién fue el emperador romano que conquistó Gran Bretaña?
890	73	¿Qué fue el Panteón de Roma?
891	73	¿Cuál fue la principal fuente de energía del Imperio Romano?
892	73	¿Qué fue el Foro Romano?
893	73	¿Quién fue el emperador romano que construyó el Arco de Triunfo?
894	73	¿Qué fue el Coliseo de Domiciano?
895	73	¿Cuál fue la principal religión de los romanos?
1219	93	¿Cuál es el macronutriente principal que proporciona energía al cuerpo?
1220	93	¿Cuál es el efecto de consumir demasiadas grasas en el cuerpo?
1221	93	¿Cuál es el papel de las proteínas en el cuerpo?
1222	93	¿Cuál es el efecto de consumir demasiados carbohidratos refinados en el cuerpo?
1223	93	¿Cuál es el macronutriente que se encuentra en mayor cantidad en la carne y los productos lácteos?
1224	93	¿Cuál es el efecto de consumir suficientes carbohidratos en el cuerpo?
1225	93	¿Cuál es el macronutriente que se encuentra en mayor cantidad en las frutas y las verduras?
1226	93	¿Cuál es el efecto de consumir suficientes grasas saludables en el cuerpo?
1227	93	¿Cuál es el macronutriente que se encuentra en menor cantidad en la dieta promedio?
1228	93	¿Cuál es el efecto de consumir demasiadas proteínas en el cuerpo?
1301	98	El Rector/a es la máxima autoridad académica de la UCM. ¿Qué órgano colegiado es el principal responsable de asistirle en el gobierno de la Universidad, compuesto por los Vicerrectores/as, el Secretario/a General y el/la Gerente?
1302	98	El Consejo Social es el órgano de participación de la sociedad en la Universidad. ¿Qué función principal NO le corresponde según el artículo 44?
1303	98	¿Qué mayoría se requiere en el Claustro para aprobar una iniciativa de convocatoria extraordinaria de elecciones a Rector/a, que lleva consigo la disolución del Claustro?
142	31	¿En qué año se fundó la Real Federación Española de Fútbol (RFEF)?
143	31	¿Qué club ganó la primera edición de La Liga en 1929?
144	31	¿Cuál fue el primer club español en ganar la Copa de Europa?
145	31	¿Cuántas Copas de Europa consecutivas ganó el Real Madrid entre 1956 y 1960?
146	31	¿En qué año España ganó su primer Mundial de fútbol?
147	31	¿Qué ciudad fue sede de la final del Mundial 1982?
148	31	¿Cómo se conocía a la selección española antes del apodo 'La Roja'?
149	31	¿Qué club español ha ganado más títulos de La Liga?
150	31	¿Quién fue el máximo goleador histórico de la selección española hasta 2023?
151	31	¿Qué club descendió administrativamente a Segunda B en 1995?
1304	98	El artículo 64 define al Rector/a como la máxima autoridad académica. ¿Cuál de las siguientes funciones corresponde explícitamente al Rector/a según este artículo?
1305	98	¿Cómo se elige al Decano/a de una Facultad según el artículo 78?
1306	98	El Secretario/a General actúa como fedatario de los actos y acuerdos de los órganos colegiados. ¿De qué órgano NO forma parte necesariamente como Secretario/a, según el artículo 67?
1307	98	Según el artículo 36, el régimen jurídico de los órganos colegiados se ajustará a las normas de los Estatutos y, supletoriamente, a:
1308	98	En la composición del Claustro Universitario (art. 42), ¿qué porcentaje de representación corresponde a los Profesores Doctores con vinculación permanente?
1309	98	¿Cuál es la función principal de los Vicerrectores/as según el artículo 66?
1310	98	El artículo 76 establece un sistema de voto ponderado para la elección del Rector/a. ¿Qué porcentaje del voto corresponde al sector de Personal de Administración y Servicios?
1311	98	El artículo 80 regula la moción de censura contra órganos unipersonales. ¿Qué requisito fundamental debe cumplir la moción para ser admitida a trámite?
1312	98	El/la Gerente es propuesto por el Rector/a y nombrado de acuerdo con el Consejo Social. Según el artículo 68, ¿qué requisito debe cumplir la persona designada?
1313	98	Según el artículo 40, ¿cuál es la duración del mandato de los representantes de los estudiantes en los órganos colegiados electos?
1314	98	Las Juntas de Centro son los órganos colegiados de gobierno de las Facultades y Escuelas. ¿Cuál de las siguientes NO es una función típica de una Junta de Centro según el artículo 54?
1315	98	El artículo 69 describe las funciones del Secretario/a de Centro. ¿Cuál de las siguientes NO es una función de este fedatario?
1316	98	Para la elección de representantes de Directores/as de Departamento en el Consejo de Gobierno, el artículo 74 establece la creación de cuatro secciones electorales. ¿En cuál de estos ámbitos NO se basa esa división?
1317	98	¿Qué órgano unipersonal es el responsable de la gestión de los servicios administrativos y económicos de la Universidad, incluyendo la elaboración de la propuesta de presupuesto?
1318	98	El artículo 41 enumera las funciones del Claustro. Una de ellas es designar a los siete Catedráticos/as que constituirán la Comisión de Reclamaciones prevista en la LOU. ¿Qué requisito deben cumplir estos catedráticos?
1319	99	Según el artículo 81, el Personal Docente e Investigador (PDI) de la UCM se compone de dos grandes grupos. ¿Cuáles son?
153	31	¿Quién fue el seleccionador de España en el Mundial de 2010?
154	31	¿Qué estadio es conocido como 'La Catedral'?
155	31	¿Qué club ganó la UEFA Europa League en 2006 y 2007?
156	31	¿Cuál fue el primer club español fundado oficialmente?
157	31	¿En qué año se disputó el primer Clásico oficial?
1229	94	¿Cuál es el propósito principal de la crítica literaria?
752	69	¿Puede la Fundación participar en licitaciones públicas convocadas por la UCM, según el artículo 1?
753	69	¿Qué artículo establece que la Fundación es un 'medio propio personificado' de la UCM?
754	69	¿En qué plazo debe la Fundación destinar a sus fines al menos el 70% de sus resultados, según el artículo 8?
729	69	¿A qué régimen jurídico se somete la Fundación, según el artículo 3?
730	69	Según el artículo 4, ¿cómo se puede trasladar el domicilio social de la Fundación?
731	69	¿Cuál es el fin fundamental de la Fundación según el artículo 6?
732	69	De las siguientes actividades listadas en el artículo 6, ¿cuál NO es una de las que puede desarrollar la Fundación?
1230	94	¿Cuál es el objetivo de la crítica literaria en relación con la interpretación de textos?
1231	94	¿Cuál es el papel de la crítica literaria en la sociedad?
1232	94	¿Cuál es el proceso principal de la crítica literaria?
1233	94	¿Cuál es el propósito de la crítica literaria en relación con la formación de la opinión pública?
1234	94	¿Cuál es el papel de la crítica literaria en la educación?
1235	94	¿Cuál es el proceso principal de la crítica literaria en relación con la formación de la opinión pública?
1236	94	¿Cuál es el propósito de la crítica literaria en relación con la formación de la opinión pública?
764	69	¿Cuál de estas NO es una causa de extinción de la Fundación mencionada en el artículo 41?
727	69	Según el artículo 1, ¿cuál es la naturaleza jurídica de la Fundación General de la UCM?
728	69	De acuerdo con el artículo 2, ¿qué capacidad posee la Fundación tras su inscripción en el Registro?
737	69	Según el artículo 14, ¿quiénes son los Patronos Natos?
755	69	¿Qué artículo regula la posible creación de 'Comisiones especiales' dentro del Patronato?
735	69	Según el artículo 10, ¿qué principios rigen la selección de beneficiarios de las actividades de la Fundación?
158	31	¿Qué club ganó la Liga invicto en la temporada 1929-30?
159	31	¿Qué equipo es conocido como 'El Submarino Amarillo'?
160	31	¿Qué jugador español ganó el Balón de Oro en 1960?
161	31	¿Qué selección ganó la Eurocopa 2008?
162	31	¿Qué club ganó la Copa del Rey más veces?
163	31	¿En qué ciudad juega el Valencia CF?
164	31	¿Qué club ganó la Liga 1999-2000?
165	31	¿Qué estadio fue sede principal del Mundial 1982?
166	31	¿Qué club fue conocido como 'SuperDepor'?
167	31	¿Quién marcó el gol de la final del Mundial 2010?
152	31	¿Qué equipo español ganó la Recopa de Europa en 1979?
736	69	¿Cuál es el órgano de gobierno y representación de la Fundación, según el artículo 13?
738	69	¿Qué caracteriza a los Patronos Honoríficos según el artículo 14?
739	69	Según el artículo 15, ¿cómo ejercitan sus facultades los patronos?
740	69	¿Cuál es la duración del mandato de los Patronos Electivos, según el artículo 16?
741	69	De las siguientes causas de cese de un Patrono listadas en el artículo 17, ¿cuál NO es correcta?
742	69	¿Quién es, por defecto, el Presidente del Patronato según el artículo 18?
743	69	Para adoptar un acuerdo de modificación de los Estatutos, el Patronato necesita (Art. 19):
744	69	Para la válida constitución del Patronato en primera convocatoria se requiere (Art. 20):
745	69	Según el artículo 21, ¿quién preside el Consejo Ejecutivo?
746	69	¿Qué funciones tiene delegadas el Consejo Ejecutivo del Patronato, según el artículo 23?
747	69	¿Quién nombra al Director General de la Fundación, según el artículo 27?
748	69	Una de las funciones del Director General es (Art. 28):
749	69	Según el Título V, ¿cuál de estos NO es un componente del patrimonio de la Fundación (Art. 32)?
750	69	¿A qué órgano corresponde la administración y disposición del patrimonio de la Fundación, según el artículo 34?
751	69	¿Con qué periodicidad mínima debe reunirse el Patronato, según el artículo 18?
773	69	Según el artículo 5, ¿dónde desarrolla principalmente la Fundación sus actividades?
320	45	¿Quién fue el primer europeo en llegar a la costa de la India en 1498?
321	45	¿Qué ciudad fue fundada por Juan Sebastián Elcano en 1521 en el archipiélago de las Filipinas?
322	45	¿Quién lideró la Expedición de la Armada de la Flota de la India en 1497?
323	45	¿Qué pasaje natural fue descubierto por Juan Sebastián Elcano en 1521?
324	45	¿Quién fue el primer europeo en llegar a la costa del Golfo de México en 1519?
325	45	¿Qué expedición lideró por Juan Sebastián Elcano en 1520?
326	45	¿Quién fue el primer europeo en llegar a la costa de África en 1485?
327	45	¿Qué ciudad fue fundada por Francisco Hernández de Córdoba en 1517 en la costa de la península de Yucatán?
328	45	¿Quién lideró la Expedición de la Victoria en 1520?
329	45	¿Qué pasaje natural fue descubierto por Vasco Núñez de Balboa en 1513?
330	45	¿Quién fue el primer europeo en llegar a la costa del Pacífico en América del Sur en 1532?
1332	99	¿A quién corresponde la incoación de los expedientes disciplinarios para los funcionarios docentes y del PAS funcionario, según el artículo 152?
1333	99	El artículo 97 establece el régimen de dedicación de los funcionarios docentes. ¿Qué principio fundamental se garantiza en relación con el cambio de dedicación?
1334	99	El artículo 108 regula el procedimiento de selección del PDI contratado. ¿Para qué figuras NO es necesario convocar un concurso público?
1335	99	El artículo 112 define a los 'becarios de investigación' como investigadores en formación. ¿Cuál es la principal diferencia con los 'investigadores contratados' del artículo 111?
1336	99	Según el artículo 101, ¿cuál es el órgano de representación de los funcionarios de los cuerpos docentes universitarios?
1337	99	El artículo 95 contempla diversas situaciones administrativas para el PDI funcionario. ¿Qué derecho conlleva la 'excedencia temporal para incorporarse a una empresa de base tecnológica'?
1338	99	El artículo 105 especifica los tiempos de trabajo del PDI contratado. ¿Cuál de estas figuras tiene siempre una dedicación a tiempo completo?
1339	100	El artículo 11 establece que la UCM estará integrada por varios tipos de centros. ¿Cuál de los siguientes se menciona como un centro encargado fundamentalmente de la organización del doctorado?
1340	100	Según el artículo 14, los Departamentos son las unidades de docencia e investigación. ¿Cuál es su función principal?
1341	100	¿Qué tipo de Institutos Universitarios de Investigación pueden tener personalidad jurídica propia, según el artículo 16?
1342	100	El artículo 12 define a las Facultades y Escuelas. ¿Qué personal NO se menciona explícitamente como agrupado en estos centros?
1343	100	La creación, modificación y supresión de Facultades y Escuelas es acordada por la Comunidad de Madrid. ¿Qué informe preceptivo (obligatorio) se requiere de las Juntas de Facultad afectadas?
1344	100	Los Institutos Universitarios de Investigación Mixtos, según el artículo 20, se caracterizan por:
1345	100	El artículo 24 regula los Centros de Enseñanza Universitaria Adscritos a la UCM. ¿Qué es la 'venia docendi' que deben obtener obligatoriamente sus profesores?
1346	100	¿Qué centro tiene por objeto 'el desarrollo de las funciones docentes e investigadoras propias de los Departamentos, Facultades y Escuelas vinculadas al mundo de la sanidad'?
1347	100	Según el artículo 25, las Escuelas de Especialización Profesional imparten enseñanzas para:
1348	100	El artículo 33 establece que el Claustro debe aprobar un Reglamento de Centros y Estructuras. ¿Qué aspecto NO debe regular este reglamento para cada tipo de centro?
1349	100	Un Departamento, según el artículo 14, tiene su sede administrativa en una Facultad o Escuela asignada por el Consejo de Gobierno. ¿Cuál de los siguientes NO es un criterio prioritario para esta asignación?
1350	100	Los Colegios Mayores, definidos en el artículo 26, son centros universitarios que proporcionan residencia. ¿Quién nombra a sus Directores/as?
1351	100	El artículo 21 regula los Institutos Universitarios de Investigación Adscritos. ¿A quién corresponde la aprobación de la adscripción o pérdida de la misma?
1352	100	Según el artículo 22, la propuesta de creación de un Instituto Universitario de Investigación debe adjuntar un Reglamento de Régimen Interno. ¿Qué NO es obligatorio que regule este documento?
1353	100	El artículo 15 indica que la creación, modificación y supresión de Departamentos corresponde al Consejo de Gobierno. ¿Quién NO tiene capacidad para realizar una propuesta en este sentido?
1354	100	Los Centros en el extranjero, regulados en el artículo 31, tienen un régimen singular. ¿Qué institución debe acordar su creación y supresión?
1355	100	El artículo 23 establece que el personal de los Departamentos puede adscribirse a Institutos Universitarios de Investigación. ¿Qué requisito se debe cumplir para esta adscripción?
1356	100	¿Qué tipo de centro, definido en el artículo 27, proporciona alojamiento y puede cooperar con los restantes centros, pero sin el énfasis en la formación cultural y científica que caracteriza a los Colegios Mayores?
1357	100	El artículo 29 menciona al Hospital Clínico Veterinario. ¿Qué tipo de labores desarrolla principalmente?
1358	100	Los Institutos Interuniversitarios de Investigación, según el artículo 19, se crean mediante:
1359	101	El artículo 115 enumera un amplio catálogo de derechos de los estudiantes. ¿Cuál de los siguientes NO es un derecho explícitamente mencionado?
1360	101	El artículo 116 establece los deberes de los estudiantes. ¿Qué deber se relaciona directamente con la integridad académica?
1361	101	El Defensor/a Universitario, según el artículo 149, es el órgano encargado de velar por los derechos y libertades. ¿Cuál es un principio fundamental que rige sus actuaciones?
1362	101	Según el artículo 150, ¿por quién es elegido el Defensor/a Universitario y por cuánto tiempo?
1363	101	El artículo 154 se remite al Reglamento de Disciplina Académica para los estudiantes. ¿En qué marco legal debe concretarse este régimen disciplinario?
1364	101	El artículo 151 establece que el Defensor/a Universitario actúa de oficio o a instancia de parte. ¿En qué caso debe rechazar una solicitud o queja?
1365	101	El Capítulo III del Título X (art. 179 y ss.) habla de la ética en la investigación. ¿Cuál de los siguientes NO es un principio mencionado que debe regir las tareas del PDI?
1366	101	¿Qué comité, regulado en el artículo 180, se encarga de emitir informes sobre cuestiones que puedan afectar a los principios éticos y deontológicos, incluyendo derechos fundamentales y propiedad intelectual?
1367	101	El artículo 155 crea el Servicio de Inspección. ¿Cuál es una de sus funciones principales?
1368	101	El artículo 150 establece que la condición de Defensor/a Universitario es incompatible con:
1369	101	Los artículos 179 a 182 crean diversos comités. ¿Cuál de ellos se ocupa específicamente de cuestiones que implican un riesgo para la salud de personas, animales o el medio ambiente?
1370	101	Según el artículo 154, ¿dónde se concretará el régimen de disciplina académica para los estudiantes?
1371	101	El artículo 115 reconoce el derecho de los estudiantes 'a que se establezca un procedimiento para recoger las reclamaciones, sugerencias y peticiones'. ¿Cómo se denomina este derecho en el contexto de las relaciones con la administración?
1372	101	El artículo 182 crea el Comité de Experimentación Animal. ¿Qué autoridad académica lo preside?
1373	101	Según el artículo 151, los miembros de la comunidad universitaria están obligados a proporcionar datos e informaciones al Defensor/a Universitario. ¿Qué ocurre si no lo hacen?
1374	101	El artículo 180 indica que el Comité de Ética y Deontología estará formado por cinco miembros designados por el Rector/a. ¿Qué requisito deben cumplir estos miembros?
1375	101	Uno de los derechos de los estudiantes en el artículo 115 es 'a tener acceso a un procedimiento formal de mediación en los conflictos'. ¿Qué busca fomentar este tipo de procedimiento?
1376	101	El artículo 152 establece que, en materia disciplinaria, los funcionarios se rigen por las normas generales de la función pública. ¿Qué excepción se menciona en cuanto a la potestad sancionadora del Rector/a?
1377	101	El artículo 150 establece el procedimiento para la elección del Defensor/a Universitario. ¿Qué mayoría se requiere para ser elegido en primera vuelta?
1378	101	¿Qué deber de los estudiantes, según el artículo 116, implica una participación activa en la vida universitaria más allá de lo meramente académico?
\.


--
-- Data for Name: results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.results (id, user_id, test_id, correct_answers, wrong_answers, time_taken, total_questions, answered_questions, status, answers, updated_at, started_at) FROM stdin;
1063	59	40	8	2	490	0	0	completed	{"262":844,"263":847,"264":850,"265":853,"266":856,"267":860,"268":863,"269":866,"270":868,"271":870}	2026-01-07 20:57:07+01	2026-01-07 20:48:57+01
1073	59	33	8	2	550	0	0	completed	{"182":603,"183":606,"184":609,"185":612,"186":615,"187":618,"188":621,"189":624,"190":629,"191":631}	2026-02-11 17:09:57+01	2026-02-11 17:00:47+01
1173	89	101	9	2	170	0	0	in_progress	{"1359":4672,"1360":4675,"1361":4679,"1362":4684,"1363":4688,"1364":4692,"1365":4695,"1366":4700,"1367":4704,"1368":4707,"1369":4713}	2026-02-23 17:26:59.840125+01	2026-02-23 17:24:09.840125+01
1190	89	65	22	3	1025	0	0	completed	{"648":2163,"649":2166,"650":2170,"651":2171,"652":2176,"653":2177,"654":2180,"655":2183,"656":2188,"657":2189,"658":2192,"659":2197,"660":2198,"661":2202,"662":2204,"663":2208,"664":2210,"665":2214,"666":2216,"667":2220,"668":2223,"669":2225,"670":2229,"671":2233,"672":2236}	2026-02-07 09:46:34+01	2026-02-07 09:29:29+01
1197	93	91	15	5	1020	0	0	completed	{"1179":4050,"1180":4053,"1181":4056,"1182":4059,"1183":4062,"1184":4065,"1185":4068,"1186":4071,"1187":4074,"1188":4077,"1189":4080,"1190":4083,"1191":4086,"1192":4089,"1193":4092,"1194":4097,"1195":4100,"1196":4103,"1197":4105,"1198":4108}	2026-02-05 02:39:27+01	2026-02-05 02:22:27+01
1053	5	91	0	0	203	0	0	in_progress	{"1179":4050,"1180":4053,"1181":4056,"1182":4059,"1183":4062,"1184":4065,"1185":4068,"1186":4071,"1187":4074,"1188":4077,"1189":4081,"1190":4084,"1191":4086,"1192":4091,"1193":4094,"1194":4097}	2026-02-13 18:24:28.722561+01	2026-02-04 01:15:13.668933+01
914	1	38	7	3	430	0	0	completed	{"232":753,"233":756,"234":759,"235":762,"236":766,"237":768,"238":771,"239":775,"240":779,"241":780}	2026-02-23 17:32:02.802709+01	2025-11-21 14:23:42+01
1060	1	91	0	0	22	0	0	in_progress	{"1179":4051,"1180":4053,"1181":4056,"1182":4059,"1183":4063}	2026-02-23 17:32:40.879151+01	2026-02-18 22:51:34.774893+01
1064	59	98	0	1	12	0	0	abandoned	{"1299":4430}	2026-02-23 18:18:13.800058+01	2026-02-23 18:18:01.800058+01
1079	59	101	16	4	940	0	0	completed	{"1359":4672,"1360":4675,"1361":4679,"1362":4684,"1363":4688,"1364":4692,"1365":4695,"1366":4700,"1367":4704,"1368":4708,"1369":4712,"1370":4715,"1371":4720,"1372":4723,"1373":4727,"1374":4731,"1375":4734,"1376":4738,"1377":4744,"1378":4746}	2026-02-23 17:39:49.840125+01	2026-02-23 17:24:09.840125+01
1043	1	40	4	6	17	0	0	completed	{"262":843,"263":847,"264":850,"265":853,"266":855,"267":860,"268":861,"269":864,"270":867,"271":871}	2026-02-11 17:54:26.88583+01	2026-01-25 09:26:22.66443+01
1180	89	97	17	3	1100	0	0	completed	{"1279":4352,"1280":4356,"1281":4360,"1282":4363,"1283":4369,"1284":4372,"1285":4374,"1286":4380,"1287":4384,"1288":4388,"1289":4391,"1290":4396,"1291":4400,"1292":4404,"1293":4407,"1294":4411,"1295":4416,"1296":4418,"1297":4423,"1298":4427}	2026-02-23 17:35:45.740036+01	2026-02-23 17:17:25.740036+01
1184	89	35	8	2	330	0	0	completed	{"202":664,"203":666,"204":669,"205":672,"206":677,"207":679,"208":681,"209":684,"210":688,"211":691}	2025-11-19 21:15:25+01	2025-11-19 21:09:55+01
1195	93	44	8	2	350	0	0	completed	{"302":964,"303":968,"304":970,"305":974,"306":976,"307":978,"308":982,"309":984,"310":989,"311":992}	2026-02-18 00:36:37+01	2026-02-18 00:30:47+01
915	1	78	16	4	860	0	0	completed	{"1044":3551,"1045":3554,"1046":3559,"1047":3562,"1048":3567,"1049":3571,"1050":3575,"1051":3579,"1052":3583,"1053":3586,"1054":3589,"1055":3594,"1056":3599,"1057":3603,"1058":3607,"1059":3611,"1060":3614,"1061":3620,"1062":3624,"1063":3627}	2026-02-23 17:32:02.802709+01	2025-12-18 16:20:29+01
928	1	61	17	3	980	0	0	completed	{"625":2071,"626":2076,"627":2081,"628":2084,"629":2089,"630":2091,"631":2096,"632":2099,"633":2104,"634":2107,"635":2111,"636":2115,"637":2119,"638":2123,"639":2127,"640":2131,"641":2135,"642":2142,"643":2144,"644":2149}	2026-02-23 17:32:02.802709+01	2025-10-27 20:10:59+01
1054	5	93	10	0	142	0	0	completed	{"1219":4172,"1220":4175,"1221":4178,"1222":4181,"1223":4184,"1224":4187,"1225":4190,"1226":4193,"1227":4196,"1228":4199}	2026-02-07 20:08:40.994763+01	2026-02-07 20:06:31.363616+01
933	1	48	6	4	400	0	0	completed	{"352":1113,"353":1118,"354":1121,"355":1124,"356":1127,"357":1129,"358":1131,"359":1135,"360":1137,"361":1140}	2026-02-23 18:05:50.240998+01	2026-01-22 21:43:22+01
1065	59	49	9	1	520	0	0	completed	{"362":1144,"363":1147,"364":1150,"365":1153,"366":1155,"367":1159,"368":1162,"369":1165,"370":1168,"371":1170}	2026-02-12 13:49:45+01	2026-02-12 13:41:05+01
1074	59	44	4	1	170	0	0	in_progress	{"302":964,"303":968,"304":970,"305":974,"306":975}	2026-01-30 15:16:52+01	2026-01-30 15:14:02+01
1078	59	36	8	2	410	0	0	completed	{"212":694,"213":697,"214":700,"215":702,"216":707,"217":710,"218":712,"219":715,"220":718,"221":721}	2026-01-31 05:50:56+01	2026-01-31 05:44:06+01
1084	59	37	7	3	540	0	0	completed	{"222":724,"223":726,"224":731,"225":734,"226":737,"227":738,"228":743,"229":744,"230":748,"231":751}	2026-02-19 00:18:54+01	2026-02-19 00:09:54+01
1055	1	95	6	14	30	0	0	completed	{"1249":4262,"1250":4265,"1251":4266,"1252":4270,"1253":4272,"1254":4277,"1255":4280,"1256":4283,"1257":4284,"1258":4288,"1259":4292,"1260":4293,"1261":4297,"1262":4300,"1263":4302,"1264":4307,"1265":4309,"1266":4313,"1267":4315,"1268":4319}	2026-02-11 23:08:06.82175+01	2026-02-10 21:49:43.100292+01
1061	85	93	0	0	255	0	0	in_progress	{"1219":4171}	2026-02-20 09:49:38.851303+01	2026-02-20 09:49:38.851303+01
949	1	65	21	4	1300	0	0	completed	{"648":2163,"649":2166,"650":2170,"651":2171,"652":2176,"653":2177,"654":2180,"655":2183,"656":2188,"657":2189,"658":2192,"659":2197,"660":2198,"661":2202,"662":2204,"663":2208,"664":2210,"665":2214,"666":2216,"667":2220,"668":2223,"669":2227,"670":2230,"671":2231,"672":2236}	2026-02-23 17:32:23.188686+01	2025-09-28 23:19:42+02
916	1	35	7	3	460	0	0	completed	{"202":664,"203":666,"204":669,"205":672,"206":677,"207":679,"208":681,"209":685,"210":689,"211":692}	2026-02-23 17:32:26.749989+01	2025-12-01 18:56:35+01
926	1	58	48	5	2226	0	0	completed	{"522":1683,"523":1689,"524":1691,"525":1696,"526":1699,"527":1704,"528":1707,"529":1712,"530":1717,"531":1720,"532":1724,"533":1729,"534":1733,"535":1735,"536":1741,"537":1747,"538":1749,"539":1752,"540":1757,"541":1762,"542":1765,"543":1769,"544":1774,"545":1776,"546":1781,"547":1785,"548":1790,"549":1792,"550":1799,"551":1801,"552":1805,"553":1810,"554":1812,"555":1816,"556":1820,"557":1826,"558":1830,"559":1832,"560":1837,"561":1840,"562":1846,"563":1849,"564":1852,"565":1856,"566":1860,"567":1864,"568":1869,"569":1872,"570":1876,"571":1882,"572":1884,"573":1889,"574":1893}	2026-02-23 17:32:26.749989+01	2025-05-19 07:31:22+02
1092	59	77	24	6	930	0	0	completed	{"1014":3430,"1015":3435,"1016":3438,"1017":3442,"1018":3445,"1019":3449,"1020":3454,"1021":3457,"1022":3463,"1023":3465,"1024":3471,"1025":3474,"1026":3477,"1027":3482,"1028":3487,"1029":3490,"1030":3494,"1031":3498,"1032":3502,"1033":3507,"1034":3511,"1035":3514,"1036":3518,"1037":3524,"1038":3525,"1039":3531,"1040":3535,"1041":3537,"1042":3542,"1043":3548}	2026-01-19 17:29:00+01	2026-01-19 17:13:30+01
1095	88	47	8	2	340	0	0	completed	{"342":1085,"343":1087,"344":1090,"345":1093,"346":1097,"347":1099,"348":1103,"349":1105,"350":1108,"351":1112}	2025-09-17 22:57:00+02	2025-09-17 22:51:20+02
1101	88	59	9	3	252	0	0	in_progress	{"577":1904,"578":1908,"579":1913,"580":1916,"581":1920,"582":1925,"583":1928,"584":1933,"585":1936,"586":1940,"587":1947,"588":1950}	2025-12-16 08:04:47+01	2025-12-16 08:00:35+01
1103	88	55	16	4	640	0	0	completed	{"462":1446,"463":1447,"464":1454,"465":1455,"466":1462,"467":1464,"468":1467,"469":1471,"470":1475,"471":1482,"472":1483,"473":1488,"474":1494,"475":1495,"476":1499,"477":1503,"478":1509,"479":1511,"480":1518,"481":1520}	2026-02-17 04:24:59+01	2026-02-17 04:14:19+01
1108	88	98	18	2	960	0	0	completed	{"1299":4433,"1300":4435,"1301":4439,"1302":4444,"1303":4448,"1304":4452,"1305":4456,"1306":4460,"1307":4464,"1308":4468,"1309":4471,"1310":4475,"1311":4479,"1312":4483,"1313":4486,"1314":4491,"1315":4496,"1316":4501,"1317":4503,"1318":4507}	2026-02-23 17:34:50.866837+01	2026-02-23 17:18:50.866837+01
1181	89	42	8	2	440	0	0	completed	{"282":904,"283":906,"284":910,"285":912,"286":915,"287":919,"288":922,"289":924,"290":928,"291":932}	2025-09-20 10:28:12+02	2025-09-20 10:20:52+02
1066	59	38	6	1	90	0	0	in_progress	{"232":753,"233":756,"234":759,"235":762,"236":766,"237":768,"238":772}	2026-02-13 02:11:05+01	2026-02-13 02:09:35+01
1072	59	43	5	1	105	0	0	in_progress	{"292":934,"293":937,"294":939,"295":943,"296":946,"297":948}	2026-01-27 17:02:20+01	2026-01-27 17:00:35+01
1076	59	96	8	2	570	0	0	completed	{"1269":4322,"1270":4325,"1271":4326,"1272":4331,"1273":4332,"1274":4336,"1275":4340,"1276":4343,"1277":4346,"1278":4348}	2026-02-21 06:23:03+01	2026-02-21 06:13:33+01
1081	59	55	17	3	960	0	0	completed	{"462":1446,"463":1447,"464":1454,"465":1455,"466":1462,"467":1464,"468":1467,"469":1471,"470":1475,"471":1482,"472":1483,"473":1488,"474":1494,"475":1495,"476":1499,"477":1503,"478":1508,"479":1513,"480":1517,"481":1521}	2026-02-05 21:54:52+01	2026-02-05 21:38:52+01
1091	87	90	22	3	1100	0	0	completed	{"1154":3952,"1155":3954,"1156":3959,"1157":3962,"1158":3966,"1159":3972,"1160":3977,"1161":3979,"1162":3984,"1163":3987,"1164":3992,"1165":3995,"1166":3999,"1167":4002,"1168":4007,"1169":4011,"1170":4015,"1171":4020,"1172":4022,"1173":4026,"1174":4032,"1175":4035,"1176":4040,"1177":4045,"1178":4047}	2026-02-05 05:27:57+01	2026-02-05 05:09:37+01
1099	88	78	16	4	840	0	0	completed	{"1044":3551,"1045":3554,"1046":3559,"1047":3562,"1048":3567,"1049":3571,"1050":3575,"1051":3579,"1052":3583,"1053":3586,"1054":3589,"1055":3594,"1056":3599,"1057":3603,"1058":3607,"1059":3611,"1060":3613,"1061":3620,"1062":3622,"1063":3625}	2025-10-24 08:09:13+02	2025-10-24 07:55:13+02
1105	87	73	36	4	1200	0	0	completed	{"864":2980,"865":2982,"866":2986,"867":2989,"868":2992,"869":2995,"870":2998,"871":3001,"872":3003,"873":3006,"874":3010,"875":3012,"876":3017,"877":3020,"878":3021,"879":3026,"880":3029,"881":3032,"882":3034,"883":3037,"884":3039,"885":3042,"886":3046,"887":3048,"888":3053,"889":3056,"890":3057,"891":3062,"892":3064,"893":3067,"894":3069,"895":3074,"896":3075,"897":3078,"898":3082,"899":3084,"900":3089,"901":3092,"902":3093,"903":3098}	2026-02-21 09:48:55+01	2026-02-21 09:28:55+01
1045	1	36	5	5	329	0	0	completed	{"212":693,"213":696,"214":700,"215":703,"216":707,"217":710,"218":712,"219":714,"220":718,"221":722}	2026-02-11 17:54:26.88583+01	2026-01-25 14:00:14.912597+01
1057	1	96	9	1	100	0	0	completed	{"1269":4322,"1270":4325,"1271":4326,"1272":4331,"1273":4332,"1274":4336,"1275":4340,"1276":4341,"1277":4344,"1278":4349}	2026-02-11 17:54:26.88583+01	2026-02-11 13:29:49.016014+01
1185	89	49	8	2	480	0	0	completed	{"362":1144,"363":1147,"364":1150,"365":1153,"366":1155,"367":1159,"368":1162,"369":1165,"370":1169,"371":1171}	2025-10-20 18:58:55+02	2025-10-20 18:50:55+02
1189	93	45	2	1	12	0	0	abandoned	{"312":995,"313":997,"331":1051}	2026-02-13 15:58:33+01	2026-02-13 15:58:21+01
1062	86	94	0	0	2848	0	0	in_progress	{"1229":4201,"1230":4204}	2026-02-20 16:03:23.868455+01	2026-02-20 15:46:16.27084+01
917	1	33	8	2	420	0	0	completed	{"182":603,"183":606,"184":609,"185":612,"186":615,"187":618,"188":621,"189":624,"190":629,"191":631}	2026-02-23 17:32:02.802709+01	2025-11-14 19:04:59+01
921	1	39	14	6	620	0	0	completed	{"242":783,"243":787,"244":789,"245":792,"246":797,"247":798,"248":801,"249":804,"250":807,"251":810,"252":813,"253":818,"254":819,"255":822,"256":827,"257":829,"258":833,"259":835,"260":838,"261":842}	2026-02-23 17:32:02.802709+01	2025-10-17 09:05:07+02
1198	93	43	8	2	380	0	0	completed	{"292":934,"293":937,"294":939,"295":943,"296":946,"297":949,"298":952,"299":955,"300":959,"301":962}	2026-02-06 04:24:32+01	2026-02-06 04:18:12+01
925	1	73	26	8	340	0	0	in_progress	{"864":2980,"865":2982,"866":2986,"867":2989,"868":2992,"869":2995,"870":2998,"871":3001,"872":3003,"873":3006,"874":3010,"875":3012,"876":3017,"877":3020,"878":3021,"879":3026,"880":3029,"881":3032,"882":3033,"883":3036,"884":3041,"885":3043,"886":3045,"887":3049,"888":3052,"889":3055,"896":3075,"897":3078,"898":3082,"899":3084,"900":3089,"901":3092,"902":3093,"903":3098}	2026-02-23 17:32:02.802709+01	2026-01-20 16:05:11+01
1203	93	40	9	1	380	0	0	completed	{"262":844,"263":847,"264":850,"265":853,"266":856,"267":860,"268":863,"269":866,"270":869,"271":870}	2026-02-08 00:36:23+01	2026-02-08 00:30:03+01
1215	94	101	11	2	200	0	0	in_progress	{"1359":4672,"1360":4675,"1361":4679,"1362":4684,"1363":4688,"1364":4692,"1365":4695,"1366":4700,"1367":4704,"1368":4708,"1369":4712,"1370":4714,"1371":4718}	2026-02-23 17:27:29.840125+01	2026-02-23 17:24:09.840125+01
1067	59	71	17	3	1180	0	0	completed	{"824":2840,"825":2844,"826":2849,"827":2854,"828":2856,"829":2860,"830":2865,"831":2868,"832":2873,"833":2878,"834":2880,"835":2884,"836":2889,"837":2893,"838":2896,"839":2901,"840":2904,"841":2907,"842":2914,"843":2917}	2026-01-24 00:22:30+01	2026-01-24 00:02:50+01
1075	59	73	4	2	15	0	0	abandoned	{"896":3075,"897":3078,"898":3082,"899":3084,"900":3088,"901":3091}	2026-02-21 20:27:01+01	2026-02-21 20:26:46+01
1191	93	78	18	2	960	0	0	completed	{"1044":3551,"1045":3554,"1046":3559,"1047":3562,"1048":3567,"1049":3571,"1050":3575,"1051":3579,"1052":3583,"1053":3586,"1054":3589,"1055":3594,"1056":3599,"1057":3603,"1058":3607,"1059":3611,"1060":3615,"1061":3619,"1062":3622,"1063":3627}	2026-02-10 12:49:05+01	2026-02-10 12:33:05+01
1046	59	35	7	3	549	0	0	completed	{"202":664,"203":666,"204":671,"205":672,"206":676,"207":679,"208":682,"209":684,"210":687,"211":690}	2026-02-19 22:24:50.586839+01	2026-01-26 00:00:19.299898+01
919	1	65	19	6	1075	0	0	completed	{"648":2163,"649":2166,"650":2170,"651":2171,"652":2176,"653":2177,"654":2180,"655":2183,"656":2188,"657":2189,"658":2192,"659":2197,"660":2198,"661":2202,"662":2204,"663":2208,"664":2210,"665":2214,"666":2218,"667":2219,"668":2223,"669":2226,"670":2230,"671":2231,"672":2236}	2026-02-23 17:32:02.802709+01	2025-12-11 04:33:35+01
74	5	40	8	2	235	0	0	completed	{"262":844,"263":847,"264":850,"265":853,"266":855,"267":860,"268":863,"269":866,"270":869,"271":871}	2025-12-21 15:01:41.634905+01	2025-12-21 14:58:20.085456+01
932	1	47	2	2	115	0	0	in_progress	{"342":1085,"343":1087,"344":1089,"345":1094}	2026-02-23 18:05:50.240998+01	2026-01-22 04:18:52+01
935	1	59	15	10	975	0	0	completed	{"575":1898,"576":1901,"577":1904,"578":1908,"579":1913,"580":1916,"581":1920,"582":1925,"583":1928,"584":1933,"585":1936,"586":1941,"587":1945,"588":1949,"589":1952,"590":1957,"591":1961,"592":1967,"593":1970,"594":1975,"595":1977,"596":1983,"597":1985,"598":1990,"599":1994}	2026-02-23 18:05:50.240998+01	2026-01-20 17:14:12+01
1068	59	97	15	5	800	0	0	completed	{"1279":4352,"1280":4356,"1281":4360,"1282":4363,"1283":4369,"1284":4372,"1285":4374,"1286":4380,"1287":4384,"1288":4388,"1289":4391,"1290":4396,"1291":4400,"1292":4404,"1293":4407,"1294":4410,"1295":4417,"1296":4420,"1297":4425,"1298":4429}	2026-02-23 17:30:45.740036+01	2026-02-23 17:17:25.740036+01
1193	89	94	18	2	780	0	0	completed	{"1229":4201,"1230":4205,"1231":4207,"1232":4210,"1233":4212,"1234":4216,"1235":4218,"1236":4221,"1237":4225,"1238":4229,"1239":4232,"1240":4235,"1241":4238,"1242":4241,"1243":4244,"1244":4247,"1245":4250,"1246":4253,"1247":4256,"1248":4259}	2026-02-22 21:25:13+01	2026-02-22 21:12:13+01
1047	1	35	0	0	10	0	0	in_progress	{"202":664,"203":666,"204":671}	2026-02-23 17:26:16.506464+01	2026-01-27 19:45:16.701968+01
920	1	48	7	3	500	0	0	completed	{"352":1113,"353":1118,"354":1121,"355":1124,"356":1127,"357":1129,"358":1133,"359":1135,"360":1137,"361":1140}	2026-02-23 17:32:02.802709+01	2025-12-27 23:04:05+01
1202	93	39	15	5	960	0	0	completed	{"242":783,"243":787,"244":789,"245":792,"246":797,"247":798,"248":801,"249":804,"250":807,"251":810,"252":813,"253":818,"254":819,"255":822,"256":825,"257":829,"258":832,"259":835,"260":839,"261":841}	2026-02-17 21:40:16+01	2026-02-17 21:24:16+01
927	1	34	6	4	520	0	0	completed	{"192":635,"193":638,"194":641,"195":643,"196":647,"197":649,"198":653,"199":656,"200":659,"201":660}	2026-02-23 17:32:02.802709+01	2025-11-01 20:03:05+01
937	1	45	18	2	780	0	0	completed	{"312":995,"313":998,"314":1001,"315":1003,"316":1005,"317":1010,"318":1013,"319":1016,"320":1019,"321":1021,"322":1025,"323":1028,"324":1029,"325":1034,"326":1037,"327":1038,"328":1041,"329":1046,"330":1048,"331":1051}	2026-02-23 17:32:23.188686+01	2025-12-14 13:08:59+01
941	1	49	8	2	480	0	0	completed	{"362":1144,"363":1147,"364":1150,"365":1153,"366":1155,"367":1159,"368":1162,"369":1165,"370":1167,"371":1170}	2026-02-23 17:32:23.188686+01	2025-08-30 10:43:08+02
1069	59	39	16	4	960	0	0	completed	{"242":783,"243":787,"244":789,"245":792,"246":797,"247":798,"248":801,"249":804,"250":807,"251":810,"252":813,"253":818,"254":819,"255":822,"256":825,"257":828,"258":832,"259":835,"260":838,"261":841}	2026-02-06 19:09:10+01	2026-02-06 18:53:10+01
1200	89	77	24	6	1770	0	0	completed	{"1014":3430,"1015":3435,"1016":3438,"1017":3442,"1018":3445,"1019":3449,"1020":3454,"1021":3457,"1022":3463,"1023":3465,"1024":3471,"1025":3474,"1026":3477,"1027":3482,"1028":3487,"1029":3490,"1030":3494,"1031":3498,"1032":3502,"1033":3507,"1034":3511,"1035":3514,"1036":3518,"1037":3524,"1038":3525,"1039":3531,"1040":3536,"1041":3540,"1042":3543,"1043":3546}	2025-12-07 04:24:27+01	2025-12-07 03:54:57+01
923	1	49	6	4	410	0	0	completed	{"362":1144,"363":1147,"364":1150,"365":1153,"366":1155,"367":1159,"368":1163,"369":1164,"370":1167,"371":1170}	2026-02-23 17:32:02.802709+01	2025-10-18 00:03:40+02
929	1	37	6	4	320	0	0	completed	{"222":724,"223":726,"224":731,"225":734,"226":737,"227":738,"228":741,"229":745,"230":749,"231":751}	2026-02-23 17:32:02.802709+01	2025-11-19 14:54:33+01
1206	93	93	8	2	320	0	0	completed	{"1219":4172,"1220":4175,"1221":4178,"1222":4181,"1223":4184,"1224":4187,"1225":4190,"1226":4193,"1227":4194,"1228":4197}	2026-02-19 04:00:23+01	2026-02-19 03:55:03+01
1212	93	59	21	4	1000	0	0	completed	{"575":1899,"576":1901,"577":1904,"578":1908,"579":1913,"580":1916,"581":1920,"582":1925,"583":1928,"584":1933,"585":1936,"586":1941,"587":1945,"588":1949,"589":1952,"590":1957,"591":1961,"592":1964,"593":1968,"594":1972,"595":1976,"596":1981,"597":1987,"598":1991,"599":1993}	2026-02-11 17:54:01+01	2026-02-11 17:37:21+01
1218	93	101	17	3	900	0	0	completed	{"1359":4672,"1360":4675,"1361":4679,"1362":4684,"1363":4688,"1364":4692,"1365":4695,"1366":4700,"1367":4704,"1368":4708,"1369":4712,"1370":4715,"1371":4720,"1372":4723,"1373":4727,"1374":4731,"1375":4735,"1376":4738,"1377":4745,"1378":4746}	2026-02-23 17:39:09.840125+01	2026-02-23 17:24:09.840125+01
1232	95	93	9	1	450	0	0	completed	{"1219":4172,"1220":4175,"1221":4178,"1222":4181,"1223":4184,"1224":4187,"1225":4190,"1226":4193,"1227":4196,"1228":4197}	2026-02-12 15:39:11+01	2026-02-12 15:31:41+01
1238	95	78	16	4	1100	0	0	completed	{"1044":3551,"1045":3554,"1046":3559,"1047":3562,"1048":3567,"1049":3571,"1050":3575,"1051":3579,"1052":3583,"1053":3586,"1054":3589,"1055":3594,"1056":3599,"1057":3603,"1058":3607,"1059":3611,"1060":3616,"1061":3620,"1062":3622,"1063":3626}	2025-12-11 06:50:35+01	2025-12-11 06:32:15+01
1070	59	45	5	2	200	0	0	in_progress	{"312":995,"313":998,"314":1001,"315":1003,"316":1006,"317":1008,"331":1051}	2026-02-18 19:17:05+01	2026-02-18 19:13:45+01
1082	59	42	7	3	590	0	0	completed	{"282":904,"283":906,"284":910,"285":912,"286":915,"287":919,"288":922,"289":925,"290":929,"291":932}	2026-01-30 11:58:21+01	2026-01-30 11:48:31+01
1201	93	73	37	3	1360	0	0	completed	{"864":2980,"865":2982,"866":2986,"867":2989,"868":2992,"869":2995,"870":2998,"871":3001,"872":3003,"873":3006,"874":3010,"875":3012,"876":3017,"877":3020,"878":3021,"879":3026,"880":3029,"881":3032,"882":3034,"883":3037,"884":3039,"885":3042,"886":3046,"887":3048,"888":3053,"889":3056,"890":3057,"891":3062,"892":3065,"893":3066,"894":3071,"895":3072,"896":3075,"897":3078,"898":3082,"899":3084,"900":3089,"901":3092,"902":3093,"903":3098}	2026-02-16 06:50:17+01	2026-02-16 06:27:37+01
1210	93	37	7	3	360	0	0	completed	{"222":724,"223":726,"224":731,"225":734,"226":737,"227":738,"228":743,"229":744,"230":749,"231":750}	2026-02-04 23:37:44+01	2026-02-04 23:31:44+01
1213	93	77	23	7	1110	0	0	completed	{"1014":3430,"1015":3435,"1016":3438,"1017":3442,"1018":3445,"1019":3449,"1020":3454,"1021":3457,"1022":3463,"1023":3465,"1024":3471,"1025":3474,"1026":3477,"1027":3482,"1028":3487,"1029":3490,"1030":3494,"1031":3498,"1032":3502,"1033":3507,"1034":3511,"1035":3514,"1036":3518,"1037":3521,"1038":3525,"1039":3531,"1040":3533,"1041":3540,"1042":3541,"1043":3546}	2026-02-10 19:34:12+01	2026-02-10 19:15:42+01
924	1	77	18	12	1740	0	0	completed	{"1014":3430,"1015":3435,"1016":3438,"1017":3442,"1018":3445,"1019":3449,"1020":3454,"1021":3457,"1022":3463,"1023":3465,"1024":3471,"1025":3474,"1026":3477,"1027":3482,"1028":3487,"1029":3490,"1030":3494,"1031":3498,"1032":3504,"1033":3508,"1034":3512,"1035":3513,"1036":3519,"1037":3523,"1038":3526,"1039":3532,"1040":3535,"1041":3540,"1042":3543,"1043":3548}	2026-02-23 17:32:02.802709+01	2026-01-15 10:13:59+01
930	1	45	18	2	760	0	0	completed	{"312":995,"313":998,"314":1001,"315":1003,"316":1005,"317":1010,"318":1013,"319":1016,"320":1019,"321":1021,"322":1025,"323":1028,"324":1029,"325":1034,"326":1037,"327":1038,"328":1041,"329":1044,"330":1048,"331":1051}	2026-02-23 17:32:02.802709+01	2025-12-13 21:22:40+01
1225	94	44	8	2	350	0	0	completed	{"302":964,"303":968,"304":970,"305":974,"306":976,"307":978,"308":982,"309":984,"310":989,"311":992}	2025-11-06 09:17:45+01	2025-11-06 09:11:55+01
936	1	78	15	5	720	0	0	completed	{"1044":3551,"1045":3554,"1046":3559,"1047":3562,"1048":3567,"1049":3571,"1050":3575,"1051":3579,"1052":3583,"1053":3586,"1054":3589,"1055":3594,"1056":3599,"1057":3603,"1058":3607,"1059":3612,"1060":3613,"1061":3618,"1062":3622,"1063":3626}	2026-02-23 18:05:50.240998+01	2026-01-22 18:31:21+01
1071	59	99	17	3	800	0	0	completed	{"1319":4510,"1320":4515,"1321":4520,"1322":4525,"1323":4527,"1324":4532,"1325":4536,"1326":4538,"1327":4544,"1328":4547,"1329":4552,"1330":4555,"1331":4559,"1332":4564,"1333":4567,"1334":4572,"1335":4575,"1336":4580,"1337":4584,"1338":4587}	2026-02-23 17:33:36.87631+01	2026-02-23 17:20:16.87631+01
1205	93	97	2	1	19	0	0	abandoned	{"1279":4352,"1280":4356,"1281":4361}	2026-02-23 18:18:21.306666+01	2026-02-23 18:18:02.306666+01
1211	93	70	37	10	2538	0	0	completed	{"777":2652,"778":2656,"779":2660,"780":2664,"781":2668,"782":2672,"783":2676,"784":2680,"785":2683,"786":2687,"787":2691,"788":2696,"789":2700,"790":2704,"791":2708,"792":2712,"793":2715,"794":2720,"795":2724,"796":2728,"797":2732,"798":2736,"799":2739,"800":2744,"801":2747,"802":2751,"803":2755,"804":2759,"805":2763,"806":2767,"807":2771,"808":2775,"809":2779,"810":2784,"811":2787,"812":2791,"813":2795,"814":2802,"815":2804,"816":2807,"817":2813,"818":2816,"819":2822,"820":2826,"821":2828,"822":2834,"823":2836}	2026-02-07 04:00:59+01	2026-02-07 03:18:41+01
931	1	36	8	2	540	0	0	completed	{"212":694,"213":697,"214":700,"215":702,"216":707,"217":710,"218":712,"219":715,"220":718,"221":720}	2026-02-23 17:32:02.802709+01	2026-01-17 06:43:25+01
938	1	58	40	13	1908	0	0	completed	{"522":1683,"523":1689,"524":1691,"525":1696,"526":1699,"527":1704,"528":1707,"529":1712,"530":1717,"531":1720,"532":1724,"533":1729,"534":1733,"535":1735,"536":1741,"537":1747,"538":1749,"539":1752,"540":1757,"541":1762,"542":1765,"543":1769,"544":1774,"545":1776,"546":1781,"547":1785,"548":1790,"549":1792,"550":1799,"551":1801,"552":1805,"553":1810,"554":1812,"555":1816,"556":1823,"557":1824,"558":1828,"559":1832,"560":1837,"561":1840,"562":1846,"563":1849,"564":1852,"565":1858,"566":1862,"567":1866,"568":1871,"569":1874,"570":1878,"571":1881,"572":1884,"573":1888,"574":1893}	2026-02-23 17:32:02.802709+01	2025-11-30 09:29:35+01
942	1	73	34	6	1240	0	0	completed	{"864":2980,"865":2982,"866":2986,"867":2989,"868":2992,"869":2995,"870":2998,"871":3001,"872":3003,"873":3006,"874":3010,"875":3012,"876":3017,"877":3020,"878":3021,"879":3026,"880":3029,"881":3032,"882":3034,"883":3037,"884":3039,"885":3042,"886":3046,"887":3048,"888":3053,"889":3056,"890":3058,"891":3061,"892":3063,"893":3066,"894":3069,"895":3074,"896":3075,"897":3078,"898":3082,"899":3084,"900":3089,"901":3092,"902":3093,"903":3098}	2026-02-23 17:32:23.188686+01	2025-08-10 03:26:09+02
1051	1	36	0	0	305	0	0	in_progress	{"212":694,"213":697,"214":700,"215":702,"216":705,"217":709,"218":711}	2026-02-23 17:32:37.009067+01	2026-02-02 19:01:55.725967+01
934	1	70	31	16	1692	0	0	completed	{"777":2652,"778":2656,"779":2660,"780":2664,"781":2668,"782":2672,"783":2676,"784":2680,"785":2683,"786":2687,"787":2691,"788":2696,"789":2700,"790":2704,"791":2708,"792":2712,"793":2715,"794":2720,"795":2724,"796":2728,"797":2732,"798":2736,"799":2739,"800":2744,"801":2747,"802":2751,"803":2755,"804":2759,"805":2763,"806":2767,"807":2771,"808":2778,"809":2781,"810":2786,"811":2790,"812":2794,"813":2797,"814":2801,"815":2804,"816":2810,"817":2814,"818":2816,"819":2820,"820":2826,"821":2829,"822":2832,"823":2837}	2026-02-23 17:32:02.802709+01	2025-10-16 08:06:26+02
1077	59	60	19	2	324	0	0	in_progress	{"600":1996,"601":2000,"602":2003,"603":2005,"604":2009,"605":2012,"606":2015,"607":2018,"608":2021,"609":2023,"610":2027,"611":2029,"612":2032,"613":2036,"614":2038,"615":2042,"616":2045,"617":2048,"618":2051,"619":2055,"620":2057}	2026-02-17 04:30:44+01	2026-02-17 04:25:20+01
1097	88	96	8	2	360	0	0	completed	{"1269":4322,"1270":4325,"1271":4326,"1272":4331,"1273":4332,"1274":4336,"1275":4340,"1276":4343,"1277":4345,"1278":4347}	2026-02-17 19:42:09+01	2026-02-17 19:36:09+01
1208	93	100	17	3	900	0	0	completed	{"1339":4592,"1340":4595,"1341":4599,"1342":4604,"1343":4607,"1344":4611,"1345":4615,"1346":4620,"1347":4623,"1348":4628,"1349":4633,"1350":4636,"1351":4640,"1352":4644,"1353":4647,"1354":4652,"1355":4655,"1356":4661,"1357":4664,"1358":4667}	2026-02-23 18:33:02.294382+01	2026-02-23 18:18:02.294382+01
1222	94	96	7	3	380	0	0	completed	{"1269":4322,"1270":4325,"1271":4326,"1272":4331,"1273":4332,"1274":4336,"1275":4340,"1276":4341,"1277":4346,"1278":4348}	2026-02-14 13:13:47+01	2026-02-14 13:07:27+01
1228	95	35	8	2	380	0	0	completed	{"202":664,"203":666,"204":669,"205":672,"206":677,"207":679,"208":681,"209":684,"210":689,"211":691}	2025-10-25 19:59:07+02	2025-10-25 19:52:47+02
939	1	60	15	10	1450	0	0	completed	{"600":1996,"601":2000,"602":2003,"603":2005,"604":2009,"605":2012,"606":2015,"607":2018,"608":2021,"609":2023,"610":2027,"611":2029,"612":2032,"613":2036,"614":2038,"615":2041,"616":2046,"617":2049,"618":2050,"619":2055,"620":2057,"621":2060,"622":2063,"623":2065,"624":2068}	2026-02-23 18:05:50.240998+01	2026-01-21 13:52:33+01
1080	59	91	16	4	940	0	0	completed	{"1179":4050,"1180":4053,"1181":4056,"1182":4059,"1183":4062,"1184":4065,"1185":4068,"1186":4071,"1187":4074,"1188":4077,"1189":4080,"1190":4083,"1191":4086,"1192":4089,"1193":4092,"1194":4095,"1195":4100,"1196":4102,"1197":4105,"1198":4108}	2026-02-05 04:56:57+01	2026-02-05 04:41:17+01
1087	59	34	7	3	570	0	0	completed	{"192":635,"193":638,"194":641,"195":643,"196":647,"197":649,"198":651,"199":655,"200":657,"201":660}	2026-01-31 18:56:10+01	2026-01-31 18:46:40+01
1090	88	39	0	1	10	0	0	abandoned	{"242":785}	2026-01-20 06:42:10+01	2026-01-20 06:42:00+01
1209	93	42	8	2	550	0	0	completed	{"282":904,"283":906,"284":910,"285":912,"286":915,"287":919,"288":922,"289":924,"290":929,"291":931}	2026-02-19 12:52:49+01	2026-02-19 12:43:39+01
969	59	69	41	9	2500	0	0	completed	{"727":2452,"728":2456,"729":2460,"730":2464,"731":2468,"732":2473,"733":2476,"734":2480,"735":2484,"736":2489,"737":2491,"738":2496,"739":2500,"740":2504,"741":2509,"742":2513,"743":2517,"744":2519,"745":2525,"746":2529,"747":2534,"748":2536,"749":2542,"750":2545,"751":2548,"752":2553,"753":2555,"754":2560,"755":2564,"756":2569,"757":2573,"758":2577,"759":2580,"760":2584,"761":2590,"762":2592,"763":2596,"764":2601,"765":2604,"766":2609,"767":2612,"768":2616,"769":2621,"770":2625,"771":2628,"772":2631,"773":2635,"774":2641,"775":2644,"776":2649}	2026-01-09 00:27:35+01	2026-01-08 23:45:55+01
1219	94	77	26	4	1500	0	0	completed	{"1014":3430,"1015":3435,"1016":3438,"1017":3442,"1018":3445,"1019":3449,"1020":3454,"1021":3457,"1022":3463,"1023":3465,"1024":3471,"1025":3474,"1026":3477,"1027":3482,"1028":3487,"1029":3490,"1030":3494,"1031":3498,"1032":3502,"1033":3507,"1034":3511,"1035":3514,"1036":3518,"1037":3524,"1038":3528,"1039":3530,"1040":3536,"1041":3537,"1042":3542,"1043":3546}	2025-11-19 11:01:39+01	2025-11-19 10:36:39+01
1226	94	34	8	2	510	0	0	completed	{"192":635,"193":638,"194":641,"195":643,"196":647,"197":649,"198":651,"199":654,"200":657,"201":660}	2025-10-23 00:23:01+02	2025-10-23 00:14:31+02
973	1	65	15	10	800	0	0	completed	{"648":2163,"649":2166,"650":2170,"651":2171,"652":2176,"653":2177,"654":2180,"655":2183,"656":2188,"657":2189,"658":2192,"659":2197,"660":2198,"661":2202,"662":2205,"663":2207,"664":2211,"665":2213,"666":2218,"667":2219,"668":2223,"669":2226,"670":2230,"671":2233,"672":2236}	2026-02-23 17:32:11.060942+01	2025-12-12 12:04:07+01
975	1	60	21	4	1200	0	0	completed	{"600":1996,"601":2000,"602":2003,"603":2005,"604":2009,"605":2012,"606":2015,"607":2018,"608":2021,"609":2023,"610":2027,"611":2029,"612":2032,"613":2036,"614":2038,"615":2042,"616":2045,"617":2048,"618":2051,"619":2054,"620":2056,"621":2061,"622":2064,"623":2065,"624":2068}	2026-02-23 17:32:11.060942+01	2025-12-16 17:17:53+01
983	1	37	8	2	490	0	0	completed	{"222":724,"223":726,"224":731,"225":734,"226":737,"227":738,"228":743,"229":746,"230":749,"231":751}	2026-02-23 17:32:11.060942+01	2025-07-25 19:54:43+02
951	1	60	20	5	875	0	0	completed	{"600":1996,"601":2000,"602":2003,"603":2005,"604":2009,"605":2012,"606":2015,"607":2018,"608":2021,"609":2023,"610":2027,"611":2029,"612":2032,"613":2036,"614":2038,"615":2042,"616":2045,"617":2048,"618":2051,"619":2054,"620":2058,"621":2061,"622":2064,"623":2065,"624":2070}	2026-02-23 17:32:18.588484+01	2025-11-28 08:14:53+01
957	1	78	12	8	780	0	0	completed	{"1044":3551,"1045":3554,"1046":3559,"1047":3562,"1048":3567,"1049":3571,"1050":3575,"1051":3579,"1052":3583,"1053":3586,"1054":3589,"1055":3594,"1056":3597,"1057":3602,"1058":3608,"1059":3612,"1060":3614,"1061":3620,"1062":3624,"1063":3625}	2026-02-23 17:32:18.588484+01	2025-07-05 10:24:35+02
944	1	42	6	4	460	0	0	completed	{"282":904,"283":906,"284":910,"285":912,"286":915,"287":919,"288":923,"289":925,"290":929,"291":932}	2026-02-23 17:32:23.188686+01	2025-06-14 23:08:53+02
948	1	70	30	17	1833	0	0	completed	{"777":2652,"778":2656,"779":2660,"780":2664,"781":2668,"782":2672,"783":2676,"784":2680,"785":2683,"786":2687,"787":2691,"788":2696,"789":2700,"790":2704,"791":2708,"792":2712,"793":2715,"794":2720,"795":2724,"796":2728,"797":2732,"798":2736,"799":2739,"800":2744,"801":2747,"802":2751,"803":2755,"804":2759,"805":2763,"806":2767,"807":2773,"808":2776,"809":2782,"810":2785,"811":2790,"812":2793,"813":2797,"814":2801,"815":2806,"816":2810,"817":2814,"818":2816,"819":2821,"820":2826,"821":2829,"822":2833,"823":2837}	2026-02-23 17:32:23.188686+01	2025-05-15 19:38:09+02
940	1	59	23	2	825	0	0	completed	{"575":1898,"576":1901,"577":1904,"578":1908,"579":1913,"580":1916,"581":1920,"582":1925,"583":1928,"584":1933,"585":1936,"586":1941,"587":1945,"588":1949,"589":1952,"590":1957,"591":1961,"592":1964,"593":1968,"594":1972,"595":1976,"596":1981,"597":1987,"598":1989,"599":1992}	2026-02-23 17:32:23.188686+01	2025-07-06 21:00:40+02
947	1	78	12	8	860	0	0	completed	{"1044":3551,"1045":3554,"1046":3559,"1047":3562,"1048":3567,"1049":3571,"1050":3575,"1051":3579,"1052":3583,"1053":3586,"1054":3589,"1055":3594,"1056":3598,"1057":3602,"1058":3605,"1059":3609,"1060":3616,"1061":3620,"1062":3624,"1063":3625}	2026-02-23 17:32:23.188686+01	2025-03-21 10:38:45+01
1083	59	94	1	1	13	0	0	abandoned	{"1237":4225,"1238":4227}	2026-02-20 01:40:23+01	2026-02-20 01:40:10+01
1086	59	78	3	1	19	0	0	abandoned	{"1044":3551,"1045":3554,"1046":3559,"1047":3561}	2026-01-26 10:39:42+01	2026-01-26 10:39:23+01
1093	59	59	22	3	1425	0	0	completed	{"575":1899,"576":1900,"577":1904,"578":1908,"579":1913,"580":1916,"581":1920,"582":1925,"583":1928,"584":1933,"585":1936,"586":1941,"587":1945,"588":1949,"589":1952,"590":1957,"591":1961,"592":1964,"593":1968,"594":1972,"595":1976,"596":1981,"597":1987,"598":1989,"599":1994}	2026-02-22 19:40:21+01	2026-02-22 19:16:36+01
1216	94	33	2	1	150	0	0	in_progress	{"182":603,"183":606,"184":611}	2025-11-23 02:52:44+01	2025-11-23 02:50:14+01
1224	94	43	2	1	155	0	0	in_progress	{"292":934,"293":937,"294":940}	2025-11-12 19:49:44+01	2025-11-12 19:47:09+01
1229	94	73	33	7	1600	0	0	completed	{"864":2980,"865":2982,"866":2986,"867":2989,"868":2992,"869":2995,"870":2998,"871":3001,"872":3003,"873":3006,"874":3010,"875":3012,"876":3017,"877":3020,"878":3021,"879":3026,"880":3029,"881":3032,"882":3034,"883":3037,"884":3039,"885":3042,"886":3046,"887":3048,"888":3053,"889":3055,"890":3058,"891":3061,"892":3064,"893":3067,"894":3069,"895":3074,"896":3075,"897":3078,"898":3082,"899":3084,"900":3089,"901":3092,"902":3093,"903":3098}	2025-11-15 16:50:18+01	2025-11-15 16:23:38+01
1234	95	95	15	5	840	0	0	completed	{"1249":4261,"1250":4265,"1251":4268,"1252":4271,"1253":4274,"1254":4277,"1255":4279,"1256":4282,"1257":4286,"1258":4288,"1259":4292,"1260":4295,"1261":4298,"1262":4301,"1263":4304,"1264":4305,"1265":4308,"1266":4313,"1267":4315,"1268":4319}	2026-02-13 09:48:39+01	2026-02-13 09:34:39+01
1239	95	101	15	5	640	0	0	completed	{"1359":4672,"1360":4675,"1361":4679,"1362":4684,"1363":4688,"1364":4692,"1365":4695,"1366":4700,"1367":4704,"1368":4708,"1369":4712,"1370":4715,"1371":4720,"1372":4723,"1373":4727,"1374":4732,"1375":4736,"1376":4738,"1377":4745,"1378":4746}	2026-02-23 17:34:49.840125+01	2026-02-23 17:24:09.840125+01
1240	95	56	28	2	1680	0	0	completed	{"482":1524,"483":1528,"484":1532,"485":1536,"486":1540,"487":1544,"488":1547,"489":1551,"490":1558,"491":1561,"492":1566,"493":1567,"494":1574,"495":1578,"496":1579,"497":1583,"498":1587,"499":1591,"500":1595,"501":1599,"502":1603,"503":1610,"504":1611,"505":1615,"506":1619,"507":1623,"508":1630,"509":1633,"510":1637,"511":1640}	2025-08-06 01:20:55+02	2025-08-06 00:52:55+02
1241	94	69	45	5	2650	0	0	completed	{"727":2452,"728":2456,"729":2460,"730":2464,"731":2468,"732":2473,"733":2476,"734":2480,"735":2484,"736":2489,"737":2491,"738":2496,"739":2500,"740":2504,"741":2509,"742":2513,"743":2517,"744":2520,"745":2524,"746":2528,"747":2533,"748":2536,"749":2540,"750":2546,"751":2550,"752":2553,"753":2555,"754":2560,"755":2564,"756":2569,"757":2573,"758":2577,"759":2580,"760":2584,"761":2590,"762":2592,"763":2596,"764":2601,"765":2604,"766":2609,"767":2612,"768":2616,"769":2621,"770":2625,"771":2628,"772":2631,"773":2637,"774":2641,"775":2644,"776":2649}	2025-12-24 07:39:31+01	2025-12-24 06:55:21+01
945	1	73	36	4	1280	0	0	completed	{"864":2980,"865":2982,"866":2986,"867":2989,"868":2992,"869":2995,"870":2998,"871":3001,"872":3003,"873":3006,"874":3010,"875":3012,"876":3017,"877":3020,"878":3021,"879":3026,"880":3029,"881":3032,"882":3034,"883":3037,"884":3039,"885":3042,"886":3046,"887":3048,"888":3053,"889":3056,"890":3057,"891":3062,"892":3063,"893":3067,"894":3069,"895":3072,"896":3075,"897":3078,"898":3082,"899":3084,"900":3089,"901":3092,"902":3093,"903":3098}	2026-02-23 18:05:50.240998+01	2026-01-20 08:13:39+01
1085	59	65	14	1	300	0	0	in_progress	{"648":2163,"649":2166,"650":2170,"651":2171,"652":2176,"653":2177,"654":2180,"655":2183,"656":2188,"657":2189,"658":2192,"659":2197,"660":2198,"661":2203,"668":2223}	2026-02-05 00:20:15+01	2026-02-05 00:15:15+01
1100	59	69	38	12	2950	0	0	completed	{"727":2452,"728":2456,"729":2460,"730":2464,"731":2468,"732":2473,"733":2476,"734":2480,"735":2484,"736":2489,"737":2491,"738":2496,"739":2500,"740":2504,"741":2507,"742":2514,"743":2515,"744":2519,"745":2526,"746":2530,"747":2534,"748":2535,"749":2542,"750":2546,"751":2548,"752":2553,"753":2555,"754":2560,"755":2564,"756":2569,"757":2573,"758":2577,"759":2580,"760":2584,"761":2590,"762":2592,"763":2596,"764":2601,"765":2604,"766":2609,"767":2612,"768":2616,"769":2621,"770":2625,"771":2628,"772":2631,"773":2635,"774":2641,"775":2644,"776":2649}	2026-02-02 13:26:13+01	2026-02-02 12:37:03+01
1217	93	61	17	3	660	0	0	completed	{"625":2071,"626":2076,"627":2081,"628":2084,"629":2089,"630":2091,"631":2096,"632":2099,"633":2104,"634":2107,"635":2111,"636":2115,"637":2119,"638":2123,"639":2127,"640":2131,"641":2135,"642":2141,"643":2146,"644":2148}	2026-02-19 16:29:11+01	2026-02-19 16:18:11+01
1221	94	95	16	4	840	0	0	completed	{"1249":4261,"1250":4265,"1251":4268,"1252":4271,"1253":4274,"1254":4277,"1255":4279,"1256":4282,"1257":4286,"1258":4288,"1259":4292,"1260":4295,"1261":4298,"1262":4301,"1263":4304,"1264":4307,"1265":4310,"1266":4313,"1267":4315,"1268":4319}	2026-02-19 18:54:21+01	2026-02-19 18:40:21+01
1088	59	31	24	6	1440	0	0	completed	{"142":484,"143":486,"144":490,"145":493,"146":496,"147":498,"148":501,"149":506,"150":508,"151":511,"152":514,"153":516,"154":520,"155":523,"156":525,"157":528,"158":531,"159":535,"160":537,"161":542,"162":543,"163":547,"164":551,"165":552,"166":557,"167":560,"168":562,"169":565,"170":569,"171":571}	2026-02-13 04:43:55+01	2026-02-13 04:19:55+01
1094	88	42	8	2	560	0	0	completed	{"282":904,"283":906,"284":910,"285":912,"286":915,"287":919,"288":922,"289":924,"290":929,"291":931}	2026-01-29 15:24:58+01	2026-01-29 15:15:38+01
1223	94	47	9	1	460	0	0	completed	{"342":1085,"343":1087,"344":1090,"345":1093,"346":1097,"347":1099,"348":1103,"349":1105,"350":1109,"351":1110}	2026-01-24 15:35:32+01	2026-01-24 15:27:52+01
962	59	39	18	2	900	0	0	completed	{"242":783,"243":787,"244":789,"245":792,"246":797,"247":798,"248":801,"249":804,"250":807,"251":810,"252":813,"253":818,"254":819,"255":822,"256":825,"257":828,"258":831,"259":834,"260":838,"261":841}	2026-01-08 18:11:10+01	2026-01-08 17:56:10+01
950	1	34	7	3	590	0	0	completed	{"192":635,"193":638,"194":641,"195":643,"196":647,"197":649,"198":651,"199":655,"200":657,"201":661}	2026-02-23 17:32:06.108912+01	2025-11-01 00:36:37+01
974	1	71	18	2	800	0	0	completed	{"824":2840,"825":2844,"826":2849,"827":2854,"828":2856,"829":2860,"830":2865,"831":2868,"832":2873,"833":2878,"834":2880,"835":2884,"836":2889,"837":2893,"838":2896,"839":2901,"840":2904,"841":2908,"842":2914,"843":2918}	2026-02-23 17:32:11.060942+01	2025-12-09 12:20:34+01
987	1	34	6	4	530	0	0	completed	{"192":635,"193":638,"194":641,"195":643,"196":647,"197":649,"198":652,"199":655,"200":659,"201":661}	2026-02-23 17:32:11.060942+01	2025-09-20 20:40:56+02
956	1	61	14	6	960	0	0	completed	{"625":2071,"626":2076,"627":2081,"628":2084,"629":2089,"630":2091,"631":2096,"632":2099,"633":2104,"634":2107,"635":2111,"636":2115,"637":2119,"638":2123,"639":2130,"640":2134,"641":2138,"642":2142,"643":2146,"644":2150}	2026-02-23 17:32:23.188686+01	2025-09-11 13:04:54+02
952	1	58	47	6	2385	0	0	completed	{"522":1683,"523":1689,"524":1691,"525":1696,"526":1699,"527":1704,"528":1707,"529":1712,"530":1717,"531":1720,"532":1724,"533":1729,"534":1733,"535":1735,"536":1741,"537":1747,"538":1749,"539":1752,"540":1757,"541":1762,"542":1765,"543":1769,"544":1774,"545":1776,"546":1781,"547":1785,"548":1790,"549":1792,"550":1799,"551":1801,"552":1805,"553":1810,"554":1812,"555":1816,"556":1820,"557":1826,"558":1830,"559":1832,"560":1837,"561":1840,"562":1846,"563":1849,"564":1852,"565":1856,"566":1860,"567":1864,"568":1869,"569":1874,"570":1876,"571":1882,"572":1884,"573":1889,"574":1895}	2026-02-23 17:32:23.188686+01	2025-10-19 23:27:17+02
1089	87	35	8	2	590	0	0	completed	{"202":664,"203":666,"204":669,"205":672,"206":677,"207":679,"208":681,"209":684,"210":688,"211":692}	2026-02-11 20:31:53+01	2026-02-11 20:22:03+01
1096	87	33	7	3	520	0	0	completed	{"182":603,"183":606,"184":609,"185":612,"186":615,"187":618,"188":621,"189":626,"190":629,"191":631}	2026-02-12 22:05:54+01	2026-02-12 21:57:14+01
1106	88	100	17	3	780	0	0	completed	{"1339":4592,"1340":4595,"1341":4599,"1342":4604,"1343":4607,"1344":4611,"1345":4615,"1346":4620,"1347":4623,"1348":4628,"1349":4633,"1350":4636,"1351":4640,"1352":4644,"1353":4647,"1354":4652,"1355":4655,"1356":4659,"1357":4662,"1358":4669}	2026-02-23 17:34:12.467562+01	2026-02-23 17:21:12.467562+01
1112	88	56	22	8	930	0	0	completed	{"482":1524,"483":1528,"484":1532,"485":1536,"486":1540,"487":1544,"488":1547,"489":1554,"490":1555,"491":1560,"492":1566,"493":1567,"494":1574,"495":1578,"496":1579,"497":1583,"498":1587,"499":1591,"500":1595,"501":1599,"502":1604,"503":1609,"504":1612,"505":1617,"506":1621,"507":1623,"508":1630,"509":1633,"510":1637,"511":1640}	2026-01-28 23:57:27+01	2026-01-28 23:41:57+01
1227	94	61	17	3	1020	0	0	completed	{"625":2071,"626":2076,"627":2081,"628":2084,"629":2089,"630":2091,"631":2096,"632":2099,"633":2104,"634":2107,"635":2111,"636":2115,"637":2119,"638":2123,"639":2127,"640":2131,"641":2135,"642":2142,"643":2146,"644":2149}	2025-09-18 17:41:15+02	2025-09-18 17:24:15+02
1098	87	100	18	2	740	0	0	completed	{"1339":4592,"1340":4595,"1341":4599,"1342":4604,"1343":4607,"1344":4611,"1345":4615,"1346":4620,"1347":4623,"1348":4628,"1349":4633,"1350":4636,"1351":4640,"1352":4644,"1353":4647,"1354":4652,"1355":4655,"1356":4658,"1357":4662,"1358":4667}	2026-02-23 17:33:32.467562+01	2026-02-23 17:21:12.467562+01
967	1	38	8	2	320	0	0	completed	{"232":753,"233":756,"234":759,"235":762,"236":766,"237":768,"238":771,"239":774,"240":778,"241":780}	2026-02-23 17:32:11.060942+01	2025-07-07 09:01:04+02
953	1	38	6	4	480	0	0	completed	{"232":753,"233":756,"234":759,"235":762,"236":766,"237":768,"238":772,"239":776,"240":779,"241":782}	2026-02-23 17:32:23.188686+01	2025-10-12 17:37:25+02
1233	93	69	38	12	1850	0	0	completed	{"727":2452,"728":2456,"729":2460,"730":2464,"731":2468,"732":2473,"733":2476,"734":2480,"735":2484,"736":2489,"737":2491,"738":2496,"739":2500,"740":2504,"741":2510,"742":2512,"743":2518,"744":2521,"745":2525,"746":2527,"747":2531,"748":2538,"749":2542,"750":2546,"751":2548,"752":2553,"753":2555,"754":2560,"755":2564,"756":2569,"757":2573,"758":2577,"759":2580,"760":2584,"761":2590,"762":2592,"763":2596,"764":2601,"765":2604,"766":2609,"767":2612,"768":2616,"769":2621,"770":2625,"771":2628,"772":2631,"773":2637,"774":2641,"775":2644,"776":2649}	2026-02-05 21:01:21+01	2026-02-05 20:30:31+01
960	59	33	6	4	400	0	0	completed	{"182":603,"183":606,"184":609,"185":612,"186":615,"187":618,"188":622,"189":626,"190":629,"191":631}	2026-01-18 13:02:53+01	2026-01-18 12:56:13+01
964	59	49	6	4	330	0	0	completed	{"362":1144,"363":1147,"364":1150,"365":1153,"366":1155,"367":1159,"368":1161,"369":1164,"370":1169,"371":1171}	2026-01-11 03:45:49+01	2026-01-11 03:40:19+01
1102	88	35	7	3	400	0	0	completed	{"202":664,"203":666,"204":669,"205":672,"206":677,"207":679,"208":681,"209":686,"210":688,"211":692}	2025-12-19 03:05:35+01	2025-12-19 02:58:55+01
954	1	48	7	3	400	0	0	completed	{"352":1113,"353":1118,"354":1121,"355":1124,"356":1127,"357":1129,"358":1133,"359":1135,"360":1137,"361":1141}	2026-02-23 17:32:06.108912+01	2025-10-09 20:38:06+02
958	1	35	9	1	590	0	0	completed	{"202":664,"203":666,"204":669,"205":672,"206":677,"207":679,"208":681,"209":684,"210":687,"211":691}	2026-02-23 17:32:06.108912+01	2025-11-26 06:25:47+01
1107	88	45	15	5	700	0	0	completed	{"312":995,"313":998,"314":1001,"315":1003,"316":1005,"317":1010,"318":1013,"319":1016,"320":1019,"321":1021,"322":1025,"323":1028,"324":1029,"325":1034,"326":1036,"327":1039,"328":1042,"329":1046,"330":1048,"331":1051}	2026-02-05 00:57:21+01	2026-02-05 00:45:41+01
1117	90	96	9	1	490	0	0	completed	{"1269":4322,"1270":4325,"1271":4326,"1272":4331,"1273":4332,"1274":4336,"1275":4340,"1276":4343,"1277":4344,"1278":4347}	2026-02-22 07:16:34+01	2026-02-22 07:08:24+01
1236	95	39	15	5	820	0	0	completed	{"242":783,"243":787,"244":789,"245":792,"246":797,"247":798,"248":801,"249":804,"250":807,"251":810,"252":813,"253":818,"254":819,"255":822,"256":825,"257":830,"258":832,"259":836,"260":839,"261":842}	2025-11-03 20:48:07+01	2025-11-03 20:34:27+01
961	59	36	7	3	420	0	0	completed	{"212":694,"213":697,"214":700,"215":702,"216":707,"217":710,"218":712,"219":714,"220":718,"221":721}	2026-01-14 05:51:30+01	2026-01-14 05:44:30+01
1235	95	37	8	2	560	0	0	completed	{"222":724,"223":726,"224":731,"225":734,"226":737,"227":738,"228":743,"229":746,"230":748,"231":751}	2026-01-13 11:54:27+01	2026-01-13 11:45:07+01
955	1	69	32	18	1600	0	0	completed	{"727":2452,"728":2456,"729":2460,"730":2464,"731":2468,"732":2473,"733":2476,"734":2480,"735":2485,"736":2487,"737":2491,"738":2498,"739":2501,"740":2505,"741":2510,"742":2511,"743":2515,"744":2521,"745":2523,"746":2527,"747":2534,"748":2538,"749":2542,"750":2543,"751":2547,"752":2553,"753":2555,"754":2560,"755":2563,"756":2569,"757":2573,"758":2577,"759":2580,"760":2584,"761":2590,"762":2592,"763":2596,"764":2601,"765":2604,"766":2609,"767":2612,"768":2616,"769":2621,"770":2625,"771":2628,"772":2631,"773":2638,"774":2641,"775":2644,"776":2649}	2026-02-23 17:32:23.188686+01	2025-04-06 03:10:54+02
1104	88	37	8	2	520	0	0	completed	{"222":724,"223":726,"224":731,"225":734,"226":737,"227":738,"228":743,"229":746,"230":749,"231":750}	2025-12-19 17:19:37+01	2025-12-19 17:10:57+01
1237	95	69	23	4	525	0	0	in_progress	{"729":2461,"730":2465,"731":2470,"733":2476,"734":2480,"752":2553,"753":2555,"754":2562,"756":2569,"757":2573,"758":2577,"759":2580,"760":2584,"761":2590,"762":2592,"763":2596,"765":2604,"766":2609,"767":2612,"768":2616,"769":2621,"770":2625,"771":2628,"772":2631,"774":2641,"775":2644,"776":2649}	2025-11-27 05:54:43+01	2025-11-27 05:45:58+01
1109	90	33	8	2	570	0	0	completed	{"182":603,"183":606,"184":609,"185":612,"186":615,"187":618,"188":621,"189":624,"190":629,"191":631}	2025-09-25 11:44:52+02	2025-09-25 11:35:22+02
1114	90	101	15	5	700	0	0	completed	{"1359":4672,"1360":4675,"1361":4679,"1362":4684,"1363":4688,"1364":4692,"1365":4695,"1366":4700,"1367":4704,"1368":4708,"1369":4712,"1370":4715,"1371":4720,"1372":4723,"1373":4727,"1374":4733,"1375":4736,"1376":4741,"1377":4744,"1378":4749}	2026-02-23 17:35:49.840125+01	2026-02-23 17:24:09.840125+01
959	59	38	6	4	440	0	0	completed	{"232":753,"233":756,"234":759,"235":762,"236":766,"237":768,"238":773,"239":775,"240":779,"241":782}	2026-01-14 20:57:44+01	2026-01-14 20:50:24+01
965	59	77	26	4	1320	0	0	completed	{"1014":3430,"1015":3435,"1016":3438,"1017":3442,"1018":3445,"1019":3449,"1020":3454,"1021":3457,"1022":3463,"1023":3465,"1024":3471,"1025":3474,"1026":3477,"1027":3482,"1028":3487,"1029":3490,"1030":3494,"1031":3498,"1032":3502,"1033":3507,"1034":3511,"1035":3514,"1036":3518,"1037":3524,"1038":3528,"1039":3530,"1040":3535,"1041":3537,"1042":3543,"1043":3546}	2026-01-11 12:47:48+01	2026-01-11 12:25:48+01
1110	90	49	9	1	320	0	0	completed	{"362":1144,"363":1147,"364":1150,"365":1153,"366":1155,"367":1159,"368":1162,"369":1165,"370":1168,"371":1171}	2025-11-21 13:26:06+01	2025-11-21 13:20:46+01
971	1	55	17	3	700	0	0	completed	{"462":1446,"463":1447,"464":1454,"465":1455,"466":1462,"467":1464,"468":1467,"469":1471,"470":1475,"471":1482,"472":1483,"473":1488,"474":1494,"475":1495,"476":1499,"477":1503,"478":1508,"479":1513,"480":1516,"481":1520}	2026-02-23 17:32:11.060942+01	2025-07-07 13:02:25+02
1111	88	58	42	11	3074	0	0	completed	{"522":1683,"523":1689,"524":1691,"525":1696,"526":1699,"527":1704,"528":1707,"529":1712,"530":1717,"531":1720,"532":1724,"533":1729,"534":1733,"535":1735,"536":1741,"537":1747,"538":1749,"539":1752,"540":1757,"541":1762,"542":1765,"543":1769,"544":1774,"545":1776,"546":1781,"547":1785,"548":1790,"549":1792,"550":1799,"551":1801,"552":1805,"553":1810,"554":1812,"555":1816,"556":1820,"557":1826,"558":1829,"559":1832,"560":1837,"561":1840,"562":1846,"563":1849,"564":1852,"565":1859,"566":1861,"567":1867,"568":1871,"569":1875,"570":1878,"571":1883,"572":1887,"573":1888,"574":1895}	2025-10-01 22:18:09+02	2025-10-01 21:26:55+02
1123	90	36	9	1	580	0	0	completed	{"212":694,"213":697,"214":700,"215":702,"216":707,"217":710,"218":712,"219":715,"220":717,"221":721}	2026-01-05 21:48:34+01	2026-01-05 21:38:54+01
1133	90	77	23	7	960	0	0	completed	{"1014":3430,"1015":3435,"1016":3438,"1017":3442,"1018":3445,"1019":3449,"1020":3454,"1021":3457,"1022":3463,"1023":3465,"1024":3471,"1025":3474,"1026":3477,"1027":3482,"1028":3487,"1029":3490,"1030":3494,"1031":3498,"1032":3502,"1033":3507,"1034":3511,"1035":3514,"1036":3518,"1037":3523,"1038":3525,"1039":3531,"1040":3536,"1041":3537,"1042":3542,"1043":3546}	2026-02-01 13:22:05+01	2026-02-01 13:06:05+01
1137	92	38	8	2	430	0	0	completed	{"232":753,"233":756,"234":759,"235":762,"236":766,"237":768,"238":771,"239":774,"240":779,"241":780}	2026-01-31 14:34:08+01	2026-01-31 14:26:58+01
968	1	58	38	15	2014	0	0	completed	{"522":1683,"523":1689,"524":1691,"525":1696,"526":1699,"527":1704,"528":1707,"529":1712,"530":1717,"531":1720,"532":1724,"533":1729,"534":1733,"535":1735,"536":1741,"537":1747,"538":1749,"539":1752,"540":1757,"541":1762,"542":1765,"543":1769,"544":1774,"545":1776,"546":1781,"547":1785,"548":1790,"549":1792,"550":1799,"551":1801,"552":1805,"553":1810,"554":1814,"555":1817,"556":1823,"557":1825,"558":1829,"559":1832,"560":1837,"561":1840,"562":1846,"563":1849,"564":1852,"565":1859,"566":1861,"567":1865,"568":1868,"569":1874,"570":1876,"571":1881,"572":1884,"573":1891,"574":1895}	2026-02-23 17:32:06.108912+01	2025-11-08 22:49:07+01
972	1	70	28	19	1692	0	0	completed	{"777":2652,"778":2656,"779":2660,"780":2664,"781":2668,"782":2672,"783":2676,"784":2680,"785":2683,"786":2687,"787":2691,"788":2696,"789":2700,"790":2704,"791":2708,"792":2712,"793":2715,"794":2720,"795":2724,"796":2728,"797":2732,"798":2736,"799":2739,"800":2744,"801":2747,"802":2751,"803":2755,"804":2759,"805":2764,"806":2768,"807":2774,"808":2778,"809":2780,"810":2786,"811":2789,"812":2792,"813":2798,"814":2800,"815":2804,"816":2809,"817":2813,"818":2817,"819":2822,"820":2826,"821":2829,"822":2834,"823":2837}	2026-02-23 17:32:06.108912+01	2025-09-27 08:05:55+02
978	1	36	8	2	320	0	0	completed	{"212":694,"213":697,"214":700,"215":702,"216":707,"217":710,"218":712,"219":715,"220":718,"221":720}	2026-02-23 17:32:11.060942+01	2025-07-20 08:36:54+02
984	1	61	18	2	1120	0	0	completed	{"625":2071,"626":2076,"627":2081,"628":2084,"629":2089,"630":2091,"631":2096,"632":2099,"633":2104,"634":2107,"635":2111,"636":2115,"637":2119,"638":2123,"639":2127,"640":2131,"641":2135,"642":2139,"643":2145,"644":2150}	2026-02-23 17:32:11.060942+01	2025-08-10 09:32:02+02
1144	92	55	17	3	1160	0	0	completed	{"462":1446,"463":1447,"464":1454,"465":1455,"466":1462,"467":1464,"468":1467,"469":1471,"470":1475,"471":1482,"472":1483,"473":1488,"474":1494,"475":1495,"476":1499,"477":1503,"478":1508,"479":1513,"480":1516,"481":1520}	2026-02-21 01:05:15+01	2026-02-21 00:45:55+01
1147	92	47	8	2	540	0	0	completed	{"342":1085,"343":1087,"344":1090,"345":1093,"346":1097,"347":1099,"348":1103,"349":1105,"350":1108,"351":1110}	2026-02-17 09:16:17+01	2026-02-17 09:07:17+01
1155	91	99	16	4	1180	0	0	completed	{"1319":4510,"1320":4515,"1321":4520,"1322":4525,"1323":4527,"1324":4532,"1325":4536,"1326":4538,"1327":4544,"1328":4547,"1329":4552,"1330":4555,"1331":4559,"1332":4564,"1333":4567,"1334":4572,"1335":4576,"1336":4580,"1337":4585,"1338":4586}	2026-02-23 18:37:42.147414+01	2026-02-23 18:18:02.147414+01
970	59	35	6	4	410	0	0	completed	{"202":664,"203":666,"204":669,"205":672,"206":677,"207":679,"208":682,"209":685,"210":689,"211":691}	2026-01-08 04:35:27+01	2026-01-08 04:28:37+01
1113	90	100	16	4	680	0	0	completed	{"1339":4592,"1340":4595,"1341":4599,"1342":4604,"1343":4607,"1344":4611,"1345":4615,"1346":4620,"1347":4623,"1348":4628,"1349":4633,"1350":4636,"1351":4640,"1352":4644,"1353":4647,"1354":4652,"1355":4656,"1356":4661,"1357":4662,"1358":4669}	2026-02-23 17:32:32.467562+01	2026-02-23 17:21:12.467562+01
1118	88	31	24	6	1710	0	0	completed	{"142":484,"143":486,"144":490,"145":493,"146":496,"147":498,"148":501,"149":506,"150":508,"151":511,"152":514,"153":516,"154":520,"155":523,"156":525,"157":528,"158":531,"159":535,"160":537,"161":542,"162":543,"163":546,"164":551,"165":554,"166":557,"167":560,"168":562,"169":565,"170":569,"171":571}	2026-01-04 04:06:35+01	2026-01-04 03:38:05+01
1124	90	47	1	1	14	0	0	abandoned	{"342":1085,"343":1088}	2026-01-02 08:22:44+01	2026-01-02 08:22:30+01
1130	92	42	9	1	410	0	0	completed	{"282":904,"283":906,"284":910,"285":912,"286":915,"287":919,"288":922,"289":924,"290":927,"291":932}	2026-02-04 20:36:22+01	2026-02-04 20:29:32+01
1136	92	48	7	3	460	0	0	completed	{"352":1113,"353":1118,"354":1121,"355":1124,"356":1127,"357":1129,"358":1133,"359":1134,"360":1137,"361":1141}	2026-02-01 13:52:48+01	2026-02-01 13:45:08+01
1140	92	90	20	5	850	0	0	completed	{"1154":3952,"1155":3954,"1156":3959,"1157":3962,"1158":3966,"1159":3972,"1160":3977,"1161":3979,"1162":3984,"1163":3987,"1164":3992,"1165":3995,"1166":3999,"1167":4002,"1168":4007,"1169":4011,"1170":4015,"1171":4020,"1172":4022,"1173":4026,"1174":4033,"1175":4036,"1176":4038,"1177":4045,"1178":4048}	2026-01-31 06:43:08+01	2026-01-31 06:28:58+01
1115	88	69	46	4	2000	0	0	completed	{"727":2452,"728":2456,"729":2460,"730":2464,"731":2468,"732":2473,"733":2476,"734":2480,"735":2484,"736":2489,"737":2491,"738":2496,"739":2500,"740":2504,"741":2509,"742":2513,"743":2517,"744":2520,"745":2524,"746":2528,"747":2533,"748":2537,"749":2540,"750":2543,"751":2548,"752":2553,"753":2555,"754":2560,"755":2564,"756":2569,"757":2573,"758":2577,"759":2580,"760":2584,"761":2590,"762":2592,"763":2596,"764":2601,"765":2604,"766":2609,"767":2612,"768":2616,"769":2621,"770":2625,"771":2628,"772":2631,"773":2637,"774":2641,"775":2644,"776":2649}	2025-12-18 19:03:42+01	2025-12-18 18:30:22+01
977	1	77	25	5	1620	0	0	completed	{"1014":3430,"1015":3435,"1016":3438,"1017":3442,"1018":3445,"1019":3449,"1020":3454,"1021":3457,"1022":3463,"1023":3465,"1024":3471,"1025":3474,"1026":3477,"1027":3482,"1028":3487,"1029":3490,"1030":3494,"1031":3498,"1032":3502,"1033":3507,"1034":3511,"1035":3514,"1036":3518,"1037":3524,"1038":3528,"1039":3529,"1040":3536,"1041":3540,"1042":3543,"1043":3546}	2026-02-23 17:32:11.060942+01	2026-01-19 12:15:27+01
1116	88	60	20	5	1000	0	0	completed	{"600":1996,"601":2000,"602":2003,"603":2005,"604":2009,"605":2012,"606":2015,"607":2018,"608":2021,"609":2023,"610":2027,"611":2029,"612":2032,"613":2036,"614":2038,"615":2042,"616":2045,"617":2048,"618":2051,"619":2054,"620":2058,"621":2061,"622":2064,"623":2067,"624":2068}	2025-12-02 09:35:24+01	2025-12-02 09:18:44+01
1120	90	78	17	3	820	0	0	completed	{"1044":3551,"1045":3554,"1046":3559,"1047":3562,"1048":3567,"1049":3571,"1050":3575,"1051":3579,"1052":3583,"1053":3586,"1054":3589,"1055":3594,"1056":3599,"1057":3603,"1058":3607,"1059":3611,"1060":3615,"1061":3620,"1062":3622,"1063":3625}	2025-10-28 00:39:35+01	2025-10-28 00:25:55+01
1125	90	60	22	3	975	0	0	completed	{"600":1996,"601":2000,"602":2003,"603":2005,"604":2009,"605":2012,"606":2015,"607":2018,"608":2021,"609":2023,"610":2027,"611":2029,"612":2032,"613":2036,"614":2038,"615":2042,"616":2045,"617":2048,"618":2051,"619":2054,"620":2056,"621":2059,"622":2064,"623":2067,"624":2070}	2026-01-28 23:03:02+01	2026-01-28 22:46:47+01
1132	90	99	13	3	340	0	0	in_progress	{"1319":4510,"1320":4515,"1321":4520,"1322":4525,"1323":4527,"1324":4532,"1325":4536,"1326":4538,"1327":4544,"1328":4547,"1329":4552,"1330":4555,"1331":4559,"1332":4562,"1333":4569,"1334":4571}	2026-02-23 17:25:56.87631+01	2026-02-23 17:20:16.87631+01
985	1	78	13	7	1140	0	0	completed	{"1044":3551,"1045":3554,"1046":3559,"1047":3562,"1048":3567,"1049":3571,"1050":3575,"1051":3579,"1052":3583,"1053":3586,"1054":3589,"1055":3594,"1056":3599,"1057":3601,"1058":3608,"1059":3612,"1060":3616,"1061":3617,"1062":3624,"1063":3625}	2026-02-23 17:32:11.060942+01	2025-09-15 00:32:49+02
1119	90	59	20	5	1300	0	0	completed	{"575":1899,"576":1901,"577":1904,"578":1908,"579":1913,"580":1916,"581":1920,"582":1925,"583":1928,"584":1933,"585":1936,"586":1941,"587":1945,"588":1949,"589":1952,"590":1957,"591":1961,"592":1964,"593":1968,"594":1972,"595":1976,"596":1981,"597":1985,"598":1988,"599":1994}	2026-02-03 00:36:25+01	2026-02-03 00:14:45+01
980	1	70	33	14	1551	0	0	completed	{"777":2652,"778":2656,"779":2660,"780":2664,"781":2668,"782":2672,"783":2676,"784":2680,"785":2683,"786":2687,"787":2691,"788":2696,"789":2700,"790":2704,"791":2708,"792":2712,"793":2715,"794":2720,"795":2724,"796":2728,"797":2732,"798":2736,"799":2739,"800":2744,"801":2747,"802":2751,"803":2755,"804":2759,"805":2763,"806":2767,"807":2771,"808":2775,"809":2779,"810":2786,"811":2789,"812":2794,"813":2797,"814":2800,"815":2806,"816":2809,"817":2812,"818":2817,"819":2820,"820":2824,"821":2830,"822":2834,"823":2836}	2026-02-23 17:32:18.588484+01	2025-11-05 01:08:10+01
1121	90	37	8	2	470	0	0	completed	{"222":724,"223":726,"224":731,"225":734,"226":737,"227":738,"228":743,"229":746,"230":749,"231":750}	2025-11-28 13:47:06+01	2025-11-28 13:39:16+01
1122	90	42	8	2	340	0	0	completed	{"282":904,"283":906,"284":910,"285":912,"286":915,"287":919,"288":922,"289":924,"290":928,"291":931}	2026-02-03 14:54:08+01	2026-02-03 14:48:28+01
1127	90	98	16	4	960	0	0	completed	{"1299":4433,"1300":4435,"1301":4439,"1302":4444,"1303":4448,"1304":4452,"1305":4456,"1306":4460,"1307":4464,"1308":4468,"1309":4471,"1310":4475,"1311":4479,"1312":4483,"1313":4486,"1314":4491,"1315":4495,"1316":4500,"1317":4505,"1318":4508}	2026-02-23 17:34:50.866837+01	2026-02-23 17:18:50.866837+01
981	1	48	8	2	430	0	0	completed	{"352":1113,"353":1118,"354":1121,"355":1124,"356":1127,"357":1129,"358":1133,"359":1136,"360":1137,"361":1140}	2026-02-23 17:32:11.060942+01	2025-12-29 06:26:30+01
1004	1	58	47	6	2756	0	0	completed	{"522":1683,"523":1689,"524":1691,"525":1696,"526":1699,"527":1704,"528":1707,"529":1712,"530":1717,"531":1720,"532":1724,"533":1729,"534":1733,"535":1735,"536":1741,"537":1747,"538":1749,"539":1752,"540":1757,"541":1762,"542":1765,"543":1769,"544":1774,"545":1776,"546":1781,"547":1785,"548":1790,"549":1792,"550":1799,"551":1801,"552":1805,"553":1810,"554":1812,"555":1816,"556":1820,"557":1826,"558":1830,"559":1832,"560":1837,"561":1840,"562":1846,"563":1849,"564":1852,"565":1856,"566":1860,"567":1864,"568":1869,"569":1874,"570":1878,"571":1882,"572":1887,"573":1891,"574":1895}	2026-02-23 17:32:31.210877+01	2026-01-18 13:23:31+01
1010	1	73	29	11	2200	0	0	completed	{"864":2980,"865":2982,"866":2986,"867":2989,"868":2992,"869":2995,"870":2998,"871":3001,"872":3003,"873":3006,"874":3010,"875":3012,"876":3017,"877":3020,"878":3021,"879":3026,"880":3029,"881":3032,"882":3034,"883":3037,"884":3039,"885":3043,"886":3045,"887":3050,"888":3052,"889":3054,"890":3059,"891":3060,"892":3064,"893":3067,"894":3069,"895":3072,"896":3075,"897":3078,"898":3082,"899":3084,"900":3089,"901":3092,"902":3093,"903":3098}	2026-02-23 17:32:31.210877+01	2026-01-11 10:04:52+01
1126	90	93	9	1	570	0	0	completed	{"1219":4172,"1220":4175,"1221":4178,"1222":4181,"1223":4184,"1224":4187,"1225":4190,"1226":4193,"1227":4196,"1228":4197}	2026-02-09 08:23:49+01	2026-02-09 08:14:19+01
986	1	56	23	7	1560	0	0	completed	{"482":1524,"483":1528,"484":1532,"485":1536,"486":1540,"487":1544,"488":1547,"489":1552,"490":1556,"491":1562,"492":1566,"493":1567,"494":1574,"495":1578,"496":1579,"497":1583,"498":1587,"499":1591,"500":1595,"501":1599,"502":1603,"503":1610,"504":1613,"505":1618,"506":1620,"507":1623,"508":1630,"509":1633,"510":1637,"511":1640}	2026-02-23 17:32:11.060942+01	2025-12-01 13:42:40+01
995	1	47	7	3	570	0	0	completed	{"342":1085,"343":1087,"344":1090,"345":1093,"346":1097,"347":1099,"348":1103,"349":1106,"350":1108,"351":1110}	2026-02-23 17:32:11.060942+01	2025-12-27 05:34:49+01
998	1	59	23	2	1100	0	0	completed	{"575":1898,"576":1903,"577":1904,"578":1908,"579":1913,"580":1916,"581":1920,"582":1925,"583":1928,"584":1933,"585":1936,"586":1941,"587":1945,"588":1949,"589":1952,"590":1957,"591":1961,"592":1964,"593":1968,"594":1972,"595":1976,"596":1981,"597":1987,"598":1989,"599":1992}	2026-02-23 17:32:31.210877+01	2026-01-21 17:37:00+01
1001	1	34	8	2	310	0	0	completed	{"192":635,"193":638,"194":641,"195":643,"196":647,"197":649,"198":651,"199":654,"200":659,"201":660}	2026-02-23 17:32:31.210877+01	2026-01-04 19:48:57+01
1131	92	34	9	1	380	0	0	completed	{"192":635,"193":638,"194":641,"195":643,"196":647,"197":649,"198":651,"199":654,"200":658,"201":660}	2026-02-13 20:14:40+01	2026-02-13 20:08:20+01
1143	92	100	16	4	940	0	0	completed	{"1339":4592,"1340":4595,"1341":4599,"1342":4604,"1343":4607,"1344":4611,"1345":4615,"1346":4620,"1347":4623,"1348":4628,"1349":4633,"1350":4636,"1351":4640,"1352":4644,"1353":4647,"1354":4652,"1355":4654,"1356":4661,"1357":4662,"1358":4669}	2026-02-23 17:36:52.467562+01	2026-02-23 17:21:12.467562+01
1148	92	69	43	7	2750	0	0	completed	{"727":2452,"728":2456,"729":2460,"730":2464,"731":2468,"732":2473,"733":2476,"734":2480,"735":2484,"736":2489,"737":2491,"738":2496,"739":2500,"740":2504,"741":2509,"742":2513,"743":2517,"744":2520,"745":2524,"746":2530,"747":2532,"748":2538,"749":2542,"750":2546,"751":2548,"752":2553,"753":2555,"754":2560,"755":2564,"756":2569,"757":2573,"758":2577,"759":2580,"760":2584,"761":2590,"762":2592,"763":2596,"764":2601,"765":2604,"766":2609,"767":2612,"768":2616,"769":2621,"770":2625,"771":2628,"772":2631,"773":2637,"774":2641,"775":2644,"776":2649}	2026-01-26 19:45:38+01	2026-01-26 18:59:48+01
1154	91	39	11	4	280	0	0	in_progress	{"242":783,"243":787,"244":789,"245":792,"246":797,"247":798,"248":801,"249":804,"250":807,"251":810,"252":813,"253":816,"254":820,"255":824,"256":826}	2026-02-18 18:22:41.764143+01	2026-02-18 18:18:01.764143+01
1159	91	96	8	2	370	0	0	completed	{"1269":4322,"1270":4325,"1271":4326,"1272":4331,"1273":4332,"1274":4336,"1275":4340,"1276":4343,"1277":4346,"1278":4347}	2026-02-23 16:23:55+01	2026-02-23 16:17:45+01
1128	92	31	2	1	18	0	0	abandoned	{"168":562,"169":565,"170":568}	2026-02-15 22:59:48+01	2026-02-15 22:59:30+01
1138	92	99	16	4	1140	0	0	completed	{"1319":4510,"1320":4515,"1321":4520,"1322":4525,"1323":4527,"1324":4532,"1325":4536,"1326":4538,"1327":4544,"1328":4547,"1329":4552,"1330":4555,"1331":4559,"1332":4564,"1333":4567,"1334":4572,"1335":4577,"1336":4578,"1337":4585,"1338":4586}	2026-02-23 18:37:02.093567+01	2026-02-23 18:18:02.093567+01
988	1	59	18	7	1475	0	0	completed	{"575":1898,"576":1901,"577":1904,"578":1908,"579":1913,"580":1916,"581":1920,"582":1925,"583":1928,"584":1933,"585":1936,"586":1941,"587":1945,"588":1949,"589":1952,"590":1957,"591":1961,"592":1964,"593":1968,"594":1972,"595":1979,"596":1983,"597":1985,"598":1988,"599":1995}	2026-02-23 17:32:11.060942+01	2025-07-31 03:07:39+02
993	1	49	6	4	560	0	0	completed	{"362":1144,"363":1147,"364":1150,"365":1153,"366":1155,"367":1159,"368":1163,"369":1164,"370":1169,"371":1170}	2026-02-23 17:32:31.210877+01	2026-01-11 12:21:47+01
996	1	61	11	4	220	0	0	in_progress	{"625":2071,"626":2076,"627":2081,"628":2084,"629":2089,"630":2091,"631":2096,"632":2099,"633":2104,"634":2107,"635":2111,"636":2118,"637":2120,"638":2126,"639":2129}	2026-02-23 17:32:31.210877+01	2026-01-20 12:56:45+01
1129	90	95	17	3	1040	0	0	completed	{"1249":4261,"1250":4265,"1251":4268,"1252":4271,"1253":4274,"1254":4277,"1255":4279,"1256":4282,"1257":4286,"1258":4288,"1259":4292,"1260":4295,"1261":4298,"1262":4301,"1263":4304,"1264":4307,"1265":4309,"1266":4311,"1267":4314,"1268":4317}	2026-02-14 15:06:50+01	2026-02-14 14:49:30+01
992	1	43	6	4	430	0	0	completed	{"292":934,"293":937,"294":939,"295":943,"296":946,"297":949,"298":953,"299":954,"300":959,"301":960}	2026-02-23 17:32:11.060942+01	2025-10-26 18:55:36+01
1019	1	33	6	4	490	0	0	completed	{"182":603,"183":606,"184":609,"185":612,"186":615,"187":618,"188":622,"189":625,"190":629,"191":632}	2026-02-23 17:32:14.675237+01	2025-12-30 12:26:24+01
1012	1	35	7	3	400	0	0	completed	{"202":664,"203":666,"204":669,"205":672,"206":677,"207":679,"208":681,"209":686,"210":689,"211":692}	2026-02-23 17:32:31.210877+01	2026-01-19 06:42:40+01
1013	1	31	21	9	1770	0	0	completed	{"142":484,"143":486,"144":490,"145":493,"146":496,"147":498,"148":501,"149":506,"150":508,"151":511,"152":514,"153":516,"154":520,"155":523,"156":525,"157":528,"158":531,"159":535,"160":539,"161":540,"162":544,"163":547,"164":550,"165":552,"166":557,"167":558,"168":562,"169":565,"170":569,"171":571}	2026-02-23 17:32:31.210877+01	2026-01-14 00:03:06+01
999	1	38	4	2	115	0	0	in_progress	{"232":753,"233":756,"234":759,"235":762,"236":765,"237":769}	2026-02-23 17:32:31.210877+01	2026-01-15 04:44:57+01
1008	1	43	3	2	90	0	0	in_progress	{"292":934,"293":937,"294":939,"295":942,"296":947}	2026-02-23 17:32:31.210877+01	2026-01-22 03:36:41+01
994	1	69	35	15	2400	0	0	completed	{"727":2452,"728":2456,"729":2460,"730":2464,"731":2468,"732":2473,"733":2476,"734":2480,"735":2484,"736":2489,"737":2491,"738":2497,"739":2499,"740":2503,"741":2508,"742":2514,"743":2515,"744":2519,"745":2525,"746":2530,"747":2534,"748":2535,"749":2539,"750":2543,"751":2547,"752":2553,"753":2555,"754":2560,"755":2564,"756":2569,"757":2573,"758":2577,"759":2580,"760":2584,"761":2590,"762":2592,"763":2596,"764":2601,"765":2604,"766":2609,"767":2612,"768":2616,"769":2621,"770":2625,"771":2628,"772":2631,"773":2637,"774":2641,"775":2644,"776":2649}	2026-02-23 17:32:11.060942+01	2025-09-16 07:57:57+02
1134	92	59	21	4	1075	0	0	completed	{"575":1898,"576":1903,"577":1904,"578":1908,"579":1913,"580":1916,"581":1920,"582":1925,"583":1928,"584":1933,"585":1936,"586":1941,"587":1945,"588":1949,"589":1952,"590":1957,"591":1961,"592":1964,"593":1968,"594":1972,"595":1976,"596":1981,"597":1987,"598":1988,"599":1995}	2026-02-01 16:37:55+01	2026-02-01 16:20:00+01
1020	1	42	6	4	480	0	0	completed	{"282":904,"283":906,"284":910,"285":912,"286":915,"287":919,"288":921,"289":926,"290":929,"291":932}	2026-02-23 17:32:14.675237+01	2025-09-29 08:37:32+02
1029	1	34	8	2	470	0	0	completed	{"192":635,"193":638,"194":641,"195":643,"196":647,"197":649,"198":651,"199":654,"200":659,"201":661}	2026-02-23 17:32:14.675237+01	2025-08-31 21:52:23+02
1007	1	48	7	3	310	0	0	completed	{"352":1113,"353":1118,"354":1121,"355":1124,"356":1127,"357":1129,"358":1133,"359":1135,"360":1137,"361":1141}	2026-02-23 17:32:31.210877+01	2026-01-15 21:14:30+01
1000	1	42	2	1	80	0	0	in_progress	{"282":904,"283":906,"284":909}	2026-02-23 17:32:31.210877+01	2026-01-18 17:42:22+01
1135	92	43	8	2	530	0	0	completed	{"292":934,"293":937,"294":939,"295":943,"296":946,"297":949,"298":952,"299":955,"300":957,"301":960}	2026-01-24 17:56:57+01	2026-01-24 17:48:07+01
1139	92	98	15	5	960	0	0	completed	{"1299":4433,"1300":4435,"1301":4439,"1302":4444,"1303":4448,"1304":4452,"1305":4456,"1306":4460,"1307":4464,"1308":4468,"1309":4471,"1310":4475,"1311":4479,"1312":4483,"1313":4486,"1314":4490,"1315":4497,"1316":4499,"1317":4503,"1318":4507}	2026-02-23 17:34:50.866837+01	2026-02-23 17:18:50.866837+01
1002	1	45	12	8	700	0	0	completed	{"312":995,"313":998,"314":1001,"315":1003,"316":1005,"317":1010,"318":1013,"319":1016,"320":1019,"321":1021,"322":1025,"323":1027,"324":1030,"325":1033,"326":1036,"327":1039,"328":1043,"329":1044,"330":1049,"331":1051}	2026-02-23 17:32:11.060942+01	2025-10-22 21:39:08+02
1145	92	45	5	2	240	0	0	in_progress	{"312":995,"313":998,"314":1001,"315":1003,"316":1007,"317":1008,"331":1051}	2026-02-19 15:09:34+01	2026-02-19 15:05:34+01
1146	92	91	17	3	780	0	0	completed	{"1179":4050,"1180":4053,"1181":4056,"1182":4059,"1183":4062,"1184":4065,"1185":4068,"1186":4071,"1187":4074,"1188":4077,"1189":4080,"1190":4083,"1191":4086,"1192":4089,"1193":4092,"1194":4095,"1195":4098,"1196":4103,"1197":4105,"1198":4109}	2026-02-04 03:44:00+01	2026-02-04 03:31:00+01
1141	92	78	6	1	200	0	0	in_progress	{"1044":3551,"1045":3554,"1046":3559,"1047":3562,"1048":3567,"1049":3571,"1050":3573}	2026-01-30 18:30:32+01	2026-01-30 18:27:12+01
1151	91	55	8	2	330	0	0	in_progress	{"462":1446,"463":1447,"464":1454,"465":1455,"466":1462,"467":1464,"468":1467,"469":1471,"470":1476,"471":1479}	2026-02-22 14:20:15+01	2026-02-22 14:14:45+01
1003	1	65	15	10	875	0	0	completed	{"648":2163,"649":2166,"650":2170,"651":2171,"652":2176,"653":2177,"654":2180,"655":2183,"656":2188,"657":2189,"658":2192,"659":2197,"660":2198,"661":2202,"662":2205,"663":2209,"664":2211,"665":2215,"666":2217,"667":2221,"668":2223,"669":2227,"670":2230,"671":2231,"672":2236}	2026-02-23 17:32:31.210877+01	2026-01-20 06:16:53+01
1011	1	39	18	2	680	0	0	completed	{"242":783,"243":787,"244":789,"245":792,"246":797,"247":798,"248":801,"249":804,"250":807,"251":810,"252":813,"253":818,"254":819,"255":822,"256":825,"257":828,"258":831,"259":834,"260":839,"261":841}	2026-02-23 17:32:31.210877+01	2026-01-14 05:06:41+01
1142	92	44	9	1	360	0	0	completed	{"302":964,"303":968,"304":970,"305":974,"306":976,"307":978,"308":982,"309":984,"310":988,"311":991}	2026-02-04 10:00:48+01	2026-02-04 09:54:48+01
1005	1	47	8	2	340	0	0	completed	{"342":1085,"343":1087,"344":1090,"345":1093,"346":1097,"347":1099,"348":1103,"349":1105,"350":1108,"351":1110}	2026-02-23 17:32:31.210877+01	2026-01-13 05:04:40+01
1149	92	71	11	3	190	0	0	in_progress	{"824":2840,"825":2844,"826":2849,"827":2854,"828":2856,"829":2860,"830":2865,"831":2868,"832":2873,"833":2878,"834":2880,"835":2883,"836":2890,"837":2892}	2026-02-04 01:07:50+01	2026-02-04 01:04:40+01
1030	1	65	18	7	925	0	0	completed	{"648":2163,"649":2166,"650":2170,"651":2171,"652":2176,"653":2177,"654":2180,"655":2183,"656":2188,"657":2189,"658":2192,"659":2197,"660":2198,"661":2202,"662":2204,"663":2208,"664":2210,"665":2213,"666":2217,"667":2221,"668":2223,"669":2226,"670":2229,"671":2233,"672":2235}	2026-02-23 17:32:14.675237+01	2025-08-29 19:12:01+02
1034	1	55	12	8	940	0	0	completed	{"462":1446,"463":1447,"464":1454,"465":1455,"466":1462,"467":1464,"468":1467,"469":1471,"470":1475,"471":1482,"472":1483,"473":1488,"474":1491,"475":1496,"476":1500,"477":1506,"478":1510,"479":1512,"480":1518,"481":1522}	2026-02-23 17:32:14.675237+01	2025-06-24 12:33:44+02
1006	1	60	21	4	1025	0	0	completed	{"600":1996,"601":2000,"602":2003,"603":2005,"604":2009,"605":2012,"606":2015,"607":2018,"608":2021,"609":2023,"610":2027,"611":2029,"612":2032,"613":2036,"614":2038,"615":2042,"616":2045,"617":2048,"618":2051,"619":2054,"620":2056,"621":2061,"622":2064,"623":2067,"624":2068}	2026-02-23 17:32:31.210877+01	2026-01-20 12:04:10+01
1017	1	71	16	4	760	0	0	completed	{"824":2840,"825":2844,"826":2849,"827":2854,"828":2856,"829":2860,"830":2865,"831":2868,"832":2873,"833":2878,"834":2880,"835":2884,"836":2889,"837":2893,"838":2896,"839":2901,"840":2905,"841":2909,"842":2914,"843":2917}	2026-02-23 17:32:31.210877+01	2026-01-14 04:15:09+01
1023	1	70	38	9	2115	0	0	completed	{"777":2652,"778":2656,"779":2660,"780":2664,"781":2668,"782":2672,"783":2676,"784":2680,"785":2683,"786":2687,"787":2691,"788":2696,"789":2700,"790":2704,"791":2708,"792":2712,"793":2715,"794":2720,"795":2724,"796":2728,"797":2732,"798":2736,"799":2739,"800":2744,"801":2747,"802":2751,"803":2755,"804":2759,"805":2763,"806":2767,"807":2771,"808":2775,"809":2779,"810":2784,"811":2787,"812":2791,"813":2795,"814":2799,"815":2804,"816":2807,"817":2812,"818":2816,"819":2820,"820":2826,"821":2830,"822":2833,"823":2836}	2026-02-23 17:32:31.210877+01	2026-01-21 05:38:03+01
1152	91	47	0	1	16	0	0	abandoned	{"342":1083}	2026-02-23 11:17:07+01	2026-02-23 11:16:51+01
1158	92	70	44	3	1739	0	0	completed	{"777":2652,"778":2656,"779":2660,"780":2664,"781":2668,"782":2672,"783":2676,"784":2680,"785":2683,"786":2687,"787":2691,"788":2696,"789":2700,"790":2704,"791":2708,"792":2712,"793":2715,"794":2720,"795":2724,"796":2728,"797":2732,"798":2736,"799":2739,"800":2744,"801":2747,"802":2751,"803":2755,"804":2759,"805":2763,"806":2767,"807":2771,"808":2775,"809":2779,"810":2784,"811":2787,"812":2791,"813":2795,"814":2799,"815":2803,"816":2808,"817":2811,"818":2815,"819":2819,"820":2823,"821":2828,"822":2833,"823":2838}	2026-02-14 16:30:03+01	2026-02-14 16:01:04+01
1009	1	69	25	9	725	0	0	in_progress	{"727":2454,"728":2457,"729":2460,"730":2465,"731":2470,"732":2472,"733":2476,"734":2480,"735":2483,"737":2493,"752":2553,"753":2555,"754":2560,"755":2566,"756":2569,"757":2573,"758":2577,"759":2580,"760":2584,"761":2590,"762":2592,"763":2596,"764":2600,"765":2604,"766":2609,"767":2612,"768":2616,"769":2621,"770":2625,"771":2628,"772":2631,"774":2641,"775":2644,"776":2649}	2026-02-23 17:32:31.210877+01	2026-01-17 20:29:26+01
1150	91	37	7	3	530	0	0	completed	{"222":724,"223":726,"224":731,"225":734,"226":737,"227":738,"228":743,"229":745,"230":749,"231":750}	2026-02-20 07:18:00+01	2026-02-20 07:09:10+01
1160	91	33	9	1	410	0	0	completed	{"182":603,"183":606,"184":609,"185":612,"186":615,"187":618,"188":621,"189":624,"190":627,"191":632}	2026-02-18 22:31:03+01	2026-02-18 22:24:13+01
1167	91	101	16	4	1080	0	0	completed	{"1359":4672,"1360":4675,"1361":4679,"1362":4684,"1363":4688,"1364":4692,"1365":4695,"1366":4700,"1367":4704,"1368":4708,"1369":4712,"1370":4715,"1371":4720,"1372":4723,"1373":4727,"1374":4731,"1375":4734,"1376":4740,"1377":4745,"1378":4749}	2026-02-23 17:42:09.840125+01	2026-02-23 17:24:09.840125+01
1153	91	38	7	3	420	0	0	completed	{"232":753,"233":756,"234":759,"235":762,"236":766,"237":768,"238":771,"239":776,"240":778,"241":782}	2026-02-23 03:00:13+01	2026-02-23 02:53:13+01
1014	1	49	7	3	390	0	0	completed	{"362":1144,"363":1147,"364":1150,"365":1153,"366":1155,"367":1159,"368":1162,"369":1166,"370":1169,"371":1170}	2026-02-23 17:32:14.675237+01	2026-01-02 10:57:53+01
1028	1	47	7	3	470	0	0	completed	{"342":1085,"343":1087,"344":1090,"345":1093,"346":1097,"347":1099,"348":1103,"349":1104,"350":1107,"351":1112}	2026-02-23 17:32:14.675237+01	2025-11-07 02:39:04+01
1156	91	60	19	6	950	0	0	completed	{"600":1996,"601":2000,"602":2003,"603":2005,"604":2009,"605":2012,"606":2015,"607":2018,"608":2021,"609":2023,"610":2027,"611":2029,"612":2032,"613":2036,"614":2038,"615":2042,"616":2045,"617":2048,"618":2051,"619":2055,"620":2057,"621":2061,"622":2064,"623":2065,"624":2070}	2026-02-22 09:19:47+01	2026-02-22 09:03:57+01
1164	91	69	43	7	2850	0	0	completed	{"727":2452,"728":2456,"729":2460,"730":2464,"731":2468,"732":2473,"733":2476,"734":2480,"735":2484,"736":2489,"737":2491,"738":2496,"739":2500,"740":2504,"741":2509,"742":2513,"743":2517,"744":2520,"745":2524,"746":2530,"747":2532,"748":2538,"749":2540,"750":2546,"751":2547,"752":2553,"753":2555,"754":2560,"755":2564,"756":2569,"757":2573,"758":2577,"759":2580,"760":2584,"761":2590,"762":2592,"763":2596,"764":2601,"765":2604,"766":2609,"767":2612,"768":2616,"769":2621,"770":2625,"771":2628,"772":2631,"773":2635,"774":2641,"775":2644,"776":2649}	2026-02-21 18:53:56+01	2026-02-21 18:06:26+01
1170	91	31	27	3	1350	0	0	completed	{"142":484,"143":486,"144":490,"145":493,"146":496,"147":498,"148":501,"149":506,"150":508,"151":511,"152":515,"153":516,"154":520,"155":523,"156":525,"157":528,"158":531,"159":535,"160":537,"161":542,"162":543,"163":548,"164":549,"165":553,"166":556,"167":558,"168":562,"169":565,"170":569,"171":571}	2026-02-21 14:39:12+01	2026-02-21 14:16:42+01
1187	89	31	25	5	1020	0	0	completed	{"142":484,"143":486,"144":490,"145":493,"146":496,"147":498,"148":501,"149":506,"150":508,"151":511,"152":514,"153":516,"154":520,"155":523,"156":525,"157":528,"158":531,"159":535,"160":537,"161":542,"162":543,"163":548,"164":550,"165":554,"166":556,"167":558,"168":562,"169":565,"170":569,"171":571}	2025-07-10 03:18:46+02	2025-07-10 03:01:46+02
1194	93	36	8	2	500	0	0	completed	{"212":694,"213":697,"214":700,"215":702,"216":707,"217":710,"218":712,"219":715,"220":718,"221":720}	2026-02-04 23:31:50+01	2026-02-04 23:23:30+01
1025	1	56	25	5	1320	0	0	completed	{"482":1524,"483":1528,"484":1532,"485":1536,"486":1540,"487":1544,"488":1547,"489":1552,"490":1557,"491":1560,"492":1566,"493":1567,"494":1574,"495":1578,"496":1579,"497":1583,"498":1587,"499":1591,"500":1595,"501":1599,"502":1603,"503":1609,"504":1611,"505":1615,"506":1622,"507":1623,"508":1630,"509":1633,"510":1637,"511":1640}	2026-02-23 17:32:31.210877+01	2026-01-10 10:00:58+01
1196	93	99	1	1	18	0	0	abandoned	{"1320":4515,"1321":4519}	2026-02-23 17:20:34.87631+01	2026-02-23 17:20:16.87631+01
1204	93	98	9	1	310	0	0	in_progress	{"1299":4433,"1300":4435,"1301":4439,"1302":4444,"1303":4448,"1304":4452,"1305":4456,"1306":4460,"1307":4464,"1308":4466}	2026-02-23 18:23:12.313673+01	2026-02-23 18:18:02.313673+01
1214	93	35	8	2	560	0	0	completed	{"202":664,"203":666,"204":669,"205":672,"206":677,"207":679,"208":681,"209":684,"210":689,"211":692}	2026-02-11 05:43:28+01	2026-02-11 05:34:08+01
1220	94	35	8	2	430	0	0	completed	{"202":664,"203":666,"204":669,"205":672,"206":677,"207":679,"208":681,"209":684,"210":689,"211":691}	2025-12-10 06:37:48+01	2025-12-10 06:30:38+01
1230	95	40	8	2	380	0	0	completed	{"262":844,"263":847,"264":850,"265":853,"266":856,"267":860,"268":863,"269":866,"270":868,"271":871}	2025-10-30 12:34:38+01	2025-10-30 12:28:18+01
1231	95	31	3	1	17	0	0	abandoned	{"168":562,"169":565,"170":569,"171":570}	2025-08-06 09:57:56+02	2025-08-06 09:57:39+02
1157	91	77	23	7	1320	0	0	completed	{"1014":3430,"1015":3435,"1016":3438,"1017":3442,"1018":3445,"1019":3449,"1020":3454,"1021":3457,"1022":3463,"1023":3465,"1024":3471,"1025":3474,"1026":3477,"1027":3482,"1028":3487,"1029":3490,"1030":3494,"1031":3498,"1032":3502,"1033":3507,"1034":3511,"1035":3514,"1036":3518,"1037":3523,"1038":3527,"1039":3529,"1040":3535,"1041":3540,"1042":3543,"1043":3548}	2026-02-23 05:29:45+01	2026-02-23 05:07:45+01
1016	1	58	34	19	2491	0	0	completed	{"522":1683,"523":1689,"524":1691,"525":1696,"526":1699,"527":1704,"528":1707,"529":1712,"530":1717,"531":1720,"532":1724,"533":1729,"534":1733,"535":1735,"536":1741,"537":1747,"538":1749,"539":1752,"540":1757,"541":1762,"542":1765,"543":1769,"544":1774,"545":1776,"546":1781,"547":1785,"548":1790,"549":1792,"550":1796,"551":1803,"552":1807,"553":1811,"554":1814,"555":1819,"556":1822,"557":1827,"558":1829,"559":1832,"560":1837,"561":1840,"562":1846,"563":1849,"564":1852,"565":1859,"566":1863,"567":1867,"568":1871,"569":1873,"570":1878,"571":1883,"572":1884,"573":1891,"574":1893}	2026-02-23 17:32:11.060942+01	2025-10-09 14:10:58+02
1027	1	35	8	2	540	0	0	completed	{"202":664,"203":666,"204":669,"205":672,"206":677,"207":679,"208":681,"209":684,"210":688,"211":692}	2026-02-23 17:32:14.675237+01	2025-07-04 06:02:01+02
1161	91	34	8	2	440	0	0	completed	{"192":635,"193":638,"194":641,"195":643,"196":647,"197":649,"198":651,"199":654,"200":659,"201":661}	2026-02-22 10:55:40+01	2026-02-22 10:48:20+01
1168	91	58	4	2	13	0	0	abandoned	{"559":1832,"560":1837,"561":1840,"562":1846,"563":1850,"564":1855}	2026-02-20 06:28:24+01	2026-02-20 06:28:11+01
1179	89	95	15	5	1060	0	0	completed	{"1249":4261,"1250":4265,"1251":4268,"1252":4271,"1253":4274,"1254":4277,"1255":4279,"1256":4282,"1257":4286,"1258":4288,"1259":4292,"1260":4295,"1261":4298,"1262":4301,"1263":4304,"1264":4305,"1265":4310,"1266":4313,"1267":4315,"1268":4319}	2026-02-13 03:39:23+01	2026-02-13 03:21:43+01
1182	89	58	47	6	2809	0	0	completed	{"522":1683,"523":1689,"524":1691,"525":1696,"526":1699,"527":1704,"528":1707,"529":1712,"530":1717,"531":1720,"532":1724,"533":1729,"534":1733,"535":1735,"536":1741,"537":1747,"538":1749,"539":1752,"540":1757,"541":1762,"542":1765,"543":1769,"544":1774,"545":1776,"546":1781,"547":1785,"548":1790,"549":1792,"550":1799,"551":1801,"552":1805,"553":1810,"554":1812,"555":1816,"556":1820,"557":1826,"558":1830,"559":1832,"560":1837,"561":1840,"562":1846,"563":1849,"564":1852,"565":1856,"566":1860,"567":1864,"568":1869,"569":1875,"570":1876,"571":1882,"572":1885,"573":1891,"574":1893}	2025-09-23 13:08:08+02	2025-09-23 12:21:19+02
1186	89	40	8	2	400	0	0	completed	{"262":844,"263":847,"264":850,"265":853,"266":856,"267":860,"268":863,"269":866,"270":867,"271":871}	2025-11-19 16:52:12+01	2025-11-19 16:45:32+01
1192	93	34	9	1	320	0	0	completed	{"192":635,"193":638,"194":641,"195":643,"196":647,"197":649,"198":651,"199":654,"200":658,"201":661}	2026-02-16 04:30:20+01	2026-02-16 04:25:00+01
1199	93	71	16	4	1100	0	0	completed	{"824":2840,"825":2844,"826":2849,"827":2854,"828":2856,"829":2860,"830":2865,"831":2868,"832":2873,"833":2878,"834":2880,"835":2884,"836":2889,"837":2893,"838":2896,"839":2901,"840":2903,"841":2909,"842":2911,"843":2915}	2026-02-23 08:47:37+01	2026-02-23 08:29:17+01
1207	93	55	16	4	980	0	0	completed	{"462":1446,"463":1447,"464":1454,"465":1455,"466":1462,"467":1464,"468":1467,"469":1471,"470":1475,"471":1482,"472":1483,"473":1488,"474":1494,"475":1495,"476":1499,"477":1503,"478":1510,"479":1513,"480":1516,"481":1521}	2026-02-05 17:48:40+01	2026-02-05 17:32:20+01
1162	91	44	8	2	310	0	0	completed	{"302":964,"303":968,"304":970,"305":974,"306":976,"307":978,"308":982,"309":984,"310":987,"311":991}	2026-02-18 18:23:11.764143+01	2026-02-18 18:18:01.764143+01
1169	91	61	15	5	660	0	0	completed	{"625":2071,"626":2076,"627":2081,"628":2084,"629":2089,"630":2091,"631":2096,"632":2099,"633":2104,"634":2107,"635":2111,"636":2115,"637":2119,"638":2123,"639":2127,"640":2134,"641":2137,"642":2140,"643":2145,"644":2149}	2026-02-22 04:11:59+01	2026-02-22 04:00:59+01
1022	1	78	14	6	1140	0	0	completed	{"1044":3551,"1045":3554,"1046":3559,"1047":3562,"1048":3567,"1049":3571,"1050":3575,"1051":3579,"1052":3583,"1053":3586,"1054":3589,"1055":3594,"1056":3599,"1057":3603,"1058":3608,"1059":3609,"1060":3616,"1061":3620,"1062":3622,"1063":3625}	2026-02-23 17:32:14.675237+01	2025-10-18 06:35:04+02
1038	1	70	31	16	1739	0	0	completed	{"777":2652,"778":2656,"779":2660,"780":2664,"781":2668,"782":2672,"783":2676,"784":2680,"785":2683,"786":2687,"787":2691,"788":2696,"789":2700,"790":2704,"791":2708,"792":2712,"793":2715,"794":2720,"795":2724,"796":2728,"797":2732,"798":2736,"799":2739,"800":2744,"801":2747,"802":2751,"803":2755,"804":2759,"805":2763,"806":2767,"807":2771,"808":2776,"809":2780,"810":2785,"811":2788,"812":2792,"813":2796,"814":2800,"815":2806,"816":2810,"817":2812,"818":2818,"819":2820,"820":2825,"821":2829,"822":2833,"823":2836}	2026-02-23 17:32:14.675237+01	2025-10-05 06:57:59+02
1177	91	45	17	3	660	0	0	completed	{"312":995,"313":998,"314":1001,"315":1003,"316":1005,"317":1010,"318":1013,"319":1016,"320":1019,"321":1021,"322":1025,"323":1028,"324":1029,"325":1034,"326":1037,"327":1038,"328":1042,"329":1044,"330":1048,"331":1051}	2026-02-22 14:34:17+01	2026-02-22 14:23:17+01
1188	89	98	18	2	820	0	0	completed	{"1299":4433,"1300":4435,"1301":4439,"1302":4444,"1303":4448,"1304":4452,"1305":4456,"1306":4460,"1307":4464,"1308":4468,"1309":4471,"1310":4475,"1311":4479,"1312":4483,"1313":4486,"1314":4491,"1315":4496,"1316":4501,"1317":4505,"1318":4506}	2026-02-23 18:31:42.25337+01	2026-02-23 18:18:02.25337+01
1163	91	59	19	6	1000	0	0	completed	{"575":1898,"576":1903,"577":1904,"578":1908,"579":1913,"580":1916,"581":1920,"582":1925,"583":1928,"584":1933,"585":1936,"586":1941,"587":1945,"588":1949,"589":1952,"590":1957,"591":1961,"592":1964,"593":1968,"594":1972,"595":1976,"596":1982,"597":1985,"598":1991,"599":1993}	2026-02-20 22:41:40+01	2026-02-20 22:25:00+01
1024	1	60	21	4	950	0	0	completed	{"600":1996,"601":2000,"602":2003,"603":2005,"604":2009,"605":2012,"606":2015,"607":2018,"608":2021,"609":2023,"610":2027,"611":2029,"612":2032,"613":2036,"614":2038,"615":2042,"616":2045,"617":2048,"618":2051,"619":2054,"620":2056,"621":2061,"622":2063,"623":2067,"624":2070}	2026-02-23 17:32:14.675237+01	2025-08-27 03:41:39+02
1037	1	45	15	5	1020	0	0	completed	{"312":995,"313":998,"314":1001,"315":1003,"316":1005,"317":1010,"318":1013,"319":1016,"320":1019,"321":1021,"322":1025,"323":1028,"324":1029,"325":1034,"326":1035,"327":1039,"328":1042,"329":1046,"330":1049,"331":1051}	2026-02-23 17:32:14.675237+01	2025-12-03 00:27:15+01
1033	1	61	13	7	880	0	0	completed	{"625":2071,"626":2076,"627":2081,"628":2084,"629":2089,"630":2091,"631":2096,"632":2099,"633":2104,"634":2107,"635":2111,"636":2115,"637":2119,"638":2125,"639":2128,"640":2133,"641":2136,"642":2140,"643":2144,"644":2149}	2026-02-23 17:32:14.675237+01	2025-10-22 03:41:30+02
1039	1	73	31	9	1320	0	0	completed	{"864":2980,"865":2982,"866":2986,"867":2989,"868":2992,"869":2995,"870":2998,"871":3001,"872":3003,"873":3006,"874":3010,"875":3012,"876":3017,"877":3020,"878":3021,"879":3026,"880":3029,"881":3032,"882":3034,"883":3037,"884":3039,"885":3042,"886":3046,"887":3050,"888":3051,"889":3054,"890":3058,"891":3060,"892":3063,"893":3066,"894":3069,"895":3072,"896":3075,"897":3078,"898":3082,"899":3084,"900":3089,"901":3092,"902":3093,"903":3098}	2026-02-23 17:32:14.675237+01	2025-10-08 18:23:21+02
1165	91	56	14	5	255	0	0	in_progress	{"482":1524,"483":1528,"484":1532,"485":1536,"486":1540,"487":1544,"488":1547,"492":1566,"493":1567,"494":1572,"495":1577,"496":1581,"497":1586,"501":1602,"507":1623,"508":1630,"509":1633,"510":1637,"511":1640}	2026-02-18 19:56:32+01	2026-02-18 19:52:17+01
1171	89	99	8	1	260	0	0	in_progress	{"1320":4515,"1321":4520,"1322":4525,"1323":4527,"1324":4532,"1325":4536,"1326":4538,"1327":4544,"1328":4548}	2026-02-23 17:24:36.87631+01	2026-02-23 17:20:16.87631+01
1176	89	96	9	1	450	0	0	completed	{"1269":4322,"1270":4325,"1271":4326,"1272":4331,"1273":4332,"1274":4336,"1275":4340,"1276":4343,"1277":4344,"1278":4348}	2026-02-11 13:37:06.551651+01	2026-02-11 13:29:36.551651+01
1166	91	94	15	5	1120	0	0	completed	{"1229":4201,"1230":4205,"1231":4207,"1232":4209,"1233":4214,"1234":4215,"1235":4220,"1236":4221,"1237":4225,"1238":4229,"1239":4232,"1240":4235,"1241":4238,"1242":4241,"1243":4244,"1244":4247,"1245":4250,"1246":4253,"1247":4256,"1248":4259}	2026-02-19 03:48:28+01	2026-02-19 03:29:48+01
1175	89	39	15	5	960	0	0	completed	{"242":783,"243":787,"244":789,"245":792,"246":797,"247":798,"248":801,"249":804,"250":807,"251":810,"252":813,"253":818,"254":819,"255":822,"256":825,"257":830,"258":833,"259":836,"260":839,"261":841}	2026-02-13 08:19:25+01	2026-02-13 08:03:25+01
1183	89	36	4	1	145	0	0	in_progress	{"212":694,"213":697,"214":700,"215":702,"216":706}	2025-11-11 05:59:49+01	2025-11-11 05:57:24+01
1036	1	59	23	2	1225	0	0	completed	{"575":1899,"576":1903,"577":1904,"578":1908,"579":1913,"580":1916,"581":1920,"582":1925,"583":1928,"584":1933,"585":1936,"586":1941,"587":1945,"588":1949,"589":1952,"590":1957,"591":1961,"592":1964,"593":1968,"594":1972,"595":1976,"596":1981,"597":1987,"598":1989,"599":1992}	2026-02-23 17:32:14.675237+01	2025-07-07 08:59:03+02
1172	91	95	16	4	660	0	0	completed	{"1249":4261,"1250":4265,"1251":4268,"1252":4271,"1253":4274,"1254":4277,"1255":4279,"1256":4282,"1257":4286,"1258":4288,"1259":4292,"1260":4295,"1261":4298,"1262":4301,"1263":4304,"1264":4307,"1265":4308,"1266":4311,"1267":4315,"1268":4319}	2026-02-18 18:29:01.764143+01	2026-02-18 18:18:01.764143+01
1178	89	61	15	5	680	0	0	completed	{"625":2071,"626":2076,"627":2081,"628":2084,"629":2089,"630":2091,"631":2096,"632":2099,"633":2104,"634":2107,"635":2111,"636":2115,"637":2119,"638":2123,"639":2127,"640":2134,"641":2138,"642":2142,"643":2145,"644":2148}	2025-08-29 09:01:29+02	2025-08-29 08:50:09+02
1041	1	37	6	4	550	0	0	completed	{"222":724,"223":726,"224":731,"225":734,"226":737,"227":738,"228":741,"229":744,"230":748,"231":750}	2026-02-23 17:32:14.675237+01	2025-08-08 02:46:22+02
1174	89	44	8	2	520	0	0	completed	{"302":964,"303":968,"304":970,"305":974,"306":976,"307":978,"308":982,"309":984,"310":987,"311":992}	2025-08-27 00:02:45+02	2025-08-26 23:54:05+02
1040	1	77	26	4	1260	0	0	completed	{"1014":3430,"1015":3435,"1016":3438,"1017":3442,"1018":3445,"1019":3449,"1020":3454,"1021":3457,"1022":3463,"1023":3465,"1024":3471,"1025":3474,"1026":3477,"1027":3482,"1028":3487,"1029":3490,"1030":3494,"1031":3498,"1032":3502,"1033":3507,"1034":3511,"1035":3514,"1036":3518,"1037":3524,"1038":3528,"1039":3530,"1040":3533,"1041":3537,"1042":3543,"1043":3546}	2026-02-23 17:32:14.675237+01	2025-12-14 03:08:54+01
\.


--
-- Data for Name: system_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_configs (id, key, value, description, created_at, updated_at) FROM stdin;
1	ai_requests_per_month	5	Número máximo de tests generados por IA por mes para usuarios gratuitos	2026-01-10 13:06:29.864827+01	2026-02-09 19:48:21.445137+01
2	mark_in_progress_as_abandoned_after_days	30	Marcar resultados como abandoned después de (days). No aplicado!	2026-01-15 19:40:19.232988+01	2026-02-09 19:50:09.384434+01
\.


--
-- Data for Name: test_invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_invitations (id, test_id, invited_by, message, token, is_used, is_guest, guest_user_id, expires_at, created_at) FROM stdin;
22	96	5		a6499f767877a3676c7a91d864a40dc8fea4d6e52f130254db5903119f5cfca4	f	f	\N	2026-02-27 15:06:43.237197+01	2026-02-20 15:06:43.237414+01
21	94	5		998da94a970a3b9d31bb9cb527506412b27981a3d7a114e2046135317e337027	t	t	86	2026-02-27 15:05:12.090789+01	2026-02-20 15:05:12.091067+01
20	93	5	A ver que tal con este	b87eaabdbd28f48b4217f337d303605fad4d6bce4e6672a49bbf3e30aff7e92a	t	t	85	2026-02-27 09:36:24.203348+01	2026-02-20 09:36:24.203564+01
19	91	1		ffdea48322093548dca85e873f4be0f72a98aab195fb00aa93fdb6a0c5a5b9ee	t	t	\N	2026-02-19 09:23:52.217875+01	2026-02-12 09:23:52.218078+01
\.


--
-- Data for Name: tests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tests (id, title, description, created_by, created_at, category, level, main_topic, sub_topic, specific_topic, is_active, updated_at) FROM stdin;
90	Advanced English: Nuances of Questioning and Responding	A test for advanced learners focusing on the subtleties, formality, idiomatic usage, and grammatical precision in forming questions and responses in English.	5	2026-01-22 14:07:28.264526+01	\N	Avanzado	Idiomas (Inglés)	Gramática	Modales y Phrasal Verbs	t	2026-01-22 14:07:28.263788+01
94	Crítica Literaria: Un Enfoque Profundo	Prueba tus conocimientos sobre crítica literaria y analiza textos literarios de manera efectiva.	59	2026-02-10 00:08:29.235869+01	\N	Intermedio	Literatura	Géneros Literarios	Crítica Literaria	t	2026-02-10 00:08:29.236294+01
97	La Nueva Carta Magna Complutense: Adaptación Normativa y Proceso de Reforma	Evalúa tus conocimientos sobre el contexto legal, la aprobación y los principios fundamentales que dieron origen a los Estatutos de 2017 de la UCM.	5	2026-02-23 17:17:25.740036+01	\N	Intermedio	Derecho	Derecho Administrativo	Régimen Jurídico de Universidades Públicas	t	2026-02-23 17:17:25.739652+01
98	Gobierno y Representación: La Estructura de Poder en la UCM	Pon a prueba tu comprensión sobre los órganos de gobierno unipersonales y colegiados, sus funciones y relaciones dentro de la Universidad Complutense.	5	2026-02-23 17:18:50.866837+01	\N	Intermedio	Derecho	Derecho Administrativo	Organización y Gobierno de Universidades Públicas	t	2026-02-23 17:18:50.866488+01
99	El Personal al Servicio de la UCM: Funcionarios, Contratados y su Estatuto Jurídico	Demuestra tu conocimiento sobre las distintas figuras de Personal Docente e Investigador (PDI) y de Administración y Servicios (PAS), sus derechos, deberes y regímenes de acceso.	5	2026-02-23 17:20:16.87631+01	\N	Intermedio	Derecho	Derecho Administrativo	Empleo Público Universitario	t	2026-02-23 17:20:16.876026+01
100	Estructura Académica y Centros: Organizando la Docencia y la Investigación	Comprueba lo que sabes sobre los diferentes tipos de centros (Facultades, Departamentos, Institutos), su naturaleza, funciones y cómo se integran en la UCM.	5	2026-02-23 17:21:12.467562+01	\N	Intermedio	Derecho	Derecho Administrativo	Organización Universitaria	t	2026-02-23 17:21:12.467257+01
101	Derechos, Deberes y Disciplina: La Comunidad Universitaria en Acción	Evalúa tu comprensión sobre los derechos y deberes de los estudiantes, el papel del Defensor Universitario, el régimen disciplinario y los principios éticos que rigen la UCM.	5	2026-02-23 17:24:09.840125+01	\N	Intermedio	Derecho	Derecho Administrativo	Estatuto de la Comunidad Universitaria	t	2026-02-23 17:24:09.839779+01
33	Test de Biología: Célula y Metabolismo	Prueba tus conocimientos sobre la estructura y función de las células, así como el proceso de metabolismo.	5	2025-04-24 13:43:00.600468+02	\N	Principiante	Ciencias Naturales	Biología	Célula y Metabolismo	t	2025-12-18 00:00:00+01
31	Historia del Fútbol Español	Test educativo sobre los hitos más importantes del fútbol en España	5	2025-04-29 01:51:06.946068+02	\N	Intermedio	Deportes	Fútbol	Historia Fútbol Español	t	2026-01-20 13:39:49.653336+01
91	Etología Felina: Conductas y Costumbres de los Gatos Domésticos	Test de conocimiento experto sobre el comportamiento, comunicación y hábitos íntimos de los gatos domésticos, basado en la observación prolongada de convivencia.	5	2026-02-04 00:41:41.246631+01	\N	Avanzado	Ciencias Naturales	Biología	Evolución y Biodiversidad	t	2026-02-04 00:41:41.24609+01
34	Pruebas de Crítica Literaria	Este test evalúa tus conocimientos sobre los géneros literarios y la crítica literaria.	5	2025-02-20 23:58:06.274068+01	\N	Principiante	Literatura	Géneros Literarios	Crítica Literaria	t	2025-12-18 00:00:00+01
35	Test de Cálculo Multivariable: Intermedio	Prueba tus conocimientos en Cálculo Multivariable con este test intermedio	5	2025-07-28 14:40:56.126868+02	\N	Intermedio	Matemáticas	Cálculo	Cálculo Multivariable	t	2025-12-18 00:00:00+01
36	Test de Contabilidad Nacional Avanzado	Prueba tus conocimientos sobre Contabilidad Nacional, un tema clave en Macroeconomía.	5	2025-02-19 18:38:08.885268+01	\N	Avanzado	Economía	Macroeconomía	Contabilidad Nacional	t	2025-12-18 00:00:00+01
40	Prueba sobre Célula y Metabolismo para Principiantes	Esta prueba evalúa tu conocimiento sobre la estructura y funciones de la célula, así como sobre el metabolismo celular.	5	2025-07-23 01:16:09.586068+02	\N	Principiante	Ciencias Naturales	Biología	Célula y Metabolismo	t	2025-12-19 00:00:00+01
42	Test de Óptica y Ondas	Aprende sobre la reflexión, refracción y propagación de la luz y ondas en este test de principiante.	5	2025-09-01 01:54:34.133268+02	\N	Principiante	Ciencias Naturales	Física	Óptica y Ondas	t	2025-12-20 00:00:00+01
43	Evolución y Biodiversidad: Un Viaje a Través del Tiempo	Prueba tus conocimientos sobre la evolución y biodiversidad en la Tierra.	5	2025-04-21 03:38:26.510868+02	\N	Principiante	Ciencias Naturales	Biología	Evolución y Biodiversidad	t	2025-12-20 00:00:00+01
44	Test de Expresiones Cotidianas en Francés	Prueba tus conocimientos de vocabulario y expresas cotidianas en francés para principiantes	5	2025-07-07 02:49:07.051668+02	\N	Principiante	Idiomas (Francés)	Vocabulario	Expresiones Cotidianas	t	2025-12-20 00:00:00+01
49	Prueba de Bases de Datos NoSQL	Aprende sobre las bases de datos NoSQL y sus características principales.	5	2025-07-11 03:06:46.056468+02	\N	Principiante	Ciencias de la Computación	Bases de Datos	Bases de Datos NoSQL	t	2025-12-20 00:00:00+01
47	Test de la Historia del Imperio Británico	Un test de 10 preguntas sobre la historia del Imperio Británico	5	2025-02-08 00:28:15.662868+01	\N	Intermedio	Historia	Historia Moderna (siglos XV-XVIII)	Imperialismo y Colonialismo	t	2025-12-20 00:00:00+01
55	Personajes Históricos en Medicina: Un Test de Héroes de la Salud	Prueba tus conocimientos sobre personajes históricos que revolucionaron la medicina.	5	2025-07-01 01:51:45.480468+02	\N	Intermedio	Historia	Historia Moderna (siglos XV-XVIII)	Avances Médicos en la Historia	t	2025-12-20 00:00:00+01
58	Test Avanzado sobre la Segunda Guerra Mundial: Personajes, Eventos y Estrategias	Un test exhaustivo de 53 preguntas diseñado para evaluar conocimientos profundos sobre la Segunda Guerra Mundial, incluyendo figuras clave, batallas decisivas, conferencias, tecnología y consecuencias geopolíticas.	5	2025-07-09 11:50:33.710868+02	\N	Avanzado	Historia	Historia Contemporánea	Guerras Mundiales	t	2025-12-21 00:00:00+01
37	Derechos Fundamentales: Test Avanzado	Este test evalúa su conocimiento sobre los derechos fundamentales en el ámbito del derecho constitucional. Asegúrese de responder con la precisión necesaria.	5	2025-05-09 16:01:36.600468+02	\N	Avanzado	Derecho	Derecho Constitucional	Derechos Fundamentales	t	2025-12-18 00:00:00+01
71	Introducción a los Estatutos de la Fundación General de la UCM	Test de nivel principiante-intermedio sobre los aspectos básicos de la estructura, fines y gobierno de la Fundación General de la UCM según sus estatutos.	5	2025-04-27 15:19:27.672468+02	\N	Principiante	Derecho	Derecho Administrativo	Régimen Local y Entidades Públicas	t	2026-01-09 17:38:52.374687+01
70	Estatutos de la Fundación General de la UCM: Análisis Avanzado y Aplicación	Test de nivel avanzado que evalúa el conocimiento profundo de los Estatutos, su interpretación, interrelaciones entre artículos y aplicación en escenarios complejos.	5	2025-11-01 21:46:57.653268+01	\N	Avanzado	Derecho	Derecho Administrativo	Régimen Local y Entidades Públicas	t	2026-01-09 17:39:55.327817+01
73	Test sobre el Imperio Romano	Prueba tu conocimiento sobre la historia del Imperio Romano	5	2025-04-16 16:00:58.066068+02	\N	Principiante	Historia	Historia Antigua	Imperio Romano	t	2026-01-12 00:20:27.379059+01
77	El Imperio Romano: Sociedad, Política y Legado	Test de nivel intermedio sobre el Imperio Romano, abarcando desde su fundación y expansión hasta su crisis y legado cultural y político.	5	2025-03-11 00:03:44.270868+01	\N	Intermedio	Historia	Historia Antigua	Roma Republicana e Imperial	t	2026-01-12 00:36:10.636188+01
78	Parts of the Body: Basic English Vocabulary	A beginner-level test on basic human body parts vocabulary in English, including common terms and their simple functions.	5	2025-02-16 07:23:23.227668+01	\N	Principiante	Idiomas (Inglés)	Vocabulario	Palabras Comunes (1000 más usadas)	t	2026-01-12 00:39:29.807108+01
45	Descubrimientos Geográficos: Un Viaje por la Historia	Prueba tus conocimientos sobre los descubrimientos geográficos en la Historia Moderna	5	2025-12-17 02:31:29.602068+01	\N	Principiante	Historia	Historia Moderna (siglos XV-XVIII)	Descubrimientos Geográficos	t	2026-01-21 13:16:37.758491+01
95	Teatro y Dramaturgia: Un Recorrido por la Literatura	Prueba tus conocimientos sobre el género de la literatura que nos permite experimentar la emoción de la actuación y la creación de mundos imaginarios.	1	2026-02-10 21:49:38.936122+01	\N	Principiante	Literatura	Géneros Literarios	Teatro y Dramaturgia	t	2026-02-11 17:54:26.885198+01
38	Test de Historia de los Juegos Olímpicos	Aprende sobre la historia de los Juegos Olímpicos y sus momentos más destacados	5	2025-07-27 09:50:37.109268+02	\N	Principiante	Deportes	Deportes Olímpicos	Historia de los Juegos Olímpicos	t	2025-12-19 00:00:00+01
39	Prueba Avanzada de CSS	Comprende conceptos avanzados de CSS y demuestra tus habilidades	5	2025-09-30 04:13:40.027668+02	\N	Avanzado	Ciencias de la Computación	Desarrollo Web	HTML y CSS	t	2025-12-19 00:00:00+01
48	Test de Macroeconomía: Modelo Keynesiano	Comprende los principios básicos del Modelo Keynesiano y sus aplicaciones en la economía real.	5	2025-09-27 23:20:23.544468+02	\N	Intermedio	Economía	Macroeconomía	Modelo Keynesiano	t	2025-12-20 00:00:00+01
60	Test de Autocompletado - Inglés Nivel Intermedio	Un test de autocompletado para estudiantes de inglés de nivel intermedio. Cada pregunta presenta una frase con un espacio en blanco que debe completarse con la opción correcta entre tres posibles.	5	2025-09-13 06:45:42.053268+02	\N	Intermedio	Idiomas (Inglés)	Comprensión	Contexto y Cohesión	t	2025-12-21 00:00:00+01
61	Test sobre Actores Estadounidenses Contemporáneos (2000-Actualidad)	Actores y actrices estadounidenses que han destacado en el cine contemporáneo desde el año 2000. Incluye preguntas sobre filmografía, premios y datos biográficos relevantes.	5	2025-01-31 06:01:43.397268+01	\N	Intermedio	Cultura General	Cine y Teatro	Directores y Actores	t	2025-12-21 00:00:00+01
59	Test Avanzado de Phrasal Verbs para Certificación C1	Un test diseñado para evaluar el dominio de phrasal verbs complejos y polisémicos, esencial para aspirantes a certificaciones de nivel C1 de inglés.	5	2025-11-20 20:24:24.859668+01	\N	Avanzado	Idiomas (Inglés)	Gramática	Modales y Phrasal Verbs	t	2025-12-28 00:00:00+01
65	Upper-Intermediate Body Parts Vocabulary	A C1-level test focusing on precise, idiomatic, and less common vocabulary related to the human body.	5	2026-01-05 11:44:24.178068+01	\N	Avanzado	Idiomas (Inglés)	Vocabulario	Partes del cuerpo (vocabulario avanzado)	t	2025-12-29 00:00:00+01
56	Test de Regresión y Correlación: Avance en Estadística	Este test evalúa tus conocimientos sobre regresión y correlación, fundamentales en estadística.	5	2025-01-28 06:16:34.958868+01	\N	Intermedio	Matemáticas	Estadística	Regresión y Correlación	t	2025-12-29 19:58:24.435304+01
69	Estatutos de la Fundación General de la Universidad Complutense de Madrid: Test de Conocimientos	Test de nivel medio sobre la estructura, gobierno, fines y régimen económico de la Fundación General de la UCM según sus estatutos.	5	2025-11-19 05:18:57.490068+01	\N	Intermedio	Derecho	Derecho Administrativo	Régimen Local y Entidades Públicas	f	2026-01-21 19:23:35.79755+01
93	Prueba de conocimientos sobre Macronutrientes	Evalúa tus conocimientos sobre los macronutrientes y cómo interactúan con tu cuerpo.	5	2026-02-07 20:06:10.768053+01	\N	Intermedio	Ciencias de la Salud	Nutrición	Macronutrientes	t	2026-02-07 20:06:10.768478+01
96	Prueba de Psicología Cognitiva: Memoria y Atención	Prueba de nivel Avanzado para evaluar la comprensión de conceptos relacionados con la memoria y la atención en la psicología cognitiva.	1	2026-02-11 13:29:36.551651+01	\N	Avanzado	Psicología	Psicología Cognitiva	Memoria y Atención	t	2026-02-11 17:54:26.885198+01
\.


--
-- Data for Name: topics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.topics (id, main_topic, sub_topic, specific_topic, is_predefined) FROM stdin;
1	Ciencias de la Computación	Desarrollo Web	HTML y CSS	t
2	Idiomas (Francés)	Vocabulario	Expresiones Cotidianas	t
3	Literatura	Géneros Literarios	Crítica Literaria	t
4	Idiomas (Inglés)	Vocabulario	Partes del cuerpo (vocabulario avanzado)	t
5	Historia	Historia Moderna (siglos XV-XVIII)	Imperialismo y Colonialismo	t
6	Ciencias Naturales	Biología	Evolución y Biodiversidad	t
7	Historia	Historia Contemporánea	Guerras Mundiales	t
8	Idiomas (Inglés)	Comprensión	Contexto y Cohesión	t
9	Ciencias Naturales	Biología	Célula y Metabolismo	t
10	Historia	Historia Antigua	Imperio Romano	t
11	Historia	Historia Antigua	Roma Republicana e Imperial	t
12	Economía	Macroeconomía	Modelo Keynesiano	t
13	Literatura	Géneros Literarios	Teatro y Dramaturgia	t
14	Ciencias Naturales	Física	Óptica y Ondas	t
15	Idiomas (Inglés)	Vocabulario	Palabras Comunes (1000 más usadas)	t
16	Matemáticas	Estadística	Regresión y Correlación	t
17	Economía	Macroeconomía	Contabilidad Nacional	t
19	Matemáticas	Cálculo	Cálculo Multivariable	t
21	Idiomas (Inglés)	Gramática	Modales y Phrasal Verbs	t
22	Derecho	Derecho Constitucional	Derechos Fundamentales	t
24	Historia	Historia Moderna (siglos XV-XVIII)	Avances Médicos en la Historia	t
25	Ciencias Naturales	Geología y Astronomía	El espacio y astronomía	t
26	Deportes	Deportes Olímpicos	Historia de los Juegos Olímpicos	t
27	Ciencias de la Computación	Bases de Datos	Bases de Datos NoSQL	t
28	Cultura General	Cine y Teatro	Directores y Actores	t
29	Deportes	Fútbol	Historia Fútbol Español	t
30	Tecnología	Inteligencia Artificial	Aprendizaje Supervisado	t
31	Tecnología	Inteligencia Artificial	Redes Neuronales	t
32	Tecnología	Inteligencia Artificial	Ética en IA	t
33	Tecnología	Ciberseguridad	Criptografía Básica	t
34	Tecnología	Ciberseguridad	Ataques Informáticos	t
35	Tecnología	Ciberseguridad	Seguridad en Redes	t
36	Tecnología	Sistemas Operativos	Gestión de Procesos	t
37	Tecnología	Sistemas Operativos	Memoria Virtual	t
38	Tecnología	Sistemas Operativos	Sistemas de Archivos	t
39	Filosofía	Filosofía Antigua	Sócrates y el Método Mayéutico	t
40	Filosofía	Filosofía Antigua	Platón y el Mundo de las Ideas	t
41	Filosofía	Filosofía Antigua	Aristóteles y la Lógica	t
42	Filosofía	Filosofía Moderna	Racionalismo Cartesiano	t
43	Filosofía	Filosofía Moderna	Empirismo de Locke	t
44	Filosofía	Filosofía Moderna	Kant y el Idealismo	t
45	Filosofía	Ética	Ética de la Virtud	t
46	Filosofía	Ética	Utilitarismo	t
47	Filosofía	Ética	Deontología	t
48	Psicología	Psicología Cognitiva	Memoria y Atención	t
49	Psicología	Psicología Cognitiva	Lenguaje y Pensamiento	t
50	Psicología	Psicología Cognitiva	Resolución de Problemas	t
51	Psicología	Psicología Social	Influencia Social	t
52	Psicología	Psicología Social	Percepción Social	t
53	Psicología	Psicología Social	Conducta de Grupo	t
54	Psicología	Psicología Clínica	Trastornos de Ansiedad	t
55	Psicología	Psicología Clínica	Depresión	t
56	Psicología	Psicología Clínica	Terapias Psicológicas	t
57	Ciencias de la Salud	Anatomía	Sistema Nervioso	t
58	Ciencias de la Salud	Anatomía	Sistema Digestivo	t
59	Ciencias de la Salud	Anatomía	Sistema Cardiovascular	t
60	Ciencias de la Salud	Nutrición	Macronutrientes	t
61	Ciencias de la Salud	Nutrición	Micronutrientes	t
62	Ciencias de la Salud	Nutrición	Dietas Saludables	t
63	Ciencias de la Salud	Salud Pública	Prevención de Enfermedades	t
64	Ciencias de la Salud	Salud Pública	Epidemiología Básica	t
65	Ciencias de la Salud	Salud Pública	Vacunación	t
18	Derecho	Derecho Administrativo	Régimen Local y Entidades Públicas	t
23	Historia	Historia Moderna (siglos XV-XVIII)	Descubrimientos Geográficos	t
86	Derecho	Derecho Administrativo	Régimen Jurídico de Universidades Públicas	f
87	Derecho	Derecho Administrativo	Organización y Gobierno de Universidades Públicas	f
88	Derecho	Derecho Administrativo	Empleo Público Universitario	f
89	Derecho	Derecho Administrativo	Organización Universitaria	f
90	Derecho	Derecho Administrativo	Estatuto de la Comunidad Universitaria	f
\.


--
-- Data for Name: user_quota; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_quota (id, user_id, month_year, max_requests, used_requests, created_at, updated_at) FROM stdin;
19	5	2026-02	6	1	2026-02-07 20:05:42.071653+01	2026-02-12 19:57:23.361616+01
17	5	2026-01	100	40	2026-01-10 13:50:55.353928+01	2026-02-12 23:49:45.903527+01
20	59	2026-02	5	1	2026-02-09 23:18:29.668819+01	2026-02-10 00:08:26.569439+01
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, role, registered_at, first_name, last_name, phone, address, birth_date, country, login_at, register_at, deleted_at) FROM stdin;
1	tfdu	tfdu@angotest.com	$2a$10$eSvdprVQWZB2tXGjhXDCrurrfAuRxMb8Uht3jYjf9caNP0R/KCNdW	admin	2026-02-10 18:55:35.312024+01	tfdu	tfdu			2007-03-22	España	2026-02-20 14:36:08.639721+01	\N	\N
85	guest_20260220093642_20	guest_20260220093642_20@guest.temp	$2a$10$ckx0tSF0hdiHEPdbvSW9HuBgbtQjry08Z9C/5kpYGkjHnB7MJExye	guest	2026-02-20 09:36:42.553592+01	Invitado				2008-02-20		2026-02-21 12:11:08.781381+01	\N	\N
5	admin	admin@angotest.com	$2a$10$Zd7pFn1AbdppDeaau8kVIeYNPgclpLNvCuqijysQjF1mwDABnnC.a	admin	2025-12-08 18:41:53.111346+01	Admin	-			0001-01-01	España	2026-02-23 16:43:31.168315+01	\N	\N
87	user10	user10@angotest.com	$2a$10$0aK9pA9lX0DlK5uF0eQAAOkQWdA2rtT1zPKLixw98TMixn.2IJ0c2	user	2026-02-04 18:18:01.752349+01	Francisco	García	+34 65 157 294	Calle Nueva 7, Reino Unido	1986-08-15	Reino Unido	\N	\N	\N
89	user3	user3@angotest.com	$2a$10$0aK9pA9lX0DlK5uF0eQAAOkQWdA2rtT1zPKLixw98TMixn.2IJ0c2	user	2025-07-04 18:18:01.761141+02	David	Ortiz	+34 63 722 345	Calle Real 105, Alemania	1996-12-22	Alemania	\N	\N	\N
91	user7	user7@angotest.com	$2a$10$0aK9pA9lX0DlK5uF0eQAAOkQWdA2rtT1zPKLixw98TMixn.2IJ0c2	user	2026-02-18 18:18:01.764143+01	Ana	Alonso	+34 65 588 308	Calle Alcalá 111, Francia	1977-03-11	Francia	\N	\N	\N
92	user2	user2@angotest.com	$2a$10$0aK9pA9lX0DlK5uF0eQAAOkQWdA2rtT1zPKLixw98TMixn.2IJ0c2	user	2026-01-21 18:18:01.766248+01	Isabel	Gómez	+34 62 499 101	Calle Real 35, Alemania	1963-06-11	Alemania	\N	\N	\N
94	user4	user4@angotest.com	$2a$10$0aK9pA9lX0DlK5uF0eQAAOkQWdA2rtT1zPKLixw98TMixn.2IJ0c2	user	2025-09-16 18:18:01.772331+02	Jorge	Gil	+34 67 862 008	Calle Sol 116, Francia	1975-04-30	Francia	\N	\N	\N
95	user9	user9@angotest.com	$2a$10$0aK9pA9lX0DlK5uF0eQAAOkQWdA2rtT1zPKLixw98TMixn.2IJ0c2	user	2025-07-28 18:18:01.772368+02	Cristina	Domínguez	+34 69 749 163	Calle Real 172, Colombia	1987-09-29	Colombia	\N	\N	\N
96	jaterli	jaterli@hotmail.com	$2a$10$s3cI4AxtiGVdJ7fLAADVOOEQ1y9Fi/VfAdDel9x7felRIgb0CZL1a	user	2026-02-23 18:24:59.933501+01	Jaime	TLL	655889977		2000-10-10	España	2026-02-23 18:25:54.477302+01	\N	\N
86	guest_20260220151043_21	guest_20260220151043_21@guest.temp	$2a$10$5lqZBesp2kx8MJAMwVidvOAf44R/MLhh.GRfIs1q4drYt9tzCgzq6	guest	2026-02-20 15:10:43.367906+01	Invitado				2008-02-20		2026-02-20 15:10:43.428559+01	\N	\N
59	user1	user1@angotest.com	$2a$10$Rsd/p2xQJP4ab4IiSMwXAeagfyZMGy5LbwYfhAVtNkS2PluOP/rcW	user	2026-01-07 09:42:39.272476+01	Pedro	Navarro	+1(469)833-8907	Calle Sol 109, Alemania	1989-09-11	Alemania	2026-02-21 13:42:40.020154+01	\N	\N
88	user6	user6@angotest.com	$2a$10$0aK9pA9lX0DlK5uF0eQAAOkQWdA2rtT1zPKLixw98TMixn.2IJ0c2	user	2025-09-06 18:18:01.756936+02	Juan	Torres	+34 65 244 351	Calle Gran Vía 45, Francia	1967-07-26	Francia	\N	\N	\N
90	user5	user5@angotest.com	$2a$10$0aK9pA9lX0DlK5uF0eQAAOkQWdA2rtT1zPKLixw98TMixn.2IJ0c2	user	2025-09-16 18:18:01.76182+02	Raquel	Morales	+34 63 253 498	Calle Principal 143, México	1962-06-01	México	\N	\N	\N
93	user8	user8@angotest.com	$2a$10$0aK9pA9lX0DlK5uF0eQAAOkQWdA2rtT1zPKLixw98TMixn.2IJ0c2	user	2026-02-04 18:18:01.769295+01	Raquel	Domínguez	+34 68 253 107	Calle Real 128, Madrid	1983-06-11	España	\N	\N	\N
\.


--
-- Name: answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.answers_id_seq', 4749, true);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 6, true);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.questions_id_seq', 1378, true);


--
-- Name: results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.results_id_seq', 1241, true);


--
-- Name: system_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_configs_id_seq', 2, true);


--
-- Name: test_invitations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_invitations_id_seq', 22, true);


--
-- Name: tests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tests_id_seq', 101, true);


--
-- Name: topics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.topics_id_seq', 90, true);


--
-- Name: user_quota_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_quota_id_seq', 22, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 96, true);


--
-- Name: answers answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: results results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_pkey PRIMARY KEY (id);


--
-- Name: system_configs system_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT system_configs_pkey PRIMARY KEY (id);


--
-- Name: test_invitations test_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_invitations
    ADD CONSTRAINT test_invitations_pkey PRIMARY KEY (id);


--
-- Name: tests tests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_pkey PRIMARY KEY (id);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (id);


--
-- Name: user_quota user_quota_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_quota
    ADD CONSTRAINT user_quota_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_main_topic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_main_topic ON public.topics USING btree (main_topic);


--
-- Name: idx_password_reset_tokens_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_password_reset_tokens_used; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_tokens_used ON public.password_reset_tokens USING btree (used);


--
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_results_updated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_results_updated ON public.results USING btree (updated_at DESC);


--
-- Name: idx_results_user_completed_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_results_user_completed_time ON public.results USING btree (user_id, status) WHERE ((status)::text = 'completed'::text);


--
-- Name: idx_results_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_results_user_status ON public.results USING btree (user_id, status);


--
-- Name: idx_results_user_test_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_results_user_test_status ON public.results USING btree (user_id, test_id, status);


--
-- Name: idx_results_user_updated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_results_user_updated ON public.results USING btree (user_id, updated_at);


--
-- Name: idx_specific_topic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_specific_topic ON public.topics USING btree (specific_topic);


--
-- Name: idx_sub_topic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sub_topic ON public.topics USING btree (sub_topic);


--
-- Name: idx_system_configs_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_system_configs_key ON public.system_configs USING btree (key);


--
-- Name: idx_test_invitations_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_invitations_email ON public.test_invitations USING btree (message);


--
-- Name: idx_test_invitations_guest_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_invitations_guest_user_id ON public.test_invitations USING btree (guest_user_id);


--
-- Name: idx_test_invitations_is_used; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_invitations_is_used ON public.test_invitations USING btree (is_used);


--
-- Name: idx_test_invitations_test_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_invitations_test_id ON public.test_invitations USING btree (test_id);


--
-- Name: idx_test_invitations_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_test_invitations_token ON public.test_invitations USING btree (token);


--
-- Name: idx_tests_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tests_is_active ON public.tests USING btree (is_active);


--
-- Name: idx_tests_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tests_level ON public.tests USING btree (level);


--
-- Name: idx_tests_main_topic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tests_main_topic ON public.tests USING btree (main_topic);


--
-- Name: idx_tests_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_tests_title ON public.tests USING btree (title);


--
-- Name: idx_topics_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_topics_is_active ON public.topics USING btree (is_predefined);


--
-- Name: idx_topics_is_predefined; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_topics_is_predefined ON public.topics USING btree (is_predefined);


--
-- Name: idx_user_quota_month_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_quota_month_year ON public.user_quota USING btree (month_year);


--
-- Name: idx_user_test_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_test_status ON public.results USING btree (user_id, test_id, status);


--
-- Name: idx_users_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_deleted_at ON public.users USING btree (deleted_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: password_reset_tokens fk_password_reset_tokens_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: answers fk_questions_answers; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT fk_questions_answers FOREIGN KEY (question_id) REFERENCES public.questions(id);


--
-- Name: test_invitations fk_test_invitations_guest_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_invitations
    ADD CONSTRAINT fk_test_invitations_guest_user FOREIGN KEY (guest_user_id) REFERENCES public.users(id);


--
-- Name: test_invitations fk_test_invitations_inviter; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_invitations
    ADD CONSTRAINT fk_test_invitations_inviter FOREIGN KEY (invited_by) REFERENCES public.users(id);


--
-- Name: test_invitations fk_test_invitations_test; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_invitations
    ADD CONSTRAINT fk_test_invitations_test FOREIGN KEY (test_id) REFERENCES public.tests(id);


--
-- Name: questions fk_tests_questions; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT fk_tests_questions FOREIGN KEY (test_id) REFERENCES public.tests(id);


--
-- Name: results fk_tests_results; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT fk_tests_results FOREIGN KEY (test_id) REFERENCES public.tests(id);


--
-- Name: user_quota fk_user_quota_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_quota
    ADD CONSTRAINT fk_user_quota_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: results fk_users_results; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT fk_users_results FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: tests fk_users_tests; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT fk_users_tests FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 5qag32K4YjrHJUSsnwE3naAx3ENo8wapgt6jYgsjoo7pVhzgxTldhFAVacc35Mg

