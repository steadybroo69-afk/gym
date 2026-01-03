import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Check, Loader2, Mail, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const WaitlistModal = ({ isOpen, onClose, product }) => {
  const [email, setEmail] = useState('');
  const [selectedSize, setSelectedSize] = useState('M');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [spotsRemaining, setSpotsRemaining] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchSpotsRemaining();
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchSpotsRemaining = async () => {
    try {
      const response = await fetch(`${API_URL}/api/waitlist/status`);
      const data = await response.json();
      setSpotsRemaining(data.spots_remaining);
    } catch (err) {
      console.error('Failed to fetch spots:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/waitlist/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          product_id: product.id,
          product_name: product.name,
          variant: product.variant,
          size: selectedSize
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setResult(data);
      } else {
        setError(data.message || 'Failed to join waitlist');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const sizes = product?.sizes || ['XS', 'S', 'M', 'L'];

  return ReactDOM.createPortal(
    <div className="waitlist-modal-overlay" onClick={onClose}>
      <div className="waitlist-modal" onClick={(e) => e.stopPropagation()}>
        <button className="waitlist-modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        {!success ? (
          <>
            <div className="waitlist-modal-header">
              <div className="waitlist-badge">🔥 LIMITED DROP</div>
              <h2>Join the Waitlist</h2>
              <p>First drop SOLD OUT. Secure your spot for Feb 2.</p>
              {spotsRemaining !== null && (
                <div className="spots-remaining">
                  <Lock size={14} />
                  Only <strong>{spotsRemaining}</strong> spots left
                </div>
              )}
            </div>

            <div className="waitlist-product-preview">
              <img src={product?.image} alt={product?.name} />
              <div className="preview-info">
                <span className="preview-name">{product?.name}</span>
                <span className="preview-variant">{product?.variant}</span>
                <span className="preview-price">${product?.price}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="waitlist-form">
              <div className="waitlist-size-section">
                <label>Select Size</label>
                <div className="waitlist-sizes">
                  {sizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      className={`waitlist-size-btn ${selectedSize === size ? 'active' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="waitlist-email-section">
                <label>Email Address</label>
                <div className="email-input-wrapper">
                  <Mail size={18} className="email-icon" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <div className="waitlist-error">{error}</div>}

              <Button 
                type="submit" 
                className="waitlist-submit-btn"
                disabled={loading || !email}
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Joining...</>
                ) : (
                  <><Lock size={18} /> Secure My Spot</>
                )}
              </Button>

              <p className="waitlist-note">
                No payment required. We'll email you when your size drops.
              </p>
            </form>
          </>
        ) : (
          <div className="waitlist-success">
            <div className="success-icon">
              <Check size={48} />
            </div>
            <h2>You're In! 🎉</h2>
            <p>You're <strong>#{result?.position}</strong> on the waitlist.</p>
            
            {result?.access_code && (
              <div className="access-code-box">
                <span className="access-label">Your Access Code</span>
                <span className="access-code">{result.access_code}</span>
                <span className="access-note">Save this code for early access checkout</span>
              </div>
            )}

            <div className="success-details">
              <p><strong>{product?.name}</strong></p>
              <p>{product?.variant} • Size {selectedSize}</p>
            </div>

            <Button onClick={onClose} className="waitlist-done-btn">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default WaitlistModal;
