import { X } from 'lucide-react';

const FEATURES = [
  {
    title: 'Flagged Areas',
    description: 'Highlights sites where the area of the GIS-delineated boundary differs significantly from the area recorded in the PRA database.',
  },
  {
    title: 'Download Report as PDF',
    description: 'Export any site\'s detail page as a printable PDF report.',
  },
];

function WhatsNewModal({ onClose }) {
  return (
    <div className="whatsnew-overlay" onClick={onClose}>
      <div className="whatsnew-card" onClick={e => e.stopPropagation()}>
        <button className="whatsnew-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <h2 className="whatsnew-title">What's New</h2>
        <ul className="whatsnew-list">
          {FEATURES.map(f => (
            <li key={f.title}>
              <strong>{f.title}:</strong> {f.description}
            </li>
          ))}
        </ul>
        <button className="whatsnew-btn" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

export default WhatsNewModal;
