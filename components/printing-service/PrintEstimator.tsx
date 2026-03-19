"use client";

import { useEffect, useRef, useState } from "react";
import type { ApiResponse } from "@/lib/types";
import InlinePrintConfig, {
  type PrintJobConfig,
  type PrintTechnology,
} from "@/components/printing-service/InlinePrintConfig";

type PrinterMatch = {
  id: string;
  name: string;
  build_volume: string;
};

type CostBreakdown = {
  material_cost: number;
  processing_cost: number;
  delivery_cost: number;
  total_cost: number;
  currency: string;
};

type PrintAnalysisResponse = {
  job_id: number;
  file_name: string;
  dimensions: { width: number; height: number; depth: number };
  volume_cm3: number;
  material_grams: number;
  estimated_time_minutes: number;
  estimated_time_display: string;
  estimation_source?: "slicer" | "fallback";
  estimation_note?: string;
  compatible_printers: PrinterMatch[];
  breakdown: CostBreakdown;
};

type OrderResponse = {
  order_id: number;
  checkout_url: string;
};

const ALLOWED_EXTENSIONS = new Set(["stl", "obj"]);
const MAX_SIZE = 50 * 1024 * 1024;

const MATERIAL_OPTIONS: Record<PrintTechnology, readonly string[]> = {
  FDM: ["PLA", "PETG", "ABS", "Nylon"],
  Resin: ["Standard Resin", "Tough Resin", "High Detail Resin"],
};

const MATERIAL_MULTIPLIERS: Record<string, number> = {
  PLA: 1,
  PETG: 1.05,
  ABS: 1.1,
  Nylon: 1.16,
  "Standard Resin": 1.12,
  "Tough Resin": 1.18,
  "High Detail Resin": 1.26,
};

const TECHNOLOGY_MULTIPLIERS: Record<PrintTechnology, number> = {
  FDM: 1,
  Resin: 1.12,
};

const INITIAL_TECHNOLOGY: PrintTechnology = "FDM";

const buildInitialConfig = (printerId = ""): PrintJobConfig => ({
  material: MATERIAL_OPTIONS[INITIAL_TECHNOLOGY][0],
  technology: INITIAL_TECHNOLOGY,
  printerId,
  quantity: 1,
  deadline: getDefaultDeadline(),
  description: "",
});

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 5);
  return formatInputDate(date);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return "Only .stl and .obj files are accepted.";
  }
  if (file.size > MAX_SIZE) {
    return "File exceeds the 50 MB limit.";
  }
  return null;
}

