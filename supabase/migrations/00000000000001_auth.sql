-- Enable the pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    encrypted_password TEXT,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create function to handle wallet authentication
CREATE OR REPLACE FUNCTION auth.authenticate_wallet(
    wallet_addr TEXT,
    signature TEXT
) RETURNS auth.users AS $$
DECLARE
    user_record auth.users;
BEGIN
    -- Get or create user
    INSERT INTO auth.users (wallet_address)
    VALUES (lower(wallet_addr))
    ON CONFLICT (wallet_address) DO UPDATE
    SET last_sign_in_at = now()
    RETURNING * INTO user_record;

    -- Update the encrypted signature
    UPDATE auth.users
    SET encrypted_password = crypt(signature, gen_salt('bf'))
    WHERE id = user_record.id;

    RETURN user_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 