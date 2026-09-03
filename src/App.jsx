import { useState, useEffect, useCallback, useMemo } from 'react';
import SearchSidebar from './components/SearchSidebar';
import MapDisplay from './components/MapDisplay';
import Lightbox from './components/Lightbox';
import SiteDetail from './components/SiteDetail';
import BulkReport from './components/BulkReport';
import Login from './components/Login';
import WhatsNewModal from './components/WhatsNewModal';

const INITIAL_FILTERS = {
  name: '',
  municipality: '',
  province: '',
  region: '',
  developer: '',
  pra_status: '',
};

const INITIAL_LAYERS = [
  { id: 'markers', name: 'Site Markers (Reclamations)', visible: false },
  { id: 'polygons', name: 'Reclamation Polygons', visible: false },
  { id: 'restore', name: 'Restoration Projects', visible: false },
  { id: 'regular', name: 'Regular Reclamation Projects', visible: false },
  { id: 'applications', name: 'Applications', visible: false },
  { id: 'flagged', name: 'Flagged Areas', visible: true },
  { id: 'ports', name: 'Ports (OpenStreetMap)', visible: false }
];

// Helper functions for processing GeoJSON
function extractGoogleDriveId(url) {
  if (!url || url === 'null' || url.trim() === '') return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function getDirectImageUrl(driveUrl) {
  const fileId = extractGoogleDriveId(driveUrl);
  return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w800` : null;
}

function processFeature(feature, index) {
  const props = feature.properties;

  // Extract photos from photo 1, photo 2, photo 3, photo 4 fields
  const photos = [];
  for (let i = 1; i <= 4; i++) {
    const photoUrl = props[`photo ${i}`];
    if (photoUrl && photoUrl !== 'null' && photoUrl.trim() !== '') {
      const directUrl = getDirectImageUrl(photoUrl);
      if (directUrl) {
        photos.push(directUrl);
      }
    }
  }

  return {
    _index: index,
    name: props.Name || props.name_2 || 'Unnamed Site',
    code_name: props['Code name'] || '',
    lat: props.lat,
    lon: props.lon,
    geometry: feature.geometry || null,
    geometry_type: feature.geometry ? feature.geometry.type : null,
    status: props.status || 'Unknown',
    year_start: props.year_start || '',
    year_end: props.year_end || '',
    developer: props.developer || '',
    author: props.author || '',
    notes: props.notes || '',
    comments: props.Comments || '',
    barangay: props.barangay || '',
    municipality: props['municipality/city'] || props.municipality || '',
    province: props.province || '',
    region: props.region || '',
    area: props.Area || props.area || props.Has || '',
    area_pra: props.Area_PRA || '',
    pra_status: props.pra_status || props.pra_status_2 || '',
    registration_date: props.registration_date || '',
    last_payment_date: props.last_payment_date || '',
    document: props.document || '',
    payment_start_year: props.payment_start_year || null,
    payment_end_year: props.payment_end_year || null,
    payments_paid: props.payments_paid || '',
    photos: photos,
    // Keep old field names for backwards compatibility
    'year started': props.year_start || '',
    'year completed': props.year_end || '',
    address: [props.barangay, props['municipality/city'] || props.municipality, props.province].filter(Boolean).join(', ')
  };
}

function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('pra_auth') === '1');
  const [allSites, setAllSites] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [layers, setLayers] = useState(INITIAL_LAYERS);
  const [lightbox, setLightbox] = useState({ open: false, photos: [], index: 0 });
  const [loading, setLoading] = useState(true);
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [showWhatsNew, setShowWhatsNew] = useState(true);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const dismissWhatsNew = useCallback(() => {
    setShowWhatsNew(false);
  }, []);

  // Listen for hash changes (back/forward navigation)
  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    // Load GeoJSON from public folder
    const geojsonPath = `${import.meta.env.BASE_URL}ReclamationSites.geojson`;
    console.log('🔍 Starting to fetch GeoJSON from:', geojsonPath);
    
    fetch(geojsonPath)
      .then(response => {
        console.log('📡 Fetch response:', response.status, response.statusText);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(geojson => {
        console.log('✅ Loaded GeoJSON:', geojson.features.length, 'features');
        const sites = geojson.features.map((feature, index) => processFeature(feature, index));
        console.log('✅ Processed sites:', sites.length);
        setAllSites(sites);
        setLoading(false);
      })
      .catch(error => {
        console.error('❌ Error loading GeoJSON:', error);
        setLoading(false);
        alert(`Failed to load map data: ${error.message}\n\nPlease check:\n1. Is ReclamationSites.geojson in the public/ folder?\n2. Did GitHub Pages finish deploying?\n3. Try hard refresh (Ctrl+Shift+R)`);
      });
  }, []);

  const filteredSites = useMemo(() => {
    const nameFilter = filters.name.trim().toLowerCase();
    const hasExactNameMatch = nameFilter !== '' &&
      allSites.some(site => (site.name || '').trim().toLowerCase() === nameFilter);

    return allSites.filter(site => {
      const match = (field, key) =>
        !filters[key] ||
        (site[field] || '').toLowerCase().includes(filters[key].toLowerCase());

      const nameMatch = nameFilter === '' ||
        (hasExactNameMatch
          ? (site.name || '').trim().toLowerCase() === nameFilter
          : (site.name || '').toLowerCase().includes(nameFilter));

      let praMatch = true;
      if (filters.pra_status) {
        const val = site.pra_status || '';
        if (filters.pra_status === 'Not listed') {
          praMatch = val === 'Not listed';
        } else if (filters.pra_status === 'Listed') {
          praMatch = val.startsWith('Listed');
        } else {
          praMatch = val.toLowerCase().includes(filters.pra_status.toLowerCase());
        }
      }

      return (
        nameMatch &&
        match('municipality', 'municipality') &&
        match('province', 'province') &&
        match('region', 'region') &&
        match('developer', 'developer') &&
        praMatch
      );
    });
  }, [allSites, filters]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const handleLayerToggle = useCallback((layerId) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  }, []);

  const toggleSiteSelection = useCallback((index) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleDownloadBulkReport = useCallback(() => {
    const ids = Array.from(selectedIds).join(',');
    window.open(`${import.meta.env.BASE_URL}#/report/${ids}`, '_blank');
  }, [selectedIds]);

  const openLightbox = useCallback((photos, index) => {
    setLightbox({ open: true, photos, index });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox(prev => ({ ...prev, open: false }));
  }, []);

  // Hash-based routing: #/site/42 → show detail page
  const siteDetailMatch = currentHash.match(/^#\/site\/(\d+)$/);
  const siteDetailIndex = siteDetailMatch ? parseInt(siteDetailMatch[1], 10) : null;
  const siteForDetail = siteDetailIndex !== null ? allSites[siteDetailIndex] : null;

  // Hash-based routing: #/report/1,5,9 → show bulk report page
  const bulkReportMatch = currentHash.match(/^#\/report\/([\d,]+)$/);
  const bulkReportSites = bulkReportMatch
    ? bulkReportMatch[1].split(',').map(s => allSites[parseInt(s, 10)]).filter(Boolean)
    : null;

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        Loading reclamation sites...
      </div>
    );
  }

  // Render site detail page if hash matches
  if (siteForDetail) {
    return <SiteDetail site={siteForDetail} />;
  }

  // Render bulk report page if hash matches
  if (bulkReportSites) {
    return <BulkReport sites={bulkReportSites} />;
  }

  return (
    <div className="app-container">
      <SearchSidebar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        totalSites={allSites.length}
        visibleSites={filteredSites.length}
        layers={layers}
        onLayerToggle={handleLayerToggle}
      />
      <div className="map-wrapper">
        <MapDisplay
          sites={filteredSites}
          onPhotoClick={openLightbox}
          layers={layers}
          hasActiveFilters={Object.values(filters).some(v => v !== '')}
          selectedIds={selectedIds}
          onToggleSelect={toggleSiteSelection}
        />
      </div>
      {lightbox.open && (
        <Lightbox
          photos={lightbox.photos}
          initialIndex={lightbox.index}
          onClose={closeLightbox}
        />
      )}
      {showWhatsNew && <WhatsNewModal onClose={dismissWhatsNew} />}
      {selectedIds.size > 0 && (
        <div className="bulk-report-bar">
          <span className="bulk-report-bar-count">{selectedIds.size} site{selectedIds.size === 1 ? '' : 's'} added to bulk report</span>
          <button className="bulk-report-bar-download" onClick={handleDownloadBulkReport}>
            Download Bulk Report
          </button>
          <button className="bulk-report-bar-clear" onClick={clearSelection}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
