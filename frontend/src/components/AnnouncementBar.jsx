import React from 'react';
import { DollarSign } from 'lucide-react';

const AnnouncementBar = () => {
  return (
    <div className="announcement-bar">
      <div className="announcement-content">
        <DollarSign size={14} />
        <span>All prices in USD</span>
      </div>
    </div>
  );
};

export default AnnouncementBar;
