const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { calculateUmurBulan } from '@/lib/giziCalculator';

const emptyForm = {
  nama_anak: '', nik_anak: '', jenis_kelamin: '', tempat_lahir: '', tanggal_lahir: '',
  nama_ibu: '', nik_ibu: '', nama_ayah: '', nik_ayah: '',
  dusun: '', rt: '', rw: '', desa_id: '', nama_desa: '', posyandu_id: '', nama_posyandu: '',
  nomor_kk: '', bb_lahir: '', pb_lahir: '',
  status_imd: false, status_vitamin_a: false, status_bpjs: false, status_aktif: true
};

export default function MasterAnak() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDesa, setFilterDesa] = useState('all');
  const [filterPosyandu, setFilterPosyandu] = useState('all');
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: anakList = [], isLoading } = useQuery({ queryKey: ['anak'], queryFn: () => db.entities.Anak.list() });
  const { data: desaList = [] } = useQuery({ queryKey: ['desa'], queryFn: () => db.entities.Desa.list() });
  const { data: posyanduList = [] } = useQuery({ queryKey: ['posyandu'], queryFn: () => db.entities.Posyandu.list() });

  const createMut = useMutation({
    mutationFn: d => db.entities.Anak.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['anak'] }); setOpen(false); toast.success('Anak berhasil ditambahkan'); }
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => db.entities.Anak.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['anak'] }); setOpen(false); toast.success('Data berhasil diubah'); }
  });
  const deleteMut = useMutation({
    mutationFn: id => db.entities.Anak.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['anak'] }); toast.success('Data anak berhasil dihapus'); }
  });

  const handleDesaChange = (desaId) => {
    const desa = desaList.find(d => d.id === desaId);
    setForm({ ...form, desa_id: desaId, nama_desa: desa?.nama_desa || '', posyandu_id: '', nama_posyandu: '' });
  };

  const handlePosyanduChange = (posyanduId) => {
    const posyandu = posyanduList.find(p => p.id === posyanduId);
    setForm({ ...form, posyandu_id: posyanduId, nama_posyandu: posyandu?.nama_posyandu || '' });
  };

  const handleSubmit = () => {
    if (!form.nama_anak || !form.tanggal_lahir || !form.jenis_kelamin || !form.desa_id || !form.posyandu_id) {
      toast.error('Nama, tanggal lahir, jenis kelamin, desa, dan posyandu wajib diisi');
      return;
    }
    const data = {
      ...form,
      bb_lahir: form.bb_lahir ? Number(form.bb_lahir) : undefined,
      pb_lahir: form.pb_lahir ? Number(form.pb_lahir) : undefined,
    };
    editId ? updateMut.mutate({ id: editId, data }) : createMut.mutate(data);
  };

  const openEdit = (a) => {
    setForm({
      nama_anak: a.nama_anak || '', nik_anak: a.nik_anak || '', jenis_kelamin: a.jenis_kelamin || '',
      tempat_lahir: a.tempat_lahir || '', tanggal_lahir: a.tanggal_lahir || '',
      nama_ibu: a.nama_ibu || '', nik_ibu: a.nik_ibu || '', nama_ayah: a.nama_ayah || '', nik_ayah: a.nik_ayah || '',
      dusun: a.dusun || '', rt: a.rt || '', rw: a.rw || '',
      desa_id: a.desa_id || '', nama_desa: a.nama_desa || '', posyandu_id: a.posyandu_id || '', nama_posyandu: a.nama_posyandu || '',
      nomor_kk: a.nomor_kk || '', bb_lahir: a.bb_lahir || '', pb_lahir: a.pb_lahir || '',
      status_imd: a.status_imd || false, status_vitamin_a: a.status_vitamin_a || false,
      status_bpjs: a.status_bpjs || false, status_aktif: a.status_aktif !== false
    });
    setEditId(a.id);
    setOpen(true);
  };
  const openNew = () => { setForm(emptyForm); setEditId(null); setOpen(true); };

  const filteredPosyandu = posyanduList.filter(p => !form.desa_id || p.desa_id === form.desa_id);
  const filterPosyanduOptions = posyanduList.filter(p => filterDesa === 'all' || p.desa_id === filterDesa);

  const filtered = anakList.filter(a => {
    const matchSearch = a.nama_anak?.toLowerCase().includes(search.toLowerCase()) || a.nik_anak?.includes(search);
    const matchDesa = filterDesa === 'all' || a.desa_id === filterDesa;
    const matchPosyandu = filterPosyandu === 'all' || a.posyandu_id === filterPosyandu;
    return matchSearch && matchDesa && matchPosyandu;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Data Anak" description="Kelola data balita" actions={
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Tambah Anak</Button>
      } />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari nama / NIK..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
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
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Anak</TableHead>
                <TableHead>NIK Anak</TableHead>
                <TableHead>L/P</TableHead>
                <TableHead>Tgl Lahir</TableHead>
                <TableHead>Umur</TableHead>
                <TableHead>Nama Ibu</TableHead>
                <TableHead>NIK Ibu</TableHead>
                <TableHead>Nama Ayah</TableHead>
                <TableHead>NIK Ayah</TableHead>
                <TableHead>Desa</TableHead>
                <TableHead>Dusun</TableHead>
                <TableHead>Posyandu</TableHead>
                <TableHead>BB Lahir</TableHead>
                <TableHead>PB Lahir</TableHead>
                <TableHead>Vit A</TableHead>
                <TableHead>BPJS</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={18} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={18} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>
              ) : filtered.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium whitespace-nowrap">{a.nama_anak}</TableCell>
                  <TableCell className="text-xs">{a.nik_anak || '-'}</TableCell>
                  <TableCell>{a.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}</TableCell>
                  <TableCell className="whitespace-nowrap">{a.tanggal_lahir}</TableCell>
                  <TableCell>{calculateUmurBulan(a.tanggal_lahir)} bln</TableCell>
                  <TableCell className="whitespace-nowrap">{a.nama_ibu || '-'}</TableCell>
                  <TableCell className="text-xs">{a.nik_ibu || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{a.nama_ayah || '-'}</TableCell>
                  <TableCell className="text-xs">{a.nik_ayah || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{a.nama_desa || '-'}</TableCell>
                  <TableCell>{a.dusun || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{a.nama_posyandu}</TableCell>
                  <TableCell>{a.bb_lahir ? `${a.bb_lahir} g` : '-'}</TableCell>
                  <TableCell>{a.pb_lahir ? `${a.pb_lahir} cm` : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={a.status_vitamin_a ? 'default' : 'secondary'}>{a.status_vitamin_a ? 'Ya' : 'Tidak'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.status_bpjs ? 'default' : 'secondary'}>{a.status_bpjs ? 'Ya' : 'Tidak'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.status_aktif !== false ? 'default' : 'secondary'}>{a.status_aktif !== false ? 'Aktif' : 'Nonaktif'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/anak/${a.id}`)}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Data Anak' : 'Tambah Anak'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Data Anak</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Nama Anak *</Label><Input value={form.nama_anak} onChange={e => setForm({...form, nama_anak: e.target.value})} /></div>
              <div><Label>NIK Anak</Label><Input value={form.nik_anak} onChange={e => setForm({...form, nik_anak: e.target.value})} /></div>
              <div>
                <Label>Jenis Kelamin *</Label>
                <Select value={form.jenis_kelamin} onValueChange={v => setForm({...form, jenis_kelamin: v})}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Tempat Lahir</Label><Input value={form.tempat_lahir} onChange={e => setForm({...form, tempat_lahir: e.target.value})} /></div>
              <div><Label>Tanggal Lahir *</Label><Input type="date" value={form.tanggal_lahir} onChange={e => setForm({...form, tanggal_lahir: e.target.value})} /></div>
              <div><Label>BB Lahir (gram)</Label><Input type="number" value={form.bb_lahir} onChange={e => setForm({...form, bb_lahir: e.target.value})} /></div>
              <div><Label>PB Lahir (cm)</Label><Input type="number" value={form.pb_lahir} onChange={e => setForm({...form, pb_lahir: e.target.value})} /></div>
              <div><Label>Nomor KK</Label><Input value={form.nomor_kk} onChange={e => setForm({...form, nomor_kk: e.target.value})} /></div>
            </div>

            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Data Orang Tua</p>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nama Ibu</Label><Input value={form.nama_ibu} onChange={e => setForm({...form, nama_ibu: e.target.value})} /></div>
              <div><Label>NIK Ibu</Label><Input value={form.nik_ibu} onChange={e => setForm({...form, nik_ibu: e.target.value})} /></div>
              <div><Label>Nama Ayah</Label><Input value={form.nama_ayah} onChange={e => setForm({...form, nama_ayah: e.target.value})} /></div>
              <div><Label>NIK Ayah</Label><Input value={form.nik_ayah} onChange={e => setForm({...form, nik_ayah: e.target.value})} /></div>
            </div>

            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Alamat & Posyandu</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Desa *</Label>
                <Select value={form.desa_id} onValueChange={handleDesaChange}>
                  <SelectTrigger><SelectValue placeholder="Pilih Desa" /></SelectTrigger>
                  <SelectContent>{desaList.map(d => <SelectItem key={d.id} value={d.id}>{d.nama_desa}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Posyandu *</Label>
                <Select value={form.posyandu_id} onValueChange={handlePosyanduChange}>
                  <SelectTrigger><SelectValue placeholder="Pilih Posyandu" /></SelectTrigger>
                  <SelectContent>{filteredPosyandu.map(p => <SelectItem key={p.id} value={p.id}>{p.nama_posyandu}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Dusun</Label><Input value={form.dusun} onChange={e => setForm({...form, dusun: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>RT</Label><Input value={form.rt} onChange={e => setForm({...form, rt: e.target.value})} /></div>
                <div><Label>RW</Label><Input value={form.rw} onChange={e => setForm({...form, rw: e.target.value})} /></div>
              </div>
            </div>

            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Status Layanan</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><Switch checked={form.status_imd} onCheckedChange={v => setForm({...form, status_imd: v})} /><Label>IMD</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.status_vitamin_a} onCheckedChange={v => setForm({...form, status_vitamin_a: v})} /><Label>Vitamin A</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.status_bpjs} onCheckedChange={v => setForm({...form, status_bpjs: v})} /><Label>BPJS</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.status_aktif} onCheckedChange={v => setForm({...form, status_aktif: v})} /><Label>Aktif</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit}>{editId ? 'Simpan' : 'Tambah'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}