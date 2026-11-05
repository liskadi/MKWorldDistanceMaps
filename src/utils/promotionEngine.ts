import {
  CourseDistanceData,
  DistanceHitBranch,
  ItemSetData,
} from '../types/distanceMap';

export const ADDITIONAL_FAR_DISTANCE_M = 75;

const BASE_POOL_24P: readonly number[] = [
  1, 2, 3, 4, 5, 6, 6, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 11, 11, 12,
];

const POOL_POSITIONS_24P: readonly string[] = [
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th–7th',
  '8th–10th',
  '11th–14th',
  '15th–18th',
  '19th–21st',
  '22nd–23rd',
  '24th',
];

export const formatOrdinal = (n: number): string => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
};

export const formatPoolPosition = (
  poolIdx: number,
  lobbySize: 12 | 24
): string =>
  lobbySize === 12 ? formatOrdinal(poolIdx) : POOL_POSITIONS_24P[poolIdx - 1];

export const getFarDistanceBaseM = (placement: number): number | null =>
  placement >= 2 && placement <= 23 ? 250 + (placement - 2) * 50 : null;

const getBasePoolIndex = (placement: number, lobbySize: 12 | 24): number =>
  lobbySize === 12 ? placement : BASE_POOL_24P[placement - 1];

export interface PlacementThresholdRow {
  placement: number;
  ordinal: string;
  paramName: string;
  tier1M: number | null;
  tier2M: number | null;
  tier3M: number | null;
  basePosLabel: string;
  tier1PosLabel: string;
  tier2PosLabel: string;
  tier3PosLabel: string;
  maxPosLabel: string;
  alreadyMaxBase: boolean;
  clampedAtTier: number | null;
}

export const getPlacementThresholdRows = (
  lobbySize: 12 | 24
): PlacementThresholdRow[] => {
  const rows: PlacementThresholdRow[] = [];
  const maxPosLabel = formatPoolPosition(12, lobbySize);

  for (let p = 2; p <= lobbySize; p++) {
    const tier1M = getFarDistanceBaseM(p);
    const tier2M = tier1M !== null ? tier1M + ADDITIONAL_FAR_DISTANCE_M : null;
    const tier3M =
      tier1M !== null ? tier1M + ADDITIONAL_FAR_DISTANCE_M * 2 : null;
    const basePool = getBasePoolIndex(p, lobbySize);
    const alreadyMaxBase = basePool >= 12;
    const tier1Pool = tier1M !== null ? Math.min(12, basePool + 1) : basePool;
    const tier2Pool = tier1M !== null ? Math.min(12, basePool + 2) : basePool;
    const tier3Pool = tier1M !== null ? Math.min(12, basePool + 3) : basePool;

    rows.push({
      placement: p,
      ordinal: formatOrdinal(p),
      paramName: tier1M !== null ? `FarDistance${p}` : '—',
      tier1M,
      tier2M,
      tier3M,
      basePosLabel: formatPoolPosition(basePool, lobbySize),
      tier1PosLabel: formatPoolPosition(tier1Pool, lobbySize),
      tier2PosLabel: formatPoolPosition(tier2Pool, lobbySize),
      tier3PosLabel: formatPoolPosition(tier3Pool, lobbySize),
      maxPosLabel,
      alreadyMaxBase,
      clampedAtTier: alreadyMaxBase || tier1M === null ? null : 12 - basePool,
    });
  }
  return rows;
};

export interface PlacementDistanceEval {
  placement: number;
  ordinal: string;
  paramName: string;
  farDistanceBaseM: number | null;
  effectiveShift: number;
  basePosLabel: string;
  promotedPosLabel: string;
  maxPosLabel: string;
  alreadyMaxBase: boolean;
  isClampedToMax: boolean;
}

export const evaluateAllPlacementsAtDistance = (
  distanceM: number,
  lobbySize: 12 | 24
): PlacementDistanceEval[] => {
  const maxPosLabel = formatPoolPosition(12, lobbySize);
  const out: PlacementDistanceEval[] = [];

  for (let p = 2; p <= lobbySize; p++) {
    const farDistanceBaseM = getFarDistanceBaseM(p);
    const basePool = getBasePoolIndex(p, lobbySize);
    const alreadyMaxBase = basePool >= 12;

    const rawShift =
      farDistanceBaseM !== null && distanceM >= farDistanceBaseM
        ? 1 +
          Math.floor((distanceM - farDistanceBaseM) / ADDITIONAL_FAR_DISTANCE_M)
        : 0;

    const promotedPool = Math.min(12, basePool + rawShift);

    out.push({
      placement: p,
      ordinal: formatOrdinal(p),
      paramName: farDistanceBaseM !== null ? `FarDistance${p}` : '—',
      farDistanceBaseM,
      effectiveShift: promotedPool - basePool,
      basePosLabel: formatPoolPosition(basePool, lobbySize),
      promotedPosLabel: formatPoolPosition(promotedPool, lobbySize),
      maxPosLabel,
      alreadyMaxBase,
      isClampedToMax: !alreadyMaxBase && rawShift > 0 && basePool + rawShift >= 12,
    });
  }
  return out;
};

