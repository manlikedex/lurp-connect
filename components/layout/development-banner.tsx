import { AlertTriangle } from "lucide-react";

export function DevelopmentBanner() {
  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-amber-400/20 bg-amber-500/10">
      <div className="flex items-center gap-3 px-4 py-3">
        <AlertTriangle
          size={18}
          className="text-amber-300"
        />

        <div>
          <p className="font-black text-amber-200">
            Development Preview
          </p>

          <p className="text-sm text-amber-100/70">
            Some features may be unavailable or incomplete.
            Please report bugs, issues and suggestions to
            Dex.
          </p>
        </div>
      </div>
    </div>
  );
}