import {
  BufferGeometry,
  Mesh,
  Vector3,
  type Object3D,
} from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import {
  mergeGeometries,
  mergeVertices,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type SupportedModelExtension = "stl" | "obj";

export type ModelDimensions = {
  x: number;
  y: number;
  z: number;
};

export type ModelEstimate = {
  dimensions: ModelDimensions;
  volume: {
    mm3: number;
    cm3: number;
  };
  material: {
    density: number;
    grams: number;
  };
  estimatedTime: {
    minutes: number;
    display: string;
  };
  compatiblePrinters: PrinterMatch[];
};

export type PrinterMatch = {
  id: string;
  name: string;
  build_volume: string;
};

type PrinterProfile = PrinterMatch & {
  maxX: number;
  maxY: number;
  maxZ: number;
};

const PLA_DENSITY_G_PER_CM3 = 1.24;
const DEFAULT_INFILL = 0.2;
const DEFAULT_PRINT_SPEED_MM_PER_S = 50;
const DEFAULT_EXTRUSION_WIDTH_MM = 0.4;
const DEFAULT_LAYER_HEIGHT_MM = 0.2;
const DEFAULT_PRINT_EFFICIENCY = 0.72;
const DEFAULT_SETUP_MINUTES = 12;
const STL_LOADER = new STLLoader();
const OBJ_LOADER = new OBJLoader();

const PRINTER_PROFILES: PrinterProfile[] = [
  {
    id: "ender-3-v3",
    name: "Ender-3 V3",
    build_volume: "220 x 220 x 250 mm",
    maxX: 220,
    maxY: 220,
    maxZ: 250,
  },
  {
    id: "k1-se",
    name: "K1 SE",
    build_volume: "220 x 220 x 250 mm",
    maxX: 220,
    maxY: 220,
    maxZ: 250,
  },
  {
    id: "k1-max",
    name: "K1 Max",
    build_volume: "300 x 300 x 300 mm",
    maxX: 300,
    maxY: 300,
    maxZ: 300,
  },
  {
    id: "halot-mage",
    name: "HALOT Mage",
    build_volume: "228 x 128 x 230 mm",
    maxX: 228,
    maxY: 128,
    maxZ: 230,
  },
];

function round(value: number, precision = 2) {
  return Number(value.toFixed(precision));
}

function getExtension(fileName: string): SupportedModelExtension {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "stl" || extension === "obj") {
    return extension;
  }

  throw new Error("Unsupported file format. Only STL and OBJ files are accepted.");
}

