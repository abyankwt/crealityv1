import { NextResponse, type NextRequest } from "next/server";
import {
  apiError,
  apiSuccess,
  ERROR_MESSAGES,
  resolveErrorMessage,
} from "@/lib/errors";
import { estimateModelFromFile } from "@/lib/model-estimation";
import {
  estimateWithSlicer,
  isSlicerConfigured,
  SlicerExecutionError,
} from "@/lib/slicer-estimation";

export const runtime = "nodejs";

type PrintAnalysisResponse = {
  job_id: number;
  file_name: string;
  dimensions: { width: number; height: number; depth: number };
  volume_cm3: number;
  material_grams: number;
  estimated_time_minutes: number;
  estimated_time_display: string;
  estimation_source: "slicer" | "fallback";
  estimation_note?: string;
  compatible_printers: Array<{
    id: string;
    name: string;
    build_volume: string;
  }>;
  breakdown: {
    material_cost: number;
    processing_cost: number;
    delivery_cost: number;
    total_cost: number;
    currency: string;
  };
};

function round(value: number, precision = 3) {
  return Number(value.toFixed(precision));
}

function buildCostBreakdown(materialGrams: number, estimatedMinutes: number) {
  const material_cost = round(materialGrams * 0.012);
  const processing_cost = round(estimatedMinutes * 0.018);
  const delivery_cost = 0.75;
  const total_cost = round(material_cost + processing_cost + delivery_cost);

  return {
    material_cost,
    processing_cost,
    delivery_cost,
    total_cost,
    currency: "KWD",
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        apiError("No file uploaded. Please provide an STL or OBJ file."),
        { status: 400 }
      );
    }

    const estimate = await estimateModelFromFile(file);
    let slicerEstimate = null;

    if (isSlicerConfigured()) {
      try {
        slicerEstimate = await estimateWithSlicer(file);
      } catch (error) {
        const message =
          error instanceof SlicerExecutionError
            ? error.message
            : resolveErrorMessage(error, ERROR_MESSAGES.serverError);

        return NextResponse.json(
          apiError(`Slicer failed: ${message}`),
          { status: 500 }
        );
      }
    }

    const materialGrams = slicerEstimate?.materialGrams ?? estimate.material.grams;
    const estimatedMinutes =
      slicerEstimate?.estimatedTimeMinutes ?? estimate.estimatedTime.minutes;
    const estimatedDisplay =
      slicerEstimate?.estimatedTimeDisplay ?? estimate.estimatedTime.display;

    const response: PrintAnalysisResponse = {
      job_id: Date.now(),
      file_name: file.name,
      dimensions: {
        width: estimate.dimensions.x,
        height: estimate.dimensions.y,
        depth: estimate.dimensions.z,
      },
      volume_cm3: estimate.volume.cm3,
      material_grams: materialGrams,
      estimated_time_minutes: estimatedMinutes,
      estimated_time_display: estimatedDisplay,
      estimation_source: slicerEstimate ? "slicer" : "fallback",
      estimation_note: slicerEstimate
        ? "Accurate sliced estimate"
        : "Fallback geometry estimate used",
      compatible_printers: estimate.compatiblePrinters,
      breakdown: buildCostBreakdown(
        materialGrams,
        estimatedMinutes
      ),
    };

    return NextResponse.json(apiSuccess(response));
  } catch (error) {
    return NextResponse.json(
      apiError(resolveErrorMessage(error, ERROR_MESSAGES.serverError)),
      { status: 500 }
    );
  }
}
