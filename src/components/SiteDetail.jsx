import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import Lightbox from './Lightbox';

function extractGoogleDriveId(url) {
  if (!url || url === 'null' || url.trim() === '') return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}


function SiteDetail({ site }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const photos = site.photos || [];

  const statusClass = `detail-status-badge status-${(site.status || 'unknown')
    .toLowerCase()
    .replace(/[\s-]+/g, '')}`;

  return (
    <>
    <div className="site-detail-page">

      {/* ── Header ── */}
      <div className="detail-header">
        <div className="detail-header-actions">
          <a
            href={import.meta.env.BASE_URL}
            className="back-btn"
          >
            <ArrowLeft size={15} />
            Back to Map
          </a>
          <button
            className="print-btn"
            onClick={() => window.print()}
          >
            <Printer size={15} />
            Download Report as PDF
          </button>
        </div>

        <div className="detail-title-block">
          <div className="detail-title-row">
            <h1 className="detail-site-name">{site.name}</h1>
            <span className={statusClass}>{site.status || 'Unknown'}</span>
          </div>
          {site.code_name && (
            <p className="detail-code-name">Code: {site.code_name}</p>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="detail-body">

        {/* ── Left / Main column ── */}
        <div className="detail-main">

          {/* Site details */}
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

          {/* Photos — screen only */}
          {photos.length > 0 && (
            <section className="detail-section no-print">
              <h2 className="detail-section-title">Photos ({photos.length})</h2>
              <div className="detail-photos">
                {photos.map((photo, i) => (
                  <button
                    key={i}
                    className="detail-photo-btn"
                    onClick={() => setLightboxIdx(i)}
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
        </div>


      </div>
    </div>

    {/* Photos portal — renders directly in <body>, outside all overflow containers.
        break-before: page is guaranteed to work here. */}
    {photos.length > 0 && createPortal(
      <section className="photos-print-portal">
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
      </section>,
      document.body
    )}

    {lightboxIdx !== null && (
      <Lightbox
        photos={photos}
        initialIndex={lightboxIdx}
        onClose={() => setLightboxIdx(null)}
      />
    )}
    </>
  );
}

export default SiteDetail;
