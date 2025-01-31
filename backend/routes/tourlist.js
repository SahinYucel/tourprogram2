const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Promise wrapper for database connection
  const promiseDb = db.promise();

  // Save tour data
  router.post('/save', async (req, res) => {
    const { companyId, tours, bolgeler, regions } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    try {
      await promiseDb.beginTransaction();

      // Delete existing data for the company
      await promiseDb.query('DELETE FROM tourlist WHERE company_id = ?', [companyId]);
      
      // Önce Bölgelendirme region'ını bul ve sil
      await promiseDb.query(
        'DELETE a FROM areaslist a ' +
        'INNER JOIN regionslist r ON a.region_id = r.id ' +
        'WHERE a.company_id = ? AND r.name = ?',
        [companyId, 'Bölgelendirme']
      );
      await promiseDb.query(
        'DELETE FROM regionslist WHERE company_id = ? AND name = ?',
        [companyId, 'Bölgelendirme']
      );

      // Diğer bölgeleri ve alanları sil
      await promiseDb.query(
        'DELETE a FROM areaslist a ' +
        'INNER JOIN regionslist r ON a.region_id = r.id ' +
        'WHERE a.company_id = ? AND r.name != ?',
        [companyId, 'Bölgelendirme']
      );
      await promiseDb.query(
        'DELETE FROM regionslist WHERE company_id = ? AND name != ?',
        [companyId, 'Bölgelendirme']
      );

      // Insert tours
      if (tours && tours.length > 0) {
        const tourValues = tours.map(tour => [tour.name, companyId]);
        await promiseDb.query(
          'INSERT INTO tourlist (name, company_id) VALUES ?',
          [tourValues]
        );
      }

      // Insert bolgeler under Bölgelendirme region
      if (bolgeler && bolgeler.length > 0) {
        // Önce Bölgelendirme region'ı oluştur
        const [regionResult] = await promiseDb.query(
          'INSERT INTO regionslist (name, company_id) VALUES (?, ?)',
          ['Bölgelendirme', companyId]
        );

        // Bölgeleri bu region altına ekle
        const bolgeValues = bolgeler.map(bolge => [
          bolge.name,
          regionResult.insertId,
          companyId
        ]);
        
        await promiseDb.query(
          'INSERT INTO areaslist (name, region_id, company_id) VALUES ?',
          [bolgeValues]
        );
      }

      // Insert Bölgeler ve Alanlar
      if (regions && regions.length > 0) {
        for (const region of regions) {
          // Skip if region name is "Bölgelendirme"
          if (region.name === 'Bölgelendirme') continue;

          // Insert region
          const [regionResult] = await promiseDb.query(
            'INSERT INTO regionslist (name, company_id) VALUES (?, ?)',
            [region.name, companyId]
          );

          // Insert areas for this region
          if (region.areas && region.areas.length > 0) {
            const areaValues = region.areas.map(area => [
              area.name,
              regionResult.insertId,
              companyId
            ]);
            
            await promiseDb.query(
              'INSERT INTO areaslist (name, region_id, company_id) VALUES ?',
              [areaValues]
            );
          }
        }
      }

      await promiseDb.commit();
      
      res.json({
        success: true,
        message: 'Tur verileri başarıyla kaydedildi'
      });
    } catch (error) {
      await promiseDb.rollback();
      console.error('İşlem hatası:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET - Şirkete ait tur verilerini getir
  router.get('/:companyId', async (req, res) => {
    console.log('GET request received for companyId:', req.params.companyId);
    
    try {
      const { companyId } = req.params;

      if (!companyId) {
        console.log('CompanyId is missing');
        return res.status(400).json({ error: 'Şirket ID gerekli' });
      }

      console.log('Executing database queries...');
      
      // Turları getir
      const [tours] = await promiseDb.query(
        'SELECT * FROM tourlist WHERE company_id = ?',
        [companyId]
      );

      // Bölgelendirme listesini getir
      const [bolgeler] = await promiseDb.query(
        'SELECT a.* FROM areaslist a ' +
        'INNER JOIN regionslist r ON a.region_id = r.id ' +
        'WHERE a.company_id = ? AND r.name = ?',
        [companyId, 'Bölgelendirme']
      );

      // Bölgeler ve Alanlar listesini getir
      const [regions] = await promiseDb.query(
        'SELECT r.*, a.id as area_id, a.name as area_name ' +
        'FROM regionslist r ' +
        'LEFT JOIN areaslist a ON r.id = a.region_id ' +
        'WHERE r.company_id = ? AND r.name != ?',
        [companyId, 'Bölgelendirme']
      );

      // Bölgeleri ve alanları düzenle
      const formattedRegions = regions.reduce((acc, curr) => {
        const region = acc.find(r => r.id === curr.id);
        if (!region) {
          acc.push({
            id: curr.id,
            name: curr.name,
            areas: curr.area_id ? [{
              id: curr.area_id,
              name: curr.area_name
            }] : []
          });
        } else if (curr.area_id && !region.areas.find(a => a.id === curr.area_id)) {
          region.areas.push({
            id: curr.area_id,
            name: curr.area_name
          });
        }
        return acc;
      }, []);

      // Verileri client'a gönder
      res.json({
        tours: tours.map(tour => ({
          id: tour.id,
          name: tour.name
        })),
        bolgeler: bolgeler.map(bolge => ({
          id: bolge.id,
          name: bolge.name
        })),
        regions: formattedRegions
      });

    } catch (error) {
      console.error('Detailed error in GET /tourlist/:companyId:', error);
      res.status(500).json({ 
        error: 'Sunucu hatası',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  return router;
}; 