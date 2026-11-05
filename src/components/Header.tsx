import React, { useState } from 'react';
import { GAME_VERSION } from '../data/distanceMapsData';

const NAV_ITEMS = [
  { id: 'section-explorer', num: '01', label: 'Distance Maps' },
  { id: 'section-reference', num: '02', label: 'Course List' },
];

export const Header: React.FC = () => {
  const [activeNav, setActiveNav] = useState('section-explorer');

  return (
    <header className="top-header">
      <div className="container header-inner">
        <div className="brand">
          <div className="brand-icon-wrap" aria-hidden="true">
            <img
              src="./assets/Thunder.png"
              alt="Lightning"
              className="brand-icon"
              draggable={false}
            />
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1>
                MKWorld<span className="accent-gradient">DistanceMaps</span>
              </h1>
              <span className="brand-author">
                by{' '}
                <a
                  href="https://mkcentral.com/en-us/registry/players/profile?id=44345"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brand-author-name"
                  title="liskadi's MKCentral Profile"
                >
                  liskadi
                </a>
              </span>
              <span className="version-pill">{GAME_VERSION}</span>
            </div>
            <p className="brand-subtitle">
              Mario Kart World Decompiled Course Minimaps, Lap Lengths &amp; Distance Item Promotion Markers
            </p>
          </div>
        </div>

        <nav className="section-nav" aria-label="Section Navigation">
          {NAV_ITEMS.map((nav) => (
            <a
              key={nav.id}
              href={`#${nav.id}`}
              className={`nav-pill ${activeNav === nav.id ? 'active' : ''}`}
              onClick={() => setActiveNav(nav.id)}
            >
              <span className="nav-num">{nav.num}</span> {nav.label}
            </a>
          ))}

          <a
            href="https://liskadi.github.io/MKWorldItemProb/"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-pill nav-pill-companion"
            title="Open MKWorldItemProb — Interactive Item Probability Table"
          >
            <span>Item Probabilities ↗</span>
          </a>
        </nav>
      </div>
    </header>
  );
};
