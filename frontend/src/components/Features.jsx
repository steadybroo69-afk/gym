import React from 'react';
import { features } from '../data/mock';
import { Activity, Minimize2, Target, Crosshair } from 'lucide-react';

const iconMap = {
  'activity': Activity,
  'minimize-2': Minimize2,
  'target': Target,
  'globe': Crosshair
};

const Features = () => {
  return (
    <section className="features-section" id="features">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Why RAZE</h2>
          <p className="section-subtitle">Designed with purpose by gymnasts. Built for performance.</p>
          <p className="section-subtitle-secondary">Tested in real training environments.</p>
        </div>

        <div className="features-grid">
          {features.map((feature) => {
            const Icon = iconMap[feature.icon];
            return (
              <div key={feature.id} className="feature-card">
                <div className="feature-icon">
                  {Icon && <Icon size={36} strokeWidth={1.5} />}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            );
          })}
        </div>
        
        <p className="features-tagline">Built for training. Refined for everyday wear.</p>
      </div>
    </section>
  );
};

export default Features;
