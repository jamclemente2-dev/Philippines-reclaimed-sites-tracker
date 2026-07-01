import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, FeatureGroup, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

// ── Marker icon helpers ───────────────────────────────────────────────────────

const STATUS_COLORS = {
  completed: '#1e40af',
  complete:  '#1e40af',
  ongoing:   '#d97706',
};

function getStatusColor(status) {
  const key = (status || '').toLowerCase().replace(/[-\s]/g, '');
  return STATUS_COLORS[key] || '#6b7280';
}

// Cache icons per status color to avoid creating new L.divIcon on every render
const iconCache = {};

function createMarkerIcon(status) {
  const color = getStatusColor(status);
  if (iconCache[color]) return iconCache[color];

  const icon = L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
        <path fill="${color}" stroke="white" stroke-width="1.5"
          d="M12 1C6.477 1 2 5.477 2 11c0 7.5 10 20 10 20S22 18.5 22 11C22 5.477 17.523 1 12 1z"/>
        <circle cx="12" cy="11" r="4.5" fill="white" opacity="0.92"/>
      </svg>`,
    className: '',
    iconSize:    [24, 32],
    iconAnchor:  [12, 32],
    popupAnchor: [0, -34],
  });

  iconCache[color] = icon;
  return icon;
}

// Green marker icon for restoration projects (created once)
const restoreMarkerIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
      <path fill="#16a34a" stroke="white" stroke-width="1.5"
        d="M12 1C6.477 1 2 5.477 2 11c0 7.5 10 20 10 20S22 18.5 22 11C22 5.477 17.523 1 12 1z"/>
      <circle cx="12" cy="11" r="4.5" fill="white" opacity="0.92"/>
    </svg>`,
  className: '',
  iconSize:    [24, 32],
  iconAnchor:  [12, 32],
  popupAnchor: [0, -34],
});

// Purple marker icon for applications (created once)
const applicationMarkerIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
      <path fill="#9333ea" stroke="white" stroke-width="1.5"
        d="M12 1C6.477 1 2 5.477 2 11c0 7.5 10 20 10 20S22 18.5 22 11C22 5.477 17.523 1 12 1z"/>
      <circle cx="12" cy="11" r="4.5" fill="white" opacity="0.92"/>
    </svg>`,
  className: '',
  iconSize:    [24, 32],
  iconAnchor:  [12, 32],
  popupAnchor: [0, -34],
});

// Orange marker icon for regular reclamation projects (created once)
const regularMarkerIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
      <path fill="#ea580c" stroke="white" stroke-width="1.5"
        d="M12 1C6.477 1 2 5.477 2 11c0 7.5 10 20 10 20S22 18.5 22 11C22 5.477 17.523 1 12 1z"/>
      <circle cx="12" cy="11" r="4.5" fill="white" opacity="0.92"/>
    </svg>`,
  className: '',
  iconSize:    [24, 32],
  iconAnchor:  [12, 32],
  popupAnchor: [0, -34],
});

// Calculate centroid from a [lat, lon] positions array
function calcCentroid(positions) {
  const n = positions.length;
  if (n === 0) return null;
  const lat = positions.reduce((s, p) => s + p[0], 0) / n;
  const lon = positions.reduce((s, p) => s + p[1], 0) / n;
  return [lat, lon];
}

// ── Popup content ─────────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="info-row">
      <span className="label">{label}:</span>
      <span className="value">{value}</span>
    </div>
  );
}

