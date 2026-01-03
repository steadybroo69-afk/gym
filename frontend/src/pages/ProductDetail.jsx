import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, checkStock } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { ArrowLeft, Heart, Share2, Truck, RotateCcw, Shield } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = getProductById(id);
  const { addToCart } = useCart();
  const { user, hasFirstOrderDiscount } = useAuth();
  const { toast } = useToast();

  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="not-found-message">
            <h2>Product not found</h2>
            <Button onClick={() => navigate('/products')} className="btn-secondary">
              <ArrowLeft size={16} /> Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({
        title: "Select a size",
        description: "Please choose a size before adding to cart.",
        variant: "destructive"
      });
      return;
    }

    const stock = product.stock[selectedSize] || 0;
    if (stock < quantity) {
      toast({
        title: "Low stock",
        description: stock === 0 ? "This size is out of stock" : `Only ${stock} available in ${selectedSize}`,
        variant: "destructive"
      });
      return;
    }

    addToCart(product, product.color, selectedSize, quantity);
    toast({
      title: "Added to cart",
      description: `${product.name} (${product.variant}, ${selectedSize}) added to cart.`
    });
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      toast({
        title: "Select a size",
        description: "Please choose a size before proceeding.",
        variant: "destructive"
      });
      return;
    }
    addToCart(product, product.color, selectedSize, quantity);
    navigate('/checkout');
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: `${product.name} ${isWishlisted ? 'removed from' : 'added to'} your wishlist.`
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: url
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Product link copied to clipboard."
      });
    }
  };

  const currentImage = product.images[currentImageIndex] || product.images[0];

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <button onClick={() => navigate('/products')} className="breadcrumb-link">
            <ArrowLeft size={16} /> Back to Products
          </button>
        </div>

        <div className="product-detail-grid">
          {/* Product Images */}
          <div className="product-detail-image-section">
            <div className="main-image-wrapper">
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
            
            {/* Thumbnail gallery */}
            {product.images.length > 1 && (
              <div className="thumbnail-gallery">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`thumbnail-btn ${currentImageIndex === idx ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(idx)}
                  >
                    <img src={img} alt={`${product.name} view ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-detail-info-section">
            <div className="product-detail-header">
              <div className="header-top">
                <span className="product-category">{product.category?.toUpperCase()}</span>
                <div className="action-buttons">
                  <button 
                    className={`action-btn ${isWishlisted ? 'wishlisted' : ''}`}
                    onClick={toggleWishlist}
                    aria-label="Add to wishlist"
                  >
                    <Heart size={20} fill={isWishlisted ? '#00d9ff' : 'none'} />
                  </button>
                  <button className="action-btn" onClick={handleShare} aria-label="Share product">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
              <h1 className="product-detail-title">{product.name}</h1>
              <p className="product-variant">{product.variant}</p>
              <p className="product-detail-price">${product.price}</p>
            </div>

            <p className="product-detail-description">{product.description}</p>

            {/* Color Display */}
            <div className="product-detail-section">
              <label className="product-detail-label">
                Color: <span className="selected-value">{product.variant}</span>
              </label>
              <div className="color-display">
                <div 
                  className="color-swatch selected"
                  style={{ 
                    background: product.color === 'Black' ? '#1a1a1a' : '#666'
                  }}
                  title={product.color}
                />
              </div>
            </div>

            {/* Size Selection */}
            <div className="product-detail-section">
              <div className="size-header">
                <label className="product-detail-label">
                  Size: {selectedSize && <span className="selected-value">{selectedSize}</span>}
                </label>
                <button 
                  className="size-guide-link"
                  onClick={() => navigate('/size-guide')}
                >
                  Size Guide
                </button>
              </div>
              <div className="size-selector">
                {product.sizes.map((size) => {
                  const stock = product.stock[size] || 0;
                  const isLowStock = stock > 0 && stock < 5;
                  const isOutOfStock = stock === 0;

                  return (
                    <button
                      key={size}
                      className={`size-option ${selectedSize === size ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                      onClick={() => !isOutOfStock && setSelectedSize(size)}
                      disabled={isOutOfStock}
                      data-testid={`size-${size}`}
                    >
                      <span className="size-label">{size}</span>
                      {isLowStock && !isOutOfStock && (
                        <span className="stock-indicator">Low</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* First Order Discount Notice */}
            {user && hasFirstOrderDiscount && hasFirstOrderDiscount() && (
              <div className="discount-notice">
                <p>🎉 First order discount: 10% off will be applied at checkout</p>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="product-detail-actions">
              <div className="quantity-selector">
                <button 
                  className="qty-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="qty-value">{quantity}</span>
                <button 
                  className="qty-btn"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
              <Button 
                className="btn-primary btn-add-cart"
                onClick={handleAddToCart}
                data-testid="add-to-cart-btn"
              >
                Add to Cart — ${(product.price * quantity).toFixed(2)}
              </Button>
            </div>

            <Button 
              className="btn-secondary btn-buy-now"
              onClick={handleBuyNow}
              data-testid="buy-now-btn"
            >
              Buy Now
            </Button>

            {/* Benefits */}
            <div className="product-benefits">
              <div className="benefit-item">
                <Truck size={18} />
                <span>Free shipping over $75</span>
              </div>
              <div className="benefit-item">
                <RotateCcw size={18} />
                <span>30-day returns</span>
              </div>
              <div className="benefit-item">
                <Shield size={18} />
                <span>Secure checkout</span>
              </div>
            </div>

            {/* Product Details */}
            <div className="product-details-list">
              <h3 className="details-heading">Details</h3>
              <ul>
                <li>Technical fabric designed for training</li>
                <li>Minimal RAZE branding with {product.logo} logo</li>
                <li>Built for movement and flexibility</li>
                <li>Machine washable</li>
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
