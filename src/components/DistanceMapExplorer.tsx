import React, { useEffect, useMemo, useRef, useState } from 'react';
import { COURSES_DISTANCE_DATA } from '../data/distanceMapsData';
import { CourseDistanceData, ItemSetData } from '../types/distanceMap';

interface DistanceMapExplorerProps {
  selectedCourseIndex: number;
  onSelectCourse: (courseIndex: number) => void;
  selectedSetNumber: number | null;
  onSelectSetNumber: (setNumber: number | null) => void;
}

type ThresholdViewMode = 'both' | '250' | '300';

const CUP_FILTERS = [
  { id: 'ALL', label: 'All (40)' },
  { id: 'Mushroom Cup', label: 'Mushroom' },
  { id: 'Flower Cup', label: 'Flower' },
  { id: 'Star Cup', label: 'Star' },
  { id: 'Shell', label: 'Shell' },
  { id: 'Banana Cup', label: 'Banana' },
  { id: 'Leaf Cup', label: 'Leaf' },
  { id: 'Lightning Cup', label: 'Lightning' },
  { id: 'Special', label: 'Special' },
  { id: 'Patch v1.8.0', label: 'SNES Patch' },
];

const matchesCupFilter = (c: CourseDistanceData, filterId: string): boolean => {
  if (filterId === 'ALL') return true;
  if (filterId === 'Patch v1.8.0') return c.category === 'Patch v1.8.0';
  return c.cup.includes(filterId);
};

const clampPan = (nx: number, ny: number, z: number) => {
  const maxPan = Math.max(0, 500 - 500 / z);
  return {
    x: Math.max(-maxPan, Math.min(maxPan, nx)),
    y: Math.max(-maxPan, Math.min(maxPan, ny)),
  };
};