function SitePopup({ site, onPhotoClick }) {
  const photos = site.photos || [];
  const detailUrl = `${import.meta.env.BASE_URL}#/site/${site._index}`;

  return (
    <div className="popup-content">
      <h3>{site.name || 'Unnamed Site'}</h3>

      <InfoRow label="Area"              value={site.area ? `${site.area} ha` : '—'} />
      <InfoRow label="Area (PRA)"        value={site.area_pra ? `${site.area_pra} ha` : '—'} />
      <InfoRow label="Status"            value={site.status || '—'} />
      <InfoRow label="PRA Status"        value={site.pra_status || '—'} />
      <InfoRow label="Year Start"        value={site.year_start} />
      <InfoRow label="Year End"          value={site.year_end} />
      <InfoRow label="Developer"         value={site.developer} />
      <InfoRow label="Barangay"          value={site.barangay} />
      <InfoRow label="Municipality/City" value={site.municipality} />
      <InfoRow label="Province"          value={site.province} />
      <InfoRow label="Region"            value={site.region} />
      <InfoRow label="Notes"             value={site.notes} />

      <a
        href={detailUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="popup-detail-link"
      >
        View Full Details &rarr;
      </a>

      {photos.length > 0 && (
        <div className="photo-gallery">
          <h4>Photos ({photos.length})</h4>
          <div className="photo-thumbnails">
            {photos.map((photo, i) => (
              <img
                key={i}
                src={photo}
                alt={`Photo ${i + 1}`}
                className="photo-thumbnail"
                onClick={() => onPhotoClick(photos, i)}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to convert polygon coordinates
function convertPolygonCoordinates(geometry) {
  // Check if coordinates are in lat/lon range (< 180)
  if (geometry.type === 'Polygon') {
    const firstCoord = geometry.coordinates[0][0];
    if (Math.abs(firstCoord[0]) < 180 && Math.abs(firstCoord[1]) < 90) {
      // GeoJSON is [lon, lat], Leaflet needs [lat, lon]
      return [geometry.coordinates[0].map(([lon, lat]) => [lat, lon])];
    }
  } else if (geometry.type === 'MultiPolygon') {
    const firstCoord = geometry.coordinates[0][0][0];
    if (Math.abs(firstCoord[0]) < 180 && Math.abs(firstCoord[1]) < 90) {
      return geometry.coordinates.map(poly => poly[0].map(([lon, lat]) => [lat, lon]));
    }
  }
  
  // Coordinates are in projected CRS - skip
  return null;
}

// ── Fit bounds when filtered sites change ─────────────────────────────────────

function FitBoundsController({ sites, hasActiveFilters }) {
  const map = useMap();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!hasActiveFilters) {
      map.setView([12.8797, 121.774], 6);
      return;
    }

    if (sites.length === 0) return;

    const points = [];
    sites.forEach(site => {
      if (site.geometry) {
        const g = site.geometry;
        const ring = g.type === 'Polygon'
          ? g.coordinates[0]
          : g.type === 'MultiPolygon'
            ? g.coordinates[0][0]
            : null;
        if (ring) {
          ring.forEach(([lon, lat]) => {
            if (Math.abs(lon) < 180 && Math.abs(lat) < 90) points.push([lat, lon]);
          });
          return;
        }
      }
      if (site.lat && site.lon && !isNaN(site.lat) && !isNaN(site.lon)) {
        points.push([site.lat, site.lon]);
      }
    });

    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
  }, [sites, hasActiveFilters]);

  return null;
}

// ── Map component ─────────────────────────────────────────────────────────────

function MapDisplay({ sites, onPhotoClick, layers, hasActiveFilters }) {
  const [ports, setPorts] = useState([]);
  const [restoreFeatures, setRestoreFeatures] = useState([]);
  const [regularFeatures, setRegularFeatures] = useState([]);
  const [applicationFeatures, setApplicationFeatures] = useState([]);
  const [basemap, setBasemap] = useState('street'); // 'street' or 'satellite'

  // Get layer visibility from sidebar
  const showMarkers = layers?.find(l => l.id === 'markers')?.visible ?? true;
  const showPolygons = layers?.find(l => l.id === 'polygons')?.visible ?? true;
  const showPorts = layers?.find(l => l.id === 'ports')?.visible ?? false;
  const showRestore = layers?.find(l => l.id === 'restore')?.visible ?? true;
  const showRegular       = layers?.find(l => l.id === 'regular')?.visible ?? true;
  const showApplications  = layers?.find(l => l.id === 'applications')?.visible ?? true;

  // Load Restoration Projects GeoJSON
  useEffect(() => {
    const path = `${import.meta.env.BASE_URL}RestoreProjects.geojson`;
    fetch(path)
      .then(r => r.ok ? r.json() : null)
      .then(geojson => {
        if (!geojson?.features) return;
        const parsed = geojson.features
          .filter(f => f.geometry?.type === 'Polygon')
          .map(f => ({
            positions: f.geometry.coordinates[0].map(([lon, lat]) => [lat, lon]),
            project_name: f.properties.project_name,
            project_number: f.properties.project_number,
            lot_name: f.properties.lot_name,
          }));
        setRestoreFeatures(parsed);
        console.log(`✅ Loaded ${parsed.length} restoration polygons`);
      })
      .catch(err => console.log('⚠️ RestoreProjects not loaded:', err.message));
  }, []);

  // Load Regular Reclamation Projects GeoJSON
  useEffect(() => {
    const path = `${import.meta.env.BASE_URL}RegularReclamations.geojson`;
    fetch(path)
      .then(r => r.ok ? r.json() : null)
      .then(geojson => {
        if (!geojson?.features) return;
        const parsed = geojson.features
          .filter(f => f.geometry?.type === 'Polygon')
          .map(f => ({
            positions: f.geometry.coordinates[0].map(([lon, lat]) => [lat, lon]),
            project_name: f.properties.project_name,
            lot_name: f.properties.lot_name,
          }));
        setRegularFeatures(parsed);
        console.log(`✅ Loaded ${parsed.length} regular reclamation polygons`);
      })
      .catch(err => console.log('⚠️ RegularReclamations not loaded:', err.message));
  }, []);

  // Load Applications GeoJSON
  useEffect(() => {
    const path = `${import.meta.env.BASE_URL}Applications.geojson`;
    fetch(path)
      .then(r => r.ok ? r.json() : null)
      .then(geojson => {
        if (!geojson?.features) return;
        const parsed = geojson.features
          .filter(f => f.geometry?.type === 'Polygon')
          .map(f => ({
            positions: f.geometry.coordinates[0].map(([lon, lat]) => [lat, lon]),
            application_name: f.properties.application_name,
            lot_name:         f.properties.lot_name,
            province:         f.properties.province,
          }));
        setApplicationFeatures(parsed);
        console.log(`✅ Loaded ${parsed.length} application polygons`);
      })
      .catch(err => console.log('⚠️ Applications not loaded:', err.message));
  }, []);

  // Load ports GeoJSON
  useEffect(() => {
    const portsPath = `${import.meta.env.BASE_URL}Ports.geojson`;
    console.log('🚢 Loading ports from:', portsPath);
    
    fetch(portsPath)
      .then(response => {
        if (!response.ok) {
          console.log('⚠️ No Ports.geojson found (this is okay)');
          return null;
        }
        return response.json();
      })
      .then(geojson => {
        if (geojson && geojson.features) {
          console.log('✅ Loaded ports:', geojson.features.length);
          
          // Process ports features
          const processedPorts = geojson.features.map(feature => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates;
            
            return {
              name: props.name || props.Name || 'Unnamed Port',
              lat: coords[1],
              lon: coords[0],
              type: props.type || 'port'
            };
          });
          
          setPorts(processedPorts);
        }
      })
      .catch(error => {
        console.log('⚠️ Ports not loaded:', error.message);
      });
  }, []);

  // One marker per project for regular reclamations (first polygon of each project)
  const regularMarkerFeatures = useMemo(() => {
    const seen = new Set();
    return regularFeatures.filter(f => {
      if (seen.has(f.project_name)) return false;
      seen.add(f.project_name);
      return true;
    });
  }, [regularFeatures]);

  // Extract polygons from sites
  const polygonsToRender = useMemo(() => {
    const result = [];
    sites.forEach((site, index) => {
      if (site.geometry && (site.geometry.type === 'Polygon' || site.geometry.type === 'MultiPolygon')) {
        const coords = convertPolygonCoordinates(site.geometry);
        if (coords) {
          const color = getStatusColor(site.status);
          coords.forEach((ring, ri) => {
            result.push({
              key: `polygon-${index}-${ri}`,
              positions: ring,
              site,
              color,
            });
          });
        }
      }
    });
    console.log(`📐 Rendering ${result.length} polygons from ${sites.length} sites`);
    return result;
  }, [sites]);

  return (
    <MapContainer
      center={[12.8797, 121.774]}
      zoom={6}
      style={{ width: '100%', height: '100vh' }}
    >
      <FitBoundsController sites={sites} hasActiveFilters={hasActiveFilters} />

      {/* Basemap Layers */}
      {basemap === 'street' ? (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
      ) : (
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
      )}

      {/* Basemap Toggle Button */}
      <div className="basemap-toggle">
        <button
          className={`basemap-btn ${basemap === 'street' ? 'active' : ''}`}
          onClick={() => setBasemap('street')}
        >
          Street
        </button>
        <button
          className={`basemap-btn ${basemap === 'satellite' ? 'active' : ''}`}
          onClick={() => setBasemap('satellite')}
        >
          Satellite
        </button>
      </div>
      
      {/* Reclamation Polygons - controlled by sidebar */}
      {showPolygons && (
        <FeatureGroup>
          {polygonsToRender.map(({ key, positions, site, color }) => (
            <Polygon
              key={key}
              positions={positions}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.25, weight: 2 }}
            >
              <Popup maxWidth={300} minWidth={240}>
                <SitePopup site={site} onPhotoClick={onPhotoClick} />
              </Popup>
            </Polygon>
          ))}
        </FeatureGroup>
      )}

      {/* Restoration Projects Layer */}
      {showRestore && restoreFeatures.length > 0 && (
        <FeatureGroup>
          {restoreFeatures.map((f, i) => {
            const centroid = calcCentroid(f.positions);
            const popup = (
              <Popup maxWidth={280} minWidth={200}>
                <div className="popup-content">
                  <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                    Restoration Project
                  </div>
                  <h3 style={{ marginBottom: 6 }}>{f.project_name}</h3>
                  {f.lot_name && (
                    <div className="info-row">
                      <span className="label">Lot:</span>
                      <span className="value">{f.lot_name}</span>
                    </div>
                  )}
                  {f.project_number && (
                    <div className="info-row">
                      <span className="label">Case No.:</span>
                      <span className="value">{f.project_number}</span>
                    </div>
                  )}
                </div>
              </Popup>
            );
            return (
              <Fragment key={`restore-${i}`}>
                <Polygon
                  positions={f.positions}
                  pathOptions={{ color: '#16a34a', fillColor: '#22c55e', fillOpacity: 0.25, weight: 2 }}
                >
                  {popup}
                </Polygon>
                {centroid && (
                  <Marker
                    position={centroid}
                    icon={restoreMarkerIcon}
                  >
                    {popup}
                  </Marker>
                )}
              </Fragment>
            );
          })}
        </FeatureGroup>
      )}

      {/* Regular Reclamation Projects Layer */}
      {showRegular && regularFeatures.length > 0 && (
        <FeatureGroup>
          {regularFeatures.map((f, i) => (
            <Polygon
              key={`regular-poly-${i}`}
              positions={f.positions}
              pathOptions={{ color: '#ea580c', fillColor: '#fb923c', fillOpacity: 0.25, weight: 2 }}
            >
              <Popup maxWidth={280} minWidth={200}>
                <div className="popup-content">
                  <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                    Regular Reclamation Project
                  </div>
                  <h3 style={{ marginBottom: 6 }}>{f.project_name}</h3>
                  {f.lot_name && (
                    <div className="info-row">
                      <span className="label">Area:</span>
                      <span className="value">{f.lot_name}</span>
                    </div>
                  )}
                </div>
              </Popup>
            </Polygon>
          ))}
          {regularMarkerFeatures.map((f, i) => {
            const centroid = calcCentroid(f.positions);
            if (!centroid) return null;
            return (
              <Marker
                key={`regular-marker-${i}`}
                position={centroid}
                icon={regularMarkerIcon}
              >
                <Popup maxWidth={280} minWidth={200}>
                  <div className="popup-content">
                    <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                      Regular Reclamation Project
                    </div>
                    <h3 style={{ marginBottom: 6 }}>{f.project_name}</h3>
                    {f.lot_name && (
                      <div className="info-row">
                        <span className="label">Area:</span>
                        <span className="value">{f.lot_name}</span>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </FeatureGroup>
      )}

      {/* Applications Layer */}
      {showApplications && applicationFeatures.length > 0 && (
        <FeatureGroup>
          {applicationFeatures.map((f, i) => {
            const centroid = calcCentroid(f.positions);
            const popup = (
              <Popup maxWidth={280} minWidth={200}>
                <div className="popup-content">
                  <div style={{ fontSize: '11px', color: '#9333ea', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                    Application{f.province ? ` — ${f.province}` : ''}
                  </div>
                  <h3 style={{ marginBottom: 6 }}>{f.application_name}</h3>
                  {f.lot_name && (
                    <div className="info-row">
                      <span className="label">Parcel:</span>
                      <span className="value">{f.lot_name}</span>
                    </div>
                  )}
                </div>
              </Popup>
            );
            return (
              <Fragment key={`app-${i}`}>
                <Polygon
                  positions={f.positions}
                  pathOptions={{ color: '#9333ea', fillColor: '#c084fc', fillOpacity: 0.3, weight: 2 }}
                >
                  {popup}
                </Polygon>
                {centroid && (
                  <Marker position={centroid} icon={applicationMarkerIcon}>
                    {popup}
                  </Marker>
                )}
              </Fragment>
            );
          })}
        </FeatureGroup>
      )}

      {/* Ports Layer - controlled by sidebar */}
      {showPorts && ports.length > 0 && (
        <FeatureGroup>
          {ports.map((port, index) => (
            <CircleMarker
              key={`port-${index}`}
              center={[port.lat, port.lon]}
              radius={6}
              pathOptions={{
                color: '#dc2626',
                fillColor: '#ef4444',
                fillOpacity: 0.8,
                weight: 2
              }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                {port.name}
              </Tooltip>
              <Popup>
                <div className="port-popup">
                  <h4>{port.name}</h4>
                  <p className="port-note">
                    <em>Port data extracted from OpenStreetMap</em>
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </FeatureGroup>
      )}

      {/* Reclamation Sites Markers */}
      {showMarkers && sites.map((site, index) => {
        // Skip sites without valid coordinates
        if (!site.lat || !site.lon || isNaN(site.lat) || isNaN(site.lon)) {
          return null;
        }

        return (
          <Marker
            key={`${site.name}-${index}`}
            position={[site.lat, site.lon]}
            icon={createMarkerIcon(site.status)}
          >
            <Popup maxWidth={300} minWidth={240}>
              <SitePopup site={site} onPhotoClick={onPhotoClick} />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default MapDisplay;
