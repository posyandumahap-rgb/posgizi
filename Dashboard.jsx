const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';
import { useQuery } from '@tanstack/react-query';

import PageHeader from '@/components/shared/PageHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BULAN_NAMES } from '@/lib/giziCalculator';

export default function Dashboard() {
  const now = new Date();
  const [bulan, setBulan] = React.useState(now.getMonth() + 1);
  const [tahun, setTahun] = React.useState(now.getFullYear());

  const { data: anak = [] } = useQuery({ queryKey: ['anak'], queryFn: () => db.entities.Anak.list('-created_date', 500) });
  const { data: desa = [] } = useQuery({ queryKey: ['desa'], queryFn: () => db.entities.Desa.list() });
  const { data: posyandu = [] } = useQuery({ queryKey: ['posyandu'], queryFn: () => db.entities.Posyandu.list() });
  const { data: allPenimbangan = [] } = useQuery({ queryKey: ['penimbangan-all'], queryFn: () => db.entities.Penimbangan.list('-created_date', 2000) });

  const penimbanganBulanIni = allPenimbangan.filter(p => p.bulan === bulan && p.tahun === tahun);

  const years = [];
  for (let y = 2023; y <= now.getFullYear() + 1; y++) years.push(y);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Monitoring status gizi dan capaian Posyandu"
        actions={
          <div className="flex gap-2">
            <Select value={String(bulan)} onValueChange={v => setBulan(Number(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                  <SelectItem key={m} value={String(m)}>{BULAN_NAMES[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(tahun)} onValueChange={v => setTahun(Number(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <DashboardStats anak={anak} desa={desa} posyandu={posyandu} penimbanganBulanIni={penimbanganBulanIni} allPenimbangan={allPenimbangan} bulan={bulan} tahun={tahun} />
      <DashboardCharts penimbanganBulanIni={penimbanganBulanIni} allPenimbangan={allPenimbangan} anak={anak} />
    </div>
  );
}