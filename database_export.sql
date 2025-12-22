--
-- PostgreSQL database dump
--

\restrict FdpgDRhi5dfA35BkUhscAAE9te3mJ8X8zcta40ZtN7dQPtsBYoGb7dXHb5gMJSF

-- Dumped from database version 16.11 (74c6bb6)
-- Dumped by pg_dump version 16.10

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    project_list text
);


--
-- Name: estimate_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estimate_services (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    estimate_id character varying NOT NULL,
    service_id character varying NOT NULL,
    service_name text NOT NULL,
    service_price numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    quantity integer DEFAULT 1 NOT NULL
);


--
-- Name: estimates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estimates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    customer_name text NOT NULL,
    phone text NOT NULL,
    date timestamp without time zone DEFAULT now() NOT NULL,
    desired_finish_date timestamp without time zone,
    total numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    notes text,
    service_type text NOT NULL
);


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    category text NOT NULL,
    name text NOT NULL,
    description text,
    quantity numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    unit text NOT NULL,
    price numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: job_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_inventory (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    job_id character varying NOT NULL,
    inventory_id character varying NOT NULL,
    inventory_name text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: job_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_services (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    job_id character varying NOT NULL,
    service_id character varying NOT NULL,
    service_name text NOT NULL,
    service_price numeric(10,2) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tracking_id text NOT NULL,
    customer_id character varying,
    phone_number text NOT NULL,
    received_date timestamp without time zone DEFAULT now() NOT NULL,
    coating_type text,
    detailed_notes text,
    price numeric(10,2) NOT NULL,
    status text DEFAULT 'received'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    items text,
    completed_at timestamp without time zone,
    service_id character varying
);


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    job_id character varying,
    customer_id character varying,
    content text NOT NULL,
    author text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    price numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username character varying NOT NULL,
    password_hash character varying NOT NULL,
    role text DEFAULT 'admin'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, name, email, phone, address, created_at, project_list) FROM stdin;
