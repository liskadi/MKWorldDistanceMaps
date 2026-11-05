import React, { useMemo, useState } from 'react';
import { COURSES_DISTANCE_DATA } from '../data/distanceMapsData';
import { CourseDistanceData } from '../types/distanceMap';
import { useStickyThead } from '../utils/useStickyThead';

interface CourseReferenceTableProps {
  selectedCourseIndex: number;
  onSelectCourseFromTable: (courseIndex: number) => void;
}

type SortField =
  | 'index'
  | 'displayName'
  | 'engineCourseLengthM'
  | 'totalRaceLengthM'
  | 'itemSetCount';

const formatMeters = (val: number) =>
  val.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

const compareCourses = (
  a: CourseDistanceData,
  b: CourseDistanceData,
  field: SortField
): number => {
  switch (field) {
    case 'index':
      return a.index - b.index;
    case 'displayName':
      return a.displayName.localeCompare(b.displayName);
    case 'engineCourseLengthM': {
      const aLen = a.numSections === 1 ? a.engineCourseLengthM : -1;
      const bLen = b.numSections === 1 ? b.engineCourseLengthM : -1;
      return aLen - bLen;
    }
    case 'totalRaceLengthM':
      return a.totalRaceLengthM - b.totalRaceLengthM;
    case 'itemSetCount':
      return a.itemSets.length - b.itemSets.length;
  }
};

export const CourseReferenceTable: React.FC<CourseReferenceTableProps> = ({
  selectedCourseIndex,
  onSelectCourseFromTable,
}) => {
  const [catFilter, setCatFilter] = useState<'ALL' | 'Standard' | 'Patch v1.8.0'>('ALL');
  const [sortField, setSortField] = useState<SortField>('index');
  const [sortAsc, setSortAsc] = useState(true);
  const [query, setQuery] = useState('');
  const theadRef = useStickyThead<HTMLTableSectionElement>();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(field === 'index' || field === 'displayName');
    }
  };

  const sortIndicator = (field: SortField) =>
    sortField === field ? (sortAsc ? ' ▲' : ' ▼') : '';

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COURSES_DISTANCE_DATA.filter((c) => {
      if (catFilter !== 'ALL' && c.category !== catFilter) return false;
      return (
        !q ||
        c.displayName.toLowerCase().includes(q) ||
        c.cup.toLowerCase().includes(q)
      );
    }).sort((a, b) => {
      const cmp = compareCourses(a, b, sortField);
      return sortAsc ? cmp : -cmp;
    });
  }, [catFilter, query, sortField, sortAsc]);

  return (
    <section id="section-reference" className="panel-card">
      <div className="panel-header">
        <div className="panel-title-group">
          <div className="section-eyebrow">02 • COURSE LENGTHS &amp; ITEM SETS</div>
          <h2>All 40 Courses</h2>
          <p className="panel-desc">
            Click any course row to open its interactive Distance Map above.
          </p>
        </div>

        <div className="header-controls">
          <div className="control-box">
            <span className="control-label">Category Filter</span>
            <div className="segmented-switch" role="group" aria-label="Course Category Filter">
              <button
                type="button"
                className={`seg-btn ${catFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setCatFilter('ALL')}
              >
                <span className="seg-dot" /> All (40)
              </button>
              <button
                type="button"
                className={`seg-btn ${catFilter === 'Standard' ? 'active' : ''}`}
                onClick={() => setCatFilter('Standard')}
              >
                <span className="seg-dot" /> Standard (30)
              </button>
              <button
                type="button"
                className={`seg-btn ${catFilter === 'Patch v1.8.0' ? 'active' : ''}`}
                onClick={() => setCatFilter('Patch v1.8.0')}
              >
                <span className="seg-dot" /> SNES Patch (10)
              </button>
            </div>
          </div>

          <div className="control-box">
            <label className="control-label" htmlFor="course-search-input">
              Quick Search
            </label>
            <input
              id="course-search-input"
              type="text"
              className="sleek-input"
              placeholder="Search course or cup..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="ref-table-wrapper">
        <table className="ref-courses-table">
          <thead ref={theadRef}>
            <tr>
              <th onClick={() => handleSort('index')} className="sortable-th">
                #{sortIndicator('index')}
              </th>
              <th onClick={() => handleSort('displayName')} className="sortable-th">
                COURSE{sortIndicator('displayName')}
              </th>
              <th>CUP</th>
              <th>FORMAT</th>
              <th
                onClick={() => handleSort('engineCourseLengthM')}
                className="sortable-th right-th"
              >
                LAP / COURSE LENGTH{sortIndicator('engineCourseLengthM')}
              </th>
              <th
                onClick={() => handleSort('totalRaceLengthM')}
                className="sortable-th right-th"
              >
                TOTAL RACE{sortIndicator('totalRaceLengthM')}
              </th>
              <th onClick={() => handleSort('itemSetCount')} className="sortable-th">
                ITEM BOX SETS{sortIndicator('itemSetCount')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const isSelected = c.index === selectedCourseIndex;
              const isSectionTrack = c.numSections > 1;
              const sectionTooltip = isSectionTrack
                ? c.sectionLengthsM
                    .map((l, i) => `Section ${i + 1}: ${l.toFixed(1)}m`)
                    .join(' • ')
                : undefined;

              return (
                <tr
                  key={c.courseId}
                  className={`ref-course-row ${isSelected ? 'active-row' : ''}`}
                  onClick={() => onSelectCourseFromTable(c.index)}
                >
                  <td className="mono-cell">
                    <span className="course-idx-badge">
                      #{String(c.index).padStart(2, '0')}
                    </span>
                  </td>
                  <td>
                    <strong className="ref-course-name">{c.displayName}</strong>
                  </td>
                  <td>
                    <span className="cup-tag">{c.cup}</span>
                  </td>
                  <td className="mono-cell">
                    {isSectionTrack
                      ? `${c.numSections} Sections`
                      : `${c.lapNum} Laps`}
                  </td>
                  <td className="mono-cell right-td" title={sectionTooltip}>
                    {isSectionTrack ? (
                      <span className="varies-label">Varies</span>
                    ) : (
                      <>
                        <strong>{formatMeters(c.engineCourseLengthM)}m</strong>
                        {' / lap'}
                      </>
                    )}
                  </td>
                  <td className="mono-cell right-td">
                    {formatMeters(c.totalRaceLengthM)}m
                  </td>
                  <td>
                    <div className="ref-sets-swatches">
                      <span className="sets-count-label">
                        {c.itemSets.length}{' '}
                        {c.itemSets.length === 1 ? 'Set' : 'Sets'}
                      </span>
                      <div className="swatch-dots-row">
                        {c.itemSets.map((s) => (
                          <span
                            key={s.setNumber}
                            className="set-swatch-icon"
                            style={{ borderColor: s.colorHex }}
                            title={`Set #${s.setNumber}: ${s.distFromStartM.toFixed(0)}m`}
                          >
                            ?
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
