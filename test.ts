// test.ts
import { RiwayatSiklus, SiklusDarah, DataMelahirkan } from './types';
import { prosesEngineHaid, prosesEngineNifas } from './engine';

// ==========================================
// 1. DATA MOCKING (Data Bohongan untuk Tes)
// ==========================================
const mockRiwayat: RiwayatSiklus = {
  adatNifas: 40,
  adatSuci: 15,
  adatHaid: 7
};

// Skenario 1: Haid Normal (Keluar 7 hari penuh)
const siklusNormal: SiklusDarah[] = [
  {
    id: 'kd_normal_1',
    waktuKeluar: '2026-06-01T08:00:00.000Z', 
    waktuBersih: '2026-06-08T08:00:00.000Z'  
  }
];

// Skenario 2: Darah Fasad (Cuma 10 jam, kurang dari 24 jam)
const siklusFasad: SiklusDarah[] = [
  {
    id: 'kd_fasad_1',
    waktuKeluar: '2026-06-10T08:00:00.000Z', 
    waktuBersih: '2026-06-10T18:00:00.000Z'  
  }
];

// Skenario 3: Haid Putus-putus (Taqatthu')
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

// Skenario 4: Nifas Normal (dalam 60 hari)
const mockMelahirkan: DataMelahirkan = {
  waktuMelahirkan: '2026-05-01T08:00:00.000Z'
};

const siklusNifas: SiklusDarah[] = [
  {
    id: 'kd_nifas_1',
    waktuKeluar: '2026-05-01T08:00:00.000Z',
    waktuBersih: '2026-05-11T08:00:00.000Z' // 10 hari
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
console.log("\n");

console.log("=== HASIL SKENARIO 4: NIFAS NORMAL ===");
const hasilNifas = prosesEngineNifas(mockMelahirkan, siklusNifas, mockRiwayat);
console.log(hasilNifas);