function getDeadlineMultiplier(deadline: string) {
  if (!deadline) return 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = new Date(deadline);
  if (Number.isNaN(selectedDate.getTime())) {
    return 1;
  }

  selectedDate.setHours(0, 0, 0, 0);
  const diffInDays = Math.ceil(
    (selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays <= 1) return 1.25;
  if (diffInDays <= 3) return 1.15;
  if (diffInDays <= 7) return 1.05;
  return 1;
}

function getPrinterMultiplier(
  printerId: string,
  printers: PrinterMatch[]
) {
  const index = printers.findIndex((printer) => printer.id === printerId);
  if (index < 0) return 1;
  return 1 + index * 0.03;
}

function calculateEstimatedPrice(
  analysis: PrintAnalysisResponse,
  config: PrintJobConfig
) {
  const basePrice = analysis.breakdown.total_cost;
  const materialMultiplier = MATERIAL_MULTIPLIERS[config.material] ?? 1;
  const technologyMultiplier = TECHNOLOGY_MULTIPLIERS[config.technology] ?? 1;
  const printerMultiplier = getPrinterMultiplier(
    config.printerId,
    analysis.compatible_printers
  );
  const deadlineMultiplier = getDeadlineMultiplier(config.deadline);
  const quantity = Math.max(1, config.quantity);

  return Number(
    (
      basePrice *
      materialMultiplier *
      technologyMultiplier *
      printerMultiplier *
      deadlineMultiplier *
      quantity
    ).toFixed(3)
  );
}

function dimensionsLabel(dimensions: PrintAnalysisResponse["dimensions"]) {
  return `${dimensions.width} x ${dimensions.height} x ${dimensions.depth} mm`;
}

export default function PrintEstimator() {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [config, setConfig] = useState<PrintJobConfig>(buildInitialConfig());
  const [price, setPrice] = useState(0);
  const [analysis, setAnalysis] = useState<PrintAnalysisResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [activeUpload, setActiveUpload] = useState<{
    name: string;
    size: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const materialOptions = MATERIAL_OPTIONS[config.technology];
    if (!materialOptions.includes(config.material)) {
      setConfig((current) => ({
        ...current,
        material: materialOptions[0],
      }));
    }
  }, [config.material, config.technology]);

  useEffect(() => {
    if (!analysis || !fileUploaded) {
      setPrice(0);
      return;
    }

    setPrice(calculateEstimatedPrice(analysis, config));
  }, [analysis, config, fileUploaded]);

  const handleConfigChange = <K extends keyof PrintJobConfig>(
    field: K,
    value: PrintJobConfig[K]
  ) => {
    setConfig((current) => ({ ...current, [field]: value }));
    setOrderError(null);
  };

  const handleUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      setFileUploaded(false);
      setAnalysis(null);
      setActiveUpload(null);
      setDragOver(false);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setOrderError(null);
    setFileUploaded(false);
    setAnalysis(null);
    setDragOver(false);
    setActiveUpload({
      name: file.name,
      size: formatBytes(file.size),
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/print/analyze", {
        method: "POST",
        body: formData,
      });

      const body = (await response.json()) as ApiResponse<PrintAnalysisResponse>;
      if (!response.ok || !body.success) {
        setUploadError(body.success ? "Analysis failed." : body.error);
        return;
      }

      const nextAnalysis = body.data;
      const defaultPrinterId = nextAnalysis.compatible_printers[0]?.id ?? "";

      setAnalysis(nextAnalysis);
      setConfig(buildInitialConfig(defaultPrinterId));
      setFileUploaded(true);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Upload failed."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleOrder = async () => {
    if (!analysis) return;

    const selectedPrinter =
      analysis.compatible_printers.find(
        (printer) => printer.id === config.printerId
      ) ?? null;

    setOrdering(true);
    setOrderError(null);

    try {
      const response = await fetch("/api/print/add-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: analysis.job_id,
          total_cost: price,
          summary: {
            file_name: analysis.file_name,
            dimensions: dimensionsLabel(analysis.dimensions),
            material_grams: analysis.material_grams,
            estimated_time: analysis.estimated_time_display,
            printer: selectedPrinter?.name ?? "N/A",
            material: config.material,
            technology: config.technology,
            quantity: config.quantity,
            deadline: config.deadline,
            description: config.description.trim(),
          },
        }),
      });

      const body = (await response.json()) as ApiResponse<OrderResponse>;
      if (!response.ok || !body.success) {
        setOrderError(body.success ? "Order failed." : body.error);
        return;
      }

      window.location.href = body.data.checkout_url;
    } catch {
      setOrderError("Failed to create order.");
    } finally {
      setOrdering(false);
    }
  };

  const reset = () => {
    setFileUploaded(false);
    setConfig(buildInitialConfig());
    setPrice(0);
    setAnalysis(null);
    setUploadError(null);
    setOrderError(null);
    setOrdering(false);
    setIsUploading(false);
    setActiveUpload(null);
    setDragOver(false);
  };

  const canProceed =
    !!analysis &&
    analysis.compatible_printers.length > 0 &&
    !!config.printerId &&
    !!config.deadline &&
    config.description.trim().length > 0 &&
    !ordering;

  return (
    <div className="space-y-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
          3D Printing Service
        </h1>
        <p className="mt-2 max-w-xl text-sm text-gray-500 md:text-base">
          Upload your file, configure your print, and get an instant price.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Upload your 3D file
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              STL and OBJ files are supported. Once uploaded, the inline
              configuration section appears below.
            </p>
          </div>
          <p className="text-xs text-gray-400">Max file size: 50 MB</p>
        </div>

        {isUploading ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-[#fafafa] p-8 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
            <p className="text-sm font-semibold text-gray-900">
              Analyzing and slicing your model...
            </p>
            {activeUpload ? (
              <p className="mt-1 text-xs text-gray-500">
                {activeUpload.name} - {activeUpload.size}
              </p>
            ) : null}
          </div>
        ) : fileUploaded && analysis ? (
          <div className="mt-6 rounded-2xl bg-[#f5f5f5] px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {analysis.file_name}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>{dimensionsLabel(analysis.dimensions)}</span>
                  <span>{analysis.estimated_time_display}</span>
                  <span>{analysis.material_grams.toFixed(1)} g</span>
                </div>
                {analysis.estimation_note ? (
                  <p className="mt-2 text-xs text-gray-500">
                    {analysis.estimation_note}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-700 transition hover:bg-gray-100"
              >
                Replace File
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              const file = event.dataTransfer.files?.[0];
              if (file) {
                void handleUpload(file);
              }
            }}
            onClick={() => inputRef.current?.click()}
            className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition ${
              dragOver
                ? "border-gray-900 bg-gray-100"
                : "border-gray-300 bg-[#fafafa] hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-6 w-6 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {dragOver ? "Drop file here" : "Drag and drop your 3D model"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              or{" "}
              <span className="font-medium text-gray-700 underline underline-offset-2">
                browse files
              </span>
            </p>
            <p className="mt-3 text-[11px] text-gray-400">
              STL or OBJ - Max 50 MB
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".stl,.obj"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleUpload(file);
            }
            event.target.value = "";
          }}
          className="hidden"
        />

        {uploadError ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {uploadError}
          </div>
        ) : null}
      </div>

      {fileUploaded && analysis ? (
        <InlinePrintConfig
          dimensionsLabel={dimensionsLabel(analysis.dimensions)}
          estimatedTime={analysis.estimated_time_display}
          materialGrams={analysis.material_grams}
          printerOptions={analysis.compatible_printers}
          materialOptions={MATERIAL_OPTIONS[config.technology]}
          config={config}
          price={price}
          ordering={ordering}
          canProceed={canProceed}
          errorMessage={orderError}
          onConfigChange={handleConfigChange}
          onProceed={() => {
            void handleOrder();
          }}
          onReset={reset}
        />
      ) : null}
    </div>
  );
}
