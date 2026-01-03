import React from 'react';
import { RotateCcw, Truck, Clock, Mail } from 'lucide-react';

const Returns = () => {
  return (
    <div className="info-page">
      <div className="info-container">
        <div className="info-header">
          <RotateCcw className="info-icon" size={32} />
          <h1 className="info-title">Returns & Shipping</h1>
          <p className="info-subtitle">Our policies made simple</p>
        </div>

        <div className="info-content">
          {/* Shipping Section */}
          <section className="info-section">
            <h2><Truck size={24} className="section-icon" /> Shipping</h2>
            
            <div className="policy-grid">
              <div className="policy-card">
                <h3>Domestic (US)</h3>
                <ul>
                  <li>Standard Shipping: 5-7 business days</li>
                  <li>Flat rate: $5.99</li>
                  <li>Free shipping on orders over $100</li>
                </ul>
              </div>
              <div className="policy-card">
                <h3>International</h3>
                <ul>
                  <li>Delivery: 10-14 business days</li>
                  <li>Flat rate: $14.99</li>
                  <li>Free shipping on orders over $150</li>
                </ul>
              </div>
            </div>

            <div className="policy-note">
              <p><strong>Note:</strong> International orders may be subject to customs duties and taxes, which are the responsibility of the recipient. Delivery times may vary during peak seasons or due to customs processing.</p>
            </div>
          </section>

          {/* Returns Section */}
          <section className="info-section">
            <h2><RotateCcw size={24} className="section-icon" /> Returns</h2>
            
            <div className="policy-highlight">
              <Clock size={20} />
              <span>30-Day Return Window</span>
            </div>

            <h3>Return Conditions</h3>
            <ul className="policy-list">
              <li>Items must be unworn, unwashed, and in original condition</li>
              <li>All tags must be attached</li>
              <li>Items must be returned within 30 days of delivery</li>
              <li>Original packaging preferred but not required</li>
            </ul>

            <h3>Non-Returnable Items</h3>
            <ul className="policy-list">
              <li>Items marked as "Final Sale"</li>
              <li>Items that have been worn, washed, or altered</li>
              <li>Items without original tags</li>
            </ul>
          </section>

          {/* How to Return Section */}
          <section className="info-section">
            <h2>How to Return</h2>
            
            <div className="steps-list">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Contact Us</h3>
                  <p>Email <a href="mailto:support@razetraining.com">support@razetraining.com</a> with your order number and reason for return.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Get Your Label</h3>
                  <p>We'll send you a prepaid return shipping label within 24 hours.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Ship It Back</h3>
                  <p>Pack your item securely and drop it off at any carrier location.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Get Refunded</h3>
                  <p>Refunds are processed within 5-7 business days of receiving your return.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Exchanges Section */}
          <section className="info-section">
            <h2>Exchanges</h2>
            <p>
              Need a different size? We're happy to exchange your item. Email us at <a href="mailto:support@razetraining.com">support@razetraining.com</a> with your order number and the size you need. We'll ship your new item as soon as we receive the original.
            </p>
            <p>
              <strong>Note:</strong> Exchanges are subject to availability. If your desired size is out of stock, we'll issue a full refund.
            </p>
          </section>

          {/* Defective Items */}
          <section className="info-section">
            <h2>Defective Items</h2>
            <p>
              Quality is our priority. If you receive a defective item, contact us immediately at <a href="mailto:support@razetraining.com">support@razetraining.com</a> with photos of the defect. We'll replace your item at no additional cost.
            </p>
          </section>

          {/* Contact */}
          <section className="info-section">
            <div className="info-tip">
              <Mail size={20} />
              <div>
                <h3>Questions?</h3>
                <p>Our support team is here to help. Email us at <a href="mailto:support@razetraining.com">support@razetraining.com</a> and we'll respond within 24 hours.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Returns;
