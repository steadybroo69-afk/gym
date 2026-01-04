import React from 'react';
import { Truck, Shield, Award, CheckCircle } from 'lucide-react';

const TrustBar = () => {
  return (
    <div className="trust-bar">
      <div className="trust-bar-content">
        <div className="trust-item">
          <Truck size={20} />
          <span>Free Shipping $100+ USD</span>
        </div>
        <div className="trust-item">
          <CheckCircle size={20} />
          <span>100% Satisfaction Guarantee</span>
        </div>
        <div className="trust-item">
          <Shield size={20} />
          <span>Secure Checkout</span>
        </div>
        <div className="trust-item">
          <Award size={20} />
          <span>Premium Quality</span>
        </div>
      </div>
    </div>
  );
};

export default TrustBar;
