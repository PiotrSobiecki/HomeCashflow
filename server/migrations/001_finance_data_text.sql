-- Jednorazowo na istniejącej bazie (była kolumna JSONB): dane jako TEXT — jawny JSON legacy albo ff1:… (AES-GCM).
-- Nowe instalacje: wystarczy schema.sql z kolumną TEXT.
ALTER TABLE finance_data
  ALTER COLUMN data SET DATA TYPE TEXT USING (data::text);
