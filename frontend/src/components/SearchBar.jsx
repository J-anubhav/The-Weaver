import React from 'react';

export function SearchBar({ query, setQuery, results, onResultClick }) {
  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a concept..."
      />
      {results.length > 0 && query && (
        <ul className="search-results">
          {results.slice(0, 10).map(result => (
            // --- YEH HAIN FIXES ---
            <li key={result.id} onClick={() => onResultClick(result.id)}>
              {result.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}