import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { giveawayPopup, emails } from '../utils/storage';

const GiveawayPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if should show based on 14-day cooldown
    if (!giveawayPopup.shouldShow()) return;

    // Show after EXACTLY 7 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
      giveawayPopup.markShown();
    }, giveawayPopup.TRIGGER_DELAY_MS);

    // Exit intent detection (desktop only)
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && giveawayPopup.shouldShow()) {
        setIsOpen(true);
        giveawayPopup.markShown();
        clearTimeout(timer);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    giveawayPopup.markDismissed();
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
      const result = await emails.addGiveaway(email);
      
      if (result.success) {
        setIsSubmitted(true);
      } else if (result.reason === 'duplicate') {
        setError('This email is already entered.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="giveaway-overlay" onClick={handleClose} />

      <div className="giveaway-popup">
        <button className="giveaway-close" onClick={handleClose} aria-label="Close">
          <X size={20} />
        </button>

        {!isSubmitted ? (
          <div className="giveaway-content">
            <div className="giveaway-icon">🎁</div>
            <h2 className="giveaway-title">WIN A FREE RAZE SHIRT</h2>
            <p className="giveaway-subtitle">
              Enter our giveaway + get 10% off your first order
            </p>

            <form onSubmit={handleSubmit} className="giveaway-form">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="giveaway-input"
                disabled={isLoading}
              />
              {error && (
                <p className="giveaway-error">{error}</p>
              )}
              <button
                type="submit"
                className="giveaway-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Entering...' : 'Enter Giveaway'}
              </button>
            </form>

            <div className="giveaway-benefits">
              <p className="benefits-heading">WHAT YOU GET:</p>
              <ul className="benefits-list">
                <li>
                  <span className="check">✓</span>
                  1 free training shirt (winner announced monthly)
                </li>
                <li>
                  <span className="check">✓</span>
                  10% off your first order when you sign up
                </li>
                <li>
                  <span className="check">✓</span>
                  Early access to new drops
                </li>
                <li>
                  <span className="check">✓</span>
                  Exclusive training tips & discipline content
                </li>
              </ul>
            </div>

            <p className="giveaway-disclaimer">No spam. Unsubscribe anytime.</p>
          </div>
        ) : (
          <div className="giveaway-content giveaway-success">
            <div className="giveaway-icon">🎉</div>
            <h2 className="giveaway-title">You're In!</h2>
            <p className="giveaway-subtitle">
              Use this code at checkout for 10% off:
            </p>
            <div className="promo-code-display">
              <span className="promo-code">WELCOME10</span>
              <button 
                className="copy-code-btn"
                onClick={() => {
                  navigator.clipboard.writeText('WELCOME10');
                }}
              >
                Copy
              </button>
            </div>
            <p className="giveaway-note">
              You're also entered in our monthly shirt giveaway!
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default GiveawayPopup;
