import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartDatum = {
  label: string;
  date: string;
  value: number;
};

interface TaskChartProps {
  data: ChartDatum[];
}

export function TaskChart({ data }: TaskChartProps) {
  const maxValue = Math.max(1, ...data.map((point) => point.value));
  const safeLength = Math.max(data.length - 1, 1);

  const points = data
    .map((point, index) => {
      const x = (index / safeLength) * 100;
      const y = 100 - (point.value / maxValue) * 90 - 5; // keep padding
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="space-y-1">
          <CardTitle>Completed per day</CardTitle>
          <Badge variant="outline">Last 7 days</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="relative h-48 w-full overflow-hidden rounded-lg border border-border/70 bg-gradient-to-b from-muted/20 via-card to-background">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full"
            role="img"
            aria-label="Tasks completed line chart for the last seven days"
          >
            {/* grid lines */}
            {[25, 50, 75].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                strokeWidth="0.3"
                className="text-border/70"
              />
            ))}
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-foreground"
              points={points}
            />
            {data.map((point, index) => {
              const x = (index / safeLength) * 100;
              const y = 100 - (point.value / maxValue) * 90 - 5;
              return (
                <g key={point.date}>
                  <circle
                    cx={x}
                    cy={y}
                    r="1.8"
                    className="fill-background stroke-foreground"
                    strokeWidth="0.6"
                  />
                </g>
              );
            })}
          </svg>
          <div className="absolute inset-x-0 bottom-2 flex justify-between px-3 text-[11px] uppercase tracking-wide text-muted-foreground">
            {data.map((point) => (
              <span key={point.date}>{point.label}</span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
