import React from 'react';
import { getStatusColor } from '@/lib/giziCalculator';

export default function StatusBadge({ status }) {
  if (!status) return null;
  const colorClass = getStatusColor(status);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${colorClass}`}>
      {status}
    </span>
  );
}