-- Preserve the exact money types from the original migration history.
-- Fail rather than round or truncate any existing values.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM package_prices WHERE price<>round(price,2) OR abs(price)>=10000000000)
 OR EXISTS(SELECT 1 FROM partner_participations WHERE custom_price<>round(custom_price,2) OR abs(custom_price)>=10000000000)
 THEN RAISE EXCEPTION 'Money values cannot be represented without loss'; END IF;
END $$;
ALTER TABLE package_prices ALTER COLUMN price TYPE numeric(12,2);
ALTER TABLE partner_participations ALTER COLUMN custom_price TYPE numeric(12,2);
