# Ground Sense Bot Chart Components

This document describes the reusable chart + insight components added to enrich predefined graphical prompt responses.

## Overview of Components

| Component                  | Purpose                                               | Key Props                                                         | Visual Notes                                                         |
| -------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- | --- | ----- | -------------- | ------------------------------ |
| `ExtractionTrendLine`      | Time-series of extraction (and optional recharge/net) | `data: {year, extraction, recharge?, net?}[]`, `height`, `accent` | Gradient area, avg reference line, custom tooltip                    |
| `RechargeCompositionDonut` | Donut showing recharge source mix                     | `data: {name,value,color?}[]`                                     | Center total label, gradient ring, circular legend                   |
| `SectorUsageStackedBar`    | Single stacked bar (100%) for sectoral shares         | `data: {sector,value}[]`                                          | Expands to 100% stacked; each sector color derived from HSL rotation |
| `RiskRadar`                | Radar plot of risk dimensions                         | `data: {factor, score}[]`                                         | Larger radius, custom tooltip, radial accent background              |
| `KPIStatGroup`             | Compact metric grid with sparklines                   | `items: { label, value, change?, sparkline?, color? }[]`          | Sparkline fades into background, accent bar                          |
| `ChartSkeleton`            | Loading placeholder skeletons                         | `variant: line                                                    | donut                                                                | bar | radar | kpi`, `height` | Consistent container & shimmer |

## Composite Bundles

Defined inside `INGRESAssistant` for predefined prompt intents:

- `CropInsightBundle`: Crop card + Extraction trend + Recharge donut + KPI group.
- `PolicyRechargeBundle`: Policy card + Recharge donut + Risk radar + KPI metrics.
- `RainfallImpactBundle`: Rainfall card + Extraction trend + Recharge donut + Sector usage stacked bar.

Each bundle pulls a `StateProfileLite` (currently `PUNJAB_PROFILE`) and maps to chart props.

## Adding Dynamic State Support

1. Detect state query: extend `pickProfileByText(query)` usage in early handlers.
2. Pass selected profile instead of `PUNJAB_PROFILE` into bundle components.
3. Fallback remains Punjab if unresolved.

Example snippet inside an early handler:

```ts
const profile = pickProfileByText(text) || PUNJAB_PROFILE;
<React.Suspense fallback={<ChartSkeleton variant="line" height={280} />}>
  <CropInsightBundle profile={profile} />
</React.Suspense>;
```

## Theming & Palette

Currently using semantic accent hints:

- Extraction / Stage: Sky / Indigo / Purple
- Recharge: Emerald
- Net & Secondary: Blue
- Risk: Fuchsia

To centralize, you can create `src/theme/chartColors.ts` and export tokens, then replace hard-coded hex values.

## Accessibility Guidelines

- Each chart container can receive `role="figure"` and `aria-label` summarizing displayed metric.
- For sparkline-only KPIs add `aria-hidden="true"` to purely decorative charts.
- Skeletons already include `role="status"` and visually-hidden text.

## Performance Considerations

- All charts are lazy-loaded via `React.lazy` in `INGRESAssistant`.
- Suspense fallbacks replaced by lightweight skeletons to reduce layout shift.
- If bundle loading becomes heavy, consider wrapping groups in intersection observers or separate route-level code splitting.

## Extending Charts

1. Add new file under `src/components/charts/`.
2. Follow existing patterns: rounded container, radial subtle overlay, custom tooltip.
3. Export a clear prop interface.
4. Add skeleton variant if needed.

## Example Prop Shapes

```ts
// ExtractionTrendLine
interface ExtractionTrendPoint {
  year: number | string;
  extraction: number;
  recharge?: number;
  net?: number;
}

// RechargeCompositionDonut
interface RechargeSlice {
  name: string;
  value: number;
  color?: string;
}

// SectorUsageStackedBar
interface SectorUsage {
  sector: string;
  value: number;
}

// RiskRadar
interface RiskFactor {
  factor: string;
  score: number;
}

// KPIStatGroup
interface KPIItem {
  label: string;
  value: string | number;
  change?: number;
  sparkline?: number[];
  color?: string;
}
```

## Suggested Future Enhancements

- Dark mode specific gradient adjustments (increase contrasts).
- Export PNG / embed chart to report (hook with existing `html2canvas`).
- Hover crosshair sync between trend & KPI delta.
- Animated transitions on profile switch.

## Quick Usage Example

```tsx
import ExtractionTrendLine from "@/components/charts/ExtractionTrendLine";

const sample = [
  { year: 2019, extraction: 34.2, recharge: 22.1, net: -12.1 },
  { year: 2020, extraction: 35.0, recharge: 22.4, net: -12.6 },
];

<ExtractionTrendLine data={sample} accent="#0ea5e9" />;
```

---

Maintained by the groundwater insights UI layer. Adjust / extend as data models evolve.
