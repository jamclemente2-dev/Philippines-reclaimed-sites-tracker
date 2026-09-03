import { SlidersHorizontal, X, Map, ListChecks, FileDown } from 'lucide-react';

const FILTER_FIELDS = [
  { key: 'name',         label: 'Name',         placeholder: 'Search by name…' },
  { key: 'municipality', label: 'Municipality',  placeholder: 'e.g. Manila, Makati…' },
  { key: 'province',     label: 'Province',      placeholder: 'e.g. Bataan, Cebu…' },
  { key: 'region',       label: 'Region',        placeholder: 'e.g. NCR, Region VII…' },
  { key: 'developer',   label: 'Developer',     placeholder: 'Search by developer…' },
];

const PRA_STATUS_OPTIONS = [
  { value: '',            label: 'All' },
  { value: 'Not listed',  label: 'Not listed' },
  { value: 'Listed',      label: 'Listed' },
];

function SearchSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  totalSites,
  visibleSites,
  layers,
  onLayerToggle,
  filteredSites,
  selectedIds,
  onToggleSelect,
  onSelectAllVisible,
  onClearSelection,
}) {
  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const handleDownloadBulkReport = () => {
    const ids = Array.from(selectedIds).join(',');
    window.open(`${import.meta.env.BASE_URL}#/report/${ids}`, '_blank');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Philippine Reclaimed Sites</h1>
        <p>Interactive map of reclamation projects</p>
      </div>

      <div className="sidebar-stats">
        Showing <strong>{visibleSites}</strong> of <strong>{totalSites}</strong> sites
      </div>

      <div className="sidebar-section">
        <div className="section-title">
          <SlidersHorizontal size={14} />
          <span>Filter Sites</span>
        </div>

        {FILTER_FIELDS.map(({ key, label, placeholder }) => (
          <div className="filter-group" key={key}>
            <label htmlFor={`filter-${key}`}>{label}</label>
            <input
              id={`filter-${key}`}
              type="text"
              placeholder={placeholder}
              value={filters[key]}
              onChange={e => onFilterChange(key, e.target.value)}
              autoComplete="off"
            />
          </div>
        ))}

        <div className="filter-group">
          <label htmlFor="filter-pra_status">PRA Status</label>
          <select
            id="filter-pra_status"
            value={filters.pra_status}
            onChange={e => onFilterChange('pra_status', e.target.value)}
          >
            {PRA_STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button className="clear-btn" onClick={onClearFilters}>
            <X size={13} />
            Clear Filters
          </button>
        )}
      </div>

      {/* Bulk Report Section */}
      <div className="sidebar-section">
        <div className="section-title">
          <ListChecks size={14} />
          <span>Select Sites for Report</span>
        </div>

        <div className="site-select-actions">
          <button
            className="site-select-action-btn"
            onClick={() => onSelectAllVisible(filteredSites.map(s => s._index))}
            disabled={filteredSites.length === 0}
          >
            Select all visible ({filteredSites.length})
          </button>
          {selectedIds.size > 0 && (
            <button className="site-select-action-btn" onClick={onClearSelection}>
              Clear ({selectedIds.size})
            </button>
          )}
        </div>

        <div className="site-select-list">
          {filteredSites.length === 0 ? (
            <p className="site-select-empty">No sites match the current filters.</p>
          ) : (
            filteredSites.map(site => (
              <label key={site._index} className="site-select-row">
                <input
                  type="checkbox"
                  checked={selectedIds.has(site._index)}
                  onChange={() => onToggleSelect(site._index)}
                />
                <span className="site-select-name">{site.name}</span>
              </label>
            ))
          )}
        </div>

        <button
          className="bulk-report-btn"
          onClick={handleDownloadBulkReport}
          disabled={selectedIds.size === 0}
        >
          <FileDown size={15} />
          Download Bulk Report ({selectedIds.size})
        </button>
      </div>

      {/* Map Layers Section */}
      <div className="sidebar-section">
        <div className="section-title">
          <Map size={14} />
          <span>Map Layers</span>
        </div>
        
        <div className="layer-controls">
          {layers.map(layer => (
            <label key={layer.id} className="layer-checkbox">
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={() => onLayerToggle(layer.id)}
              />
              <span className="layer-name">{layer.name}</span>
            </label>
          ))}
        </div>
      </div>

    </aside>
  );
}

export default SearchSidebar;
