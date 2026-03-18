import { formatKWD } from "@/lib/formatCurrency";

type PrinterOption = {
  id: string;
  name: string;
  build_volume: string;
};

export type PrintTechnology = "FDM" | "Resin";

export type PrintJobConfig = {
  material: string;
  technology: PrintTechnology;
  printerId: string;
  quantity: number;
  deadline: string;
  description: string;
};

type ConfigChangeHandler = <K extends keyof PrintJobConfig>(
  field: K,
  value: PrintJobConfig[K]
) => void;

type InlinePrintConfigProps = {
  dimensionsLabel: string;
  estimatedTime: string;
  materialGrams: number;
  printerOptions: PrinterOption[];
  materialOptions: readonly string[];
  config: PrintJobConfig;
  price: number;
  ordering: boolean;
  canProceed: boolean;
  errorMessage?: string | null;
  onConfigChange: ConfigChangeHandler;
  onProceed: () => void;
  onReset: () => void;
};

const inputClassName =
  "mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none";

export default function InlinePrintConfig({
  dimensionsLabel,
  estimatedTime,
  materialGrams,
  printerOptions,
  materialOptions,
  config,
  price,
  ordering,
  canProceed,
  errorMessage,
  onConfigChange,
  onProceed,
  onReset,
}: InlinePrintConfigProps) {
  const selectedPrinter =
    printerOptions.find((printer) => printer.id === config.printerId) ?? null;

  return (
    <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
      <div className="min-w-0">
        <div className="max-w-2xl">
          <h3 className="text-2xl font-semibold text-gray-900">
            Configure your print
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Choose the production settings and review the live estimate before
            placing the order.
          </p>
        </div>

        <div className="mt-8 grid gap-x-6 gap-y-6 md:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Material
            <select
              value={config.material}
              onChange={(event) => onConfigChange("material", event.target.value)}
              className={inputClassName}
            >
              {materialOptions.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Technology
            <select
              value={config.technology}
              onChange={(event) =>
                onConfigChange(
                  "technology",
                  event.target.value as PrintJobConfig["technology"]
                )
              }
              className={inputClassName}
            >
              <option value="FDM">FDM</option>
              <option value="Resin">Resin</option>
            </select>
          </label>

          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Printer
            <select
              value={config.printerId}
              onChange={(event) => onConfigChange("printerId", event.target.value)}
              className={inputClassName}
              disabled={printerOptions.length === 0}
            >
              {printerOptions.length === 0 ? (
                <option value="">No compatible printers</option>
              ) : (
                printerOptions.map((printer) => (
                  <option key={printer.id} value={printer.id}>
                    {printer.name} ({printer.build_volume})
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
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

          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Deadline
            <input
              type="date"
              value={config.deadline}
              onChange={(event) => onConfigChange("deadline", event.target.value)}
              className={inputClassName}
            />
          </label>

          <div className="hidden md:block" />

          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 md:col-span-2">
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
                <dt className="text-gray-500">Printer</dt>
                <dd className="text-right font-medium text-gray-900">
                  {selectedPrinter?.name ?? "Not available"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Quantity</dt>
                <dd className="text-right font-medium text-gray-900">
                  {config.quantity}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Deadline</dt>
                <dd className="text-right font-medium text-gray-900">
                  {config.deadline || "Select a date"}
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

          {printerOptions.length === 0 ? (
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
