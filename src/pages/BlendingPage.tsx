import LiveWeightDisplay from "@/components/LiveWeightDisplay";
import QRScannerComponent from "@/components/QRScannerComponent";
import { useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface Recipe {
  code: string;
  name: string;
  targetWeight: number;
  actualWeight: number | null;
  status: "pending" | "weighed" | "error";
}

const RECIPES: Recipe[] = [
  { code: "WOO-2001", name: "Wood Powder", targetWeight: 30.0, actualWeight: null, status: "pending" },
  { code: "HDP-2020", name: "HDPE", targetWeight: 15.0, actualWeight: null, status: "pending" },
  { code: "CAL-2004", name: "Calcium Powder", targetWeight: 8.0, actualWeight: null, status: "pending" },
  { code: "COU-2003", name: "Coupling Agent", targetWeight: 3.5, actualWeight: null, status: "pending" },
  { code: "LUB-2007", name: "Lubricant", targetWeight: 2.0, actualWeight: null, status: "pending" },
  { code: "ANT-2005", name: "Antioxidant", targetWeight: 1.5, actualWeight: null, status: "pending" },
];

const BlendingPage = () => {
  const [recipes, setRecipes] = useState<Recipe[]>(RECIPES);
  const [activeRecipeIdx, setActiveRecipeIdx] = useState(0);

  const handleWeightCapture = (weight: number) => {
    setRecipes((prev) => {
      const next = [...prev];
      const recipe = next[activeRecipeIdx];
      const deviation = Math.abs(weight - recipe.targetWeight) / recipe.targetWeight * 100;
      next[activeRecipeIdx] = {
        ...recipe,
        actualWeight: weight,
        status: deviation <= 0.5 ? "weighed" : "error",
      };
      return next;
    });
    if (activeRecipeIdx < recipes.length - 1) {
      setActiveRecipeIdx(activeRecipeIdx + 1);
    }
  };

  const totalTarget = recipes.reduce((sum, r) => sum + r.targetWeight, 0);
  const totalActual = recipes.reduce((sum, r) => sum + (r.actualWeight || 0), 0);
  const allWeighed = recipes.every((r) => r.status === "weighed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Blending Module</h1>
        <p className="text-sm text-muted-foreground mt-1">Recipe-based weighing with hardware validation — Recipe: WPE RG 0107.6.22</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <LiveWeightDisplay
            deviceId="WS-001"
            label={`Scale — ${recipes[activeRecipeIdx]?.name || "Ready"}`}
            expectedWeight={recipes[activeRecipeIdx]?.targetWeight}
            tolerancePercent={0.5}
            onWeightStable={handleWeightCapture}
          />
          <QRScannerComponent label="Scan Input Bin" />
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground mb-3">Recipe Components</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-2 text-secondary-foreground">Code</th>
                  <th className="text-left px-4 py-2 text-secondary-foreground">Material</th>
                  <th className="text-right px-4 py-2 text-secondary-foreground">Target (kg)</th>
                  <th className="text-right px-4 py-2 text-secondary-foreground">Actual (kg)</th>
                  <th className="text-center px-4 py-2 text-secondary-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((r, i) => (
                  <tr
                    key={r.code}
                    className={`border-t border-border cursor-pointer transition-colors ${
                      i === activeRecipeIdx ? "bg-primary/5" : ""
                    }`}
                    onClick={() => setActiveRecipeIdx(i)}
                  >
                    <td className="px-4 py-2 font-mono text-xs text-foreground">{r.code}</td>
                    <td className="px-4 py-2 text-foreground">{r.name}</td>
                    <td className="px-4 py-2 text-right font-mono text-foreground">{r.targetWeight.toFixed(3)}</td>
                    <td className="px-4 py-2 text-right font-mono text-foreground">{r.actualWeight?.toFixed(3) || "—"}</td>
                    <td className="px-4 py-2 text-center">
                      {r.status === "weighed" && <CheckCircle2 className="h-4 w-4 text-success inline" />}
                      {r.status === "error" && <AlertTriangle className="h-4 w-4 text-destructive inline" />}
                      {r.status === "pending" && <span className="text-xs text-muted-foreground">Pending</span>}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border bg-secondary">
                  <td colSpan={2} className="px-4 py-2 font-semibold text-secondary-foreground">Total</td>
                  <td className="px-4 py-2 text-right font-mono font-semibold text-secondary-foreground">{totalTarget.toFixed(3)}</td>
                  <td className="px-4 py-2 text-right font-mono font-semibold text-secondary-foreground">{totalActual.toFixed(3)}</td>
                  <td className="px-4 py-2 text-center">
                    {allWeighed && <CheckCircle2 className="h-4 w-4 text-success inline" />}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlendingPage;
