import React from 'react';

const Newsletter = ({ onJoinClick }) => {
  return (
    <section className="newsletter-section" id="newsletter">
      <div className="container">
        <div className="newsletter-content">
          <h2 className="newsletter-title">First Drop Coming Soon</h2>
          <p className="newsletter-description">
            Be the first to know when Drop 01 launches.
          </p>
          <div className="newsletter-cta">
            <button className="btn-cta" onClick={onJoinClick}>
              Join Early Access
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
