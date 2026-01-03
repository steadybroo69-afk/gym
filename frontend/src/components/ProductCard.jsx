import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (product.status === 'active') {
      navigate(`/products/${product.id}`);
    }
  };

  const getStockStatus = () => {
    if (product.status === 'coming-soon') return 'Coming Soon';
    if (product.status === 'sold-out') return 'Sold Out';
    return null;
  };

  const stockStatus = getStockStatus();

  return (
    <div 
      className={`product-card-shop ${product.status === 'active' ? 'clickable' : ''}`}
      onClick={handleClick}
    >
      <div className="product-image-wrapper-shop">
        {product.images.white?.[0] ? (
          <img 
            src={product.images.white[0]} 
            alt={product.name}
            className="product-image-shop"
          />
        ) : (
          <div className="product-placeholder-shop">
            <span className="placeholder-text-shop">{stockStatus || product.name}</span>
          </div>
        )}
        {stockStatus && (
          <Badge className="product-badge-shop">{stockStatus}</Badge>
        )}
      </div>
      
      <div className="product-info-shop">
        <h3 className="product-name-shop">{product.name}</h3>
        <p className="product-description-shop">{product.description}</p>
        
        {product.colors.length > 0 && (
          <div className="color-swatches-shop">
            <span className="color-label-shop">{product.colors.length} colors</span>
            <div className="swatches-shop">
              {product.colors.slice(0, 5).map((color, index) => (
                <div 
                  key={index}
                  className="color-swatch-shop"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                ></div>
              ))}
            </div>
          </div>
        )}
        
        <div className="product-footer-shop">
          {product.status === 'active' ? (
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