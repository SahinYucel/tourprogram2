import React from 'react';
import { DAYS } from '../../components/form_inputs/DaySelector';

const TIME_PERIODS = [
  { value: '1', label: '1. PERIYOT' },
  { value: '2', label: '2. PERIYOT' },
  { value: '3', label: '3. PERIYOT' },
  { value: '4', label: '4. PERIYOT' },
  { value: '5', label: '5. PERIYOT' },
  { value: '6', label: '6. PERIYOT' },
  { value: '7', label: '7. PERIYOT' },
  { value: '8', label: '8. PERIYOT' },
  { value: '9', label: '9. PERIYOT' },
  { value: '10', label: '10. PERIYOT' }
];

const WEEKDAYS = {
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
  7: 'Pazar',
  0: 'Her Gün'
};

const TourTableExpandedRow = ({ 
  tour, 
  bolgeler, 
  tourIndex,
  onPickupTimeStatusChange
}) => {
  // Prop kontrolü
  if (!tour || typeof tour !== 'object') {
    console.error('Invalid tour data:', tour);
    return null;
  }

  // Güvenli veri erişimi için kontroller
  const days = Array.isArray(tour.relatedData?.days) ? tour.relatedData.days : [];
  const pickupTimes = Array.isArray(tour.relatedData?.pickupTimes) ? tour.relatedData.pickupTimes : [];
  const options = Array.isArray(tour.relatedData?.options) ? tour.relatedData.options : [];

  const getDayLabel = (dayNumber) => {
    return WEEKDAYS[dayNumber] || dayNumber.toString();
  };

  const getPeriodLabel = (periodValue) => {
    const period = TIME_PERIODS.find(p => p.value === periodValue);
    return period ? period.label : periodValue;
  };

  const formatTime = (hour, minute) => {
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  };

  return (
    <tr>
      <td colSpan="6">
        <div className="p-3">
          {/* Günler */}
          <div className="mb-3">
            <h6 className="mb-2">
              <i className="bi bi-calendar3 me-2"></i>
              Tur Günleri
            </h6>
            {tour.relatedData?.days?.length > 0 ? (
              <div className="d-flex gap-1 flex-wrap">
                {tour.relatedData.days.map((day, index) => (
                  <span key={index} className="badge bg-primary">
                    {getDayLabel(day)}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted">Gün seçilmemiş</span>
            )}
          </div>

          {/* Kalkış Zamanları */}
          <div className="mb-3">
            <h6 className="mb-2">
              <i className="bi bi-clock me-2"></i>
              Kalkış Zamanları
            </h6>
            {tour.relatedData?.pickupTimes?.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Durum</th>
                      <th>Saat</th>
                      <th>Bölge</th>
                      <th>Alan</th>
                      <th>Periyot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tour.relatedData.pickupTimes.map((time, index) => (
                      <tr key={index}>
                        <td>
                          <button
                            type="button"
                            className={`btn btn-sm ${time?.isActive !== false ? 'btn-success' : 'btn-danger'}`}
                            onClick={() => onPickupTimeStatusChange(tourIndex, index)}
                            style={{ minWidth: '80px' }}
                          >
                            <i className={`bi bi-${time?.isActive !== false ? 'check-circle' : 'x-circle'} me-1`}></i>
                            {time?.isActive !== false ? 'Aktif' : 'Pasif'}
                          </button>
                        </td>
                        <td>{formatTime(time?.hour || '00', time?.minute || '00')}</td>
                        <td>{time?.region || '-'}</td>
                        <td>{time?.area || '-'}</td>
                        <td>{getPeriodLabel(time?.period || '1')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <span className="text-muted">Kalkış zamanı eklenmemiş</span>
            )}
          </div>

          {/* Opsiyonlar */}
          <div>
            <h6 className="mb-2">
              <i className="bi bi-plus-circle me-2"></i>
              Opsiyonlar
            </h6>
            {tour.relatedData?.options?.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Opsiyon</th>
                      <th>Fiyat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tour.relatedData.options.map((option, index) => (
                      <tr key={index}>
                        <td>{option.name || option.option_name}</td>
                        <td>{option.price} ₺</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <span className="text-muted">Opsiyon eklenmemiş</span>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

export default TourTableExpandedRow; 