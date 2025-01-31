const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.post('/', async (req, res) => {
    try {
      const { companyId, tours } = req.body;

      if (!companyId || !tours || !Array.isArray(tours)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri formatı. CompanyId ve tours array\'i gerekli.'
        });
      }

      // Transaction başlat
      await db.promise().beginTransaction();

      try {
        // Önce bu şirkete ait tüm turları sil
        const deleteQuery = `
          DELETE FROM tours 
          WHERE company_ref = ?
        `;
        await db.promise().query(deleteQuery, [companyId]);

        // Yeni turları ekle
        if (tours.length > 0) {
          const insertQuery = `
            INSERT INTO tours (
              company_ref,
              tour_name,
              operator,
              operator_id,
              adult_price,
              child_price,
              selected_days,
              pickup_times,
              bolge_id,
              options,
              is_active
            ) VALUES ?
          `;

          const values = tours.map(tour => [
            companyId,
            tour.tourName,
            tour.operator,
            tour.operatorId,
            tour.adultPrice || null,
            tour.childPrice || null,
            JSON.stringify(tour.selectedDays || []),
            JSON.stringify(tour.pickupTimes || []),
            JSON.stringify(tour.bolgeId || []),
            JSON.stringify(tour.options || []),
            tour.isActive ? 1 : 0
          ]);

          await db.promise().query(insertQuery, [values]);
        }

        // Transaction'ı commit et
        await db.promise().commit();

        res.json({
          success: true,
          message: 'Turlar başarıyla kaydedildi',
          savedCount: tours.length
        });

      } catch (error) {
        // Hata durumunda rollback yap
        await db.promise().rollback();
        throw error;
      }

    } catch (error) {
      console.error('Tour kaydetme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Turlar kaydedilirken bir hata oluştu',
        error: error.message
      });
    }
  });

  return router;
}; 