import React, { useState } from 'react';
import { Ruler, Info, User, ChevronDown } from 'lucide-react';

const SizeGuide = () => {
  const [activeTab, setActiveTab] = useState('tshirt');
  const [unit, setUnit] = useState('in'); // 'cm' or 'in' - default to inches (tech pack standard)

  // T-Shirt measurements from tech pack (US01 - Unisex Performance Tee)
  // Original measurements in INCHES, converted to CM (1 inch = 2.54 cm)
  const tshirtSizes = [
    { 
      size: 'XS', 
      chest: { in: 34, cm: 86.4 },
      shoulder: { in: 15.5, cm: 39.4 },
      length: { in: 25, cm: 63.5 },
      sleeveLength: { in: 7.5, cm: 19.1 },
      sleeveOpening: { in: 6.5, cm: 16.5 }
    },
    { 
      size: 'S', 
      chest: { in: 36, cm: 91.4 },
      shoulder: { in: 16, cm: 40.6 },
      length: { in: 25.5, cm: 64.8 },
      sleeveLength: { in: 8, cm: 20.3 },
      sleeveOpening: { in: 7, cm: 17.8 }
    },
    { 
      size: 'M', 
      chest: { in: 38, cm: 96.5 },
      shoulder: { in: 16.5, cm: 41.9 },
      length: { in: 26, cm: 66 },
      sleeveLength: { in: 8, cm: 20.3 },
      sleeveOpening: { in: 7.5, cm: 19.1 }
    },
    { 
      size: 'L', 
      chest: { in: 40, cm: 101.6 },
      shoulder: { in: 17, cm: 43.2 },
      length: { in: 26.5, cm: 67.3 },
      sleeveLength: { in: 8.5, cm: 21.6 },
      sleeveOpening: { in: 8, cm: 20.3 }
    }
  ];

  // Men's Shorts measurements from tech pack (RGSS02)
  // Original measurements in INCHES, converted to CM
  const mensShortsSize = [
    {
      size: 'S',
      waist: { in: 28, cm: 71.1 },
      hip: { in: 34, cm: 86.4 },
      outseam: { in: 15, cm: 38.1 },
      inseam: { in: 5, cm: 12.7 },
      legOpening: { in: 21, cm: 53.3 }
    },
    {
      size: 'M',
      waist: { in: 30, cm: 76.2 },
      hip: { in: 36, cm: 91.4 },
      outseam: { in: 15.5, cm: 39.4 },
      inseam: { in: 5.5, cm: 14 },
      legOpening: { in: 22, cm: 55.9 }
    },
    {
      size: 'L',
      waist: { in: 32, cm: 81.3 },
      hip: { in: 38, cm: 96.5 },
      outseam: { in: 16, cm: 40.6 },
      inseam: { in: 6, cm: 15.2 },
      legOpening: { in: 23, cm: 58.4 }
    },
    {
      size: 'XL',
      waist: { in: 34, cm: 86.4 },
      hip: { in: 40, cm: 101.6 },
      outseam: { in: 16.5, cm: 41.9 },
      inseam: { in: 6, cm: 15.2 },
      legOpening: { in: 24, cm: 61 }
    }
  ];

  // Women's Shorts measurements from tech pack (RGSS03)
  // Original measurements in INCHES, converted to CM
  const womensShortsSize = [
    {
      size: 'XS',
      waist: { in: 26, cm: 66 },
      hip: { in: 34, cm: 86.4 },
      outseam: { in: 15, cm: 38.1 },
      frontRise: { in: 9, cm: 22.9 },
      backRise: { in: 11, cm: 27.9 },
      legOpening: { in: 20, cm: 50.8 }
    },
    {
      size: 'S',
      waist: { in: 28, cm: 71.1 },
      hip: { in: 36, cm: 91.4 },
      outseam: { in: 15.5, cm: 39.4 },
      frontRise: { in: 9.5, cm: 24.1 },
      backRise: { in: 11.5, cm: 29.2 },
      legOpening: { in: 21, cm: 53.3 }
    },
    {
      size: 'M',
      waist: { in: 30, cm: 76.2 },
      hip: { in: 38, cm: 96.5 },
      outseam: { in: 16, cm: 40.6 },
      frontRise: { in: 10, cm: 25.4 },
      backRise: { in: 12, cm: 30.5 },
      legOpening: { in: 22, cm: 55.9 }
    },
    {
      size: 'L',
      waist: { in: 32, cm: 81.3 },
      hip: { in: 40, cm: 101.6 },
      outseam: { in: 16.5, cm: 41.9 },
      frontRise: { in: 10.5, cm: 26.7 },
      backRise: { in: 12.5, cm: 31.8 },
      legOpening: { in: 23, cm: 58.4 }
    }
  ];

  // Format measurement based on selected unit
  const formatMeasurement = (measurement) => {
    if (unit === 'in') {
      return `${measurement.in}"`;
    }
    return `${measurement.cm} cm`;
  };

  return (
    <div className="size-guide-page">
      <div className="size-guide-container">
        {/* Header */}
        <div className="size-guide-header">
          <h1 className="size-guide-title">Size Guide</h1>
          <p className="size-guide-subtitle">Professional measurements for the perfect fit</p>
        </div>

        {/* Removed unit toggle - now showing both units */}

        {/* Product Tabs */}
        <div className="size-guide-tabs">
          <button 
            className={`size-tab ${activeTab === 'tshirt' ? 'active' : ''}`}
            onClick={() => setActiveTab('tshirt')}
          >
            Performance T-Shirt (Unisex)
          </button>
          <button 
            className={`size-tab ${activeTab === 'shorts-mens' ? 'active' : ''}`}
            onClick={() => setActiveTab('shorts-mens')}
          >
            Men's Shorts
          </button>
          <button 
            className={`size-tab ${activeTab === 'shorts-womens' ? 'active' : ''}`}
            onClick={() => setActiveTab('shorts-womens')}
          >
            Women's Shorts
          </button>
        </div>

        {/* T-Shirt Section */}
        {activeTab === 'tshirt' && (
          <div className="size-guide-content">
            {/* Size Chart */}
            <section className="chart-section">
              <div className="chart-header">
                <h2>T-Shirt Measurements</h2>
                <div className="unit-toggle">
                  <button 
                    className={`unit-btn ${unit === 'in' ? 'active' : ''}`}
                    onClick={() => setUnit('in')}
                  >
                    Inches
                  </button>
                  <button 
                    className={`unit-btn ${unit === 'cm' ? 'active' : ''}`}
                    onClick={() => setUnit('cm')}
                  >
                    CM
                  </button>
                </div>
              </div>
              
              <div className="size-chart-wrapper">
                <table className="size-chart">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Chest</th>
                      <th>Shoulder</th>
                      <th>Length</th>
                      <th>Sleeve</th>
                      <th>Sleeve Opening</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tshirtSizes.map((row) => (
                      <tr key={row.size}>
                        <td className="size-cell">{row.size}</td>
                        <td>{formatMeasurement(row.chest)}</td>
                        <td>{formatMeasurement(row.shoulder)}</td>
                        <td>{formatMeasurement(row.length)}</td>
                        <td>{formatMeasurement(row.sleeveLength)}</td>
                        <td>{formatMeasurement(row.sleeveOpening)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Visual Diagram */}
            <section className="diagram-section">
              <h2>How to Measure</h2>
              <div className="diagram-grid">
                <div className="diagram-visual diagram-container">
                  <img 
                    src="https://customer-assets.emergentagent.com/job_8d3f0afb-5696-4895-ba8a-26fe34477d18/artifacts/5j1xs598_image.png" 
                    alt="T-Shirt Measurement Guide"
                    className="measurement-diagram-image"
                  />
                </div>
                
                <div className="measurement-legend">
                  <div className="legend-item">
                    <span className="legend-marker" style={{background: '#00d9ff'}}>A</span>
                    <div>
                      <strong>Chest Width</strong>
                      <p>Measure across chest from armpit to armpit</p>
                    </div>
                  </div>
                  <div className="legend-item">
                    <span className="legend-marker" style={{background: '#ff6b9d', color: '#fff'}}>B</span>
                    <div>
                      <strong>Shoulder Width</strong>
                      <p>From shoulder seam to shoulder seam</p>
                    </div>
                  </div>
                  <div className="legend-item">
                    <span className="legend-marker" style={{background: '#ffd93d'}}>C</span>
                    <div>
                      <strong>Body Length</strong>
                      <p>From collar seam to bottom hem</p>
                    </div>
                  </div>
                  <div className="legend-item">
                    <span className="legend-marker" style={{background: '#6bcb77'}}>D</span>
                    <div>
                      <strong>Sleeve Length</strong>
                      <p>From shoulder seam to sleeve hem</p>
                    </div>
                  </div>
                  <div className="legend-item">
                    <span className="legend-marker" style={{background: '#e056fd', color: '#fff'}}>E</span>
                    <div>
                      <strong>Sleeve Opening</strong>
                      <p>Measure around the sleeve hem where the sleeve ends</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Fit Description - moved to bottom */}
            <section className="fit-section">
              <h2>Performance Fit</h2>
              <div className="fit-features">
                <div className="fit-feature">
                  <span className="feature-check">✓</span>
                  <span>Athletic cut through chest and shoulders to support overhead and explosive movement</span>
                </div>
                <div className="fit-feature">
                  <span className="feature-check">✓</span>
                  <span>Subtle taper at the waist for a clean silhouette without restricting motion</span>
                </div>
                <div className="fit-feature">
                  <span className="feature-check">✓</span>
                  <span>Engineered for full range of motion under load and inversion</span>
                </div>
                <div className="fit-feature">
                  <span className="feature-check">✓</span>
                  <span>Built for gymnastics, calisthenics, and functional training</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Men's Shorts Section */}
        {activeTab === 'shorts-mens' && (
          <div className="size-guide-content">
            {/* Size Chart */}
            <section className="chart-section">
              <div className="chart-header">
                <h2>Men's Shorts Measurements</h2>
                <div className="unit-toggle">
                  <button 
                    className={`unit-btn ${unit === 'in' ? 'active' : ''}`}
                    onClick={() => setUnit('in')}
                  >
                    Inches
                  </button>
                  <button 
                    className={`unit-btn ${unit === 'cm' ? 'active' : ''}`}
                    onClick={() => setUnit('cm')}
                  >
                    CM
                  </button>
                </div>
              </div>
              
              <div className="size-chart-wrapper">
                <table className="size-chart">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Waist</th>
                      <th>Hip</th>
                      <th>Outseam</th>
                      <th>Inseam</th>
                      <th>Leg Opening</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mensShortsSize.map((row) => (
                      <tr key={row.size}>
                        <td className="size-cell">{row.size}</td>
                        <td>{formatMeasurement(row.waist)}</td>
                        <td>{formatMeasurement(row.hip)}</td>
                        <td>{formatMeasurement(row.outseam)}</td>
                        <td>{formatMeasurement(row.inseam)}</td>
                        <td>{formatMeasurement(row.legOpening)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Visual Diagram */}
            <section className="diagram-section">
              <h2>How to Measure</h2>
              <div className="diagram-grid">
                <div className="diagram-visual diagram-container">
                  <svg viewBox="0 0 280 260" className="shorts-diagram">
                    {/* Shorts shape - filled teal with cyan outline */}
                    <path 
                      d="M50 25 
                         L50 45 
                         Q50 55 55 60
                         L70 180 
                         Q75 195 90 195
                         L115 195 
                         Q125 195 130 180
                         L140 100 
                         L150 180 
                         Q155 195 165 195
                         L190 195 
                         Q205 195 210 180
                         L225 60 
                         Q230 55 230 45
                         L230 25 
                         Q230 20 225 20
                         L55 20 
                         Q50 20 50 25
                         Z" 
                      fill="#1a4a4a" 
                      stroke="#00d9ff" 
                      strokeWidth="1.5"
                    />
                    
                    {/* Drawstring detail */}
                    <path d="M130 30 Q140 40 150 30" fill="none" stroke="#00d9ff" strokeWidth="1" opacity="0.5"/>
                    
                    {/* A - Waist (cyan) */}
                    <line x1="50" y1="25" x2="230" y2="25" stroke="#00d9ff" strokeWidth="2" strokeDasharray="6,4"/>
                    <rect x="129" y="8" width="22" height="22" fill="#00d9ff" rx="4"/>
                    <text x="140" y="24" fill="#000" fontSize="12" fontWeight="bold" textAnchor="middle">A</text>
                    
                    {/* B - Hip (pink) */}
                    <line x1="48" y1="60" x2="232" y2="60" stroke="#ff6b9d" strokeWidth="2" strokeDasharray="6,4"/>
                    <rect x="10" y="49" width="22" height="22" fill="#ff6b9d" rx="4"/>
                    <text x="21" y="65" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">B</text>
                    
                    {/* C - Outseam (yellow) - right side */}
                    <line x1="230" y1="25" x2="210" y2="195" stroke="#ffd93d" strokeWidth="2" strokeDasharray="6,4"/>
                    <rect x="235" y="100" width="22" height="22" fill="#ffd93d" rx="4"/>
                    <text x="246" y="116" fill="#000" fontSize="12" fontWeight="bold" textAnchor="middle">C</text>
                    
                    {/* D - Inseam (green) - inner left leg */}
                    <line x1="130" y1="100" x2="115" y2="195" stroke="#6bcb77" strokeWidth="2" strokeDasharray="6,4"/>
                    <rect x="95" y="140" width="22" height="22" fill="#6bcb77" rx="4"/>
                    <text x="106" y="156" fill="#000" fontSize="12" fontWeight="bold" textAnchor="middle">D</text>
                    
                    {/* E - Leg Opening (magenta) */}
                    <line x1="165" y1="195" x2="190" y2="195" stroke="#e056fd" strokeWidth="2" strokeDasharray="6,4"/>
                    <rect x="166" y="205" width="22" height="22" fill="#e056fd" rx="4"/>
                    <text x="177" y="221" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">E</text>
                  </svg>
                </div>
                
                <div className="measurement-legend">
                  <div className="legend-item">
                    <span className="legend-marker" style={{background: '#00d9ff'}}>A</span>
                    <div>
                      <strong>Waist</strong>
                      <p>Around the waistband, elastic relaxed</p>
                    </div>
                  </div>
                  <div className="legend-item">
                    <span className="legend-marker" style={{background: '#ff6b9d', color: '#fff'}}>B</span>
                    <div>
                      <strong>Hip</strong>
                      <p>Around the fullest part of the hip</p>
                    </div>
                  </div>
                  <div className="legend-item">
                    <span className="legend-marker" style={{background: '#ffd93d'}}>C</span>
                    <div>
                      <strong>Outseam</strong>
                      <p>From waistband top to leg hem (outer side)</p>
                    </div>
                  </div>
                  <div className="legend-item">
                    <span className="legend-marker" style={{background: '#6bcb77'}}>D</span>
                    <div>
                      <strong>Inseam</strong>
                      <p>From crotch seam to leg hem (inner side)</p>
                    </div>
                  </div>
                  <div className="legend-item">
                    <span className="legend-marker" style={{background: '#e056fd', color: '#fff'}}>E</span>
                    <div>
                      <strong>Leg Opening</strong>
                      <p>Around the leg hem opening</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Fit Description - at bottom */}
            <section className="fit-section">
              <h2>Performance Fit</h2>
              <div className="fit-features">
                <div className="fit-feature">
                  <span className="feature-check">✓</span>
                  <span>5" inseam for full range of motion</span>
                </div>
                <div className="fit-feature">
                  <span className="feature-check">✓</span>
                  <span>Elastic waistband with internal drawcord</span>
                </div>
                <div className="fit-feature">
                  <span className="feature-check">✓</span>
                  <span>Deep side pockets for secure storage</span>
                </div>
                <div className="fit-feature">
                  <span className="feature-check">✓</span>
                  <span>Built for squats, jumps, and dynamic movements</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Women's Shorts Section */}
        {activeTab === 'shorts-womens' && (
          <div className="size-guide-content">
            {/* Size Chart */}
            <section className="chart-section">
              <div className="chart-header">
                <h2>Women's Shorts Measurements</h2>
                <div className="unit-toggle">
                  <button 
                    className={`unit-btn ${unit === 'in' ? 'active' : ''}`}
                    onClick={() => setUnit('in')}
                  >
                    Inches
                  </button>
                  <button 
                    className={`unit-btn ${unit === 'cm' ? 'active' : ''}`}
                    onClick={() => setUnit('cm')}
                  >
                    CM
                  </button>
                </div>
              </div>
              
              <div className="size-chart-wrapper">
                <table className="size-chart">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Waist</th>
                      <th>Hip</th>
                      <th>Outseam</th>
                      <th>Front Rise</th>
                      <th>Leg Opening</th>
                    </tr>
                  </thead>
                  <tbody>
                    {womensShortsSize.map((row) => (
                      <tr key={row.size}>
                        <td className="size-cell">{row.size}</td>
                        <td>{formatMeasurement(row.waist)}</td>
                        <td>{formatMeasurement(row.hip)}</td>
                        <td>{formatMeasurement(row.outseam)}</td>
                        <td>{formatMeasurement(row.frontRise)}</td>
                        <td>{formatMeasurement(row.legOpening)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Visual Diagram */}
            <section className="diagram-section">
              <h2>How to Measure</h2>
              <div className="diagram-grid">
                <div className="diagram-visual diagram-container">
                  <svg viewBox="0 0 280 260" className="shorts-diagram">
                    {/* Women's Shorts shape - higher rise, filled teal with cyan outline */}
                    <path 
                      d="M50 20 
                         L50 45 
                         Q50 55 55 60
                         L70 180 
                         Q75 195 90 195
                         L115 195 
                         Q125 195 130 180
                         L140 95 
                         L150 180 
                         Q155 195 165 195
                         L190 195 
                         Q205 195 210 180
                         L225 60 
                         Q230 55 230 45
                         L230 20 
                         Q230 15 225 15
                         L55 15 
                         Q50 15 50 20
                         Z" 
                      fill="#1a4a4a" 
                      stroke="#00d9ff" 
                      strokeWidth="1.5"
                    />
                    
                    {/* A - Waist (cyan) */}
                    <line x1="50" y1="20" x2="230" y2="20" stroke="#00d9ff" strokeWidth="2" strokeDasharray="6,4"/>
                    <rect x="129" y="3" width="22" height="22" fill="#00d9ff" rx="4"/>
                    <text x="140" y="19" fill="#000" fontSize="12" fontWeight="bold" textAnchor="middle">A</text>
                    
                    {/* B - Hip (pink) */}
                    <line x1="48" y1="60" x2="232" y2="60" stroke="#ff6b9d" strokeWidth="2" strokeDasharray="6,4"/>
                    <rect x="10" y="49" width="22" height="22" fill="#ff6b9d" rx="4"/>
                    <text x="21" y="65" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">B</text>
                    
                    {/* C - Outseam (yellow) - right side */}
                    <line x1="230" y1="20" x2="210" y2="195" stroke="#ffd93d" strokeWidth="2" strokeDasharray="6,4"/>
                    <rect x="235" y="100" width="22" height="22" fill="#ffd93d" rx="4"/>
                    <text x="246" y="116" fill="#000" fontSize="12" fontWeight="bold" textAnchor="middle">C</text>
                    
                    {/* D - Front Rise (green) - center vertical */}
                    <line x1="140" y1="20" x2="140" y2="95" stroke="#6bcb77" strokeWidth="2" strokeDasharray="6,4"/>
                    <rect x="145" y="50" width="22" height="22" fill="#6bcb77" rx="4"/>
                    <text x="156" y="66" fill="#000" fontSize="12" fontWeight="bold" textAnchor="middle">D</text>
                    
                    {/* E - Leg Opening (magenta) */}
                    <line x1="165" y1="195" x2="190" y2="195" stroke="#e056fd" strokeWidth="2" strokeDasharray="6,4"/>
                    <rect x="166" y="205" width="22" height="22" fill="#e056fd" rx="4"/>
                    <text x="177" y="221" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">E</text>
                  </svg>
                </div>
                
                <div className="measurement-legend">
                  <div className="legend-item">
                    <span className="legend-marker" style={{background: '#00d9ff'}}>A</span>
                    <div>
                      <strong>Waist</strong>
                      <p>Around the waistband, elastic relaxed</p>
                    </div>
                  </div>
                  <div className="legend-item">
                    <span className="legend-marker" style={{background: '#ff6b9d', color: '#fff'}}>B</span>
                    <div>
                      <strong>Hip</strong>
                      <p>Around the fullest part of the hip</p>
                    </div>
                  </div>
                  <div className="legend-item">
                    <span className="legend-marker" style={{background: '#ffd93d'}}>C</span>
                    <div>
                      <strong>Outseam</strong>
                      <p>From waistband top to leg hem (outer side)</p>
                    </div>
                  </div>
                  <div className="legend-item">
                    <span className="legend-marker" style={{background: '#6bcb77'}}>D</span>
                    <div>
                      <strong>Front Rise</strong>
                      <p>From waistband top to crotch seam (front)</p>
                    </div>
                  </div>
                  <div className="legend-item">
                    <span className="legend-marker" style={{background: '#e056fd', color: '#fff'}}>E</span>
                    <div>
                      <strong>Leg Opening</strong>
                      <p>Around the leg hem opening</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Fit Description - at bottom */}
            <section className="fit-section">
              <h2>Performance Fit</h2>
              <div className="fit-features">
                <div className="fit-feature">
                  <span className="feature-check">✓</span>
                  <span>High-rise waistband for secure coverage</span>
                </div>
                <div className="fit-feature">
                  <span className="feature-check">✓</span>
                  <span>Flattering 5" inseam length</span>
                </div>
                <div className="fit-feature">
                  <span className="feature-check">✓</span>
                  <span>Contoured fit through hip and thigh</span>
                </div>
                <div className="fit-feature">
                  <span className="feature-check">✓</span>
                  <span>Built for squats, jumps, and dynamic movements</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Sizing Tips */}
        <section className="sizing-tips">
          <h2>Sizing Tips</h2>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">📏</div>
              <h3>Between Sizes?</h3>
              <p><strong>Size up</strong> for a relaxed training fit.<br/><strong>Size down</strong> for compression-style fit.</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">👕</div>
              <h3>Compare to Your Favorites</h3>
              <p>Lay your best-fitting shirt or shorts flat and measure to compare with our chart.</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">📧</div>
              <h3>Still Unsure?</h3>
              <p>Email us at <a href="mailto:support@razetraining.com">support@razetraining.com</a> — we'll help you find your size.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SizeGuide;
