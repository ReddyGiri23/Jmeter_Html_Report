import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  BarElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BoxPlotChartProps {
  data: Array<{
    label: string;
    values: number[];
  }>;
  title?: string;
}

interface BoxPlotStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
}

const calculateBoxPlotStats = (values: number[]): BoxPlotStats => {
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const medianIndex = Math.floor(sorted.length * 0.5);
  const q3Index = Math.floor(sorted.length * 0.75);

  const q1 = sorted[q1Index];
  const median = sorted[medianIndex];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers = sorted.filter(v => v < lowerBound || v > upperBound);
  const inliers = sorted.filter(v => v >= lowerBound && v <= upperBound);

  return {
    min: inliers[0] || sorted[0],
    q1,
    median,
    q3,
    max: inliers[inliers.length - 1] || sorted[sorted.length - 1],
    outliers
  };
};

const BoxPlotChart = ({ data, title = 'Response Time Distribution' }: BoxPlotChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const canvas = canvasRef.current;
    const padding = { top: 40, right: 30, bottom: 80, left: 60 };
    const width = canvas.width - padding.left - padding.right;
    const height = canvas.height - padding.top - padding.bottom;

    const stats = data.map(d => ({
      label: d.label,
      stats: calculateBoxPlotStats(d.values)
    }));

    const allValues = data.flatMap(d => d.values);
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const range = maxValue - minValue;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const boxWidth = Math.min(60, width / stats.length - 20);
    const spacing = width / stats.length;

    const yScale = (value: number) => {
      return padding.top + height - ((value - minValue) / range) * height;
    };

    stats.forEach((item, index) => {
      const x = padding.left + index * spacing + spacing / 2;

      ctx.strokeStyle = '#3b82f6';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 2;

      const q1Y = yScale(item.stats.q1);
      const q3Y = yScale(item.stats.q3);
      const medianY = yScale(item.stats.median);
      const minY = yScale(item.stats.min);
      const maxY = yScale(item.stats.max);

      ctx.fillRect(x - boxWidth / 2, q3Y, boxWidth, q1Y - q3Y);
      ctx.strokeRect(x - boxWidth / 2, q3Y, boxWidth, q1Y - q3Y);

      ctx.beginPath();
      ctx.moveTo(x - boxWidth / 2, medianY);
      ctx.lineTo(x + boxWidth / 2, medianY);
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, q3Y);
      ctx.lineTo(x, maxY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, q1Y);
      ctx.lineTo(x, minY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(x - boxWidth / 4, maxY);
      ctx.lineTo(x + boxWidth / 4, maxY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - boxWidth / 4, minY);
      ctx.lineTo(x + boxWidth / 4, minY);
      ctx.stroke();

      item.stats.outliers.forEach(outlier => {
        const outlierY = yScale(outlier);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x, outlierY, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.save();
      ctx.translate(x, padding.top + height + 10);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#374151';
      ctx.font = '11px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(item.label.substring(0, 20), 0, 0);
      ctx.restore();
    });

    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + height);
    ctx.lineTo(padding.left + width, padding.top + height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + height);
    ctx.stroke();

    const yTicks = 5;
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= yTicks; i++) {
      const value = minValue + (range * i) / yTicks;
      const y = yScale(value);
      ctx.fillText(value.toFixed(0) + ' ms', padding.left - 10, y + 4);

      ctx.strokeStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + width, y);
      ctx.stroke();
    }

  }, [data]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full"
      />
      <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500"></div>
          <span>Interquartile Range (Q1-Q3)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-blue-900"></div>
          <span>Median</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-px bg-blue-500 border-dashed"></div>
          <span>Whiskers (Min-Max)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span>Outliers</span>
        </div>
      </div>
    </div>
  );
};

export default BoxPlotChart;
