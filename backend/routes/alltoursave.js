const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.post('/save', async (req, res) => {
    const connection = await db.promise();
    
    try {
      await connection.beginTransaction();

      // Veri kontrolü
      if (!Array.isArray(req.body) || req.body.length === 0) {
        throw new Error('Geçerli tur verisi bulunamadı');
      }

      const companyRef = req.body[0]?.mainTour?.company_ref;
      if (!companyRef) {
        throw new Error('Company reference is required');
      }

      console.log('Gelen veriler:', JSON.stringify(req.body, null, 2));

      // Mevcut turları sil
      await connection.query(
        'DELETE FROM tours WHERE company_ref = ?',
        [companyRef]
      );

      // Yeni turları ekle
      for (const tourData of req.body) {
        const { mainTour, days, pickupTimes, options } = tourData;

        // Ana tur kaydı
        const [tourResult] = await connection.query(
          `INSERT INTO tours (
            company_ref, tour_name, operator, operator_id, 
            adult_price, child_price
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            mainTour.company_ref,
            mainTour.tour_name,
            mainTour.operator,
            mainTour.operator_id,
            parseFloat(mainTour.adult_price) || 0,
            parseFloat(mainTour.child_price) || 0
          ]
        );

        const tourId = tourResult.insertId;
        console.log('Eklenen tur ID:', tourId);

        // Günleri kaydet
        if (Array.isArray(days)) {
          // Önce bu tura ait tüm günleri sil
          await connection.query(
            'DELETE FROM tour_days WHERE tour_id = ?',
            [tourId]
          );

          // Gelen günlerin geçerli olduğundan emin ol (1-7 arası)
          const validDays = days.filter(day => day >= 0 && day <= 7);
          
          // 7 günlük bir dizi oluştur
          const fullWeekDays = Array(7).fill(0).map((_, index) => {
            const dayNumber = index + 1;
            return validDays.includes(dayNumber) ? dayNumber : 0;  // Seçili olmayan günler için 0
          });

          // Bulk insert kullan
          const dayValues = fullWeekDays.map(day => [tourId, day]);
          
          await connection.query(
            'INSERT INTO tour_days (tour_id, day_number) VALUES ?',
            [dayValues]
          );
        }

        // Kalkış zamanlarını kaydet
        if (Array.isArray(pickupTimes) && pickupTimes.length > 0) {
          const timeValues = pickupTimes.map(time => [
            tourId, 
            time.hour || '00',
            time.minute || '00',
            time.region || '',
            time.area || '',
            time.period || '1'
          ]);

          if (timeValues.length > 0) {
            await connection.query(
              `INSERT INTO tour_pickup_times 
              (tour_id, hour, minute, region, area, period) 
              VALUES ?`,
              [timeValues]
            );
          }
        }

        // Seçenekleri kaydet
        if (Array.isArray(options) && options.length > 0) {
          const optionValues = options
            .filter(opt => opt.name || opt.option_name || opt.price)
            .map(opt => [
              tourId, 
              opt.option_name || opt.name || '',
              parseFloat(opt.price) || 0
            ]);

          if (optionValues.length > 0) {
            await connection.query(
              'INSERT INTO tour_options (tour_id, option_name, price) VALUES ?',
              [optionValues]
            );
          }
        }
      }

      await connection.commit();
      console.log('Kayıt başarılı');
      res.json({ 
        success: true, 
        message: 'Turlar başarıyla kaydedildi',
        savedCount: req.body.length
      });

    } catch (error) {
      await connection.rollback();
      console.error('Tour kaydetme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Turlar kaydedilirken bir hata oluştu',
        error: error.message
      });
    }
  });

  // Turları getirme endpoint'i
  router.get('/:companyRef', async (req, res) => {
    const connection = await db.promise();
    try {
      const { companyRef } = req.params;

      // Ana tur bilgilerini al
      const [tours] = await connection.query(
        'SELECT * FROM tours WHERE company_ref = ?',
        [companyRef]
      );

      // Her tur için ilişkili verileri al
      const fullTours = await Promise.all(tours.map(async (tour) => {
        // Günleri al
        const [days] = await connection.query(
          'SELECT day_number FROM tour_days WHERE tour_id = ?',
          [tour.id]
        );

        // Kalkış zamanlarını al
        const [pickupTimes] = await connection.query(
          'SELECT * FROM tour_pickup_times WHERE tour_id = ?',
          [tour.id]
        );

        // Seçenekleri al
        const [options] = await connection.query(
          'SELECT * FROM tour_options WHERE tour_id = ?',
          [tour.id]
        );

        return {
          mainTour: {
            ...tour,
            company_ref: companyRef
          },
          days: days.map(d => d.day_number),
          pickupTimes,
          options
        };
      }));

      res.json({
        success: true,
        data: fullTours
      });

    } catch (error) {
      console.error('Tur getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Turlar getirilirken bir hata oluştu',
        error: error.message
      });
    }
  });

  return router;
}; 