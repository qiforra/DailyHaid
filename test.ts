// test.ts
// Ubah baris ini:
import { RiwayatSiklus, SiklusDarah } from './types.ts';
import { prosesEngineHaid } from './engine.ts';

// ==========================================
// 1. DATA MOCKING (Data Bohongan untuk Tes)
// ==========================================

// Anggap ini riwayat adat user sebelumnya
const mockRiwayat: RiwayatSiklus = {
  adatNifas: 40,
  adatSuci: 15,
  adatHaid: 7
};

// Skenario 1: Haid Normal (Keluar 7 hari penuh)
const siklusNormal: SiklusDarah[] = [
  {
    id: 'kd_normal_1',
    waktuKeluar: '2026-06-01T08:00:00.000Z', // Tanggal 1 jam 8 pagi
    waktuBersih: '2026-06-08T08:00:00.000Z'  // Tanggal 8 jam 8 pagi (Tepat 7 hari)
  }
];

// Skenario 2: Darah Fasad (Cuma 10 jam, kurang dari 24 jam)
const siklusFasad: SiklusDarah[] = [
  {
    id: 'kd_fasad_1',
    waktuKeluar: '2026-06-10T08:00:00.000Z', // Tanggal 10 jam 8 pagi
    waktuBersih: '2026-06-10T18:00:00.000Z'  // Tanggal 10 jam 6 sore (10 jam saja)
  }
];

// Skenario 3: Haid Putus-putus (Taqatthu')
const siklusTaqatthu: SiklusDarah[] = [
  {
    id: 'kd_taqatthu_1',
    waktuKeluar: '2026-06-15T08:00:00.000Z', // Keluar 1 hari (24 jam)
    waktuBersih: '2026-06-16T08:00:00.000Z'  
  },
  // Ada masa bersih 2 hari di sini (tgl 16 sampai 18)
  {
    id: 'kd_taqatthu_2',
    waktuKeluar: '2026-06-18T08:00:00.000Z', // Keluar lagi 2 hari (48 jam)
    waktuBersih: '2026-06-20T08:00:00.000Z'  
  }
];

// ==========================================
// 2. EKSEKUSI PENGETESAN
// ==========================================

console.log("=== HASIL SKENARIO 1: HAID NORMAL ===");
const hasilNormal = prosesEngineHaid(siklusNormal, mockRiwayat, 20); // 20 = asumsi suci sebelumnya 20 hari
console.log(hasilNormal);
console.log("\n");

console.log("=== HASIL SKENARIO 2: DARAH FASAD ===");
const hasilFasad = prosesEngineHaid(siklusFasad, mockRiwayat, 15);
console.log(hasilFasad);
console.log("\n");

console.log("=== HASIL SKENARIO 3: HAID TAQATTHU' ===");
const hasilTaqatthu = prosesEngineHaid(siklusTaqatthu, mockRiwayat, 25);
console.log(hasilTaqatthu);