e59318ed-3a9c-4200-a1ab-7565db2f35a0	Quick Lube Auto	\N	\N	\N	2025-11-09 06:50:23.505004	\N
4bbcfcbd-28f5-43ff-a25c-eec67395b7ae	Eric Emerson	\N	321-276-9505	\N	2025-11-10 15:30:08.073548	\N
521291a9-36da-40fa-8508-15ade4db096f	Edgar Ortiz	\N	321-747-4555	\N	2025-11-10 15:30:08.191652	\N
56ec4d4d-1f8d-4f42-8bfa-4558f57674dd	Luis	\N	321-276-1664	\N	2025-11-10 15:30:08.291864	\N
cc1351d7-8685-4b2a-86e7-61bfab19acbf	Stuart	\N	407-718-7495	\N	2025-11-10 15:30:08.395335	\N
f2850ce0-c605-4f70-b97f-e5528d3fedef	Sean Taylor	\N	321-228-4942	\N	2025-11-10 15:30:08.497797	\N
4de832a5-0c3a-4197-be3e-b34998bc6f60	Mike Lukowski	\N	201-852-0786	\N	2025-11-10 15:30:08.600467	\N
7c812713-cead-4adf-8d7b-e4493d37a705	Jim Wornick	\N	\N	\N	2025-11-10 15:30:08.698996	\N
c340e4fa-340a-4462-88b0-8599559fb13f	Mark	\N	\N	\N	2025-11-10 15:30:08.798014	\N
8d2cdc73-96d7-4205-8023-f63e9478cf26	Sid	\N	\N	\N	2025-11-10 15:30:08.897476	\N
ae1e61af-8c9e-4058-83d2-2d2a2ac79af3	Travis ( Horsepower Farm)	\N	407-761-7983	\N	2025-11-10 15:30:08.995518	\N
480b4221-69b5-4709-8f76-1fae8e6b56c5	Tom K	\N	407-466-8421	\N	2025-11-10 15:30:09.09574	\N
54c75d70-17a8-47ff-b9c2-6c8ebd65dd78	Bryan Wolf	\N	321-863-9602	\N	2025-11-10 15:30:09.19525	\N
fbef3657-6801-4dda-aa6e-be36c5358cb9	Rob	\N	321-439-3393	\N	2025-11-10 15:30:09.293709	\N
d58b127a-db1f-4ede-8bab-5ee41c48cf31	Dennis ( Lugo Performance )	\N	407-692-3607	\N	2025-11-10 15:30:09.39179	\N
06e4d958-e10b-42fd-8b4a-fb082f137362	Tommy ( wile airboats )	\N	386-804-2128	\N	2025-11-10 15:30:09.493188	\N
153aaf70-3eef-46d6-bc71-e0845dd6cbc0	Rey	\N	407-694-8322	\N	2025-11-10 15:30:09.589426	\N
ad6164cd-599f-4c06-9ce0-3c50136e0f83	Alan Rodriguez  Tst Auto	\N	407-878-2886	\N	2025-11-10 15:30:09.688906	\N
80df84f0-75ae-47d4-8926-1f34fdb42683	Larry In & Out Auto	\N	407-486-3787	\N	2025-11-10 15:30:09.786047	\N
349509ff-58ba-4f66-a291-4a3c9a2010e0	David Hollinger	\N	\N	\N	2025-11-10 15:30:09.885763	\N
68c94c74-ea31-4ffd-8ed1-11709b6cf282	PM Racing/Brian Schofield	\N	863-559-9154	\N	2025-11-10 15:30:09.982812	\N
4c78dde6-5ee7-401d-831f-a4f8cee2e77b	All Pro Mechanical and Fab	\N	863-287-0233	\N	2025-11-10 15:30:10.093064	\N
2d5871a9-da31-4a8a-861f-c6f03118a5a2	Howard Robin	\N	407-552-2344	\N	2025-11-10 15:30:10.191966	\N
6628df99-eef4-4b38-bbb0-45ecb81267fa	Mark silver	\N	407-335-9566	\N	2025-11-10 15:30:10.289991	\N
c671dbd4-dc6a-4e91-b08f-500223cff729	Leonard Ashbury	\N	352-266-8319	\N	2025-11-10 15:30:10.387613	\N
5343f417-44ed-4318-a1cc-91b57d32e821	Nathan tepes	\N	407-664-8181	\N	2025-11-10 15:30:10.486641	\N
1b38fc71-a9d9-433e-b881-29a15c1e4b8b	Nathan Tepes	\N	407-664-8181	\N	2025-11-10 15:30:10.586558	\N
919d744c-4378-40c2-b31b-cb91b8836eb3	Ryno Motorsports	\N	407-498-4060	\N	2025-11-10 15:30:10.685221	\N
88a0fe2f-f748-4fee-bfff-ce66038d05df	NIS Print ( Katie Toros )	\N	407-739-5257	\N	2025-11-10 15:30:10.783898	\N
969369c3-6663-4911-9903-3132f79d061f	Triple J Transmissoin	\N	\N	\N	2025-11-10 15:30:10.882471	\N
aa840c89-c955-4d80-b08e-4ab8d4399c47	PM Racing	\N	\N	\N	2025-11-10 15:30:10.984492	\N
3b569ecd-7bd9-4d04-903d-ca05f85c75f6	Tiffany Christian	\N	407-716-9677	\N	2025-11-10 15:30:11.0839	\N
0ff10c3c-a4a5-4c3b-94ed-283fb36107c0	Joe Cartwright	\N	386-547-2994	\N	2025-11-10 15:30:11.182693	\N
176617b3-0d47-4811-b2f6-60ba44c68f00	Ed Augustine	\N	352-267-8576	\N	2025-11-10 15:30:11.281835	\N
fad1823b-8b5e-4fea-a242-2811e4ddb7d7	All Pro Fabrication	\N	\N	\N	2025-11-10 15:30:11.381905	\N
469ef517-0311-48d0-9c67-ce71ab854529	Jeff Anderson	\N	407-967-2312	\N	2025-11-10 15:30:11.480102	\N
59388feb-dcbb-497d-9c83-3462e9fee48e	Mark Silva	\N	\N	\N	2025-11-10 15:30:11.578696	\N
d42be614-bd43-494e-8899-e10ec995b318	Old Time Auto	\N	407-413-1579	\N	2025-11-10 15:30:11.682907	\N
6a57483d-3a34-40fc-8267-085cc7b99d6d	Tim Takash	\N	407-600-5406	\N	2025-11-10 15:30:11.781855	\N
2ab7cc90-dc34-4a00-8cc2-b4cb0509653a	Auto Fanatik	\N	340-513-1290	\N	2025-11-10 15:30:11.881483	\N
2bc4bbe5-7166-4f25-aacf-a026fe8ec2cb	Jeff	\N	407-252-9490	\N	2025-11-10 15:30:11.978923	\N
e69f7558-31a0-416b-94fe-ef44886616f6	Santos LLC	\N	\N	\N	2025-11-10 15:30:12.078837	\N
ea9164b7-eb46-4f3b-b90e-ef2b57f62b9d	Robert Miller	\N	407-701-1359	\N	2025-11-10 15:30:12.17615	\N
3b926b85-f23c-4c64-9a29-296b88185bfd	Scooby Doo	\N	\N	\N	2025-11-10 15:30:12.340992	\N
076a0e52-7144-43d8-8381-977ee60ed398	Jimmy Ortega	\N	407-722-6431	\N	2025-11-10 15:30:12.440636	\N
da73d349-873b-4b1e-b3b2-da950067ff16	Jack Vinson	\N	407-590-2585	\N	2025-11-10 15:30:12.538684	\N
72784828-d5f3-4675-9aac-56e9f4def66d	ahmed	\N	386-334-2582	\N	2025-11-10 15:30:12.638905	\N
2e4138ec-b9b8-4ff0-a4f7-55b1e102bdc1	Jack Lott	\N	321-624-1590	\N	2025-11-10 15:30:12.83945	\N
d1b28f74-4bbc-4da8-a404-3b815c4497fd	Chad	\N	561-307-1051	\N	2025-11-10 15:30:12.941956	\N
7e413c07-1e72-4985-9c3a-18a01ae39084	Steve Blackwell	\N	321-603-1456	\N	2025-11-10 15:30:13.072003	\N
0a60476d-91b9-4dfa-b03b-9718ded4e1da	Douglas	\N	352-516-8522	\N	2025-11-10 15:30:13.170681	\N
af3e72be-11b7-4f33-bc74-0bc441b7fb66	Mike	\N	815-922-4201	\N	2025-11-10 15:30:13.268153	\N
7cd0979a-d728-44eb-a74f-eed34c961fc7	Hamant Airboats	\N	\N	\N	2025-11-10 15:30:13.437116	\N
02dcb609-2cdd-4169-9b46-a404ae78c854	Ryan	\N	407-960-9426	\N	2025-11-10 15:30:13.602043	\N
700d8852-ac0d-4d86-b19b-aa909276e5f7	Keith Pentz	\N	863-236-0608	\N	2025-11-10 15:30:13.701946	\N
40f38a5f-63c5-465a-95ca-8c665b1ba854	George	\N	407-924-2093	\N	2025-11-10 15:30:13.801841	\N
4cb08a44-66c7-432a-b660-3b82e88c1e90	Chris Barnes	\N	407-558-7036	\N	2025-11-10 15:30:13.900571	\N
28cb1b57-72bb-456d-b666-1724fd6b5ca0	Cameron	\N	808-260-0202	\N	2025-11-10 15:30:13.999186	\N
18f227e3-39f6-48db-ba95-096fc6a73194	Dan	\N	440-487-9508	\N	2025-11-10 15:30:14.09572	\N
497ce65b-9842-4898-83e0-142f4563ea96	Jesse	\N	\N	\N	2025-11-10 15:30:14.19382	\N
6bb28ea7-be17-45f1-b309-38b7fd2bbb12	Hamant	\N	\N	\N	2025-11-10 15:30:14.292737	\N
599d540a-7875-431c-8b90-b2b608942d98	Jim Alumatech	\N	\N	\N	2025-11-10 15:30:14.458345	\N
0032e082-1d38-48d9-8aa9-4440dda751f3	Matt, Fabtech	\N	\N	\N	2025-11-10 15:30:14.563509	\N
f00a51a9-c55d-4077-9f63-6d2a406bb010	Todd	\N	\N	\N	2025-11-10 15:30:14.678896	\N
e5af03df-527f-4fd4-bd5a-42bf31e0f693	Dan Alegra Motorsports	\N	440-487-9508	\N	2025-11-10 15:30:14.778651	\N
26537a9d-9d95-4aae-b841-4dc19ab22aed	Aaron Diaz	\N	407-913-0009	\N	2025-11-10 15:30:14.877173	\N
5763ca3c-aa8c-4c64-a506-736286ecab39	Logan	\N	407-749-4801	\N	2025-11-10 15:30:14.979539	\N
4ecbcaf4-90fb-43ac-b94c-d656474f5cd0	Greg	\N	407-577-4474	\N	2025-11-10 15:30:15.079115	\N
8b0b3871-b833-4f88-a2ef-94184bb916db	Jim Mckenna	\N	203-249-2359	\N	2025-11-10 15:30:15.18108	\N
6241b844-250f-48ee-9d0f-b907401bc2ee	Matt	\N	626-969-9841	\N	2025-11-10 15:30:15.277602	\N
d19c89a8-6834-45e7-92c4-cecbc8b29218	Dan P	\N	440-487-9508	\N	2025-11-10 15:30:15.376635	\N
ccc75b4c-9f6c-445b-a3cd-c86bb39fa4ea	Andy	\N	407-304-7418	\N	2025-11-10 15:30:15.475686	\N
0988e6ee-9b60-4ef6-bcfe-80b92ead5d7a	Dustyn	\N	305-608-9295	\N	2025-11-10 15:30:15.584233	\N
ec144862-1a7b-4bc7-80c6-96dc845145f3	Bruce	\N	317-727-5874	\N	2025-11-10 15:30:15.684134	\N
0d1e87f5-7792-459a-bce4-3aa41057f132	Norman Clay	\N	\N	\N	2025-11-10 15:30:15.789042	\N
6c0a374b-4a7c-4037-b001-184b0f2074d4	Tom Santos	\N	\N	\N	2025-11-10 15:30:15.895555	\N
71fe73fd-76cf-4bc6-bacb-0efd40574511	CJ	\N	\N	\N	2025-11-10 15:30:16.005018	\N
3330ebc5-3be6-4ff8-ba3f-bcf5c30ac9e7	Jorg	\N	315-796-9700	\N	2025-11-10 15:30:16.163902	\N
7f3d7c23-9465-4a56-a80d-5c05b5ed580e	Alan TST Auto	\N	\N	\N	2025-11-10 15:30:16.265696	\N
327e4300-5f56-448d-9779-3c61729d6e88	Bill ( Razorback Airboats )	\N	772-766-2128	\N	2025-11-10 15:30:16.652964	\N
e901276c-f696-4b1b-8ee3-e3695545ecf2	Doug	\N	386-864-5342	\N	2025-11-10 15:30:16.755769	\N
0b3d5b67-9ea4-4f0a-aef4-a4061d1feab1	Ryan Olaughlin	\N	\N	\N	2025-11-10 15:30:16.94584	\N
8041577b-96b8-4c9c-bdf3-3d05b95b1049	Giulianno	\N	407-483-6323	\N	2025-11-10 15:30:17.12588	\N
554b5a13-7868-403c-b382-c1b3876a9a9e	Junior Brown	\N	386-215-6257	\N	2025-11-10 15:30:17.22178	\N
03afcd5b-1d68-4586-b755-1329d8769f02	Alex	\N	\N	\N	2025-11-10 15:30:17.320436	\N
cf57d156-e45e-4a07-a88c-fa4d4be3895e	Jason	\N	754-366-6009	\N	2025-11-10 15:30:17.421182	\N
a2094be8-b19b-49af-8da2-6b37ff58d622	Tony	\N	407-401-1466	\N	2025-11-10 15:30:17.527098	\N
78a3247c-d397-43b4-9e92-169ebb75711c	Norman	\N	\N	\N	2025-11-10 15:30:17.630003	\N
46970ace-0615-4246-87c3-a84d422fe1c3	Mike Tokarz	\N	321-527-8800	\N	2025-11-10 15:30:17.733811	\N
c0a5b1c2-2139-4347-ba8c-bb5217c1479c	Brady Fors	\N	952-270-1129	\N	2025-11-10 15:30:17.845451	\N
fa2a4133-a288-4d6b-abc7-de10ce6eefac	Russel Britt	\N	407-291-1119	\N	2025-11-10 15:30:17.95258	\N
fe04029c-0044-454a-a675-50453867c61e	Ryan O	\N	\N	\N	2025-11-10 15:30:18.056971	\N
53717a11-6417-487c-8a05-7b6eda7bf92c	Larry	\N	407-461-0498	\N	2025-11-10 15:30:18.176296	\N
138d3987-b853-47c5-80ee-80bf7a0c4fdf	Josh Wingate	\N	863-978-8803	\N	2025-11-10 15:30:18.2857	\N
349ec3f1-2725-4684-bb08-8cd31f29f5a1	Tim	\N	407-920-9304	\N	2025-11-10 15:30:18.384525	\N
d2aca0ae-f472-4eef-9cc8-8e53181c5ed0	David	\N	321-689-4117	\N	2025-11-10 15:30:18.484038	\N
bcad9855-d0d3-4a34-aeb4-4d39674bc994	Joe	\N	229-740-5265	\N	2025-11-10 15:30:18.581026	\N
63ae3bcb-4f6a-45c5-9ba3-0c39f0f9d40c	Charlie Bentayou	\N	352-586-8090	\N	2025-11-10 15:30:18.757843	\N
d2773630-7f36-4830-ab2e-80315e54c2d3	Rob Henson	\N	407-466-0932	\N	2025-11-10 15:30:18.883009	\N
f314cb32-a465-4bf2-93af-2b37af43e843	Alan Davies	\N	352-275-1555	\N	2025-11-10 15:30:18.999956	\N
3dd20c28-b594-4322-bc0e-af297d88191b	Bungo	\N	407-949-1989	\N	2025-11-10 15:30:19.11857	\N
909193a7-6c64-4e5e-9626-69dc41c7adf3	Brad Wallace	\N	813-299-1624	\N	2025-11-10 15:30:19.219646	\N
c9b82299-80df-4828-a036-c2cdc343b455	Tim Ward	\N	\N	\N	2025-11-10 15:30:19.389819	\N
2be0452c-53ac-4b05-bb90-232650449bf9	Jim Millen	\N	321-609-0628	\N	2025-11-10 15:30:19.571647	\N
748d673d-21c3-4267-bfd1-d19b0264c542	Jessito	\N	407-910-3035	\N	2025-11-10 15:30:19.6698	\N
9e5a9cf7-63b9-4a55-a3ad-cfc9647da37b	Austin	\N	386-479-3310	\N	2025-11-10 15:30:19.76498	\N
f06e7477-423a-4f1e-b507-e403da538ec2	Darren	\N	863-605-3008	\N	2025-11-10 15:30:19.935057	\N
bcaa8b44-ffb8-43a4-980e-8e09b355dab0	Rafael Fernandez	\N	689-284-5171	\N	2025-11-10 15:30:20.038839	\N
326e4db8-9d77-47ff-a984-ead191bbdbaf	Dylan	\N	321-322-8713	\N	2025-11-10 15:30:20.151651	\N
661a8e65-9d11-444b-9769-574e110eee5f	Bruce Hutchinson	\N	321-632-1613	\N	2025-11-10 15:30:20.256347	\N
cd09ce5c-48d9-49ed-973c-952c6f9f46dd	Drew McGucken	\N	407-463-9534	\N	2025-11-10 15:30:20.420628	\N
cbeff216-6207-4646-9059-435e036ed610	Orlando	\N	773-733-8426	\N	2025-11-10 15:30:20.518446	\N
208edd48-7455-4cee-b419-263364782df3	Jimmy Billings	\N	407-844-3582	\N	2025-11-10 15:30:20.617906	\N
3fd11841-9603-40e9-9833-61ad92d72361	Sam Tucker ( Attis Tire )	\N	40753282504075756963	\N	2025-11-10 15:30:20.74733	\N
c7dba781-043b-4e30-bdde-119d96019ac0	Rafael	\N	689-284-5171	\N	2025-11-10 15:30:20.858995	\N
c88b607b-3018-4958-bb68-dcd8b9dc3619	Lemuel Morales	\N	904-509-8939	\N	2025-11-10 15:30:20.962826	\N
1e9fb404-10ae-48ef-ba12-369819cec111	Patrick Tyson	\N	214-310-2850	\N	2025-11-10 15:30:21.063857	\N
dd6e012d-08e4-4bc6-9541-13f1ec8c5e87	Vinnie	\N	\N	\N	2025-11-10 15:30:21.233823	\N
3ad4121c-c882-42de-ba75-894d1c48ef1a	Alice Johnson	alice@test.com	555-0001	\N	2025-11-12 01:36:57.505257	\N
02870b9f-aec8-43b2-8a2d-0c8e91f69491	Bob Smith	bob@test.com	555-0002	\N	2025-11-12 01:36:57.617984	\N
e0538793-4957-4a76-ba27-fcbef0ff508b	Alice Johnson	alice@test.com	555-0001	\N	2025-11-12 01:37:34.121421	\N
555d8a04-cd66-471e-9050-ac35d866225b	Bob Smith	bob@test.com	555-0002	\N	2025-11-12 01:37:34.216271	\N
b58a6f35-ab44-46c6-a2c9-5af96d62c6ac	Test Customer	\N	\N	\N	2025-11-12 14:35:13.923938	\N
\.


