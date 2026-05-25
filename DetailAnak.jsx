const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/shared/StatusBadge';
import PageHeader from '@/components/shared/PageHeader';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { calculateUmurBulan, BULAN_NAMES } from '@/lib/giziCalculator';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DetailAnak() {
  const urlParams = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/');
  const anakId = pathParts[pathParts.length - 1];

  const { data: anakList = [] } = useQuery({ queryKey: ['anak'], queryFn: () => db.entities.Anak.list('-created_date', 500) });
  const { data: allPenimbangan = [] } = useQuery({ queryKey: ['penimbangan-all'], queryFn: () => db.entities.Penimbangan.list('-created_date', 2000) });

  const anak = anakList.find(a => a.id === anakId);
  const riwayat = allPenimbangan.filter(p => p.anak_id === anakId).sort((a, b) => {
    if (a.tahun !== b.tahun) return a.tahun - b.tahun;
    return a.bulan - b.bulan;
  });

  if (!anak) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Data anak tidak ditemukan</p>
        <Link to="/anak"><Button variant="outline" className="mt-4">Kembali</Button></Link>
      </div>
    );
  }

  const umur = calculateUmurBulan(anak.tanggal_lahir);

  const chartData = riwayat.map(r => ({
    period: `${BULAN_NAMES[r.bulan]?.slice(0, 3)} ${r.tahun}`,
    BB: r.berat_badan,
    TB: r.tinggi_badan,
    LK: r.lingkar_kepala || null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={anak.nama_anak} description="Riwayat pertumbuhan anak" actions={
        <Link to="/anak"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Kembali</Button></Link>
      } />

      {/* Info Card */}
      <Card className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">NIK</p>
            <p className="font-medium">{anak.nik_anak || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Jenis Kelamin</p>
            <Badge variant="outline" className={anak.jenis_kelamin === 'Laki-laki' ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-pink-600 border-pink-200 bg-pink-50'}>
              {anak.jenis_kelamin}
            </Badge>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Tanggal Lahir</p>
            <p className="font-medium">{anak.tanggal_lahir}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Umur</p>
            <p className="font-medium">{umur} bulan</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Nama Ibu</p>
            <p className="font-medium">{anak.nama_ibu || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Nama Ayah</p>
            <p className="font-medium">{anak.nama_ayah || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Desa</p>
            <p className="font-medium">{anak.nama_desa || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Posyandu</p>
            <p className="font-medium">{anak.nama_posyandu || '-'}</p>
          </div>
        </div>
      </Card>

      {/* Growth Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-4">Grafik Berat Badan (kg)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="BB" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-4">Grafik Tinggi Badan (cm)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="TB" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* History Table */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Riwayat Penimbangan</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead>Umur</TableHead>
                <TableHead>BB</TableHead>
                <TableHead>TB</TableHead>
                <TableHead>LK</TableHead>
                <TableHead>BB/U</TableHead>
                <TableHead>TB/U</TableHead>
                <TableHead>BB/TB</TableHead>
                <TableHead>Stunting</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riwayat.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">Belum ada riwayat</TableCell></TableRow>
              ) : riwayat.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-medium">{BULAN_NAMES[r.bulan]} {r.tahun}</TableCell>
                  <TableCell>{r.umur_bulan} bln</TableCell>
                  <TableCell>{r.berat_badan}</TableCell>
                  <TableCell>{r.tinggi_badan}</TableCell>
                  <TableCell>{r.lingkar_kepala || '-'}</TableCell>
                  <TableCell><StatusBadge status={r.status_bbu} /></TableCell>
                  <TableCell><StatusBadge status={r.status_tbu} /></TableCell>
                  <TableCell><StatusBadge status={r.status_bbtb} /></TableCell>
                  <TableCell><StatusBadge status={r.status_stunting} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}