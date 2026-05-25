import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function AnakSearchInput({ anakList, value, onChange }) {
  const selectedAnak = anakList.find(a => a.id === value);
  const [query, setQuery] = useState(selectedAnak?.nama_anak || '');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const selected = anakList.find(a => a.id === value);
    setQuery(selected?.nama_anak || '');
  }, [value, anakList]);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const suggestions = query.trim().length === 0
    ? anakList.slice(0, 30)
    : anakList.filter(a => a.nama_anak.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (anak) => {
    setQuery(anak.nama_anak);
    setOpen(false);
    onChange(anak.id);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setOpen(true);
    if (!e.target.value) onChange('');
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Ketik nama anak..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map(a => (
            <div
              key={a.id}
              className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
              onMouseDown={() => handleSelect(a)}
            >
              <div className="font-medium">{a.nama_anak}</div>
              <div className="text-xs text-muted-foreground">{a.nama_desa} · {a.nama_posyandu}</div>
            </div>
          ))}
        </div>
      )}
      {open && suggestions.length === 0 && query.trim().length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-md shadow-lg px-3 py-3 text-sm text-muted-foreground">
          Tidak ada anak ditemukan
        </div>
      )}
    </div>
  );
}