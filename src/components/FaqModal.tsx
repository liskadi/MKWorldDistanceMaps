import React, { useEffect, useState } from 'react';

export interface FaqItem {
  id: string;
  question: string;
  tag: string;
  answer: React.ReactNode;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'what-is-mkworlddistancemaps',
    tag: 'Project & Decompilation',
    question: 'What is MKWorldDistanceMaps, and how was this data obtained?',
    answer: (
      <>
        <p>
          <strong>MKWorldDistanceMaps</strong> is an interactive course distance map explorer, decompiled lap-length
          reference, and item-pool distance promotion visualizer for <em>Mario Kart World</em> (<code>v1.8.0</code>)
          covering all <strong>30 standard courses</strong> plus the <strong>10 SNES Patch courses</strong>.
        </p>
        <p>
          Every minimap projection, course/lap length (<code>L_course</code>), item box set coordinate, and{' '}
          <code>250m (+1)</code> / <code>300m (+2)</code> threshold marker in this application was extracted directly by{' '}
          <strong>liskadi</strong> through static decompilation of the game&apos;s executable binary (
          <code>main.elf</code>) and parameter/course archives (<code>general_format.Product_180.sarc.zs</code>,{' '}
          <code>Banc/*.bcett.byml.zs</code>, and <code>Layout/MiniMap_*.bntx.zs</code>).
        </p>
      </>
    ),
  },
  {
    id: 'why-250m-and-300m',
    tag: 'FarDistance & +75m Tiers',
    question: 'How do FarDistance thresholds and +75m tier promotions work for each position?',
    answer: (
      <>
        <p>
          In <em>Mario Kart World</em> (<code>v1.8.0</code>), each position has its own base distance threshold{' '}
          <code>FarDistance&#123;P&#125;</code> behind <strong>1st place</strong> required to unlock an item tier
          promotion (defined in <code>Gyml/ItemTableCorrectParam/Default.game__ItemTableCorrectParam.bgyml</code> and
          evaluated in <code>sub_00a7cf90</code>, <code>sub_00a7d5c0</code>, and <code>sub_00a7d390</code>):
        </p>
        <ul>
          <li>
            <strong>Position-Specific <code>FarDistance&#123;P&#125;</code> (+1 Tier):</strong> Starts at{' '}
            <strong>250.0m</strong> for <strong>2nd place</strong> (<code>FarDistance2 = 250.0m</code>) and increases by{' '}
            <strong>+50.0m per position</strong> (<code>300.0m</code> for 3rd, <code>350.0m</code> for 4th, ...,{' '}
            <code>750.0m</code> for 12th, up to <code>1,300.0m</code> for 23rd place).
          </li>
          <li>
            <strong>Additional Tiers Every +75.0m (<code>AdditionalFarDistance = 75.0m</code>):</strong> Once a racer
            reaches their position&apos;s <code>FarDistance&#123;P&#125;</code> (+1 tier), every additional{' '}
            <strong>+75.0m</strong> behind 1st place grants another <strong>+1 tier promotion</strong> (+2 tiers at{' '}
            <code>FarDistance&#123;P&#125; + 75m</code>, +3 tiers at <code>FarDistance&#123;P&#125; + 150m</code>, etc.).
          </li>
          <li>
            <strong>Clamping at 12th / 24th Place:</strong> Promoted item pools are clamped at the final position pool
            (<strong>12th place</strong> in 12-player races, or <strong>24th place</strong> in 24-player races).
          </li>
        </ul>
        <p>
          To inspect the exact item pull percentages for each position and promoted tier, visit the companion
          site:{' '}
          <a
            href="https://liskadi.github.io/MKWorldItemProb/"
            target="_blank"
            rel="noopener noreferrer"
            className="companion-link"
          >
            MKWorldItemProb ↗
          </a>
        </p>
      </>
    ),
  },
  {
    id: 'how-lap-length-calculated',
    tag: 'Engine Lap Length',
    question: 'How does Mario Kart World calculate exact lap and course length in meters?',
    answer: (
      <>
        <p>
          By decompiling <code>sub_007e9610</code> (<code>0x007ea610..0x007eb77c</code>) and node initialization at{' '}
          <code>0x0298c980</code> in <code>main.elf</code>, we found that every course defines a directed{' '}
          <code>LapPathGraph</code> rail network in its <code>Banc</code> layout file:
        </p>
        <ul>
          <li>
            Each control point computes its segment length <code>node-&gt;seg_len</code> (<code>[node, #0x174]</code>)
            as the maximum 3D Euclidean distance to its outgoing neighbor points.
          </li>
          <li>
            Between consecutive checkpoints (from <code>IsStart</code> through each <code>CheckPoint</code> and{' '}
            <code>IsLapCheck</code> up to <code>IsGoal</code>), the engine accumulates branch distances and stores the
            total course/lap length <code>L_course</code> at <code>[LapPathGraph, #0x68]</code>.
          </li>
          <li>
            In <code>sub_00a7e140</code>, a racer&apos;s distance behind 1st place is computed directly as{' '}
            <code>(progress_1st - progress_racer) * L_course</code>.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'section-vs-lap-courses',
    tag: 'Section vs. Lap Courses',
    question: 'Why do some courses show "Varies" for Lap / Course Length in Section 02?',
    answer: (
      <>
        <p>
          While 35 of the 40 courses are closed circuits where you drive identical laps (3 laps on standard circuits, 5
          laps on Koopa Troopa Beach and the 10 SNES Patch courses), 5 courses in <em>Mario Kart World</em> are
          configured as <strong>multi-section courses</strong>:
        </p>
        <ul>
          <li>
            <strong>Crown City</strong> (3 Sections • <code>5,955.1m</code> total)
          </li>
          <li>
            <strong>DK Spaceport</strong> (6 Sections • <code>4,048.0m</code> total)
          </li>
          <li>
            <strong>Peach Beach</strong> (3 Sections • <code>4,643.5m</code> total)
          </li>
          <li>
            <strong>Mario Circuit</strong> (3 Sections • <code>3,143.0m</code> total)
          </li>
          <li>
            <strong>Rainbow Road</strong> (4 Sections • <code>14,468.7m</code> total)
          </li>
        </ul>
        <p>
          Because each section on these courses has its own distinct layout and length rather than a single repeating
          lap, the table lists their per-lap length as <strong>Varies</strong> (hover over <code>Varies</code> in the
          table or view the course in Section 01 to see each individual section&apos;s exact length).
        </p>
      </>
    ),
  },
  {
    id: 'colored-outlines-and-icons',
    tag: 'Icon & Color System',
    question: 'How do the colored outlines and ?, +1, and +2 icons on the map work?',
    answer: (
      <>
        <p>
          Each Item Box Set on a course (<code>Set #1</code>, <code>Set #2</code>, ...) is assigned its own distinct,
          high-contrast accent color in order of track progress from the start line:
        </p>
        <ul>
          <li>
            <strong>Item Box Set Icon (Golden <code>?</code> Box):</strong> Marks the physical location of the Item Box
            Set on the track, wrapped in a <strong>bold colored outline</strong> identifying that set.
          </li>
          <li>
            <strong>+250m &amp; +300m Promotion Markers (<code>+1</code> &amp; <code>+2</code>):</strong> Use the exact
            same rounded Item Box silhouette and the <strong>exact same colored outline</strong> as their originating
            Item Box Set so you can pair any Item Box Set with its <code>+250m (+1)</code> and <code>+300m (+2)</code>{' '}
            target zones at a glance.
          </li>
          <li>
            <strong>Interactive Isolation &amp; Zoom:</strong> Click any Item Box Set on the map or in the table to
            isolate only that set and its promotion path, and use the <code>−</code> / <code>Center</code> /{' '}
            <code>+</code> controls (or mouse wheel &amp; drag) to inspect tight corners up close.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'snes-patch-courses',
    tag: 'SNES Patch Courses',
    question: 'How do the 10 SNES Patch courses differ from the 30 standard courses?',
    answer: (
      <>
        <p>
          Patch <code>v1.8.0</code> added 10 classic SNES tribute courses (<em>SNES Mario Circuit 1–3</em>,{' '}
          <em>SNES Choco Island 1–2</em>, <em>SNES Ghost Valley 1–3</em>, <em>SNES Vanilla Lake 1</em>, and{' '}
          <em>SNES Koopa Beach 1</em>).
        </p>
        <p>
          All 10 SNES Patch courses are configured as <strong>5-lap circuits</strong> (<code>LapNum: 5</code>) and use
          flat ground <strong>? Block Panels</strong> (<code>CmnObj_HatenaBlockPanel000_A_00</code>, managed by{' '}
          <code>Obj_HatenaBlockPanelMgr</code>) instead of floating 3D Item Box cubes—including single-panel shortcut
          sets on corners and off-road cuts, just like in <em>Super Mario Kart</em>.
        </p>
      </>
    ),
  },
  {
    id: 'minimap-projection-and-splits',
    tag: 'Minimap Projection',
    question: 'How are 3D Item Box coordinates and split paths projected onto the 2D minimap?',
    answer: (
      <>
        <p>
          Each course&apos;s scene file defines a <code>MiniMapCamera</code> actor positioned above the track center with
          an orthogonal frustum width <code>CameraSizeX</code> and an up-vector orientation. Our pipeline projects 3D
          world coordinates <code>(X, Y, Z)</code> into the exact 2D camera basis used by the in-game HUD minimap
          renderer.
        </p>
        <p>
          When tracing <code>+250m</code> and <code>+300m</code> forward from an Item Box Set, the solver walks every
          outgoing branch of the <code>LapPathGraph</code> and interpolates along the actual 3D track geometry so that
          split paths and alternate routes are accurately represented.
        </p>
      </>
    ),
  },
];

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FaqModal: React.FC<FaqModalProps> = ({ isOpen, onClose }) => {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'what-is-mkworlddistancemaps': true,
    'why-250m-and-300m': true,
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    setOpenIds(Object.fromEntries(FAQ_ITEMS.map((it) => [it.id, true])));
  };

  const collapseAll = () => setOpenIds({});

  return (
    <div
      className="faq-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="faq-modal-title"
      onClick={onClose}
    >
      <div className="faq-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="faq-modal-header">
          <div className="faq-modal-title-group">
            <div className="section-eyebrow">REVERSE ENGINEERING &amp; METHODOLOGY FAQ</div>
            <h2 id="faq-modal-title">Frequently Asked Questions</h2>
            <p className="faq-modal-subtitle">
              How <strong>MKWorldDistanceMaps</strong> works and how <em>Mario Kart World</em> (<code>v1.8.0</code>) was
              decompiled by <strong>liskadi</strong>.
            </p>
          </div>

          <div className="faq-modal-actions">
            <button type="button" className="faq-action-btn" onClick={expandAll}>
              Expand All
            </button>
            <button type="button" className="faq-action-btn" onClick={collapseAll}>
              Collapse All
            </button>
            <button
              type="button"
              className="faq-close-btn"
              onClick={onClose}
              aria-label="Close FAQ Modal"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="faq-accordion-list">
          {FAQ_ITEMS.map((item, idx) => {
            const isExpanded = !!openIds[item.id];
            return (
              <div
                key={item.id}
                className={`faq-accordion-item ${isExpanded ? 'is-open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  aria-expanded={isExpanded}
                  onClick={() => toggleItem(item.id)}
                >
                  <span className="faq-q-index">Q{idx + 1}</span>
                  <span className="faq-q-text">{item.question}</span>
                  <span className="faq-q-tag">{item.tag}</span>
                  <span className="faq-chevron" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>

                <div className="faq-answer-wrapper" aria-hidden={!isExpanded}>
                  <div className="faq-answer-inner">
                    <div className="faq-answer-content">{item.answer}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="faq-modal-footer">
          <button type="button" className="faq-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
