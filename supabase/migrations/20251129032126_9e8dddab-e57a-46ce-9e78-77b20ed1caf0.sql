-- Deactivate legacy 6-character couple codes
-- This ensures only the 8-character XXXX-XXXX format is active
UPDATE couples 
SET is_active = false 
WHERE LENGTH(REPLACE(couple_code, '-', '')) != 8;