const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Promise wrapper for database connection
  const promiseDb = db.promise();

  // Save tour data
  router.post('/save', async (req, res) => {
    const { companyId, tours, bolgeler, regions, bolgeList } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    try {
      await promiseDb.beginTransaction();

      // Delete existing data for the company
      await promiseDb.query('DELETE FROM tourlist WHERE company_id = ?', [companyId]);
      
      // Tüm bölgeleri ve alanları sil
      await promiseDb.query(
        'DELETE a FROM areaslist a ' +
        'INNER JOIN regionslist r ON a.region_id = r.id ' +
        'WHERE a.company_id = ?',
        [companyId]
      );
      await promiseDb.query(
        'DELETE FROM regionslist WHERE company_id = ?',
        [companyId]
      );
      
      // Delete existing create_areaslist data for the company
      await promiseDb.query(
        'DELETE FROM create_areaslist WHERE company_id = ?',
        [companyId]
      );

      // Insert tours
      if (tours && tours.length > 0) {
        const tourValues = tours.map(tour => [tour.name, companyId]);
        await promiseDb.query(
          'INSERT INTO tourlist (name, company_id) VALUES ?',
          [tourValues]
        );
      }

      console.log(bolgeList)

      console.log('Gelen bolgeler:',  );
      // Insert bolgeler into create_areaslist
      if (bolgeler && bolgeler.length > 0) {
        const bolgeValues = bolgeler.map(bolge => [bolge.name, companyId]);
        console.log('Oluşturulan bolgeValues:', bolgeValues);
        try {
          await promiseDb.query(
            'INSERT INTO create_areaslist (name, company_id) VALUES ?',
            [bolgeValues]
          );
          console.log('Veriler başarıyla kaydedildi');
        } catch (error) {
          console.error('SQL Error:', error.message);
          console.error('SQL Query:', 'INSERT INTO create_areaslist (name, company_id) VALUES ?');
          console.error('Values:', bolgeValues);
          throw error;
        }
      }

      // Insert bolgeler into regionslist
    

      // Insert Bölgeler ve Alanlar
      if (regions && regions.length > 0) {
        for (const region of regions) {
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

      // create_areaslist tablosundan bölgeleri getir
      const [bolgeler] = await promiseDb.query(
        'SELECT * FROM create_areaslist WHERE company_id = ?',
        [companyId]
      );

      // Bölgeler ve Alanlar listesini getir
      const [regions] = await promiseDb.query(
        'SELECT r.*, a.id as area_id, a.name as area_name ' +
        'FROM regionslist r ' +
        'LEFT JOIN areaslist a ON r.id = a.region_id ' +
        'WHERE r.company_id = ?',
        [companyId]
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