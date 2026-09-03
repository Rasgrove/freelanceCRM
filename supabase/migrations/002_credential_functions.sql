-- ============================================================
-- 002: Credential encryption/decryption helper functions
-- Run AFTER 001_schema.sql
-- ============================================================

-- Function to insert a credential with pgcrypto encryption atomically
CREATE OR REPLACE FUNCTION encrypt_credential(
  p_proyecto_id uuid,
  p_servicio text,
  p_usuario text,
  p_password text,
  p_notas text,
  p_key text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO project_credentials (proyecto_id, servicio, usuario_cifrado, password_cifrado, notas)
  VALUES (
    p_proyecto_id,
    p_servicio,
    pgp_sym_encrypt(p_usuario, p_key),
    pgp_sym_encrypt(p_password, p_key),
    p_notas
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Function to decrypt a single field of a credential
CREATE OR REPLACE FUNCTION decrypt_credential_field(
  p_credential_id uuid,
  p_field text,   -- 'usuario_cifrado' or 'password_cifrado'
  p_key text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_value text;
BEGIN
  IF p_field = 'usuario_cifrado' THEN
    SELECT pgp_sym_decrypt(usuario_cifrado, p_key)::text
    INTO v_value
    FROM project_credentials
    WHERE id = p_credential_id;
  ELSIF p_field = 'password_cifrado' THEN
    SELECT pgp_sym_decrypt(password_cifrado, p_key)::text
    INTO v_value
    FROM project_credentials
    WHERE id = p_credential_id;
  ELSE
    RAISE EXCEPTION 'Invalid field: %', p_field;
  END IF;

  RETURN v_value;
END;
$$;

GRANT EXECUTE ON FUNCTION encrypt_credential TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_credential_field TO authenticated;
