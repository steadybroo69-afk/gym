import React from 'react';
import { Shield } from 'lucide-react';

const AnnouncementBar = () => {
  return (
    <div className="announcement-bar">
      <div className="announcement-content">
        <Shield size={14} />
        <span>100% Satisfaction Guarantee • Premium Quality • All prices in USD</span>
      </div>
    </div>
  );
};

export default AnnouncementBar;
