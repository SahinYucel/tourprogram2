-- Ana tur tablosu
CREATE TABLE tours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_ref VARCHAR(255) NOT NULL,
    tour_name VARCHAR(255) NOT NULL,
    operator VARCHAR(255) NOT NULL,
    operator_id VARCHAR(255) NOT NULL,
    adult_price DECIMAL(10,2) DEFAULT 0,
    child_price DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_company_ref (company_ref),
    INDEX idx_operator_id (operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tur günleri tablosu
CREATE TABLE tour_days (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tour_id INT NOT NULL,
    day_number INT CHECK (day_number BETWEEN 1 AND 7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_tour_day (tour_id, day_number),
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
    INDEX idx_tour_id (tour_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kalkış zamanları tablosu
CREATE TABLE tour_pickup_times (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tour_id INT NOT NULL,
    hour VARCHAR(2) NOT NULL,
    minute VARCHAR(2) NOT NULL,
    region VARCHAR(255),
    area VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
    INDEX idx_tour_id (tour_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tur seçenekleri tablosu
CREATE TABLE tour_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tour_id INT NOT NULL,
    option_name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
    INDEX idx_tour_id (tour_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger fonksiyonu - updated_at alanını günceller
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ana tablo için trigger
CREATE TRIGGER update_tours_updated_at
    BEFORE UPDATE ON tours
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- İndeksler
CREATE INDEX idx_tours_company_ref ON tours(company_ref);
CREATE INDEX idx_tours_operator_id ON tours(operator_id);
CREATE INDEX idx_tour_days_tour_id ON tour_days(tour_id);
CREATE INDEX idx_tour_pickup_times_tour_id ON tour_pickup_times(tour_id);
CREATE INDEX idx_tour_options_tour_id ON tour_options(tour_id); 