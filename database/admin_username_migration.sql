BEGIN;

-- Compatibility for databases that still have the old admin.email column.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'admins'
          AND column_name = 'email'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'admins'
          AND column_name = 'username'
    ) THEN
        ALTER TABLE admins RENAME COLUMN email TO username;
    END IF;
END;
$$;

ALTER TABLE admins
    ALTER COLUMN username TYPE VARCHAR(50);

ALTER TABLE admins
    ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_lower
    ON users (LOWER(username));

CREATE UNIQUE INDEX IF NOT EXISTS uq_admins_username_lower
    ON admins (LOWER(username));

CREATE OR REPLACE FUNCTION enforce_unique_account_username()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(
        hashtextextended(LOWER(NEW.username), 0)
    );

    IF TG_TABLE_NAME = 'users' THEN
        IF EXISTS (
            SELECT 1
            FROM admins
            WHERE LOWER(username) = LOWER(NEW.username)
        ) THEN
            RAISE EXCEPTION 'username already exists'
                USING ERRCODE = '23505';
        END IF;
    ELSE
        IF EXISTS (
            SELECT 1
            FROM users
            WHERE LOWER(username) = LOWER(NEW.username)
        ) THEN
            RAISE EXCEPTION 'username already exists'
                USING ERRCODE = '23505';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_unique_account_username ON users;

CREATE TRIGGER trg_users_unique_account_username
BEFORE INSERT OR UPDATE OF username ON users
FOR EACH ROW
EXECUTE FUNCTION enforce_unique_account_username();

DROP TRIGGER IF EXISTS trg_admins_unique_account_username ON admins;

CREATE TRIGGER trg_admins_unique_account_username
BEFORE INSERT OR UPDATE OF username ON admins
FOR EACH ROW
EXECUTE FUNCTION enforce_unique_account_username();

COMMIT;
