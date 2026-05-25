import React from 'react';
import { Baby, Building, MapPin, Scale, AlertTriangle, TrendingDown, TrendingUp, Heart, Gift, Users } from 'lucide-react';
import StatCard from '../shared/StatCard';

function getPrevBulanTahun(bulan, tahun) {
  if (bulan === 1) return { bulan: 12, tahun: tahun - 1 };
  return { bulan: bulan - 1, tahun };
}

export default function DashboardStats({ anak, desa, posyandu, penimbanganBulanIni, allPenimbangan, bulan, tahun }) {
  const totalSasaran = anak.length;
  const totalDesa = desa.length;
  const totalPosyandu = posyandu.length;
  const ditimbang = penimbanganBulanIni.length;
  const persenHadir = totalSasaran > 0 ? ((ditimbang / totalSasaran) * 100).toFixed(1) : 0;

  const stunting = penimbanganBulanIni.filter(p => p.status_stunting === 'Stunting').length;
  const persenStunting = ditimbang > 0 ? ((stunting / ditimbang) * 100).toFixed(1) : 0;

  // Previous month data for BB naik/tidak naik
  const { bulan: prevBulan, tahun: prevTahun } = getPrevBulanTahun(Number(bulan), Number(tahun));
  const prevMonthMap = {};
  allPenimbangan.forEach(p => {
    if (p.bulan === prevBulan && p.tahun === prevTahun) {
      prevMonthMap[p.anak_id] = p;
    }
  });

  let bbNaik = 0;
  let bbTidakNaik = 0;
  penimbanganBulanIni.forEach(p => {
    const prev = prevMonthMap[p.anak_id];
    if (prev) {
      if (p.berat_badan > prev.berat_badan) bbNaik++;
      else bbTidakNaik++;
    }
  });

  // PMT: dapat jika BB tidak naik OR BB/TB = Gizi Kurang/Gizi Buruk OR BB/U = Kurang/Sangat Kurang
  const mendapatPMT = penimbanganBulanIni.filter(p => {
    const prev = prevMonthMap[p.anak_id];
    const bbTdkNaik = prev ? (p.berat_badan <= prev.berat_badan) : false;
    const bbtbKurus = p.status_bbtb === 'Gizi Kurang' || p.status_bbtb === 'Gizi Buruk';
    const bbuKurang = p.status_bbu === 'Kurang' || p.status_bbu === 'Sangat Kurang';
    return bbTdkNaik || bbtbKurus || bbuKurang;
  }).length;

  // Rekap usia (berdasarkan umur_bulan saat ditimbang)
  const usia_0_6 = penimbanganBulanIni.filter(p => p.umur_bulan >= 0 && p.umur_bulan <= 6).length;
  const usia_7_11 = penimbanganBulanIni.filter(p => p.umur_bulan >= 7 && p.umur_bulan <= 11).length;
  const usia_12_23 = penimbanganBulanIni.filter(p => p.umur_bulan >= 12 && p.umur_bulan <= 23).length;
  const usia_24_59 = penimbanganBulanIni.filter(p => p.umur_bulan >= 24 && p.umur_bulan <= 59).length;

  return (
    <div className="space-y-4">
      {/* Baris 1: Statistik utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard title="Total Sasaran" value={totalSasaran} icon={Baby} color="primary" subtitle="Semua anak terdaftar" />
        <StatCard title="Total Posyandu" value={totalPosyandu} icon={Building} color="accent" />
        <StatCard title="Total Desa" value={totalDesa} icon={MapPin} color="info" />
        <StatCard title="Ditimbang" value={ditimbang} icon={Scale} color="success" subtitle={`${persenHadir}% dari sasaran`} />
      </div>

      {/* Baris 2: Status gizi & BB */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard title="Stunting" value={stunting} icon={AlertTriangle} color="destructive" subtitle={`${persenStunting}% dari ditimbang`} />
        <StatCard title="Mendapat PMT" value={mendapatPMT} icon={Gift} color="warning" subtitle="Layak PMT bulan ini" />
        <StatCard title="BB Naik" value={bbNaik} icon={TrendingUp} color="success" subtitle="Dibanding bulan lalu" />
        <StatCard title="BB Tidak Naik" value={bbTidakNaik} icon={TrendingDown} color="destructive" subtitle="Dibanding bulan lalu" />
      </div>

      {/* Baris 3: Rekap per kelompok usia */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard title="Ditimbang Usia 0-6 Bulan" value={usia_0_6} icon={Users} color="primary" />
        <StatCard title="Ditimbang Usia 7-11 Bulan" value={usia_7_11} icon={Users} color="accent" />
        <StatCard title="Ditimbang Usia 12-23 Bulan" value={usia_12_23} icon={Users} color="info" />
        <StatCard title="Ditimbang Usia 24-59 Bulan" value={usia_24_59} icon={Users} color="success" />
      </div>
    </div>
  );
}