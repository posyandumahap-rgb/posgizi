const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Pencil, Download } from 'lucide-react';
import { toast } from 'sonner';
import { calculateAllStatus, calculateUmurBulan, getStatusColor, BULAN_NAMES, calculateStatusPMT } from '@/lib/giziCalculator';
import AnakSearchInput from '@/components/penimbangan/AnakSearchInput';
import * as XLSX from 'xlsx';

const TAHUN_OPTIONS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

const STATUS_GIZI_OPTIONS = [
  { value: 'all', label: 'Semua Status Gizi' },
  // BB/U
  { value: 'bbu_Gizi Buruk', label: 'BB/U: Gizi Buruk' },
  { value: 'bbu_Gizi Kurang', label: 'BB/U: Gizi Kurang' },
  { value: 'bbu_Gizi Baik', label: 'BB/U: Gizi Baik' },
  { value: 'bbu_Risiko Gizi Lebih', label: 'BB/U: Risiko Gizi Lebih' },
  // TB/U
  { value: 'tbu_Sangat Pendek', label: 'TB/U: Sangat Pendek' },
  { value: 'tbu_Pendek', label: 'TB/U: Pendek' },
  { value: 'tbu_Normal', label: 'TB/U: Normal' },
  { value: 'tbu_Tinggi', label: 'TB/U: Tinggi' },
  // BB/TB
  { value: 'bbtb_Sangat Kurus', label: 'BB/TB: Sangat Kurus' },
  { value: 'bbtb_Kurus', label: 'BB/TB: Kurus' },
  { value: 'bbtb_Normal', label: 'BB/TB: Normal' },
  { value: 'bbtb_Gemuk', label: 'BB/TB: Gemuk' },
];

function getPrevBulanTahun(bulan, tahun) {
  if (bulan === 1) return { bulan: 12, tahun: tahun - 1 };
  return { bulan: bulan - 1, tahun };
}

function NaikTidak({ curr, prev }) {
  if (prev == null || curr == null) return <span className="text-gray-400 text-xs">-</span>;
  const naik = curr > prev;
  return (
    <span className={`text-xs font-semibold ${naik ? 'text-emerald-600' : 'text-red-600'}`}>
      {naik ? '▲ Naik' : '▼ Tidak'}
    </span>
  );
}

