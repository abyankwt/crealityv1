import { formatKWD } from "@/lib/formatCurrency";

export type PrintTechnology = "FDM" | "Resin";
export const MATERIAL_COLOR_OPTIONS = {
  PLA: ["Black", "White", "Red", "Blue", "Green"],
  TPU: ["Black", "Blue"],
  Resin: ["Transparent", "Gray", "White"],
} as const;

export type PrintMaterial = keyof typeof MATERIAL_COLOR_OPTIONS;
export type PrintColor = (typeof MATERIAL_COLOR_OPTIONS)[PrintMaterial][number];

export function getPrintColorLabel(color: PrintColor) {
  return color;
}

export type PrintJobConfig = {
  material: PrintMaterial;
  technology: PrintTechnology;
  color: PrintColor;
  quantity: number;
  description: string;
};

export const PRINT_PROVIDER_OPTIONS = [
  { value: "Creality Kuwait", label: "Creality Kuwait" },
  { value: "Partner 1", label: "Partner Provider 1" },
  { value: "Partner 2", label: "Partner Provider 2" },
] as const;

type ConfigChangeHandler = <K extends keyof PrintJobConfig>(
  field: K,
  value: PrintJobConfig[K]
) => void;

type InlinePrintConfigProps = {
  dimensionsLabel: string;
  estimatedTime: string;
  materialGrams: number;
  hasCompatiblePrinters: boolean;
  materialOptions: readonly PrintMaterial[];
  colorOptions: readonly PrintColor[];
  config: PrintJobConfig;
  provider: string;
  price: number;
  ordering: boolean;
  canProceed: boolean;
  errorMessage?: string | null;
  onConfigChange: ConfigChangeHandler;
  onProviderChange: (value: string) => void;
  onProceed: () => void;
  onReset: () => void;
};

const inputClassName =
  "mt-2 box-border w-full max-w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none md:text-sm";

const selectClassName = `${inputClassName} min-h-[52px] pr-11 appearance-none`;

export default function InlinePrintConfig({
  dimensionsLabel,
  estimatedTime,
  materialGrams,
  hasCompatiblePrinters,
  materialOptions,
  colorOptions,
  config,
  provider,
  price,
  ordering,
  canProceed,
  errorMessage,
  onConfigChange,
  onProviderChange,
  onProceed,
  onReset,
}: InlinePrintConfigProps) {
  return (
    <div className="mt-8 overflow-visible lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
      <div className="min-w-0 overflow-visible">
        <div className="max-w-2xl">
          <h3 className="text-2xl font-semibold text-gray-900">
            Configure your print
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Choose the production settings and review the live estimate before
            placing the order.
          </p>
        </div>

        <div className="mt-8 grid gap-x-6 gap-y-6 overflow-visible md:grid-cols-2">
          <label className="min-w-0 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Material
            <div className="relative mt-2 overflow-visible">
              <select
                value={config.material}
                onChange={(event) =>
                  onConfigChange(
                    "material",
                    event.target.value as PrintJobConfig["material"]
                  )
                }
                className={selectClassName}
              >
                {materialOptions.map((material) => (
                  <option key={material} value={material}>
                    {material}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 7.5 5 5 5-5" />
                </svg>
              </span>
            </div>
          </label>

          <label className="min-w-0 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Technology
            <div className="relative mt-2 overflow-visible">
              <select
                value={config.technology}
                onChange={(event) =>
                  onConfigChange(
                    "technology",
                    event.target.value as PrintJobConfig["technology"]
                  )
                }
                className={selectClassName}
              >
                <option value="FDM">FDM</option>
                <option value="Resin">Resin</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 7.5 5 5 5-5" />
                </svg>
              </span>
            </div>
          </label>

          <label className="min-w-0 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Color
            <div className="relative mt-2 overflow-visible">
              <select
                value={config.color}
                onChange={(event) =>
                  onConfigChange("color", event.target.value as PrintJobConfig["color"])
                }
                className={selectClassName}
              >
                {colorOptions.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 7.5 5 5 5-5" />
                </svg>
              </span>
            </div>
          </label>

          <label className="min-w-0 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Quantity
            <input
              type="number"
              min={1}
              value={config.quantity}
              onChange={(event) =>
                onConfigChange(
                  "quantity",
                  Math.max(1, Number(event.target.value) || 1)
                )
              }
              className={inputClassName}
            />
          </label>

          <label className="min-w-0 text-xs font-semibold uppercase tracking-[0.2em] leading-relaxed text-gray-500">
            3D Printing Service Provider
            <div className="relative mt-2 overflow-visible">
              <select
                value={provider}
                onChange={(event) => onProviderChange(event.target.value)}
                className={selectClassName}
              >
                {PRINT_PROVIDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 7.5 5 5 5-5" />
                </svg>
              </span>
            </div>
          </label>

          <div className="hidden md:block" />

          <label className="min-w-0 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 md:col-span-2">
            Description
            <textarea
              rows={6}
              value={config.description}
              onChange={(event) => onConfigChange("description", event.target.value)}
              className={inputClassName}
              placeholder="Project notes, finish requirements, and any delivery constraints."
            />
          </label>
        </div>
      </div>

      <aside className="mt-8 self-start lg:mt-0">
        <div className="sticky top-20 rounded-2xl bg-[#f5f5f5] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Estimated Price
          </p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
            {formatKWD(price)}
          </p>

          <div className="mt-8">
            <h4 className="text-sm font-semibold text-gray-900">Summary</h4>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Material</dt>
                <dd className="text-right font-medium text-gray-900">
                  {config.material}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Technology</dt>
                <dd className="text-right font-medium text-gray-900">
                  {config.technology}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Color</dt>
                <dd className="text-right font-medium text-gray-900">
                  {getPrintColorLabel(config.color)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Quantity</dt>
                <dd className="text-right font-medium text-gray-900">
                  {config.quantity}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Provider</dt>
                <dd className="text-right font-medium text-gray-900">
                  {provider}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Size</dt>
                <dd className="text-right font-medium text-gray-900">
                  {dimensionsLabel}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Print Time</dt>
                <dd className="text-right font-medium text-gray-900">
                  {estimatedTime}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Material Use</dt>
                <dd className="text-right font-medium text-gray-900">
                  {materialGrams.toFixed(1)} g
                </dd>
              </div>
            </dl>
          </div>

          {!hasCompatiblePrinters ? (
            <div className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              This file exceeds the supported printer volume. Upload a smaller
              model or request a manual quote.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="button"
            onClick={onProceed}
            disabled={!canProceed}
            className="mt-8 w-full rounded-xl bg-black px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
          >
            {ordering ? "Creating Order..." : "Proceed to Order"}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="mt-3 w-full text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            Replace File
          </button>
        </div>
      </aside>
    </div>
  );
}
