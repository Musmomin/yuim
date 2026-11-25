// SQL migratsiyalar. Yangi o'zgarish — ro'yxat oxiriga yangi element qo'shing,
// mavjudlarini hech qachon o'zgartirmang (ular allaqachon bazalarda qo'llangan).
// schema.ts bilan mos bo'lishi kerak.
export const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: '0001_init',
    sql: `
CREATE TABLE investors (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  stir text NOT NULL,
  contact text NOT NULL,
  capital bigint NOT NULL
);

CREATE TABLE users (
  id text PRIMARY KEY,
  login text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','menejer','komplayens','investitsiya','yuridik','audit','investor','biznes')),
  investor_id text REFERENCES investors(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE applications (
  id text PRIMARY KEY,
  owner_id text REFERENCES users(id),
  manager_id text REFERENCES users(id),
  manager_name text NOT NULL,
  investor_id text REFERENCES investors(id),
  investor_name text,
  company text NOT NULL,
  stir text NOT NULL,
  director text NOT NULL,
  phone text NOT NULL,
  region text NOT NULL,
  sector text NOT NULL,
  activity text NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  term_months integer NOT NULL,
  investor_share integer NOT NULL CHECK (investor_share BETWEEN 1 AND 99),
  purpose text NOT NULL,
  revenue_12m bigint NOT NULL,
  profit_12m bigint NOT NULL,
  employees integer NOT NULL,
  stage text NOT NULL CHECK (stage IN ('yangi','korik','qaytarildi','yuridik','imzolash','moliyalashtirildi','yakunlandi','rad')),
  agreement_no text UNIQUE,
  funded_at timestamptz,
  submitted_at timestamptz NOT NULL,
  ai jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX applications_owner_idx ON applications(owner_id);
CREATE INDEX applications_investor_idx ON applications(investor_id);

CREATE TABLE reviews (
  application_id text NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  key text NOT NULL CHECK (key IN ('komplayens','investitsiya','yuridik')),
  status text NOT NULL CHECK (status IN ('kutilmoqda','tasdiqlandi','rad','qayta')),
  by_user_id text REFERENCES users(id),
  by_name text,
  at timestamptz,
  comment text,
  PRIMARY KEY (application_id, key)
);

CREATE TABLE monthly_reports (
  application_id text NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  month text NOT NULL,
  revenue bigint NOT NULL,
  expenses bigint NOT NULL,
  plan bigint NOT NULL,
  PRIMARY KEY (application_id, month)
);

CREATE TABLE audit_log (
  id serial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  user_id text,
  user_name text NOT NULL,
  role text NOT NULL,
  action text NOT NULL,
  target text
);
CREATE INDEX audit_target_idx ON audit_log(target);

-- Audit jurnali o'zgartirib bo'lmaydigan bo'lishi kerak: UPDATE va DELETE taqiqlanadi
CREATE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log yozuvlarini o''zgartirib yoki o''chirib bo''lmaydi';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER audit_log_no_update BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();

CREATE TABLE counters (
  key text PRIMARY KEY,
  value integer NOT NULL
);
`,
  },
];
