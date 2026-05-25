import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

type MarkPoint = { subject: string; marks: number };
type PerformerPoint = {
  firstName: string;
  rollNumber?: string;
  percentage: number;
};

export function StudentMarksChart({ data }: { data: MarkPoint[] }) {
  const COLORS = ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81', '#1e1b4b'];

  return (
    <BarChart width={700} height={288} data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
      <XAxis dataKey="subject" tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
      <Tooltip
        cursor={{ fill: 'transparent' }}
        content={({ active, payload }) => {
          if (active && payload && payload.length) {
            return (
              <div className="bg-gray-900/90 text-white text-xs px-3 py-2 rounded-xl shadow-md border border-gray-800">
                <span className="font-semibold">{payload[0].payload.subject}:</span> {payload[0].value} / 100
              </div>
            );
          }
          return null;
        }}
      />
      <Bar dataKey="marks" radius={[6, 6, 0, 0]}>
        {data.map((_entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Bar>
    </BarChart>
  );
}

export function TopPerformersChart({ data }: { data: PerformerPoint[] }) {
  return (
    <BarChart width={700} height={288} data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
      <XAxis
        dataKey="firstName"
        tickFormatter={(name: string, index: number) => {
          const entry = data[index];
          return entry ? `${name} (${entry.rollNumber || ''})` : name;
        }}
        tickLine={false}
        axisLine={false}
        tick={{ fill: '#9ca3af', fontSize: 10 }}
      />
      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
      <Tooltip
        cursor={{ fill: 'transparent' }}
        contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6' }}
      />
      <Bar dataKey="percentage" name="Percentage Average (%)" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
    </BarChart>
  );
}