const dist3d = (
  a: [number, number, number],
  b: [number, number, number]
): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const lerp3d = (
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const lerp2d = (
  a: [number, number],
  b: [number, number],
  t: number
): [number, number] => [
  Math.round((a[0] + (b[0] - a[0]) * t) * 100) / 100,
  Math.round((a[1] + (b[1] - a[1]) * t) * 100) / 100,
];

interface RawBranchHit {
  hit3d: [number, number, number];
  anchor2d: [number, number];
  path2d: [number, number][];
}

const traceForwardOnGraph = (
  course: CourseDistanceData,
  set: ItemSetData,
  targetDist3d: number
): RawBranchHit[] => {
  const { nodes, hasGoal } = course.pathGraph;
  const nodeU0 = nodes[set.edgeU];
  const nodeV0 = nodes[set.edgeV];
  const startT = set.edgeT;

  const pStart2d = lerp2d(nodeU0.pos2d, nodeV0.pos2d, startT);
  const seg0Len = dist3d(nodeU0.pos3d, nodeV0.pos3d);
  const remOnFirst = (1 - startT) * seg0Len;

  if (targetDist3d <= remOnFirst && seg0Len > 1e-6) {
    const tEnd = startT + targetDist3d / seg0Len;
    const pEnd3d = lerp3d(nodeU0.pos3d, nodeV0.pos3d, tEnd);
    const pEnd2d = lerp2d(nodeU0.pos2d, nodeV0.pos2d, tEnd);
    return [{ hit3d: pEnd3d, anchor2d: pEnd2d, path2d: [pStart2d, pEnd2d] }];
  }

  const results: RawBranchHit[] = [];
  const queue = [
    {
      currIdx: set.edgeV,
      accD: remOnFirst,
      poly2d: [pStart2d, nodeV0.pos2d] as [number, number][],
      depth: 0,
    },
  ];

  for (let head = 0; head < queue.length; head++) {
    const { currIdx, accD, poly2d, depth } = queue[head];
    if (depth > 180) continue;
    const currNode = nodes[currIdx];
    if (hasGoal && currNode.isGoal) continue;

    for (const nxtIdx of currNode.out) {
      const nxtNode = nodes[nxtIdx];
      const edgeLen = dist3d(currNode.pos3d, nxtNode.pos3d);
      if (edgeLen < 1e-6) continue;

      if (accD + edgeLen >= targetDist3d) {
        const tHit = Math.max(0, Math.min(1, (targetDist3d - accD) / edgeLen));
        const pHit3d = lerp3d(currNode.pos3d, nxtNode.pos3d, tHit);
        const pHit2d = lerp2d(currNode.pos2d, nxtNode.pos2d, tHit);
        results.push({
          hit3d: pHit3d,
          anchor2d: pHit2d,
          path2d: [...poly2d, pHit2d],
        });
      } else {
        queue.push({
          currIdx: nxtIdx,
          accD: accD + edgeLen,
          poly2d: [...poly2d, nxtNode.pos2d],
          depth: depth + 1,
        });
      }
    }
  }

  const deduped: RawBranchHit[] = [];
  for (const cand of results) {
    if (!deduped.some((ex) => dist3d(cand.hit3d, ex.hit3d) < 8)) {
      deduped.push(cand);
    }
  }
  return deduped;
};

export interface DynamicMarkerSpec {
  id: string;
  badgeText: string;
  distanceM: number;
  variant: 'primary' | 'secondary';
}

export interface DynamicSetThresholdResult {
  specId: string;
  badgeText: string;
  distanceM: number;
  trackM: number;
  wrapsLap: boolean;
  variant: 'primary' | 'secondary';
  hits: DistanceHitBranch[];
}

export interface DynamicSetLayout {
  setNumber: number;
  originBadge2d: [number, number];
  thresholds: DynamicSetThresholdResult[];
}

interface RepulsionMarker {
  key: string;
  x: number;
  y: number;
  radius: number;
  drawX: number;
  drawY: number;
}

const resolveBadgePositions2D = (
  markers: RepulsionMarker[],
  fixedObstacles: { x: number; y: number; r: number }[],
  minDist: number,
  bounds: [number, number, number, number]
): void => {
  const n = markers.length;
  const [x0, y0, x1, y1] = bounds;

  for (let it = 0; it < 120; it++) {
    const tether = it < 90 ? 0.06 : 0;
    for (let i = 0; i < n; i++) {
      markers[i].drawX += (markers[i].x - markers[i].drawX) * tether;
      markers[i].drawY += (markers[i].y - markers[i].drawY) * tether;
    }

    for (let i = 0; i < n; i++) {
      for (const obs of fixedObstacles) {
        let dx = markers[i].drawX - obs.x;
        let dy = markers[i].drawY - obs.y;
        let d = Math.hypot(dx, dy);
        const req = obs.r + markers[i].radius + 8;
        if (d < req) {
          if (d < 1e-3) {
            dx = 0;
            dy = -1;
            d = 1;
          }
          const push = (req - d) * 0.85;
          markers[i].drawX += (dx / d) * push;
          markers[i].drawY += (dy / d) * push;
        }
      }
    }

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = markers[i].drawX - markers[j].drawX;
        let dy = markers[i].drawY - markers[j].drawY;
        let d = Math.hypot(dx, dy);
        const req = Math.max(
          markers[i].radius + markers[j].radius + 10,
          minDist
        );
        if (d < req) {
          if (d < 1e-3) {
            const angle = (i * 1.618 + j) * Math.PI;
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            d = 1;
          }
          const push = (req - d) * 0.52;
          const ux = dx / d;
          const uy = dy / d;
          markers[i].drawX += ux * push;
          markers[i].drawY += uy * push;
          markers[j].drawX -= ux * push;
          markers[j].drawY -= uy * push;
        }
      }
    }

    for (let i = 0; i < n; i++) {
      markers[i].drawX = Math.max(x0, Math.min(x1, markers[i].drawX));
      markers[i].drawY = Math.max(y0, Math.min(y1, markers[i].drawY));
    }
  }
};

