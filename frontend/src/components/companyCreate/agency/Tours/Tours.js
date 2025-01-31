import React, { useState, useMemo, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import TourForm from './components/TourForm';
import TourHeader from './components/TourHeader';
import TourTable from './components/TourTable';
import { DAYS } from './components/form_inputs/DaySelector';
import { INITIAL_TOUR_STATE } from './hooks/constants';
import { useTourData } from './hooks/useTourData';
import { saveAllTours } from '../../../../services/api';

const Tours = () => {
  const [tourData, setTourData] = useState(() => {
    const savedData = localStorage.getItem('currentTourData');
    return savedData ? JSON.parse(savedData) : INITIAL_TOUR_STATE;
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [createdTours, setCreatedTours] = useState(() => {
    const saved = localStorage.getItem('createdTours');
    return saved ? JSON.parse(saved) : [];
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActive, setShowActive] = useState('all');

  const {
    savedTours,
    savedRegions,
    savedAreas,
    savedCompanies,
    bolgeler
  } = useTourData();

  useEffect(() => {
    localStorage.setItem('createdTours', JSON.stringify(createdTours));
  }, [createdTours]);

  useEffect(() => {
    localStorage.setItem('currentTourData', JSON.stringify(tourData));
  }, [tourData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTourData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index, field, value) => {
    setTourData(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = { ...newOptions[index], [field]: value };
      return { ...prev, options: newOptions };
    });
  };

  const handleDaySelect = (day) => {
    setTourData(prev => {
      const selectedDays = prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day];
      return { ...prev, selectedDays };
    });
  };

  const handleSelectAllDays = () => {
    setTourData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.length === DAYS.length ? [] : DAYS.map(day => day.id)
    }));
  };

  const resetForm = () => {
    setTourData({
      ...INITIAL_TOUR_STATE,
      pickupTimes: [{  // Yeni form için boş bir kayıt
        hour: '',
        minute: '',
        region: '',
        area: '',
        period: '1',
        isActive: true
      }]
    });
    setEditingIndex(null);
    setIsCollapsed(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tourData.tourName || !tourData.operator) {
      alert('Lütfen gerekli alanları doldurunuz!');
      return;
    }

    const selectedCompany = savedCompanies.find(c => c.alphanumericId === tourData.operator);
    
    const mainTourData = {
      tourName: tourData.tourName,
      operator: selectedCompany ? selectedCompany.companyName : tourData.operator,
      operatorId: selectedCompany ? selectedCompany.alphanumericId : tourData.operator,
      adultPrice: tourData.adultPrice || 0,
      childPrice: tourData.childPrice || 0
    };

    const filteredPickupTimes = tourData.pickupTimes.slice(0, -1);

    // Gün seçilmemişse [0] gönder
    const days = Array.isArray(tourData.selectedDays) && tourData.selectedDays.length > 0 
      ? tourData.selectedDays 
      : [0];

    const relatedData = {
      days,
      pickupTimes: filteredPickupTimes.filter(time => 
        time.hour || time.minute || time.region || time.area
      ),
      options: Array.isArray(tourData.options) ? 
        tourData.options.filter(opt => opt.name || opt.price) : []
    };

    if (editingIndex !== null) {
      setCreatedTours(prev => {
        const newTours = [...prev];
        newTours[editingIndex] = {
          ...mainTourData,
          relatedData
        };
        return newTours;
      });
    } else {
      setCreatedTours(prev => [...prev, {
        ...mainTourData,
        relatedData
      }]);
    }

    resetForm();
  };

  const handleEdit = (tour) => {
    const index = createdTours.findIndex(t => t === tour);
    if (index !== -1) {
      const operatorId = tour.operatorId || 
        (savedCompanies.find(c => c.companyName === tour.operator)?.alphanumericId || tour.operator);
      
      const editableTourData = {
        tourName: tour.tourName,
        operator: operatorId,
        adultPrice: tour.adultPrice || '',
        childPrice: tour.childPrice || '',
        selectedDays: tour.relatedData?.days || [],
        pickupTimes: tour.relatedData?.pickupTimes?.map(time => ({
          hour: time.hour || '',
          minute: time.minute || '',
          region: time.region || '',
          area: time.area || '',
          isActive: time.isActive !== false,
          period: time.period || '1'
        })) || [{ 
          hour: '', 
          minute: '', 
          region: '', 
          area: '',
          isActive: true,
          period: '1'
        }],
        options: tour.relatedData?.options?.map(opt => ({
          name: opt.option_name || opt.name || '',
          price: opt.price || ''
        })) || [],
        isActive: tour.isActive
      };
      
      setTourData(editableTourData);
      setEditingIndex(index);
      setIsCollapsed(false);
    }
  };

  const handleDelete = (tourToDelete) => {
    if (window.confirm('Bu turu silmek istediğinizden emin misiniz?')) {
      setCreatedTours(prev => prev.filter(tour => tour !== tourToDelete));
      if (editingIndex !== null) {
        resetForm();
      }
    }
  };

  const handleTimeChange = (index, field, value) => {
    setTourData(prev => {
      const newTimes = [...(prev.pickupTimes || [])];
      if (!newTimes[index]) {
        newTimes[index] = {
          hour: '',
          minute: '',
          region: '',
          area: '',
          isActive: true,
          period: '1'
        };
      }
      newTimes[index] = { 
        ...newTimes[index], 
        [field]: value,
        ...(field === 'region' ? { period: newTimes[index].period || '1' } : {})
      };
      return { ...prev, pickupTimes: newTimes };
    });
  };

  const addPickupTime = () => {
    setTourData(prev => ({
      ...prev,
      pickupTimes: [
        ...prev.pickupTimes,
        {
          hour: '',
          minute: '',
          region: '',
          area: '',
          period: '1',
          isActive: true
        }
      ]
    }));
  };

  const removePickupTime = (index) => {
    setTourData(prev => ({
      ...prev,
      pickupTimes: prev.pickupTimes.filter((_, i) => i !== index)
    }));
  };

  const handleCopy = (tourToCopy) => {
    const copiedTour = { ...tourToCopy };
    setCreatedTours(prev => [...prev, copiedTour]);
  };

  const formInputs = useMemo(() => [
    {
      label: 'Tur Adı',
      icon: 'bi-map',
      id: 'tourName',
      type: 'select',
      placeholder: 'Tur seçiniz',
      options: savedTours.map(tour => ({ value: tour.name, label: tour.name }))
    },
    {
      label: 'Operatör Seç',
      icon: 'bi-person-badge',
      id: 'operator',
      type: 'select',
      placeholder: 'Operatör seçiniz',
      options: savedCompanies.map(company => ({ 
        value: company.alphanumericId, 
        label: `${company.companyName} (${company.alphanumericId})` 
      }))
    }
  ], [savedTours, savedCompanies]);

  const filteredAndSortedTours = useMemo(() => {
    return [...createdTours]
      .filter(tour => {
        const searchLower = searchQuery.toLowerCase();
        return (
          searchQuery === '' ||
          tour.tourName.toLowerCase().includes(searchLower) ||
          tour.operator.toLowerCase().includes(searchLower)
        );
      })
      .filter(tour => {
        if (showActive === 'all') return true;
        return showActive === 'active' ? tour.isActive : !tour.isActive;
      })
      .sort((a, b) => {
        const nameA = a.tourName.toLowerCase();
        const nameB = b.tourName.toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [createdTours, searchQuery, showActive]);

  const handleStatusChange = (tourId) => {
    setCreatedTours(prev => prev.map(tour => 
      tour === tourId ? { ...tour, isActive: !tour.isActive } : tour
    ));
  };

  const handleSaveToDatabase = async () => {
    try {
      const agencyUser = JSON.parse(localStorage.getItem('agencyUser'));
      if (!agencyUser?.companyId) {
        alert('Şirket ID bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }

      const toursToSave = createdTours.map(tour => {
        const pickupTimes = tour.relatedData.pickupTimes.map(time => ({
          ...time,
          period: time.period || '1',
          hour: time.hour || '00',
          minute: time.minute || '00',
          region: time.region || '',
          area: time.area || ''
        }));

        // Gün seçilmemişse [0] gönder
        const days = Array.isArray(tour.relatedData.days) && tour.relatedData.days.length > 0 
          ? tour.relatedData.days 
          : [0];

        return {
          mainTour: {
            company_ref: agencyUser.companyId,
            tour_name: tour.tourName,
            operator: tour.operator,
            operator_id: tour.operatorId,
            adult_price: tour.adultPrice,
            child_price: tour.childPrice
          },
          days,
          pickupTimes,
          options: tour.relatedData.options
        };
      });

      console.log('Gönderilecek veriler:', JSON.stringify(toursToSave, null, 2));
      const response = await saveAllTours(toursToSave);
      
      if (response.success) {
        alert('Turlar başarıyla kaydedildi!');
      } else {
        alert('Kayıt sırasında bir hata oluştu: ' + response.message);
      }
    } catch (error) {
      console.error('Kayıt hatası:', error);
      alert('Turlar kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="container mt-4">
      <div className="card mb-4">
        <TourHeader
          isEditing={editingIndex !== null}
          isCollapsed={isCollapsed}
          onCollapse={() => setIsCollapsed(!isCollapsed)}
          onCancel={resetForm}
        />
        <div className={`card-body ${isCollapsed ? 'd-none' : ''}`}>
          <TourForm
            tourData={tourData}
            formInputs={formInputs}
            savedRegions={savedRegions} 
            savedAreas={savedAreas}
            onSubmit={handleSubmit}
            onChange={handleChange}
            onTimeChange={handleTimeChange}
            onAddTime={addPickupTime}
            onRemoveTime={removePickupTime}
            onOptionChange={handleOptionChange}
            onAddOption={() => setTourData(prev => ({
              ...prev,
              options: [...prev.options, { name: '', price: '' }]
            }))}
            onRemoveOption={(index) => setTourData(prev => ({
              ...prev,
              options: prev.options.filter((_, i) => i !== index)
            }))}
            onDaySelect={handleDaySelect}
            onSelectAllDays={handleSelectAllDays}
            bolgeler={bolgeler}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="bi bi-table me-2"></i>
              Oluşturulan Turlar
            </h4>
            <div className="d-flex gap-3 align-items-center">
              <button 
                className="btn btn-primary"
                onClick={handleSaveToDatabase}
                disabled={createdTours.length === 0}
              >
                <i className="bi bi-save me-2"></i>
                Veritabanına Kaydet
              </button>
              <div className="input-group" style={{ width: '300px' }}>
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tur veya operatör ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="form-select"
                value={showActive}
                onChange={(e) => setShowActive(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="all">Tümü</option>
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>
            </div>
          </div>
        </div>
        <div className="card-body">
          <TourTable 
            tours={filteredAndSortedTours}
            onEdit={handleEdit}
            onDelete={handleDelete}
            bolgeler={bolgeler}
            onCopy={handleCopy}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Tours;
