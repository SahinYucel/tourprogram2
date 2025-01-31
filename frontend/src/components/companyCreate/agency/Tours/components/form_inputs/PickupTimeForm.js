import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import TimeInput from '../TimeInput';
import {
  togglePickupTimeList,
  selectPickupTimeListVisibility
} from '../../../../../../store/slices/pickupTimeSlice';

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

const STATUS_FILTERS = [
  { value: 'all', label: 'HEPSI' },
  { value: 'active', label: 'AKTIF' },
  { value: 'passive', label: 'PASIF' }
];

const PERIODS = [
  { value: 'SUMMER', label: 'Yaz' },
  { value: 'WINTER', label: 'Kış' },
  { value: 'SPRING', label: 'İlkbahar' },
  { value: 'AUTUMN', label: 'Sonbahar' }
];

const PickupTimeForm = ({ 
  pickupTimes, 
  savedRegions, 
  savedAreas, 
  onTimeChange, 
  onAddTime, 
  onRemoveTime 
}) => {
  const dispatch = useDispatch();
  const showList = useSelector(selectPickupTimeListVisibility);

  // Her pickup time için seçili bölgeye ait alanları bul
  const getAreasForRegion = (regionName) => {
    const region = savedRegions.find(r => r.name === regionName);
    return region?.areas || [];
  };

  return (
    <div className="mb-3">
      <label className="form-label d-flex justify-content-between align-items-center">
        <span>
          <i className="bi bi-clock me-2"></i>
          Kalkış Zamanları ve Bölgeler
        </span>
      </label>

      {/* Yeni Kayıt Formu - En Üstte */}
      <div className="card mb-3 border-primary">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-3">
              <TimeInput
                id="newPickupTime"
                value={pickupTimes[pickupTimes.length - 1] || {}}
                onChange={(e) => {
                  const { name, value } = e.target;
                  const field = name.split('.')[1];
                  onTimeChange(pickupTimes.length - 1, field, value);
                }}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">
                <i className="bi bi-clock-history me-2"></i>
                Periyot
              </label>
              <select
                className="form-select"
                value={(pickupTimes[pickupTimes.length - 1]?.period) || '1'}
                onChange={(e) => onTimeChange(pickupTimes.length - 1, 'period', e.target.value)}
              >
                {TIME_PERIODS.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">
                <i className="bi bi-geo me-2"></i>
                Bölge
              </label>
              <select
                className="form-select"
                value={pickupTimes[pickupTimes.length - 1]?.region || ''}
                onChange={(e) => {
                  const lastIndex = pickupTimes.length - 1;
                  onTimeChange(lastIndex, 'region', e.target.value);
                  onTimeChange(lastIndex, 'area', '');
                }}
              >
                <option value="">Bölge seçiniz</option>
                {savedRegions.map(region => (
                  <option key={region.id} value={region.name}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">
                <i className="bi bi-geo-alt me-2"></i>
                Alan
              </label>
              <select
                className="form-select"
                value={pickupTimes[pickupTimes.length - 1]?.area || ''}
                onChange={(e) => onTimeChange(pickupTimes.length - 1, 'area', e.target.value)}
                disabled={!pickupTimes[pickupTimes.length - 1]?.region}
              >
                <option value="">Alan seçiniz</option>
                {getAreasForRegion(pickupTimes[pickupTimes.length - 1]?.region).map(area => (
                  <option key={area.id} value={area.name}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-1">
              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={onAddTime}
              >
                <i className="bi bi-plus-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mevcut Kayıtlar Listesi */}
      {pickupTimes.length > 0 && pickupTimes.slice(0, -1).map((time, index) => (
        <div key={index} className="card mb-2">
          <div className="card-body py-2">
            <div className="row align-items-end">
              <div className="col-md-3">
                <TimeInput
                  id={`pickupTime-${index}`}
                  value={time}
                  onChange={(e) => {
                    const { name, value } = e.target;
                    const field = name.split('.')[1];
                    onTimeChange(index, field, value);
                  }}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">
                  <i className="bi bi-clock-history me-2"></i>
                  Periyot
                </label>
                <select
                  className="form-select"
                  value={time.period || '1'}
                  onChange={(e) => onTimeChange(index, 'period', e.target.value)}
                >
                  {TIME_PERIODS.map(period => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">
                  <i className="bi bi-geo me-2"></i>
                  Bölge
                </label>
                <select
                  className="form-select"
                  value={time.region}
                  onChange={(e) => {
                    onTimeChange(index, 'region', e.target.value);
                    onTimeChange(index, 'area', '');
                  }}
                >
                  <option value="">Bölge seçiniz</option>
                  {savedRegions.map(region => (
                    <option key={region.id} value={region.name}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">
                  <i className="bi bi-geo-alt me-2"></i>
                  Alan
                </label>
                <select
                  className="form-select"
                  value={time.area}
                  onChange={(e) => onTimeChange(index, 'area', e.target.value)}
                  disabled={!time.region}
                >
                  <option value="">Alan seçiniz</option>
                  {getAreasForRegion(time.region).map(area => (
                    <option key={area.id} value={area.name}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-1">
                <div className="d-flex flex-column align-items-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => onRemoveTime(index)}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={time.isActive !== false}
                      onChange={(e) => onTimeChange(index, 'isActive', e.target.checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PickupTimeForm; 