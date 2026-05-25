const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown } from 'lucide-react';
import { BULAN_NAMES } from '@/lib/giziCalculator';

const TAHUN_OPTIONS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

export default function RekapLaporan() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [filterDesa, setFilterDesa] = useState('all');

  const { data: penimbanganList = [] } = useQuery({ queryKey: ['penimbangan'], queryFn: () => db.entities.Penimbangan.list() });
  const { data: anakList = [] } = useQuery({ queryKey: ['anak'], queryFn: () => db.entities.Anak.list() });
  const { data: desaList = [] } = useQuery({ queryKey: ['desa'], queryFn: () => db.entities.Desa.list() });
  const { data: posyanduList = [] } = useQuery({ queryKey: ['posyandu'], queryFn: () => db.entities.Posyandu.list() });

  const bulanData = penimbanganList.filter(p => p.bulan === Number(bulan) && p.tahun === Number(tahun));

  const desaFiltered = filterDesa === 'all' ? desaList : desaList.filter(d => d.id === filterDesa);

  const rekapPerDesa = desaFiltered.map(desa => {
    const anakDesa = anakList.filter(a => a.desa_id === desa.id && a.status_aktif !== false);
    const posyanduDesa = posyanduList.filter(p => p.desa_id === desa.id);
    const timbangDesa = bulanData.filter(p => p.desa_id === desa.id);

    const S = anakDesa.length; // Sasaran
    const K = anakDesa.filter(a => posyanduDesa.some(p => p.id === a.posyandu_id)).length; // Terdaftar
    const D = timbangDesa.length; // Ditimbang
    const N = timbangDesa.filter(p => p.status_bbu === 'Gizi Baik').length; // Naik/Gizi Baik

    const stuntingCount = timbangDesa.filter(p => p.status_stunting === 'Stunting').length;
    const pendekCount = timbangDesa.filter(p => p.status_tbu === 'Pendek').length;
    const sangatPendekCount = timbangDesa.filter(p => p.status_tbu === 'Sangat Pendek').length;
    const giziBurukCount = timbangDesa.filter(p => p.status_bbu === 'Gizi Buruk').length;
    const giziKurangCount = timbangDesa.filter(p => p.status_bbu === 'Gizi Kurang').length;

    const pctStunting = D > 0 ? ((stuntingCount / D) * 100).toFixed(1) : '0.0';
    const pctPendek = D > 0 ? ((pendekCount / D) * 100).toFixed(1) : '0.0';
    const pctSangatPendek = D > 0 ? ((sangatPendekCount / D) * 100).toFixed(1) : '0.0';

    return {
      desa, S, K, D, N, stuntingCount, pendekCount, sangatPendekCount,
      giziBurukCount, giziKurangCount, pctStunting, pctPendek, pctSangatPendek
    };
  });

  const totalS = rekapPerDesa.reduce((a, r) => a + r.S, 0);
  const totalK = rekapPerDesa.reduce((a, r) => a + r.K, 0);
  const totalD = rekapPerDesa.reduce((a, r) => a + r.D, 0);
  const totalN = rekapPerDesa.reduce((a, r) => a + r.N, 0);
  const totalStunting = rekapPerDesa.reduce((a, r) => a + r.stuntingCount, 0);
  const totalPendek = rekapPerDesa.reduce((a, r) => a + r.pendekCount, 0);
  const totalSangatPendek = rekapPerDesa.reduce((a, r) => a + r.sangatPendekCount, 0);
  const totalGiziBuruk = rekapPerDesa.reduce((a, r) => a + r.giziBurukCount, 0);
  const totalGiziKurang = rekapPerDesa.reduce((a, r) => a + r.giziKurangCount, 0);
  const totalPctStunting = totalD > 0 ? ((totalStunting / totalD) * 100).toFixed(1) : '0.0';
  const totalPctPendek = totalD > 0 ? ((totalPendek / totalD) * 100).toFixed(1) : '0.0';
  const totalPctSangatPendek = totalD > 0 ? ((totalSangatPendek / totalD) * 100).toFixed(1) : '0.0';

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Laporan"
        description="Laporan SKDN dan PSG bulanan"
        actions={
          <Button variant="outline" onClick={handleExportPDF}>
            <FileDown className="w-4 h-4 mr-2" />Export PDF
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={String(bulan)} onValueChange={v => setBulan(Number(v))}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{BULAN_NAMES.slice(1).map((b, i) => <SelectItem key={i+1} value={String(i+1)}>{b}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(tahun)} onValueChange={v => setTahun(Number(v))}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>{TAHUN_OPTIONS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterDesa} onValueChange={setFilterDesa}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Semua Desa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Desa</SelectItem>
            {desaList.map(d => <SelectItem key={d.id} value={d.id}>{d.nama_desa}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'S (Sasaran)', value: totalS, color: 'text-blue-600' },
          { label: 'K (Terdaftar)', value: totalK, color: 'text-purple-600' },
          { label: 'D (Ditimbang)', value: totalD, color: 'text-amber-600' },
          { label: 'N (Gizi Baik)', value: totalN, color: 'text-emerald-600' },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SKDN Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Laporan SKDN - {BULAN_NAMES[bulan]} {tahun}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Desa</TableHead>
                  <TableHead className="text-center">S</TableHead>
                  <TableHead className="text-center">K</TableHead>
                  <TableHead className="text-center">D</TableHead>
                  <TableHead className="text-center">N</TableHead>
                  <TableHead className="text-center">D/S (%)</TableHead>
                  <TableHead className="text-center">N/D (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rekapPerDesa.map(r => (
                  <TableRow key={r.desa.id}>
                    <TableCell className="font-medium">{r.desa.nama_desa}</TableCell>
                    <TableCell className="text-center">{r.S}</TableCell>
                    <TableCell className="text-center">{r.K}</TableCell>
                    <TableCell className="text-center">{r.D}</TableCell>
                    <TableCell className="text-center">{r.N}</TableCell>
                    <TableCell className="text-center">{r.S > 0 ? ((r.D / r.S) * 100).toFixed(1) : '0.0'}%</TableCell>
                    <TableCell className="text-center">{r.D > 0 ? ((r.N / r.D) * 100).toFixed(1) : '0.0'}%</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/30">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-center">{totalS}</TableCell>
                  <TableCell className="text-center">{totalK}</TableCell>
                  <TableCell className="text-center">{totalD}</TableCell>
                  <TableCell className="text-center">{totalN}</TableCell>
                  <TableCell className="text-center">{totalS > 0 ? ((totalD / totalS) * 100).toFixed(1) : '0.0'}%</TableCell>
                  <TableCell className="text-center">{totalD > 0 ? ((totalN / totalD) * 100).toFixed(1) : '0.0'}%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* PSG Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Laporan PSG (Status Gizi) - {BULAN_NAMES[bulan]} {tahun}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Desa</TableHead>
                  <TableHead className="text-center">Ditimbang</TableHead>
                  <TableHead className="text-center">Gizi Buruk</TableHead>
                  <TableHead className="text-center">Gizi Kurang</TableHead>
                  <TableHead className="text-center">Stunting</TableHead>
                  <TableHead className="text-center">% Stunting</TableHead>
                  <TableHead className="text-center">Pendek</TableHead>
                  <TableHead className="text-center">% Pendek</TableHead>
                  <TableHead className="text-center">Sangat Pendek</TableHead>
                  <TableHead className="text-center">% Sangat Pendek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rekapPerDesa.map(r => (
                  <TableRow key={r.desa.id}>
                    <TableCell className="font-medium">{r.desa.nama_desa}</TableCell>
                    <TableCell className="text-center">{r.D}</TableCell>
                    <TableCell className="text-center text-red-600 font-medium">{r.giziBurukCount}</TableCell>
                    <TableCell className="text-center text-amber-600 font-medium">{r.giziKurangCount}</TableCell>
                    <TableCell className="text-center text-red-600 font-medium">{r.stuntingCount}</TableCell>
                    <TableCell className="text-center">{r.pctStunting}%</TableCell>
                    <TableCell className="text-center text-amber-600 font-medium">{r.pendekCount}</TableCell>
                    <TableCell className="text-center">{r.pctPendek}%</TableCell>
                    <TableCell className="text-center text-red-600 font-medium">{r.sangatPendekCount}</TableCell>
                    <TableCell className="text-center">{r.pctSangatPendek}%</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/30">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-center">{totalD}</TableCell>
                  <TableCell className="text-center text-red-600">{totalGiziBuruk}</TableCell>
                  <TableCell className="text-center text-amber-600">{totalGiziKurang}</TableCell>
                  <TableCell className="text-center text-red-600">{totalStunting}</TableCell>
                  <TableCell className="text-center">{totalPctStunting}%</TableCell>
                  <TableCell className="text-center text-amber-600">{totalPendek}</TableCell>
                  <TableCell className="text-center">{totalPctPendek}%</TableCell>
                  <TableCell className="text-center text-red-600">{totalSangatPendek}</TableCell>
                  <TableCell className="text-center">{totalPctSangatPendek}%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}