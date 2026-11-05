import React, { useMemo, useState } from 'react';
import {
  getPlacementThresholdRows,
  PlacementThresholdRow,
} from '../utils/promotionEngine';
import { useStickyThead } from '../utils/useStickyThead';

interface FarDistanceTableProps {
  onSelectDistanceFromTable: (distanceM: number, lobbySize: 12 | 24) => void;
}

export const FarDistanceTable: React.FC<FarDistanceTableProps> = ({
  onSelectDistanceFromTable,
}) => {
  const [lobbySize, setLobbySize] = useState<12 | 24>(12);
  const theadRef = useStickyThead<HTMLTableSectionElement>();

  const rows = useMemo(
    () => getPlacementThresholdRows(lobbySize),
    [lobbySize]
  );

  const renderTierCell = (
    distM: number | null,
    targetPosLabel: string,
    tierIdx: 1 | 2 | 3,
    row: PlacementThresholdRow
  ) => {
    if (distM === null) {
      return <span className="muted-dash">—</span>;
    }
    if (row.alreadyMaxBase) {
      return (
        <div className="fardist-cell-stack">
          <span className="fardist-meters is-clamped-muted">
            {distM.toLocaleString()} m
          </span>
          <span className="clamp-pill is-already-max">
            {row.maxPosLabel} (Already Max)
          </span>
        </div>
      );
    }

    const isFirstClamp = row.clampedAtTier === tierIdx;
    const isRedundantClamp =
      row.clampedAtTier !== null && tierIdx > row.clampedAtTier;

    return (
      <div className="fardist-cell-stack">
        <strong
          className={`fardist-meters ${
            isRedundantClamp ? 'is-clamped-muted' : ''
          }`}
        >
          {distM.toLocaleString()} m
        </strong>
        {isFirstClamp ? (
          <span className="clamp-pill is-max-hit">
            → {row.maxPosLabel} (Max)
          </span>
        ) : isRedundantClamp ? (
          <span className="clamp-pill is-clamped-cap">
            Clamped at {row.maxPosLabel}
          </span>
        ) : (
          <span className="rank-step-pill">→ {targetPosLabel}</span>
        )}
      </div>
    );
  };

  return (
    <section id="section-fardistance" className="panel-card">
      <div className="panel-header">
        <div className="panel-title-group">
          <div className="section-eyebrow">03 • Tier Promotion Threshold</div>
          <h2>FarDistance Table</h2>
          <p className="panel-desc">
            Distance behind <strong>1st place</strong> required for each
            position to unlock item tier promotions (<strong>+75m</strong> per
            additional tier, clamped at{' '}
            <strong>{lobbySize === 12 ? '12th' : '24th'}</strong>).
          </p>
        </div>

        <div className="header-controls">
          <div className="control-box">
            <span className="control-label">Race Lobby Size</span>
            <div
              className="segmented-switch"
              role="group"
              aria-label="Race Lobby Size Switch"
            >
              <button
                type="button"
                className={`seg-btn ${lobbySize === 12 ? 'active' : ''}`}
                onClick={() => setLobbySize(12)}
              >
                <span className="seg-dot" /> 12 Players (2nd–12th)
              </button>
              <button
                type="button"
                className={`seg-btn ${lobbySize === 24 ? 'active' : ''}`}
                onClick={() => setLobbySize(24)}
              >
                <span className="seg-dot" /> 24 Players (2nd–24th)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="ref-table-wrapper">
        <table className="ref-courses-table fardistance-table">
          <thead ref={theadRef}>
            <tr>
              <th>POSITION</th>
              <th>PARAMETER</th>
              <th>BASE POOL</th>
              <th>+1 TIER (FARDISTANCE)</th>
              <th>+2 TIERS (+75m)</th>
              <th>+3 TIERS (+150m)</th>
              <th>BASE → +1 PROMOTION &amp; CLAMPING</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.placement}
                className={`ref-course-row ${
                  row.alreadyMaxBase ? 'fardist-row-clamped' : ''
                }`}
                onClick={() => {
                  if (row.tier1M !== null) {
                    onSelectDistanceFromTable(row.tier1M, lobbySize);
                  }
                }}
                title={
                  row.tier1M !== null
                    ? `Click to preview +${row.tier1M}m (${row.ordinal} place) on the Distance Map`
                    : undefined
                }
              >
                <td className="mono-cell">
                  <span className="placement-badge">{row.ordinal}</span>
                </td>
                <td className="mono-cell">
                  <code className="param-code-badge">{row.paramName}</code>
                </td>
                <td className="mono-cell">
                  <span className="base-rank-badge">{row.basePosLabel}</span>
                </td>
                <td className="mono-cell">
                  {renderTierCell(row.tier1M, row.tier1PosLabel, 1, row)}
                </td>
                <td className="mono-cell">
                  {renderTierCell(row.tier2M, row.tier2PosLabel, 2, row)}
                </td>
                <td className="mono-cell">
                  {renderTierCell(row.tier3M, row.tier3PosLabel, 3, row)}
                </td>
                <td className="mono-cell">
                  {row.alreadyMaxBase ? (
                    <span className="clamp-summary-badge is-already-max">
                      {row.basePosLabel} → {row.maxPosLabel} (Clamped at Max)
                    </span>
                  ) : (
                    <div className="clamp-summary-wrap">
                      <span className="clamp-summary-badge">
                        {row.basePosLabel} → {row.tier1PosLabel}
                      </span>
                      {row.clampedAtTier !== null && (
                        <span className="clamp-cap-note">
                          Clamps at +{row.clampedAtTier} (
                          {(
                            (row.tier1M ?? 0) +
                            (row.clampedAtTier - 1) * 75
                          ).toLocaleString()}
                          m)
                        </span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
