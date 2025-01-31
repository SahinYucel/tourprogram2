CREATE TABLE IF NOT EXISTS tours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_ref VARCHAR(255) NOT NULL,  -- company_user tablosundaki company_ref ile eşleşecek
    tour_name VARCHAR(255) NOT NULL,
    operator VARCHAR(255) NOT NULL,
    operator_id VARCHAR(255) NOT NULL,
    adult_price DECIMAL(10,2),
    child_price DECIMAL(10,2),
    selected_days JSON,  -- Seçili günler için JSON array
    pickup_times JSON,   -- Alış noktaları ve saatleri için JSON array
    bolge_id JSON,      -- Bölge ID'leri için JSON array
    options JSON,       -- Ekstra seçenekler için JSON array
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_company_ref (company_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 