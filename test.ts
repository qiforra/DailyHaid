import { RiwayatSiklus, SiklusDarah } from './types';
import { prosesEngineHaid } from './engine';

// ==========================================
// 1. DATA MOCKING
// ==========================================
const mockRiwayat: RiwayatSiklus = {
  adatNifas: 40,
  adatSuci: 15,
  adatHaid: 7
};

const siklusNormal: SiklusDarah[] = [
  {
    id: 'kd_normal_1',
    waktuKeluar: '2026-06-01T08:00:00.000Z',
    waktuBersih: '2026-06-08T08:00:00.000Z'
  }
];

const siklusFasad: SiklusDarah[] = [
  {
    id: 'kd_fasad_1',
    waktuKeluar: '2026-06-10T08:00:00.000Z',
    waktuBersih: '2026-06-10T18:00:00.000Z'
  }
];

const siklusTaqatthu: SiklusDarah[] = [
  {
    id: 'kd_taqatthu_1',
    waktuKeluar: '2026-06-15T08:00:00.000Z',
    waktuBersih: '2026-06-16T08:00:00.000Z'  
  },
  {
    id: 'kd_taqatthu_2',
    waktuKeluar: '2026-06-18T08:00:00.000Z',
    waktuBersih: '2026-06-20T08:00:00.000Z'  
  }
];

// ==========================================
// 2. EKSEKUSI PENGETESAN
// ==========================================
console.log("=== HASIL SKENARIO 1: HAID NORMAL ===");
const hasilNormal = prosesEngineHaid(siklusNormal, mockRiwayat, 20);
console.log(hasilNormal);
console.log("\n");

console.log("=== HASIL SKENARIO 2: DARAH FASAD ===");
const hasilFasad = prosesEngineHaid(siklusFasad, mockRiwayat, 15);
console.log(hasilFasad);
console.log("\n");

console.log("=== HASIL SKENARIO 3: HAID TAQATTHU' ===");
const hasilTaqatthu = prosesEngineHaid(siklusTaqatthu, mockRiwayat, 25);
console.log(hasilTaqatthu);
