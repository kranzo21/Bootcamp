interface Props {
  percent: number;
  label: string;
}

export default function ProgressBar({ percent, label }: Props) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
