import React, { useState, useEffect } from 'react';
import { shirts, mensShorts, womensShorts } from '../data/mock';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ShoppingBag, Clock, Star, Flame, Heart, Lock } from 'lucide-react';
import UpsellModal from './UpsellModal';
import ProductModal from './ProductModal';
import WaitlistModal from './WaitlistModal';
import SanitizedImage from './SanitizedImage';
import { initializeStockCounts } from '../utils/stockUrgency';

// Products that should show "Only X left" urgency badge
const URGENCY_PRODUCT_IDS = [1, 3, 5]; // Black/Cyan shirt, Grey/Cyan shirt, Black/Cyan shorts

// WAITLIST MODE - Set to true to enable waitlist instead of cart
const WAITLIST_MODE = true;

const ProductCategories = () => {
  const [selectedSizes, setSelectedSizes] = useState({});
  const [addedToCart, setAddedToCart] = useState({});
  const [upsellModal, setUpsellModal] = useState({ isOpen: false, product: null });
  const [productModal, setProductModal] = useState({ isOpen: false, product: null });
  const [waitlistModal, setWaitlistModal] = useState({ isOpen: false, product: null });
  const [stockCounts, setStockCounts] = useState({});
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Initialize stock counts on mount (only for urgency products)
  useEffect(() => {
    const counts = initializeStockCounts(URGENCY_PRODUCT_IDS);
    setStockCounts(counts);
  }, []);

  // Check if product should show urgency badge
  const shouldShowUrgency = (productId) => URGENCY_PRODUCT_IDS.includes(productId);

  const handleSizeSelect = (productId, size) => {
    setSelectedSizes(prev => ({
      ...prev,
      [productId]: size
    }));
  };

  const handleProductClick = (product) => {
    setProductModal({ isOpen: true, product });
  };

  const handleWishlistToggle = (e, product) => {
    e.stopPropagation();
    toggleWishlist({
      id: product.id,
      name: product.name,
      variant: product.variant,
      price: product.price,
      image: product.image,
      category: product.category
    });
  };

  const handleJoinWaitlist = (product) => {
    setWaitlistModal({ isOpen: true, product: {
      ...product,
      sizes: product.sizes || ['XS', 'S', 'M', 'L', 'XL']
    }});
  };

  const handleAddToCart = (product, isShirt = true) => {
    // In waitlist mode, open waitlist modal instead
    if (WAITLIST_MODE) {
      handleJoinWaitlist(product);
      return;
    }
    
    const selectedSize = selectedSizes[product.id] || 'M';
    
    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      colors: [{ name: product.variant, hex: product.hex, image: product.image }]
    }, product.variant, selectedSize, 1);
    
    // Show feedback
    setAddedToCart(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedToCart(prev => ({ ...prev, [product.id]: false }));
    }, 1500);

    // Show upsell modal only for shirts
    if (isShirt) {
      setUpsellModal({ isOpen: true, product: product });
    }
  };

  const handleUpsellAddShorts = (shortsProduct) => {
    const selectedSize = selectedSizes[shortsProduct.id] || 'M';
    
    // Add shorts at full price - cart will apply bundle discount
    addToCart({
      id: shortsProduct.id,
      name: shortsProduct.name,
      category: shortsProduct.category,
      price: shortsProduct.price, // Full price $55, cart applies bundle discount
      colors: [{ name: shortsProduct.variant, hex: shortsProduct.hex, image: shortsProduct.image }]
    }, shortsProduct.variant, selectedSize, 1);
  };

  return (
    <section className="collection-section" id="collection">
      <div className="container">
        {/* Section Header */}
        <div className="collection-header">
          <h2 className="collection-title">THE COLLECTION</h2>
          <p className="collection-subtitle">Performance pieces built for discipline</p>
        </div>

        {/* Single focused bundle banner */}
        <div className="bundle-banner">
          <div className="bundle-banner-content">
            <span className="bundle-main">Complete the set — Performance Shirt + Shorts for <strong>$69</strong></span>
            <span className="bundle-subtext">Built to move together. Save $31.</span>
          </div>
        </div>

        {/* ROW 1: Performance T-Shirts */}
        <div className="product-row">
          <h3 className="row-title">Performance T-Shirts</h3>
          <div className="product-grid shirts-grid">
            {shirts.map((shirt, index) => {
              const selectedSize = selectedSizes[shirt.id] || 'M';
              const isAdded = addedToCart[shirt.id];
              const isMostPopular = index === 0; // Black/Cyan is first and most popular
              const isBlackShirt = shirt.color === 'Black';
              
              return (
                <div key={shirt.id} className={`product-card ${isMostPopular ? 'most-popular' : ''} ${isBlackShirt ? 'black-product' : ''}`}>
                  {/* Most Popular badge for Black/Cyan only */}
                  {isMostPopular && (
                    <div className="popular-badge">
                      <Star size={12} fill="currentColor" /> Most Popular
                    </div>
                  )}
                  
                  {/* Wishlist heart button */}
                  <button 
                    className={`wishlist-heart ${isInWishlist(shirt.id, shirt.variant) ? 'active' : ''}`}
                    onClick={(e) => handleWishlistToggle(e, shirt)}
                    title={isInWishlist(shirt.id, shirt.variant) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart size={18} fill={isInWishlist(shirt.id, shirt.variant) ? 'currentColor' : 'none'} />
                  </button>
                  
                  <div 
                    className="product-image-wrapper clickable"
                    onClick={() => handleProductClick(shirt)}
                  >
                    <SanitizedImage 
                      src={shirt.image} 
                      alt={`${shirt.name} - ${shirt.variant}`}
                      className="product-image"
                    />
                    <div className="view-details-hint">Click to view</div>
                  </div>
                  
                  <div className="product-info">
                    <div className="product-variant">{shirt.variant}</div>
                    <div className="product-price-row">
                      <span className="product-price">${shirt.price}</span>
                      {/* Stock urgency removed - sold out/waitlist only */}
                    </div>
                    
                    {/* Size Selector */}
                    <div className="size-selector">
                      {shirt.sizes.map((size) => (
                        <button
                          key={size}
                          className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                          onClick={() => handleSizeSelect(shirt.id, size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>

                    {/* Join Waitlist */}
                    <button 
                      className={`btn-add-to-cart ${isAdded ? 'added' : ''} waitlist-btn`}
                      onClick={() => handleAddToCart(shirt, true)}
                    >
                      <Lock size={16} /> Join Waitlist
                    </button>

                    {/* Bundle nudge */}
                    <p className="bundle-upsell">
                      Pair with matching shorts — <span className="bundle-link">Bundle for $69</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ROW 2: Performance Shorts */}
        <div className="product-row shorts-row">
          <h3 className="row-title">Performance Shorts</h3>
          <p className="row-subtitle">Designed for full-range movement — built to match Performance T-Shirts</p>
          
          <div className="product-grid shorts-grid">
            {shorts.map((short) => {
              const selectedSize = selectedSizes[short.id] || 'M';
              const isAdded = addedToCart[short.id];
              const isComingSoon = short.status === 'coming_soon';
              const isBlackShort = short.color === 'Black';
              
              return (
                <div key={short.id} className={`product-card ${isComingSoon ? 'coming-soon' : ''} ${isBlackShort ? 'black-product' : ''}`}>
                  {/* Wishlist heart button - only for available products */}
                  {!isComingSoon && (
                    <button 
                      className={`wishlist-heart ${isInWishlist(short.id, short.variant) ? 'active' : ''}`}
                      onClick={(e) => handleWishlistToggle(e, short)}
                      title={isInWishlist(short.id, short.variant) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart size={18} fill={isInWishlist(short.id, short.variant) ? 'currentColor' : 'none'} />
                    </button>
                  )}
                  
                  <div 
                    className={`product-image-wrapper ${!isComingSoon ? 'clickable' : ''}`}
                    onClick={() => !isComingSoon && handleProductClick(short)}
                  >
                    {short.image ? (
                      <SanitizedImage 
                        src={short.image} 
                        alt={`${short.name} - ${short.variant}`}
                        className="product-image"
                      />
                    ) : (
                      <div className="product-placeholder">
                        <div className="placeholder-content">
                          <Clock size={32} />
                          <span>Coming Soon</span>
                        </div>
                      </div>
                    )}
                    {!isComingSoon && <div className="view-details-hint">Click to view</div>}
                  </div>
                  
                  <div className="product-info">
                    <div className="product-variant">{short.variant}</div>
                    <div className="product-price-row">
                      <span className="product-price">${short.price}</span>
                      {/* Stock urgency removed - sold out/waitlist only */}
                    </div>
                    
                    {/* Size Selector */}
                    <div className="size-selector">
                      {short.sizes.map((size) => (
                        <button
                          key={size}
                          className={`size-btn ${selectedSize === size ? 'active' : ''} ${isComingSoon ? 'disabled' : ''}`}
                          onClick={() => !isComingSoon && handleSizeSelect(short.id, size)}
                          disabled={isComingSoon}
                        >
                          {size}
                        </button>
                      ))}
                    </div>

                    {/* Coming Soon / Join Waitlist */}
                    {isComingSoon ? (
                      <button className="btn-coming-soon" disabled>
                        <Clock size={16} /> Coming Soon
                      </button>
                    ) : (
                      <button 
                        className="btn-add-to-cart waitlist-btn"
                        onClick={() => handleAddToCart(short, false)}
                      >
                        <Lock size={16} /> Join Waitlist
                      </button>
                    )}

                    {/* Bundle nudge */}
                    <p className="bundle-upsell">
                      Complete the set — <span className="bundle-link">Bundle for $69</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upsell Modal */}
      <UpsellModal 
        isOpen={upsellModal.isOpen}
        onClose={() => setUpsellModal({ isOpen: false, product: null })}
        onAddShorts={handleUpsellAddShorts}
        addedProduct={upsellModal.product}
      />

      {/* Product Detail Modal */}
      <ProductModal
        isOpen={productModal.isOpen}
        onClose={() => setProductModal({ isOpen: false, product: null })}
        product={productModal.product}
      />

      {/* Waitlist Modal */}
      <WaitlistModal
        isOpen={waitlistModal.isOpen}
        onClose={() => setWaitlistModal({ isOpen: false, product: null })}
        product={waitlistModal.product}
      />
    </section>
  );
};

export default ProductCategories;