--
-- Data for Name: estimate_services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.estimate_services (id, estimate_id, service_id, service_name, service_price, created_at, quantity) FROM stdin;
4fac9712-26e7-4a3b-b881-8a2beeeb4fc7	11ddb189-31fa-44ed-bb27-cc5f26203e03	3668ba5e-c19f-4018-b3fd-9624d4f34a4b	Dual carb tunnel ram	400.00	2025-11-13 03:59:30.882484	1
fc18eb20-a9a1-4443-a377-4b2c8c309658	60f87f43-e63a-4897-ac27-40fdeaa4ae21	3668ba5e-c19f-4018-b3fd-9624d4f34a4b	Dual carb tunnel ram	400.00	2025-11-13 04:06:28.359525	1
8735fb49-52fc-4b26-b827-887ee97916f1	43e89260-d33e-4575-9ad4-55cb97413f68	3668ba5e-c19f-4018-b3fd-9624d4f34a4b	Dual carb tunnel ram	400.00	2025-11-13 04:08:57.85464	1
e56b626e-b960-4d77-862d-e0d139dc01ca	04004063-3731-40de-b5f2-f042c16a8f8b	3668ba5e-c19f-4018-b3fd-9624d4f34a4b	Dual carb tunnel ram	400.00	2025-11-13 04:11:09.99735	1
80821e0e-dc2b-4a73-9a20-93709803b5a9	b955ec9d-921c-4c6f-9009-a5f1e62271d0	ebf357ef-dbfa-4b5a-a347-b394ba6403b9	Normal intake manifold	250.00	2025-11-13 20:12:59.659342	1
3ddcaeb2-f288-48b6-8982-2994b660db1d	e4926077-4c44-4c57-8e5a-ff660583a88c	2ff08775-7238-4fd8-b789-37accc34ffc3	High rise EFI intake	300.00	2025-11-14 13:47:02.326796	1
6c0228a1-30e5-4ae0-9463-81f7b0e53a61	c6e16428-8545-442c-a731-86e1d84b2173	3668ba5e-c19f-4018-b3fd-9624d4f34a4b	Dual carb tunnel ram	400.00	2025-11-14 13:50:44.072689	1
\.


--
-- Data for Name: estimates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.estimates (id, customer_name, phone, date, desired_finish_date, total, status, created_at, notes, service_type) FROM stdin;
11ddb189-31fa-44ed-bb27-cc5f26203e03	Test Customer cVQcZu	555-123-4	2025-11-13 03:58:53.98	\N	0.00	draft	2025-11-13 03:59:30.845182	Test estimate notes	powder
60f87f43-e63a-4897-ac27-40fdeaa4ae21	Customer _7T1hw	555-987-6	2025-11-13 04:05:37.728	\N	0.00	draft	2025-11-13 04:06:28.320266	Test estimate	powder
43e89260-d33e-4575-9ad4-55cb97413f68	CustX7hv	555-111-1	2025-11-13 04:08:03.34	\N	0.00	draft	2025-11-13 04:08:57.817135	Test	powder
04004063-3731-40de-b5f2-f042c16a8f8b	CustSVb7	555-222-2	2025-11-13 04:10:29.462	\N	400.00	draft	2025-11-13 04:11:09.959201	Final test	powder
b955ec9d-921c-4c6f-9009-a5f1e62271d0	Test Customer	555-123-4567	2025-11-13 20:10:48.777	\N	150.00	draft	2025-11-13 20:12:59.609245		powder
e4926077-4c44-4c57-8e5a-ff660583a88c	Test Customer	555-123-4567	2025-11-14 13:44:34.918	\N	500.00	draft	2025-11-14 13:47:02.279579	Test estimate with multiple services	powder
c6e16428-8545-442c-a731-86e1d84b2173	Dialog Test Customer	555-999-8888	2025-11-14 13:49:47.185	\N	400.00	draft	2025-11-14 13:50:44.035407	Testing dialog close behavior	powder
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory (id, category, name, description, quantity, unit, price, created_at) FROM stdin;
832ZF8cJS_VW	powder	Test Powder Red	Red powder coating	50.00	pounds	15.00	2025-11-15 09:13:25.463799
ed7be327-ed33-4ece-9924-72ea43d4b636	powder	Test Red Powder	Red powder coating for testing	100.00	pounds	15.00	2025-11-15 09:24:50.63335
B2miRDak7lUF	ceramic	Test Ceramic Clear	Clear ceramic coating	3200.00	ounces	30.00	2025-11-15 09:13:25.463799
31b9f34a-2442-42fe-8065-671c96bf8bbc	ceramic	Test Clear Ceramic	Clear ceramic coating for testing	6400.00	ounces	30.00	2025-11-15 09:24:50.63335
\.


--
-- Data for Name: job_inventory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_inventory (id, job_id, inventory_id, inventory_name, quantity, unit, created_at) FROM stdin;
\.


