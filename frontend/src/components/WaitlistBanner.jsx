import React, { useState, useEffect } from 'react';
import { Flame, Clock, Users } from 'lucide-react';

const WaitlistBanner = ({ onClick }) => {
  const [spotsRemaining, setSpotsRemaining] = useState(null);

  useEffect(() => {
    const spots = calculateSpotsRemaining();
    setSpotsRemaining(spots);
  }, []);

  const calculateSpotsRemaining = () => {
    const STORAGE_KEY = 'raze_waitlist_spots';
    const TIMESTAMP_KEY = 'raze_waitlist_timestamp';
    
    const now = Date.now();
    const stored = localStorage.getItem(STORAGE_KEY);
    const timestamp = localStorage.getItem(TIMESTAMP_KEY);
    
    // If no stored data, generate new random spot (51-89)
    if (!stored || !timestamp) {
      const initialSpots = Math.floor(Math.random() * 39) + 51; // 51-89
      localStorage.setItem(STORAGE_KEY, initialSpots.toString());
      localStorage.setItem(TIMESTAMP_KEY, now.toString());
      return initialSpots;
    }
    
    // Check if 2 hours (7200000ms) have passed since LAST reload
    const timeDiff = now - parseInt(timestamp);
    const twoHours = 2 * 60 * 60 * 1000; // 7200000ms
    
    // If 2+ hours passed, decrease by 2 and update timestamp
    if (timeDiff >= twoHours) {
      const currentSpots = parseInt(stored);
      const newSpots = Math.max(1, currentSpots - 2);
      
      localStorage.setItem(STORAGE_KEY, newSpots.toString());
      localStorage.setItem(TIMESTAMP_KEY, now.toString()); // Reset timestamp to NOW
      return newSpots;
    }
    
    // If less than 2 hours, just return stored spots (no change)
    return parseInt(stored);
  };

  return (
    <div className="waitlist-banner" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="banner-content">
        <div className="banner-left">
          <Flame size={20} className="banner-icon" />
          <span className="sold-out-text">FIRST DROP SOLD OUT</span>
        </div>
        
        <div className="banner-center">
          <Clock size={16} />
          <span>Next Drop: <strong>Feb 2</strong> • Waitlist Only</span>
        </div>
        
        <div className="banner-right">
          <Users size={16} />
          <span>
            {spotsRemaining !== null ? (
              <>Only <strong>{spotsRemaining}</strong> {spotsRemaining === 1 ? 'spot' : 'spots'} left</>
            ) : (
              'Limited spots'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WaitlistBanner;
