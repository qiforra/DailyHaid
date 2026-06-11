// engine.ts
import { DataMelahirkan, RiwayatSiklus, SiklusDarah, OutputSesi, Timestamp, HukumDarah } from './types';

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
  if (!dataMelahirkan) return 'Haid';

  const selisihMelahirkan = getSelisihHari(dataMelahirkan.waktuMelahirkan, waktuKD);

  if (selisihMelahirkan <= 60) {
    return 'Nifas';
  }

  return 'Haid';
}

// ==========================================
// LAYER 2: ENGINE NIFAS
// ==========================================
export function prosesEngineNifas(
  dataMelahirkan: DataMelahirkan,
  siklusDarah: SiklusDarah[],
  riwayat: RiwayatSiklus
): OutputSesi[] {
  const output: OutputSesi[] = [];
  let totalHariKD = 0;

  for (let i = 0; i < siklusDarah.length; i++) {
    const sesi = siklusDarah[i];
    const waktuSelesai = sesi.waktuBersih ? sesi.waktuBersih : new Date().toISOString();

    const durasiKD = getSelisihHari(sesi.waktuKeluar, waktuSelesai);
    const jarakDariLahir = getSelisihHari(dataMelahirkan.waktuMelahirkan, sesi.waktuKeluar);

    totalHariKD += durasiKD;

    // Cek: Apakah masih dalam lingkup 60 Hari?
    if (jarakDariLahir <= 60 && (jarakDariLahir + durasiKD) <= 60) {
      output.push({
        hariKe: Math.ceil(jarakDariLahir),
        tipe: 'KD',
        hukumSahbi: 'Nifas',
        hukumLaqthi: 'Nifas'
      });

      // Logika Nifas Taqatthu' (Putus-putus)
      if (sesi.waktuBersih && i < siklusDarah.length - 1) {
        const kdBerikutnya = siklusDarah[i+1];
        const masaBersih = getSelisihHari(sesi.waktuBersih, kdBerikutnya.waktuKeluar);

        if (masaBersih < 15 && (jarakDariLahir + durasiKD + masaBersih) <= 60) {
          output.push({
            hariKe: Math.ceil(jarakDariLahir + durasiKD),
            tipe: 'B',
            hukumSahbi: 'Nifas', 
            hukumLaqthi: 'Suci'  
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
      // ==========================================
      // LOGIC 2.4 & 2.5 (Mustahadhah fin Nifas)
      // Darah tumpah ruah melebihi 60 hari.
      // ==========================================
      const adatNifas = riwayat.adatNifas;
      let hukumKD: HukumDarah = 'Istihadhah';
      
      // Jika masih dalam rentang Adat Nifas user, kita ikuti adat (Qaul Syaz/Ihtiyath)
      // Jika sudah melewati Adat Nifas, maka vonis Istihadhah.
      if (jarakDariLahir <= adatNifas) {
         hukumKD = 'Nifas'; 
      } else {
         hukumKD = 'Istihadhah'; 
      }

      output.push({
        hariKe: Math.ceil(jarakDariLahir),
        tipe: 'KD',
        hukumSahbi: hukumKD,
        hukumLaqthi: hukumKD
      });

      // Untuk masa bersih di fase ini, vonis Suci
      if (sesi.waktuBersih && i < siklusDarah.length - 1) {
         output.push({
            hariKe: Math.ceil(jarakDariLahir + durasiKD),
            tipe: 'B',
            hukumSahbi: 'Suci',
            hukumLaqthi: 'Suci'
         });
      }
    }
  }

  return output;
}

// ==========================================
// LAYER 2: ENGINE HAID
// ==========================================
export function prosesEngineHaid(
  siklusDarah: SiklusDarah[],
  riwayat: RiwayatSiklus,
  suciSebelumnya: number
): OutputSesi[] {
  const output: OutputSesi[] = [];
  let totalHariHaid = 0;
  let hariKe = 0;
  
  // Jika suci sebelumnya < 15 hari, maka KD pertama adalah lanjutan haid sebelumnya (Taqatthu')
  let isContinuation = suciSebelumnya < 15;

  for (let i = 0; i < siklusDarah.length; i++) {
    const sesi = siklusDarah[i];
    const waktuSelesai = sesi.waktuBersih ? sesi.waktuBersih : new Date().toISOString();
    const durasiKD = getSelisihHari(sesi.waktuKeluar, waktuSelesai);
    
    // 1. Cek apakah KD ini Fasad (kurang dari 24 jam / 1 hari)
    if (durasiKD < 1 && i === 0 && !isContinuation) {
       output.push({
         hariKe: 1,
         tipe: 'KD',
         hukumSahbi: 'Istihadhah', // Fasad (Darah rusak/tidak sah)
         hukumLaqthi: 'Istihadhah'
       });
       if (sesi.waktuBersih) {
         output.push({
           hariKe: 1,
           tipe: 'B',
           hukumSahbi: 'Suci',
           hukumLaqthi: 'Suci'
         });
       }
       continue;
    }

    hariKe += durasiKD;
    totalHariHaid += durasiKD;

    // 2. Jika durasi >= 1 hari, maka ini Haid
    output.push({
      hariKe: Math.ceil(hariKe),
      tipe: 'KD',
      hukumSahbi: 'Haid',
      hukumLaqthi: 'Haid'
    });

    // 3. Cek masa bersih setelah KD
    if (sesi.waktuBersih && i < siklusDarah.length - 1) {
      const kdBerikutnya = siklusDarah[i+1];
      const masaBersih = getSelisihHari(sesi.waktuBersih, kdBerikutnya.waktuKeluar);

      // Jika masa bersih < 15 hari, maka ini Haid Taqatthu' (putus-putus)
      if (masaBersih < 15) {
        output.push({
          hariKe: Math.ceil(hariKe + masaBersih),
          tipe: 'B',
          hukumSahbi: 'Haid', 
          hukumLaqthi: 'Haid'
        });
        hariKe += masaBersih; 
      } 
      // Jika masa bersih >= 15 hari, maka ini Suci yang memisahkan
      else {
        output.push({
          hariKe: Math.ceil(hariKe + masaBersih),
          tipe: 'B',
          hukumSahbi: 'Suci',
          hukumLaqthi: 'Suci'
        });
        hariKe = 0; 
        totalHariHaid = 0;
      }
    }
  }

  // TODO: Logic jika totalHariHaid > 15 hari (Istihadhah / melihat Adat)
  if (totalHariHaid > 15) {
     console.warn(`Peringatan: Total hari haid (${totalHariHaid.toFixed(1)}) melebihi 15 hari. Logika Adat Haid perlu diimplementasikan untuk memvonis kelebihannya sebagai Istihadhah.`);
  }

  return output;
}
