import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../design-system/utils/classNames';

/**
 * SearchInput Component
 * 
 * Search input with clear button and loading state.
 * 
 * @component
 * @example
 * <SearchInput
 *   value={searchTerm}
 *   onChange={setSearchTerm}
 *   placeholder="Search runners..."
 *   loading={isSearching}
 * />
 */
const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search...',
  loading = false,
  disabled = false,
  onClear,
  className,
  ...props
}) => {
  const inputRef = useRef(null);

  const handleClear = () => {
    onChange('');
    if (onClear) {
      onClear();
    }
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || loading}
        className={cn(
          'block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600',
          'rounded-lg bg-white dark:bg-gray-800',
          'text-gray-900 dark:text-gray-100 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors'
        )}
        {...props}
      />

      {/* Loading Spinner or Clear Button */}
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
        {loading ? (
          <svg
            className="animate-spin h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : value ? (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
              'rounded-full transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-navy-500'
            )}
            aria-label="Clear search"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
};

SearchInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  onClear: PropTypes.func,
  className: PropTypes.string,
};

export default SearchInput;
