const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, MapPin, Building, Baby,
  Scale, FileText, ChevronLeft, ChevronRight,
  Database, LogOut, Heart, Menu, X } from
'lucide-react';

import { Button } from '@/components/ui/button';

const menuItems = [
{ label: 'Dashboard', icon: LayoutDashboard, path: '/' },
{ label: 'Data Desa', icon: MapPin, path: '/desa' },
{ label: 'Data Posyandu', icon: Building, path: '/posyandu' },
{ label: 'Data Anak', icon: Baby, path: '/anak' },
{ label: 'Penimbangan', icon: Scale, path: '/penimbangan' },
{ label: 'Rekap Laporan', icon: FileText, path: '/rekap' },
{ label: 'Pengguna', icon: Users, path: '/pengguna' }];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, userRole }) {
  const location = useLocation();

  const filteredMenu = menuItems.filter((item) => {
    if (item.path === '/pengguna' && userRole !== 'super_admin' && userRole !== 'admin_puskesmas') return false;
    return true;
  });

  const sidebarContent =
  <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 bg-sidebar-primary flex items-center justify-center shrink-0 rounded-none">
          <Heart className="h-5 text-sidebar-primary-foreground opacity-100 w-" />
        </div>
        {!collapsed &&
      <div className="overflow-hidden">
            <h1 className="font-bold text-sm text-sidebar-foreground tracking-wide">SI-POSGIZI</h1>
            <p className="text-[10px] text-sidebar-foreground/60">Sistem Informasi Posyandu dan Status Gizi</p>
          </div>
      }
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {filteredMenu.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
            isActive ?
            'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20' :
            'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`
            }>
            
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>);

      })}
      </nav>

      {/* Collapse & Logout */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <button
        onClick={() => db.auth.logout()}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground w-full transition-colors">
        
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
        <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center w-full py-1.5 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors">
        
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen &&
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      }

      {/* Mobile sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-sidebar z-50 lg:hidden transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-sidebar-foreground/60">
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>
    </>);

}