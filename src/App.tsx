import React, { useState } from 'react';
import { CourseReferenceTable } from './components/CourseReferenceTable';
import { DistanceMapExplorer } from './components/DistanceMapExplorer';
import { FaqModal } from './components/FaqModal';
import { Header } from './components/Header';

export const App: React.FC = () => {
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(1);
  const [selectedSetNumber, setSelectedSetNumber] = useState<number | null>(null);
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  const handleSelectCourseFromTable = (courseIndex: number) => {
    setSelectedCourseIndex(courseIndex);
    setSelectedSetNumber(null);
    document
      .getElementById('section-explorer')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      <div className="bg-grid" />

      <Header />

      <main className="container main-content">
        <DistanceMapExplorer
          selectedCourseIndex={selectedCourseIndex}
          onSelectCourse={setSelectedCourseIndex}
          selectedSetNumber={selectedSetNumber}
          onSelectSetNumber={setSelectedSetNumber}
        />

        <CourseReferenceTable
          selectedCourseIndex={selectedCourseIndex}
          onSelectCourseFromTable={handleSelectCourseFromTable}
        />
      </main>

      <footer className="site-footer">
        <div className="container footer-wrapper">
          <div className="footer-inner">
            <div className="footer-left">
              <strong>MKWorldDistanceMaps v1.0.0</strong> • Decompiled Mario Kart
              World v1.8.0 (<code>main.elf</code> &amp;{' '}
              <code>general_format.Product_180.sarc.zs</code>)
            </div>

            <div className="footer-right">
              <a
                href="https://liskadi.github.io/MKWorldItemProb/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-btn footer-btn-companion"
                title="Open MKWorldItemProb — Exact Item Probability Explorer"
              >
                <span>MKWorldItemProb ↗</span>
              </a>

              <a
                href="mailto:njdrecov@gmail.com"
                className="footer-btn"
                title="Email njdrecov@gmail.com"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span>Email</span>
              </a>

              <a
                href="https://github.com/liskadi"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-btn"
                title="View on GitHub (github.com/liskadi)"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="currentColor"
                >
                  <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.05 11.05 0 0 1 5.78 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                </svg>
                <span>GitHub</span>
              </a>

              <a
                href="https://ko-fi.com/liskadi"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-btn footer-btn-kofi"
                title="Support liskadi on Ko-Fi (ko-fi.com/liskadi)"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                  <path d="M10 12.5c.8-1 2.2-1 3 0 .8 1-.7 2.5-1.5 3-.8-.5-2.3-2-1.5-3Z" />
                </svg>
                <span>Ko-Fi</span>
              </a>

              <button
                type="button"
                onClick={() => setIsFaqOpen(true)}
                className="footer-btn"
                title="Open Frequently Asked Questions"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
                <span>FAQ</span>
              </button>
            </div>
          </div>

          <div className="footer-disclaimer">
            MKWorldDistanceMaps is an independent, non-commercial, fan-made
            reverse-engineering and data-visualization project for educational,
            informational, and community research purposes. This website and its
            creator are not affiliated with, endorsed by, sponsored by, or
            officially connected to Nintendo Co., Ltd., Nintendo of America
            Inc., Nintendo EPD (Entertainment Planning &amp; Development), or
            any of their subsidiaries, affiliates, or development partners.
            Mario Kart, Mario Kart World, Nintendo Switch, Nintendo Switch 2,
            and all associated course names, minimap layouts, trademarks, and
            game assets are the sole intellectual property and registered
            trademarks of Nintendo Co., Ltd.
          </div>
        </div>
      </footer>

      <FaqModal isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} />
    </>
  );
};

export default App;
