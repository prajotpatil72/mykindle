import { useState } from 'react';

const FilterControls = ({ onFilterChange, onSortChange, currentSort }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    minSize: '',
    maxSize: '',
    tags: '',
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      dateFrom: '',
      dateTo: '',
      minSize: '',
      maxSize: '',
      tags: '',
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="filter-controls">
      <div className="filter-header">
        <select 
          className="sort-select" 
          value={currentSort} 
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="-createdAt">Newest First</option>
          <option value="createdAt">Oldest First</option>
          <option value="originalName">Name (A-Z)</option>
          <option value="-originalName">Name (Z-A)</option>
          <option value="-fileSize">Largest First</option>
          <option value="fileSize">Smallest First</option>
          <option value="-pageCount">Most Pages</option>
          <option value="pageCount">Least Pages</option>
        </select>

        <button
          className={`btn btn-secondary ${hasActiveFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          🔧 Filters {hasActiveFilters && '●'}
        </button>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-section">
            <h4>Date Range</h4>
            <div className="filter-row">
              <input
                type="date"
                className="form-input"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                placeholder="From"
              />
              <input
                type="date"
                className="form-input"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                placeholder="To"
              />
            </div>
          </div>

          <div className="filter-section">
            <h4>File Size (MB)</h4>
            <div className="filter-row">
              <input
                type="number"
                className="form-input"
                value={filters.minSize}
                onChange={(e) => handleFilterChange('minSize', e.target.value)}
                placeholder="Min"
                min="0"
              />
              <input
                type="number"
                className="form-input"
                value={filters.maxSize}
                onChange={(e) => handleFilterChange('maxSize', e.target.value)}
                placeholder="Max"
                min="0"
              />
            </div>
          </div>

          <div className="filter-section">
            <h4>Tags</h4>
            <input
              type="text"
              className="form-input"
              value={filters.tags}
              onChange={(e) => handleFilterChange('tags', e.target.value)}
              placeholder="Enter tags (comma-separated)"
            />
          </div>

          <div className="filter-actions">
            <button className="btn btn-secondary" onClick={handleClearFilters}>
              Clear Filters
            </button>
            <button className="btn btn-primary" onClick={() => setShowFilters(false)}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterControls;