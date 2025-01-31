-- İndeksleri sil
DROP INDEX IF EXISTS idx_tours_company_ref;
DROP INDEX IF EXISTS idx_tours_operator_id;
DROP INDEX IF EXISTS idx_tour_days_tour_id;
DROP INDEX IF EXISTS idx_tour_pickup_times_tour_id;
DROP INDEX IF EXISTS idx_tour_options_tour_id;

-- Trigger'ı sil
DROP TRIGGER IF EXISTS update_tours_updated_at ON tours;

-- Trigger fonksiyonunu sil
DROP FUNCTION IF EXISTS update_updated_at_column();

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS tour_options;
DROP TABLE IF EXISTS tour_pickup_times;
DROP TABLE IF EXISTS tour_days;
DROP TABLE IF EXISTS tours;

SET FOREIGN_KEY_CHECKS = 1; 