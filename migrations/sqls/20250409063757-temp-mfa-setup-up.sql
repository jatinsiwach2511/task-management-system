CREATE DOMAIN phone_number_type AS VARCHAR(15)
    CHECK (VALUE ~ '^\+?[0-9]{1,14}$');

CREATE DOMAIN email_type AS VARCHAR(255)
    CHECK (value ~ '^[^@]+@[^@]+\.[^@]+$');

CREATE TABLE mfa_email_method (
    id BIGSERIAL PRIMARY KEY,
    userid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email email_type NOT NULL,
    verification_token CHAR(6), 
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes')
);


CREATE TABLE mfa_phone_method (
    id BIGSERIAL PRIMARY KEY,
    userid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone phone_number_type NOT NULL,
    verification_token CHAR(6), 
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes')
);


CREATE TABLE mfa_totp_method (
    id BIGSERIAL PRIMARY KEY,
    userid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    authenticator_secret TEXT NOT NULL,
     is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE temp_mfa_email_method (
    id BIGSERIAL PRIMARY KEY,
    userid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email email_type NOT NULL,
    verification_token CHAR(6), 
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes')
);


CREATE TABLE temp_mfa_phone_method (
    id BIGSERIAL PRIMARY KEY,
    userid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone phone_number_type NOT NULL,
    verification_token CHAR(6),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes')
);


CREATE TABLE temp_mfa_totp_method (
    id BIGSERIAL PRIMARY KEY,
    userid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    authenticator_secret TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_token_expires_at() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.token_expires_at := NOW() + INTERVAL '15 minutes';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER update_mfa_email_method_expires_at
BEFORE UPDATE ON mfa_email_method
FOR EACH ROW
EXECUTE FUNCTION update_token_expires_at();


CREATE TRIGGER update_mfa_phone_method_expires_at
BEFORE UPDATE ON mfa_phone_method
FOR EACH ROW
EXECUTE FUNCTION update_token_expires_at();



CREATE TRIGGER update_temp_mfa_email_method_expires_at
BEFORE UPDATE ON temp_mfa_email_method
FOR EACH ROW
EXECUTE FUNCTION update_token_expires_at();


CREATE TRIGGER update_temp_mfa_phone_method_expires_at
BEFORE UPDATE ON temp_mfa_phone_method
FOR EACH ROW
EXECUTE FUNCTION update_token_expires_at();


