// engine.ts
import { DataMelahirkan, RiwayatSiklus, SiklusDarah, OutputSesi, Timestamp } from './types';

// ==========================================
// UTILITAS WAKTU
// ==========================================
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Menghitung selisih hari dengan presisi desimal (agar jam/menit ikut terhitung)
function getSelisihHari(start: Timestamp, end: Timestamp): number {
  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();
  return (endDate - startDate) / MS_PER_DAY;
}

// ==========================================
// LAYER 1: TENTUKAN FASE
// ==========================================
export function tentukanFase(
  dataMelahirkan: DataMelahirkan | null,
  waktuKD: Timestamp
): 'Nifas' | 'Haid' {
  // Jika belum pernah melahirkan (data kosong), pasti masuk engine haid
  if (!dataMelahirkan) return 'Haid';

  const selisihMelahirkan = getSelisihHari(dataMelahirkan.waktuMelahirkan, waktuKD);

  // Jika KD keluar masih dalam lingkup maksimal nifas (60 hari)
  if (selisihMelahirkan <= 60) {
    return 'Nifas';
  }
  
  return 'Haid';
}

// Lanjutan engine.ts

// ==========================================
// LAYER 2: ENGINE NIFAS (Lengkap dengan Mustahadhah)
// ==========================================
export function prosesEngineNifas(
  dataMelahirkan: DataMelahirkan,
  siklusDarah: SiklusDarah[],
  riwayat: RiwayatSiklus
): OutputSesi[] {
  const output: OutputSesi[] = [];

  for (let i = 0; i < siklusDarah.length; i++) {
    const sesi = siklusDarah[i];
    const waktuSelesai = sesi.waktuBersih ? sesi.waktuBersih : new Date().toISOString();
    
    const durasiKD = getSelisihHari(sesi.waktuKeluar, waktuSelesai);
    const jarakDariLahir = getSelisihHari(dataMelahirkan.waktuMelahirkan, sesi.waktuKeluar);

    // Cek apakah start KD masih di dalam 60 hari
    if (jarakDariLahir <= 60) {
      if ((jarakDariLahir + durasiKD) <= 60) {
        
        // 2.2 NIFAS NORMAL
        output.push({
          hariKe: Math.ceil(jarakDariLahir),
          tipe: 'KD',
          hukumSahbi: 'Nifas',
          hukumLaqthi: 'Nifas'
        });

        // 2.3 NIFAS TAQATTHU' (Putus-putus)
        if (sesi.waktuBersih && i < siklusDarah.length - 1) {
          const kdBerikutnya = siklusDarah[i+1];
          const masaBersih = getSelisihHari(sesi.waktuBersih, kdBerikutnya.waktuKeluar);
          
          if (masaBersih < 15 && (jarakDariLahir + durasiKD + masaBersih) <= 60) {
            output.push({
              hariKe: Math.ceil(jarakDariLahir + durasiKD),
              tipe: 'B',
              hukumSahbi: 'Nifas', // Qaul Sahbi
              hukumLaqthi: 'Suci'  // Qaul Laqthi
            });
          } else if (masaBersih >= 15) {
            output.push({
              hariKe: Math.ceil(jarakDariLahir + durasiKD),
              tipe: 'B',
              hukumSahbi: 'Suci',
              hukumLaqthi: 'Suci'
            });
          }
        }
      } else {
        // 2.4 & 2.5 MUSTAHADHAH FIN NIFAS
        // Darah melewati 60 hari, kembalikan ke Adat (Riwayat)
        let sisaDurasi = durasiKD;

        // 1. Plot Nifas sesuai Adat Nifas
        const durasiNifas = Math.min(riwayat.adatNifas, sisaDurasi);
        output.push({
          hariKe: Math.ceil(jarakDariLahir),
          tipe: 'KD',
          hukumSahbi: 'Nifas',
          hukumLaqthi: 'Nifas' // Dihukumi nifas sebatas adat
        });
        sisaDurasi -= durasiNifas;

        // 2. Plot Istihadhah (Sifatnya seperti Suci) sesuai Adat Suci
        if (sisaDurasi > 0) {
          const durasiIstihadhah = Math.min(riwayat.adatSuci, sisaDurasi);
          output.push({
            hariKe: Math.ceil(jarakDariLahir + durasiNifas),
            tipe: 'KD', 
            hukumSahbi: 'Istihadhah',
            hukumLaqthi: 'Istihadhah'
          });
          sisaDurasi -= durasiIstihadhah;
        }

        // 3. Plot Haid sesuai Adat Haid
        if (sisaDurasi > 0) {
          const durasiHaid = Math.min(riwayat.adatHaid, sisaDurasi);
          output.push({
            hariKe: Math.ceil(jarakDariLahir + durasiNifas + riwayat.adatSuci),
            tipe: 'KD',
            hukumSahbi: 'Haid',
            hukumLaqthi: 'Haid'
          });
          sisaDurasi -= durasiHaid;
        }
      }
    } else {
      // Darah keluar setelah hari ke-60 (Murni di luar nifas)
      // Looping nifas dihentikan, ini akan dilempar ke Engine Haid
      break; 
    }
  }

  return output;
}