--
-- Data for Name: job_services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_services (id, job_id, service_id, service_name, service_price, quantity, created_at) FROM stdin;
94ba4e91-7f71-4142-9266-cd3790a3097f	f04aa7ba-b297-44ac-91fc-300d19fb6c00	ebf357ef-dbfa-4b5a-a347-b394ba6403b9	Normal intake manifold	250.00	1	2025-11-13 15:20:54.426553
2b78e86e-4eeb-4e7f-a560-3df0d1999bc4	91ad84bf-ea14-4f33-9f75-d7261a60f154	3668ba5e-c19f-4018-b3fd-9624d4f34a4b	Dual carb tunnel ram	400.00	1	2025-11-13 16:41:54.122179
446687dc-8544-4698-84cb-599154309a61	91ad84bf-ea14-4f33-9f75-d7261a60f154	ebf357ef-dbfa-4b5a-a347-b394ba6403b9	Normal intake manifold	250.00	1	2025-11-13 16:41:54.122179
6108aa3f-b5a1-4cfa-9ffb-57fd3848b128	6bf4000f-08f9-4389-93d2-d9105f4b8580	3668ba5e-c19f-4018-b3fd-9624d4f34a4b	Dual carb tunnel ram	400.00	1	2025-11-13 16:44:04.590137
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jobs (id, tracking_id, customer_id, phone_number, received_date, coating_type, detailed_notes, price, status, created_at, items, completed_at, service_id) FROM stdin;
2412d5a7-248c-4454-8fa3-a0ae4b38959c	JOB-0031	6628df99-eef4-4b38-bbb0-45ecb81267fa	407-335-9566	2025-02-17 00:00:00	misc	\N	700.00	paid	2025-11-10 15:30:10.322014	2xturbo txblk 2x bracket chrome 2 black	2025-11-10 15:30:10.322014	\N
25eacb72-e7e9-498e-b124-423e4b96a14e	JOB-0089	71fe73fd-76cf-4bc6-bacb-0efd40574511	555-0000	2025-07-22 00:00:00	misc	\N	100.00	paid	2025-11-10 15:30:16.048199	Turbo Compressor and Turbine house	2025-11-10 15:30:16.048199	\N
f35150f9-b68e-4155-868b-babb5f5147af	JOB-0144	b58a6f35-ab44-46c6-a2c9-5af96d62c6ac		2025-11-13 14:00:29.052	\N		100.00	received	2025-11-13 14:02:24.126629	Test items	\N	\N
f04aa7ba-b297-44ac-91fc-300d19fb6c00	JOB-0145	4bbcfcbd-28f5-43ff-a25c-eec67395b7ae		2025-11-13 15:13:13.722	\N		250.00	received	2025-11-13 15:20:54.426553	Test items	\N	\N
91ad84bf-ea14-4f33-9f75-d7261a60f154	JOB-0146	4bbcfcbd-28f5-43ff-a25c-eec67395b7ae	555-999-8888	2025-11-13 16:37:41.059	\N		150.00	received	2025-11-13 16:41:54.122179	Test parts	\N	\N
6bf4000f-08f9-4389-93d2-d9105f4b8580	JOB-0147	4bbcfcbd-28f5-43ff-a25c-eec67395b7ae		2025-11-13 16:42:27.143	\N		400.00	received	2025-11-13 16:44:04.590137	Single-service parts	\N	\N
a8058aba-3f6e-468a-9adb-a5da2c522c18	JOB-0143	b58a6f35-ab44-46c6-a2c9-5af96d62c6ac	555-1234	2025-11-12 14:35:13.948	powder	\N	100.00	received	2025-11-12 14:35:14.066592	\N	\N	\N
3b8c6ed0-ab6f-4a01-94e3-fec26f4de460	JOB-0009	4bbcfcbd-28f5-43ff-a25c-eec67395b7ae	321-276-9505	2024-12-30 00:00:00	ceramic	\N	500.00	paid	2025-11-10 15:30:08.116415	Big block headers; MCSL	2025-11-10 15:30:08.116415	\N
a4873970-fd1a-43d5-bc4c-505df9c21d42	JOB-0014	4de832a5-0c3a-4197-be3e-b34998bc6f60	201-852-0786	2024-12-27 00:00:00	ceramic	\N	175.00	paid	2025-11-10 15:30:08.632932	Detroit turbo flange	2025-11-10 15:30:08.632932	\N
bdfc1858-8f64-4dd1-a271-cddc64aa2fb2	JOB-0015	7c812713-cead-4adf-8d7b-e4493d37a705	555-0000	2025-01-02 00:00:00	ceramic	\N	1450.00	paid	2025-11-10 15:30:08.732439	Large cast pipe 90	2025-11-10 15:30:08.732439	\N
a7301a9d-0108-4c84-8f10-99b97d643d53	JOB-0016	c340e4fa-340a-4462-88b0-8599559fb13f	555-0000	2025-01-02 00:00:00	ceramic	\N	400.00	paid	2025-11-10 15:30:08.83184	2JZ header, turbine housing and hardware	2025-11-10 15:30:08.83184	\N
8eaef848-4ade-4666-bcfb-003bc0330086	JOB-0017	8d2cdc73-96d7-4205-8023-f63e9478cf26	555-0000	2024-11-30 00:00:00	ceramic	\N	2300.00	paid	2025-11-10 15:30:08.930553	Porche exhaust manifolds	2025-11-10 15:30:08.930553	\N
1f303eea-6dcb-4bdf-8a03-fed55dff67c4	JOB-0018	ae1e61af-8c9e-4058-83d2-2d2a2ac79af3	407-761-7983	2025-01-02 00:00:00	ceramic	\N	425.00	paid	2025-11-10 15:30:09.030406	Shorty LS Headers; MCX	2025-11-10 15:30:09.030406	\N
5e45ee2d-eab6-49cf-b4cb-af33cc91c713	JOB-0019	480b4221-69b5-4709-8f76-1fae8e6b56c5	407-466-8421	2025-01-10 00:00:00	ceramic	\N	750.00	paid	2025-11-10 15:30:09.128901	Exhaust Pipes w/mufflers; MCX	2025-11-10 15:30:09.128901	\N
55737805-eaae-4e0e-90d9-8966d361dbd3	JOB-0020	54c75d70-17a8-47ff-b9c2-6c8ebd65dd78	321-863-9602	2025-01-14 00:00:00	ceramic	\N	425.00	paid	2025-11-10 15:30:09.228868	Set Continental Headers	2025-11-10 15:30:09.228868	\N
ae34a7d2-2873-445f-852e-73de6ede6ac8	JOB-0021	fbef3657-6801-4dda-aa6e-be36c5358cb9	321-439-3393	2025-01-20 00:00:00	ceramic	\N	550.00	paid	2025-11-10 15:30:09.326712	Set BBC Hooker Headers	2025-11-10 15:30:09.326712	\N
6d00bd58-2b3c-4f99-8ee3-077eb82e9abb	JOB-0022	d58b127a-db1f-4ede-8bab-5ee41c48cf31	407-692-3607	2025-01-15 00:00:00	powder	\N	250.00	paid	2025-11-10 15:30:09.424797	Set Valve Covers; GT40 Intake	2025-11-10 15:30:09.424797	\N
fe8f58bd-55c4-4eb7-a6c4-aae8de2db056	JOB-0023	06e4d958-e10b-42fd-8b4a-fb082f137362	386-804-2128	2025-01-23 00:00:00	ceramic	\N	150.00	paid	2025-11-10 15:30:09.524832	Lyc intake tubes	2025-11-10 15:30:09.524832	\N
000c7ded-a841-4c2c-8b1a-3df2665d25d0	JOB-0024	153aaf70-3eef-46d6-bc71-e0845dd6cbc0	407-694-8322	2025-01-29 00:00:00	ceramic	\N	350.00	paid	2025-11-10 15:30:09.623114	Pair LS manifolds	2025-11-10 15:30:09.623114	\N
393ca7b6-0708-4839-8a1d-86a52754a381	JOB-0025	ad6164cd-599f-4c06-9ce0-3c50136e0f83	407-878-2886	2025-03-19 00:00:00	ceramic	\N	0.00	paid	2025-11-10 15:30:09.721174	WRX header *new\n\n\n(2/3 completed job WRX Header and Pipe)	2025-11-10 15:30:09.721174	\N
4d83e1fd-565d-4701-9e00-edd770f8a2b2	JOB-0033	5343f417-44ed-4318-a1cc-91b57d32e821	407-664-8181	2025-02-18 00:00:00	ceramic	\N	125.00	cancelled	2025-11-10 15:30:10.519933	4x wheel sandblast	\N	\N
058f7924-acf5-439c-a0ce-d71930df75fb	JOB-0034	1b38fc71-a9d9-433e-b881-29a15c1e4b8b	407-664-8181	2025-01-02 00:00:00	powder	\N	75.00	cancelled	2025-11-10 15:30:10.619692	Focus RS Wheels	\N	\N
0b4783af-64a0-4628-87f2-42db8e7d302d	JOB-0026	80df84f0-75ae-47d4-8926-1f34fdb42683	407-486-3787	2025-02-03 00:00:00	ceramic	\N	450.00	paid	2025-11-10 15:30:09.817957	Jag E-Type Manifold and Pipes	2025-11-10 15:30:09.817957	\N
8d3c7dcb-ee13-47f7-b4f4-01b9ea423a66	JOB-0027	349509ff-58ba-4f66-a291-4a3c9a2010e0	555-0000	2024-12-25 00:00:00	ceramic	\N	500.00	paid	2025-11-10 15:30:09.918167	Modified SBC headers	2025-11-10 15:30:09.918167	\N
ee9820c3-1257-4c59-9241-2185ac8d2d1a	JOB-0028	68c94c74-ea31-4ffd-8ed1-11709b6cf282	863-559-9154	2025-02-12 00:00:00	ceramic	\N	0.00	paid	2025-11-10 15:30:10.017721	4 headers, 6 tube sections	2025-11-10 15:30:10.017721	\N
0269abc4-2888-436d-b038-044f7ef8ebf3	JOB-0029	4c78dde6-5ee7-401d-831f-a4f8cee2e77b	863-287-0233	2025-02-19 00:00:00	ceramic	\N	350.00	paid	2025-11-10 15:30:10.12645	Pair of BBC exhaust stacks	2025-11-10 15:30:10.12645	\N
19fc6d24-194c-46e3-a6a9-ac5fdddd48d9	JOB-0030	2d5871a9-da31-4a8a-861f-c6f03118a5a2	407-552-2344	2025-02-17 00:00:00	ceramic	\N	550.00	paid	2025-11-10 15:30:10.225568	2  460 headers 2x flange 6x bolts/nuts	2025-11-10 15:30:10.225568	\N
ee5bd029-cdc2-486a-a096-26cc834d7f97	JOB-0078	26537a9d-9d95-4aae-b841-4dc19ab22aed	407-913-0009	2025-07-11 00:00:00	misc	\N	350.00	coated	2025-11-10 15:30:14.911196	Timing cover, bolt heads, pedals	\N	\N
311f7ad4-717f-4b88-af85-133ba863c2db	JOB-0043	469ef517-0311-48d0-9c67-ce71ab854529	407-967-2312	2025-03-13 00:00:00	misc	\N	550.00	paid	2025-11-10 15:30:11.513562	SBC Headers; Chevelle Bumper Brackets	2025-11-10 15:30:11.513562	\N
e789fb43-f758-436b-b3ab-fb885ed78324	JOB-0044	59388feb-dcbb-497d-9c83-3462e9fee48e	555-0000	2025-03-13 00:00:00	misc	\N	0.00	paid	2025-11-10 15:30:11.61212	4 drops, 2 housing, 2 DP, 1 intake, 4 DP pieces, 1 catch assembly	2025-11-10 15:30:11.61212	\N
45a15e3a-6713-4e1b-ba5c-0ee0559f9737	JOB-0061	af3e72be-11b7-4f33-bc74-0bc441b7fb66	815-922-4201	2025-05-12 00:00:00	misc	\N	400.00	paid	2025-11-10 15:30:13.302152	Harley Heat Shields and Powder inlay	2025-11-10 15:30:13.302152	\N
ae85acb8-5a2e-4357-8c22-5567fdd8d974	JOB-0070	18f227e3-39f6-48db-ba95-096fc6a73194	440-487-9508	2025-01-02 00:00:00	ceramic	\N	400.00	received	2025-11-10 15:30:14.128826	Headers and mid pipes	\N	\N
810fda84-8e5e-432a-956b-d2fe6f501286	JOB-0032	c671dbd4-dc6a-4e91-b08f-500223cff729	352-266-8319	2025-02-18 00:00:00	ceramic	\N	450.00	paid	2025-11-10 15:30:10.420473	2 airboat small block	2025-11-10 15:30:10.420473	\N
03532587-49cb-4279-bebf-1df6eed668ba	JOB-0035	919d744c-4378-40c2-b31b-cb91b8836eb3	407-498-4060	2025-02-21 00:00:00	ceramic	\N	850.00	paid	2025-11-10 15:30:10.71893	Harley Fishtail Exhaust	2025-11-10 15:30:10.71893	\N
7b37e28e-e7f5-40dd-996f-ffe4f612c9fa	JOB-0036	88a0fe2f-f748-4fee-bfff-ce66038d05df	407-739-5257	2025-02-20 00:00:00	powder	\N	540.00	paid	2025-11-10 15:30:10.817007	Binder Rings	2025-11-10 15:30:10.817007	\N
b505b376-66c1-471c-80e1-4909a1a25b69	JOB-0037	969369c3-6663-4911-9903-3132f79d061f	555-0000	2025-02-21 00:00:00	ceramic	\N	825.00	paid	2025-11-10 15:30:10.91875	LS Airboat Headers,Mufflers, 4” Flex, 6 Clamps	2025-11-10 15:30:10.91875	\N
c4ff510d-4972-4784-ad6b-345a2677cb2f	JOB-0038	aa840c89-c955-4d80-b08e-4ab8d4399c47	555-0000	2025-01-02 00:00:00	ceramic	\N	1250.00	paid	2025-11-10 15:30:11.018183	4 x 4 cylinder headers and piping	2025-11-10 15:30:11.018183	\N
f65d1f25-2d85-4869-a091-185d23d4a63c	JOB-0039	3b569ecd-7bd9-4d04-903d-ca05f85c75f6	407-716-9677	2025-03-13 00:00:00	powder	\N	400.00	paid	2025-11-10 15:30:11.117293	E Bike Frame	2025-11-10 15:30:11.117293	\N
814a41b8-e18d-42e4-8456-0b3811f25d24	JOB-0040	0ff10c3c-a4a5-4c3b-94ed-283fb36107c0	386-547-2994	2025-03-12 00:00:00	ceramic	\N	825.00	paid	2025-11-10 15:30:11.215918	LS Airboat Headers	2025-11-10 15:30:11.215918	\N
930a8e82-ed07-4a03-98af-1a1eb0d7157d	JOB-0041	176617b3-0d47-4811-b2f6-60ba44c68f00	352-267-8576	2025-03-11 00:00:00	ceramic	\N	600.00	paid	2025-11-10 15:30:11.315556	Block Huggers and Cast Manifolds	2025-11-10 15:30:11.315556	\N
36695fd0-6008-47e1-ac57-79466fb32c7f	JOB-0042	fad1823b-8b5e-4fea-a242-2811e4ddb7d7	555-0000	2025-01-02 00:00:00	ceramic	\N	350.00	paid	2025-11-10 15:30:11.414763	BBC Zoomies	2025-11-10 15:30:11.414763	\N
93dbd104-8e66-4c4e-9cf8-4cb5ee939c50	JOB-0045	d42be614-bd43-494e-8899-e10ec995b318	407-413-1579	2025-03-19 00:00:00	ceramic	\N	400.00	paid	2025-11-10 15:30:11.716686	Shorty 302 headers	2025-11-10 15:30:11.716686	\N
6418cef4-4f1c-4d41-a85d-bf285426b024	JOB-0046	6a57483d-3a34-40fc-8267-085cc7b99d6d	407-600-5406	2025-03-26 00:00:00	ceramic	\N	600.00	paid	2025-11-10 15:30:11.815671	BBC	2025-11-10 15:30:11.815671	\N
30753131-8739-4930-a0c6-7a121ed7d43a	JOB-0047	2ab7cc90-dc34-4a00-8cc2-b4cb0509653a	340-513-1290	2025-04-21 00:00:00	powder	\N	750.00	paid	2025-11-10 15:30:11.914384	Custom VW wheels	2025-11-10 15:30:11.914384	\N
c69707d3-639d-4835-8f79-1e955c5da639	JOB-0048	2bc4bbe5-7166-4f25-aacf-a026fe8ec2cb	407-252-9490	2025-04-24 00:00:00	ceramic	\N	500.00	paid	2025-11-10 15:30:12.012575	SBC Airboat Headers ONLY	2025-11-10 15:30:12.012575	\N
2fa7427a-ffc0-484e-b8ad-849c3e85b37a	JOB-0049	e69f7558-31a0-416b-94fe-ef44886616f6	555-0000	2025-04-22 00:00:00	ceramic	\N	200.00	paid	2025-11-10 15:30:12.111865	Mustang Headers	2025-11-10 15:30:12.111865	\N
31c1afff-37b6-4dc4-83c5-00ca7bfe540c	JOB-0050	ea9164b7-eb46-4f3b-b90e-ef2b57f62b9d	407-701-1359	2025-04-18 00:00:00	ceramic	\N	275.00	paid	2025-11-10 15:30:12.209024	Model A Exhaust Manifold	2025-11-10 15:30:12.209024	\N
7637ce9c-30c2-4e61-accf-6731aa9f97ab	JOB-0051	aa840c89-c955-4d80-b08e-4ab8d4399c47	863-559-9154	2025-04-22 00:00:00	ceramic	\N	325.00	paid	2025-11-10 15:30:12.275869	4 cyl race header and pipes	2025-11-10 15:30:12.275869	\N
94356451-e7db-4901-a354-3f7c078d6194	JOB-0052	3b926b85-f23c-4c64-9a29-296b88185bfd	555-0000	2025-04-02 00:00:00	ceramic	\N	200.00	paid	2025-11-10 15:30:12.375224	318 Headers	2025-11-10 15:30:12.375224	\N
044e03fb-1f51-4443-9a3c-460e09a32ed6	JOB-0053	076a0e52-7144-43d8-8381-977ee60ed398	407-722-6431	2025-04-21 00:00:00	ceramic	\N	0.00	paid	2025-11-10 15:30:12.473885	Bicycle Parts	2025-11-10 15:30:12.473885	\N
6186fdb5-8909-4e77-bccc-88d2990bdbd9	JOB-0054	da73d349-873b-4b1e-b3b2-da950067ff16	407-590-2585	2025-04-08 00:00:00	ceramic	\N	700.00	paid	2025-11-10 15:30:12.572513	VW Bus bumpers	2025-11-10 15:30:12.572513	\N
07aba9b9-bd2e-4125-92a3-1d049a519a9c	JOB-0055	72784828-d5f3-4675-9aac-56e9f4def66d	386-334-2582	2025-05-01 00:00:00	ceramic	\N	200.00	paid	2025-11-10 15:30:12.686111	intake pipes	2025-11-10 15:30:12.686111	\N
f0b64120-3ba7-4d06-85ec-ba3b7971c3fe	JOB-0056	2bc4bbe5-7166-4f25-aacf-a026fe8ec2cb	407-733-2701	2025-05-01 00:00:00	ceramic	\N	0.00	paid	2025-11-10 15:30:12.759988	SBP Headers	2025-11-10 15:30:12.759988	\N
880fcd94-fd58-4136-9af0-7fc71af4f2da	JOB-0057	2e4138ec-b9b8-4ff0-a4f7-55b1e102bdc1	321-624-1590	2025-05-09 00:00:00	ceramic	\N	0.00	paid	2025-11-10 15:30:12.872925	ls header chrome	2025-11-10 15:30:12.872925	\N
b21249de-7edc-4c25-b10c-1368b7aefe8c	JOB-0058	d1b28f74-4bbc-4da8-a404-3b815c4497fd	561-307-1051	2025-05-19 00:00:00	ceramic	\N	375.00	paid	2025-11-10 15:30:12.986432	Cobra Headers	2025-11-10 15:30:12.986432	\N
05080e6f-123c-41fc-86ba-5888e34c9634	JOB-0059	7e413c07-1e72-4985-9c3a-18a01ae39084	321-603-1456	2025-05-09 00:00:00	ceramic	\N	450.00	paid	2025-11-10 15:30:13.105814	SBP Headers	2025-11-10 15:30:13.105814	\N
943f7acb-a616-4d48-8d33-41b4bb770a67	JOB-0060	0a60476d-91b9-4dfa-b03b-9718ded4e1da	352-516-8522	2025-04-02 00:00:00	ceramic	\N	500.00	paid	2025-11-10 15:30:13.203854	BBF Headers	2025-11-10 15:30:13.203854	\N
2a0e0880-8ce6-46f4-a7be-bae58938ba45	JOB-0062	aa840c89-c955-4d80-b08e-4ab8d4399c47	863-559-9154	2025-05-19 00:00:00	ceramic	\N	0.00	paid	2025-11-10 15:30:13.370274	Racing 4cyl Header and pipes	2025-11-10 15:30:13.370274	\N
09d33ad9-9507-42cd-8e1d-6bbc25be8632	JOB-0090	3330ebc5-3be6-4ff8-ba3f-bcf5c30ac9e7	315-796-9700	2025-08-01 00:00:00	misc	\N	1300.00	coated	2025-11-10 15:30:16.200168	Harley Parts and 2 wheels	\N	\N
3aea2378-2c6a-4bbf-8bee-0feea0ce5859	JOB-0109	fa2a4133-a288-4d6b-abc7-de10ce6eefac	407-291-1119	2025-08-26 00:00:00	misc	\N	400.00	coated	2025-11-10 15:30:17.985397	2 Cross ram intakes, 2 block plates, 2 riser blocks, single 4 cyl exhaust header	\N	\N
d8260bee-f046-475b-bfdd-fe3ec654f977	JOB-0117	63ae3bcb-4f6a-45c5-9ba3-0c39f0f9d40c	352-586-8090	2025-09-10 00:00:00	misc	\N	240.00	coated	2025-11-10 15:30:18.80207	SBC Longtubes, Mufflers and Pipes; Intake manifold, 2 timing cover pieces, t stat housing	\N	\N
202e2b37-dab5-4d18-9ed3-6f83b857d1bb	JOB-0063	7cd0979a-d728-44eb-a74f-eed34c961fc7	555-0000	2025-05-29 00:00:00	ceramic	\N	750.00	paid	2025-11-10 15:30:13.47146	LS Airboat Headers Assembly	2025-11-10 15:30:13.47146	\N
316d6548-237b-4c38-a49b-eedd0310c65a	JOB-0064	af3e72be-11b7-4f33-bc74-0bc441b7fb66	407-244-6579	2025-06-03 00:00:00	ceramic	\N	400.00	paid	2025-11-10 15:30:13.537035	SBC Headers; Fender Exit	2025-11-10 15:30:13.537035	\N
d0c8c316-8608-4284-9ff5-a8bffb76cbb7	JOB-0065	02dcb609-2cdd-4169-9b46-a404ae78c854	407-960-9426	2025-05-30 00:00:00	powder	\N	100.00	paid	2025-11-10 15:30:13.636863	Jet Ski Valve Cover; Two tone	2025-11-10 15:30:13.636863	\N
b0ee1915-c26f-477a-ab91-4fd09b05e358	JOB-0066	700d8852-ac0d-4d86-b19b-aa909276e5f7	863-236-0608	2025-07-07 00:00:00	ceramic	\N	325.00	paid	2025-11-10 15:30:13.735266	Lycoming Airboat Headers	2025-11-10 15:30:13.735266	\N
efef4132-2165-445b-b1cb-60aaf420543a	JOB-0068	4cb08a44-66c7-432a-b660-3b82e88c1e90	407-558-7036	2025-06-30 00:00:00	ceramic	\N	275.00	paid	2025-11-10 15:30:13.934467	Turbo Manifold, clamps	2025-11-10 15:30:13.934467	\N
d9209233-2e80-48fe-a61b-776153c16168	JOB-0069	28cb1b57-72bb-456d-b666-1724fd6b5ca0	808-260-0202	2025-07-02 00:00:00	ceramic	\N	150.00	paid	2025-11-10 15:30:14.030949	2JZ Manifold	2025-11-10 15:30:14.030949	\N
4dd3763d-7ba1-4151-aa53-cb087fe27957	JOB-0071	497ce65b-9842-4898-83e0-142f4563ea96	555-0000	2025-07-03 00:00:00	powder	\N	400.00	paid	2025-11-10 15:30:14.225883	Radiator Support	2025-11-10 15:30:14.225883	\N
946f389f-aca3-436d-8960-cb29337aa80c	JOB-0072	6bb28ea7-be17-45f1-b309-38b7fd2bbb12	555-0000	2025-07-01 00:00:00	ceramic	\N	375.00	paid	2025-11-10 15:30:14.324843	Airboat headers only	2025-11-10 15:30:14.324843	\N
6bfe8dea-373c-4d73-ad2d-73a18417a449	JOB-0073	8d2cdc73-96d7-4205-8023-f63e9478cf26	555-0000	2025-06-24 00:00:00	ceramic	\N	250.00	paid	2025-11-10 15:30:14.392965	Aluminum Wheels	2025-11-10 15:30:14.392965	\N
93504fe3-29e7-41c1-8601-f229e8e34180	JOB-0074	599d540a-7875-431c-8b90-b2b608942d98	555-0000	2025-07-10 00:00:00	ceramic	\N	600.00	paid	2025-11-10 15:30:14.495875	LS Norman Headers, Flex, Muffs and clamps	2025-11-10 15:30:14.495875	\N
843f1379-5a9e-4985-9075-1fd53a440f7f	JOB-0075	0032e082-1d38-48d9-8aa9-4440dda751f3	555-0000	2025-07-10 00:00:00	powder	\N	250.00	paid	2025-11-10 15:30:14.609269	Shelving Rack	2025-11-10 15:30:14.609269	\N
07f71ca9-9444-40f2-94f9-5c512eb623fe	JOB-0076	f00a51a9-c55d-4077-9f63-6d2a406bb010	555-0000	2025-07-10 00:00:00	ceramic	\N	350.00	paid	2025-11-10 15:30:14.712146	LS longtubes	2025-11-10 15:30:14.712146	\N
865ed924-a5b2-4833-b2fe-f7e388b5e031	JOB-0077	e5af03df-527f-4fd4-bd5a-42bf31e0f693	440-487-9508	2025-07-02 00:00:00	ceramic	\N	200.00	paid	2025-11-10 15:30:14.812939	Racing exhaust; inside only	2025-11-10 15:30:14.812939	\N
a85d628a-48cf-45d5-83ed-9b18ae5d43d0	JOB-0079	5763ca3c-aa8c-4c64-a506-736286ecab39	407-749-4801	2025-07-15 00:00:00	ceramic	\N	400.00	paid	2025-11-10 15:30:15.012345	LS airboat headers, muffler/flex ( one piece ), 2 vband clamps	2025-11-10 15:30:15.012345	\N
00f9c23d-1fe7-4df3-82a8-69ad39a052e5	JOB-0080	4ecbcaf4-90fb-43ac-b94c-d656474f5cd0	407-577-4474	2025-07-22 00:00:00	ceramic	\N	350.00	paid	2025-11-10 15:30:15.114245	460 BBF Headers	2025-11-10 15:30:15.114245	\N
eb18af78-42e4-4d68-8d82-9156dc28949d	JOB-0081	8b0b3871-b833-4f88-a2ef-94184bb916db	203-249-2359	2025-07-22 00:00:00	ceramic	\N	350.00	paid	2025-11-10 15:30:15.212791	kooksHeaders	2025-11-10 15:30:15.212791	\N
8e643c22-6590-41f8-9972-9b7d05f899ee	JOB-0082	6241b844-250f-48ee-9d0f-b907401bc2ee	626-969-9841	2025-07-17 00:00:00	ceramic	\N	375.00	paid	2025-11-10 15:30:15.310562	GT86 Header+ pipe	2025-11-10 15:30:15.310562	\N
687a920e-1f8a-4fc9-ab26-208546dd2113	JOB-0084	ccc75b4c-9f6c-445b-a3cd-c86bb39fa4ea	407-304-7418	2025-07-23 00:00:00	ceramic	\N	350.00	paid	2025-11-10 15:30:15.512024	BBF Fender Headers	2025-11-10 15:30:15.512024	\N
a0ca12ee-8d9c-4af3-8a17-8ee89d0a3e7e	JOB-0085	0988e6ee-9b60-4ef6-bcfe-80b92ead5d7a	305-608-9295	2025-07-23 00:00:00	powder	\N	240.00	paid	2025-11-10 15:30:15.617856	Banshee wheels	2025-11-10 15:30:15.617856	\N
8dcf51b5-de20-4edf-9467-4908e415cf04	JOB-0087	0d1e87f5-7792-459a-bce4-3aa41057f132	555-0000	2025-07-23 00:00:00	ceramic	\N	260.00	paid	2025-11-10 15:30:15.824806	LYC Airboat exhaust	2025-11-10 15:30:15.824806	\N
4b27975e-3de4-41b6-a874-04c1cb80c098	JOB-0088	6c0a374b-4a7c-4037-b001-184b0f2074d4	555-0000	2025-07-23 00:00:00	ceramic	\N	250.00	paid	2025-11-10 15:30:15.937742	Header	2025-11-10 15:30:15.937742	\N
d782d50b-7abb-4769-b2fc-4f4f515f0dd1	JOB-0091	7f3d7c23-9465-4a56-a80d-5c05b5ed580e	555-0000	2025-08-04 00:00:00	ceramic	\N	375.00	paid	2025-11-10 15:30:16.301824	GT86 Header and Upper	2025-11-10 15:30:16.301824	\N
19cfb89c-b3e8-45bb-8264-9757e6105b24	JOB-0092	fbef3657-6801-4dda-aa6e-be36c5358cb9	352-636-9898	2025-08-05 00:00:00	ceramic	\N	350.00	paid	2025-11-10 15:30:16.370819	BBC Fenderwell Headers	2025-11-10 15:30:16.370819	\N
db22331e-6bb0-49eb-8e64-d06cb8aaabfe	JOB-0093	af3e72be-11b7-4f33-bc74-0bc441b7fb66	407-244-6579	2025-08-06 00:00:00	ceramic	\N	300.00	paid	2025-11-10 15:30:16.436408	SBC Fenderwell Headers ( Respray ) , Downpipes	2025-11-10 15:30:16.436408	\N
c5f292cf-e21a-47fe-a079-9fd3fe860d05	JOB-0094	0d1e87f5-7792-459a-bce4-3aa41057f132	555-0000	2025-08-01 00:00:00	ceramic	\N	0.00	paid	2025-11-10 15:30:16.505797	6 Cyl Lycoming Header	2025-11-10 15:30:16.505797	\N
905f0384-4988-4939-a728-ec4372547918	JOB-0067	40f38a5f-63c5-465a-95ca-8c665b1ba854	407-924-2093	2025-07-01 00:00:00	misc	\N	150.00	paid	2025-11-10 15:30:13.834789	Seat rails	2025-11-10 15:30:13.834789	\N
55d11853-5f11-4fb8-af7c-5591b7659439	JOB-0083	d19c89a8-6834-45e7-92c4-cecbc8b29218	440-487-9508	2025-07-16 00:00:00	misc	\N	800.00	paid	2025-11-10 15:30:15.409928	Modular header pieces	2025-11-10 15:30:15.409928	\N
c5e60064-ed95-4f6c-aae3-fc2659e619fa	JOB-0086	ec144862-1a7b-4bc7-80c6-96dc845145f3	317-727-5874	2025-07-23 00:00:00	misc	\N	800.00	paid	2025-11-10 15:30:15.720087	Large Engine Stands	2025-11-10 15:30:15.720087	\N
307a767f-0387-4f40-bbd8-f5bc95aa08c7	JOB-0141	6bb28ea7-be17-45f1-b309-38b7fd2bbb12	555-0000	2025-11-05 00:00:00	ceramic		2025.00	coated	2025-11-10 15:30:21.163898	3 sets Full Airboat; MCX	\N	\N
7085dde6-f499-425e-a73a-06606176cb6d	JOB-0122	8d2cdc73-96d7-4205-8023-f63e9478cf26	555-0000	2025-09-16 00:00:00	powder	\N	0.00	coated	2025-11-10 15:30:19.322795	Porsche 386 Fan Cowl	\N	\N
716099a3-4c41-4e05-bdc4-82464e6656b1	JOB-0123	c9b82299-80df-4828-a036-c2cdc343b455	555-0000	2025-09-12 00:00:00	ceramic	\N	100.00	coated	2025-11-10 15:30:19.422525	Rods and Brackets	\N	\N
11cecd27-6da2-46a1-86c0-3f5dcf76a57d	JOB-0132	661a8e65-9d11-444b-9769-574e110eee5f	321-632-1613	2025-10-20 00:00:00	ceramic	\N	450.00	coated	2025-11-10 15:30:20.289629	BBC Modular Headers; Edelbrock intake , small bracket	\N	\N
35d11d57-fc80-405c-bf08-bebe48c1e96e	JOB-0137	3fd11841-9603-40e9-9833-61ad92d72361	40753282504075756963	2025-10-31 00:00:00	powder	\N	800.00	coated	2025-11-10 15:30:20.786061	Fender liners and shackles	\N	\N
99a6cc7b-50db-4428-82f7-7787e5d0bdec	JOB-0138	c7dba781-043b-4e30-bdde-119d96019ac0	689-284-5171	2025-10-31 00:00:00	powder	\N	250.00	coated	2025-11-10 15:30:20.899775	Large window cranks, small window crank, speedo bezel	\N	\N
f82bfc70-36dc-4c04-9948-20734fbb6551	JOB-0139	c88b607b-3018-4958-bb68-dcd8b9dc3619	904-509-8939	2025-10-31 00:00:00	ceramic	\N	425.00	coated	2025-11-10 15:30:20.99651	VW full exhaust	\N	\N
24f14775-5964-4e3f-9bdd-6454e5ea6041	JOB-0142	dd6e012d-08e4-4bc6-9541-13f1ec8c5e87	555-0000	2025-10-23 00:00:00	ceramic	\N	0.00	received	2025-11-10 15:30:21.267862	endless parts	\N	\N
dc424464-014a-4736-9450-e64880d924c4	JOB-0010	521291a9-36da-40fa-8508-15ade4db096f	321-747-4555	2024-12-30 00:00:00	powder	\N	200.00	paid	2025-11-10 15:30:08.22485	Mazda Suspension with poly bushings	2025-11-10 15:30:08.22485	\N
aa898b28-822b-409a-9654-714d84dc1f4d	JOB-0011	56ec4d4d-1f8d-4f42-8bfa-4558f57674dd	321-276-1664	2025-01-02 00:00:00	powder	\N	150.00	paid	2025-11-10 15:30:08.326477	Turbo Hotside pipe; coolant fittings	2025-11-10 15:30:08.326477	\N
731663a7-e122-4f4a-81cb-e3e5485723ae	JOB-0012	cc1351d7-8685-4b2a-86e7-61bfab19acbf	407-718-7495	2024-12-27 00:00:00	powder	\N	350.00	paid	2025-11-10 15:30:08.430752	Clamshells , batt tray, trans xmember, seat brackets	2025-11-10 15:30:08.430752	\N
cf2c9214-cb22-4cd3-a49e-346b85a44809	JOB-0013	f2850ce0-c605-4f70-b97f-e5528d3fedef	321-228-4942	2024-12-25 00:00:00	ceramic	\N	325.00	paid	2025-11-10 15:30:08.531647	460 Ford Cast Manifold	2025-11-10 15:30:08.531647	\N
95bf70c7-3aa9-473e-8633-a0263181fe33	JOB-0095	0d1e87f5-7792-459a-bce4-3aa41057f132	555-0000	2025-07-31 00:00:00	ceramic	\N	0.00	paid	2025-11-10 15:30:16.575246	6 Cyl Lycoming Headers	2025-11-10 15:30:16.575246	\N
6186e69f-d43e-4c4d-b941-0f4437992aec	JOB-0096	327e4300-5f56-448d-9779-3c61729d6e88	772-766-2128	2025-08-06 00:00:00	ceramic	\N	300.00	paid	2025-11-10 15:30:16.690752	4 Cyl Headers	2025-11-10 15:30:16.690752	\N
81158456-1fa3-4fcd-8d69-f20b23e35857	JOB-0097	e901276c-f696-4b1b-8ee3-e3695545ecf2	386-864-5342	2025-08-07 00:00:00	ceramic	\N	300.00	paid	2025-11-10 15:30:16.788763	SBF Shorty Header ( Sanderson’s)	2025-11-10 15:30:16.788763	\N
d5f63407-b5b1-49b7-b7f7-80b6db236b8a	JOB-0098	71fe73fd-76cf-4bc6-bacb-0efd40574511	555-0000	2025-08-08 00:00:00	powder	\N	200.00	paid	2025-11-10 15:30:16.882654	Valve Cover; White RAL9001 Pearl with Gold letter	2025-11-10 15:30:16.882654	\N
b5a80cd8-6247-42bd-92a4-5defbdcb47ce	JOB-0099	0b3d5b67-9ea4-4f0a-aef4-a4061d1feab1	555-0000	2025-08-08 00:00:00	ceramic	\N	1000.00	paid	2025-11-10 15:30:16.978263	2 X pipes, 2 headers, 3 full pipes, 5 down pipes	2025-11-10 15:30:16.978263	\N
7ea675b8-8015-4cc1-b97a-80058c6c308a	JOB-0100	c340e4fa-340a-4462-88b0-8599559fb13f	407-800-5741	2025-08-11 00:00:00	ceramic	\N	475.00	paid	2025-11-10 15:30:17.055839	2 Pipes, Ceramic, 3 Boxes of misc parts to be sandblasted ONLY. 3 Heat shields to be blasted with glass.	2025-11-10 15:30:17.055839	\N
90219be5-7e33-4d28-add3-450c377cccef	JOB-0101	8041577b-96b8-4c9c-bdf3-3d05b95b1049	407-483-6323	2025-08-12 00:00:00	ceramic	\N	500.00	paid	2025-11-10 15:30:17.157802	LS3 Headers, 2 x pipes	2025-11-10 15:30:17.157802	\N
41952ab5-3433-4f7e-b36e-6309ee64fdfb	JOB-0102	554b5a13-7868-403c-b382-c1b3876a9a9e	386-215-6257	2025-08-13 00:00:00	ceramic	\N	300.00	paid	2025-11-10 15:30:17.253937	Honda Longtube Header	2025-11-10 15:30:17.253937	\N
0726cfe7-1fc8-43d6-94b4-472a51ff520a	JOB-0103	03afcd5b-1d68-4586-b755-1329d8769f02	555-0000	2025-07-31 00:00:00	ceramic	\N	0.00	paid	2025-11-10 15:30:17.355833	Ford Probe Header: Warranty	2025-11-10 15:30:17.355833	\N
b07c96a7-267b-48c2-8549-57a793c67a07	JOB-0104	cf57d156-e45e-4a07-a88c-fa4d4be3895e	754-366-6009	2025-08-13 00:00:00	ceramic	\N	300.00	paid	2025-11-10 15:30:17.455975	SBC Hedman Square Port Longtubes	2025-11-10 15:30:17.455975	\N
4ea957b8-5c7f-47c0-81e0-8da57ca628f4	JOB-0105	a2094be8-b19b-49af-8da2-6b37ff58d622	407-401-1466	2025-08-21 00:00:00	ceramic	\N	400.00	paid	2025-11-10 15:30:17.559009	High rise intake and carb plate	2025-11-10 15:30:17.559009	\N
29657142-b358-4fcf-b0d5-245faf4f9be1	JOB-0106	78a3247c-d397-43b4-9e92-169ebb75711c	555-0000	2025-08-25 00:00:00	ceramic	\N	520.00	paid	2025-11-10 15:30:17.662827	KVM/Sprint headers	2025-11-10 15:30:17.662827	\N
b5a298cb-11a4-4c98-9034-b8ec5edfd234	JOB-0107	46970ace-0615-4246-87c3-a84d422fe1c3	321-527-8800	2025-08-26 00:00:00	ceramic	\N	650.00	paid	2025-11-10 15:30:17.771807	Downpipes, Mid Pipes, LS longtubes	2025-11-10 15:30:17.771807	\N
6bbe2770-ea77-4e9a-b49b-076176b36cee	JOB-0108	c0a5b1c2-2139-4347-ba8c-bb5217c1479c	952-270-1129	2025-08-25 00:00:00	ceramic	\N	350.00	paid	2025-11-10 15:30:17.878732	Hooker Blackheart LS Mid-Length	2025-11-10 15:30:17.878732	\N
602f7d53-21ac-43f9-a9d1-cd91f54113b5	JOB-0110	fe04029c-0044-454a-a675-50453867c61e	555-0000	2025-08-27 00:00:00	ceramic	\N	400.00	paid	2025-11-10 15:30:18.104831	Modular 4 Cyl , DP, Muff, clamps	2025-11-10 15:30:18.104831	\N
91ff9971-f3df-4ef4-a63e-432b608f773a	JOB-0111	53717a11-6417-487c-8a05-7b6eda7bf92c	407-461-0498	2025-09-02 00:00:00	ceramic	\N	350.00	paid	2025-11-10 15:30:18.209776	Hedman BBC ( prior coating )	2025-11-10 15:30:18.209776	\N
67c9b30b-a7a0-4728-b70a-7a16adb99041	JOB-0112	138d3987-b853-47c5-80ee-80bf7a0c4fdf	863-978-8803	2025-09-02 00:00:00	ceramic	\N	325.00	paid	2025-11-10 15:30:18.319193	6 Cyl Headers	2025-11-10 15:30:18.319193	\N
e9dcc25d-432c-436c-90c8-39f004136332	JOB-0113	349ec3f1-2725-4684-bb08-8cd31f29f5a1	407-920-9304	2025-09-02 00:00:00	ceramic	\N	50.00	paid	2025-11-10 15:30:18.418302	Small, heat exchanger for car	2025-11-10 15:30:18.418302	\N
a77e98e7-c2f5-4195-9eb9-eb815aa9fc66	JOB-0114	d2aca0ae-f472-4eef-9cc8-8e53181c5ed0	321-689-4117	2025-09-03 00:00:00	ceramic	\N	725.00	paid	2025-11-10 15:30:18.51585	BBC Headers, exhaust pipes with Muffs, 2 clamps	2025-11-10 15:30:18.51585	\N
49599231-8293-4f59-aae7-96e4b2a22a67	JOB-0115	bcad9855-d0d3-4a34-aeb4-4d39674bc994	229-740-5265	2025-09-05 00:00:00	ceramic	\N	400.00	paid	2025-11-10 15:30:18.613883	Kooks Dodge stealth headers and extension pipe	2025-11-10 15:30:18.613883	\N
95f168d9-e2e9-4773-baa0-308025cd66dd	JOB-0116	0d1e87f5-7792-459a-bce4-3aa41057f132	555-0000	2025-09-09 00:00:00	ceramic	\N	550.00	paid	2025-11-10 15:30:18.692343	v-8 Longtube with muff ( 2 sets )	2025-11-10 15:30:18.692343	\N
11848fe6-eb56-4201-8304-d76ae316b2f1	JOB-0118	d2773630-7f36-4830-ab2e-80315e54c2d3	407-466-0932	2025-09-11 00:00:00	ceramic	\N	325.00	paid	2025-11-10 15:30:18.924239	SBC Block Hugger	2025-11-10 15:30:18.924239	\N
6ed4695c-11a5-4e2b-ad70-9590ab9dfc03	JOB-0119	f314cb32-a465-4bf2-93af-2b37af43e843	352-275-1555	2025-09-11 00:00:00	ceramic	\N	225.00	paid	2025-11-10 15:30:19.052096	4” Duramax tail pipes; 1 clamp	2025-11-10 15:30:19.052096	\N
29e71195-1078-435f-9ee7-718c36e333e2	JOB-0120	3dd20c28-b594-4322-bc0e-af297d88191b	407-949-1989	2025-09-10 00:00:00	ceramic	\N	75.00	paid	2025-11-10 15:30:19.152675	Olds 88 Hood Moulding	2025-11-10 15:30:19.152675	\N
3b6bf86b-2526-45a8-a6bf-65e458c7ae2a	JOB-0121	909193a7-6c64-4e5e-9626-69dc41c7adf3	813-299-1624	2025-09-10 00:00:00	ceramic	\N	385.00	paid	2025-11-10 15:30:19.252742	6 cyl headers with turndowns	2025-11-10 15:30:19.252742	\N
60b9840d-9a01-4093-8afe-348bd7750d21	JOB-0124	63ae3bcb-4f6a-45c5-9ba3-0c39f0f9d40c	352-586-8090	2025-09-17 00:00:00	powder	\N	400.00	paid	2025-11-10 15:30:19.498751	Boyd Valve Covers, Old BBC Headers, Oil Pan	2025-11-10 15:30:19.498751	\N
bb4ac186-2e03-4b2c-99e1-7008cbe7329f	JOB-0125	2be0452c-53ac-4b05-bb90-232650449bf9	321-609-0628	2025-09-12 00:00:00	ceramic	\N	400.00	paid	2025-11-10 15:30:19.605055	Kawasaki Exhaust Parts	2025-11-10 15:30:19.605055	\N
4c7e333c-3cb0-458b-aeb7-be6bf9ba5092	JOB-0126	748d673d-21c3-4267-bfd1-d19b0264c542	407-910-3035	2025-09-22 00:00:00	powder	\N	200.00	paid	2025-11-10 15:30:19.702393	Honda Civic Wheel	2025-11-10 15:30:19.702393	\N
7f776399-c80e-47fa-b8a8-6a4364f6fc21	JOB-0127	9e5a9cf7-63b9-4a55-a3ad-cfc9647da37b	386-479-3310	2025-09-22 00:00:00	powder	\N	575.00	paid	2025-11-10 15:30:19.797133	Harley Parts	2025-11-10 15:30:19.797133	\N
da941fa6-0309-466c-a211-127ba5ea3728	JOB-0128	3330ebc5-3be6-4ff8-ba3f-bcf5c30ac9e7	315-796-9700	2025-09-22 00:00:00	powder	\N	0.00	paid	2025-11-10 15:30:19.865625	Harley Parts	2025-11-10 15:30:19.865625	\N
c6e8b211-429f-4185-89b5-3f298ad99834	JOB-0129	f06e7477-423a-4f1e-b507-e403da538ec2	863-605-3008	2025-10-09 00:00:00	ceramic	\N	530.00	paid	2025-11-10 15:30:19.968208	6 Cyl with Muff, 6 individual primaries	2025-11-10 15:30:19.968208	\N
74b3723c-d269-4997-991a-0501bb54077f	JOB-0130	bcaa8b44-ffb8-43a4-980e-8e09b355dab0	689-284-5171	2025-10-09 00:00:00	ceramic	\N	0.00	paid	2025-11-10 15:30:20.081849	VW Convertible Moulding	2025-11-10 15:30:20.081849	\N
2883adf4-9010-4949-9a8e-561ac0dad12b	JOB-0131	326e4db8-9d77-47ff-a984-ead191bbdbaf	321-322-8713	2025-10-10 00:00:00	ceramic	\N	375.00	paid	2025-11-10 15:30:20.185741	SBC Longtube Fender	2025-11-10 15:30:20.185741	\N
eb1b3275-d981-4fb6-822a-1d2ec0520d8e	JOB-0133	2bc4bbe5-7166-4f25-aacf-a026fe8ec2cb	407-485-7256	2025-10-14 00:00:00	ceramic	\N	375.00	paid	2025-11-10 15:30:20.354137	SBC Longtubes ( painted Black)	2025-11-10 15:30:20.354137	\N
0304ae44-b284-41d5-84d0-e47dc8fef7b3	JOB-0134	cd09ce5c-48d9-49ed-973c-952c6f9f46dd	407-463-9534	2025-10-15 00:00:00	ceramic	\N	500.00	paid	2025-11-10 15:30:20.453376	VW Exhaust	2025-11-10 15:30:20.453376	\N
b433c097-092a-4e5a-8f24-201c3230b2f9	JOB-0135	cbeff216-6207-4646-9059-435e036ed610	773-733-8426	2025-10-20 00:00:00	ceramic	\N	200.00	paid	2025-11-10 15:30:20.550841	LS Turbo Manifold	2025-11-10 15:30:20.550841	\N
288b0a65-6e1d-47bb-898d-bfeef2b4eb9d	JOB-0136	208edd48-7455-4cee-b419-263364782df3	407-844-3582	2025-10-13 00:00:00	ceramic	\N	350.00	paid	2025-11-10 15:30:20.660919	S10 SBC Shorty Sanderson	2025-11-10 15:30:20.660919	\N
dba35727-ea2d-4ce9-86a7-18cefdb2ac98	JOB-0140	1e9fb404-10ae-48ef-ba12-369819cec111	214-310-2850	2025-10-24 00:00:00	misc	\N	425.00	paid	2025-11-10 15:30:21.098294	4.0 intake and Header	2025-11-10 15:30:21.098294	\N
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notes (id, job_id, customer_id, content, author, created_at) FROM stdin;
518b2797-7b11-4e18-a573-4eaf2e5992ab	\N	\N	Customer called to confirm appointment	Current User	2025-11-09 06:33:00.419981
e5152792-6647-41b6-a07f-cd2f9820e22e	\N	\N	Test note content	Current User	2025-11-09 06:39:29.161117
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (id, name, category, price, created_at) FROM stdin;
3668ba5e-c19f-4018-b3fd-9624d4f34a4b	Dual carb tunnel ram	powder	400.00	2025-11-12 03:05:05.786516
2ff08775-7238-4fd8-b789-37accc34ffc3	High rise EFI intake	powder	300.00	2025-11-12 03:05:05.833019
ebf357ef-dbfa-4b5a-a347-b394ba6403b9	Normal intake manifold	powder	250.00	2025-11-12 03:05:05.868084
f4f66993-c9a0-401d-ad08-80acf9ed0560	Harley frame	powder	350.00	2025-11-12 03:05:05.903189
1f8275b3-c615-4fce-bf70-58bf132bb7fb	Swing arm	powder	150.00	2025-11-12 03:05:05.936811
38ef3881-f705-4881-b951-ab2bb366e143	Jugs (set)	powder	350.00	2025-11-12 03:05:05.969383
ccd861fd-c517-4c5e-b035-b0f264705cdc	Tappets (set with covers)	powder	60.00	2025-11-12 03:05:06.010601
a445715e-127c-47ce-978e-2a537e73d2a0	Inner primary	powder	175.00	2025-11-12 03:05:06.045039
a3faa3db-ceff-4618-9536-87156b47db1a	Trans cover	powder	60.00	2025-11-12 03:05:06.079169
b511a2d4-926e-4634-96b1-8889f228c68c	Rocker boxes (each)	powder	125.00	2025-11-12 03:05:06.113283
e258a9e4-4214-4a0a-8753-d9a2376df1c3	Cam cover	powder	100.00	2025-11-12 03:05:06.147402
51991a81-c787-4b02-874a-6a7c4c2533be	Cam cover assembly	powder	150.00	2025-11-12 03:05:06.181512
c3117b01-315c-4bec-b804-f9d9dba6132c	Harley wheels (pair, single tone)	powder	350.00	2025-11-12 03:05:06.216008
c76c332a-c619-466f-9a4a-b30dde19ffdb	Harley wheels (pair, two tone)	powder	475.00	2025-11-12 03:05:06.250303
c41ff043-5906-44ed-9127-26d99a4bd3a2	Harley primary outer cover	powder	150.00	2025-11-12 03:05:06.284094
824875e3-e1ed-434b-8862-f8776fa860e8	Harley fork tubes (pair)	powder	100.00	2025-11-12 03:05:06.317659
a6fc7a36-e5d3-4d9b-9f7a-5871a36f05c5	Harley headlight bucket (cone, pair)	powder	50.00	2025-11-12 03:05:06.350504
9aba6c83-b636-4ea9-bdb6-bbc6f5204081	Brake calipers (4 with brackets)	powder	600.00	2025-11-12 03:05:06.385287
39d9452b-ec27-49b6-8910-8663f6f4a3ee	Wheels (up to 20") - Single Color	powder	160.00	2025-11-12 03:08:54.170891
f41a50d9-223c-42c4-98f6-dfe150e7da66	Wheels (up to 20") - Single Color (4+ wheels)	powder	130.00	2025-11-12 03:08:54.170891
ccadd168-faee-4d74-a3c9-a18b13b35a5b	Wheels (up to 20") - Single with Clear (4+ wheels)	powder	170.00	2025-11-12 03:08:54.170891
bc0b125f-a991-40e8-9fe9-d828ec2cbd13	Wheels (up to 20") - 2 Tone	powder	250.00	2025-11-12 03:08:54.170891
dc49e30e-724e-4f2a-be37-fce56f9f6874	Wheels (up to 20") - 2 Tone (4+ wheels)	powder	220.00	2025-11-12 03:08:54.170891
c8a77006-ddd3-46f3-b216-a2561443c3c6	Wheels (up to 20") - Candy/Translucent	powder	275.00	2025-11-12 03:08:54.170891
0dc04b2c-c1fb-4475-846c-8f9cf510d76a	Wheels (up to 20") - Candy/Translucent (4+ wheels)	powder	250.00	2025-11-12 03:08:54.170891
73a1c740-5089-49a1-b32f-7e3b54ab13c4	Wheels (up to 20") - Single color with Clear Coat	powder	200.00	2025-11-12 03:08:54.170891
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (sid, sess, expire) FROM stdin;
5eiUGupnsCvEx1sV8rw8NinMyxS0H-Wk	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-23T03:03:53.557Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"id": "a10bda91-80cb-4147-b1f9-0d93f19ccd1b", "role": "full_admin", "username": "admin"}}}	2025-11-23 07:42:32
rGC0wIFfwXt89ZrZel12ldgaaF0nMOwN	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-24T17:00:58.657Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"id": "a10bda91-80cb-4147-b1f9-0d93f19ccd1b", "role": "full_admin", "username": "admin"}}}	2025-11-24 17:01:00
YAXIiUpRX34f09CBIDM7tzq6i-0RAFWf	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-22T02:30:37.765Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"id": "a10bda91-80cb-4147-b1f9-0d93f19ccd1b", "role": "full_admin", "username": "admin"}}}	2025-11-22 02:30:54
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password_hash, role, created_at) FROM stdin;
3f265e68-7ac9-4e5f-b5ee-913f66f84f11	manager	$2b$10$89wu/ExIfgDh16r8hL6t5.WbO..93nAnT9bq8rJaL.o54PYXnZAdK	manager	2025-11-13 13:33:05.863095
0d5b81e5-cdd4-4c2a-a639-5030c1c5700e	testuser	$2b$10$GdOY3htlJ29n2bu3kwWr1eP1rATFFQZVPtxJo5rOrfpTDzpez9W/G	admin	2025-11-14 15:53:35.071896
b69b52f8-3118-4049-a721-24f4b2b3607f	finaluser	$2b$10$e9mgT70EXR44Vr9SiZElheoSxHD7nBsa7OFOZ.KDRX48XWuzX5zWW	admin	2025-11-14 15:56:37.691231
980a7049-289b-4a28-adf3-e1cbe3ea5d8f	fulladmin@test.com		full_admin	2025-11-14 19:03:32.884917
a10bda91-80cb-4147-b1f9-0d93f19ccd1b	admin	$2b$10$wwx6mW8RPdDIyLMTyBKhMemPLO.JnFr0YczC4woMNQ3QNBA1mMJkK	full_admin	2025-11-13 11:37:45.985668
\.


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: estimate_services estimate_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estimate_services
    ADD CONSTRAINT estimate_services_pkey PRIMARY KEY (id);


