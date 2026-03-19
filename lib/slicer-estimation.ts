import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { tmpdir } from "node:os";
import { basename, delimiter, extname, isAbsolute, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const PLA_DENSITY_G_PER_CM3 = 1.24;

export type SlicerEstimate = {
  estimatedTimeMinutes: number;
  estimatedTimeDisplay: string;
  materialGrams: number;
  source: "slicer";
};

type SlicerEngine = "cura" | "prusaslicer";

type SlicerCommand = {
  binary: string;
  args: string[];
};

type ExecutionResult = {
  stdout: string;
  stderr: string;
};

export class SlicerExecutionError extends Error {
  stdout?: string;
  stderr?: string;

  constructor(message: string, stdout?: string, stderr?: string) {
    super(message);
    this.name = "SlicerExecutionError";
    this.stdout = stdout;
    this.stderr = stderr;
  }
}

function round(value: number, precision = 2) {
  return Number(value.toFixed(precision));
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

function tokenizeArgs(value: string) {
  const tokens = value.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  return tokens.map((token) => token.replace(/^"(.*)"$/, "$1"));
}

function parseEstimatedTimeMinutes(gcode: string) {
  const curaTime = gcode.match(/^;TIME:(\d+)/m);
  if (curaTime) {
    return Math.max(1, Math.ceil(Number(curaTime[1]) / 60));
  }

  const prusaTime = gcode.match(/^;\s*estimated printing time.*=\s*(.+)$/im);
  if (!prusaTime) {
    return null;
  }

  const value = prusaTime[1] ?? "";
  const dayMatch = value.match(/(\d+)\s*d/i);
  const hourMatch = value.match(/(\d+)\s*h/i);
  const minuteMatch = value.match(/(\d+)\s*m/i);
  const secondMatch = value.match(/(\d+)\s*s/i);

  const totalMinutes =
    Number(dayMatch?.[1] ?? 0) * 24 * 60 +
    Number(hourMatch?.[1] ?? 0) * 60 +
    Number(minuteMatch?.[1] ?? 0) +
    Math.ceil(Number(secondMatch?.[1] ?? 0) / 60);

  return totalMinutes > 0 ? totalMinutes : null;
}

function parseMaterialGrams(gcode: string) {
  const directWeight =
    gcode.match(/^;\s*filament used \[g\]\s*=\s*([\d.]+)/im) ??
    gcode.match(/^;\s*Filament weight\s*=\s*([\d.]+)/im);

  if (directWeight) {
    return round(Number(directWeight[1]));
  }

  const volumeMatch =
    gcode.match(/^;\s*filament used \[cm3\]\s*=\s*([\d.]+)/im) ??
    gcode.match(/^;\s*Filament volume\s*=\s*([\d.]+)/im);

  if (volumeMatch) {
    return round(Number(volumeMatch[1]) * PLA_DENSITY_G_PER_CM3);
  }

  return null;
}

function getConfiguredEngine(): SlicerEngine | null {
  const engine = process.env.PRINT_SLICER_ENGINE?.toLowerCase();
  if (engine === "cura" || engine === "prusaslicer") {
    return engine;
  }

  return null;
}

export function isSlicerConfigured() {
  return Boolean(getConfiguredEngine());
}

function normalizeBinaryPath(value: string) {
  return value.trim().replace(/^"(.*)"$/, "$1");
}

async function existsExecutable(path: string) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveBinaryPath(binary: string) {
  const normalizedBinary = normalizeBinaryPath(binary);

  if (isAbsolute(normalizedBinary)) {
    const exists = await existsExecutable(normalizedBinary);
    if (!exists) {
      throw new SlicerExecutionError(
        `Configured slicer binary was not found at: ${normalizedBinary}`
      );
    }
    return normalizedBinary;
  }

  const pathEntries = (process.env.PATH ?? "").split(delimiter).filter(Boolean);
  const extensions =
    process.platform === "win32"
      ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT")
          .split(";")
          .filter(Boolean)
      : [""];

  for (const entry of pathEntries) {
    for (const extension of extensions) {
      const candidate = join(entry, normalizedBinary.endsWith(extension) ? normalizedBinary : `${normalizedBinary}${extension}`);
      if (await existsExecutable(candidate)) {
        return candidate;
      }
    }
  }

  throw new SlicerExecutionError(
    `Unable to resolve slicer binary "${normalizedBinary}" from PATH.`
  );
}

function buildSlicerCommand(
  engine: SlicerEngine,
  inputPath: string,
  outputPath: string
): SlicerCommand {
  const argsFromEnv = tokenizeArgs(process.env.PRINT_SLICER_ARGS ?? "");

  if (engine === "cura") {
    const binary = process.env.PRINT_SLICER_BIN ?? "CuraEngine";
    const args = ["slice", "-l", inputPath, "-o", outputPath, ...argsFromEnv];
    return { binary, args };
  }

  const binary = process.env.PRINT_SLICER_BIN ?? "prusa-slicer-console.exe";
  const args = ["--export-gcode", inputPath, "--output", outputPath, ...argsFromEnv];
  return { binary, args };
}

async function executeSlicer(command: SlicerCommand): Promise<ExecutionResult> {
  const resolvedBinary = await resolveBinaryPath(command.binary);

  console.info("[print/analyze] slicer command", {
    binary: resolvedBinary,
    args: command.args,
  });

  try {
    const result = await execFileAsync(resolvedBinary, command.args, {
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    });

    console.info("[print/analyze] slicer stdout", result.stdout || "(empty)");
    console.info("[print/analyze] slicer stderr", result.stderr || "(empty)");

    return {
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error) {
    const executionError = error as Error & {
      stdout?: string;
      stderr?: string;
      code?: string | number;
    };

    console.error("[print/analyze] slicer execution failed", {
      message: executionError.message,
      code: executionError.code,
      stdout: executionError.stdout || "(empty)",
      stderr: executionError.stderr || "(empty)",
    });

    throw new SlicerExecutionError(
      `Slicer execution failed: ${executionError.message}`,
      executionError.stdout,
      executionError.stderr
    );
  }
}

function ensureParsedMetadata(gcode: string) {
  const estimatedTimeMinutes = parseEstimatedTimeMinutes(gcode);
  const materialGrams = parseMaterialGrams(gcode);

  console.info("[print/analyze] parsed gcode metadata", {
    estimatedTimeMinutes,
    materialGrams,
  });

  if (!estimatedTimeMinutes || !materialGrams) {
    throw new SlicerExecutionError(
      "Slicer completed, but print time or material metadata could not be parsed from G-code."
    );
  }

  return {
    estimatedTimeMinutes,
    materialGrams,
  };
}

export async function estimateWithSlicer(
  file: File
): Promise<SlicerEstimate | null> {
  const engine = getConfiguredEngine();
  if (!engine) {
    return null;
  }

  const tempDir = await mkdtemp(join(tmpdir(), "creality-slice-"));
  const extension = extname(file.name) || ".stl";
  const safeBaseName = basename(file.name, extension).replace(/[^\w.-]+/g, "_");
  const inputPath = join(tempDir, `${safeBaseName}${extension}`);
  const outputPath = join(tempDir, "output.gcode");

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(inputPath, buffer);

    const command = buildSlicerCommand(engine, inputPath, outputPath);
    await executeSlicer(command);

    const gcode = await readFile(outputPath, "utf8");
    const metadata = ensureParsedMetadata(gcode);

    return {
      estimatedTimeMinutes: metadata.estimatedTimeMinutes,
      estimatedTimeDisplay: formatEstimatedTime(metadata.estimatedTimeMinutes),
      materialGrams: metadata.materialGrams,
      source: "slicer",
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
