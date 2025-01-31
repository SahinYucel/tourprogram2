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

const TourTableExpandedRow = ({ tour, bolgeler }) => {
  // Prop kontrolü
  if (!tour || typeof tour !== 'object') {
    console.error('Invalid tour data:', tour);
    return null;
  }

  // Güvenli veri erişimi için kontroller
  const days = Array.isArray(tour.relatedData?.days) ? tour.relatedData.days : [];
  const pickupTimes = Array.isArray(tour.relatedData?.pickupTimes) ? tour.relatedData.pickupTimes : [];
  const options = Array.isArray(tour.relatedData?.options) ? tour.relatedData.options : [];

  const getDayLabel = (dayId) => {
    const day = DAYS.find(d => d.id === dayId);
    return day ? day.label : dayId;
  };

  const getPeriodLabel = (periodValue) => {
    const period = TIME_PERIODS.find(p => p.value === periodValue);
    return period ? period.label : periodValue;
  };

  return (
    <tr>
      <td colSpan="7">
        <div className="container-fluid">
          {/* Günler */}
          <div className="row mb-3">
            <div className="col">
              <h6>Tur Günleri:</h6>
              <div className="d-flex gap-2">
                {days.length > 0 ? (
                  days.map((day) => (
                    <span key={day} className="badge bg-primary">
                      {getDayLabel(day)}
                    </span>
                  ))
                ) : (
                  <span className="text-muted">Gün seçilmedi</span>
                )}
              </div>
            </div>
          </div>

          {/* Kalkış Zamanları */}
          <div className="row mb-3">
            <div className="col">
              <h6>Kalkış Zamanları:</h6>
              {pickupTimes.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Saat</th>
                        <th>Bölge</th>
                        <th>Alan</th>
                        <th>Periyot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pickupTimes.map((time, index) => (
                        <tr key={index}>
                          <td>{`${time?.hour || '00'}:${time?.minute || '00'}`}</td>
                          <td>{time?.region || '-'}</td>
                          <td>{time?.area || '-'}</td>
                          <td>
                            <span className={`badge ${time?.isActive !== false ? 'bg-success' : 'bg-secondary'}`}>
                              {time?.isActive !== false ? getPeriodLabel(time.period) : 'PASIF'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">Kalkış zamanı eklenmedi</p>
              )}
            </div>
          </div>

          {/* Seçenekler */}
          {options.length > 0 && (
            <div className="row">
              <div className="col">
                <h6>Ek Seçenekler:</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Seçenek</th>
                        <th>Fiyat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {options.map((option, index) => (
                        <tr key={index}>
                          <td>{option?.name || option?.option_name || '-'}</td>
                          <td>{option?.price || '0'} ₺</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default TourTableExpandedRow; 