// ==========================================
// LAYER 3: ENGINE HAID (Persiapan 3.1 & 3.2)
// ==========================================
export function prosesEngineHaid(
  siklusDarah: SiklusDarah[],
  riwayat: RiwayatSiklus,
  masaSuciSebelumnya: number // Dalam hitungan hari
): OutputSesi[] {
  const output: OutputSesi[] = [];
  let totalDurasiKDJam = 0;
  
  if (siklusDarah.length === 0) return output;
  const startHaid = siklusDarah[0].waktuKeluar;

  // 3.1 Masa Memungkinkan Haid (Syarat suci sebelumnya >= 15 hari)
  if (masaSuciSebelumnya < 15) {
     // Ini masuk ke Istihadhah Penyempurna Suci (Akan kita bahas di part selanjutnya)
  }

 // Lanjutan engine.ts (Bagian 3)

// ==========================================
// UTILITAS WAKTU TAMBAHAN
// ==========================================
// Menghitung selisih jam untuk kebutuhan validasi minimal haid (24 jam)
export function getSelisihJam(start: Timestamp, end: Timestamp): number {
  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();
  return (endDate - startDate) / (1000 * 60 * 60);
}

// ==========================================
// LAYER 3: ENGINE HAID (Lanjutan)
// ==========================================
export function prosesEngineHaid(
  siklusDarah: SiklusDarah[],
  riwayat: RiwayatSiklus,
  masaSuciSebelumnya: number // Dalam hitungan hari
): OutputSesi[] {
  const output: OutputSesi[] = [];
  
  if (siklusDarah.length === 0) return output;
  
  const startHaid = siklusDarah[0].waktuKeluar;
  let totalKDJam = 0;
  
  // 3.8 Istihadhah Penyempurna Suci
  // Jika masa suci sebelumnya < 15 hari, hitung hutang suci
  let sisaSuciDibutuhkan = 15 - masaSuciSebelumnya;

  for (let i = 0; i < siklusDarah.length; i++) {
    const sesi = siklusDarah[i];
    const waktuSelesai = sesi.waktuBersih ? sesi.waktuBersih : new Date().toISOString();
    
    const durasiHari = getSelisihHari(sesi.waktuKeluar, waktuSelesai);
    const durasiJam = getSelisihJam(sesi.waktuKeluar, waktuSelesai);
    const jarakDariStart = getSelisihHari(startHaid, sesi.waktuKeluar);

    // Cek hutang masa suci (Penyempurna Suci)
    if (sisaSuciDibutuhkan > 0) {
      if (durasiHari <= sisaSuciDibutuhkan) {
        output.push({
          hariKe: Math.ceil(jarakDariStart),
          tipe: 'KD',
          hukumSahbi: 'Istihadhah', // Darah Fasad karena belum genap 15 hari suci
          hukumLaqthi: 'Istihadhah'
        });
        sisaSuciDibutuhkan -= durasiHari;
        continue; // Langsung cek sesi darah berikutnya
      } else {
        // Sebagian waktu dipakai untuk melunasi suci, sisanya baru masuk perhitungan Haid
        // (Di skenario aslinya, object sesi ini harus di-split, tapi kita sederhanakan logiknya dulu)
        output.push({
          hariKe: Math.ceil(jarakDariStart),
          tipe: 'KD',
          hukumSahbi: 'Istihadhah',
          hukumLaqthi: 'Istihadhah'
        });
        sisaSuciDibutuhkan = 0;
      }
    }

    // 3.2 & 3.3 Evaluasi Lingkup 15 Hari (Haid Normal & Taqatthu')
    if (jarakDariStart <= 15) {
      totalKDJam += durasiJam;

      // Plot sebagai Haid (Nanti di akhir divalidasi apakah tembus 24 jam)
      if ((jarakDariStart + durasiHari) <= 15) {
        output.push({
          hariKe: Math.ceil(jarakDariStart),
          tipe: 'KD',
          hukumSahbi: 'Haid',
          hukumLaqthi: 'Haid'
        });

        // 3.4 Haid Taqatthu' (Putus-putus)
        if (sesi.waktuBersih && i < siklusDarah.length - 1) {
          const kdBerikutnya = siklusDarah[i+1];
          const masaBersihJam = getSelisihJam(sesi.waktuBersih, kdBerikutnya.waktuKeluar);
          const masaBersihHari = masaBersihJam / 24;
          
          if ((jarakDariStart + durasiHari + masaBersihHari) <= 15) {
            output.push({
              hariKe: Math.ceil(jarakDariStart + durasiHari),
              tipe: 'B',
              hukumSahbi: 'Haid', // Qaul Sahbi menganggap bersih di antara haid = Haid
              hukumLaqthi: 'Suci' // Qaul Laqthi
            });
          }
        }
      } else {
         // TODO: 3.6 Mustahadhah fil Haid (Darah bablas melewati 15 hari)
         // Jika terjadi, looping dihentikan dan kita masuk ke logic Adat
         break;
      }
    }
  }

  // 3.2 Validasi Syarat Minimal Haid (24 Jam)
  // Engine menyisir ulang output. Jika total KD < 24 jam, status Haid dibatalkan jadi Fasad
  if (totalKDJam < 24) {
    output.forEach(sesi => {
      if (sesi.hukumSahbi === 'Haid') sesi.hukumSahbi = 'Fasad';
      if (sesi.hukumLaqthi === 'Haid') sesi.hukumLaqthi = 'Fasad';
    });
  }

  return output;
}