--
-- Name: estimates estimates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estimates
    ADD CONSTRAINT estimates_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: job_inventory job_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_inventory
    ADD CONSTRAINT job_inventory_pkey PRIMARY KEY (id);


--
-- Name: job_services job_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_services
    ADD CONSTRAINT job_services_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: estimate_services estimate_services_estimate_id_estimates_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estimate_services
    ADD CONSTRAINT estimate_services_estimate_id_estimates_id_fk FOREIGN KEY (estimate_id) REFERENCES public.estimates(id) ON DELETE CASCADE;


--
-- Name: estimate_services estimate_services_service_id_services_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estimate_services
    ADD CONSTRAINT estimate_services_service_id_services_id_fk FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: job_inventory job_inventory_inventory_id_inventory_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_inventory
    ADD CONSTRAINT job_inventory_inventory_id_inventory_id_fk FOREIGN KEY (inventory_id) REFERENCES public.inventory(id);


--
-- Name: job_inventory job_inventory_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_inventory
    ADD CONSTRAINT job_inventory_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: job_services job_services_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_services
    ADD CONSTRAINT job_services_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: job_services job_services_service_id_services_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_services
    ADD CONSTRAINT job_services_service_id_services_id_fk FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: jobs jobs_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: jobs jobs_service_id_services_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_service_id_services_id_fk FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: notes notes_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: notes notes_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict FdpgDRhi5dfA35BkUhscAAE9te3mJ8X8zcta40ZtN7dQPtsBYoGb7dXHb5gMJSF