export const computeDynamicCourseLayout = (
  course: CourseDistanceData,
  specs: DynamicMarkerSpec[]
): Map<number, DynamicSetLayout> => {
  const isRainbow = course.courseId === 'Race_Rainbow_A_00';
  const setRad = isRainbow ? 13.5 : 17;
  const thrRad = isRainbow ? 11.5 : 15;
  const minSep = isRainbow ? 28 : 38;

  const fixedObstacles = course.startMarker
    ? [
        {
          x: course.startMarker.pos2d[0],
          y: course.startMarker.pos2d[1],
          r: 24,
        },
      ]
    : [];

  const repulsionMarkers: RepulsionMarker[] = [];
  const rawTracesBySet = new Map<
    number,
    {
      spec: DynamicMarkerSpec;
      trackM: number;
      wrapsLap: boolean;
      rawHits: RawBranchHit[];
    }[]
  >();

  for (const s of course.itemSets) {
    repulsionMarkers.push({
      key: `set-${s.setNumber}`,
      x: s.anchor2d[0],
      y: s.anchor2d[1],
      radius: setRad,
      drawX: s.anchor2d[0],
      drawY: s.anchor2d[1],
    });

    const setSpecsOut = specs.map((spec) => {
      const physicalDistM = spec.distanceM * s.scaleFactor;
      const isSingleSection =
        course.numSections === 1 && course.engineCourseLengthM > 0;
      const trackM = isSingleSection
        ? (s.distFromStartM + spec.distanceM) % course.engineCourseLengthM
        : Math.min(
            course.engineCourseLengthM,
            s.distFromStartM + physicalDistM
          );
      const wrapsLap =
        isSingleSection &&
        s.distFromStartM + spec.distanceM >= course.engineCourseLengthM;

      const rawHits = traceForwardOnGraph(course, s, physicalDistM);
      rawHits.forEach((h, bIdx) => {
        repulsionMarkers.push({
          key: `thr-${s.setNumber}-${spec.id}-${bIdx}`,
          x: h.anchor2d[0],
          y: h.anchor2d[1],
          radius: thrRad,
          drawX: h.anchor2d[0],
          drawY: h.anchor2d[1],
        });
      });

      return { spec, trackM, wrapsLap, rawHits };
    });

    rawTracesBySet.set(s.setNumber, setSpecsOut);
  }

  resolveBadgePositions2D(repulsionMarkers, fixedObstacles, minSep, [
    28,
    28,
    972,
    972,
  ]);

  const badgePosByKey = new Map<string, [number, number]>(
    repulsionMarkers.map((m) => [
      m.key,
      [Math.round(m.drawX * 100) / 100, Math.round(m.drawY * 100) / 100],
    ])
  );

  const layoutMap = new Map<number, DynamicSetLayout>();
  for (const s of course.itemSets) {
    const originBadge2d = badgePosByKey.get(`set-${s.setNumber}`)!;
    const setSpecsOut = rawTracesBySet.get(s.setNumber)!;

    layoutMap.set(s.setNumber, {
      setNumber: s.setNumber,
      originBadge2d,
      thresholds: setSpecsOut.map((entry) => ({
        specId: entry.spec.id,
        badgeText: entry.spec.badgeText,
        distanceM: entry.spec.distanceM,
        trackM: entry.trackM,
        wrapsLap: entry.wrapsLap,
        variant: entry.spec.variant,
        hits: entry.rawHits.map((rh, bIdx) => ({
          anchor2d: rh.anchor2d,
          badge2d: badgePosByKey.get(
            `thr-${s.setNumber}-${entry.spec.id}-${bIdx}`
          )!,
          path2d: rh.path2d,
        })),
      })),
    });
  }

  return layoutMap;
};
