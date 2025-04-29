import React, { useState, useEffect } from 'react';
import { Package, X, Plus, Minus, AlertTriangle, TrendingUp, TrendingDown, Check } from 'lucide-react';
import { Product } from '@/types/warehouse';

interface StockManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateStock: (productId: number, newStock: number) => Promise<void>;
  product: Product | null;
}

type StockOperation = 'add' | 'subtract' | 'set';

const StockManagementModal: React.FC<StockManagementModalProps> = ({
  isOpen,
  onClose,
  onUpdateStock,
  product
}) => {
  const [operation, setOperation] = useState<StockOperation>('add');
  const [quantity, setQuantity] = useState<number>(1);
  const [newStockLevel, setNewStockLevel] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (product) {
      setNewStockLevel(calculateNewStock());
    }
  }, [operation, quantity, product]);

  const calculateNewStock = (): number => {
    if (!product) return 0;
    
    switch (operation) {
      case 'add':
        return product.stock + quantity;
      case 'subtract':
        return Math.max(0, product.stock - quantity);
      case 'set':
        return Math.max(0, quantity);
      default:
        return product.stock;
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setQuantity(value);
    } else {
      setQuantity(0);
    }
  };

  const handleOperationChange = (op: StockOperation) => {
    setOperation(op);
    // Reset quantity to 1 when changing operation type
    if (op === 'set') {
      setQuantity(product?.stock || 0);
    } else {
      setQuantity(1);
    }
  };

  const handleSubmit = async () => {
    if (!product) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      await onUpdateStock(product.id, newStockLevel);
      
      setSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
      
    } catch (err) {
      setError('Αποτυχία ενημέρωσης αποθέματος. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900 bg-opacity-50 backdrop-blur-sm">
      <div className="relative w-full max-w-md animate-modal-in">
        <div className="relative bg-aspro rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 rounded-t bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Ενημέρωση Αποθέματος</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Product Details */}
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex-shrink-0">
                <div className="p-2 bg-blue-100 rounded-md">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{product.name}</h4>
                <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-medium text-gray-700">Τρέχον Απόθεμα:</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    product.stock === 0 
                      ? 'bg-red-100 text-red-800' 
                      : product.stock <= 5 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {product.stock} τεμάχια
                  </span>
                </div>
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
            
            {/* Success Message */}
            {success && (
              <div className="p-3 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
                <div className="flex items-center">
                  <Check className="h-5 w-5 mr-2" />
                  <p className="text-sm">Το απόθεμα ενημερώθηκε με επιτυχία!</p>
                </div>
              </div>
            )}
            
            {/* Operation Type */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Τύπος Λειτουργίας</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleOperationChange('add')}
                  className={`p-3 flex flex-col items-center justify-center rounded-lg border ${
                    operation === 'add'
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <TrendingUp className={`h-5 w-5 ${operation === 'add' ? 'text-green-500' : 'text-gray-500'}`} />
                  <span className="mt-1 text-sm">Προσθήκη Αποθέματος</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOperationChange('subtract')}
                  className={`p-3 flex flex-col items-center justify-center rounded-lg border ${
                    operation === 'subtract'
                      ? 'bg-red-50 border-red-500 text-red-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <TrendingDown className={`h-5 w-5 ${operation === 'subtract' ? 'text-red-500' : 'text-gray-500'}`} />
                  <span className="mt-1 text-sm">Αφαίρεση Αποθέματος</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOperationChange('set')}
                  className={`p-3 flex flex-col items-center justify-center rounded-lg border ${
                    operation === 'set'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Package className={`h-5 w-5 ${operation === 'set' ? 'text-blue-500' : 'text-gray-500'}`} />
                  <span className="mt-1 text-sm">Ορισμός Αποθέματος</span>
                </button>
              </div>
            </div>
            
            {/* Quantity Input */}
            <div>
              <label htmlFor="quantity" className="block mb-2 text-sm font-medium text-gray-700">
                {operation === 'set' ? 'Νέο Επίπεδο Αποθέματος' : 'Ποσότητα'}
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(0, quantity - 1))}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-l-lg border border-gray-300"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  id="quantity"
                  min="0"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="flex-1 border-y border-gray-300 py-2 px-3 text-center focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-r-lg border border-gray-300"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Stock Preview */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Προεπισκόπηση Νέου Επιπέδου Αποθέματος:</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">Τρέχον:</span>
                  <span className="font-medium">{product.stock}</span>
                </div>
                <div className="text-gray-500">→</div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">Νέο:</span>
                  <span className={`font-medium ${
                    newStockLevel > product.stock 
                      ? 'text-green-600' 
                      : newStockLevel < product.stock 
                      ? 'text-red-600' 
                      : 'text-gray-700'
                  }`}>
                    {newStockLevel}
                  </span>
                </div>
              </div>
              
              {/* Stock warning for low stock */}
              {newStockLevel <= 5 && newStockLevel > 0 && (
                <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Αυτό θα οδηγήσει σε χαμηλά επίπεδα αποθέματος.
                </div>
              )}
              
              {/* Stock warning for out of stock */}
              {newStockLevel === 0 && (
                <div className="mt-2 text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Αυτό θα σημάνει το προϊόν ως εκτός αποθέματος.
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end p-4 border-t border-gray-200 rounded-b">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 bg-aspro hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
            >
              Ακύρωση
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing || (operation !== 'set' && quantity === 0) || newStockLevel === product.stock}
              className={`ml-3 text-white rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center ${
                isProcessing || (operation !== 'set' && quantity === 0) || newStockLevel === product.stock
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300'
              }`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ενημέρωση...
                </>
              ) : (
                'Ενημέρωση Αποθέματος'
              )}
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-modal-in {
          animation: modal-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default StockManagementModal;