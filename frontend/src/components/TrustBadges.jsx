import React from 'react';
import { Shield, Truck, RefreshCw, Lock } from 'lucide-react';

const TrustBadges = () => {
  return (
    <div className="trust-badges">
      <div className="trust-badge">
        <Shield size={24} />
        <div>
          <span className="trust-title">Secure Checkout</span>
          <span className="trust-subtitle">SSL Encrypted</span>
        </div>
      </div>
      <div className="trust-badge">
        <Truck size={24} />
        <div>
          <span className="trust-title">Free Shipping</span>
          <span className="trust-subtitle">Orders $100+</span>
        </div>
      </div>
      <div className="trust-badge">
        <RefreshCw size={24} />
        <div>
          <span className="trust-title">Easy Returns</span>
          <span className="trust-subtitle">30 Days</span>
        </div>
      </div>
      <div className="trust-badge">
        <Lock size={24} />
        <div>
          <span className="trust-title">100% Secure</span>
          <span className="trust-subtitle">Payment Protected</span>
        </div>
      </div>
    </div>
  );
};

export const PaymentMethods = () => {
  return (
    <div className="payment-methods">
      <span className="payment-label">We Accept:</span>
      <div className="payment-icons">
        <div className="payment-icon">💳 VISA</div>
        <div className="payment-icon">💳 MC</div>
        <div className="payment-icon">💳 AMEX</div>
        <div className="payment-icon">💳 DISCOVER</div>
        <div className="payment-icon">🅿️ PayPal</div>
        <div className="payment-icon">🍎 Pay</div>
        <div className="payment-icon">🔵 Venmo</div>
      </div>
    </div>
  );
};

export default TrustBadges;
