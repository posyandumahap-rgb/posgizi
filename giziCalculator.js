// Simplified WHO Z-Score based nutritional status calculator
// Uses approximate median/SD values for classification

const WHO_BBU_BOYS = {
  0: { median: 3.3, sd: 0.5 }, 1: { median: 4.5, sd: 0.6 }, 2: { median: 5.6, sd: 0.7 },
  3: { median: 6.4, sd: 0.8 }, 4: { median: 7.0, sd: 0.8 }, 5: { median: 7.5, sd: 0.9 },
  6: { median: 7.9, sd: 0.9 }, 7: { median: 8.3, sd: 1.0 }, 8: { median: 8.6, sd: 1.0 },
  9: { median: 8.9, sd: 1.0 }, 10: { median: 9.2, sd: 1.1 }, 11: { median: 9.4, sd: 1.1 },
  12: { median: 9.6, sd: 1.1 }, 15: { median: 10.3, sd: 1.2 }, 18: { median: 10.9, sd: 1.3 },
  21: { median: 11.5, sd: 1.3 }, 24: { median: 12.2, sd: 1.4 }, 30: { median: 13.3, sd: 1.5 },
  36: { median: 14.3, sd: 1.7 }, 42: { median: 15.3, sd: 1.8 }, 48: { median: 16.3, sd: 2.0 },
  54: { median: 17.3, sd: 2.1 }, 60: { median: 18.3, sd: 2.3 }
};

const WHO_BBU_GIRLS = {
  0: { median: 3.2, sd: 0.4 }, 1: { median: 4.2, sd: 0.5 }, 2: { median: 5.1, sd: 0.6 },
  3: { median: 5.8, sd: 0.7 }, 4: { median: 6.4, sd: 0.7 }, 5: { median: 6.9, sd: 0.8 },
  6: { median: 7.3, sd: 0.8 }, 7: { median: 7.6, sd: 0.9 }, 8: { median: 7.9, sd: 0.9 },
  9: { median: 8.2, sd: 0.9 }, 10: { median: 8.5, sd: 1.0 }, 11: { median: 8.7, sd: 1.0 },
  12: { median: 8.9, sd: 1.0 }, 15: { median: 9.6, sd: 1.1 }, 18: { median: 10.2, sd: 1.2 },
  21: { median: 10.9, sd: 1.2 }, 24: { median: 11.5, sd: 1.3 }, 30: { median: 12.7, sd: 1.5 },
  36: { median: 13.9, sd: 1.6 }, 42: { median: 15.0, sd: 1.8 }, 48: { median: 16.1, sd: 2.0 },
  54: { median: 17.2, sd: 2.1 }, 60: { median: 18.2, sd: 2.3 }
};

const WHO_TBU_BOYS = {
  0: { median: 49.9, sd: 2.0 }, 1: { median: 54.7, sd: 2.1 }, 2: { median: 58.4, sd: 2.2 },
  3: { median: 61.4, sd: 2.3 }, 4: { median: 63.9, sd: 2.3 }, 5: { median: 65.9, sd: 2.4 },
  6: { median: 67.6, sd: 2.4 }, 7: { median: 69.2, sd: 2.5 }, 8: { median: 70.6, sd: 2.5 },
  9: { median: 72.0, sd: 2.5 }, 10: { median: 73.3, sd: 2.6 }, 11: { median: 74.5, sd: 2.6 },
  12: { median: 75.7, sd: 2.6 }, 15: { median: 79.1, sd: 2.8 }, 18: { median: 82.3, sd: 3.0 },
  21: { median: 85.1, sd: 3.1 }, 24: { median: 87.8, sd: 3.3 }, 30: { median: 92.4, sd: 3.5 },
  36: { median: 96.1, sd: 3.7 }, 42: { median: 99.7, sd: 3.9 }, 48: { median: 103.3, sd: 4.1 },
  54: { median: 106.7, sd: 4.3 }, 60: { median: 110.0, sd: 4.5 }
};

const WHO_TBU_GIRLS = {
  0: { median: 49.1, sd: 1.9 }, 1: { median: 53.7, sd: 2.0 }, 2: { median: 57.1, sd: 2.1 },
  3: { median: 59.8, sd: 2.2 }, 4: { median: 62.1, sd: 2.3 }, 5: { median: 64.0, sd: 2.3 },
  6: { median: 65.7, sd: 2.4 }, 7: { median: 67.3, sd: 2.4 }, 8: { median: 68.7, sd: 2.5 },
  9: { median: 70.1, sd: 2.5 }, 10: { median: 71.5, sd: 2.5 }, 11: { median: 72.8, sd: 2.6 },
  12: { median: 74.0, sd: 2.6 }, 15: { median: 77.5, sd: 2.8 }, 18: { median: 80.7, sd: 3.0 },
  21: { median: 83.7, sd: 3.1 }, 24: { median: 86.4, sd: 3.3 }, 30: { median: 91.2, sd: 3.5 },
  36: { median: 95.1, sd: 3.7 }, 42: { median: 99.0, sd: 3.9 }, 48: { median: 102.7, sd: 4.1 },
  54: { median: 106.2, sd: 4.3 }, 60: { median: 109.4, sd: 4.5 }
};

