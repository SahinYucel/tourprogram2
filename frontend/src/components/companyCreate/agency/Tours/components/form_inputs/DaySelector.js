import React from 'react';

const DAYS = [
  { id: 1, label: 'Pazartesi' },
  { id: 2, label: 'Salı' },
  { id: 3, label: 'Çarşamba' },
  { id: 4, label: 'Perşembe' },
  { id: 5, label: 'Cuma' },
  { id: 6, label: 'Cumartesi' },
  { id: 7, label: 'Pazar' }
];

const DaySelector = ({ selectedDays, onDaySelect, onSelectAll }) => {
  return (
    <div className="mb-4 text-center">
      <label className="form-label d-block mb-3">
        <i className="bi bi-calendar-week me-2"></i>Günler
      </label>
      <div className="d-flex flex-wrap gap-4 justify-content-center">
        {DAYS.map(day => (
          <button
            key={day.id}
            type="button"
            className={`btn ${selectedDays.includes(day.id) ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => onDaySelect(day.id)}
          >
            {day.label}
          </button>
        ))}
        <button
          type="button"
          className={`btn ${
            selectedDays.length === DAYS.length 
              ? 'btn-primary' 
              : 'btn-outline-primary'
          } me-2`}
          onClick={onSelectAll}
        >
          <i className="bi bi-calendar-check me-1"></i>
          Tüm Günler
        </button>
      </div>
      {selectedDays.length === 0 && (
        <div className="text-muted small mt-2">
          <i className="bi bi-info-circle me-1"></i>
          Lütfen en az bir gün seçiniz
        </div>
      )}
    </div>
  );
};

export { DAYS };
export default DaySelector; 