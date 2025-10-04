import { useEffect, useRef } from 'react';
import { CorrelationAnalysis } from '../../utils/statisticalAnalysis';

interface CorrelationMatrixProps {
  correlations: CorrelationAnalysis[];
  metrics: string[];
  title?: string;
}

const CorrelationMatrix = ({
  correlations,
  metrics,
  title = 'Metric Correlation Matrix'
}: CorrelationMatrixProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || metrics.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const canvas = canvasRef.current;
    const size = metrics.length;
    const cellSize = Math.min(80, canvas.width / (size + 2));
    const padding = 100;

    canvas.width = size * cellSize + padding * 2;
    canvas.height = size * cellSize + padding * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const getCorrelationValue = (metric1: string, metric2: string): number => {
      if (metric1 === metric2) return 1;

      const correlation = correlations.find(
        c => (c.metric1 === metric1 && c.metric2 === metric2) ||
             (c.metric1 === metric2 && c.metric2 === metric1)
      );

      return correlation ? correlation.coefficient : 0;
    };

    const getColor = (value: number): string => {
      const absValue = Math.abs(value);
      if (value > 0) {
        const intensity = Math.floor(absValue * 255);
        return `rgb(${255 - intensity}, ${255 - intensity}, 255)`;
      } else {
        const intensity = Math.floor(absValue * 255);
        return `rgb(255, ${255 - intensity}, ${255 - intensity})`;
      }
    };

    metrics.forEach((metricY, i) => {
      metrics.forEach((metricX, j) => {
        const value = getCorrelationValue(metricX, metricY);
        const x = padding + j * cellSize;
        const y = padding + i * cellSize;

        ctx.fillStyle = getColor(value);
        ctx.fillRect(x, y, cellSize, cellSize);

        ctx.strokeStyle = '#e5e7eb';
        ctx.strokeRect(x, y, cellSize, cellSize);

        ctx.fillStyle = '#111827';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toFixed(2), x + cellSize / 2, y + cellSize / 2);
      });
    });

    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    metrics.forEach((metric, i) => {
      const y = padding + i * cellSize + cellSize / 2;
      ctx.save();
      ctx.translate(padding - 10, y);
      ctx.fillText(metric.substring(0, 15), 0, 0);
      ctx.restore();
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    metrics.forEach((metric, i) => {
      const x = padding + i * cellSize + cellSize / 2;
      ctx.save();
      ctx.translate(x, padding - 10);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(metric.substring(0, 15), 0, 0);
      ctx.restore();
    });

  }, [correlations, metrics]);

  if (metrics.length === 0) {
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
      <div className="overflow-auto">
        <canvas ref={canvasRef} className="mx-auto" />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4 text-xs">
        <div className="text-center">
          <div className="w-full h-6 mb-2" style={{ background: 'linear-gradient(to right, rgb(255, 0, 0), rgb(255, 255, 255))' }}></div>
          <span className="text-gray-600">Negative Correlation</span>
        </div>
        <div className="text-center">
          <div className="w-full h-6 mb-2 bg-white border border-gray-300"></div>
          <span className="text-gray-600">No Correlation (0)</span>
        </div>
        <div className="text-center">
          <div className="w-full h-6 mb-2" style={{ background: 'linear-gradient(to right, rgb(255, 255, 255), rgb(0, 0, 255))' }}></div>
          <span className="text-gray-600">Positive Correlation</span>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <h4 className="font-semibold text-sm">Key Correlations:</h4>
        {correlations
          .filter(c => Math.abs(c.coefficient) > 0.4)
          .slice(0, 5)
          .map((c, i) => (
            <div key={i} className="text-xs text-gray-600 flex items-center justify-between">
              <span>{c.metric1} ↔ {c.metric2}</span>
              <span className={`font-semibold ${c.type === 'positive' ? 'text-blue-600' : 'text-red-600'}`}>
                {c.coefficient.toFixed(2)} ({c.strength})
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default CorrelationMatrix;
