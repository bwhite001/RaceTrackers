import React from 'react';

const SearchInput = ({ searchTerm, onSearchChange }) => (
  <div className="flex-1 max-w-md">
    <div className="relative">
      <input
        type="text"
        placeholder="Search runner number..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="form-input pr-10"
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  </div>
);

export default SearchInput;
