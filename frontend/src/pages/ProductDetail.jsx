import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, checkStock } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { Check } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = getProductById(id);
  const { addToCart } = useCart();
  const { user, hasFirstOrderDiscount } = useAuth();
  const { toast } = useToast();

  const [selectedColor, setSelectedColor] = useState(product?.colors[0]?.name || null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <p>Product not found</p>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedColor) {
      toast({
        title: "Select a color",
        description: "Please choose a color before adding to cart.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedSize) {
      toast({
        title: "Select a size",
        description: "Please choose a size before adding to cart.",
        variant: "destructive"
      });
      return;
    }

    const stock = checkStock(product.id, selectedColor, selectedSize);
    if (stock < quantity) {
      toast({
        title: "Low stock",
        description: `Only ${stock} available in ${selectedSize}`,
        variant: "destructive"
      });
      return;
    }

    addToCart(product, selectedColor, selectedSize, quantity);
    toast({
      title: "Added to cart",
      description: `${product.name} (${selectedColor}, ${selectedSize}) added to cart.`
    });
  };

  const currentImage = product.images[selectedColor?.toLowerCase()]?.[0] || product.images.white?.[0];
  const colorData = product.colors.find(c => c.name === selectedColor);

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-detail-grid">
          {/* Product Image */}
          <div className="product-detail-image-section">
            {currentImage ? (
              <img 
                src={currentImage} 
                alt={product.name}
                className="product-detail-image"
              />
            ) : (
              <div className="product-detail-placeholder">
                <span>Image coming soon</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-detail-info-section">
            <div className="product-detail-header">
              <h1 className="product-detail-title">{product.name}</h1>
              <p className="product-detail-price">${product.price}</p>
            </div>

            <p className="product-detail-description">{product.longDescription}</p>

            {/* Color Selection */}
            {product.colors.length > 0 && (
              <div className="product-detail-section">
                <label className="product-detail-label">
                  Color: {selectedColor && <span className="selected-value">{selectedColor}</span>}
                </label>
                <div className="color-selector">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      className={`color-option ${selectedColor === color.name ? 'selected' : ''}`}
                      onClick={() => setSelectedColor(color.name)}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor === color.name && (
                        <Check size={16} className="color-check" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div className="product-detail-section">
              <label className="product-detail-label">
                Size: {selectedSize && <span className="selected-value">{selectedSize}</span>}
              </label>
              <div className="size-selector">
                {product.sizes.map((size) => {
                  const stock = colorData ? colorData.stock[size] : 0;
                  const isLowStock = stock > 0 && stock < 5;
                  const isOutOfStock = stock === 0;

                  return (
                    <button
                      key={size}
                      className={`size-option ${selectedSize === size ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                      onClick={() => !isOutOfStock && setSelectedSize(size)}
                      disabled={isOutOfStock}
                    >
                      <span className="size-label">{size}</span>
                      {isLowStock && !isOutOfStock && (
                        <span className="stock-indicator">Low stock</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* First Order Discount Notice */}
            {user && hasFirstOrderDiscount() && (
              <div className="discount-notice">
                <p>First order discount: 10% off will be applied at checkout</p>
              </div>
            )}

            {/* Add to Cart */}
            <div className="product-detail-actions">
              <Button 
                className="btn-primary btn-large"
                onClick={handleAddToCart}
              >
                Add to Cart
              </Button>
            </div>

            {/* Product Details */}
            <div className="product-details-list">
              <h3 className="details-heading">Details</h3>
              <ul>
                <li>Technical fabric designed for training</li>
                <li>Minimal branding</li>
                <li>Built for movement</li>
                <li>Worldwide shipping available</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;