function formatEstimatedTime(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function collectMeshGeometries(root: Object3D) {
  root.updateMatrixWorld(true);

  const geometries: BufferGeometry[] = [];

  root.traverse((child: Object3D) => {
    if (!(child instanceof Mesh)) {
      return;
    }

    const sourceGeometry = child.geometry;
    if (!(sourceGeometry instanceof BufferGeometry)) {
      return;
    }

    const geometry = sourceGeometry.clone();
    geometry.applyMatrix4(child.matrixWorld);

    if (!geometry.getAttribute("position")) {
      return;
    }

    geometries.push(geometry);
  });

  return geometries;
}

function parseSTLGeometry(buffer: ArrayBuffer) {
  const geometry = STL_LOADER.parse(buffer);
  if (!geometry.getAttribute("position")) {
    throw new Error("STL file does not contain geometry.");
  }

  return geometry;
}

function parseOBJGeometry(buffer: ArrayBuffer) {
  const text = new TextDecoder().decode(new Uint8Array(buffer));
  const object = OBJ_LOADER.parse(text);
  const geometries = collectMeshGeometries(object);

  if (geometries.length === 0) {
    throw new Error("OBJ file does not contain any mesh geometry.");
  }

  if (geometries.length === 1) {
    return geometries[0];
  }

  const merged = mergeGeometries(geometries, false);

  if (!merged) {
    throw new Error("Unable to merge OBJ mesh geometry.");
  }

  return merged;
}

function prepareGeometry(geometry: BufferGeometry) {
  const welded = mergeVertices(geometry.clone());
  welded.computeBoundingBox();

  if (!welded.boundingBox) {
    throw new Error("Unable to compute model bounds.");
  }

  const size = new Vector3();
  welded.boundingBox.getSize(size);

  if (Math.max(size.x, size.y, size.z) < 1) {
    welded.scale(1000, 1000, 1000);
  }

  const normalized = welded.toNonIndexed() ?? welded;
  normalized.computeBoundingBox();

  if (!normalized.boundingBox) {
    throw new Error("Unable to compute normalized model bounds.");
  }

  return normalized;
}

export function computeBoundingBoxDimensions(
  geometry: BufferGeometry
): ModelDimensions {
  geometry.computeBoundingBox();

  if (!geometry.boundingBox) {
    throw new Error("Unable to compute model bounds.");
  }

  const size = new Vector3();
  geometry.boundingBox.getSize(size);

  return {
    x: round(size.x),
    y: round(size.y),
    z: round(size.z),
  };
}

export function computeTriangleVolumeMm3(geometry: BufferGeometry) {
  const position = geometry.getAttribute("position");
  if (!position) {
    throw new Error("Geometry is missing position data.");
  }

  const triangleGeometry = geometry.index ? geometry.toNonIndexed() ?? geometry : geometry;
  const trianglePositions = triangleGeometry.getAttribute("position");

  let volume = 0;

  for (let i = 0; i < trianglePositions.count; i += 3) {
    const ax = trianglePositions.getX(i);
    const ay = trianglePositions.getY(i);
    const az = trianglePositions.getZ(i);
    const bx = trianglePositions.getX(i + 1);
    const by = trianglePositions.getY(i + 1);
    const bz = trianglePositions.getZ(i + 1);
    const cx = trianglePositions.getX(i + 2);
    const cy = trianglePositions.getY(i + 2);
    const cz = trianglePositions.getZ(i + 2);

    volume +=
      ax * (by * cz - bz * cy) -
      ay * (bx * cz - bz * cx) +
      az * (bx * cy - by * cx);
  }

  return Math.abs(volume / 6);
}

export function convertVolumeMm3ToCm3(volumeMm3: number) {
  return volumeMm3 / 1000;
}

export function calculateMaterialUsageGrams(
  volumeCm3: number,
  density = PLA_DENSITY_G_PER_CM3,
  infill = DEFAULT_INFILL
) {
  return volumeCm3 * density * infill;
}

export function estimatePrintTimeMinutes(
  volumeMm3: number,
  infill = DEFAULT_INFILL,
  speed = DEFAULT_PRINT_SPEED_MM_PER_S,
  extrusionWidth = DEFAULT_EXTRUSION_WIDTH_MM,
  layerHeight = DEFAULT_LAYER_HEIGHT_MM
) {
  const effectiveVolumeMm3 = volumeMm3 * infill;
  const flowRateMm3PerSecond = speed * extrusionWidth * layerHeight;

  if (flowRateMm3PerSecond <= 0) {
    throw new Error("Invalid print flow rate.");
  }

  const printSeconds =
    effectiveVolumeMm3 / (flowRateMm3PerSecond * DEFAULT_PRINT_EFFICIENCY);
  const rawMinutes = printSeconds / 60 + DEFAULT_SETUP_MINUTES;

  return Math.max(10, Math.ceil(rawMinutes));
}

function getCompatiblePrinters(dimensions: ModelDimensions) {
  return PRINTER_PROFILES.filter((printer) => {
    return (
      dimensions.x <= printer.maxX &&
      dimensions.y <= printer.maxY &&
      dimensions.z <= printer.maxZ
    );
  }).map(({ id, name, build_volume }) => ({
    id,
    name,
    build_volume,
  }));
}

export function parseModelGeometry(fileName: string, buffer: ArrayBuffer) {
  const extension = getExtension(fileName);
  if (extension === "stl") {
    return prepareGeometry(parseSTLGeometry(buffer));
  }

  return prepareGeometry(parseOBJGeometry(buffer));
}

export async function estimateModelFromFile(file: File): Promise<ModelEstimate> {
  const buffer = await file.arrayBuffer();
  const geometry = parseModelGeometry(file.name, buffer);
  const dimensions = computeBoundingBoxDimensions(geometry);
  const volumeMm3 = computeTriangleVolumeMm3(geometry);
  const volumeCm3 = convertVolumeMm3ToCm3(volumeMm3);
  const materialGrams = calculateMaterialUsageGrams(volumeCm3);
  const estimatedMinutes = estimatePrintTimeMinutes(volumeMm3);

  return {
    dimensions,
    volume: {
      mm3: round(volumeMm3, 2),
      cm3: round(volumeCm3, 3),
    },
    material: {
      density: PLA_DENSITY_G_PER_CM3,
      grams: round(materialGrams, 2),
    },
    estimatedTime: {
      minutes: estimatedMinutes,
      display: formatEstimatedTime(estimatedMinutes),
    },
    compatiblePrinters: getCompatiblePrinters(dimensions),
  };
}