export const DistanceMapExplorer: React.FC<DistanceMapExplorerProps> = ({
  selectedCourseIndex,
  onSelectCourse,
  selectedSetNumber,
  onSelectSetNumber,
}) => {
  const [cupFilter, setCupFilter] = useState('ALL');
  const [thresholdMode, setThresholdMode] = useState<ThresholdViewMode>('both');
  const [hoveredSetNumber, setHoveredSetNumber] = useState<number | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const didDragMoveRef = useRef(false);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }, [selectedCourseIndex]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      setZoom((prev) => {
        const next = Math.max(1, Math.min(4, +(prev + delta).toFixed(2)));
        setPan((p) => clampPan(p.x, p.y, next));
        return next;
      });
    };

    el.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', onNativeWheel);
  }, []);

  const stepZoom = (delta: number) => {
    setZoom((prev) => {
      const next = Math.max(1, Math.min(4, +(prev + delta).toFixed(2)));
      setPan((p) => clampPan(p.x, p.y, next));
      return next;
    });
  };

  const handleCenterMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  const beginDrag = (clientX: number, clientY: number) => {
    didDragMoveRef.current = false;
    setIsDragging(true);
    dragStartRef.current = { clientX, clientY, panX: pan.x, panY: pan.y };
  };

  const moveDrag = (clientX: number, clientY: number) => {
    const start = dragStartRef.current;
    const svg = svgRef.current;
    if (!isDragging || !start || !svg) return;

    const dxPx = clientX - start.clientX;
    const dyPx = clientY - start.clientY;
    if (Math.hypot(dxPx, dyPx) > 4) {
      didDragMoveRef.current = true;
    }

    const rect = svg.getBoundingClientRect();
    const vw = 1000 / zoom;
    setPan(
      clampPan(
        start.panX + dxPx * (vw / rect.width),
        start.panY + dyPx * (vw / rect.height),
        zoom
      )
    );
  };

  const endDrag = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const viewBoxStr = useMemo(() => {
    const vw = 1000 / zoom;
    const c = clampPan(pan.x, pan.y, zoom);
    const vx = 500 - vw / 2 - c.x;
    const vy = 500 - vw / 2 - c.y;
    return `${vx.toFixed(2)} ${vy.toFixed(2)} ${vw.toFixed(2)} ${vw.toFixed(2)}`;
  }, [zoom, pan]);

  const course = useMemo(
    () =>
      COURSES_DISTANCE_DATA.find((c) => c.index === selectedCourseIndex) ??
      COURSES_DISTANCE_DATA[0],
    [selectedCourseIndex]
  );

  const filteredCourses = useMemo(
    () => COURSES_DISTANCE_DATA.filter((c) => matchesCupFilter(c, cupFilter)),
    [cupFilter]
  );

  const activeSpotlightSet = hoveredSetNumber ?? selectedSetNumber;
  const invZoom = 1 / zoom;
  const baseIconScale = course.courseId === 'Race_Rainbow_A_00' ? 0.76 : 1;
  const iconScale = baseIconScale * invZoom;

  const getZoomedBadgePos = (
    anchor: [number, number],
    badge: [number, number]
  ): [number, number] => [
    anchor[0] + (badge[0] - anchor[0]) * invZoom,
    anchor[1] + (badge[1] - anchor[1]) * invZoom,
  ];

  const startGeometry = useMemo(() => {
    if (!course.startMarker) return null;
    const [sx, sy] = course.startMarker.pos2d;
    const [dx, dy] = course.startMarker.dir2d;
    const ax = sx + dx * 44 * invZoom;
    const ay = sy + dy * 44 * invZoom;
    const px = -dy;
    const py = dx;
    const tipX = ax + dx * 18 * invZoom;
    const tipY = ay + dy * 18 * invZoom;
    const leftX = ax - dx * 6 * invZoom + px * 12.5 * invZoom;
    const leftY = ay - dy * 6 * invZoom + py * 12.5 * invZoom;
    const rightX = ax - dx * 6 * invZoom - px * 12.5 * invZoom;
    const rightY = ay - dy * 6 * invZoom - py * 12.5 * invZoom;
    return {
      sx,
      sy,
      ax,
      ay,
      headPoints: `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`,
    };
  }, [course.startMarker, invZoom]);

  const handleCourseStep = (delta: number) => {
    const curPos = filteredCourses.findIndex((c) => c.index === course.index);
    const nextPos =
      curPos >= 0
        ? (curPos + delta + filteredCourses.length) % filteredCourses.length
        : 0;
    onSelectCourse(filteredCourses[nextPos].index);
    onSelectSetNumber(null);
  };

  const toggleSetIsolation = (setNum: number) => {
    if (didDragMoveRef.current) return;
    onSelectSetNumber(selectedSetNumber === setNum ? null : setNum);
  };

  const totalActors = useMemo(
    () => course.itemSets.reduce((acc, s) => acc + s.boxCount, 0),
    [course]
  );

  const unitLabel =
    course.itemSets[0]?.actorType === 'HatenaBlockPanel' ? 'panels' : 'boxes';

  const renderLeader = (
    s: ItemSetData,
    anchor: [number, number],
    badge: [number, number],
    opacity: number,
    key: string
  ) => {
    const [bx, by] = getZoomedBadgePos(anchor, badge);
    if (Math.hypot(bx - anchor[0], by - anchor[1]) <= 5 * invZoom) return null;
    return (
      <g key={key} style={{ opacity }}>
        <line
          x1={anchor[0]}
          y1={anchor[1]}
          x2={bx}
          y2={by}
          stroke="#0d1024"
          strokeWidth={4 * invZoom}
          strokeLinecap="round"
        />
        <line
          x1={anchor[0]}
          y1={anchor[1]}
          x2={bx}
          y2={by}
          stroke={s.colorHex}
          strokeWidth={2 * invZoom}
          strokeLinecap="round"
        />
        <circle
          cx={anchor[0]}
          cy={anchor[1]}
          r={4 * invZoom}
          fill={s.colorHex}
          stroke="#0d1024"
          strokeWidth={1.8 * invZoom}
        />
      </g>
    );
  };

  const renderThresholdBadge = (
    s: ItemSetData,
    anchor: [number, number],
    badge: [number, number],
    distType: '250' | '300',
    isHighlighted: boolean,
    opacity: number,
    key: string
  ) => {
    const [bx, by] = getZoomedBadgePos(anchor, badge);
    const r = isHighlighted ? 16.5 : 14.5;
    const innerR = r - 3.5;
    const is300 = distType === '300';
    const tierLabel = is300 ? '+2' : '+1';

    return (
      <g
        key={key}
        transform={`translate(${bx}, ${by}) rotate(${-rotation}) scale(${iconScale})`}
        style={{ opacity, cursor: 'pointer' }}
        onMouseEnter={() => setHoveredSetNumber(s.setNumber)}
        onMouseLeave={() => setHoveredSetNumber(null)}
        onClick={() => toggleSetIsolation(s.setNumber)}
      >
        <title>{`Item Set #${s.setNumber} → +${distType}m Ahead (${tierLabel})`}</title>
        <rect
          x={-r - 2.5}
          y={-r - 2.5}
          width={(r + 2.5) * 2}
          height={(r + 2.5) * 2}
          rx={7}
          fill="#090c1a"
        />
        <rect
          x={-r}
          y={-r}
          width={r * 2}
          height={r * 2}
          rx={5.5}
          fill={s.colorHex}
        />
        <rect
          x={-innerR}
          y={-innerR}
          width={innerR * 2}
          height={innerR * 2}
          rx={3.5}
          fill={is300 ? '#211438' : '#122238'}
          stroke="rgba(255,255,255,0.65)"
          strokeWidth={1}
        />
        <text
          x={0}
          y={4.5}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={isHighlighted ? '13.5' : '12'}
          fontWeight="800"
          fontFamily="'JetBrains Mono', monospace"
        >
          {tierLabel}
        </text>
      </g>
    );
  };

  return (
    <section id="section-explorer" className="panel-card">
      <div className="panel-header">
        <div className="panel-title-group">
          <div className="section-eyebrow">01 • DISTANCE MAPS</div>
          <h2>Interactive Item Distance Maps</h2>
          <p className="panel-desc">
            Switch between maps and inspect either overall map distance or item
            set distance. Click any set element to isolate on the map.
          </p>
        </div>

        <div className="header-controls">
          <div className="control-box">
            <span className="control-label">Promotion Markers</span>
            <div className="segmented-switch" role="group" aria-label="Promotion Markers">
              <button
                type="button"
                className={`seg-btn ${thresholdMode === 'both' ? 'active' : ''}`}
                onClick={() => setThresholdMode('both')}
              >
                <span className="seg-dot" /> 250m &amp; 300m
              </button>
              <button
                type="button"
                className={`seg-btn ${thresholdMode === '250' ? 'active' : ''}`}
                onClick={() => setThresholdMode('250')}
              >
                <span className="seg-dot" /> 250m (+1)
              </button>
              <button
                type="button"
                className={`seg-btn ${thresholdMode === '300' ? 'active' : ''}`}
                onClick={() => setThresholdMode('300')}
              >
                <span className="seg-dot" /> 300m (+2)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="explorer-top-bar">
        <div className="cup-filter-pills">
          {CUP_FILTERS.map((cf) => (
            <button
              key={cf.id}
              type="button"
              className={`cup-pill-btn ${cupFilter === cf.id ? 'active' : ''}`}
              onClick={() => {
                setCupFilter(cf.id);
                const matches = COURSES_DISTANCE_DATA.filter((c) =>
                  matchesCupFilter(c, cf.id)
                );
                if (matches.length > 0 && !matches.some((m) => m.index === course.index)) {
                  onSelectCourse(matches[0].index);
                  onSelectSetNumber(null);
                }
              }}
            >
              {cf.label}
            </button>
          ))}
        </div>

        <div className="course-picker-row">
          <div className="course-select-group">
            <button
              type="button"
              className="step-nav-btn"
              onClick={() => handleCourseStep(-1)}
              title="Previous Course"
            >
              ◀
            </button>
            <select
              className="sleek-select course-main-select"
              value={course.index}
              onChange={(e) => {
                onSelectCourse(Number(e.target.value));
                onSelectSetNumber(null);
              }}
            >
              {filteredCourses.map((c) => (
                <option key={c.courseId} value={c.index}>
                  #{String(c.index).padStart(2, '0')} — {c.displayName} ({c.cup})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="step-nav-btn"
              onClick={() => handleCourseStep(1)}
              title="Next Course"
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      <div className="explorer-split-grid">
        <div className="map-stage-card">
          <div className="map-stage-topbar">
            <div className="map-stage-title-wrap">
              <h2 className="map-stage-title">{course.displayName}</h2>
            </div>

            <div className="map-stage-actions">
              {selectedSetNumber !== null && (
                <button
                  type="button"
                  className="reset-set-btn"
                  onClick={() => onSelectSetNumber(null)}
                >
                  ✕ Show All Sets
                </button>
              )}

              <div
                className="map-zoom-controls"
                role="group"
                aria-label="Map Zoom & Rotation Controls"
              >
                <button
                  type="button"
                  className="zoom-ctrl-btn"
                  onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                  title="Rotate Map Counter-Clockwise (90°)"
                >
                  ↺
                </button>
                <button
                  type="button"
                  className="zoom-ctrl-btn zoom-divider-right"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate Map Clockwise (90°)"
                >
                  ↻
                </button>
                <button
                  type="button"
                  className="zoom-ctrl-btn"
                  onClick={() => stepZoom(-0.5)}
                  disabled={zoom <= 1}
                  title="Zoom Out"
                >
                  −
                </button>
                <button
                  type="button"
                  className="zoom-ctrl-btn zoom-center-btn"
                  onClick={handleCenterMap}
                  title="Reset Zoom, Rotation & Center Map"
                >
                  {zoom === 1 && pan.x === 0 && pan.y === 0 && rotation === 0
                    ? 'Center'
                    : `${Math.round(zoom * 100)}%${
                        rotation !== 0 ? ` • ${rotation}°` : ''
                      } • Center`}
                </button>
                <button
                  type="button"
                  className="zoom-ctrl-btn"
                  onClick={() => stepZoom(0.5)}
                  disabled={zoom >= 4}
                  title="Zoom In"
                >
                  +
                </button>
              </div>

              <a
                href={course.fullMapDownloadUrl}
                download
                className="download-map-btn"
                title="Download Full-HD PNG Distance Map"
              >
                Download PNG
              </a>
            </div>
          </div>

          {course.courseNote && (
            <div className="course-disclaimer-banner" role="note">
              <span className="disclaimer-badge">NOTE</span>
              <span>{course.courseNote}</span>
            </div>
          )}

          <div ref={viewportRef} className="svg-map-viewport">
            <svg
              ref={svgRef}
              viewBox={viewBoxStr}
              className={`interactive-distance-svg ${
                zoom > 1 ? (isDragging ? 'is-grabbing' : 'is-grabbable') : ''
              }`}
              aria-label={`Interactive Distance Map for ${course.displayName}`}
              onMouseDown={(e) => {
                if (e.button === 0) beginDrag(e.clientX, e.clientY);
              }}
              onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              onTouchStart={(e) => {
                if (zoom > 1 && e.touches.length === 1) {
                  beginDrag(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 1) {
                  moveDrag(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchEnd={endDrag}
            >
              <defs>
                <filter
                  id="road-shadow"
                  x="-10%"
                  y="-10%"
                  width="120%"
                  height="120%"
                >
                  <feDropShadow
                    dx="3"
                    dy="5"
                    stdDeviation="6"
                    floodColor="#000000"
                    floodOpacity="0.65"
                  />
                </filter>
                <filter
                  id="badge-shadow"
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                >
                  <feDropShadow
                    dx="0"
                    dy="3"
                    stdDeviation="3"
                    floodColor="#000000"
                    floodOpacity="0.85"
                  />
                </filter>
              </defs>

              <g
                transform={
                  rotation !== 0 ? `rotate(${rotation}, 500, 500)` : undefined
                }
              >
                <image
                  href={course.minimapUrl}
                  x={course.imageRect.x}
                  y={course.imageRect.y}
                  width={course.imageRect.width}
                  height={course.imageRect.height}
                  filter="url(#road-shadow)"
                  preserveAspectRatio="none"
                />

                <g className="lappath-spine-layer">
                  {course.raceEdges2d.map((edge, idx) => (
                    <line
                      key={idx}
                      x1={edge[0][0]}
                      y1={edge[0][1]}
                      x2={edge[1][0]}
                      y2={edge[1][1]}
                      stroke="rgba(120, 155, 200, 0.35)"
                      strokeWidth={2.2 * invZoom}
                      strokeLinecap="round"
                    />
                  ))}
                </g>

                <g className="distance-traces-layer">
                  {course.itemSets.map((s) => {
                    const isDimmed =
                      activeSpotlightSet !== null &&
                      activeSpotlightSet !== s.setNumber;
                    const isHighlighted = activeSpotlightSet === s.setNumber;
                    const opacity = isDimmed ? 0.12 : isHighlighted ? 0.95 : 0.55;

                    return (
                      <g key={`trace-${s.setNumber}`} style={{ opacity }}>
                        {thresholdMode !== '300' &&
                          s.hits250.map((h250, bIdx) => (
                            <polyline
                              key={`p250-${bIdx}`}
                              points={h250.path2d
                                .map((p) => `${p[0]},${p[1]}`)
                                .join(' ')}
                              fill="none"
                              stroke={s.colorHex}
                              strokeWidth={(isHighlighted ? 7 : 4.5) * invZoom}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeDasharray={
                                isHighlighted
                                  ? `${10 * invZoom} ${6 * invZoom}`
                                  : undefined
                              }
                              className={
                                isHighlighted ? 'animated-trace-line' : ''
                              }
                            />
                          ))}
                        {thresholdMode !== '250' &&
                          s.hits300.map((h300, bIdx) => (
                            <polyline
                              key={`p300-${bIdx}`}
                              points={h300.path2d
                                .map((p) => `${p[0]},${p[1]}`)
                                .join(' ')}
                              fill="none"
                              stroke={s.colorHex}
                              strokeWidth={(isHighlighted ? 4.5 : 2.8) * invZoom}
                              strokeOpacity={0.75}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ))}
                      </g>
                    );
                  })}
                </g>

                {startGeometry && (
                  <g className="start-marker-layer" filter="url(#badge-shadow)">
                    <line
                      x1={startGeometry.sx}
                      y1={startGeometry.sy}
                      x2={startGeometry.ax}
                      y2={startGeometry.ay}
                      stroke="#0d1024"
                      strokeWidth={9 * invZoom}
                      strokeLinecap="round"
                    />
                    <line
                      x1={startGeometry.sx}
                      y1={startGeometry.sy}
                      x2={startGeometry.ax}
                      y2={startGeometry.ay}
                      stroke="#ffea3d"
                      strokeWidth={5 * invZoom}
                      strokeLinecap="round"
                    />
                    <polygon
                      points={startGeometry.headPoints}
                      fill="#ffea3d"
                      stroke="#0d1024"
                      strokeWidth={2.5 * invZoom}
                      strokeLinejoin="round"
                    />
                    <g
                      transform={`translate(${startGeometry.sx}, ${startGeometry.sy}) rotate(${-rotation}) scale(${invZoom})`}
                    >
                      <rect
                        x={-26}
                        y={-11.5}
                        width={52}
                        height={23}
                        rx={5.5}
                        fill="#0d1024"
                        stroke="#ffffff"
                        strokeWidth={2.2}
                      />
                      <text
                        x={0}
                        y={3.8}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10.5"
                        fontWeight="800"
                        fontFamily="'Kanit', sans-serif"
                        letterSpacing="0.06em"
                      >
                        START
                      </text>
                    </g>
                  </g>
                )}

                <g className="individual-boxes-layer">
                  {course.itemSets.map((s) => {
                    const isDimmed =
                      activeSpotlightSet !== null &&
                      activeSpotlightSet !== s.setNumber;
                    return (
                      <g
                        key={`boxes-${s.setNumber}`}
                        style={{ opacity: isDimmed ? 0.15 : 0.92 }}
                      >
                        {s.boxes2d.map((b, bIdx) => (
                          <circle
                            key={bIdx}
                            cx={b[0]}
                            cy={b[1]}
                            r={4.5 * invZoom}
                            fill="#ffd600"
                            stroke={s.colorHex}
                            strokeWidth={2 * invZoom}
                          />
                        ))}
                      </g>
                    );
                  })}
                </g>

                <g className="leader-lines-layer">
                  {course.itemSets.map((s) => {
                    const isDimmed =
                      activeSpotlightSet !== null &&
                      activeSpotlightSet !== s.setNumber;
                    const opacity = isDimmed ? 0.14 : 0.95;

                    return (
                      <React.Fragment key={`leaders-${s.setNumber}`}>
                        {renderLeader(
                          s,
                          s.anchor2d,
                          s.badge2d,
                          opacity,
                          `ldr-set-${s.setNumber}`
                        )}
                        {thresholdMode !== '300' &&
                          s.hits250.map((h, i) =>
                            renderLeader(
                              s,
                              h.anchor2d,
                              h.badge2d,
                              opacity,
                              `ldr-250-${s.setNumber}-${i}`
                            )
                          )}
                        {thresholdMode !== '250' &&
                          s.hits300.map((h, i) =>
                            renderLeader(
                              s,
                              h.anchor2d,
                              h.badge2d,
                              opacity,
                              `ldr-300-${s.setNumber}-${i}`
                            )
                          )}
                      </React.Fragment>
                    );
                  })}
                </g>

                <g className="threshold-badges-layer" filter="url(#badge-shadow)">
                  {course.itemSets.map((s) => {
                    const isDimmed =
                      activeSpotlightSet !== null &&
                      activeSpotlightSet !== s.setNumber;
                    const isHighlighted = activeSpotlightSet === s.setNumber;
                    const opacity = isDimmed ? 0.14 : 1;

                    return (
                      <React.Fragment key={`thresh-${s.setNumber}`}>
                        {thresholdMode !== '300' &&
                          s.hits250.map((h, i) =>
                            renderThresholdBadge(
                              s,
                              h.anchor2d,
                              h.badge2d,
                              '250',
                              isHighlighted,
                              opacity,
                              `b250-${s.setNumber}-${i}`
                            )
                          )}
                        {thresholdMode !== '250' &&
                          s.hits300.map((h, i) =>
                            renderThresholdBadge(
                              s,
                              h.anchor2d,
                              h.badge2d,
                              '300',
                              isHighlighted,
                              opacity,
                              `b300-${s.setNumber}-${i}`
                            )
                          )}
                      </React.Fragment>
                    );
                  })}
                </g>

                <g className="origin-sets-layer" filter="url(#badge-shadow)">
                  {course.itemSets.map((s) => {
                    const isDimmed =
                      activeSpotlightSet !== null &&
                      activeSpotlightSet !== s.setNumber;
                    const isHighlighted = activeSpotlightSet === s.setNumber;
                    const opacity = isDimmed ? 0.18 : 1;
                    const [bx, by] = getZoomedBadgePos(s.anchor2d, s.badge2d);
                    const r = isHighlighted ? 19 : 16.5;
                    const innerR = r - 4;

                    return (
                      <g
                        key={`origin-${s.setNumber}`}
                        transform={`translate(${bx}, ${by}) rotate(${-rotation}) scale(${iconScale})`}
                        style={{ opacity, cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredSetNumber(s.setNumber)}
                        onMouseLeave={() => setHoveredSetNumber(null)}
                        onClick={() => toggleSetIsolation(s.setNumber)}
                      >
                        <title>{`Item Box Set #${s.setNumber} (${s.distFromStartM}m)`}</title>
                        <rect
                          x={-r - 3}
                          y={-r - 3}
                          width={(r + 3) * 2}
                          height={(r + 3) * 2}
                          rx={8}
                          fill="#090c1a"
                        />
                        <rect
                          x={-r}
                          y={-r}
                          width={r * 2}
                          height={r * 2}
                          rx={6}
                          fill={s.colorHex}
                        />
                        <rect
                          x={-innerR}
                          y={-innerR}
                          width={innerR * 2}
                          height={innerR * 2}
                          rx={4}
                          fill="#ffd02d"
                          stroke="#191c24"
                          strokeWidth={1.2}
                        />
                        <text
                          x={0}
                          y={5.5}
                          textAnchor="middle"
                          fill="#14161e"
                          fontSize={isHighlighted ? '18' : '16'}
                          fontWeight="900"
                          fontFamily="'Kanit', sans-serif"
                        >
                          ?
                        </text>
                        <rect
                          x={r - 11}
                          y={-r - 7}
                          width={22}
                          height={15}
                          rx={5}
                          fill="#0f131c"
                          stroke={s.colorHex}
                          strokeWidth={2}
                        />
                        <text
                          x={r}
                          y={-r + 3.5}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="800"
                          fontFamily="'JetBrains Mono', monospace"
                        >
                          #{s.setNumber}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </g>
            </svg>
          </div>
        </div>

        <div className="telemetry-sidebar-card">
          <div className="telemetry-kpi-grid-2">
            <div className="telemetry-kpi-box">
              <span className="telemetry-kpi-label">
                {course.numSections === 1
                  ? '1-LAP LENGTH'
                  : `COURSE LENGTH (${course.numSections} SECTIONS)`}
              </span>
              <span className="telemetry-kpi-val">
                {course.engineCourseLengthM.toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })}{' '}
                m
              </span>
              <span className="telemetry-kpi-sub">
                {course.numSections === 1
                  ? `${course.totalRaceLengthM.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })} m total (${course.lapNum} laps)`
                  : course.sectionLengthsM
                      .map((l, i) => `S${i + 1}: ${Math.round(l)}m`)
                      .join(' • ')}
              </span>
            </div>

            <div className="telemetry-kpi-box">
              <span className="telemetry-kpi-label">ITEM BOX SETS</span>
              <span className="telemetry-kpi-val">
                {course.itemSets.length}{' '}
                {course.itemSets.length === 1 ? 'Set' : 'Sets'}
              </span>
              <span className="telemetry-kpi-sub">
                {totalActors} total {unitLabel} on track
              </span>
            </div>
          </div>

          <div className="icon-legend-card">
            <div className="icon-legend-grid">
              <div className="legend-item">
                <span className="legend-badge-demo origin-demo">?</span>
                <div>
                  <strong>Item Set #k</strong>
                  <small>Outline = Set color</small>
                </div>
              </div>
              <div className="legend-item">
                <span className="legend-badge-demo tier1-demo">+1</span>
                <div>
                  <strong>+250m Ahead</strong>
                  <small>Tier 1 Promotion</small>
                </div>
              </div>
              <div className="legend-item">
                <span className="legend-badge-demo tier2-demo">+2</span>
                <div>
                  <strong>+300m Ahead</strong>
                  <small>Tier 2 (+50m)</small>
                </div>
              </div>
            </div>

            <div className="companion-callout">
              <span>
                Want to see exact item pull odds once 1st place is 250m or 300m
                ahead?
              </span>
              <a
                href="https://liskadi.github.io/MKWorldItemProb/"
                target="_blank"
                rel="noopener noreferrer"
                className="companion-link"
              >
                Open MKWorldItemProb ↗
              </a>
            </div>
          </div>

          <div className="sets-table-container">
            <div className="sets-table-header">
              <h4>ITEM BOX SETS</h4>
              {selectedSetNumber !== null && (
                <button
                  type="button"
                  className="text-reset-btn"
                  onClick={() => onSelectSetNumber(null)}
                >
                  Show All
                </button>
              )}
            </div>

            <div className="sets-table-scroll">
              <table className="sets-breakdown-table">
                <thead>
                  <tr>
                    <th>SET</th>
                    <th>POSITION</th>
                    <th>+250m AHEAD</th>
                    <th>+300m AHEAD</th>
                  </tr>
                </thead>
                <tbody>
                  {course.itemSets.map((s: ItemSetData) => {
                    const isIsolated = selectedSetNumber === s.setNumber;
                    const isHovered = hoveredSetNumber === s.setNumber;
                    return (
                      <tr
                        key={s.setNumber}
                        className={`set-row ${isIsolated ? 'is-isolated' : ''} ${
                          isHovered ? 'is-hovered' : ''
                        }`}
                        onMouseEnter={() => setHoveredSetNumber(s.setNumber)}
                        onMouseLeave={() => setHoveredSetNumber(null)}
                        onClick={() => toggleSetIsolation(s.setNumber)}
                      >
                        <td>
                          <div className="set-badge-cell">
                            <span
                              className="set-color-bar"
                              style={{ background: s.colorHex }}
                            />
                            <span
                              className="mini-item-icon"
                              style={{ borderColor: s.colorHex }}
                            >
                              ?
                            </span>
                            <strong>Set #{s.setNumber}</strong>
                          </div>
                        </td>
                        <td className="mono-cell">
                          {Math.round(s.distFromStartM)} m
                        </td>
                        <td
                          className="mono-cell"
                          style={{ color: s.colorHex, fontWeight: 700 }}
                        >
                          {Math.round(s.d250TrackM)} m
                          {s.d250WrapsLap && (
                            <span className="wrap-pill">Next Lap</span>
                          )}
                        </td>
                        <td
                          className="mono-cell"
                          style={{ color: s.colorHex, fontWeight: 700 }}
                        >
                          {Math.round(s.d300TrackM)} m
                          {s.d300WrapsLap && (
                            <span className="wrap-pill">Next Lap</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {course.courseNote && (
              <div className="sets-table-footnote">
                <strong>*</strong> {course.courseNote}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
