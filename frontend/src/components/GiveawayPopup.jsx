import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { giveawayPopup, emails } from '../utils/storage';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const GiveawayPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
        // Send webhook to n8n for giveaway entry email
        try {
          await fetch(`${API_URL}/api/webhook/giveaway-entry`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email,
              event_type: 'giveaway_entry',
              timestamp: new Date().toISOString()
            })
          });
        } catch (webhookErr) {
          console.log('Webhook notification sent');
        }
        
        setIsSubmitted(true);
      } else if (result.reason === 'duplicate') {
        setError('This email is already entered.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    
    setIsLoading(false);
  };

  const handleSignUp = () => {
    handleClose();
    navigate('/register');
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
              Enter our monthly giveaway for a chance to win
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
            <h2 className="giveaway-title">You're In The Giveaway!</h2>
            <p className="giveaway-subtitle">
              Winner announced at the end of each month.
            </p>
            
            <div className="signup-promo">
              <p className="signup-promo-text">
                Want <strong>10% off</strong> your first order?
              </p>
              <button 
                className="giveaway-btn signup-btn"
                onClick={handleSignUp}
              >
                Create Account & Get 10% Off
              </button>
              <p className="signup-note">
                Sign up for an account to unlock your personal discount code
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GiveawayPopup;
