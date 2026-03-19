--
-- PostgreSQL database dump
--

\restrict gqDxsEodmxSowKNJhfaVKlL3K6Ehp1n5v5PkRkbtTkhP0aRKGMqfOaY1RjeUYKh

-- Dumped from database version 16.10
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

--
-- Name: market_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.market_status AS ENUM (
    'PENDING',
    'LIVE',
    'PAUSED',
    'REJECTED',
    'VAULT_UNLOCK',
    'FROZEN'
);


--
-- Name: position_side; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.position_side AS ENUM (
    'LONG',
    'SHORT'
);


--
-- Name: trade_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.trade_status AS ENUM (
    'OPEN',
    'CLOSED',
    'LIQUIDATED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    actor_wallet text NOT NULL,
    action text NOT NULL,
    target_id text,
    detail text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: exchange_deposit_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_deposit_history (
    id integer NOT NULL,
    wallet_address text NOT NULL,
    tx_hash text,
    amount numeric NOT NULL,
    currency text DEFAULT 'USDT'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    deposit_address text,
    chain text DEFAULT 'BSC'::text,
    sub_uid text,
    expires_at timestamp without time zone,
    credited_at timestamp without time zone,
    gate_deposit_id text
);


--
-- Name: exchange_deposit_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exchange_deposit_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exchange_deposit_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exchange_deposit_history_id_seq OWNED BY public.exchange_deposit_history.id;


--
-- Name: exchange_subaccount_pool; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_subaccount_pool (
    id integer NOT NULL,
    gate_sub_uid text NOT NULL,
    gate_login_name text,
    gate_api_key text,
    in_use boolean DEFAULT false NOT NULL,
    assigned_wallet text,
    assigned_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: exchange_subaccount_pool_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exchange_subaccount_pool_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exchange_subaccount_pool_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exchange_subaccount_pool_id_seq OWNED BY public.exchange_subaccount_pool.id;


--
-- Name: exchange_trading_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_trading_accounts (
    id integer NOT NULL,
    wallet_address text NOT NULL,
    gate_sub_uid text,
    gate_api_key text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: exchange_trading_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exchange_trading_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exchange_trading_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exchange_trading_accounts_id_seq OWNED BY public.exchange_trading_accounts.id;


--
-- Name: exchange_user_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_user_balances (
    id integer NOT NULL,
    wallet_address text NOT NULL,
    available numeric DEFAULT '0'::numeric NOT NULL,
    unrealised_pnl numeric DEFAULT '0'::numeric NOT NULL,
    total numeric DEFAULT '0'::numeric NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: exchange_user_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exchange_user_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exchange_user_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exchange_user_balances_id_seq OWNED BY public.exchange_user_balances.id;


--
-- Name: exchange_withdrawal_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_withdrawal_history (
    id integer NOT NULL,
    wallet_address text NOT NULL,
    tx_hash text,
    amount numeric NOT NULL,
    currency text DEFAULT 'USDT'::text NOT NULL,
    to_address text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    chain text DEFAULT 'BSC'::text,
    sub_uid text,
    gate_withdrawal_id text,
    completed_at timestamp without time zone,
    error_msg text
);


--
-- Name: exchange_withdrawal_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exchange_withdrawal_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exchange_withdrawal_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exchange_withdrawal_history_id_seq OWNED BY public.exchange_withdrawal_history.id;


--
-- Name: markets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.markets (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    owner_wallet text NOT NULL,
    token_address text NOT NULL,
    token_name text NOT NULL,
    token_symbol text NOT NULL,
    token_logo text,
    pair_address text,
    status public.market_status DEFAULT 'PENDING'::public.market_status NOT NULL,
    mcap real DEFAULT 0,
    liquidity real DEFAULT 0,
    price_usd real DEFAULT 0,
    spread real DEFAULT 0.5,
    max_leverage integer DEFAULT 1,
    max_position real DEFAULT 20,
    max_oi real DEFAULT 500,
    min_vault real DEFAULT 500,
    vault_balance real DEFAULT 0,
    insurance_balance real DEFAULT 0,
    vault_deposited_at timestamp without time zone,
    vault_unlocks_at timestamp without time zone,
    open_interest real DEFAULT 0,
    long_ratio real DEFAULT 50,
    funding_rate real DEFAULT 0,
    volume_24h real DEFAULT 0,
    fees_earned real DEFAULT 0,
    contract_vault text,
    contract_perps text,
    contract_oracle text,
    contract_funding text,
    contract_liquidation text,
    contract_insurance text,
    market_bot_wallet text,
    market_bot_privkey text,
    lock_duration integer DEFAULT 604800,
    refresh_interval integer DEFAULT 300,
    gas_bnb_required real DEFAULT 0,
    gas_bnb_paid boolean DEFAULT false,
    pending_fees real DEFAULT 0,
    platform_fees real DEFAULT 0,
    params_locked_by_admin boolean DEFAULT false,
    last_refreshed timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    token_origin text DEFAULT 'FLAP'::text NOT NULL
);


--
-- Name: page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_views (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    fingerprint character varying(64) NOT NULL,
    country_code character varying(4),
    country_name character varying(80),
    page character varying(255),
    viewed_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_settings (
    key text NOT NULL,
    value text DEFAULT ''::text NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: trade_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trade_history (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    market_id character varying NOT NULL,
    trader_wallet text NOT NULL,
    side public.position_side NOT NULL,
    status public.trade_status DEFAULT 'OPEN'::public.trade_status NOT NULL,
    size real NOT NULL,
    leverage integer NOT NULL,
    entry_price real NOT NULL,
    exit_price real,
    pnl real,
    fee_open real,
    fee_close real,
    opened_at timestamp without time zone DEFAULT now() NOT NULL,
    closed_at timestamp without time zone,
    tx_hash_open text,
    tx_hash_close text
);


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    wallet_address text NOT NULL,
    nonce text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: visitor_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visitor_sessions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    fingerprint character varying(64) NOT NULL,
    country_code character varying(4),
    country_name character varying(80),
    page character varying(255),
    first_seen timestamp without time zone DEFAULT now() NOT NULL,
    last_seen timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: exchange_deposit_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_deposit_history ALTER COLUMN id SET DEFAULT nextval('public.exchange_deposit_history_id_seq'::regclass);


--
-- Name: exchange_subaccount_pool id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_subaccount_pool ALTER COLUMN id SET DEFAULT nextval('public.exchange_subaccount_pool_id_seq'::regclass);


--
-- Name: exchange_trading_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_trading_accounts ALTER COLUMN id SET DEFAULT nextval('public.exchange_trading_accounts_id_seq'::regclass);


--
-- Name: exchange_user_balances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_user_balances ALTER COLUMN id SET DEFAULT nextval('public.exchange_user_balances_id_seq'::regclass);


--
-- Name: exchange_withdrawal_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_withdrawal_history ALTER COLUMN id SET DEFAULT nextval('public.exchange_withdrawal_history_id_seq'::regclass);


--
-- Name: admin_logs admin_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_pkey PRIMARY KEY (id);


--
-- Name: exchange_deposit_history exchange_deposit_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_deposit_history
    ADD CONSTRAINT exchange_deposit_history_pkey PRIMARY KEY (id);


--
-- Name: exchange_subaccount_pool exchange_subaccount_pool_gate_sub_uid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_subaccount_pool
    ADD CONSTRAINT exchange_subaccount_pool_gate_sub_uid_unique UNIQUE (gate_sub_uid);


--
-- Name: exchange_subaccount_pool exchange_subaccount_pool_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_subaccount_pool
    ADD CONSTRAINT exchange_subaccount_pool_pkey PRIMARY KEY (id);


--
-- Name: exchange_trading_accounts exchange_trading_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_trading_accounts
    ADD CONSTRAINT exchange_trading_accounts_pkey PRIMARY KEY (id);


--
-- Name: exchange_trading_accounts exchange_trading_accounts_wallet_address_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_trading_accounts
    ADD CONSTRAINT exchange_trading_accounts_wallet_address_unique UNIQUE (wallet_address);


--
-- Name: exchange_user_balances exchange_user_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_user_balances
    ADD CONSTRAINT exchange_user_balances_pkey PRIMARY KEY (id);


--
-- Name: exchange_withdrawal_history exchange_withdrawal_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_withdrawal_history
    ADD CONSTRAINT exchange_withdrawal_history_pkey PRIMARY KEY (id);


--
-- Name: markets markets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_pkey PRIMARY KEY (id);


--
-- Name: markets markets_token_address_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_token_address_unique UNIQUE (token_address);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (key);


--
-- Name: user_sessions session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: trade_history trade_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_history
    ADD CONSTRAINT trade_history_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_wallet_address_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_wallet_address_unique UNIQUE (wallet_address);


--
-- Name: visitor_sessions visitor_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitor_sessions
    ADD CONSTRAINT visitor_sessions_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.user_sessions USING btree (expire);


--
-- PostgreSQL database dump complete
--

\unrestrict gqDxsEodmxSowKNJhfaVKlL3K6Ehp1n5v5PkRkbtTkhP0aRKGMqfOaY1RjeUYKh

