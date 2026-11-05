export interface DistanceHitBranch {
  anchor2d: [number, number];
  badge2d: [number, number];
  path2d: [number, number][];
}

export interface ItemSetData {
  setNumber: number;
  colorHex: string;
  boxCount: number;
  actorType: 'ItemBox' | 'HatenaBlockPanel';
  sectionIdx: number;
  distFromStartM: number;
  lapPct: number;
  d250PhysicalM: number;
  d300PhysicalM: number;
  d250TrackM: number;
  d250WrapsLap: boolean;
  d300TrackM: number;
  d300WrapsLap: boolean;
  anchor2d: [number, number];
  badge2d: [number, number];
  boxes2d: [number, number][];
  hits250: DistanceHitBranch[];
  hits300: DistanceHitBranch[];
}

export interface CourseDistanceData {
  index: number;
  courseId: string;
  displayName: string;
  cup: string;
  category: 'Standard' | 'Patch v1.8.0';
  lapNum: number;
  numSections: number;
  numCheckpoints: number;
  engineCourseLengthM: number;
  totalRaceLengthM: number;
  sectionLengthsM: number[];
  camSizeXM: number;
  minimapUrl: string;
  fullMapDownloadUrl: string;
  imageRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  startMarker: {
    pos2d: [number, number];
    dir2d: [number, number];
  } | null;
  courseNote?: string;
  raceEdges2d: [[number, number], [number, number]][];
  itemSets: ItemSetData[];
}
