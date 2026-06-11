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

// ==========================================
// LAYER 2: ENGINE NIFAS (Versi Dasar 2.1 - 2.3)
// ==========================================
export function prosesEngineNifas(
  dataMelahirkan: DataMelahirkan,
  siklusDarah: SiklusDarah[],
  riwayat: RiwayatSiklus
): OutputSesi[] {
  const output: OutputSesi[] = [];
  let totalHariKD = 0;

  // Looping seluruh pencatatan darah
  for (let i = 0; i < siklusDarah.length; i++) {
    const sesi = siklusDarah[i];
    // Jika masih keluar darah, gunakan waktu saat ini (sebagai batas sementara)
    const waktuSelesai = sesi.waktuBersih ? sesi.waktuBersih : new Date().toISOString();
    
    const durasiKD = getSelisihHari(sesi.waktuKeluar, waktuSelesai);
    const jarakDariLahir = getSelisihHari(dataMelahirkan.waktuMelahirkan, sesi.waktuKeluar);
    
    totalHariKD += durasiKD;

    // Cek: Apakah masih dalam lingkup 60 Hari?
    if (jarakDariLahir <= 60 && (jarakDariLahir + durasiKD) <= 60) {
      
      // Catat Darah (KD) sebagai Nifas
      output.push({
        hariKe: Math.ceil(jarakDariLahir),
        tipe: 'KD',
        hukumSahbi: 'Nifas',
        hukumLaqthi: 'Nifas'
      });

      // Logika Nifas Taqatthu' (Putus-putus)
      // Cek jarak bersih dengan KD berikutnya
      if (sesi.waktuBersih && i < siklusDarah.length - 1) {
        const kdBerikutnya = siklusDarah[i+1];
        const masaBersih = getSelisihHari(sesi.waktuBersih, kdBerikutnya.waktuKeluar);
        
        // Jika bersih < 15 hari dan diapit KD dalam lingkup 60 hari
        if (masaBersih < 15 && (jarakDariLahir + durasiKD + masaBersih) <= 60) {
          output.push({
            hariKe: Math.ceil(jarakDariLahir + durasiKD),
            tipe: 'B',
            hukumSahbi: 'Nifas', // Qaul Sahbi: Bersih yang diapit = Nifas
            hukumLaqthi: 'Suci'  // Qaul Laqthi: Bersih yang diapit = Suci
          });
        } 
        // Jika bersih >= 15 hari, maka itu suci yang memisahkan siklus
        else if (masaBersih >= 15) {
          output.push({
            hariKe: Math.ceil(jarakDariLahir + durasiKD),
            tipe: 'B',
            hukumSahbi: 'Suci',
            hukumLaqthi: 'Suci'
          });
        }
      }
    } else {
      // TODO: Logic 2.4 & 2.5 (Mustahadhah fin Nifas & Taqatthu')
      // Darah tumpah ruah melebihi 60 hari, kita akan mainkan `riwayat` (Adat) di sini.
      break; 
    }
  }

  return output;
}
