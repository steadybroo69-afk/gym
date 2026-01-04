import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { popup } from '../utils/storage';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EmailPopup = ({ isOpen: externalIsOpen, onClose: externalOnClose }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
  };

  const handleSignUp = () => {
    handleClose();
    navigate('/register');
  };

  const handleLogin = () => {
    handleClose();
    navigate('/login');
  };

  if (!isOpen) return null;

  // If user is already authenticated, show different message
  if (isAuthenticated) {
    return (
      <>
        <div className="popup-overlay" onClick={handleClose} />
        <div className="popup-container no-animation">
          <button className="popup-close" onClick={handleClose} aria-label="Close">
            <X size={20} />
          </button>
          <div className="popup-content popup-success">
            <div className="popup-success-icon">✓</div>
            <h2 className="popup-success-title">You Have Early Access!</h2>
            <p className="popup-success-subtitle">
              You're already signed in and have access to all drops.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div className="popup-overlay" onClick={handleClose} />

      {/* Popup */}
      <div className="popup-container no-animation">
        <button className="popup-close" onClick={handleClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="popup-content">
          <h2 className="popup-title">Get Early Access</h2>
          <p className="popup-subtitle">
            Create an account to unlock early access to drops and get 10% off your first order.
          </p>

          <div className="early-access-benefits">
            <ul className="benefits-list">
              <li>
                <span className="check">✓</span>
                10% off your first order
              </li>
              <li>
                <span className="check">✓</span>
                Early access to new drops
              </li>
              <li>
                <span className="check">✓</span>
                Order tracking & history
              </li>
            </ul>
          </div>

          <button
            onClick={handleSignUp}
            className="popup-btn"
          >
            Create Account
          </button>
          
          <p className="popup-login-link">
            Already have an account?{' '}
            <button onClick={handleLogin} className="link-btn">
              Log in
            </button>
          </p>
        </div>
      </div>
    </>
  );
};

export default EmailPopup;
