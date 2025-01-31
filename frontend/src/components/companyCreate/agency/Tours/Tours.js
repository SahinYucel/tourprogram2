import React, { useState, useEffect, useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import TourForm from './components/TourForm';
import TourHeader from './components/TourHeader';
import TourTable from './components/TourTable';
import { DAYS } from './components/form_inputs/DaySelector';
import { getTourData, getProviders } from '../../../../services/api';

const INITIAL_TOUR_STATE = {
  tourName: '',
  operator: '',
  bolgeId: [],
  options: [],
  pickupTimes: [{
    hour: '',
    minute: '',
    region: '',
    area: ''
  }],
  adultPrice: '',
  childPrice: '',
  selectedDays: [],
  editingIndex: null,
  isActive: true
};

const Tours = () => {
  const [tourData, setTourData] = useState(INITIAL_TOUR_STATE);
  const [savedTours, setSavedTours] = useState([]);
  const [savedRegions, setSavedRegions] = useState([]);
  const [savedAreas, setSavedAreas] = useState([]);
  const [savedCompanies, setSavedCompanies] = useState([]);
  const [bolgeler, setBolgeler] = useState([]);
  const [regions, setRegions] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [createdTours, setCreatedTours] = useState(() => {
    const saved = localStorage.getItem('createdTours');
    return saved ? JSON.parse(saved) : [];
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActive, setShowActive] = useState('all');
  const [counter, setCounter] = useState(0);
  const [bolgeCounter, setBolgeCounter] = useState(0);
  const [regionCounter, setRegionCounter] = useState(0);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const agencyUser = JSON.parse(localStorage.getItem('agencyUser'));
        if (!agencyUser?.companyId) {
          console.warn('Şirket ID bulunamadı');
          return;
        }

        // API'den tur verilerini çek
        const data = await getTourData(agencyUser.companyId);
        
        // API'den operatörleri (şirketleri) çek
        const providersResponse = await getProviders(agencyUser.companyId);
        if (providersResponse.data && Array.isArray(providersResponse.data)) {
          const formattedProviders = providersResponse.data.map(provider => ({
            id: Date.now() + Math.random(),
            alphanumericId: provider.companyRef,
            companyName: provider.company_name,
            phoneNumber: provider.phone_number,
            status: provider.status === 1
          }));
          setSavedCompanies(formattedProviders);
          localStorage.setItem('companies', JSON.stringify(formattedProviders));
        }

        // Bölge ve alan verilerini getTourData'dan al
        if (data) {
          if (data.tours) {
            setSavedTours(data.tours);
            const maxTourId = Math.max(...data.tours.map(t => t.id), 0);
            setCounter(maxTourId + 1);
          }
          
          if (data.regions) {
            setSavedRegions(data.regions);
            setRegions(data.regions);
            const maxRegionId = Math.max(...data.regions.map(r => r.id), 0);
            setRegionCounter(maxRegionId + 1);
          }

          if (data.areas) {
            setSavedAreas(data.areas);
          }
          
          if (data.bolgeler) {
            setBolgeler(data.bolgeler);
            const maxBolgeId = Math.max(...data.bolgeler.map(b => b.id), 0);
            setBolgeCounter(maxBolgeId + 1);
          }
          
          // LocalStorage'a kaydet
          localStorage.setItem('tourList', JSON.stringify(data.tours || []));
          localStorage.setItem('bolgeList', JSON.stringify(data.bolgeler || []));
          localStorage.setItem('regionList', JSON.stringify(data.regions || []));
          localStorage.setItem('areaList', JSON.stringify(data.areas || []));
        }

        console.log('Tüm veriler yüklendi:', { 
          data, 
          providers: providersResponse.data
        });

      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      }
    };

    fetchAllData();
  }, []); // Sadece component mount olduğunda çalışsın

  useEffect(() => {
    localStorage.setItem('createdTours', JSON.stringify(createdTours));
  }, [createdTours]);

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
    setTourData(INITIAL_TOUR_STATE);
    setEditingIndex(null);
    setIsCollapsed(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tourData.tourName || !tourData.operator) {
      alert('Lütfen gerekli alanları doldurunuz!');
      return;
    }

    // Operatör adını bul
    const selectedCompany = savedCompanies.find(c => c.alphanumericId === tourData.operator);
    const tourWithOperatorInfo = {
      ...tourData,
      operator: selectedCompany ? selectedCompany.companyName : tourData.operator,
      operatorId: selectedCompany ? selectedCompany.alphanumericId : tourData.operator
    };

    if (editingIndex !== null) {
      // Düzenleme modu
      setCreatedTours(prev => {
        const newTours = [...prev];
        newTours[editingIndex] = tourWithOperatorInfo;
        return newTours;
      });
    } else {
      // Yeni tur ekleme
      setCreatedTours(prev => [...prev, tourWithOperatorInfo]);
    }

    resetForm();
  };

  const handleEdit = (tour) => {
    const index = createdTours.findIndex(t => t === tour);
    if (index !== -1) {
      // Use operatorId if available, otherwise try to find it from the company name
      const operatorId = tour.operatorId || 
        (savedCompanies.find(c => c.companyName === tour.operator)?.alphanumericId || tour.operator);
      
      const tourWithOperatorId = {
        ...tour,
        operator: operatorId
      };
      
      setTourData(tourWithOperatorId);
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
      const newTimes = [...prev.pickupTimes];
      newTimes[index] = { ...newTimes[index], [field]: value };
      return { ...prev, pickupTimes: newTimes };
    });
  };

  const addPickupTime = () => {
    setTourData(prev => ({
      ...prev,
      pickupTimes: [...prev.pickupTimes, { 
        hour: '', 
        minute: '', 
        region: '', 
        area: '' 
      }]
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
      // Önce arama filtresini uygula
      .filter(tour => {
        const searchLower = searchQuery.toLowerCase();
        return (
          searchQuery === '' ||
          tour.tourName.toLowerCase().includes(searchLower) ||
          tour.operator.toLowerCase().includes(searchLower)
        );
      })
      // Sonra aktif/pasif filtresini uygula
      .filter(tour => {
        if (showActive === 'all') return true;
        return showActive === 'active' ? tour.isActive : !tour.isActive;
      })
      // En son sırala
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
            tourData={{ ...tourData, editingIndex }}
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
