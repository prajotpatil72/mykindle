import { useState, useEffect, useCallback } from 'react';

const SearchBar = ({ onSearch, placeholder = 'Search documents...' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Debounced search callback
  const debouncedSearch = useCallback(
    debounce((value) => {
      onSearch(value);
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <button className="search-clear" onClick={handleClear}>
          ×
        </button>
      )}
    </div>
  );
};

export default SearchBar;