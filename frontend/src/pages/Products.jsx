import React from 'react';
import { products } from '../data/products';
import ProductCard from '../components/ProductCard';

const Products = () => {
  return (
    <div className="products-page">
      <div className="container">
        <div className="products-header">
          <h1 className="products-title">The Collection</h1>
          <p className="products-subtitle">Performance pieces built for discipline</p>
        </div>

        <div className="products-grid-page">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;