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
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm = { nama_desa: '', kode_desa: '', kecamatan: '', nama_bidan: '' };

export default function MasterDesa() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: desaList = [], isLoading } = useQuery({ queryKey: ['desa'], queryFn: () => db.entities.Desa.list() });

  const createMut = useMutation({
    mutationFn: d => db.entities.Desa.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['desa'] }); setOpen(false); toast.success('Desa berhasil ditambahkan'); }
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => db.entities.Desa.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['desa'] }); setOpen(false); toast.success('Desa berhasil diubah'); }
  });
  const deleteMut = useMutation({
    mutationFn: id => db.entities.Desa.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['desa'] }); toast.success('Desa berhasil dihapus'); }
  });

  const handleSubmit = () => {
    if (!form.nama_desa) { toast.error('Nama desa wajib diisi'); return; }
    editId ? updateMut.mutate({ id: editId, data: form }) : createMut.mutate(form);
  };

  const openEdit = (d) => { setForm({ nama_desa: d.nama_desa, kode_desa: d.kode_desa || '', kecamatan: d.kecamatan || '', nama_bidan: d.nama_bidan || '' }); setEditId(d.id); setOpen(true); };
  const openNew = () => { setForm(emptyForm); setEditId(null); setOpen(true); };

  const filtered = desaList.filter(d => 
    d.nama_desa?.toLowerCase().includes(search.toLowerCase()) ||
    d.kecamatan?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Data Desa" description="Kelola master data desa" actions={
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Tambah Desa</Button>
      } />

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari desa..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Desa</TableHead>
                <TableHead>Kode Desa</TableHead>
                <TableHead>Kecamatan</TableHead>
                <TableHead>Bidan Desa</TableHead>
                <TableHead className="w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>
              ) : filtered.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.nama_desa}</TableCell>
                  <TableCell>{d.kode_desa}</TableCell>
                  <TableCell>{d.kecamatan}</TableCell>
                  <TableCell>{d.nama_bidan}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(d.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
          <DialogHeader><DialogTitle>{editId ? 'Edit Desa' : 'Tambah Desa'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nama Desa *</Label><Input value={form.nama_desa} onChange={e => setForm({...form, nama_desa: e.target.value})} /></div>
            <div><Label>Kode Desa</Label><Input value={form.kode_desa} onChange={e => setForm({...form, kode_desa: e.target.value})} /></div>
            <div><Label>Kecamatan</Label><Input value={form.kecamatan} onChange={e => setForm({...form, kecamatan: e.target.value})} /></div>
            <div><Label>Nama Bidan Desa</Label><Input value={form.nama_bidan} onChange={e => setForm({...form, nama_bidan: e.target.value})} /></div>
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