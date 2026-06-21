interface StatRowProps {
  label: string;
  value: string | number;
  unit?: string;
  bar?: { value: number; max: number };
}

export function StatRow({ label, value, unit, bar }: StatRowProps) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {value}
        {unit && <span className="stat-unit"> {unit}</span>}
      </span>
      {bar && bar.max > 0 && (
        <div className="stat-bar">
          <div
            className="stat-bar-fill"
            style={{ width: `${Math.min((bar.value / bar.max) * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
