export interface DistanceHitBranch {
  anchor2d: [number, number];
  badge2d: [number, number];
  path2d: [number, number][];
}

export interface PathGraphNode {
  pos3d: [number, number, number];
  pos2d: [number, number];
  out: number[];
  isGoal: boolean;
}

export interface CoursePathGraph {
  hasGoal: boolean;
  nodes: PathGraphNode[];
}

export interface ItemSetData {
  setNumber: number;
  colorHex: string;
  boxCount: number;
  actorType: 'ItemBox' | 'HatenaBlockPanel';
  distFromStartM: number;
  edgeU: number;
  edgeV: number;
  edgeT: number;
  scaleFactor: number;
  anchor2d: [number, number];
  boxes2d: [number, number][];
}

export interface CourseDistanceData {
  index: number;
  courseId: string;
  displayName: string;
  cup: string;
  category: 'Standard' | 'Patch v1.8.0';
  lapNum: number;
  numSections: number;
  engineCourseLengthM: number;
  totalRaceLengthM: number;
  sectionLengthsM: number[];
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
  pathGraph: CoursePathGraph;
  itemSets: ItemSetData[];
}
