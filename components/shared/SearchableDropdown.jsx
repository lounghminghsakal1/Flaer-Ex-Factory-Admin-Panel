import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';

/**
 * Global Searchable Dropdown Component
 * 
 * @param {Object} props
 * @param {string} props.label - Label text for the dropdown
 * @param {string} props.placeholder - Placeholder text (default: "Select option")
 * @param {Array} props.options - Array of options [{id, name}] or [{value, label}]
 * @param {string|number} props.value - Selected value (id or value)
 * @param {Function} props.onChange - Callback when selection changes (value) => {}
 * @param {string} props.searchPlaceholder - Search input placeholder
 * @param {boolean} props.disabled - Disable the dropdown
 * @param {string} props.emptyMessage - Message when no options found
 * @param {boolean} props.required - Show required asterisk
 * @param {string} props.valueKey - Key to use for value (default: "id")
 * @param {string} props.labelKey - Key to use for label (default: "name")
 */
const SearchableDropdown = ({
  label,
  placeholder = "Select option",
  options = [],
  value,
  onChange,
  searchPlaceholder = "Search...",
  disabled = false,
  emptyMessage = "No options found",
  required = false,
  valueKey = "id",
  labelKey = "name",
  creatable = false,
  onCreateOption = (value) => { }

}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredOptions = options.filter(option => {
    const label = option[labelKey]?.toString().toLowerCase() || '';
    return label.includes(searchQuery.toLowerCase());
  });

  const selectedOption = options.find(option => option[valueKey] === value);
  const displayLabel = selectedOption ? selectedOption[labelKey] : placeholder;


  const exactMatch = filteredOptions.some(
    opt => opt[labelKey]?.toLowerCase() === searchQuery.toLowerCase()
  );

  const canCreate =
    creatable &&
    searchQuery.trim() &&
    !exactMatch;

  const handleSelect = (option) => {
    onChange?.(option[valueKey]);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
              {displayLabel}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            {/* Search Bar */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-64 overflow-y-auto py-1">
              {filteredOptions.length === 0 && !canCreate ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  {emptyMessage}
                </div>
              ) : (
                <div>
                  {filteredOptions.map(option => (
                    <button
                      key={option[valueKey]}
                      onClick={() => handleSelect(option)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      {option[labelKey]}
                    </button>
                  ))}

                  {canCreate && (
                    <button
                      onClick={() => {
                        onCreateOption(searchQuery);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full px-3 py-2 text-left text-sm
                   bg-blue-50 text-blue-700
                   hover:bg-blue-100 flex items-center gap-2"
                    >
                      ➕ Add “{searchQuery}”
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableDropdown;

// ============================================
// USAGE EXAMPLES
// ============================================

// Example 1: Basic Usage with id/name
/*
const options = [
  { id: 1, name: 'Option 1' },
  { id: 2, name: 'Option 2' },
  { id: 3, name: 'Option 3' }
];

<SearchableDropdown
  label="Select Option"
  options={options}
  value={selectedValue}
  onChange={(value) => setSelectedValue(value)}
/>
*/

// Example 2: With value/label keys
/*
const options = [
  { value: 'opt1', label: 'Option 1' },
  { value: 'opt2', label: 'Option 2' }
];

<SearchableDropdown
  label="Select Option"
  options={options}
  value={selectedValue}
  onChange={(value) => setSelectedValue(value)}
  valueKey="value"
  labelKey="label"
/>
*/

// Example 3: Required field with custom placeholder
/*
<SearchableDropdown
  label="Category"
  required
  placeholder="Choose a category"
  searchPlaceholder="Type to search categories..."
  options={categories}
  value={categoryId}
  onChange={(value) => setCategoryId(value)}
  emptyMessage="No categories available"
/>
*/

// Example 4: Tax Type Selection (from your code)
/*
<SearchableDropdown
  label="Tax Type"
  options={taxOptions}
  value={formData.tax_type_id}
  onChange={(value) => setFormData(p => ({ ...p, tax_type_id: value }))}
  placeholder="Select tax type"
/>
*/

// Example 5: Tracking Type (replacing your Select component)
/*
const trackingOptions = [
  { id: 'untracked', name: 'Untracked' },
  { id: 'batch', name: 'Batch' },
  { id: 'serial', name: 'Serial' }
];

<SearchableDropdown
  label="Tracking Type"
  options={trackingOptions}
  value={formData.tracking_type}
  onChange={(value) => setFormData(p => ({ ...p, tracking_type: value }))}
/>
*/