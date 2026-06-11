// types.ts

// Format standar untuk waktu yang presisi (menggunakan ISO 8601 string)
export type Timestamp = string; 

export interface DataPersonal {
  tanggalLahir: Timestamp;
  usiaHijriah: number; // Dalam hitungan tahun
}

export interface DataMelahirkan {
  waktuMelahirkan: Timestamp;
}

export interface RiwayatSiklus {
  adatNifas: number; // Durasi dalam hari
  adatSuci: number;  // Durasi dalam hari
  adatHaid: number;  // Durasi dalam hari
}

export interface SiklusDarah {
  id: string;
  waktuKeluar: Timestamp;       // Kapan darah mulai keluar (KD)
  waktuBersih: Timestamp | null; // Kapan darah berhenti (B), null jika masih keluar
}

// Format Output (Layer 4)
export type HukumDarah = 'Nifas' | 'Haid' | 'Suci' | 'Fasad' | 'Istihadhah';

export interface OutputSesi {
  hariKe: number;
  tipe: 'KD' | 'B';
  hukumSahbi: HukumDarah;
  hukumLaqthi: HukumDarah;
}
