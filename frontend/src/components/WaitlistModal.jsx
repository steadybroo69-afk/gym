import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Check, Loader2, Mail, Lock, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const WaitlistModal = ({ isOpen, onClose, product }) => {
  const [email, setEmail] = useState('');
  const [sizeSelections, setSizeSelections] = useState([{ size: 'M', quantity: 1 }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [spotsRemaining, setSpotsRemaining] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchSpotsRemaining();
      // Reset selections when modal opens
      setSizeSelections([{ size: 'M', quantity: 1 }]);
      setSuccess(false);
      setError('');
      setEmail('');
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

  const sizes = product?.sizes || ['XS', 'S', 'M', 'L', 'XL'];

  const addSizeSelection = () => {
    // Find a size that hasn't been selected yet, or default to first available
    const selectedSizes = sizeSelections.map(s => s.size);
    const availableSize = sizes.find(s => !selectedSizes.includes(s)) || sizes[0];
    setSizeSelections([...sizeSelections, { size: availableSize, quantity: 1 }]);
  };

  const removeSizeSelection = (index) => {
    if (sizeSelections.length > 1) {
      setSizeSelections(sizeSelections.filter((_, i) => i !== index));
    }
  };

  const updateSize = (index, newSize) => {
    const updated = [...sizeSelections];
    updated[index].size = newSize;
    setSizeSelections(updated);
  };

  const updateQuantity = (index, delta) => {
    const updated = [...sizeSelections];
    const newQty = updated[index].quantity + delta;
    if (newQty >= 1 && newQty <= 10) {
      updated[index].quantity = newQty;
      setSizeSelections(updated);
    }
  };

  const getTotalQuantity = () => {
    return sizeSelections.reduce((sum, s) => sum + s.quantity, 0);
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
          size: sizeSelections.map(s => `${s.size} x${s.quantity}`).join(', '),
          size_selections: sizeSelections
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
                <label>Select Size & Quantity</label>
                
                <div className="size-selections-list">
                  {sizeSelections.map((selection, index) => (
                    <div key={index} className="size-selection-row">
                      <div className="size-select-wrapper">
                        <select 
                          value={selection.size}
                          onChange={(e) => updateSize(index, e.target.value)}
                          className="size-select"
                        >
                          {sizes.map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="quantity-controls">
                        <button 
                          type="button" 
                          className="qty-btn"
                          onClick={() => updateQuantity(index, -1)}
                          disabled={selection.quantity <= 1}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="qty-value">{selection.quantity}</span>
                        <button 
                          type="button" 
                          className="qty-btn"
                          onClick={() => updateQuantity(index, 1)}
                          disabled={selection.quantity >= 10}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      {sizeSelections.length > 1 && (
                        <button 
                          type="button" 
                          className="remove-size-btn"
                          onClick={() => removeSizeSelection(index)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button 
                  type="button" 
                  className="add-size-btn"
                  onClick={addSizeSelection}
                >
                  <Plus size={16} /> Add Another Size
                </button>
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
                  <><Lock size={18} /> Secure My Spot ({getTotalQuantity()} item{getTotalQuantity() > 1 ? 's' : ''})</>
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
              <p>{product?.variant}</p>
              <div className="success-sizes">
                {sizeSelections.map((s, i) => (
                  <span key={i} className="success-size-tag">
                    {s.size} × {s.quantity}
                  </span>
                ))}
              </div>
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
