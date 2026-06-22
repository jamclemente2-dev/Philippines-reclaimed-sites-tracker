import { useState } from 'react';
import { ArrowLeft, Download, ExternalLink, FileText, Printer } from 'lucide-react';
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

  const fileId = site.document ? extractGoogleDriveId(site.document) : null;
  const previewUrl = fileId
    ? `https://drive.google.com/file/d/${fileId}/preview`
    : null;
  const downloadUrl = fileId
    ? `https://drive.google.com/uc?export=download&id=${fileId}`
    : null;

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

          {/* Key figures */}
          <section className="detail-section">
            <h2 className="detail-section-title">Site Information</h2>
            <div className="detail-grid">
              <DetailRow label="Area"               value={site.area ? `${site.area} ha` : null} />
              <DetailRow label="Area (PRA)"         value={site.area_pra ? `${site.area_pra} ha` : null} />
              <DetailRow label="PRA Status"         value={site.pra_status} />
              <DetailRow label="Developer"          value={site.developer} />
              <DetailRow label="Year Started"       value={site.year_start} />
              <DetailRow label="Year Completed"     value={site.year_end} />
              <DetailRow label="Data by"            value={site.author} />
            </div>
          </section>

          {/* Location */}
          <section className="detail-section">
            <h2 className="detail-section-title">Location</h2>
            <div className="detail-grid">
              <DetailRow label="Barangay"           value={site.barangay} />
              <DetailRow label="Municipality/City"  value={site.municipality} />
              <DetailRow label="Province"           value={site.province} />
              <DetailRow label="Region"             value={site.region} />
            </div>
          </section>

          {/* Notes */}
          {(site.notes || site.comments) && (
            <section className="detail-section">
              <h2 className="detail-section-title">Notes</h2>
              {site.notes    && <p className="detail-notes">{site.notes}</p>}
              {site.comments && <p className="detail-notes">{site.comments}</p>}
            </section>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <section className="detail-section">
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

        {/* ── Right / Document column ── */}
        <div className="detail-doc-panel">
          <section className="detail-section">
            <h2 className="detail-section-title">
              <FileText size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Document
            </h2>

            {fileId ? (
              <>
                <div className="doc-actions">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="doc-btn doc-btn-view"
                  >
                    <ExternalLink size={13} />
                    View PDF
                  </a>
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="doc-btn doc-btn-download"
                  >
                    <Download size={13} />
                    Download
                  </a>
                </div>
                <div className="pdf-embed-wrapper">
                  <iframe
                    src={previewUrl}
                    title="Document Preview"
                    className="pdf-iframe"
                    allow="autoplay"
                  />
                </div>
              </>
            ) : (
              <div className="no-doc-box">
                <FileText size={32} className="no-doc-icon" />
                <p>No document attached to this site.</p>
                <p className="no-doc-hint">
                  Add a Google Drive PDF link to the <code>document</code> field
                  in <code>ReclamationSites.geojson</code> to enable this.
                </p>
              </div>
            )}
          </section>
        </div>

      </div>
    </div>

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
