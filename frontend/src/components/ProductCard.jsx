import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/products/${product.id}`);
  };

  const getStockStatus = () => {
    if (!product.inStock) return 'Sold Out';
    // Check if all sizes are out of stock
    if (product.stock) {
      const totalStock = Object.values(product.stock).reduce((a, b) => a + b, 0);
      if (totalStock === 0) return 'Sold Out';
    }
    return null;
  };

  const stockStatus = getStockStatus();

  return (
    <div 
      className={`product-card-shop ${product.inStock ? 'clickable' : ''}`}
      onClick={handleClick}
      data-testid={`product-card-${product.id}`}
    >
      <div className="product-image-wrapper-shop">
        {product.images && product.images.length > 0 ? (
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="product-image-shop"
          />
        ) : (
          <div className="product-placeholder-shop">
            <span className="placeholder-text-shop">{stockStatus || product.name}</span>
          </div>
        )}
        {product.mostPopular && (
          <Badge className="product-badge-shop popular">Most Popular</Badge>
        )}
        {stockStatus && (
          <Badge className="product-badge-shop soldout">{stockStatus}</Badge>
        )}
      </div>
      
      <div className="product-info-shop">
        <h3 className="product-name-shop">{product.name}</h3>
        <p className="product-variant-shop">{product.variant}</p>
        <p className="product-description-shop">{product.description}</p>
        
        <div className="product-footer-shop">
          {product.inStock ? (
            <>
              <span className="product-price-shop">${product.price}</span>
              <span className="shop-link">Shop →</span>
            </>
          ) : (
            <span className="product-status-shop">{stockStatus}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
