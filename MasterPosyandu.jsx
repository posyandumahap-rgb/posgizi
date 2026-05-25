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
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm = { nama_posyandu: '', desa_id: '', nama_desa: '', rt_rw: '', nama_kader: '', status_aktif: true };

export default function MasterPosyandu() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDesa, setFilterDesa] = useState('all');
  const qc = useQueryClient();

  const { data: posyanduList = [], isLoading } = useQuery({ queryKey: ['posyandu'], queryFn: () => db.entities.Posyandu.list() });
  const { data: desaList = [] } = useQuery({ queryKey: ['desa'], queryFn: () => db.entities.Desa.list() });

  const createMut = useMutation({
    mutationFn: d => db.entities.Posyandu.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['posyandu'] }); setOpen(false); toast.success('Posyandu berhasil ditambahkan'); }
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => db.entities.Posyandu.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['posyandu'] }); setOpen(false); toast.success('Posyandu berhasil diubah'); }
  });
  const deleteMut = useMutation({
    mutationFn: id => db.entities.Posyandu.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['posyandu'] }); toast.success('Posyandu berhasil dihapus'); }
  });

  const handleDesaChange = (desaId) => {
    const desa = desaList.find(d => d.id === desaId);
    setForm({ ...form, desa_id: desaId, nama_desa: desa?.nama_desa || '' });
  };

  const handleSubmit = () => {
    if (!form.nama_posyandu || !form.desa_id) { toast.error('Nama posyandu dan desa wajib diisi'); return; }
    editId ? updateMut.mutate({ id: editId, data: form }) : createMut.mutate(form);
  };

  const openEdit = (p) => {
    setForm({ nama_posyandu: p.nama_posyandu, desa_id: p.desa_id, nama_desa: p.nama_desa || '', rt_rw: p.rt_rw || '', nama_kader: p.nama_kader || '', status_aktif: p.status_aktif !== false });
    setEditId(p.id); setOpen(true);
  };
  const openNew = () => { setForm(emptyForm); setEditId(null); setOpen(true); };

  const filtered = posyanduList.filter(p => {
    const matchSearch = p.nama_posyandu?.toLowerCase().includes(search.toLowerCase()) || p.nama_kader?.toLowerCase().includes(search.toLowerCase());
    const matchDesa = filterDesa === 'all' || p.desa_id === filterDesa;
    return matchSearch && matchDesa;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Data Posyandu" description="Kelola master data posyandu" actions={
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Tambah Posyandu</Button>
      } />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari posyandu..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={filterDesa} onValueChange={setFilterDesa}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Semua Desa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Desa</SelectItem>
              {desaList.map(d => <SelectItem key={d.id} value={d.id}>{d.nama_desa}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Posyandu</TableHead>
                <TableHead>Desa</TableHead>
                <TableHead>RT/RW</TableHead>
                <TableHead>Kader</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>
              ) : filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nama_posyandu}</TableCell>
                  <TableCell>{p.nama_desa}</TableCell>
                  <TableCell>{p.rt_rw}</TableCell>
                  <TableCell>{p.nama_kader}</TableCell>
                  <TableCell>
                    <Badge variant={p.status_aktif !== false ? 'default' : 'secondary'}>
                      {p.status_aktif !== false ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Posyandu' : 'Tambah Posyandu'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nama Posyandu *</Label><Input value={form.nama_posyandu} onChange={e => setForm({...form, nama_posyandu: e.target.value})} /></div>
            <div>
              <Label>Desa *</Label>
              <Select value={form.desa_id} onValueChange={handleDesaChange}>
                <SelectTrigger><SelectValue placeholder="Pilih Desa" /></SelectTrigger>
                <SelectContent>{desaList.map(d => <SelectItem key={d.id} value={d.id}>{d.nama_desa}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>RT/RW</Label><Input value={form.rt_rw} onChange={e => setForm({...form, rt_rw: e.target.value})} /></div>
            <div><Label>Nama Kader</Label><Input value={form.nama_kader} onChange={e => setForm({...form, nama_kader: e.target.value})} /></div>
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