export default function Penimbangan() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [filterDesa, setFilterDesa] = useState('all');
  const [filterPosyandu, setFilterPosyandu] = useState('all');
  const [filterStatusGizi, setFilterStatusGizi] = useState('all');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ anak_id: '', bb: '', tb: '', lk: '', tanggal: '', posyandu_id: '' });
  const qc = useQueryClient();

  const { data: penimbanganList = [], isLoading } = useQuery({ queryKey: ['penimbangan'], queryFn: () => db.entities.Penimbangan.list() });
  const { data: anakList = [] } = useQuery({ queryKey: ['anak'], queryFn: () => db.entities.Anak.list() });
  const { data: desaList = [] } = useQuery({ queryKey: ['desa'], queryFn: () => db.entities.Desa.list() });
  const { data: posyanduList = [] } = useQuery({ queryKey: ['posyandu'], queryFn: () => db.entities.Posyandu.list() });

  const createMut = useMutation({
    mutationFn: d => db.entities.Penimbangan.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['penimbangan'] }); setOpen(false); toast.success('Data penimbangan berhasil disimpan'); }
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => db.entities.Penimbangan.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['penimbangan'] }); setOpen(false); toast.success('Data berhasil diubah'); }
  });
  const deleteMut = useMutation({
    mutationFn: id => db.entities.Penimbangan.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['penimbangan'] }); toast.success('Data dihapus'); }
  });

  // Anak filtered by selected posyandu (for form search)
  const anakByPosyandu = anakList.filter(a => !form.posyandu_id || a.posyandu_id === form.posyandu_id);

  const handleSubmit = () => {
    if (!form.anak_id || !form.bb || !form.tb) { toast.error('Anak, BB, dan TB wajib diisi'); return; }
    const anak = anakList.find(a => a.id === form.anak_id);
    if (!anak) return;
    const umurBulan = calculateUmurBulan(anak.tanggal_lahir);
    const statuses = calculateAllStatus(Number(form.bb), Number(form.tb), umurBulan, anak.jenis_kelamin);
    const posyandu = posyanduList.find(p => p.id === (form.posyandu_id || anak.posyandu_id));
    const desa = desaList.find(d => d.id === anak.desa_id);
    const payload = {
      anak_id: anak.id, nama_anak: anak.nama_anak,
      desa_id: anak.desa_id, nama_desa: desa?.nama_desa || anak.nama_desa || '',
      posyandu_id: posyandu?.id || anak.posyandu_id, nama_posyandu: posyandu?.nama_posyandu || anak.nama_posyandu || '',
      bulan: Number(bulan), tahun: Number(tahun),
      berat_badan: Number(form.bb), tinggi_badan: Number(form.tb),
      lingkar_kepala: form.lk ? Number(form.lk) : undefined,
      umur_bulan: umurBulan, jenis_kelamin: anak.jenis_kelamin,
      tanggal_penimbangan: form.tanggal || `${tahun}-${String(bulan).padStart(2,'0')}-01`,
      ...statuses
    };
    editId ? updateMut.mutate({ id: editId, data: payload }) : createMut.mutate(payload);
  };

  const openEdit = (p) => {
    setForm({ anak_id: p.anak_id, bb: p.berat_badan, tb: p.tinggi_badan, lk: p.lingkar_kepala || '', tanggal: p.tanggal_penimbangan || '', posyandu_id: p.posyandu_id || '' });
    setEditId(p.id);
    setOpen(true);
  };

  const openNew = () => {
    setForm({ anak_id: '', bb: '', tb: '', lk: '', tanggal: '', posyandu_id: filterPosyandu !== 'all' ? filterPosyandu : '' });
    setEditId(null);
    setOpen(true);
  };

  const filterPosyanduOptions = posyanduList.filter(p => filterDesa === 'all' || p.desa_id === filterDesa);

  // Build previous month lookup
  const { bulan: prevBulan, tahun: prevTahun } = getPrevBulanTahun(Number(bulan), Number(tahun));
  const prevMonthMap = {};
  penimbanganList.forEach(p => {
    if (p.bulan === prevBulan && p.tahun === prevTahun) prevMonthMap[p.anak_id] = p;
  });

  // Anak lookup
  const anakMap = {};
  anakList.forEach(a => { anakMap[a.id] = a; });

  // Filtering
  const filtered = penimbanganList.filter(p => {
    const matchBulan = p.bulan === Number(bulan) && p.tahun === Number(tahun);
    const matchDesa = filterDesa === 'all' || p.desa_id === filterDesa;
    const matchPosyandu = filterPosyandu === 'all' || p.posyandu_id === filterPosyandu;
    let matchStatus = true;
    if (filterStatusGizi !== 'all') {
      const [field, val] = filterStatusGizi.split('_');
      if (field === 'bbu') matchStatus = p.status_bbu === val;
      else if (field === 'tbu') matchStatus = p.status_tbu === val;
      else if (field === 'bbtb') matchStatus = p.status_bbtb === val;
    }
    return matchBulan && matchDesa && matchPosyandu && matchStatus;
  });

  // Export Excel
  const handleExport = () => {
    const bulanLabel = BULAN_NAMES[Number(bulan)] || bulan;
    const desaLabel = filterDesa === 'all' ? 'Semua Desa' : (desaList.find(d => d.id === filterDesa)?.nama_desa || filterDesa);
    const posyanduLabel = filterPosyandu === 'all' ? 'Semua Posyandu' : (posyanduList.find(p => p.id === filterPosyandu)?.nama_posyandu || filterPosyandu);

    const rows = filtered.map((p, idx) => {
      const prev = prevMonthMap[p.anak_id];
      const anak = anakMap[p.anak_id];
      const statusPMT = calculateStatusPMT(p, prev);
      return {
        'No': idx + 1,
        'Nama Anak': p.nama_anak,
        'NIK Anak': anak?.nik_anak || '',
        'Nama Ibu': anak?.nama_ibu || '',
        'NIK Ibu': anak?.nik_ibu || '',
        'Nama Ayah': anak?.nama_ayah || '',
        'NIK Ayah': anak?.nik_ayah || '',
        'Desa': p.nama_desa || '',
        'Posyandu': p.nama_posyandu || '',
        'Umur (Bulan)': p.umur_bulan,
        'PB Bln Ini (cm)': p.tinggi_badan,
        'PB Bln Lalu (cm)': prev?.tinggi_badan || '',
        'BB Bln Ini (kg)': p.berat_badan,
        'BB Bln Lalu (kg)': prev?.berat_badan || '',
        'LIKA Bln Ini (cm)': p.lingkar_kepala || '',
        'LIKA Bln Lalu (cm)': prev?.lingkar_kepala || '',
        'Status BB/U': p.status_bbu || '',
        'Status TB/U': p.status_tbu || '',
        'Status BB/TB': p.status_bbtb || '',
        'Status Stunting': p.status_stunting || '',
        'PMT': statusPMT,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Penimbangan');
    XLSX.writeFile(wb, `Penimbangan_${bulanLabel}_${tahun}_${desaLabel}_${posyanduLabel}.xlsx`);
    toast.success('File Excel berhasil diunduh');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Penimbangan Bulanan" description="Input data penimbangan balita" actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-2" />Export Excel</Button>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Input Penimbangan</Button>
        </div>
      } />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Select value={String(bulan)} onValueChange={v => setBulan(Number(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{BULAN_NAMES.slice(1).map((b, i) => <SelectItem key={i+1} value={String(i+1)}>{b}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(tahun)} onValueChange={v => setTahun(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{TAHUN_OPTIONS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterDesa} onValueChange={v => { setFilterDesa(v); setFilterPosyandu('all'); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Semua Desa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Desa</SelectItem>
              {desaList.map(d => <SelectItem key={d.id} value={d.id}>{d.nama_desa}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPosyandu} onValueChange={setFilterPosyandu}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Semua Posyandu" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Posyandu</SelectItem>
              {filterPosyanduOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.nama_posyandu}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatusGizi} onValueChange={setFilterStatusGizi}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Semua Status Gizi" /></SelectTrigger>
            <SelectContent>
              {STATUS_GIZI_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground mb-2">Menampilkan {filtered.length} data</p>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Nama Anak</TableHead>
                <TableHead className="whitespace-nowrap">NIK Anak</TableHead>
                <TableHead className="whitespace-nowrap">Nama Ibu</TableHead>
                <TableHead className="whitespace-nowrap">NIK Ibu</TableHead>
                <TableHead className="whitespace-nowrap">Nama Ayah</TableHead>
                <TableHead className="whitespace-nowrap">NIK Ayah</TableHead>
                <TableHead className="whitespace-nowrap">Desa</TableHead>
                <TableHead className="whitespace-nowrap">Umur</TableHead>
                <TableHead className="whitespace-nowrap text-center bg-blue-50">PB Bln Ini (cm)</TableHead>
                <TableHead className="whitespace-nowrap text-center bg-blue-50">PB Bln Lalu (cm)</TableHead>
                <TableHead className="whitespace-nowrap text-center bg-blue-50">PB Naik?</TableHead>
                <TableHead className="whitespace-nowrap text-center bg-green-50">BB Bln Ini (kg)</TableHead>
                <TableHead className="whitespace-nowrap text-center bg-green-50">BB Bln Lalu (kg)</TableHead>
                <TableHead className="whitespace-nowrap text-center bg-green-50">BB Naik?</TableHead>
                <TableHead className="whitespace-nowrap text-center bg-yellow-50">LIKA Bln Ini (cm)</TableHead>
                <TableHead className="whitespace-nowrap text-center bg-yellow-50">LIKA Bln Lalu (cm)</TableHead>
                <TableHead className="whitespace-nowrap text-center bg-yellow-50">LIKA Naik?</TableHead>
                <TableHead className="whitespace-nowrap">BB/U</TableHead>
                <TableHead className="whitespace-nowrap">TB/U</TableHead>
                <TableHead className="whitespace-nowrap">BB/TB</TableHead>
                <TableHead className="whitespace-nowrap">Stunting</TableHead>
                <TableHead className="whitespace-nowrap">PMT</TableHead>
                <TableHead className="w-20">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={23} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={23} className="text-center py-8 text-muted-foreground">Belum ada data penimbangan</TableCell></TableRow>
              ) : filtered.map(p => {
                const prev = prevMonthMap[p.anak_id];
                const anak = anakMap[p.anak_id];
                const statusPMT = calculateStatusPMT(p, prev);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium whitespace-nowrap">{p.nama_anak}</TableCell>
                    <TableCell className="text-xs">{anak?.nik_anak || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{anak?.nama_ibu || '-'}</TableCell>
                    <TableCell className="text-xs">{anak?.nik_ibu || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{anak?.nama_ayah || '-'}</TableCell>
                    <TableCell className="text-xs">{anak?.nik_ayah || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{p.nama_desa || '-'}</TableCell>
                    <TableCell>{p.umur_bulan} bln</TableCell>
                    <TableCell className="text-center bg-blue-50/30">{p.tinggi_badan ?? '-'}</TableCell>
                    <TableCell className="text-center bg-blue-50/30 text-muted-foreground text-xs">{prev?.tinggi_badan ?? '-'}</TableCell>
                    <TableCell className="text-center bg-blue-50/30"><NaikTidak curr={p.tinggi_badan} prev={prev?.tinggi_badan} /></TableCell>
                    <TableCell className="text-center bg-green-50/30">{p.berat_badan ?? '-'}</TableCell>
                    <TableCell className="text-center bg-green-50/30 text-muted-foreground text-xs">{prev?.berat_badan ?? '-'}</TableCell>
                    <TableCell className="text-center bg-green-50/30"><NaikTidak curr={p.berat_badan} prev={prev?.berat_badan} /></TableCell>
                    <TableCell className="text-center bg-yellow-50/30">{p.lingkar_kepala ?? '-'}</TableCell>
                    <TableCell className="text-center bg-yellow-50/30 text-muted-foreground text-xs">{prev?.lingkar_kepala ?? '-'}</TableCell>
                    <TableCell className="text-center bg-yellow-50/30"><NaikTidak curr={p.lingkar_kepala} prev={prev?.lingkar_kepala} /></TableCell>
                    <TableCell><span className={`px-2 py-0.5 rounded border text-xs font-medium whitespace-nowrap ${getStatusColor(p.status_bbu)}`}>{p.status_bbu}</span></TableCell>
                    <TableCell><span className={`px-2 py-0.5 rounded border text-xs font-medium whitespace-nowrap ${getStatusColor(p.status_tbu)}`}>{p.status_tbu}</span></TableCell>
                    <TableCell><span className={`px-2 py-0.5 rounded border text-xs font-medium whitespace-nowrap ${getStatusColor(p.status_bbtb)}`}>{p.status_bbtb}</span></TableCell>
                    <TableCell><span className={`px-2 py-0.5 rounded border text-xs font-medium whitespace-nowrap ${getStatusColor(p.status_stunting)}`}>{p.status_stunting}</span></TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded border text-xs font-medium whitespace-nowrap ${statusPMT === 'Dapat' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                        {statusPMT}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Penimbangan' : 'Input Penimbangan'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Posyandu</Label>
              <Select value={form.posyandu_id} onValueChange={v => setForm({ ...form, posyandu_id: v, anak_id: '' })}>
                <SelectTrigger><SelectValue placeholder="Pilih Posyandu dulu" /></SelectTrigger>
                <SelectContent>{posyanduList.map(p => <SelectItem key={p.id} value={p.id}>{p.nama_posyandu}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Anak *</Label>
              <AnakSearchInput
                anakList={anakByPosyandu}
                value={form.anak_id}
                onChange={v => setForm({ ...form, anak_id: v })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>BB (kg) *</Label><Input type="number" step="0.1" value={form.bb} onChange={e => setForm({...form, bb: e.target.value})} /></div>
              <div><Label>PB/TB (cm) *</Label><Input type="number" step="0.1" value={form.tb} onChange={e => setForm({...form, tb: e.target.value})} /></div>
              <div><Label>LIKA (cm)</Label><Input type="number" step="0.1" value={form.lk} onChange={e => setForm({...form, lk: e.target.value})} /></div>
            </div>
            <div><Label>Tanggal Penimbangan</Label><Input type="date" value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}