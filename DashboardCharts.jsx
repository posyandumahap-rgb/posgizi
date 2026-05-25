import React from 'react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

const COLORS_GIZI = ['#dc2626', '#f59e0b', '#10b981', '#3b82f6'];
const COLORS_GENDER = ['#3b82f6', '#ec4899'];

export default function DashboardCharts({ penimbanganBulanIni, allPenimbangan, anak }) {
  // Status Gizi BBU pie chart
  const giziData = [
    { name: 'Gizi Buruk', value: penimbanganBulanIni.filter(p => p.status_bbu === 'Gizi Buruk').length },
    { name: 'Gizi Kurang', value: penimbanganBulanIni.filter(p => p.status_bbu === 'Gizi Kurang').length },
    { name: 'Gizi Baik', value: penimbanganBulanIni.filter(p => p.status_bbu === 'Gizi Baik').length },
    { name: 'Risiko Lebih', value: penimbanganBulanIni.filter(p => p.status_bbu === 'Risiko Gizi Lebih').length },
  ].filter(d => d.value > 0);

  // Gender pie
  const genderData = [
    { name: 'Laki-laki', value: anak.filter(a => a.jenis_kelamin === 'Laki-laki').length },
    { name: 'Perempuan', value: anak.filter(a => a.jenis_kelamin === 'Perempuan').length },
  ].filter(d => d.value > 0);

  // Stunting per desa bar chart
  const desaMap = {};
  penimbanganBulanIni.forEach(p => {
    const d = p.nama_desa || 'Lainnya';
    if (!desaMap[d]) desaMap[d] = { desa: d, stunting: 0, normal: 0 };
    if (p.status_stunting === 'Stunting') desaMap[d].stunting++;
    else desaMap[d].normal++;
  });
  const stuntingPerDesa = Object.values(desaMap);

  // Monthly trend
  const monthMap = {};
  allPenimbangan.forEach(p => {
    const key = `${p.tahun}-${String(p.bulan).padStart(2, '0')}`;
    if (!monthMap[key]) monthMap[key] = { bulan: key, ditimbang: 0, stunting: 0 };
    monthMap[key].ditimbang++;
    if (p.status_stunting === 'Stunting') monthMap[key].stunting++;
  });
  const trendData = Object.values(monthMap).sort((a, b) => a.bulan.localeCompare(b.bulan)).slice(-6);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Status Gizi Pie */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4">Status Gizi (BB/U)</h3>
        {giziData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={giziData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}>
                {giziData.map((_, i) => <Cell key={i} fill={COLORS_GIZI[i % COLORS_GIZI.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-muted-foreground text-center py-10">Belum ada data</p>}
      </Card>

      {/* Stunting per Desa */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4">Stunting per Desa</h3>
        {stuntingPerDesa.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stuntingPerDesa}>
              <XAxis dataKey="desa" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="stunting" fill="#dc2626" name="Stunting" radius={[4,4,0,0]} />
              <Bar dataKey="normal" fill="#10b981" name="Normal" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-muted-foreground text-center py-10">Belum ada data</p>}
      </Card>

      {/* Monthly Trend */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4">Tren Bulanan</h3>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="ditimbang" stroke="#10b981" name="Ditimbang" strokeWidth={2} />
              <Line type="monotone" dataKey="stunting" stroke="#dc2626" name="Stunting" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-muted-foreground text-center py-10">Belum ada data</p>}
      </Card>

      {/* Gender Distribution */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4">Jenis Kelamin</h3>
        {genderData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, value}) => `${name}: ${value}`}>
                {genderData.map((_, i) => <Cell key={i} fill={COLORS_GENDER[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-muted-foreground text-center py-10">Belum ada data</p>}
      </Card>
    </div>
  );
}