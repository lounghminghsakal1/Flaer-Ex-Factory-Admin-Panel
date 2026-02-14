import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Package, GripVertical,Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import ProductCard from './ProductCard';

const SortableProductCard = ({ product, isReordering, removingIds, setRemovingIds, isDraggingAny }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id, disabled: !isReordering });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isReordering && !isDraggingAny ? 'jiggle' : ''}`}
    >
      {/* Drag Handle - 6 Dots Icon */}
      {isReordering && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-5 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10"
        >
          <GripVertical size={24} className="text-gray-400 hover:text-gray-600" />
        </div>
      )}

      <ProductCard
        collectionItem={product}
        isEditing={!isReordering}
        removingIds={removingIds}
        setRemovingIds={setRemovingIds}
        isReordering={isReordering}
      />
    </div>
  );
};

const ProductsGrid = ({ products, setProducts, collectionId = null, setCollectionData = null, setIsRightModalOpen = null }) => {
  const [isReordering, setIsReordering] = useState(false);
  const [removingIds, setRemovingIds] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isUpdatingSequence, setIsUpdatingSequence] = useState(false);
  const [isRemovingItems, setIsRemovingItems] = useState(false);
  const [tempProducts, setTempProducts] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Display products based on collectionId presence
  const displayProducts = collectionId && isReordering ? tempProducts : products;

  const handleUpdateSequence = () => {
    if (!isReordering) {
      // Enable reordering mode
      if (collectionId) {
        // Create deep copy when collectionId is present
        setTempProducts(JSON.parse(JSON.stringify(products)));
      }
      setIsReordering(true);
    } else {
      // Local mode: just toggle off
      setIsReordering(false);
    }
  };

  const handleUpdateSequenceToBackend = async () => {
    if (!isReordering) {
      // Enable reordering mode and create deep copy
      setTempProducts(JSON.parse(JSON.stringify(products)));
      setIsReordering(true);
      return;
    }

    // Save sequence to backend
    setIsUpdatingSequence(true);
    try {
      const payload = {
        collection_items: {
          items: tempProducts.map((product, index) => ({
            product_id: product.product?.id || product.id,
            sequence: index + 1,
            active: product.active !== undefined ? product.active : true
          }))
        }
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections/${collectionId}/update_sequence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) throw new Error("Failed to update sequence");

      const result = await response.json();

      // Replace old products with updated temp products
      setProducts(tempProducts);
      setTempProducts([]);
      setIsReordering(false);
      refreshProductsList();
      toast.success("Sequence updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update sequence");
    } finally {
      setIsUpdatingSequence(false);
    }
  };

  async function refreshProductsList() {
    try {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections/${collectionId}`;
      const response = await fetch(url);
      const result = await response.json();
      setCollectionData(result.data);
    } catch (err) {
      console.log(err);
    }
  }

  const handleRemoveMarked = () => {
    if (removingIds.length === 0) return;

    // Remove the marked products
    const updatedProducts = products.filter(product => !removingIds.includes(product.id));

    // Update sequences for remaining products
    const resequencedProducts = updatedProducts.map((product, index) => ({
      ...product,
      sequence: index + 1
    }));

    setProducts(resequencedProducts);
    setRemovingIds([]);
  };

  const handleRemoveToBackend = async () => {
    if (removingIds.length === 0) return;

    setIsRemovingItems(true);
    try {
      // First, remove from temp/display products
      const updatedProducts = (collectionId ? displayProducts : products).filter(
        product => !removingIds.includes(product.id)
      );

      // Update sequences for remaining products
      const resequencedProducts = updatedProducts.map((product, index) => ({
        ...product,
        sequence: index + 1
      }));

      const payload = {
        item_ids: removingIds
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections/${collectionId}/remove_collection_item_mapping`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) throw new Error("Failed to remove items");

      const result = await response.json();

      // Update the actual products state
      setProducts(resequencedProducts);

      // If in reordering mode, also update temp products
      if (isReordering) {
        setTempProducts(resequencedProducts);
      }

      setRemovingIds([]);
      refreshProductsList();
      toast.success("Items removed successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove items");
    } finally {
      setIsRemovingItems(false);
    }
  };

  async function refreshProductsList() {
    try {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections/${collectionId}`;
      const response = await fetch(url);
      const result = await response.json();
      setCollectionData(result.data);
    } catch (err) {
      console.log(err);
    }
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    // Work with appropriate products array
    const workingProducts = collectionId && isReordering ? tempProducts : products;

    const oldIndex = workingProducts.findIndex((item) => item.id === active.id);
    const newIndex = workingProducts.findIndex((item) => item.id === over.id);

    const reorderedProducts = arrayMove(workingProducts, oldIndex, newIndex);

    // Update sequences after reordering
    const resequencedProducts = reorderedProducts.map((product, index) => ({
      ...product,
      sequence: index + 1
    }));

    // Update appropriate state
    if (collectionId && isReordering) {
      setTempProducts(resequencedProducts);
    } else {
      setProducts(resequencedProducts);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeProduct = activeId ? displayProducts.find(p => p.id === activeId) : null;

  return (
    <div className="w-full">
      {/* Title Row */}
      <div className="flex items-center justify-between my-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-600">{displayProducts.length} products</p>
        </div>

        {displayProducts.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={collectionId ? handleUpdateSequenceToBackend : handleUpdateSequence}
              disabled={isUpdatingSequence}
              className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${isReordering
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                } ${isUpdatingSequence ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUpdatingSequence ? 'Saving...' : isReordering ? 'Save Sequence' : 'Update Sequence'}
            </button>
            {isReordering && (
              <button className='px-3 py-2 rounded-lg font-medium bg-red-600 text-gray-200 hover:bg-red-500 cursor-pointer ' onClick={() => setIsReordering(false)}>
                cancel
              </button>
            )}
            <button
              onClick={collectionId ? handleRemoveToBackend : handleRemoveMarked}
              disabled={removingIds.length === 0 || isRemovingItems}
              className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${removingIds.length > 0
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                } ${isRemovingItems ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isRemovingItems ? 'Removing...' : `Remove ${removingIds.length > 0 ? `(${removingIds.length})` : ''}`}
            </button>
          </div>
        )}
        <button className="px-3 py-2 flex justify-center items-center border border-dashed rounded-lg gap-2 text-blue-800 cursor-pointer hover:bg-blue-800 hover:text-gray-100 transition-colors duration-200 ease-in-out" onClick={() => setIsRightModalOpen(true)}>
          <Plus size={16} />
          <h2>Add Products to Collection</h2>
        </button>
      </div>

      {/* Products Grid */}
      {displayProducts.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={displayProducts.map(p => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className={`grid grid-cols-3 gap-6 ${isReordering ? 'pl-10' : ''}`}>
              {displayProducts.map((product) => (
                <SortableProductCard
                  key={product.id}
                  product={product}
                  isReordering={isReordering}
                  removingIds={removingIds}
                  setRemovingIds={setRemovingIds}
                  isDraggingAny={activeId !== null}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeProduct ? (
              <div className="opacity-80 rotate-3 shadow-2xl">
                <ProductCard
                  collectionItem={activeProduct}
                  isEditing={false}
                  removingIds={[]}
                  setRemovingIds={() => { }}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <div className="w-20 h-20 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Package size={40} className="text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-600">No Products Added</p>
          <p className="text-sm text-gray-500 mt-1">Click "Add Products" to get started</p>
        </div>
      )}

      <style jsx>{`
        @keyframes jiggle {
          0%, 100% { 
            transform: rotate(0deg); 
          }
          25% { 
            transform: rotate(-0.5deg); 
          }
          75% { 
            transform: rotate(0.5deg); 
          }
        }

        .jiggle {
          animation: jiggle 0.3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ProductsGrid;