// ProductCard 
import { useState } from 'react';
import { Package, Hash, Code, Link2, Eye, CheckCircle, XCircle, DollarSign, ImageIcon, X, Trash2 } from 'lucide-react';

const ImagePreviewPopup = ({ imageUrl, productName, showPopup, setShowPopup }) => {
  if (!showPopup) return null;

  const handleClose = () => {
    setShowPopup(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors z-10"
        >
          <X size={24} className="text-gray-700" />
        </button>

        {/* Image */}
        <div className="p-6">
          <img
            src={imageUrl}
            alt={productName}
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
        </div>

        {/* Image Name */}
        <div className="px-6 pb-6">
          <p className="text-center text-sm font-medium text-gray-700">{productName}</p>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ collectionItem, isEditing, removingIds, setRemovingIds, isReordering = null }) => {
  const [showImagePreview, setShowImagePreview] = useState(false);

  const isMarkedForRemoval = removingIds?.includes(collectionItem.id);

  const productName = collectionItem?.product?.name || collectionItem?.name;
  const productCode = collectionItem?.product?.code || collectionItem?.code;
  const productImage = collectionItem?.media || collectionItem?.sku_master_media;
  const productActive = collectionItem?.active !== undefined ? collectionItem?.active : true;
  const productSequence = collectionItem?.sequence;
  const skuData = collectionItem?.sku_master || collectionItem;

  const handleRemove = () => {
    if (isMarkedForRemoval) {
      // Undo - remove from removing list
      setRemovingIds(prevIds => prevIds.filter(id => id !== collectionItem.id));
    } else {
      // Mark for removal - add to removing list
      setRemovingIds(prevIds => [...prevIds, collectionItem.id]);
    }
  };

  const handleImageClick = () => {
    if (productImage) {
      setShowImagePreview(true);
    }
  };

  return (
    <>
      <div
        className={`group relative bg-white rounded-xl border p-3 transition-all duration-300 ${isMarkedForRemoval
          ? 'border-gray-300 bg-gray-100 opacity-50'
          : 'border-gray-200 hover:shadow-md hover:border-blue-200'
          }`}
      >
        {/* Horizontal Layout */}
        <div className="flex gap-3">
          {/* Image Section - Left Side */}
          <div
            className={`shrink-0 ${productImage ? 'cursor-pointer' : ''}`}
            onClick={handleImageClick}
          >
            {productImage ? (
              <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden group/image">
                <img
                  src={productImage}
                  alt={productName}
                  className={`w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-110 ${isMarkedForRemoval ? 'grayscale' : ''
                    }`}
                />
                <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center">
                  <Eye size={16} className="text-white opacity-0 group-hover/image:opacity-100 transition-opacity" />
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                <ImageIcon size={20} className="text-gray-400 mb-0.5" />
                <p className="text-xs font-medium text-gray-500">No Media</p>
              </div>
            )}
          </div>

          {/* Content Section - Middle */}
          <div className="flex-1 min-w-0">
            {/* Product Name */}
            <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">
              {productName}
            </h3>

            {/* Product Code & Status - Same Row */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <Code size={10} className="text-gray-400" />
                <p className="text-xs text-gray-600 font-mono">
                  {productCode}
                </p>
              </div>

              {/* Status Badge */}
              <span
                className={`flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${productActive
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
                  }`}
              >
                {productActive ? (
                  <>
                    <CheckCircle size={9} />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle size={9} />
                    Inactive
                  </>
                )}
              </span>
              {productSequence !== undefined && isReordering && (
                <div className='flex items-center justify-center w-5 h-5 bg-yellow-600 text-white text-[10px] font-semibold rounded-full'>
                  {productSequence}
                </div>
              )}
            </div>

            {/* Pricing */}
            {skuData && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-green-600 font-medium">MRP:</span>
                  <span className="text-sm font-bold text-green-700">
                    ₹{parseFloat(skuData.mrp)}
                  </span>
                </div>
                <div className="w-px h-3 bg-gray-300"></div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-blue-600 font-medium">Selling:</span>
                  <span className="text-sm font-bold text-blue-700">
                    ₹{parseFloat(skuData.selling_price)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Section - Remove Icon (appears on hover when editing) */}
          {isEditing && (
            <div className="flex items-start shrink-0">
              <button
                onClick={handleRemove}
                className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${isMarkedForRemoval
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 opacity-100'
                  : 'bg-red-100 text-red-600 hover:bg-red-200 opacity-0 group-hover:opacity-100'
                  }`}
                title={isMarkedForRemoval ? 'Undo removal' : 'Mark for removal'}
              >
                {isMarkedForRemoval ? (
                  <Package size={16} />
                ) : (
                  <X size={16} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Popup */}
      <ImagePreviewPopup
        imageUrl={productImage}
        productName={productName}
        showPopup={showImagePreview}
        setShowPopup={setShowImagePreview}
      />
    </>
  );
};

export default ProductCard;