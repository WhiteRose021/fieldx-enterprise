import React, { useState, useEffect } from 'react';
import { Product } from '@/types/warehouse';
import { X, Package, Save, Camera, Upload, AlertTriangle, Info } from 'lucide-react';

interface ProductModalProps {
  product?: Product | null;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    location: '',
    quantity: 0,
    minStockLevel: 5
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Predefined categories and locations for suggestions
  const categoryOptions = ['Fiber', 'Cable', 'Hardware', 'Tools', 'Connectors', 'Power Equipment'];
  const locationOptions = ['Warehouse A', 'Warehouse B', 'Section 1', 'Section 2', 'Section 3', 'Main Stock'];

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || '',
        description: product.description || '',
        location: product.location || '',
        quantity: product.stock || 0,
        minStockLevel: 5 // Default value, adjust if you have this field in your product model
      });
    }
  }, [product]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) newErrors.name = 'Το όνομα προϊόντος είναι υποχρεωτικό';
    if (!formData.sku.trim()) newErrors.sku = 'Ο κωδικός SKU είναι υποχρεωτικός';
    if (formData.quantity < 0) newErrors.quantity = 'Η ποσότητα δεν μπορεί να είναι αρνητική';
    
    // Add more validation as needed
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;
    
    // Handle number inputs
    if (type === 'number') {
      parsedValue = value === '' ? 0 : parseInt(value, 10);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      await onSave({
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        quantity: formData.quantity,
        minStockLevel: formData.minStockLevel
      });
    } catch (error) {
      console.error('Error saving product:', error);
      setErrors({submit: 'Αποτυχία αποθήκευσης προϊόντος. Παρακαλώ δοκιμάστε ξανά.'});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900 bg-opacity-50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-full animate-modal-in">
        <div className="relative bg-aspro rounded-lg shadow-xl">
          {/* Modal Header */}
          <div className="flex items-start justify-between p-4 border-b border-gray-200 rounded-t bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {product ? 'Επεξεργασία Προϊόντος' : 'Προσθήκη Νέου Προϊόντος'}
              </h3>
            </div>
            <button 
              type="button" 
              onClick={onClose}
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Error message at top if submit failed */}
          {errors.submit && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <p>{errors.submit}</p>
              </div>
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900">
                    Όνομα Προϊόντος <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`bg-gray-50 border ${errors.name ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                    placeholder="Εισάγετε όνομα προϊόντος"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="sku" className="block mb-2 text-sm font-medium text-gray-900">
                    Κωδικός SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="sku"
                    id="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className={`bg-gray-50 border ${errors.sku ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                    placeholder="Εισάγετε κωδικό SKU"
                  />
                  {errors.sku && (
                    <p className="mt-1 text-sm text-red-600">{errors.sku}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="category" className="block mb-2 text-sm font-medium text-gray-900">
                    Κατηγορία
                  </label>
                  <select
                    name="category"
                    id="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  >
                    <option value="">Επιλέξτε κατηγορία</option>
                    {categoryOptions.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                    <option value="custom">Άλλο (Προσαρμοσμένο)</option>
                  </select>
                  {formData.category === 'custom' && (
                    <input
                      type="text"
                      name="category"
                      placeholder="Εισάγετε προσαρμοσμένη κατηγορία"
                      onChange={handleChange}
                      className="mt-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    />
                  )}
                </div>
                
                <div>
                  <label htmlFor="location" className="block mb-2 text-sm font-medium text-gray-900">
                    Τοποθεσία Αποθήκευσης
                  </label>
                  <select
                    name="location"
                    id="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  >
                    <option value="">Επιλέξτε τοποθεσία</option>
                    {locationOptions.map((loc, i) => (
                      <option key={i} value={loc}>{loc}</option>
                    ))}
                    <option value="custom">Άλλο (Προσαρμοσμένο)</option>
                  </select>
                  {formData.location === 'custom' && (
                    <input
                      type="text"
                      name="location"
                      placeholder="Εισάγετε προσαρμοσμένη τοποθεσία"
                      onChange={handleChange}
                      className="mt-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    />
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="quantity" className="block mb-2 text-sm font-medium text-gray-900">
                      Ποσότητα <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      id="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="0"
                      className={`bg-gray-50 border ${errors.quantity ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                      placeholder="Εισάγετε ποσότητα"
                    />
                    {errors.quantity && (
                      <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="minStockLevel" className="block mb-2 text-sm font-medium text-gray-900">
                      Ελάχιστο Επίπεδο Αποθέματος
                    </label>
                    <input
                      type="number"
                      name="minStockLevel"
                      id="minStockLevel"
                      value={formData.minStockLevel}
                      onChange={handleChange}
                      min="0"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      placeholder="Ελάχιστο επίπεδο αποθέματος"
                    />
                    <p className="mt-1 text-xs text-gray-500 flex items-center">
                      <Info size={12} className="mr-1" /> 
                      Θα επισημανθεί ως «χαμηλό απόθεμα» κάτω από αυτό το επίπεδο
                    </p>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900">
                    Περιγραφή
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Εισάγετε περιγραφή προϊόντος"
                  ></textarea>
                </div>
                
                <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <div className="mb-2">
                    <Camera className="mx-auto h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Μεταφόρτωση εικόνας προϊόντος</p>
                  <button 
                    type="button"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Επιλογή Αρχείου
                  </button>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 bg-aspro hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
              >
                Ακύρωση
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Επεξεργασία...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {product ? 'Ενημέρωση Προϊόντος' : 'Προσθήκη Προϊόντος'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-modal-in {
          animation: modal-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ProductModal;