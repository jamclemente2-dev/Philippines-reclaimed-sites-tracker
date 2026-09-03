import { useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import Lightbox from './Lightbox';
import DetailRow from './DetailRow';

function BulkReportSite({ site, onPhotoClick }) {
  const photos = site.photos || [];
  const statusClass = `detail-status-badge status-${(site.status || 'unknown')
    .toLowerCase()
    .replace(/[\s-]+/g, '')}`;

  return (
    <div className="bulk-site-card">
      <div className="bulk-site-header">
        <div className="detail-title-row">
          <h1 className="detail-site-name">{site.name}</h1>
          <span className={statusClass}>{site.status || 'Unknown'}</span>
        </div>
        {site.code_name && (
          <p className="detail-code-name">Code: {site.code_name}</p>
        )}
      </div>

      <div className="bulk-site-body">
        <section className="detail-section">
          <div className="detail-grid">
            <DetailRow label="Project Site"                   value={site.name} />
            <DetailRow label="Code Name"                      value={site.code_name} />
            <DetailRow label="Latitude"                       value={site.lat} />
            <DetailRow label="Longitude"                      value={site.lon} />
            <DetailRow label="Area of Polygon"                value={site.area ? `${site.area} ha` : null} />
            <DetailRow label="Area indicated in PRA database" value={site.area_pra ? `${site.area_pra} ha` : null} />
            <DetailRow label="Status of Reclamation"          value={site.status} />
            <DetailRow label="Listed in PRA database?"        value={site.pra_status} />
            <DetailRow label="Year Start of Reclamation"      value={site.year_start} />
            <DetailRow label="Year End of Reclamation"        value={site.year_end} />
            <DetailRow label="Developer/Owner"                value={site.developer} />
            <DetailRow label="Barangay"                       value={site.barangay} />
            <DetailRow label="Municipality/City"              value={site.municipality} />
            <DetailRow label="Province"                       value={site.province} />
            <DetailRow label="Remarks/Notes"                  value={[site.notes, site.comments].filter(Boolean).join(' ')} />
            <DetailRow label="Author"                         value={site.author} />
          </div>
        </section>

        {photos.length > 0 && (
          <section className="detail-section no-print">
            <h2 className="detail-section-title">Photos ({photos.length})</h2>
            <div className="detail-photos">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  className="detail-photo-btn"
                  onClick={() => onPhotoClick(photos, i)}
                >
                  <img
                    src={photo}
                    alt={`Photo ${i + 1}`}
                    className="detail-photo-thumb"
                    onError={e => { e.currentTarget.closest('button').style.display = 'none'; }}
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {photos.length > 0 && (
          <section className="print-only bulk-photos-section">
            <h2 className="photos-print-title">Photos ({photos.length})</h2>
            <div className="photos-print-grid">
              {photos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`Photo ${i + 1}`}
                  className="photos-print-img"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function BulkReport({ sites }) {
  const [lightbox, setLightbox] = useState({ open: false, photos: [], index: 0 });

  const openLightbox = (photos, index) => setLightbox({ open: true, photos, index });

  return (
    <>
      <div className="bulk-report-page">
        <div className="bulk-report-toolbar no-print">
          <a href={import.meta.env.BASE_URL} className="back-btn">
            <ArrowLeft size={15} />
            Back to Map
          </a>
          <button className="print-btn" onClick={() => window.print()}>
            <Printer size={15} />
            Download Report as PDF ({sites.length} site{sites.length === 1 ? '' : 's'})
          </button>
        </div>

        {sites.length === 0 ? (
          <div className="bulk-report-empty">No sites selected.</div>
        ) : (
          sites.map(site => (
            <BulkReportSite key={site._index} site={site} onPhotoClick={openLightbox} />
          ))
        )}
      </div>

      {lightbox.open && (
        <Lightbox
          photos={lightbox.photos}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(prev => ({ ...prev, open: false }))}
        />
      )}
    </>
  );
}

export default BulkReport;