function getClosestAge(age, table) {
  const ages = Object.keys(table).map(Number).sort((a, b) => a - b);
  let closest = ages[0];
  for (const a of ages) {
    if (Math.abs(a - age) < Math.abs(closest - age)) closest = a;
  }
  return closest;
}

function calculateZScore(value, median, sd) {
  return (value - median) / sd;
}

// BB/U: z < -3 = Sangat Kurang, z < -2 = Kurang, z <= 1 = Normal, z > 1 = Risiko Lebih
export function calculateBBU(bb, umurBulan, jenisKelamin) {
  const table = jenisKelamin === 'Laki-laki' ? WHO_BBU_BOYS : WHO_BBU_GIRLS;
  const age = getClosestAge(umurBulan, table);
  const { median, sd } = table[age];
  const z = calculateZScore(bb, median, sd);

  if (z < -3) return 'Sangat Kurang';
  if (z < -2) return 'Kurang';
  if (z <= 1) return 'Normal';
  return 'Risiko Lebih';
}

// TB/U: z < -3 = Sangat Pendek, z < -2 = Pendek, z <= 3 = Normal, z > 3 = Tinggi
export function calculateTBU(tb, umurBulan, jenisKelamin) {
  const table = jenisKelamin === 'Laki-laki' ? WHO_TBU_BOYS : WHO_TBU_GIRLS;
  const age = getClosestAge(umurBulan, table);
  const { median, sd } = table[age];
  const z = calculateZScore(tb, median, sd);

  if (z < -3) return 'Sangat Pendek';
  if (z < -2) return 'Pendek';
  if (z <= 3) return 'Normal';
  return 'Tinggi';
}

// BB/TB: z < -3 = Gizi Buruk, z < -2 = Gizi Kurang, z <= 1 = Normal, z <= 2 = Risiko Gizi Lebih, z <= 3 = Gizi Lebih, z > 3 = Obesitas
export function calculateBBTB(bb, tb, jenisKelamin) {
  const isBoy = jenisKelamin === 'Laki-laki';
  const expectedBB = isBoy ? (tb * 0.176 - 2.8) : (tb * 0.172 - 2.6);
  const sd = expectedBB * 0.12;
  const z = calculateZScore(bb, expectedBB, sd);

  if (z < -3) return 'Gizi Buruk';
  if (z < -2) return 'Gizi Kurang';
  if (z <= 1) return 'Normal';
  if (z <= 2) return 'Risiko Gizi Lebih';
  if (z <= 3) return 'Gizi Lebih';
  return 'Obesitas';
}

export function calculateStunting(statusTBU) {
  return (statusTBU === 'Sangat Pendek' || statusTBU === 'Pendek') ? 'Stunting' : 'Tidak Stunting';
}

export function calculateUmurBulan(tanggalLahir) {
  const birth = new Date(tanggalLahir);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(0, months);
}

export function calculateAllStatus(bb, tb, umurBulan, jenisKelamin) {
  const status_bbu = calculateBBU(bb, umurBulan, jenisKelamin);
  const status_tbu = calculateTBU(tb, umurBulan, jenisKelamin);
  const status_bbtb = calculateBBTB(bb, tb, jenisKelamin);
  const status_stunting = calculateStunting(status_tbu);

  return { status_bbu, status_tbu, status_bbtb, status_stunting };
}

// Logic: layak PMT jika BB tidak naik dari bulan lalu ATAU BB/TB = Gizi Kurang/Gizi Buruk ATAU BB/U = Kurang/Sangat Kurang
export function calculateStatusPMT(p, prevP) {
  const bbTidakNaik = prevP ? (p.berat_badan <= prevP.berat_badan) : false;
  const bbtbKurus = p.status_bbtb === 'Gizi Kurang' || p.status_bbtb === 'Gizi Buruk';
  const bbuKurang = p.status_bbu === 'Kurang' || p.status_bbu === 'Sangat Kurang';
  return (bbTidakNaik || bbtbKurus || bbuKurang) ? 'Dapat' : 'Tidak';
}

export function getStatusColor(status) {
  const colors = {
    // BB/U
    'Sangat Kurang': 'text-red-600 bg-red-50 border-red-200',
    'Kurang': 'text-amber-600 bg-amber-50 border-amber-200',
    'Normal': 'text-emerald-600 bg-emerald-50 border-emerald-200',
    'Risiko Lebih': 'text-blue-600 bg-blue-50 border-blue-200',
    // TB/U
    'Sangat Pendek': 'text-red-600 bg-red-50 border-red-200',
    'Pendek': 'text-amber-600 bg-amber-50 border-amber-200',
    'Tinggi': 'text-blue-600 bg-blue-50 border-blue-200',
    // BB/TB
    'Gizi Buruk': 'text-red-700 bg-red-50 border-red-200',
    'Gizi Kurang': 'text-amber-600 bg-amber-50 border-amber-200',
    'Risiko Gizi Lebih': 'text-blue-600 bg-blue-50 border-blue-200',
    'Gizi Lebih': 'text-orange-600 bg-orange-50 border-orange-200',
    'Obesitas': 'text-purple-600 bg-purple-50 border-purple-200',
    // Stunting
    'Stunting': 'text-red-600 bg-red-50 border-red-200',
    'Tidak Stunting': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  };
  return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200';
}

export const BULAN_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];