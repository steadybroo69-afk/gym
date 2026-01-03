import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { popup, emails } from '../utils/storage';

const EmailPopup = ({ isOpen: externalIsOpen, onClose: externalOnClose }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Determine if popup is controlled externally or internally
  const isControlled = externalIsOpen !== undefined;
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  useEffect(() => {
    // Skip auto-trigger if controlled externally
    if (isControlled) return;

    // Check if should show based on 14-day cooldown
    if (!popup.shouldShow()) return;

    // Show after EXACTLY 7 seconds
    const timer = setTimeout(() => {
      setInternalIsOpen(true);
      popup.markShown();
    }, popup.TRIGGER_DELAY_MS);

    // Exit intent detection (desktop only)
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && popup.shouldShow()) {
        setInternalIsOpen(true);
        popup.markShown();
        clearTimeout(timer);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isControlled]);

  const handleClose = () => {
    if (isControlled && externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
    popup.markDismissed();
    // Reset state for next time
    setEmail('');
    setIsSubmitted(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await emails.addEarlyAccess(email);
      
      if (result.success) {
        setIsSubmitted(true);
      } else if (result.reason === 'duplicate') {
        setError('This email is already registered.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="popup-overlay" onClick={handleClose} />

      {/* Popup */}
      <div className="popup-container">
        <button className="popup-close" onClick={handleClose} aria-label="Close">
          <X size={20} />
        </button>

        {!isSubmitted ? (
          // Initial State
          <div className="popup-content">
            <h2 className="popup-title">Get Early Access</h2>
            <p className="popup-subtitle">
              Join the list for drop notifications and launch benefit access.
            </p>

            <form onSubmit={handleSubmit} className="popup-form">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="popup-input"
                disabled={isLoading}
              />
              {error && (
                <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0', textAlign: 'left' }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="popup-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Joining...' : 'JOIN'}
              </button>
            </form>
          </div>
        ) : (
          // Success State
          <div className="popup-content popup-success">
            <div className="popup-success-icon">✓</div>
            <h2 className="popup-success-title">You're in.</h2>
            <p className="popup-success-subtitle">Watch for Drop 01.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default EmailPopup;
