import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Search, X } from 'lucide-react';
import { toast } from 'react-toastify';

const TaxSelector = ({ selectedTaxId, onTaxSelect, formData, setFormData, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [taxOptions, setTaxOptions] = useState([]);
  const [selectedTax, setSelectedTax] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const dropdownRef = useRef(null);
  const taxRefs = useRef({});

  const [formDataPopup, setFormDataPopup] = useState({
    name: '',
    code: '',
    cgst: '',
    sgst: '',
    igst: 0,
    percentage: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate IGST and percentage whenever CGST or SGST changes
  useEffect(() => {
    const cgst = parseFloat(formDataPopup.cgst) || 0;
    const sgst = parseFloat(formDataPopup.sgst) || 0;
    const calculatedIgst = cgst + sgst;

    setFormDataPopup(prev => ({
      ...prev,
      igst: calculatedIgst,
      percentage: calculatedIgst
    }));
  }, [formDataPopup.cgst, formDataPopup.sgst]);

  // Initialize selected tax from formData
  useEffect(() => {
    if (formData?.tax_type_id && taxOptions.length > 0 && !selectedTax) {
      const found = taxOptions.find(t => t.id === formData.tax_type_id);
      if (found) {
        setSelectedTax(found);
      }
    }
  }, [formData?.tax_type_id, taxOptions]);

  useEffect(() => {
    fetchTaxOptions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      
      // Auto-scroll to selected tax when dropdown opens
      if (selectedTax && taxRefs.current[selectedTax.id]) {
        setTimeout(() => {
          taxRefs.current[selectedTax.id]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }, 100);
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, selectedTax]);

  async function fetchTaxOptions() {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/tax_types`);
      if (!response.ok) throw new Error("Failed to fetch tax types list");
      const result = await response.json();
      const taxArray = result.data.map(item => ({ 
        id: item.id, 
        name: item.name,
        code: item.code,
        percentage: item.percentage 
      }));
      setTaxOptions(taxArray);
    } catch (err) {
      console.log(err);
      toast.error("Failed to load tax types");
    } finally {
      setLoading(false);
    }
  }

  const handleTaxSelect = (tax) => {
    setSelectedTax(tax);

    // Update parent form data
    if (setFormData) {
      setFormData(prev => ({
        ...prev,
        tax_type_id: tax.id
      }));
    }

    onTaxSelect?.(tax);
    setIsOpen(false);
  };

  const openCreatePopup = () => {
    setFormDataPopup({
      name: '',
      code: '',
      cgst: '',
      sgst: '',
      igst: 0,
      percentage: 0
    });
    setShowCreatePopup(true);
    setIsOpen(false);
  };

  const handleCreateTax = async (e) => {
    e.preventDefault();

    // Validation
    if (!formDataPopup.name.trim()) {
      toast.error('Tax name is required');
      return;
    }
    if (!formDataPopup.code.trim()) {
      toast.error('Tax code is required');
      return;
    }
    if (!formDataPopup.cgst || parseFloat(formDataPopup.cgst) < 0) {
      toast.error('Valid CGST is required');
      return;
    }
    if (!formDataPopup.sgst || parseFloat(formDataPopup.sgst) < 0) {
      toast.error('Valid SGST is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/tax_types`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formDataPopup.name.trim(),
            code: formDataPopup.code.trim().toUpperCase(),
            cgst: parseFloat(formDataPopup.cgst),
            sgst: parseFloat(formDataPopup.sgst),
            igst: formDataPopup.igst,
            percentage: formDataPopup.percentage
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        let errorMessage = 'Failed to create tax type';

        if (Array.isArray(errorData?.errors)) {
          errorMessage = errorData.errors.join(', ');
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      const newTax = result.data;

      setShowCreatePopup(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      toast.success("Tax type created successfully");

      // Fetch updated tax list
      await fetchTaxOptions();

      // Auto-select the newly created tax
      const newTaxOption = { 
        id: newTax.id, 
        name: newTax.name,
        code: newTax.code,
        percentage: newTax.percentage 
      };
      setSelectedTax(newTaxOption);

      // Update parent form data
      if (setFormData) {
        setFormData(prev => ({
          ...prev,
          tax_type_id: newTax.id
        }));
      }

      onTaxSelect?.(newTaxOption);

      // Reopen dropdown and scroll to new tax
      setTimeout(() => {
        setIsOpen(true);
        setTimeout(() => {
          taxRefs.current[newTax.id]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }, 100);
      }, 100);

    } catch (err) {
      console.log(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePopup = () => {
    setFormDataPopup({
      name: '',
      code: '',
      cgst: '',
      sgst: '',
      igst: 0,
      percentage: 0
    });
    setShowCreatePopup(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClosePopup();
    }
  };

  const filteredTaxes = taxOptions.filter(tax =>
    tax.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tax.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Tax Type<span className='text-red-500 ml-1'>*</span>
          </label>
          <button
            type="button"
            onClick={openCreatePopup}
            disabled={disabled}
            className={`flex items-center text-sm text-primary hover:text-primary/80 hover:underline font-medium ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <Plus size={16} /> Create Tax
          </button>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500 transition-colors text-sm ${
              disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={selectedTax ? 'text-gray-900' : 'text-gray-400'}>
                {selectedTax ? `${selectedTax.name}` : 'Select tax type'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {isOpen && !disabled && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
              {/* Search Bar */}
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tax types..."
                    className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Tax List */}
              <div className="max-h-64 overflow-y-auto py-1">
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                ) : filteredTaxes.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No tax types found</div>
                ) : (
                  <div>
                    {filteredTaxes.map(tax => {
                      const isSelected = selectedTax?.id === tax.id;
                      return (
                        <button
                          key={tax.id}
                          ref={el => taxRefs.current[tax.id] = el}
                          onClick={() => handleTaxSelect(tax)}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{tax.name}</span>
                            <span className="text-xs text-gray-500">{tax.percentage}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Create Tax Button - Centered */}
              <div className="border-t border-gray-200 p-2">
                <button
                  type="button"
                  onClick={openCreatePopup}
                  disabled={disabled}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded transition-colors font-medium ${
                    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Tax Type</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Tax Popup */}
      {showCreatePopup && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-blue-50 sticky top-0 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Tax Type
              </h3>
              <button
                onClick={handleClosePopup}
                className="p-1.5 rounded-lg transition-colors hover:bg-red-100 cursor-pointer"
                type="button"
              >
                <X size={20} className="text-gray-700" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTax} className="p-4 space-y-2">
              {/* Tax Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formDataPopup.name}
                  onChange={(e) => setFormDataPopup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., GST 18%"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary focus:border-transparent"
                />
              </div>

              {/* Tax Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formDataPopup.code}
                  onChange={(e) => setFormDataPopup(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g., GST18"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary focus:border-transparent uppercase"
                />
              </div>

              {/* CGST and SGST in a row */}
              <div className="grid grid-cols-2 gap-4">
                {/* CGST */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CGST (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formDataPopup.cgst}
                    onChange={(e) => setFormDataPopup(prev => ({ ...prev, cgst: e.target.value }))}
                    onWheel={(e) => e.target.blur()}
                    placeholder="e.g., 9"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary focus:border-transparent"
                  />
                </div>

                {/* SGST */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SGST (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formDataPopup.sgst}
                    onChange={(e) => setFormDataPopup(prev => ({ ...prev, sgst: e.target.value }))}
                    onWheel={(e) => e.target.blur()}
                    placeholder="e.g., 9"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary focus:border-transparent"
                  />
                </div>
              </div>

              {/* IGST (Auto-calculated, Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IGST (%) <span className="text-xs text-gray-500">(Auto-calculated)</span>
                </label>
                <input
                  type="number"
                  value={formDataPopup.igst}
                  readOnly
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Percentage (Auto-calculated, Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Percentage (%) <span className="text-xs text-gray-500">(Auto-calculated)</span>
                </label>
                <input
                  type="number"
                  value={formDataPopup.percentage}
                  readOnly
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClosePopup}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Tax'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
            <div className="w-2 h-3 border-r-2 border-b-2 border-green-500 transform rotate-45"></div>
          </div>
          <span className="font-medium">Tax type created successfully!</span>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default TaxSelector;