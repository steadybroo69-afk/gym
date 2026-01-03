import React from 'react';
import { Shield } from 'lucide-react';

const AnnouncementBar = () => {
  return (
    <div className="announcement-bar">
      <div className="announcement-content">
        <Shield size={14} />
        <span>30-Day Returns • 100% Satisfaction Guarantee • Premium Quality</span>
      </div>
    </div>
  );
};

export default AnnouncementBar;
