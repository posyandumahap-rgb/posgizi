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
import { UserPlus, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const roleLabels = {
  super_admin: 'Super Admin',
  admin_puskesmas: 'Admin Puskesmas',
  admin_desa: 'Admin Desa',
  kader: 'Kader Posyandu'
};

const roleColors = {
  super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
  admin_puskesmas: 'bg-blue-50 text-blue-700 border-blue-200',
  admin_desa: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  kader: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function Pengguna() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'kader' });
  const [editForm, setEditForm] = useState({ id: '', role: '', desa_id: '', posyandu_id: '' });
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: () => db.entities.User.list() });
  const { data: desaList = [] } = useQuery({ queryKey: ['desa'], queryFn: () => db.entities.Desa.list() });
  const { data: posyanduList = [] } = useQuery({ queryKey: ['posyandu'], queryFn: () => db.entities.Posyandu.list() });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => db.entities.User.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setEditOpen(false); toast.success('Data pengguna berhasil diubah'); }
  });

  const handleInvite = async () => {
    if (!inviteForm.email) { toast.error('Email wajib diisi'); return; }
    const role = inviteForm.role === 'super_admin' ? 'admin' : 'user';
    await db.users.inviteUser(inviteForm.email, role);
    toast.success('Undangan berhasil dikirim');
    setInviteOpen(false);
  };

  const openEdit = (u) => {
    setEditForm({ id: u.id, role: u.role || 'kader', desa_id: u.desa_id || '', posyandu_id: u.posyandu_id || '' });
    setEditOpen(true);
  };

  const handleEditSubmit = () => {
    updateMut.mutate({ id: editForm.id, data: { role: editForm.role, desa_id: editForm.desa_id, posyandu_id: editForm.posyandu_id } });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Manajemen Pengguna" description="Kelola akses pengguna" actions={
        <Button onClick={() => setInviteOpen(true)}><UserPlus className="w-4 h-4 mr-2" />Undang Pengguna</Button>
      } />

      <Card className="p-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-16">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
              ) : users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleColors[u.role] || roleColors.kader}>
                      {roleLabels[u.role] || 'Kader'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Undang Pengguna</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Email</Label><Input type="email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} /></div>
            <div>
              <Label>Role</Label>
              <Select value={inviteForm.role} onValueChange={v => setInviteForm({...inviteForm, role: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin_puskesmas">Admin Puskesmas</SelectItem>
                  <SelectItem value="admin_desa">Admin Desa</SelectItem>
                  <SelectItem value="kader">Kader Posyandu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Batal</Button>
            <Button onClick={handleInvite}>Kirim Undangan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Pengguna</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={v => setEditForm({...editForm, role: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin_puskesmas">Admin Puskesmas</SelectItem>
                  <SelectItem value="admin_desa">Admin Desa</SelectItem>
                  <SelectItem value="kader">Kader Posyandu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Desa</Label>
              <Select value={editForm.desa_id} onValueChange={v => setEditForm({...editForm, desa_id: v})}>
                <SelectTrigger><SelectValue placeholder="Pilih Desa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {desaList.map(d => <SelectItem key={d.id} value={d.id}>{d.nama_desa}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Posyandu</Label>
              <Select value={editForm.posyandu_id} onValueChange={v => setEditForm({...editForm, posyandu_id: v})}>
                <SelectTrigger><SelectValue placeholder="Pilih Posyandu" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {posyanduList.map(p => <SelectItem key={p.id} value={p.id}>{p.nama_posyandu}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
            <Button onClick={handleEditSubmit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}