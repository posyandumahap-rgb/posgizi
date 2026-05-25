import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const roleLabels = {
  super_admin: 'Super Admin',
  admin_puskesmas: 'Admin Puskesmas',
  admin_desa: 'Admin Desa',
  kader: 'Kader Posyandu'
};

export default function TopBar({ onMenuClick, user }) {
  return (
    <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="hidden sm:block">
            <h2 className="text-sm font-semibold text-foreground">SI-POSGIZI
Puskesmas Nanga Mahap</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {user?.full_name?.[0] || 'U'}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-foreground">{user?.full_name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground">{roleLabels[user?.role] || 'Kader'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>);
}