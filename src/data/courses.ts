import {
  Course,
  CourseProgress,
  LearningTrack,
  LMSProgressStore,
  PlacementQuestion,
  TrackLevel,
} from '../types/lms';

export const INSTRUCTOR_AVATAR = '/src/assets/images/instructor_avatar_1795402915889.jpg';
const COVER_FRONTEND = '/src/assets/images/course_frontend_architecture_1795402916574.jpg';
const COVER_ANALYTICS = '/src/assets/images/course_data_analytics_1795402917003.jpg';
const COVER_UI = '/src/assets/images/course_ui_systems_1795402916992.jpg';

export const COMPANY_DEPARTMENTS = [
  'Finance And Tax',
  'Procurement and Warehouse',
  'Camera Vision And Inspection',
  'Human Resource And General Affairs',
  'Automation Software Integration & IO',
  'Sales And Marketing',
  'Coding and Marking',
] as const;

export const LEARNING_TRACKS: LearningTrack[] = [
  {
    id: 'OJT',
    order: 1,
    name: 'Paket OJT (Onboarding)',
    subtitle: 'Profil & SOP Perusahaan, Talenta, K3 (Workshop/Lab/Site), P3K, Alat & Jobdesk Teknis',
    targetAudience: 'Karyawan baru, peserta magang, dan masa orientasi operasional awal',
    minPassScore: 70,
    estimatedDuration: '180 Menit · 6 Modul',
    keyCompetencies: [
      'Profil, Peraturan, Struktur Perusahaan & Operasional Talenta/Logbook/SOP/KPI',
      'K3 di Workshop, Lab Tech, Site serta Penanganan Pertama Kecelakaan Kerja (P3K)',
      'Pengenalan Alat Kerja serta Pemahaman Jobdesk dan Standar Teknis',
    ],
  },
  {
    id: 'Junior',
    order: 2,
    name: 'Paket Junior',
    subtitle: 'Eksekusi Fitur Mandiri, UI Inklusif, Analitik & Softskill Profesional',
    targetAudience: 'Talenta level awal (0–2 tahun) yang membangun fitur terarah',
    minPassScore: 75,
    estimatedDuration: '120 Menit · 3 Modul',
    keyCompetencies: [
      'Standar aksesibilitas WCAG AA & sistem desain',
      'Pengukuran metrik dasar & N-Gain',
      'Etika kerja, komunikasi, kolaborasi lintas divisi & critical thinking',
    ],
    softskills: [
      'Professional Mindset & Work Ethics',
      'Self-Management & Productivity (Pengelolaan Diri)',
      'Komunikasi Di Tempat Kerja',
      'Kolaborasi Antar Divisi',
      'Basic Problem Solving dan Critical Thinking',
    ],
  },
  {
    id: 'Middle',
    order: 3,
    name: 'Paket Middle',
    subtitle: 'Arsitektur State, Kontrak API & Optimasi Performa',
    targetAudience: 'Engineer/analis menengah (2–4 tahun) pemilik modul produksi',
    minPassScore: 80,
    estimatedDuration: '95 Menit · 2 Modul',
    keyCompetencies: [
      'Pemisahan server-state, URL state & client store',
      'Perancangan kontrak API idempoten & paginasi',
      'Mengendalikan re-render & bottleneck jaringan',
    ],
  },
  {
    id: 'Senior',
    order: 4,
    name: 'Paket Senior',
    subtitle: 'Desain Sistem Terdistribusi & Kepemimpinan Teknis',
    targetAudience: 'Senior engineer / tech lead penentu arah arsitektur lintas tim',
    minPassScore: 85,
    estimatedDuration: '110 Menit · 2 Modul',
    keyCompetencies: [
      'Reliabilitas sistem terdistribusi & fault isolation',
      'Evaluasi trade-off arsitektur terhadap biaya bisnis',
      'Standarisasi kualitas & mentoring lintas skuad',
    ],
  },
];

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: 'plc-1',
    levelLabel: 'OJT',
    prompt:
      'Sebelum memasuki area Workshop, Lab Tech, atau Site pada masa orientasi (OJT), langkah K3 paling mendasar yang wajib dipenuhi adalah:',
    options: [
      'Mengenakan APD sesuai area, memeriksa kelayakan alat kerja, dan mengikuti briefing SOP keselamatan',
      'Langsung mengoperasikan mesin tanpa izin kerja agar cepat selesai',
      'Mengisi logbook di akhir bulan saja tanpa absensi Talenta',
      'Menangani kecelakaan listrik berat tanpa memutus sumber arus',
    ],
    correctIndex: 0,
  },
  {
    id: 'plc-2',
    levelLabel: 'Junior',
    prompt:
      'Dalam antarmuka laporan kelulusan ujian, mengapa status "Lulus" wajib menyertakan ikon dan teks di samping warna hijau?',
    options: [
      'Agar pengguna dengan gangguan persepsi warna maupun pembaca layar tetap memahami status dengan akurat',
      'Karena browser lama tidak mendukung warna hex hijau',
      'Untuk memenuhi ukuran file HTML minimal',
      'Agar tabel skor memiliki lebih banyak kolom',
    ],
    correctIndex: 0,
  },
  {
    id: 'plc-3',
    levelLabel: 'Middle',
    prompt:
      'Mengapa endpoint pembayaran atau pengumpulan ujian sebaiknya dirancang bersifat idempoten menggunakan Idempotency-Key?',
    options: [
      'Agar percobaan ulang (retry) akibat jaringan putus tidak menggandakan transaksi atau skor',
      'Agar server tidak memerlukan database relasional',
      'Supaya seluruh request HTTP berubah menjadi metode GET',
      'Untuk menghapus cache browser secara otomatis',
    ],
    correctIndex: 0,
  },
  {
    id: 'plc-4',
    levelLabel: 'Senior',
    prompt:
      'Ketika layanan pihak ketiga mengalami lonjakan latensi ekstrem (tail latency), pola arsitektur apa yang mencegah kegagalan merembet ke seluruh platform LMS?',
    options: [
      'Circuit Breaker disertai timeout ketat, bulkhead isolation, dan fallback terdegradasi aman',
      'Meningkatkan timeout HTTP menjadi 10 menit dan retry tanpa jeda',
      'Menyatukan seluruh layanan ke dalam satu proses tunggal tanpa batas antrean',
      'Mematikan pencatatan log kesalahan di server produksi',
    ],
    correctIndex: 0,
  },
];

export const COURSES: Course[] = [
  // ==================== TRACK 1: OJT (6 MODUL WAJIB) ====================
  {
    id: 'ojt-profil-perusahaan',
    code: 'OJT-101',
    title: 'Profil Perusahaan, Peraturan Perusahaan & Struktur Organisasi',
    category: 'Orientasi & Budaya Kerja',
    trackLevel: 'OJT',
    moduleOrderInTrack: 1,
    instructorName: 'Nadia Permatasari',
    instructorRole: 'People & HR Enablement Lead',
    instructorAvatar: INSTRUCTOR_AVATAR,
    coverImage: COVER_UI,
    syllabusDurationLabel: '30 Menit',
    videoDurationSec: 120,
    passingScore: 70,
    minWatchPercent: 80,
    description:
      'Memahami sejarah, visi-misi, tata tertib serta Peraturan Perusahaan (hak, kewajiban, etika kerja), dan struktur organisasi lintas divisi.',
    preTest: [
      {
        id: 'ojt1-pre-1',
        prompt: 'Fungsi utama memahami Struktur Perusahaan bagi karyawan baru pada tahap OJT adalah:',
        options: [
          'Mengetahui garis pelaporan, peran tiap divisi, dan jalur eskalasi koordinasi yang tepat',
          'Menghafal tanggal lahir seluruh karyawan',
          'Menghindari koordinasi dengan divisi lain',
          'Mengganti aturan perusahaan sesuai keinginan pribadi',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Kejelasan struktur organisasi mencegah salah koordinasi saat menjalankan tugas operasional.',
        relatedChapterIndex: 2,
      },
      {
        id: 'ojt1-pre-2',
        prompt: 'Dalam Peraturan Perusahaan, apabila karyawan berhalangan hadir atau terlambat karena kondisi darurat, tindakan yang benar adalah:',
        options: [
          'Memberi kabar atasan langsung serta mencatat keterangan resmi sesuai prosedur sebelum jam kerja',
          'Tidak memberi tahu siapa pun dan menunggu ditanya akhir minggu',
          'Menitipkan absensi ke rekan kerja',
          'Mengabaikan jam masuk kerja sepanjang masa OJT',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Disiplin kehadiran dan komunikasi dini merupakan bagian inti Peraturan Perusahaan.',
        relatedChapterIndex: 1,
      },
      {
        id: 'ojt1-pre-3',
        prompt: 'Mengapa Profil Perusahaan (visi, misi, dan nilai inti) dipelajari paling awal saat onboarding?',
        options: [
          'Menyelaraskan sikap kerja harian dengan standar layanan dan tujuan organisasi kepada klien',
          'Sekadar formalitas tanpa kaitan dengan pekerjaan lapangan',
          'Agar karyawan tidak perlu membaca SOP teknis',
          'Untuk menggantikan prosedur keselamatan K3',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Nilai perusahaan menjadi kompas keputusan karyawan saat menghadapi situasi di kantor maupun site.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ojt1-pre-4',
        prompt: 'Dokumen kerja internal, data pelanggan, serta informasi operasional perusahaan bersifat rahasia. Sikap yang wajib dijaga sesuai Peraturan Perusahaan adalah:',
        options: [
          'Menjaga kerahasiaan data dan hanya membagikannya melalui kanal resmi sesuai kewenangan',
          'Mengunggah foto dokumen internal ke media sosial pribadi',
          'Mengirim data klien ke alamat email pribadi untuk cadangan',
          'Meminjamkan akun kerja ke pihak luar kantor',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Kepatuhan kerahasiaan data melindungi perusahaan dan kepercayaan mitra kerja.',
        relatedChapterIndex: 3,
      },
    ],
    chapters: [
      {
        id: 'ojt1-ch-1',
        title: 'Bab 1: Profil Perusahaan, Visi, Misi & Nilai Inti',
        startSec: 0,
        endSec: 30,
        competency: 'Konsep Dasar',
        summary: 'Sejarah berdiri perusahaan, lini layanan utama, serta nilai budaya kerja.',
        keyTakeaways: [
          'Kenali produk/layanan inti serta standar kualitas kepada klien.',
          'Terapkan nilai integritas, keselamatan, dan ketepatan waktu.',
        ],
        diagramType: 'hierarchy',
        diagramNodes: ['Visi Perusahaan', 'Misi Operasional', 'Nilai Kerja Harian'],
        captions: [
          { startSec: 0, endSec: 15, text: 'Setiap peran teknis maupun administratif berkontribusi langsung pada reputasi perusahaan.' },
          { startSec: 15, endSec: 30, text: 'Memahami profil perusahaan membantu Anda melihat dampak pekerjaan harian secara utuh.' },
        ],
      },
      {
        id: 'ojt1-ch-2',
        title: 'Bab 2: Peraturan Perusahaan, Hak & Kewajiban Karyawan',
        startSec: 30,
        endSec: 60,
        competency: 'Penerapan Kasus',
        summary: 'Jam kerja, tata tertib, cuti, disiplin, serta kode etik kerja.',
        keyTakeaways: [
          'Pahami aturan jam kerja, seragam/ID card, serta izin resmi.',
          'Patuhi larangan benturan kepentingan dan penyalahgunaan aset.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Hak Karyawan', 'Tata Tertib Kerja', 'Kepatuhan Etika'],
        captions: [
          { startSec: 30, endSec: 45, text: 'Peraturan Perusahaan melindungi hak karyawan sekaligus menjaga keteraturan kerja.' },
          { startSec: 45, endSec: 60, text: 'Setiap pelanggaran kode etik dan disiplin memiliki mekanisme pembinaan berjenjang.' },
        ],
      },
      {
        id: 'ojt1-ch-3',
        title: 'Bab 3: Struktur Perusahaan & Alur Koordinasi Antar Divisi',
        startSec: 60,
        endSec: 90,
        competency: 'Konsep Dasar',
        summary: 'Mengenal direksi, HR/GA, operasional workshop/lab/site, dan tim teknis.',
        keyTakeaways: [
          'Pahami fungsi supervisor langsung, tim HSE, dan HRD.',
          'Gunakan jalur eskalasi berjenjang agar masalah cepat tertangani.',
        ],
        diagramType: 'hierarchy',
        diagramNodes: ['Manajemen & Direksi', 'HR / HSE / Operasional', 'Tim Teknis & Site'],
        captions: [
          { startSec: 60, endSec: 75, text: 'Kenali siapa atasan langsung Anda dan fungsi pendukung seperti HR maupun tim K3/HSE.' },
          { startSec: 75, endSec: 90, text: 'Koordinasi lintas divisi berjalan efektif bila peran masing-masing unit jelas.' },
        ],
      },
      {
        id: 'ojt1-ch-4',
        title: 'Bab 4: Kerahasiaan Informasi & Etika Lingkungan Kerja',
        startSec: 90,
        endSec: 120,
        competency: 'Optimasi & Evaluasi',
        summary: 'Menjaga kerahasiaan data klien, aset kantor, dan sikap profesional.',
        keyTakeaways: [
          'Dilarang menyebarkan dokumen kerja atau foto area terlarang ke publik.',
          'Laporkan potensi pelanggaran atau kendala ke atasan secara objektif.',
        ],
        diagramType: 'cycle',
        diagramNodes: ['Jaga Aset', 'Lindungi Data', 'Etika Komunikasi', 'Audit Kepatuhan'],
        captions: [
          { startSec: 90, endSec: 105, text: 'Foto di area workshop atau site klien tidak boleh diunggah ke media sosial tanpa izin.' },
          { startSec: 105, endSec: 120, text: 'Kepatuhan aturan sejak hari pertama menjadi dasar penilaian positif masa OJT.' },
        ],
      },
    ],
    checkpoint: {
      triggerSec: 60,
      question: 'Checkpoint OJT-101: Saat terjadi kendala teknis di lapangan yang berdampak pada jadwal klien, kepada siapa Anda berkoordinasi pertama kali?',
      options: [
        'Atasan langsung / koordinator tim sesuai struktur organisasi agar eskalasi tepat sasaran',
        'Membiarkannya tanpa laporan hingga akhir bulan',
        'Mengumumkannya di grup media sosial umum',
      ],
      correctIndex: 0,
      feedback: 'Benar! Mematuhi garis koordinasi pada struktur organisasi memastikan dukungan cepat dan resmi.',
    },
    postTest: [
      {
        id: 'ojt1-post-1',
        prompt: 'Apa manfaat utama mempelajari Profil dan Nilai Inti Perusahaan pada awal program OJT?',
        options: [
          'Menjadi pedoman perilaku kerja sehari-hari agar selaras dengan standar kualitas perusahaan',
          'Supaya tidak perlu mengikuti pelatihan K3',
          'Mengganti seluruh SOP operasional',
          'Menghindari pengisian absensi',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Nilai perusahaan mengarahkan cara karyawan bekerja, mengambil keputusan, dan melayani mitra.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ojt1-post-2',
        prompt: 'Sesuai Peraturan Perusahaan, manakah tindakan yang benar terkait pemanfaatan fasilitas dan aset kerja?',
        options: [
          'Menggunakan aset sesuai peruntukan tugas, merawatnya, dan melaporkan kerusakan segera',
          'Membawa pulang peralatan kerja untuk keperluan pribadi tanpa izin tertulis',
          'Meminjamkan kartu akses kantor kepada pihak luar',
          'Mengabaikan aturan jam kerja',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Setiap karyawan wajib menjaga dan menggunakan aset perusahaan secara bertanggung jawab.',
        relatedChapterIndex: 1,
      },
      {
        id: 'ojt1-post-3',
        prompt: 'Dalam Struktur Perusahaan, tim manakah yang menjadi rujukan utama terkait keselamatan area Workshop, Lab Tech, dan Site?',
        options: [
          'Tim HSE / K3 bersama atasan/penanggung jawab area kerja terkait',
          'Pihak eksternal di luar perusahaan',
          'Tidak ada penanggung jawab khusus',
          'Hanya bagian pemasaran',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Struktur koordinasi menempatkan tim HSE/K3 dan kepala area sebagai pengawas keselamatan.',
        relatedChapterIndex: 2,
      },
      {
        id: 'ojt1-post-4',
        prompt: 'Bagaimana sikap profesional terhadap data pelanggan dan dokumen teknis internal perusahaan?',
        options: [
          'Menjaga kerahasiaan sepenuhnya dan tidak membagikan foto/berkas ke pihak tak berwenang',
          'Membagikan salinannya ke teman di perusahaan kompetitor',
          'Mempublikasikan foto proyek rahasia demi konten pribadi',
          'Menyimpan password sistem di kertas terbuka di meja umum',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Perlindungan data merupakan kewajiban kontraktual dan etika dalam Peraturan Perusahaan.',
        relatedChapterIndex: 3,
      },
    ],
  },

  {
    id: 'ojt-talenta-sop-kpi',
    code: 'OJT-102',
    title: 'Sistem Absensi Talenta, Logbook, Pelaporan Kerja, Administrasi, SOP & KPI',
    category: 'Operasional & Administrasi',
    trackLevel: 'OJT',
    moduleOrderInTrack: 2,
    instructorName: 'Raka Mahendra',
    instructorRole: 'Operations & System Manager',
    instructorAvatar: INSTRUCTOR_AVATAR,
    coverImage: COVER_ANALYTICS,
    syllabusDurationLabel: '35 Menit',
    videoDurationSec: 120,
    passingScore: 70,
    minWatchPercent: 80,
    description:
      'Panduan operasional harian: absensi & pengajuan izin di Talenta, pengisian Logbook kerja, alur pelaporan pekerjaan, kelengkapan administrasi, kepatuhan SOP, dan target KPI.',
    preTest: [
      {
        id: 'ojt2-pre-1',
        prompt: 'Dalam penggunaan Sistem Absensi Talenta, kapan karyawan wajib melakukan clock-in dan clock-out?',
        options: [
          'Setiap hari kerja secara real-time di lokasi kerja/site yang sah sesuai jadwal shift',
          'Sekali seminggu pada hari Jumat sore',
          'Hanya ketika diingatkan oleh HRD di akhir bulan',
          'Cukup mengirim pesan singkat tanpa mencatat di Talenta',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Rekaman clock-in/out real-time di Talenta menjadi dasar validasi kehadiran dan lembur.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ojt2-pre-2',
        prompt: 'Tujuan utama pengisian Logbook dan Alur Pelaporan Pekerjaan harian adalah:',
        options: [
          'Mendokumentasikan progres aktual, kendala lapangan, dan bukti serah terima pekerjaan secara terukur',
          'Memperpanjang jam rapat harian',
          'Mengisi kolom kosong tanpa detail aktivitas',
          'Menyembunyikan kendala teknis agar tidak terlihat atasan',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Logbook akurat membantu supervisor memantau beban kerja serta mempercepat bantuan saat ada hambatan.',
        relatedChapterIndex: 1,
      },
      {
        id: 'ojt2-pre-3',
        prompt: 'Apa hubungan antara kepatuhan SOP (Standard Operating Procedure) dengan pencapaian KPI?',
        options: [
          'SOP memastikan proses kerja konsisten dan aman sehingga target kualitas & ketepatan waktu KPI tercapai',
          'SOP menghambat pencapaian KPI sehingga boleh dilewati',
          'KPI hanya berlaku bagi manajer puncak',
          'SOP hanya digunakan saat audit tahunan',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'KPI mengukur hasil; SOP menjaga cara mencapainya tetap aman, rapi, dan standar.',
        relatedChapterIndex: 2,
      },
      {
        id: 'ojt2-pre-4',
        prompt: 'Ketika melakukan tugas dinas luar/site atau pengajuan klaim administrasi (reimbursement/lembur), langkah yang tepat adalah:',
        options: [
          'Mengajukan persetujuan terlebih dahulu di sistem dan melampirkan bukti pendukung lengkap sesuai tenggat',
          'Mengajukan klaim setelah lewat enam bulan tanpa struk atau bukti',
          'Menunggu gaji turun baru memberi tahu atasan',
          'Mengabaikan formulir berita acara serah terima',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Tertib administrasi dan persetujuan berjenjang menjamin kelancaran pencairan dan audit.',
        relatedChapterIndex: 3,
      },
    ],
    chapters: [
      {
        id: 'ojt2-ch-1',
        title: 'Bab 1: Penggunaan Sistem Absensi Talenta (Clock-In, Izin, Cuti & Lembur)',
        startSec: 0,
        endSec: 30,
        competency: 'Konsep Dasar',
        summary: 'Cara presensi GPS/selfie di Talenta, pengajuan izin/sakit, koreksi absensi, dan lembur.',
        keyTakeaways: [
          'Pastikan GPS aktif saat clock-in/clock-out sesuai radius kantor atau site.',
          'Ajukan lembur dan cuti melalui Talenta sebelum/sesuai batas waktu approval.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Clock-In Talenta', 'Verifikasi Shift/GPS', 'Approval Atasan', 'Rekap Payroll'],
        captions: [
          { startSec: 0, endSec: 15, text: 'Seluruh presensi, pengajuan cuti, dan persetujuan lembur dikelola terpusat di Talenta.' },
          { startSec: 15, endSec: 30, text: 'Jika terjadi kendala teknis aplikasi di site, segera ajukan attendance correction dengan bukti.' },
        ],
      },
      {
        id: 'ojt2-ch-2',
        title: 'Bab 2: Pengisian Logbook & Alur Pelaporan Pekerjaan',
        startSec: 30,
        endSec: 60,
        competency: 'Penerapan Kasus',
        summary: 'Format catatan harian tugas, status selesai/tertunda, dan eskalasi kendala.',
        keyTakeaways: [
          'Isi logbook di akhir shift mencakup tugas, hasil, dan hambatan.',
          'Sertakan foto/dokumen pendukung pada laporan penyelesaian pekerjaan.',
        ],
        diagramType: 'cycle',
        diagramNodes: ['Terima Tugas', 'Eksekusi Lapangan', 'Isi Logbook Harian', 'Review Atasan'],
        captions: [
          { startSec: 30, endSec: 45, text: 'Logbook bukan sekadar absen tulisan, melainkan jejak teknis pekerjaan Anda.' },
          { startSec: 45, endSec: 60, text: 'Pelaporan terstruktur memudahkan tim berikutnya melanjutkan shift atau proyek.' },
        ],
      },
      {
        id: 'ojt2-ch-3',
        title: 'Bab 3: Tertib Administrasi & Kepatuhan SOP Kerja',
        startSec: 60,
        endSec: 90,
        competency: 'Penerapan Kasus',
        summary: 'Pengarsipan BAST, surat jalan alat, form dinas, dan disiplin mengikuti urutan SOP.',
        keyTakeaways: [
          'Jangan melompati langkah verifikasi dalam SOP meski sedang terburu-buru.',
          'Lengkapi administrasi dokumen tepat waktu agar penagihan & audit lancar.',
        ],
        diagramType: 'hierarchy',
        diagramNodes: ['SOP Operasional', 'Berita Acara & Form', 'Arsip Digital Tim'],
        captions: [
          { startSec: 60, endSec: 75, text: 'Setiap proses operasional memiliki SOP tertulis untuk menjamin mutu dan keselamatan.' },
          { startSec: 75, endSec: 90, text: 'Kelengkapan administrasi seperti BAST dan surat tugas menjaga akuntabilitas tim.' },
        ],
      },
      {
        id: 'ojt2-ch-4',
        title: 'Bab 4: Sosialisasi KPI & Penilaian Kinerja OJT',
        startSec: 90,
        endSec: 120,
        competency: 'Optimasi & Evaluasi',
        summary: 'Memahami bobot KPI individu, kedisiplinan, kualitas teknis, dan review berkala.',
        keyTakeaways: [
          'KPI mencakup ketepatan waktu, kepatuhan SOP/K3, dan akurasi laporan.',
          'Evaluasi bulanan menggunakan data objektif dari Talenta dan logbook.',
        ],
        diagramType: 'chart',
        diagramNodes: ['Kepatuhan SOP & K3', 'Ketepatan SLA/Tugas', 'Kedisiplinan Talenta'],
        captions: [
          { startSec: 90, endSec: 105, text: 'KPI disosialisasikan sejak masa OJT agar setiap peserta tahu standar keberhasilannya.' },
          { startSec: 105, endSec: 120, text: 'Konsistensi mengisi logbook dan mematuhi SOP berdampak langsung pada nilai KPI Anda.' },
        ],
      },
    ],
    checkpoint: {
      triggerSec: 60,
      question: 'Checkpoint OJT-102: Pekerjaan di site selesai pukul 17.00, namun jaringan sempat terputus saat hendak mengisi Logbook. Apa tindakan yang tepat?',
      options: [
        'Mencatat logbook secara lengkap beserta waktu kejadian dan foto bukti segera setelah koneksi tersedia, serta menginfokan supervisor',
        'Tidak perlu mengisi logbook sama sekali untuk hari itu',
        'Mengisi laporan palsu untuk minggu depan',
      ],
      correctIndex: 0,
      feedback: 'Tepat! Dokumentasi logbook yang jujur dan bukti lapangan menjaga validitas pelaporan dan KPI.',
    },
    postTest: [
      {
        id: 'ojt2-post-1',
        prompt: 'Jika karyawan lupa melakukan clock-in di sistem Talenta karena kendala teknis perangkat di lapangan, langkah yang benar adalah:',
        options: [
          'Mengajukan permintaan koreksi absensi di Talenta disertai alasan & bukti kehadiran untuk disetujui atasan',
          'Membiarkannya tanpa keterangan sampai akhir bulan',
          'Meminta rekan lain mengubah jadwal kerja',
          'Menghapus akun Talenta',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Talenta menyediakan alur attendance request agar catatan kehadiran tetap akurat dan sah.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ojt2-post-2',
        prompt: 'Komponen utama yang wajib tercantum dalam Logbook & Laporan Pekerjaan harian yang baik adalah:',
        options: [
          'Daftar aktivitas yang dikerjakan, status hasil/progres, kendala lapangan, dan tindak lanjut',
          'Hanya kata "hadir" tanpa penjelasan tugas',
          'Keluhan pribadi tanpa data teknis',
          'Jadwal libur tahun depan',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Logbook yang rinci mempercepat serah terima tugas dan evaluasi supervisor.',
        relatedChapterIndex: 1,
      },
      {
        id: 'ojt2-post-3',
        prompt: 'Mengapa setiap karyawan OJT dilarang mengambil jalan pintas yang melanggar SOP meskipun ingin pekerjaan cepat selesai?',
        options: [
          'Karena pelanggaran SOP meningkatkan risiko kecelakaan kerja, kerusakan alat, dan cacat mutu',
          'Karena SOP dibuat hanya untuk mempersulit pekerjaan',
          'Karena SOP hanya berlaku bagi karyawan administrasi',
          'Karena KPI melarang pekerjaan selesai tepat waktu',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'SOP dirancang berdasarkan mitigasi risiko dan standar kualitas terbaik.',
        relatedChapterIndex: 2,
      },
      {
        id: 'ojt2-post-4',
        prompt: 'Dalam Sosialisasi KPI, data apa saja yang umumnya menjadi tolok ukur objektif kinerja karyawan baru?',
        options: [
          'Kedisiplinan absensi Talenta, kelengkapan logbook/administrasi, kepatuhan SOP & K3, serta ketepatan target teknis',
          'Jumlah postingan di media sosial pribadi',
          'Warna seragam yang dipakai saat istirahat',
          'Banyaknya dokumen yang tidak diarsipkan',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'KPI menggabungkan indikator kedisiplinan operasional dan pencapaian output kerja.',
        relatedChapterIndex: 3,
      },
    ],
  },

  {
    id: 'ojt-k3-lapangan',
    code: 'OJT-103',
    title: 'K3 di Tempat Pekerjaan (Workshop, Lab Tech & Site)',
    category: 'Keselamatan & Kesehatan Kerja',
    trackLevel: 'OJT',
    moduleOrderInTrack: 3,
    instructorName: 'Dr. Rarasati Kusuma',
    instructorRole: 'HSE & Operational Safety Lead',
    instructorAvatar: INSTRUCTOR_AVATAR,
    coverImage: COVER_FRONTEND,
    syllabusDurationLabel: '35 Menit',
    videoDurationSec: 120,
    passingScore: 70,
    minWatchPercent: 80,
    description:
      'Standar wajib Keselamatan dan Kesehatan Kerja (K3) spesifik pada area Workshop, Lab Tech, dan Site lapangan termasuk APD, identifikasi bahaya, dan izin kerja.',
    preTest: [
      {
        id: 'ojt3-pre-1',
        prompt: 'Sebelum bekerja di area Workshop yang menggunakan mesin pemotong atau penggerinda, perlengkapan wajib yang harus digunakan adalah:',
        options: [
          'APD standar workshop (safety shoes, kacamata pelindung, sarung tangan sesuai tugas, dan pelindung telinga bila bising)',
          'Sandal jepit dan baju longgar berkibar',
          'Cukup memakai topi kain biasa',
          'Tidak perlu APD jika merasa sudah berpengalaman',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'APD workshop melindungi pekerja dari serpihan mekanis, benturan kaki, dan kebisingan.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ojt3-pre-2',
        prompt: 'Risiko utama di area Lab Tech (laboratorium elektronik/pengujian teknis) yang wajib diwaspadai adalah:',
        options: [
          'Sengatan listrik, korsleting, pelepasan muatan statis (ESD), serta paparan panas/bahan uji',
          'Hanya risiko kursi terlalu empuk',
          'Kekurangan sinar matahari',
          'Suara keyboard laptop',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Lab Tech menuntut proteksi kelistrikan, grounding/ESD, dan tata letak meja uji yang kering & rapi.',
        relatedChapterIndex: 1,
      },
      {
        id: 'ojt3-pre-3',
        prompt: 'Saat bertugas di area Site proyek/lapangan klien, prosedur wajib sebelum pekerjaan dimulai adalah:',
        options: [
          'Mengikuti Safety Briefing / Toolbox Meeting, memeriksa Job Safety Analysis (JSA), dan memastikan area bebas bahaya',
          'Langsung bekerja tanpa melapor ke pengawas site',
          'Melepas helm proyek karena terasa panas',
          'Mengabaikan rambu pembatas area bertegangan tinggi',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Site lapangan memiliki bahaya dinamis sehingga safety briefing dan izin kerja wajib dipenuhi.',
        relatedChapterIndex: 2,
      },
      {
        id: 'ojt3-pre-4',
        prompt: 'Jika Anda melihat kabel daya terkelupas atau tumpahan oli di lantai Workshop/Site, tindakan K3 terbaik adalah:',
        options: [
          'Mengamankan/memberi tanda bahaya area tersebut, menghentikan penggunaan sementara, dan melaporkannya ke tim HSE/supervisor',
          'Melompatinya saja agar pekerjaan cepat selesai',
          'Membiarkannya karena bukan tugas kita',
          'Menutupinya dengan kardus tanpa memberi tahu siapa pun',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Pelaporan kondisi tidak aman (unsafe condition) mencegah kecelakaan sebelum terjadi.',
        relatedChapterIndex: 3,
      },
    ],
    chapters: [
      {
        id: 'ojt3-ch-1',
        title: 'Bab 1: Protokol K3 di Area Workshop',
        startSec: 0,
        endSec: 30,
        competency: 'Konsep Dasar',
        summary: 'Penggunaan APD workshop, housekeeping 5R, jarak aman mesin berputar, dan LOTO.',
        keyTakeaways: [
          'Dilarang memakai pakaian longgar/aksesori menggantung dekat mesin berputar.',
          'Terapkan Lockout-Tagout (LOTO) saat perbaikan mesin workshop.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Cek APD Workshop', 'Area Bersih (5R)', 'LOTO Mesin', 'Operasi Aman'],
        captions: [
          { startSec: 0, endSec: 15, text: 'Di Workshop, kerapian area kerja (5R) dan APD lengkap mencegah cedera mekanis.' },
          { startSec: 15, endSec: 30, text: 'Selalu matikan dan kunci sumber daya sebelum melakukan servis atau pembersihan mesin.' },
        ],
      },
      {
        id: 'ojt3-ch-2',
        title: 'Bab 2: Protokol K3 di Area Lab Tech',
        startSec: 30,
        endSec: 60,
        competency: 'Penerapan Kasus',
        summary: 'Keselamatan kelistrikan, gelang ESD, ventilasi solder/kimia, dan larangan makan/minum di meja uji.',
        keyTakeaways: [
          'Jauhkan cairan/minuman dari perangkat pengujian dan panel listrik.',
          'Gunakan gelang anti-statis (ESD) saat menangani komponen sensitif.',
        ],
        diagramType: 'hierarchy',
        diagramNodes: ['Meja Uji Kering', 'Proteksi ESD & Grounding', 'Ventilasi & APAR CO2'],
        captions: [
          { startSec: 30, endSec: 45, text: 'Lab Tech menggabungkan risiko listrik, panas solder, dan komponen elektronik sensitif.' },
          { startSec: 45, endSec: 60, text: 'Pastikan jalur evakuasi lab dan lokasi APAR CO2 selalu mudah dijangkau.' },
        ],
      },
      {
        id: 'ojt3-ch-3',
        title: 'Bab 3: Protokol K3 di Area Site (Lapangan)',
        startSec: 60,
        endSec: 90,
        competency: 'Penerapan Kasus',
        summary: 'Toolbox meeting, APD site (helm, rompi, sepatu safety), bekerja di ketinggian, dan izin kerja.',
        keyTakeaways: [
          'Patuhi aturan K3 milik pemilik site selain standar internal perusahaan.',
          'Wajib body harness terpasang pada titik tambat sah bila bekerja di ketinggian >1.8 meter.',
        ],
        diagramType: 'cycle',
        diagramNodes: ['Safety Induction', 'Toolbox Meeting', 'Izin Kerja / JSA', 'Pengawasan Site'],
        captions: [
          { startSec: 60, endSec: 75, text: 'Setiap site proyek memiliki bahaya unik seperti alat berat, ketinggian, atau cuaca.' },
          { startSec: 75, endSec: 90, text: 'Jangan pernah memulai pekerjaan site sebelum izin kerja dan JSA ditandatangani.' },
        ],
      },
      {
        id: 'ojt3-ch-4',
        title: 'Bab 4: Identifikasi Bahaya, Near-Miss & Hak Menghentikan Kerja',
        startSec: 90,
        endSec: 120,
        competency: 'Optimasi & Evaluasi',
        summary: 'Melaporkan kondisi tidak aman, kejadian nyaris celaka (near-miss), dan Stop Work Authority.',
        keyTakeaways: [
          'Setiap pekerja berhak menghentikan pekerjaan jika kondisi dinilai tidak aman.',
          'Laporkan near-miss agar akar bahaya segera ditangani.',
        ],
        diagramType: 'chart',
        diagramNodes: ['Lapor Near-Miss Proaktif', 'Abaikan Bahaya Kecil'],
        captions: [
          { startSec: 90, endSec: 105, text: 'Kecelakaan besar hampir selalu didahului oleh tanda bahaya kecil yang diabaikan.' },
          { startSec: 105, endSec: 120, text: 'Laporkan unsafe condition & near-miss di tempat kerja demi keselamatan seluruh tim.' },
        ],
      },
    ],
    checkpoint: {
      triggerSec: 60,
      question: 'Checkpoint OJT-103: Anda ditugaskan ke Lab Tech lalu diminta membawa kopi di samping power supply yang menyala. Sikap K3 yang tepat adalah:',
      options: [
        'Menolak meletakkan minuman di meja uji Lab Tech dan menyimpannya di area istirahat yang aman',
        'Meletakkan gelas tepat di atas panel listrik agar mudah dijangkau',
        'Menutupinya dengan kain basah',
      ],
      correctIndex: 0,
      feedback: 'Benar! Melarang makanan/minuman di meja uji Lab Tech mencegah korsleting dan kerusakan peralatan.',
    },
    postTest: [
      {
        id: 'ojt3-post-1',
        prompt: 'Prosedur LOTO (Lockout-Tagout) di area Workshop bertujuan untuk:',
        options: [
          'Memastikan mesin tidak dapat dinyalakan secara tidak sengaja saat teknisi sedang memperbaiki atau membersihkannya',
          'Mengunci pintu gudang agar karyawan tidak masuk',
          'Mempercepat putaran mesin gerinda',
          'Menghemat tinta label inventaris',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'LOTO mengisolasi energi mesin selama perawatan berlangsung agar teknisi aman.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ojt3-post-2',
        prompt: 'Untuk memadamkan kebakaran akibat gangguan listrik di Lab Tech, jenis APAR manakah yang aman digunakan?',
        options: [
          'APAR CO2 atau Dry Chemical Powder (bukan air)',
          'Menyiram langsung dengan ember air keran',
          'Mengipas api dengan kertas karton',
          'Membuka seluruh sakelar tanpa APD',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Air menghantarkan listrik dan berisiko menyetrum penolong; gunakan CO2 atau powder.',
        relatedChapterIndex: 1,
      },
      {
        id: 'ojt3-post-3',
        prompt: 'Saat bekerja di Site proyek dengan ketinggian di atas 1,8 meter, perlengkapan keselamatan wajib yang harus dikenakan adalah:',
        options: [
          'Full Body Harness yang dikaitkan ke anchor point aman beserta helm bertali dagu',
          'Sarung tangan kain tipis saja',
          'Kacamata hitam santai',
          'Sepatu olahraga tanpa pelindung ujung baja',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Pekerjaan ketinggian wajib menggunakan sistem penahan jatuh (fall arrest) yang terverifikasi.',
        relatedChapterIndex: 2,
      },
      {
        id: 'ojt3-post-4',
        prompt: 'Apa yang dimaksud dengan "Near-Miss" dalam pelaporan K3 di Workshop, Lab Tech, maupun Site?',
        options: [
          'Kejadian nyaris celaka yang tidak menimbulkan cedera saat ini tetapi berpotensi menyebabkan kecelakaan jika terulang',
          'Keterlambatan absen selama 2 menit',
          'Target produksi yang melampaui ekspektasi',
          'Jadwal libur nasional',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Mencatat near-miss memungkinkan perbaikan kondisi sebelum benar-benar memakan korban.',
        relatedChapterIndex: 3,
      },
    ],
  },

  {
    id: 'ojt-p3k-darurat',
    code: 'OJT-104',
    title: 'Penanganan Pertama Kecelakaan Kerja (P3K) & Tanggap Darurat',
    category: 'Keselamatan & Kesehatan Kerja',
    trackLevel: 'OJT',
    moduleOrderInTrack: 4,
    instructorName: 'Dr. Rarasati Kusuma',
    instructorRole: 'HSE & Emergency Response Lead',
    instructorAvatar: INSTRUCTOR_AVATAR,
    coverImage: COVER_ANALYTICS,
    syllabusDurationLabel: '30 Menit',
    videoDurationSec: 120,
    passingScore: 70,
    minWatchPercent: 80,
    description:
      'Langkah cepat dan tepat pertolongan pertama pada kecelakaan kerja (luka sayat, luka bakar, sengatan listrik, pingsan/cedera) sebelum tenaga medis tiba.',
    preTest: [
      {
        id: 'ojt4-pre-1',
        prompt: 'Ketika melihat rekan kerja tersengat listrik di Workshop atau Lab Tech, tindakan PERTAMA yang wajib Anda lakukan adalah:',
        options: [
          'Memutus sumber aliran listrik (MCB/steker) atau menjauhkan kabel dengan benda isolator kering sebelum menyentuh korban',
          'Langsung menarik tubuh korban dengan tangan kosong',
          'Menyiram korban dengan air dingin',
          'Membiarkannya tanpa memanggil bantuan',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Amankan diri penolong dan putuskan sumber bahaya listrik terlebih dahulu agar tidak menambah korban.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ojt4-pre-2',
        prompt: 'Pertolongan pertama paling tepat untuk luka bakar ringan akibat terkena solder panas atau uap panas adalah:',
        options: [
          'Mengalirkan air bersih suhu sejuk/mengalir selama 10–20 menit dan menutup luka dengan kasa steril',
          'Mengoleskan pasta gigi, mentega, atau kecap',
          'Memecahkan lepuhan kulit secara paksa',
          'Menempelkan kapas kering langsung hingga lengket di luka',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Air mengalir menurunkan suhu jaringan secara aman tanpa menimbulkan infeksi seperti pasta gigi/mentega.',
        relatedChapterIndex: 1,
      },
      {
        id: 'ojt4-pre-3',
        prompt: 'Untuk menghentikan perdarahan aktif pada luka sayat di tangan akibat alat kerja, langkah yang benar adalah:',
        options: [
          'Menekan luka secara mantap menggunakan kasa steril/kain bersih serta meninggikan posisi tangan bila memungkinkan',
          'Menaburkan bubuk kopi ke atas luka terbuka',
          'Membiarkan darah mengalir terus agar cepat kering',
          'Mengikat kuat lengan dengan kawat',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Tekanan langsung (direct pressure) dengan kain/kasa steril adalah metode utama menghentikan perdarahan.',
        relatedChapterIndex: 2,
      },
      {
        id: 'ojt4-pre-4',
        prompt: 'Setelah memberikan P3K awal pada insiden kerja, langkah administratif & medis lanjutan yang wajib dilakukan adalah:',
        options: [
          'Menghubungi petugas P3K/HSE/klinik rujukan dan mencatat laporan insiden kerja sesuai prosedur',
          'Menyembunyikan kejadian agar statistik workshop tetap nol',
          'Menyuruh korban langsung mengemudi pulang sendirian meski masih pusing',
          'Membuang kotak P3K tanpa mengisi ulang isinya',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Rujukan medis menjamin keselamatan korban serta dokumentasi insiden mencegah terulangnya kasus.',
        relatedChapterIndex: 3,
      },
    ],
    chapters: [
      {
        id: 'ojt4-ch-1',
        title: 'Bab 1: Prinsip 3A (Aman Diri, Aman Lingkungan, Aman Korban)',
        startSec: 0,
        endSec: 30,
        competency: 'Konsep Dasar',
        summary: 'Mengamankan situasi bahaya listrik, kimia, atau mekanis sebelum mendekati korban.',
        keyTakeaways: [
          'Jangan pernah menjadi korban kedua akibat panik tanpa menilai bahaya.',
          'Matikan mesin/listrik dan aktifkan bantuan darurat secepatnya.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Aman Diri Penolong', 'Aman Lingkungan', 'Aman Korban', 'Panggil Medis'],
        captions: [
          { startSec: 0, endSec: 15, text: 'Dalam P3K, prinsip pertama selalu Aman Diri dan Aman Lingkungan sebelum menolong korban.' },
          { startSec: 15, endSec: 30, text: 'Pastikan sumber listrik, gas, atau mesin berputar sudah dimatikan sebelum kontak fisik.' },
        ],
      },
      {
        id: 'ojt4-ch-2',
        title: 'Bab 2: Penanganan Luka Bakar, Iritasi Mata & Sengatan Listrik',
        startSec: 30,
        endSec: 60,
        competency: 'Penerapan Kasus',
        summary: 'Pendinginan luka bakar dengan air mengalir, eye-wash darurat, dan respons kejut listrik.',
        keyTakeaways: [
          'Dinginkan luka bakar dengan air mengalir 10–20 menit, hindari olesan non-medis.',
          'Bila mata terkena debu/bahan kimia, bilas di eye-wash minimal 15 menit.',
        ],
        diagramType: 'hierarchy',
        diagramNodes: ['Luka Bakar -> Air Mengalir', 'Mata Terpapar -> Eye Wash', 'Listrik -> Putus MCB'],
        captions: [
          { startSec: 30, endSec: 45, text: 'Hindari mitos mengoleskan pasta gigi atau oli karena memerangkap panas di jaringan kulit.' },
          { startSec: 45, endSec: 60, text: 'Korban tersengat listrik wajib diperiksa dokter meski tampak sadar untuk evaluasi irama jantung.' },
        ],
      },
      {
        id: 'ojt4-ch-3',
        title: 'Bab 3: Perdarahan, Terkilir, Pingsan & Posisi Pemulihan',
        startSec: 60,
        endSec: 90,
        competency: 'Penerapan Kasus',
        summary: 'Teknik tekan langsung dengan kasa steril, pembidaian sederhana, dan pertolongan pingsan.',
        keyTakeaways: [
          'Tekan luka berdarah menggunakan kasa steril dengan sarung tangan medis.',
          'Jangan pindahkan korban jatuh ketinggian/curiga cedera tulang belakang kecuali area terancam bahaya.',
        ],
        diagramType: 'cycle',
        diagramNodes: ['Pakai Sarung Tangan', 'Tekan Luka Steril', 'Cek Kesadaran', 'Stabilkan Korban'],
        captions: [
          { startSec: 60, endSec: 75, text: 'Gunakan sarung tangan dari kotak P3K untuk mencegah kontaminasi silang saat merawat luka.' },
          { startSec: 75, endSec: 90, text: 'Longgarkan pakaian korban pingsan, pastikan jalan napas lega, dan hubungi tim medis.' },
        ],
      },
      {
        id: 'ojt4-ch-4',
        title: 'Bab 4: Kotak P3K, Nomor Darurat, Titik Kumpul & Laporan Insiden',
        startSec: 90,
        endSec: 120,
        competency: 'Optimasi & Evaluasi',
        summary: 'Lokasi kotak P3K di tiap area, jalur evakuasi, dan investigasi akar insiden.',
        keyTakeaways: [
          'Kenali lokasi kotak P3K, tandu, dan jalur menuju Titik Kumpul di hari pertama.',
          'Catat setiap pemakaian isi kotak P3K dan laporkan insiden ke HSE.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Kotak P3K Area', 'Rujukan Faskes', 'Berita Acara Insiden', 'Perbaikan K3'],
        captions: [
          { startSec: 90, endSec: 105, text: 'Pastikan Anda tahu nomor darurat internal HSE dan klinik rujukan perusahaan.' },
          { startSec: 105, endSec: 120, text: 'Pelaporan insiden bukan untuk menyalahkan, melainkan mencegah kecelakaan serupa.' },
        ],
      },
    ],
    checkpoint: {
      triggerSec: 60,
      question: 'Checkpoint OJT-104: Rekan tim mengalami luka sayat cukup dalam di jari saat mengupas kabel. Bahan apakah yang paling tepat dari kotak P3K?',
      options: [
        'Sarung tangan medis untuk penolong, cairan pembersih luka/NaCl, kasa steril tekan langsung, dan perban',
        'Bubuk kopi dan tisu bekas',
        'Pasta gigi dingin',
      ],
      correctIndex: 0,
      feedback: 'Tepat! Kebersihan penolong, kasa steril, dan tekanan langsung adalah prosedur P3K yang aman.',
    },
    postTest: [
      {
        id: 'ojt4-post-1',
        prompt: 'Urutan prioritas prinsip 3A sebelum melakukan pertolongan pertama pada kecelakaan kerja adalah:',
        options: [
          'Aman Diri penolong, Aman Lingkungan sekitar, lalu Aman Korban',
          'Langsung menggendong korban tanpa melihat kabel listrik di lantai',
          'Merekam video terlebih dahulu sebelum memutus bahaya',
          'Menunggu jam pulang kerja',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Penolong yang ceroboh dapat ikut menjadi korban sehingga situasi makin darurat.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ojt4-post-2',
        prompt: 'Mengapa pasta gigi atau mentega TIDAK boleh dioleskan ke kulit yang mengalami luka bakar?',
        options: [
          'Dapat memerangkap panas di dalam kulit dan memicu risiko infeksi luka',
          'Karena membuat luka sembuh terlalu cepat',
          'Karena hanya cocok untuk luka patah tulang',
          'Karena harganya terlalu mahal',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Penanganan standar luka bakar awal adalah air bersih mengalir selama 10–20 menit.',
        relatedChapterIndex: 1,
      },
      {
        id: 'ojt4-post-3',
        prompt: 'Jika rekan kerja jatuh dari tangga site dan mengeluhkan nyeri hebat di punggung/leher, sikap P3K yang benar adalah:',
        options: [
          'Tidak memindahkan posisi korban secara sembarangan, jaga agar tetap diam, dan segera panggil tim medis/ambulan',
          'Memaksa korban berdiri dan berjalan ke pos satpam',
          'Memijat keras area leher dan punggung',
          'Mendudukkan korban dengan menyentak tubuhnya',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Gerakan salah pada dugaan cedera tulang belakang dapat memperparah cedera saraf.',
        relatedChapterIndex: 2,
      },
      {
        id: 'ojt4-post-4',
        prompt: 'Apa kewajiban tim setelah menggunakan perlengkapan di kotak P3K area Workshop atau Site?',
        options: [
          'Melaporkan pemakaian dan insiden ke HSE/GA agar stok kotak P3K segera diisi ulang dan kejadian dievaluasi',
          'Mengunci kotak P3K dan menyembunyikannya',
          'Membiarkan kotak P3K kosong',
          'Tidak perlu mencatat kejadian apa pun',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Kotak P3K harus selalu lengkap dan siap pakai setiap saat.',
        relatedChapterIndex: 3,
      },
    ],
  },

  {
    id: 'ojt-alat-kerja',
    code: 'OJT-105',
    title: 'Pengenalan Alat Kerja, Inspeksi Pra-Pakai & Pemeliharaan Aset',
    category: 'Alat & Sarana Operasional',
    trackLevel: 'OJT',
    moduleOrderInTrack: 5,
    instructorName: 'Raka Mahendra',
    instructorRole: 'Technical Operations Lead',
    instructorAvatar: INSTRUCTOR_AVATAR,
    coverImage: COVER_FRONTEND,
    syllabusDurationLabel: '30 Menit',
    videoDurationSec: 120,
    passingScore: 70,
    minWatchPercent: 80,
    description:
      'Mengenal fungsi dan batasan alat ukur, perkakas Workshop/Lab Tech/Site, tata cara peminjaman inventaris, pemeriksaan sebelum pakai, dan kalibrasi/perawatan.',
    preTest: [
      {
        id: 'ojt5-pre-1',
        prompt: 'Apa tujuan melakukan pemeriksaan pra-pakai (pre-use check) pada alat kerja sebelum dibawa ke Site atau digunakan di Workshop?',
        options: [
          'Memastikan alat berfungsi akurat, baterai/kabel utuh, dan tidak membahayakan operator',
          'Menghabiskan waktu jam kerja di pagi hari',
          'Mengganti fungsi alat agar dipakai di luar spesifikasi',
          'Menghindari pengisian formulir peminjaman',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Inspeksi pra-pakai mendeteksi kabel rusak, baterai lemah, atau alat ukur tidak presisi sebelum kerja dimulai.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ojt5-pre-2',
        prompt: 'Mengapa penggunaan multimeter atau alat ukur di atas batas tegangan/arus maksimalnya sangat berbahaya?',
        options: [
          'Dapat merusak komponen alat ukur hingga meledak/terbakar dan membahayakan keselamatan pengguna',
          'Hanya membuat layar menjadi lebih terang',
          'Meningkatkan umur baterai secara otomatis',
          'Tidak berpengaruh apa-apa pada pengukuran',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Setiap alat kerja dan alat ukur memiliki batas rating CAT dan rentang beban yang wajib dipatuhi.',
        relatedChapterIndex: 1,
      },
      {
        id: 'ojt5-pre-3',
        prompt: 'Saat meminjam peralatan dari ruang inventaris untuk pekerjaan lapangan, prosedur yang wajib diikuti adalah:',
        options: [
          'Mencatat kode aset/serial number pada formulir peminjaman serta mengecek kelengkapan aksesori saat ambil dan kembali',
          'Mengambil langsung tanpa izin penanggung jawab gudang',
          'Menukar kabel atau komponen antar-tas alat tanpa catatan',
          'Menyimpan alat perusahaan di rumah pribadi tanpa batas waktu',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Pelacakan inventaris memastikan seluruh peralatan siap pakai saat dibutuhkan tim lain.',
        relatedChapterIndex: 2,
      },
      {
        id: 'ojt5-pre-4',
        prompt: 'Jika alat ukur menunjukkan label kalibrasi kedaluwarsa atau hasil pembacaan menyimpang, tindakan yang benar adalah:',
        options: [
          'Memberi tanda "Jangan Digunakan / Rusak" dan menyerahkannya ke penanggung jawab aset untuk kalibrasi/servis',
          'Tetap memakainya dan mengira-ngira angkanya sendiri',
          'Melepas stiker kalibrasinya agar tidak terlihat',
          'Membanting alat agar kembali normal',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Alat ukur tidak terkalibrasi menghasilkan data teknis salah yang berisiko gagal uji.',
        relatedChapterIndex: 3,
      },
    ],
    chapters: [
      {
        id: 'ojt5-ch-1',
        title: 'Bab 1: Klasifikasi Alat Kerja (Hand Tools, Power Tools & Alat Ukur)',
        startSec: 0,
        endSec: 30,
        competency: 'Konsep Dasar',
        summary: 'Mengenal kategori perkakas tangan, perkakas bertenaga listrik, dan instrumen ukur presisi.',
        keyTakeaways: [
          'Gunakan tiap alat hanya sesuai fungsi dan kapasitas rancangannya.',
          'Kenali perbedaan rating keamanan alat ukur (CAT II/III/IV) untuk lab vs site.',
        ],
        diagramType: 'hierarchy',
        diagramNodes: ['Hand Tools', 'Power Tools', 'Alat Ukur & Diagnostik'],
        captions: [
          { startSec: 0, endSec: 15, text: 'Mengenal alat kerja dimulai dari memilih perkakas yang tepat untuk jenis pekerjaan.' },
          { startSec: 15, endSec: 30, text: 'Kesalahan memilih tang, obeng, atau rentang multimeter merusak benda kerja maupun alat.' },
        ],
      },
      {
        id: 'ojt5-ch-2',
        title: 'Bab 2: Daftar Periksa Inspeksi Pra-Pakai & Batas Aman Operasi',
        startSec: 30,
        endSec: 60,
        competency: 'Penerapan Kasus',
        summary: 'Cek fisik kabel, isolasi pegangan, mata bor/potong, dan ketepatan skala nol.',
        keyTakeaways: [
          'Tolak penggunaan power tools dengan kabel terkelupas atau pelindung mata pisau lepas.',
          'Verifikasi baterai dan probe alat ukur sebelum berangkat ke site.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Cek Fisik & Kabel', 'Uji Fungsi Ringkas', 'Pastikan Rating Aman', 'Siap Pakai'],
        captions: [
          { startSec: 30, endSec: 45, text: 'Luangkan dua menit sebelum berangkat ke site untuk memeriksa kondisi kabel dan probe alat.' },
          { startSec: 45, endSec: 60, text: 'Alat dengan isolasi retak tidak boleh digunakan di dekat sumber tegangan.' },
        ],
      },
      {
        id: 'ojt5-ch-3',
        title: 'Bab 3: Prosedur Peminjaman, Serah Terima & Penyimpanan Inventaris',
        startSec: 60,
        endSec: 90,
        competency: 'Penerapan Kasus',
        summary: 'Pencatatan kode aset, pengemasan tas kerja, dan pengembalian tepat waktu.',
        keyTakeaways: [
          'Pastikan seluruh aksesori (probe, charger, kotak alat) lengkap saat dikembalikan.',
          'Bersihkan debu/oli pada alat sebelum dimasukkan ke lemari penyimpanan.',
        ],
        diagramType: 'cycle',
        diagramNodes: ['Ajukan Pinjam Aset', 'Cek Kondisi Awal', 'Gunakan Sesuai SOP', 'Bersihkan & Kembali'],
        captions: [
          { startSec: 60, endSec: 75, text: 'Setiap peralatan berharga memiliki kode aset agar mudah dilacak antar proyek.' },
          { startSec: 75, endSec: 90, text: 'Mengembalikan alat dalam keadaan bersih adalah bagian dari budaya kerja profesional.' },
        ],
      },
      {
        id: 'ojt5-ch-4',
        title: 'Bab 4: Kalibrasi Berkala & Pelaporan Kerusakan Alat',
        startSec: 90,
        endSec: 120,
        competency: 'Optimasi & Evaluasi',
        summary: 'Menjaga akurasi pengukuran dan menandai alat rusak agar tidak terpakai tim lain.',
        keyTakeaways: [
          'Periksa tanggal masa berlaku stiker kalibrasi pada instrumen ukur.',
          'Segera laporkan kerusakan ke admin aset agar tidak menghambat jadwal proyek berikutnya.',
        ],
        diagramType: 'chart',
        diagramNodes: ['Alat Terkalibrasi (Akurat)', 'Alat Rusak Ditandai', 'Audit Aset Bulanan'],
        captions: [
          { startSec: 90, endSec: 105, text: 'Jika menemukan alat rusak, jangan diam-diam meletakkannya kembali ke rak tanpa label.' },
          { startSec: 105, endSec: 120, text: 'Pelaporan dini membuat tim aset segera memperbaiki atau menyiapkan unit pengganti.' },
        ],
      },
    ],
    checkpoint: {
      triggerSec: 60,
      question: 'Checkpoint OJT-105: Saat memeriksa bor listrik di Workshop sebelum dibawa ke Site, Anda melihat isolasi kabelnya robek sedikit hingga serabut tembaga terlihat. Apa keputusan Anda?',
      options: [
        'Tidak menggunakannya, menandai rusak, melapor ke admin aset/HSE, dan meminjam unit lain yang laik pakai',
        'Melilitnya seadanya dengan selotip kertas lalu tetap dipakai di area basah',
        'Mengabaikannya selama mesin masih berputar',
      ],
      correctIndex: 0,
      feedback: 'Benar! Kabel rusak pada power tools berisiko tinggi menimbulkan sengatan listrik fatal.',
    },
    postTest: [
      {
        id: 'ojt5-post-1',
        prompt: 'Mengapa penting mengenali batas kemampuan dan fungsi masing-masing alat kerja sejak tahap OJT?',
        options: [
          'Mencegah kecelakaan kerja, menjaga keawetan alat, serta memastikan hasil pekerjaan presisi',
          'Agar alat cepat habis masa pakainya',
          'Supaya semua baut bisa dikencangkan dengan tang biasa tanpa kunci pas',
          'Agar alat tidak perlu disimpan di rak',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Menggunakan alat yang sesuai fungsi melindungi operator maupun kualitas hasil kerja.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ojt5-post-2',
        prompt: 'Manakah hal yang WAJIB diperiksa saat inspeksi pra-pakai alat ukur digital sebelum dibawa ke Site?',
        options: [
          'Kondisi kabel probe tidak terkelupas, layar terbaca jelas, baterai cukup, dan masa kalibrasi masih berlaku',
          'Hanya warna tas pembungkusnya',
          'Apakah stiker inventaris sudah dilepas',
          'Berat kotak alat dalam kilogram saja',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Probe utuh, daya cukup, dan kalibrasi aktif memastikan hasil pengukuran di lapangan valid dan aman.',
        relatedChapterIndex: 1,
      },
      {
        id: 'ojt5-post-3',
        prompt: 'Setelah pekerjaan di Workshop atau Site selesai, bagaimana standar pengembalian alat kerja ke inventaris?',
        options: [
          'Membersihkan alat, mengecek kelengkapan aksesori, dan mencatat pengembalian di log inventaris',
          'Meninggalkan alat berserakan di lantai site',
          'Menyimpannya dalam keadaan basah atau kotor',
          'Menyerahkan ke orang yang tidak dikenal tanpa catatan',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Kebersihan dan pencatatan serah terima membuat alat siap digunakan tim shift selanjutnya.',
        relatedChapterIndex: 2,
      },
      {
        id: 'ojt5-post-4',
        prompt: 'Jika sebuah alat kerja mengalami kerusakan atau tidak akurat saat digunakan di lapangan, tindakan paling bertanggung jawab adalah:',
        options: [
          'Memisahkan alat dengan label rusak dan melaporkannya melalui alur pelaporan aset untuk perbaikan/kalibrasi',
          'Mengembalikannya diam-diam ke rak agar dipakai orang lain',
          'Membongkar mesin tanpa pengetahuan teknis dan tanpa izin',
          'Membuang alat ke tempat sampah umum',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Labeling alat rusak mencegah tim lain memakai instrumen yang membahayakan atau tidak akurat.',
        relatedChapterIndex: 3,
      },
    ],
  },

  {
    id: 'ojt-jobdesk-teknis',
    code: 'OJT-106',
    title: 'Jobdesk dan Kompetensi Teknis Peran',
    category: 'Kompetensi Teknis & Peran',
    trackLevel: 'OJT',
    moduleOrderInTrack: 6,
    instructorName: 'Nadia Permatasari',
    instructorRole: 'Engineering & Technical Enablement',
    instructorAvatar: INSTRUCTOR_AVATAR,
    coverImage: COVER_UI,
    syllabusDurationLabel: '40 Menit',
    videoDurationSec: 120,
    passingScore: 70,
    minWatchPercent: 80,
    description:
      'Memahami batasan tanggung jawab Jobdesk harian, alur eksekusi teknis end-to-end, standar verifikasi kualitas (QC), dan kriteria kelulusan ke jenjang Junior.',
    preTest: [
      {
        id: 'ojt6-pre-1',
        prompt: 'Apa arti memahami batasan Jobdesk dan kewenangan teknis bagi peserta OJT?',
        options: [
          'Mengetahui tugas pokok yang menjadi tanggung jawabnya serta keputusan mana yang wajib mendapat persetujuan senior/supervisor',
          'Menolak membantu rekan tim meskipun sedang darurat keselamatan',
          'Mengambil alih persetujuan proyek tanpa konsultasi',
          'Bekerja tanpa perlu target waktu',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Kejelasan batas kewenangan mencegah kesalahan fatal di sistem produksi atau instalasi lapangan.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ojt6-pre-2',
        prompt: 'Sebelum menyatakan suatu pekerjaan teknis "Selesai" dan menyerahkannya ke supervisor/klien, langkah wajib yang harus dilakukan adalah:',
        options: [
          'Melakukan uji fungsi & checklist verifikasi kualitas (Quality Check) serta melengkapi dokumentasi/logbook',
          'Langsung pulang tanpa menguji hasil kerja',
          'Mengasumsikan alat pasti bekerja tanpa dites',
          'Menghapus catatan hasil pengujian yang gagal',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Self-QC memastikan pekerjaan benar-benar memenuhi standar teknis sebelum serah terima.',
        relatedChapterIndex: 1,
      },
      {
        id: 'ojt6-pre-3',
        prompt: 'Saat menemukan gangguan teknis yang belum pernah ditangani sebelumnya di lapangan, pendekatan teknis yang tepat bagi peserta OJT adalah:',
        options: [
          'Mengamati gejala dengan cermat, mencatat parameter/error, memeriksa panduan SOP teknis, dan berkonsultasi dengan mentor/senior',
          'Mencoba membongkar komponen utama secara acak tanpa panduan',
          'Menunggu masalah hilang sendiri',
          'Menyalahkan alat kerja tanpa memeriksa instalasinya',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Troubleshooting terstruktur dan konsultasi mentor mempercepat pembelajaran tanpa merusak sistem.',
        relatedChapterIndex: 2,
      },
      {
        id: 'ojt6-pre-4',
        prompt: 'Kriteria utama seorang peserta OJT dinyatakan siap naik ke Paket Junior adalah:',
        options: [
          'Menguasai seluruh modul wajib OJT (Aturan, Talenta/SOP, K3, P3K, Alat, Jobdesk Teknis) dan konsisten menerapkannya di pekerjaan',
          'Sekadar hadir tanpa menyelesaikan evaluasi teknis',
          'Memiliki skor Post-Test di bawah KKM',
          'Belum pernah mengikuti briefing K3',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Kesiapan ke jenjang Junior dibuktikan melalui penguasaan fondasi operasional, K3, dan standar teknis.',
        relatedChapterIndex: 3,
      },
    ],
    chapters: [
      {
        id: 'ojt6-ch-1',
        title: 'Bab 1: Memahami Uraian Tugas (Jobdesk) & Tanggung Jawab Harian',
        startSec: 0,
        endSec: 30,
        competency: 'Konsep Dasar',
        summary: 'Tugas utama peran, kolaborasi dengan mentor teknis, dan batas otorisasi.',
        keyTakeaways: [
          'Pahami target harian/mingguan yang terhubung ke KPI divisi.',
          'Selalu konfirmasi perubahan ruang lingkup kerja di site ke koordinator.',
        ],
        diagramType: 'hierarchy',
        diagramNodes: ['Jobdesk Inti', 'Tugas Pendukung', 'Batas Otorisasi Senior'],
        captions: [
          { startSec: 0, endSec: 15, text: 'Jobdesk menjelaskan apa yang harus Anda kuasai dan hasilkan di peran Anda.' },
          { startSec: 15, endSec: 30, text: 'Mengetahui kapan harus bertanya ke mentor mencegah kerusakan sistem maupun keterlambatan.' },
        ],
      },
      {
        id: 'ojt6-ch-2',
        title: 'Bab 2: Alur Eksekusi Teknis & Standar Mutu (Quality Check)',
        startSec: 30,
        endSec: 60,
        competency: 'Penerapan Kasus',
        summary: 'Dari membaca work order/spesifikasi, pemasangan/pengujian, hingga checklist serah terima.',
        keyTakeaways: [
          'Baca spesifikasi teknis / wiring / work order sebelum eksekusi.',
          'Dokumentasikan parameter pengukuran sebelum dan sesudah pengerjaan.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Baca Work Order', 'Eksekusi Sesuai SOP', 'Self-QC & Pengujian', 'BAST / Laporan'],
        captions: [
          { startSec: 30, endSec: 45, text: 'Pekerjaan teknis yang baik dimulai dari membaca spesifikasi dengan teliti.' },
          { startSec: 45, endSec: 60, text: 'Selalu uji hasil kerja dengan checklist teknis sebelum dinyatakan selesai.' },
        ],
      },
      {
        id: 'ojt6-ch-3',
        title: 'Bab 3: Dasar Troubleshooting & Eskalasi Masalah Teknis',
        startSec: 60,
        endSec: 90,
        competency: 'Penerapan Kasus',
        summary: 'Membaca gejala masalah, memeriksa koneksi/catu daya dasar, dan menyusun laporan eskalasi.',
        keyTakeaways: [
          'Periksa hal dasar terlebih dahulu: sumber daya, sambungan, konfigurasi awal.',
          'Saat eskalasi ke senior, sertakan foto, log error, dan langkah yang sudah diuji.',
        ],
        diagramType: 'cycle',
        diagramNodes: ['Identifikasi Gejala', 'Cek Dasar & SOP', 'Catat Parameter', 'Konsultasi Senior'],
        captions: [
          { startSec: 60, endSec: 75, text: 'Troubleshooting sistematis dimulai dari memeriksa komponen paling dasar sebelum asumsi rumit.' },
          { startSec: 75, endSec: 90, text: 'Laporan eskalasi yang lengkap mempercepat diagnosis tim ahli.' },
        ],
      },
      {
        id: 'ojt6-ch-4',
        title: 'Bab 4: Evaluasi Akhir Masa OJT & Transisi ke Level Junior',
        startSec: 90,
        endSec: 120,
        competency: 'Optimasi & Evaluasi',
        summary: 'Menyatukan disiplin Talenta/SOP, keselamatan K3, pemeliharaan alat, dan kemampuan teknis.',
        keyTakeaways: [
          'Lulus Post-Test seluruh 6 modul OJT sesuai KKM.',
          'Tunjukkan konsistensi eksekusi mandiri dengan pengawasan minimal.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Lulus 6 Modul OJT', 'Evaluasi Mentor & KPI', 'Siap Jenjang Junior'],
        captions: [
          { startSec: 90, endSec: 105, text: 'Seluruh modul OJT membentuk satu kesatuan kompetensi kerja yang aman dan tertib.' },
          { startSec: 105, endSec: 120, text: 'Setelah menuntaskan OJT, Anda siap melangkah ke paket keterampilan Junior Level.' },
        ],
      },
    ],
    checkpoint: {
      triggerSec: 60,
      question: 'Checkpoint OJT-106: Anda menyelesaikan instalasi/perakitan di Lab Tech 15 menit lebih cepat. Apa langkah sebelum menyerahkan unit ke atasan?',
      options: [
        'Menjalankan checklist Quality Check, menguji fungsi sesuai work order, merapikan alat, lalu mencatat hasil di logbook',
        'Langsung mengemas barang tanpa menguji unitnya menyala',
        'Membiarkan kabel dan alat uji berserakan di meja lab',
      ],
      correctIndex: 0,
      feedback: 'Benar! Verifikasi mutu dan kerapian dokumentasi membedakan teknisi/staf profesional.',
    },
    postTest: [
      {
        id: 'ojt6-post-1',
        prompt: 'Mengapa peserta OJT harus memahami perbedaan antara tugas mandiri dalam Jobdesk dengan tindakan yang butuh persetujuan Senior/Supervisor?',
        options: [
          'Menjaga keselamatan sistem/operasional serta memastikan keputusan berisiko tinggi tetap terkendali',
          'Agar tidak perlu belajar hal teknis baru',
          'Supaya laporan pekerjaan tidak pernah diisi',
          'Karena semua pekerjaan dilarang dikerjakan',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Otorisasi berjenjang melindungi operasi lapangan sambil memberi ruang belajar yang aman.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ojt6-post-2',
        prompt: 'Urutan kerja teknis yang tepat sesuai standar mutu perusahaan adalah:',
        options: [
          'Pahami work order/spesifikasi → siapkan alat & APD → eksekusi sesuai SOP → uji QC & dokumentasikan logbook',
          'Eksekusi langsung → baca spesifikasi di akhir → tidak perlu dokumentasi',
          'Melewatkan QC agar lebih cepat',
          'Mengubah spesifikasi tanpa memberi tahu supervisor',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Alur kerja terstruktur menekan pengerjaan ulang (rework) dan meningkatkan kepuasan mitra.',
        relatedChapterIndex: 1,
      },
      {
        id: 'ojt6-post-3',
        prompt: 'Saat mengalami kendala teknis yang memerlukan bantuan Senior, informasi apa yang membuat proses eskalasi jauh lebih efektif?',
        options: [
          'Gejala masalah, foto/parameter pengukuran, kode error, dan langkah pemeriksaan dasar yang sudah dilakukan',
          'Hanya mengatakan "rusak" tanpa detail lokasi atau alat',
          'Menunggu sampai proyek selesai tanpa melapor',
          'Menghapus seluruh riwayat pengaturan',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Data diagnostik awal menghemat waktu dan menunjukkan ketelitian teknis Anda.',
        relatedChapterIndex: 2,
      },
      {
        id: 'ojt6-post-4',
        prompt: 'Setelah lulus 6 modul OJT (Profil/Aturan, Talenta/SOP/KPI, K3, P3K, Alat Kerja, dan Jobdesk Teknis), fokus utama pada tahap Junior berikutnya adalah:',
        options: [
          'Meningkatkan kemandirian teknis, softskill kolaborasi antar divisi, serta pemecahan masalah tingkat lanjutan',
          'Melupakan seluruh aturan K3 dan SOP yang sudah dipelajari',
          'Berhenti mengisi Talenta dan logbook harian',
          'Menghindari kerja sama tim',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Fondasi OJT menjadi pijakan untuk berkembang di Paket Junior, Middle, hingga Senior.',
        relatedChapterIndex: 3,
      },
    ],
  },

  // ==================== TRACK 2: JUNIOR ====================
  {
    id: 'ui-design-accessibility',
    code: 'UX-112',
    title: 'Sistem Desain & Aksesibilitas Antarmuka Web',
    category: 'Desain Produk & UI',
    trackLevel: 'Junior',
    moduleOrderInTrack: 1,
    instructorName: 'Nadia Permatasari',
    instructorRole: 'Staff Product Designer',
    instructorAvatar: INSTRUCTOR_AVATAR,
    coverImage: COVER_UI,
    syllabusDurationLabel: '35 Menit',
    videoDurationSec: 120,
    passingScore: 75,
    minWatchPercent: 80,
    description:
      'Pelajari prinsip hierarki tipografi, rasio kontras WCAG AA, penandaan status non-warna, dan desain sistem komponen yang konsisten dan inklusif.',
    preTest: [
      {
        id: 'ux-pre-1',
        prompt:
          'Menurut standar WCAG 2.1 Level AA, berapakah rasio kontras minimum untuk teks tubuh berukuran normal?',
        options: ['4.5 : 1', '1.5 : 1', '2.0 : 1', '10.0 : 1'],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation:
          'WCAG AA mensyaratkan rasio kontras minimal 4.5:1 untuk teks reguler dan 3:1 untuk teks berukuran besar.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ux-pre-2',
        prompt:
          'Mengapa menampilkan status "Lulus" atau "Gagal" hanya dengan warna hijau/merah tanpa teks atau ikon melanggar prinsip aksesibilitas?',
        options: [
          'Pengguna dengan buta warna (color vision deficiency) atau pembaca layar tidak dapat membedakan maknanya',
          'Warna hijau tidak didukung oleh monitor LCD',
          'CSS tidak dapat merender dua warna sekaligus',
          'Hal tersebut memperlambat kecepatan internet',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation:
          'Sinyal ganda (dual-coding: warna + ikon + label teks eksplisit) memastikan informasi dapat dipahami semua pengguna.',
        relatedChapterIndex: 1,
      },
      {
        id: 'ux-pre-3',
        prompt:
          'Apa manfaat penggunaan properti CSS tabular-nums pada tabel skor dan penghitung waktu ujian?',
        options: [
          'Setiap digit memiliki lebar seragam sehingga angka tidak bergeser ke kiri/kanan saat nilai berubah atau disejajarkan vertikal',
          'Mengubah font menjadi huruf miring otomatis',
          'Mengompresi gambar JPG di dalam tabel',
          'Menonaktifkan seleksi teks oleh pengguna',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation:
          'Tabular numerals menjaga kestabilan visual (zero layout jitter) pada timer mundur dan kolom angka skor.',
        relatedChapterIndex: 2,
      },
      {
        id: 'ux-pre-4',
        prompt:
          'Dalam aturan skala proporsi warna 60-30-10 pada antarmuka produktivitas seperti LMS, porsi 10% digunakan untuk:',
        options: [
          'Aksi utama dan penanda fokus aktif (CTA, tombol submit, tab aktif)',
          'Latar belakang seluruh halaman',
          'Teks paragraf panjang di seluruh artikel',
          'Garis pembatas di setiap elemen kecil',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation:
          'Membatasi warna aksen pada 10% area membuat perhatian pengguna langsung tertuju pada aksi terpenting.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ux-pre-5',
        prompt:
          'Berapakah ukuran area sentuh minimum (touch target) yang direkomendasikan pada perangkat mobile agar nyaman ditekan?',
        options: ['44 x 44 px', '16 x 16 px', '20 x 20 px', '120 x 120 px'],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation:
          'Area sentuh minimal 44x44 px mencegah salah tekan (mis-tap) bagi pengguna jari maupun pengguna dengan keterbatasan motorik.',
        relatedChapterIndex: 3,
      },
    ],
    chapters: [
      {
        id: 'ux-ch-1',
        title: 'Bab 1: Disiplin Warna 60-30-10 & Kontras WCAG AA',
        startSec: 0,
        endSec: 30,
        competency: 'Konsep Dasar',
        summary: 'Merancang palet antarmuka yang tenang untuk sesi belajar berdurasi panjang.',
        keyTakeaways: [
          '60% kanvas netral mengurangi kelelahan mata saat membaca materi.',
          '30% struktur permukaan memisahkan panel tanpa kotak berlebihan.',
          'Pastikan kontras teks minimal 4.5:1 di atas seluruh permukaan.',
        ],
        diagramType: 'hierarchy',
        diagramNodes: ['60% Kanvas Netral', '30% Permukaan & Garis', '10% Aksen Fokus CTA'],
        captions: [
          { startSec: 0, endSec: 15, text: 'Antarmuka belajar yang penuh warna mencolok cepat melelahkan mata peserta.' },
          { startSec: 15, endSec: 30, text: 'Gunakan aturan 60-30-10 dengan kontras minimal 4.5 banding 1 sesuai standar WCAG AA.' },
        ],
      },
      {
        id: 'ux-ch-2',
        title: 'Bab 2: Sinyal Ganda (Non-Hue Signaling) & Status Jelas',
        startSec: 30,
        endSec: 60,
        competency: 'Penerapan Kasus',
        summary: 'Mengkomunikasikan status lulus, terkunci, dan peringatan secara inklusif.',
        keyTakeaways: [
          'Selalu pasangkan warna status dengan ikon dan teks eksplisit.',
          'Gunakan focus-visible ring yang jelas untuk navigasi keyboard.',
          'Hindari indikator dekoratif yang menyerupai status live.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Warna Semantik', '+ Ikon Kontekstual', '+ Label Teks Jelas', 'Inklusif 100%'],
        captions: [
          { startSec: 30, endSec: 45, text: 'Sekitar 8% pria mengalami gangguan persepsi warna merah-hijau.' },
          { startSec: 45, endSec: 60, text: 'Kombinasikan warna dengan ikon centang/silang serta teks eksplisit seperti Lulus atau Perlu Ulang.' },
        ],
      },
      {
        id: 'ux-ch-3',
        title: 'Bab 3: Tipografi Terstruktur & Tabular Numerals',
        startSec: 60,
        endSec: 90,
        competency: 'Optimasi & Evaluasi',
        summary: 'Membangun keterbacaan naskah soal dan kestabilan angka analitik.',
        keyTakeaways: [
          'Batasi panjang baris bacaan pada 65–75 karakter per baris.',
          'Gunakan tabular-nums pada timer ujian dan tabel komparasi skor.',
          'Gunakan pemisah tipografi bersih daripada menumpuk kapsul badge.',
        ],
        diagramType: 'chart',
        diagramNodes: ['Proportional: 111 vs 888 (Geser)', 'Tabular: 111 vs 888 (Sejajar)'],
        captions: [
          { startSec: 60, endSec: 75, text: 'Timer ujian yang bergetar tiap detik mengganggu konsentrasi peserta saat berpikir.' },
          { startSec: 75, endSec: 90, text: 'Mengaktifkan tabular-nums mengunci lebar setiap angka sehingga kolom skor tetap rapi.' },
        ],
      },
      {
        id: 'ux-ch-4',
        title: 'Bab 4: Ergonomi Sentuh & Responsivitas Layout',
        startSec: 90,
        endSec: 120,
        competency: 'Penerapan Kasus',
        summary: 'Memastikan kontrol kuis dan pemutar video nyaman diakses di desktop maupun ponsel.',
        keyTakeaways: [
          'Target sentuh minimum 44px untuk seluruh tombol opsi jawaban.',
          'Jaga elemen sticky di mobile maksimal 15% tinggi layar.',
          'Hormati preferensi prefers-reduced-motion pengguna.',
        ],
        diagramType: 'cycle',
        diagramNodes: ['Desktop 1440px', 'Tablet Split View', 'Mobile Touch 44px', 'Akses Keyboard'],
        captions: [
          { startSec: 90, endSec: 105, text: 'Peserta LMS sering mengerjakan kuis dari laptop maupun ponsel di perjalanan.' },
          { startSec: 105, endSec: 120, text: 'Pastikan tombol opsi jawaban mudah ditekan dan navigasi atas tidak memenuhi layar mobile.' },
        ],
      },
    ],
    checkpoint: {
      triggerSec: 60,
      question:
        'Checkpoint Tengah Video: Manakah kombinasi terbaik untuk menampilkan status kelulusan Post-Test yang memenuhi aksesibilitas?',
      options: [
        'Teks "Lulus (KKM 75%)" + ikon centang + warna hijau emerald',
        'Sebuah titik bulat berwarna hijau tanpa teks apa pun',
        'Teks berwarna hijau muda tipis di atas latar putih',
      ],
      correctIndex: 0,
      feedback: 'Benar! Kombinasi teks eksplisit, ikon, dan warna kontras tinggi menjamin keterbacaan universal.',
    },
    postTest: [
      {
        id: 'ux-post-1',
        prompt:
          'Desainer memilih teks abu-abu terang (#CBD5E1) di atas latar putih (#FFFFFF) untuk instruksi soal. Masalah utama pilihan ini adalah:',
        options: [
          'Rasio kontras jauh di bawah standar minimum WCAG AA 4.5:1 sehingga sulit dibaca',
          'Warna abu-abu tidak bisa dicetak ke PDF',
          'Browser Chrome menolak menampilkan font DM Sans',
          'Membuat ukuran file HTML membengkak',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation:
          'Teks abu-abu terlalu pucat gagal memenuhi rasio kontras 4.5:1 dan menyulitkan peserta membaca soal ujian.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ux-post-2',
        prompt:
          'Pada daftar hasil ujian, kolom status hanya menampilkan lingkaran merah atau hijau. Perbaikan paling tepat adalah:',
        options: [
          'Menambahkan label teks ("Lulus" / "Perlu Penguatan") dan ikon pembeda di samping warna',
          'Mengganti lingkaran menjadi persegi berkedip',
          'Memperbesar diameter lingkaran menjadi 40px',
          'Menghilangkan kolom status seluruhnya',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation:
          'Informasi semantik harus selalu memiliki penanda selain warna agar inklusif bagi pengguna buta warna dan screen reader.',
        relatedChapterIndex: 1,
      },
      {
        id: 'ux-post-3',
        prompt:
          'Saat mengerjakan Post-Test berdurasi 10 menit, angka penghitung waktu terlihat bergeser ke kiri dan kanan setiap detik. Properti CSS apa yang memperbaikinya?',
        options: [
          'font-variant-numeric: tabular-nums',
          'text-transform: uppercase',
          'letter-spacing: 0.25em',
          'line-height: 2.5',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation:
          'tabular-nums membuat seluruh digit angka berlebar seragam sehingga timer berdiri stabil setiap detik.',
        relatedChapterIndex: 2,
      },
      {
        id: 'ux-post-4',
        prompt:
          'Dalam prinsip desain 60-30-10, mengapa tombol utama "Kumpulkan Jawaban" menggunakan porsi warna 10%?',
        options: [
          'Agar hirarki visual memandu mata pengguna langsung ke aksi utama tanpa distraksi visual',
          'Karena CSS hanya mengizinkan 10% elemen memiliki warna',
          'Agar tombol terlihat lebih kecil daripada teks biasa',
          'Untuk menghemat baterai monitor OLED',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation:
          'Kontrol utama menjadi jangkar visual tunggal ketika warna aksen dijaga ketat pada 10% porsi antarmuka.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ux-post-5',
        prompt:
          'Untuk memenuhi ergonomi perangkat mobile pada kartu pilihan ganda A/B/C/D, ketentuan manakah yang paling tepat?',
        options: [
          'Tinggi tombol minimal 44px dengan jarak antar-opsi yang cukup dan tanpa elemen sticky melebihi 15% viewport',
          'Memperkecil tombol menjadi 24px agar seluruh halaman muat tanpa scroll',
          'Menempatkan banner iklan tetap di bagian atas dan bawah layar',
          'Mengharuskan pengguna memutar layar ke mode landscape',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation:
          'Area sentuh minimal 44px dan batasan tinggi sticky menjaga ruang baca dan kenyamanan tap di layar kecil.',
        relatedChapterIndex: 3,
      },
    ],
  },
  {
    id: 'data-analytics-decision',
    code: 'DA-104',
    title: 'Dasar Data Analytics & Pengambilan Keputusan',
    category: 'Data & Analitik Bisnis',
    trackLevel: 'Junior',
    moduleOrderInTrack: 2,
    instructorName: 'Bagas Prakoso, M.Sc.',
    instructorRole: 'Principal Data Strategist',
    instructorAvatar: INSTRUCTOR_AVATAR,
    coverImage: COVER_ANALYTICS,
    syllabusDurationLabel: '40 Menit',
    videoDurationSec: 120,
    passingScore: 75,
    minWatchPercent: 80,
    description:
      'Kuasai cara merumuskan metrik yang tepat, menghindari jebakan rata-rata menyesatkan (outlier bias), dan membaca efektivitas pembelajaran maupun produk secara objektif.',
    preTest: [
      {
        id: 'da-pre-1',
        prompt:
          'Kapan nilai Median lebih akurat merepresentasikan kondisi mayoritas data dibandingkan nilai Mean (rata-rata)?',
        options: [
          'Ketika distribusi data memiliki pencilan (outlier) ekstrem seperti pendapatan atau durasi sesi',
          'Ketika seluruh angka di dalam dataset bernilai identik',
          'Ketika jumlah sampel lebih dari 100 baris',
          'Mean selalu lebih unggul daripada Median dalam semua kasus',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation:
          'Outlier ekstrem menarik nilai Mean menjauh dari titik tengah populasi, sedangkan Median tetap tahan terhadap nilai ekstrem.',
        relatedChapterIndex: 0,
      },
      {
        id: 'da-pre-2',
        prompt:
          'Mengapa membandingkan skor Post-Test tanpa mengukur Pre-Test sering menghasilkan kesimpulan yang bias?',
        options: [
          'Karena tidak diketahui apakah skor tinggi berasal dari materi pembelajaran atau kemampuan awal peserta',
          'Karena Post-Test tidak bisa dihitung persentasenya',
          'Karena Pre-Test selalu menggunakan soal matematika',
          'Karena skor Post-Test tidak boleh lebih tinggi dari 80',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation:
          'Pre-Test menetapkan garis dasar (baseline) sehingga peningkatan kompetensi murni (learning gain) dapat diukur secara adil.',
        relatedChapterIndex: 1,
      },
      {
        id: 'da-pre-3',
        prompt:
          'Apa perbedaan utama antara Leading Indicator dan Lagging Indicator?',
        options: [
          'Leading memprediksi peluang hasil di masa depan, sedangkan Lagging mengukur hasil akhir yang sudah terjadi',
          'Leading hanya dipakai di divisi keuangan, Lagging di divisi HR',
          'Leading selalu berupa angka persentase, Lagging selalu berupa rupiah',
          'Tidak ada perbedaan, keduanya sinonim',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation:
          'Contoh di LMS: persentase video selesai adalah leading indicator, sedangkan tingkat kelulusan Post-Test adalah lagging indicator.',
        relatedChapterIndex: 2,
      },
      {
        id: 'da-pre-4',
        prompt:
          'Jika terjadi fenomena Simpson’s Paradox dalam laporan pelatihan antardivisi, apa tindakan analitis yang harus dilakukan?',
        options: [
          'Membongkar data agregat ke dalam segmen sub-kelompok agar tren asli tidak terbalik oleh proporsi ukuran sampel',
          'Menghapus seluruh data divisi yang berukuran kecil',
          'Mengganti grafik batang menjadi pie chart',
          'Mengabaikan perbedaan ukuran kelompok peserta',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation:
          'Simpson’s Paradox terjadi ketika tren pada data gabungan berlawanan arah dengan tren di tiap segmen karena faktor pembaur ukuran kelompok.',
        relatedChapterIndex: 3,
      },
      {
        id: 'da-pre-5',
        prompt:
          'Dalam rumus Normalized Gain (N-Gain) Hake: (Post - Pre) / (100 - Pre), jika peserta mendapat Pre-Test 60 dan Post-Test 80, berapakah nilai N-Gain-nya?',
        options: ['0.20', '0.50', '0.75', '0.80'],
        correctIndex: 1,
        competency: 'Optimasi & Evaluasi',
        explanation: '(80 - 60) / (100 - 60) = 20 / 40 = 0.50 (kategori peningkatan sedang).',
        relatedChapterIndex: 1,
      },
    ],
    chapters: [
      {
        id: 'da-ch-1',
        title: 'Bab 1: Distribusi Data, Mean vs Median & Outlier',
        startSec: 0,
        endSec: 30,
        competency: 'Konsep Dasar',
        summary: 'Membaca bentuk distribusi data sebelum meringkasnya menjadi satu angka tunggal.',
        keyTakeaways: [
          'Selalu periksa sebaran (persentil P50/P90) pada data miring (skewed).',
          'Median melindungi analisis dari bias akibat nilai ekstrem.',
          'Gunakan ukuran sebaran seperti IQR atau standar deviasi.',
        ],
        diagramType: 'chart',
        diagramNodes: ['Median P50: 42 Menit', 'Mean: 78 Menit (Bias Outlier)', 'P90: 115 Menit'],
        captions: [
          { startSec: 0, endSec: 15, text: 'Rata-rata tunggal sering menipu saat ada sebagian kecil data bernilai sangat ekstrem.' },
          { startSec: 15, endSec: 30, text: 'Kombinasikan Median dan persentil ke-90 untuk memahami pengalaman tipikal sekaligus kasus batas.' },
        ],
      },
      {
        id: 'da-ch-2',
        title: 'Bab 2: Mengukur Learning Gain (Delta & N-Gain)',
        startSec: 30,
        endSec: 60,
        competency: 'Penerapan Kasus',
        summary: 'Menilai efektivitas materi video menggunakan perbandingan Pre-Test dan Post-Test.',
        keyTakeaways: [
          'Selisih mentah (+Δ) menunjukkan kenaikan poin absolut.',
          'Normalized Gain (N-Gain) memperhitungkan ruang peningkatan yang tersisa.',
          'N-Gain >= 0.70 menandakan efektivitas intervensi belajar yang tinggi.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Baseline Pre-Test', 'Intervensi Video', 'Evaluasi Post-Test', 'Skor N-Gain'],
        captions: [
          { startSec: 30, endSec: 45, text: 'Peserta dengan Pre-Test 80 hanya memiliki ruang naik 20 poin, berbeda dengan peserta Pre-Test 40.' },
          { startSec: 45, endSec: 60, text: 'N-Gain menormalkan kenaikan terhadap skor maksimal sehingga perbandingan antarpeserta menjadi adil.' },
        ],
      },
      {
        id: 'da-ch-3',
        title: 'Bab 3: Leading vs Lagging Indicators di LMS',
        startSec: 60,
        endSec: 90,
        competency: 'Konsep Dasar',
        summary: 'Membangun sinyal peringatan dini sebelum peserta gagal pada ujian akhir.',
        keyTakeaways: [
          'Completion video dan skor checkpoint adalah leading indicator.',
          'Tingkat kelulusan Post-Test adalah lagging indicator.',
          'Intervensi dini dilakukan berdasarkan leading indicator, bukan menunggu gagal.',
        ],
        diagramType: 'hierarchy',
        diagramNodes: ['Leading: Durasi Tonton & Catatan', 'Leading: Checkpoint Tengah', 'Lagging: Kelulusan Post-Test'],
        captions: [
          { startSec: 60, endSec: 75, text: 'Menunggu nilai Post-Test keluar sering terlambat untuk membantu peserta yang kesulitan.' },
          { startSec: 75, endSec: 90, text: 'Pantau leading indicator seperti durasi tonton dan kesalahan checkpoint untuk bimbingan tepat waktu.' },
        ],
      },
      {
        id: 'da-ch-4',
        title: 'Bab 4: Segmentasi Kohort & Menghindari Simpson’s Paradox',
        startSec: 90,
        endSec: 120,
        competency: 'Optimasi & Evaluasi',
        summary: 'Menguji hipotesis dengan membandingkan segmen setara, bukan agregat buta.',
        keyTakeaways: [
          'Selalu lakukan stratifikasi berdasarkan tingkat kemampuan awal.',
          'Periksa ukuran sampel pada setiap kelompok sebelum menyimpulkan.',
          'Gunakan visualisasi slope chart untuk membandingkan kondisi sebelum dan sesudah.',
        ],
        diagramType: 'cycle',
        diagramNodes: ['Data Agregat', 'Cek Variabel Pembaur', 'Segmentasi Kohort', 'Keputusan Valid'],
        captions: [
          { startSec: 90, endSec: 105, text: 'Tren di tabel gabungan bisa berbalik total ketika dipecah menurut level pengalaman peserta.' },
          { startSec: 105, endSec: 120, text: 'Audit selalu faktor pembaur ukuran kelompok sebelum mengambil keputusan kurikulum.' },
        ],
      },
    ],
    checkpoint: {
      triggerSec: 60,
      question:
        'Checkpoint Tengah Video: Seorang peserta memperoleh Pre-Test 50 dan Post-Test 85. Berapakah nilai N-Gain peserta tersebut?',
      options: ['0.70 (Kategori Tinggi)', '0.35 (Kategori Sedang)', '0.50 (Kategori Sedang)'],
      correctIndex: 0,
      feedback: 'Benar! (85 - 50) / (100 - 50) = 35 / 50 = 0.70, termasuk kategori efektivitas tinggi.',
    },
    postTest: [
      {
        id: 'da-post-1',
        prompt:
          'Dalam laporan waktu penyelesaian kuis, 9 peserta selesai dalam 4–6 menit, sedangkan 1 peserta lupa menutup tab selama 120 menit. Metrik pusat mana yang harus ditampilkan di dashboard?',
        options: [
          'Median (P50) karena tidak terpengaruh oleh satu kasus 120 menit',
          'Mean aritmatika karena selalu paling kecil',
          'Nilai maksimum 120 menit',
          'Jumlah total seluruh waktu',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation:
          'Median menjaga laporan tetap mencerminkan pengalaman 90% peserta tanpa distorsi dari satu sesi tab terbuka.',
        relatedChapterIndex: 0,
      },
      {
        id: 'da-post-2',
        prompt:
          'Peserta A naik dari Pre-Test 40 ke Post-Test 70, sementara Peserta B naik dari 70 ke 90. Menggunakan N-Gain, manakah pernyataan yang benar?',
        options: [
          'Peserta B memiliki N-Gain lebih tinggi (0.67 vs 0.50) karena memanfaatkan ruang peningkatan lebih optimal',
          'Peserta A memiliki N-Gain lebih tinggi karena selisih poinnya 30',
          'Keduanya memiliki N-Gain nol',
          'N-Gain hanya dapat dihitung jika Pre-Test bernilai 0',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation:
          'Peserta A: (70-40)/(100-40) = 0.50. Peserta B: (90-70)/(100-70) = 20/30 = 0.67.',
        relatedChapterIndex: 1,
      },
      {
        id: 'da-post-3',
        prompt:
          'Manakah pasangan yang tepat untuk memantau kesehatan proses belajar secara proaktif di LMS?',
        options: [
          'Leading: persentase video ditonton & jawaban checkpoint; Lagging: tingkat kelulusan Post-Test',
          'Leading: sertifikat tercetak; Lagging: jumlah klik tombol play',
          'Leading: biaya server bulanan; Lagging: ukuran logo aplikasi',
          'Keduanya hanya diukur satu tahun sekali',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation:
          'Leading indicator menangkap perilaku belajar saat berlangsung sehingga instruktur dapat memberi dukungan sebelum ujian akhir.',
        relatedChapterIndex: 2,
      },
      {
        id: 'da-post-4',
        prompt:
          'Mengapa stratifikasi peserta berdasarkan nilai Pre-Test penting sebelum menyimpulkan video baru "tidak efektif"?',
        options: [
          'Untuk mencegah Simpson’s Paradox akibat komposisi peserta pemula dan mahir yang tidak seimbang antar-batch',
          'Untuk mengurangi ukuran file database PostgreSQL',
          'Agar peserta tidak bisa mengunduh video',
          'Supaya soal Post-Test menjadi lebih mudah',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation:
          'Membandingkan kelompok dengan baseline setara memastikan kesimpulan bebas dari bias komposisi populasi.',
        relatedChapterIndex: 3,
      },
      {
        id: 'da-post-5',
        prompt:
          'Sebuah modul memiliki N-Gain rata-rata 0.22 dan 65% peserta gagal di Kompetensi 2. Langkah perbaikan berbasis data yang paling tepat adalah:',
        options: [
          'Merevisi Bab Video yang memetakan Kompetensi 2 dan memperjelas contoh kasusnya',
          'Menghapus Pre-Test agar N-Gain tidak terlihat rendah',
          'Menurunkan KKM menjadi 30%',
          'Menambah animasi latar belakang pada halaman login',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation:
          'Pemetaan kompetensi menghubungkan skor rendah langsung ke bab video spesifik yang perlu diperbaiki kualitas penyampaiannya.',
        relatedChapterIndex: 1,
      },
    ],
  },
  {
    id: 'junior-softskill-core',
    code: 'JR-103',
    title: 'Softskill Untuk Junior Level',
    category: 'Pengembangan Profesional',
    trackLevel: 'Junior',
    moduleOrderInTrack: 3,
    instructorName: 'Nadia Permatasari',
    instructorRole: 'People & Engineering Enablement Lead',
    instructorAvatar: INSTRUCTOR_AVATAR,
    coverImage: COVER_UI,
    syllabusDurationLabel: '45 Menit',
    videoDurationSec: 125,
    passingScore: 75,
    minWatchPercent: 80,
    description:
      'Membentuk fondasi profesional bagi talenta Junior: etika kerja, pengelolaan produktivitas diri, komunikasi efektif, kolaborasi lintas divisi, dan pola pikir pemecahan masalah.',
    preTest: [
      {
        id: 'jr3-pre-1',
        prompt:
          'Salah satu ciri utama Professional Mindset & Work Ethics bagi seorang Junior saat menghadapi tenggat waktu yang berisiko meleset adalah:',
        options: [
          'Mengkomunikasikan kendala sedini mungkin disertai opsi solusi atau penyesuaian ruang lingkup',
          'Diam hingga hari pengumpulan lalu menyalahkan tim lain',
          'Menghapus fitur pengujian agar selesai lebih cepat tanpa memberi tahu siapa pun',
          'Menghindari rapat harian sampai tugas selesai',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation:
          'Akuntabilitas dan transparansi dini merupakan inti etika kerja profesional agar tim dapat melakukan mitigasi bersama.',
        relatedChapterIndex: 0,
      },
      {
        id: 'jr3-pre-2',
        prompt:
          'Dalam Self-Management & Productivity (Pengelolaan Diri), pendekatan paling efektif untuk mengatasi tumpukan tugas harian yang bersamaan adalah:',
        options: [
          'Memprioritaskan tugas berdasarkan urgensi serta dampak (Eisenhower Matrix) dan melindungi blok waktu fokus',
          'Mengerjakan tugas secara acak sambil terus memeriksa notifikasi chat tiap menit',
          'Menerima semua permintaan mendadak tanpa menegosiasikan jadwal tugas utama',
          'Menunda seluruh tugas sulit hingga akhir pekan',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation:
          'Pengelolaan diri menuntut kejelasan prioritas dan manajemen fokus kerja mendalam (deep work).',
        relatedChapterIndex: 1,
      },
      {
        id: 'jr3-pre-3',
        prompt:
          'Saat menyampaikan laporan status atau meminta bantuan teknis di Komunikasi Di Tempat Kerja (asinkron via chat/tiket), struktur paling efektif adalah:',
        options: [
          'Menyertakan konteks tujuan, apa yang sudah dicoba, kendala spesifik, dan pertanyaan yang jelas dalam satu pesan terstruktur',
          'Mengirim pesan "Halo" lalu menunggu balasan berjam-jam sebelum menjelaskan masalahnya',
          'Mengirim potongan error tanpa menjelaskan langkah reproduksinya',
          'Menuliskan pesan panjang tanpa poin utama atau kesimpulan',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation:
          'Komunikasi asinkron yang ringkas dan lengkap menghemat waktu seluruh rekan kerja.',
        relatedChapterIndex: 2,
      },
      {
        id: 'jr3-pre-4',
        prompt:
          'Dalam Kolaborasi Antar Divisi (misalnya antara tim Engineering, Produk, dan Operasional), apa hal paling penting untuk mencegah kesalahpahaman?',
        options: [
          'Menerjemahkan istilah teknis ke bahasa dampak pengguna/bisnis dan menyepakati definisi selesai (Definition of Done) bersama',
          'Menggunakan istilah jargon teknis yang rumit agar divisi lain tidak banyak bertanya',
          'Menunggu hingga produk dirilis baru menunjukkan hasilnya ke divisi lain',
          'Menolak berdiskusi dengan divisi non-teknis',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation:
          'Empati lintas peran dan penyelarasan ekspektasi bersama menjaga kolaborasi antar divisi tetap mulus.',
        relatedChapterIndex: 3,
      },
      {
        id: 'jr3-pre-5',
        prompt:
          'Pada tahap Basic Problem Solving dan Critical Thinking, sebelum langsung menulis kode atau menerapkan solusi pertama yang terlintas, langkah krusial yang harus dilakukan adalah:',
        options: [
          'Memverifikasi akar masalah (root cause) menggunakan data/fakta dan mempertimbangkan 2–3 alternatif beserta dampaknya',
          'Langsung menyalin solusi pertama yang ditemukan tanpa memahami penyebabnya',
          'Mengubah seluruh arsitektur sistem agar terlihat sibuk',
          'Mengabaikan gejala masalah jika hanya terjadi sesekali',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation:
          'Critical thinking membedakan gejala permukaan dengan akar masalah sehingga solusi tepat sasaran.',
        relatedChapterIndex: 4,
      },
    ],
    chapters: [
      {
        id: 'jr3-ch-1',
        title: 'Bab 1: Professional Mindset & Work Ethics',
        startSec: 0,
        endSec: 25,
        competency: 'Konsep Dasar',
        summary: 'Membangun kepemilikan (ownership), integritas, dan keterbukaan terhadap umpan balik.',
        keyTakeaways: [
          'Ambil kepemilikan penuh atas tugas dari mulai hingga verifikasi akhir.',
          'Jaga keandalan komitmen: sampaikan lebih awal bila ada hambatan.',
          'Terima masukan sebagai bahan pertumbuhan, bukan serangan pribadi.',
        ],
        diagramType: 'hierarchy',
        diagramNodes: ['Integritas & Kejujuran', 'Ownership Tugas', 'Komitmen Waktu', 'Respek Kolega'],
        captions: [
          { startSec: 0, endSec: 12, text: 'Keahlian teknis membuat Anda direkrut, tetapi etika kerja dan keandalan membuat Anda dipercaya tim.' },
          { startSec: 12, endSec: 25, text: 'Selalu laporkan risiko keterlambatan lebih awal disertai rencana mitigasi.' },
        ],
      },
      {
        id: 'jr3-ch-2',
        title: 'Bab 2: Self-Management & Productivity (Pengelolaan Diri)',
        startSec: 25,
        endSec: 50,
        competency: 'Penerapan Kasus',
        summary: 'Mengatur energi, prioritas harian, dan fokus bebas distraksi.',
        keyTakeaways: [
          'Kelompokkan tugas ke matriks penting vs mendesak setiap pagi.',
          'Gunakan blok waktu fokus (time-blocking) untuk pekerjaan analitis.',
          'Catat daftar tugas tertulis agar beban kognitif tetap ringan.',
        ],
        diagramType: 'chart',
        diagramNodes: ['Time-Blocking Fokus (Produktivitas Tinggi)', 'Multitasking Reaktif (Fragmentasi)'],
        captions: [
          { startSec: 25, endSec: 38, text: 'Sibuk membalas chat terus-menerus sering membuat pekerjaan inti tidak pernah tuntas.' },
          { startSec: 38, endSec: 50, text: 'Tetapkan 2–3 prioritas utama harian dan lindungi waktu fokus Anda.' },
        ],
      },
      {
        id: 'jr3-ch-3',
        title: 'Bab 3: Komunikasi Di Tempat Kerja',
        startSec: 50,
        endSec: 75,
        competency: 'Penerapan Kasus',
        summary: 'Menulis pesan asinkron jelas dan menyimak aktif saat diskusi tim.',
        keyTakeaways: [
          'Awali pesan dengan inti tujuan atau keputusan yang dibutuhkan.',
          'Hindari pesan menggantung ("Halo kak") tanpa konteks masalah.',
          'Konfirmasi ulang kesepakatan rapat dalam ringkasan tertulis singkat.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Konteks Singkat', 'Upaya yang Dicoba', 'Hambatan Spesifik', 'Ajuan Langkah'],
        captions: [
          { startSec: 50, endSec: 62, text: 'Komunikasi yang jelas menghargai waktu rekan kerja dan mengurangi bolak-balik tanya jawab.' },
          { startSec: 62, endSec: 75, text: 'Saat meminta bantuan, tunjukkan apa yang sudah Anda telusuri lebih dulu.' },
        ],
      },
      {
        id: 'jr3-ch-4',
        title: 'Bab 4: Kolaborasi Antar Divisi',
        startSec: 75,
        endSec: 100,
        competency: 'Konsep Dasar',
        summary: 'Menjembatani sudut pandang tim teknis, produk, desain, dan operasional.',
        keyTakeaways: [
          'Pahami tujuan bisnis divisi mitra sebelum membahas detail teknis.',
          'Sepakati ekspektasi serah terima dan jadwal sejak awal.',
          'Gunakan bahasa sederhana bebas jargon saat berdiskusi lintas fungsi.',
        ],
        diagramType: 'cycle',
        diagramNodes: ['Tim Produk / Bisnis', 'Tim Desain UX', 'Tim Engineering', 'Tim Operasional'],
        captions: [
          { startSec: 75, endSec: 88, text: 'Proyek gagal lebih sering terjadi di celah koordinasi antar divisi dibanding di baris kode.' },
          { startSec: 88, endSec: 100, text: 'Terjemahkan kendala teknis menjadi opsi solusi yang mudah diputuskan oleh mitra divisi lain.' },
        ],
      },
      {
        id: 'jr3-ch-5',
        title: 'Bab 5: Basic Problem Solving dan Critical Thinking',
        startSec: 100,
        endSec: 125,
        competency: 'Optimasi & Evaluasi',
        summary: 'Membedakan asumsi dengan fakta serta mencari akar penyebab masalah.',
        keyTakeaways: [
          'Gunakan teknik 5-Whys untuk menelusuri akar masalah sebelum bertindak.',
          'Evaluasi bukti dan data, bukan sekadar opini atau kebiasaan lama.',
          'Bandingkan minimal dua alternatif solusi beserta risikonya.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Definisikan Masalah', 'Cari Akar (5-Whys)', 'Bandingkan Opsi', 'Uji & Evaluasi'],
        captions: [
          { startSec: 100, endSec: 112, text: 'Critical thinking berarti berani memeriksa asumsi awal dengan data nyata.' },
          { startSec: 112, endSec: 125, text: 'Setelah menerapkan perbaikan, selalu ukur ulang apakah akar masalah benar-benar terselesaikan.' },
        ],
      },
    ],
    checkpoint: {
      triggerSec: 60,
      question:
        'Checkpoint Junior Softskill: Anda mengalami kebuntuan teknis selama 45 menit dan ingin bertanya ke senior lewat chat. Format pesan mana yang paling profesional?',
      options: [
        'Menjelaskan tujuan tugas, error yang muncul, 2 langkah yang sudah dicoba, serta dugaan penyebabnya dalam satu pesan ringkas',
        'Mengirim pesan "Mas, lagi sibuk ga?" lalu menunggu 1 jam',
        'Meminta senior langsung mengerjakan seluruh tugas Anda',
      ],
      correctIndex: 0,
      feedback:
        'Benar! Pesan terstruktur dengan konteks dan upaya awal mempercepat bantuan serta menunjukkan inisiatif belajar.',
    },
    postTest: [
      {
        id: 'jr3-post-1',
        prompt:
          'Seorang Junior menyadari fitur yang ia kerjakan membutuhkan 2 hari tambahan karena ada kompleksitas tak terduga. Perilaku yang mencerminkan Professional Mindset & Work Ethics adalah:',
        options: [
          'Segera memberi tahu Lead dengan rincian kendala serta usulan pemecahan prioritas agar jadwal tim tetap terkendali',
          'Menunggu sampai batas waktu lewat baru menjelaskan alasannya',
          'Melewatkan seluruh pengujian kualitas agar terlihat selesai tepat waktu',
          'Meminta rekan lain menanggung keterlambatannya diam-diam',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation:
          'Komunikasi proaktif terhadap risiko menjaga kepercayaan tim dan memberi ruang penyesuaian rencana.',
        relatedChapterIndex: 0,
      },
      {
        id: 'jr3-post-2',
        prompt:
          'Agar produktivitas pribadi tetap terjaga di tengah banyak undangan rapat dan pesan masuk, praktik Self-Management & Productivity yang tepat adalah:',
        options: [
          'Menetapkan prioritas harian berdasarkan dampak dan menjadwalkan blok waktu fokus khusus tanpa distraksi notifikasi',
          'Selalu langsung mengerjakan pesan paling baru yang masuk ke chat',
          'Menghindari mencatat daftar tugas agar kepala tidak penuh',
          'Mengerjakan lima tugas berat secara paralel di waktu bersamaan',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation:
          'Pemisahan waktu fokus dan pengurutan prioritas mencegah kelelahan dan fragmentasi kerja.',
        relatedChapterIndex: 1,
      },
      {
        id: 'jr3-post-3',
        prompt:
          'Setelah rapat sinkronisasi selesai, langkah Komunikasi Di Tempat Kerja yang mencegah miskomunikasi lanjutan adalah:',
        options: [
          'Menuliskan ringkasan keputusan, penanggung jawab (PIC), dan tenggat waktu di kanal tim bersama',
          'Mengandalkan ingatan masing-masing peserta rapat',
          'Menyimpan catatan rapat hanya di buku pribadi tanpa dibagikan',
          'Mengirim pesan suara berdurasi 15 menit tanpa ringkasan',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation:
          'Ringkasan tertulis menyamakan persepsi seluruh peserta rapat mengenai tindak lanjut nyata.',
        relatedChapterIndex: 2,
      },
      {
        id: 'jr3-post-4',
        prompt:
          'Tim Marketing meminta laporan data baru yang secara teknis membutuhkan query berat 3 hari kerja. Sikap Kolaborasi Antar Divisi terbaik adalah:',
        options: [
          'Menanyakan tujuan keputusan bisnisnya lalu menawarkan opsi data yang sudah tersedia cepat hari ini atau jadwal rilis bertahap',
          'Menolak langsung dengan berkata "Server tidak kuat, tidak bisa"',
          'Mengerjakan diam-diam tanpa menyepakati format yang sebenarnya dibutuhkan Marketing',
          'Mengirimkan dump database mentah yang sulit dibaca',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation:
          'Memahami kebutuhan di balik permintaan membuka jalan bagi solusi kolaboratif yang realistis.',
        relatedChapterIndex: 3,
      },
      {
        id: 'jr3-post-5',
        prompt:
          'Tingkat penyelesaian Video Learning di LMS turun 20% minggu ini. Pendekatan Basic Problem Solving dan Critical Thinking yang benar adalah:',
        options: [
          'Memeriksa data per bab video, durasi putus tonton, serta umpan balik peserta untuk menemukan akar penyebab sebelum mengubah fitur',
          'Langsung mengganti warna seluruh tombol aplikasi menjadi merah',
          'Menyimpulkan peserta malas tanpa memeriksa data log',
          'Menghapus seluruh video pembelajaran',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation:
          'Diagnosa berbasis bukti memastikan tindakan perbaikan menyentuh akar masalah yang tepat.',
        relatedChapterIndex: 4,
      },
    ],
  },

  // ==================== TRACK 3: MIDDLE ====================
  {
    id: 'frontend-state-arch',
    code: 'FE-201',
    title: 'Arsitektur Frontend & Manajemen State Modern',
    category: 'Rekayasa Perangkat Lunak',
    trackLevel: 'Middle',
    moduleOrderInTrack: 1,
    instructorName: 'Dr. Rarasati Kusuma',
    instructorRole: 'Lead Frontend Architect',
    instructorAvatar: INSTRUCTOR_AVATAR,
    coverImage: COVER_FRONTEND,
    syllabusDurationLabel: '45 Menit',
    videoDurationSec: 120,
    passingScore: 80,
    minWatchPercent: 80,
    description:
      'Pelajari cara memisahkan state lokal, state server, dan state URL secara disiplin untuk membangun aplikasi web berskala besar tanpa re-render berlebihan.',
    preTest: [
      {
        id: 'fe-pre-1',
        prompt:
          'Dalam arsitektur React modern, mengapa data hasil fetch API sebaiknya dikelola dengan server-state cache dibanding disimpan mentah di global store?',
        options: [
          'Server-state membutuhkan deduplikasi request, revalidasi latar belakang, dan manajemen cache stale-while-revalidate otomatis',
          'Global store seperti Context API tidak dapat menyimpan tipe data JSON bersarang',
          'Server-state hanya bisa diakses melalui localStorage browser',
          'Global store selalu menghapus state setiap kali pengguna menggulir halaman',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation:
          'Data dari server bersifat asinkron dan dapat basi (stale). Pustaka server-state menangani caching, deduplikasi, dan sinkronisasi latar belakang secara otomatis.',
        relatedChapterIndex: 0,
      },
      {
        id: 'fe-pre-2',
        prompt:
          'Sebuah dashboard menampilkan filter pencarian, halaman paginasi, dan urutan tabel. Di manakah posisi paling tepat untuk menyimpan ketiga state tersebut?',
        options: [
          'Di dalam sessionStorage agar hilang saat tab ditutup',
          'Di URL Query Parameters agar tautan dapat dibagikan dan tombol Back browser bekerja alami',
          'Di dalam variabel global window.filterState',
          'Di database backend setiap kali pengguna mengetik satu huruf',
        ],
        correctIndex: 1,
        competency: 'Penerapan Kasus',
        explanation:
          'Menyimpan state navigasi dan filter di URL Query Parameters membuat tampilan konsisten saat di-refresh atau dibagikan ke rekan kerja.',
        relatedChapterIndex: 1,
      },
      {
        id: 'fe-pre-3',
        prompt:
          'Apa risiko utama meletakkan seluruh state aplikasi (input form, tema UI, dan daftar notifikasi) ke dalam satu React Context tunggal?',
        options: [
          'Kode tidak dapat dikompilasi oleh TypeScript',
          'Setiap perubahan kecil pada satu field memicu re-render pada seluruh komponen konsumen Context tersebut',
          'Browser akan memblokir permintaan HTTP ke server',
          'Ukuran bundle CSS meningkat dua kali lipat',
        ],
        correctIndex: 1,
        competency: 'Optimasi & Evaluasi',
        explanation:
          'React Context merender ulang semua subscriber ketika nilai provider berubah. Memecah context atau menggunakan selector store mencegah cascade re-render.',
        relatedChapterIndex: 2,
      },
      {
        id: 'fe-pre-4',
        prompt:
          'Pendekatan "Derived State" (state turunan) menyarankan agar kita melakukan hal berikut:',
        options: [
          'Menyalin total harga ke useState baru setiap kali daftar item keranjang berubah',
          'Menghitung nilai turunan langsung saat render (atau memoize bila mahal) dari sumber kebenaran utama',
          'Menyimpan hasil perhitungan di cookie agar lebih aman',
          'Membuat API endpoint terpisah khusus untuk penjumlahan dua angka',
        ],
        correctIndex: 1,
        competency: 'Konsep Dasar',
        explanation:
          'Menghitung nilai turunan langsung dari state sumber menghindari ketidaksinkronan data (state drift) dan mengurangi efek samping useEffect.',
        relatedChapterIndex: 1,
      },
      {
        id: 'fe-pre-5',
        prompt:
          'Kapan penggunaan Optimistic UI Update paling tepat diterapkan?',
        options: [
          'Saat memproses pembayaran kartu kredit bernilai besar yang wajib menunggu verifikasi bank',
          'Saat melakukan aksi berfrekuensi tinggi seperti menyukai konten atau menandai item selesai agar UI terasa instan',
          'Saat pengguna mengunggah file video berukuran 2 GB',
          'Saat pengguna keluar dari akun (logout)',
        ],
        correctIndex: 1,
        competency: 'Penerapan Kasus',
        explanation:
          'Optimistic update memperbarui UI seketika sebelum server merespons, dengan mekanisme rollback otomatis apabila permintaan gagal.',
        relatedChapterIndex: 3,
      },
    ],
    chapters: [
      {
        id: 'fe-ch-1',
        title: 'Bab 1: Taksonomi State (Lokal, URL, Server)',
        startSec: 0,
        endSec: 30,
        competency: 'Konsep Dasar',
        summary: 'Membedakan sumber kebenaran (source of truth) sebelum memilih alat manajemen state.',
        keyTakeaways: [
          'State lokal cukup untuk interaksi komponen tunggal seperti modal terbuka atau input sementara.',
          'URL Search Params menyimpan state yang layak dibagikan atau di-bookmark.',
          'Server cache mengelola data jarak jauh dengan siklus fresh dan stale.',
        ],
        diagramType: 'hierarchy',
        diagramNodes: ['State Lokal (UI)', 'URL Query State', 'Client Global Store', 'Server Cache (Async)'],
        captions: [
          { startSec: 0, endSec: 10, text: 'Kesalahan paling umum di frontend adalah menaruh semua data ke satu global store.' },
          { startSec: 10, endSec: 20, text: 'Klasifikasikan state ke empat lapisan: Lokal, URL, Client Store, dan Server Cache.' },
          { startSec: 20, endSec: 30, text: 'Pemisahan ini langsung memangkas kompleksitas sinkronisasi hingga separuhnya.' },
        ],
      },
      {
        id: 'fe-ch-2',
        title: 'Bab 2: Derived State & URL Sebagai Kontrak Navigasi',
        startSec: 30,
        endSec: 60,
        competency: 'Penerapan Kasus',
        summary: 'Menghilangkan duplikasi state melalui nilai turunan dan sinkronisasi URL.',
        keyTakeaways: [
          'Jangan menduplikasi data yang bisa dihitung langsung dari state utama saat render.',
          'Gunakan URL query untuk filter tabel, tab aktif, dan nomor halaman.',
          'Hindari useEffect hanya untuk menyalin props ke state lokal.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Sumber State Tunggal', 'Kalkulasi Saat Render', 'Tampilan Konsisten', 'Zero State Drift'],
        captions: [
          { startSec: 30, endSec: 40, text: 'Setiap duplikasi state menciptakan peluang bug ketika salah satu gagal diperbarui.' },
          { startSec: 40, endSec: 50, text: 'Hitung total, filter, atau badge status langsung dari sumber data utama saat render.' },
          { startSec: 50, endSec: 60, text: 'Sinkronkan filter ke URL agar tombol Back dan reload browser tetap presisi.' },
        ],
      },
      {
        id: 'fe-ch-3',
        title: 'Bab 3: Mengendalikan Re-Render & Selector Granular',
        startSec: 60,
        endSec: 90,
        competency: 'Optimasi & Evaluasi',
        summary: 'Mencegah cascade re-render dengan pemecahan konteks dan selector atomik.',
        keyTakeaways: [
          'Pisahkan state yang sering berubah (input) dari state stabil (tema/user).',
          'Gunakan selector agar komponen hanya berlangganan field yang benar-benar dibaca.',
          'Colocate state sedekat mungkin dengan komponen yang membutuhkannya.',
        ],
        diagramType: 'chart',
        diagramNodes: ['Context Monolitik (84 re-render)', 'Selector Granular (6 re-render)', 'Colocated State (2 re-render)'],
        captions: [
          { startSec: 60, endSec: 70, text: 'Context tunggal yang membungkus akar aplikasi membuat setiap ketikan merender ulang seluruh halaman.' },
          { startSec: 70, endSec: 80, text: 'Dengan selector granular, hanya komponen yang membaca nilai berubah yang diperbarui.' },
          { startSec: 80, endSec: 90, text: 'Taruh state sedekat mungkin dengan daun komponen untuk performa terbaik.' },
        ],
      },
      {
        id: 'fe-ch-4',
        title: 'Bab 4: Optimistic UI & Pola Rollback Aman',
        startSec: 90,
        endSec: 120,
        competency: 'Penerapan Kasus',
        summary: 'Merancang umpan balik instan dengan jaminan pemulihan saat jaringan gagal.',
        keyTakeaways: [
          'Simpan snapshot state sebelumnya sebelum menerapkan perubahan optimistik.',
          'Lakukan rollback otomatis dan beri notifikasi jelas jika mutasi server gagal.',
          'Batasi optimistic update untuk aksi idempoten atau berisiko rendah.',
        ],
        diagramType: 'cycle',
        diagramNodes: ['Aksi User', 'Snapshot & Update UI', 'Request API Async', 'Konfirmasi / Rollback'],
        captions: [
          { startSec: 90, endSec: 100, text: 'Pengguna mengharapkan respons antarmuka di bawah 100 milidetik untuk aksi rutin.' },
          { startSec: 100, endSec: 110, text: 'Simpan snapshot cache sebelum memperbarui UI secara optimistik.' },
          { startSec: 110, endSec: 120, text: 'Jika server mengembalikan galat, kembalikan snapshot dan tampilkan opsi coba lagi.' },
        ],
      },
    ],
    checkpoint: {
      triggerSec: 60,
      question:
        'Checkpoint Tengah Video: Manakah strategi paling aman untuk menghindari state yang tidak sinkron (state drift) saat menghitung rata-rata nilai dari array daftar tugas?',
      options: [
        'Menghitung rata-rata langsung selama fase render dari array daftar tugas yang ada',
        'Membuat state baru averageScore dan memperbaruinya lewat useEffect terpisah',
        'Menyimpan averageScore secara manual di sessionStorage',
      ],
      correctIndex: 0,
      feedback:
        'Tepat! Menghitung rata-rata sebagai derived value langsung saat render memastikan angka selalu selaras dengan array tugas terbaru.',
    },
    postTest: [
      {
        id: 'fe-post-1',
        prompt:
          'Seorang engineer menyimpan daftar produk dari API ke Redux tanpa mekanisme stale-time atau deduplikasi. Masalah apa yang paling sering muncul?',
        options: [
          'Permintaan jaringan berulang yang tidak perlu dan data di layar tertinggal dari perubahan server',
          'Browser otomatis menolak merender elemen HTML tabel',
          'CSS Tailwind tidak dapat diterapkan pada komponen daftar produk',
          'TypeScript menghapus seluruh tipe antarmuka saat build',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation:
          'Tanpa manajemen server-state (deduplikasi & revalidasi), aplikasi rentan melakukan fetch ganda dan menampilkan data yang sudah kedaluwarsa.',
        relatedChapterIndex: 0,
      },
      {
        id: 'fe-post-2',
        prompt:
          'Ketika pengguna menyalin tautan halaman katalog yang sudah difilter kategori "Audio" dan halaman "3" lalu mengirimkannya ke rekan tim, mekanisme apa yang membuat rekan tim melihat hasil yang sama persis?',
        options: [
          'Menyimpan filter di useState lokal di dalam komponen FilterBar',
          'Menyimpan filter kategori dan halaman di URL Query Parameters (?kategori=audio&page=3)',
          'Menyimpan filter di memori sementara variabel JavaScript',
          'Menggunakan animasi transisi CSS',
        ],
        correctIndex: 1,
        competency: 'Penerapan Kasus',
        explanation:
          'URL Query Parameters bertindak sebagai kontrak navigasi yang portabel, mudah dibagikan, dan bertahan saat halaman dimuat ulang.',
        relatedChapterIndex: 1,
      },
      {
        id: 'fe-post-3',
        prompt:
          'Sebuah aplikasi mengalami lag saat pengguna mengetik di kolom pencarian header karena SearchContext dipakai oleh seluruh kartu produk. Solusi arsitektural paling efektif adalah:',
        options: [
          'Memindahkan nilai input pencarian ke state lokal kolom input atau menggunakan debounce + selector terisolasi',
          'Menambahkan lebih banyak Context wrapper di sekitar root aplikasi',
          'Menonaktifkan strict mode React di produksi',
          'Mengubah seluruh komponen menjadi class component lama',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation:
          'Mengisolasi state input yang berubah cepat (state colocation) mencegah komponen lain ikut merender ulang pada setiap ketikan.',
        relatedChapterIndex: 2,
      },
      {
        id: 'fe-post-4',
        prompt:
          'Mengapa menyimpan "jumlahItem" di state terpisah padahal sudah ada array "daftarItem" dianggap anti-pattern?',
        options: [
          'Karena array JavaScript tidak memiliki properti .length',
          'Karena jumlahItem adalah derived state yang rawan tidak sinkron jika salah satu operasi lupa memperbaruinya',
          'Karena angka integer memakai memori lebih besar daripada array objek',
          'Karena React melarang penggunaan dua useState dalam satu komponen',
        ],
        correctIndex: 1,
        competency: 'Konsep Dasar',
        explanation:
          'Satu sumber kebenaran (daftarItem.length) jauh lebih bersih dan menjamin nol inkonsistensi data.',
        relatedChapterIndex: 1,
      },
      {
        id: 'fe-post-5',
        prompt:
          'Dalam implementasi Optimistic UI pada tombol "Simpan ke Favorit", langkah wajib yang harus disiapkan sebelum mengirim request mutasi ke server adalah:',
        options: [
          'Menghapus seluruh cache browser pengguna',
          'Mengambil snapshot state sebelumnya agar bisa dilakukan rollback bila request gagal',
          'Memaksa halaman reload penuh setelah 500ms',
          'Menyembunyikan tombol favorit secara permanen',
        ],
        correctIndex: 1,
        competency: 'Penerapan Kasus',
        explanation:
          'Snapshot sebelum mutasi memungkinkan sistem mengembalikan antarmuka ke kondisi akurat apabila server mengembalikan galat.',
        relatedChapterIndex: 3,
      },
    ],
  },
  {
    id: 'middle-api-contracts',
    code: 'AR-205',
    title: 'Perancangan Kontrak API, Idempotensi & Paginasi Skala Produksi',
    category: 'Rekayasa Perangkat Lunak',
    trackLevel: 'Middle',
    moduleOrderInTrack: 2,
    instructorName: 'Dimas Wijaya',
    instructorRole: 'Staff Backend Engineer',
    instructorAvatar: INSTRUCTOR_AVATAR,
    coverImage: COVER_ANALYTICS,
    syllabusDurationLabel: '50 Menit',
    videoDurationSec: 120,
    passingScore: 80,
    minWatchPercent: 80,
    description:
      'Merancang endpoint backend yang tahan retry jaringan, menggunakan cursor pagination stabil, serta menyusun kontrak error yang mudah ditangani klien.',
    preTest: [
      {
        id: 'ar-pre-1',
        prompt: 'Apa keuntungan utama Cursor Pagination dibanding Offset Pagination (LIMIT/OFFSET) pada tabel jutaan baris?',
        options: [
          'Performa query stabil konstan dan tidak menghasilkan item ganda saat ada data baru masuk di tengah proses gulir',
          'Cursor pagination tidak membutuhkan indeks database',
          'Offset pagination tidak didukung oleh PostgreSQL',
          'Cursor pagination otomatis mengompresi gambar',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Offset memindai dan membuang baris sebelumnya; cursor melompat langsung lewat indeks.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ar-pre-2',
        prompt: 'Bagaimana mekanisme Idempotency-Key mencegah pengumpulan ujian ganda saat pengguna menekan tombol Submit dua kali?',
        options: [
          'Server menyimpan hasil respons kunci unik pertama dan mengembalikan respons yang sama pada request duplikat',
          'Server menghapus akun pengguna sementara',
          'Browser memblokir seluruh koneksi HTTPS',
          'Database mematikan seluruh tabel selama 10 detik',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Idempotency-Key menjamin efek samping mutasi hanya terjadi tepat satu kali.',
        relatedChapterIndex: 1,
      },
      {
        id: 'ar-pre-3',
        prompt: 'Mengapa kode status HTTP 422 atau 400 lebih tepat dibanding 200 OK dengan field { error: true } saat validasi input gagal?',
        options: [
          'Memudahkan klien, gateway, dan alat observability membedakan keberhasilan dan kegagalan secara standar',
          'Kode 400 mempercepat kecepatan CPU dua kali lipat',
          'Kode 200 tidak bisa mengembalikan JSON',
          'Browser hanya mengizinkan JSON pada status 500',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Semantik status HTTP standar membuat retry logic dan monitoring error bekerja otomatis.',
        relatedChapterIndex: 2,
      },
      {
        id: 'ar-pre-4',
        prompt: 'Bagaimana cara melakukan perubahan kontrak API yang aman tanpa memutus klien aplikasi versi lama?',
        options: [
          'Lakukan perubahan aditif (tambah field opsional) atau terapkan API versioning (/v2/) dengan masa transisi',
          'Langsung mengganti nama seluruh field di /v1/ tanpa pemberitahuan',
          'Menghapus seluruh field respons dan menggantinya dengan teks polos',
          'Memaksa pengguna menginstal ulang sistem operasi',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Backward compatibility menjaga integrasi antar layanan tetap berjalan mulus selama rilis.',
        relatedChapterIndex: 3,
      },
      {
        id: 'ar-pre-5',
        prompt: 'Pada kondisi kegagalan sementara (503 Service Unavailable), strategi retry klien yang aman adalah:',
        options: [
          'Exponential backoff ditambah jitter acak dengan batas maksimal percobaan',
          'Retry terus-menerus dalam loop tanpa jeda (while true)',
          'Tidak pernah menangani error jaringan',
          'Mengirim ulang 100 request paralel sekaligus',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Backoff + jitter mencegah thundering herd yang memperparah beban server yang sedang pulih.',
        relatedChapterIndex: 1,
      },
    ],
    chapters: [
      {
        id: 'ar-ch-1',
        title: 'Bab 1: Cursor vs Offset Pagination',
        startSec: 0,
        endSec: 30,
        competency: 'Konsep Dasar',
        summary: 'Menjaga kecepatan query daftar riwayat ujian tetap konstan pada data besar.',
        keyTakeaways: [
          'Offset tinggi memperlambat database karena memindai baris yang dibuang.',
          'Keyset/cursor pagination memakai indeks unik untuk pembacaan O(1).',
        ],
        diagramType: 'chart',
        diagramNodes: ['Cursor Page 1000 (12ms)', 'Offset Page 1000 (840ms)'],
        captions: [
          { startSec: 0, endSec: 15, text: 'Offset pagination melambat drastis seiring bertambahnya nomor halaman.' },
          { startSec: 15, endSec: 30, text: 'Gunakan keyset cursor berbasis timestamp dan ID agar guliran data selalu konsisten.' },
        ],
      },
      {
        id: 'ar-ch-2',
        title: 'Bab 2: Desain Mutasi Idempoten & Exponential Backoff',
        startSec: 30,
        endSec: 60,
        competency: 'Penerapan Kasus',
        summary: 'Melindungi pengiriman skor dan transaksi dari duplikasi jaringan.',
        keyTakeaways: [
          'Sertakan Idempotency-Key UUID pada header request mutasi penting.',
          'Gunakan exponential backoff + jitter saat melakukan retry.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Header UUID', 'Cek Cache Kunci', 'Proses 1x Saja', 'Respons Konsisten'],
        captions: [
          { startSec: 30, endSec: 45, text: 'Jaringan seluler sering memicu retry otomatis ketika respons terlambat diterima.' },
          { startSec: 45, endSec: 60, text: 'Idempotency-Key memastikan nilai ujian tidak tersimpan ganda di server.' },
        ],
      },
      {
        id: 'ar-ch-3',
        title: 'Bab 3: Kontrak Error Terstruktur & Status HTTP',
        startSec: 60,
        endSec: 90,
        competency: 'Konsep Dasar',
        summary: 'Format error konsisten mempermudah penanganan UI dan debugging.',
        keyTakeaways: [
          'Gunakan status 4xx untuk kesalahan klien dan 5xx untuk kesalahan server.',
          'Kembalikan kode error stabil (mis. VIDEO_QUOTA_NOT_MET) bukan hanya pesan bebas.',
        ],
        diagramType: 'hierarchy',
        diagramNodes: ['HTTP Status 403/422', 'Machine Error Code', 'Pesan Ramah Pengguna'],
        captions: [
          { startSec: 60, endSec: 75, text: 'Jangan membungkus kegagalan validasi di dalam respons HTTP 200 OK.' },
          { startSec: 75, endSec: 90, text: 'Kode error terstruktur memungkinkan frontend merender pesan bantuan yang tepat.' },
        ],
      },
      {
        id: 'ar-ch-4',
        title: 'Bab 4: Evolusi Kontrak & Backward Compatibility',
        startSec: 90,
        endSec: 120,
        competency: 'Optimasi & Evaluasi',
        summary: 'Mengembangkan API tanpa merusak klien web dan mobile yang sudah terpasang.',
        keyTakeaways: [
          'Utamakan perubahan aditif sebelum menghapus field lama.',
          'Sediakan header deprecation dan masa transisi yang jelas.',
        ],
        diagramType: 'cycle',
        diagramNodes: ['Tambah Field Baru', 'Dual-Write Transisi', 'Pantau Klien Lama', 'Sunset Aman'],
        captions: [
          { startSec: 90, endSec: 105, text: 'Aplikasi mobile pengguna tidak selalu diperbarui di hari yang sama dengan server.' },
          { startSec: 105, endSec: 120, text: 'Terapkan pola expand-and-contract saat memodifikasi struktur JSON respons.' },
        ],
      },
    ],
    checkpoint: {
      triggerSec: 60,
      question: 'Checkpoint Middle: Mengapa retry klien wajib memakai jitter (jeda acak) bersama exponential backoff?',
      options: [
        'Untuk mencegah ribuan klien menembak server secara serentak pada detik yang sama (thundering herd)',
        'Agar browser mengganti alamat IP otomatis',
        'Supaya server membatalkan semua transaksi sebelumnya',
      ],
      correctIndex: 0,
      feedback: 'Tepat! Jitter menyebar gelombang retry agar server sempat pulih stabil.',
    },
    postTest: [
      {
        id: 'ar-post-1',
        prompt: 'Pada tabel riwayat nilai ujian berisi 5 juta baris, jenis paginasi apa yang menjaga latensi tetap rendah di halaman jauh?',
        options: [
          'Cursor / Keyset Pagination berbasis kolom terindeks',
          'OFFSET 4900000 LIMIT 20',
          'Mengirim seluruh 5 juta baris ke browser dalam satu JSON',
          'Menggunakan ORDER BY RANDOM()',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Keyset pagination melompat langsung ke posisi indeks terakhir tanpa menghitung ulang baris sebelumnya.',
        relatedChapterIndex: 0,
      },
      {
        id: 'ar-post-2',
        prompt: 'Peserta mengirim jawaban Post-Test dari kereta dengan sinyal putus-nyambung sehingga request terkirim 3 kali dengan Idempotency-Key sama. Apa perilaku server yang benar?',
        options: [
          'Memproses submit pertama kali saja, lalu mengembalikan hasil yang sama pada dua request berikutnya',
          'Menyimpan 3 baris percobaan Post-Test identik ke database',
          'Menghapus akun peserta',
          'Mengembalikan skor 0 pada percobaan ketiga',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Idempotensi memastikan satu aksi pengguna menghasilkan tepat satu perubahan state.',
        relatedChapterIndex: 1,
      },
      {
        id: 'ar-post-3',
        prompt: 'Manakah desain respons API terbaik saat peserta mencoba membuka Post-Test sebelum menonton 80% video?',
        options: [
          'HTTP 403 dengan kode terstruktur { code: "VIDEO_WATCH_THRESHOLD_NOT_MET", currentPct: 45, requiredPct: 80 }',
          'HTTP 200 dengan teks HTML halaman login',
          'HTTP 500 Internal Server Error tanpa body',
          'Membiarkan koneksi timeout selama 60 detik',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Status 403 dan payload kode mesin memberi sinyal jelas bagi antarmuka untuk menampilkan panduan.',
        relatedChapterIndex: 2,
      },
      {
        id: 'ar-post-4',
        prompt: 'Dalam pola Expand-and-Contract untuk mengganti nama field API dari "score" ke "finalScore", langkah pertamanya adalah:',
        options: [
          'Mengirimkan kedua field ("score" dan "finalScore") secara bersamaan sampai seluruh klien selesai bermigrasi',
          'Langsung menghapus field "score" di hari yang sama',
          'Mengubah seluruh tipe angka menjadi array',
          'Mematikan dokumentasi OpenAPI',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Fase expand menjaga kompatibilitas ke belakang sebelum field lama dihentikan.',
        relatedChapterIndex: 3,
      },
      {
        id: 'ar-post-5',
        prompt: 'Mengapa klien tidak boleh melakukan retry otomatis pada error HTTP 400 Bad Request?',
        options: [
          'Karena payload permintaan cacat sehingga mengulanginya tidak akan mengubah hasil dan hanya membuang sumber daya',
          'Karena kode 400 berarti koneksi berhasil',
          'Karena protokol TCP melarang ulang 400',
          'Karena 400 hanya terjadi saat baterai habis',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Retry hanya masuk akal untuk error transien (429/502/503/timeout), bukan error validasi permanen.',
        relatedChapterIndex: 1,
      },
    ],
  },

  // ==================== TRACK 4: SENIOR ====================
  {
    id: 'senior-distributed-systems',
    code: 'LD-401',
    title: 'Desain Sistem Terdistribusi & Reliabilitas Skala Besar',
    category: 'Arsitektur & Kepemimpinan',
    trackLevel: 'Senior',
    moduleOrderInTrack: 1,
    instructorName: 'Dimas Wijaya',
    instructorRole: 'Principal Systems Architect',
    instructorAvatar: INSTRUCTOR_AVATAR,
    coverImage: COVER_FRONTEND,
    syllabusDurationLabel: '55 Menit',
    videoDurationSec: 120,
    passingScore: 85,
    minWatchPercent: 80,
    description:
      'Merancang platform yang bertahan saat lonjakan trafik ujian serentak, isolasi kegagalan (bulkhead & circuit breaker), serta strategi caching berlapis.',
    preTest: [
      {
        id: 'sr1-pre-1',
        prompt: 'Saat 50.000 peserta membuka ujian Post-Test secara serentak pada menit yang sama, pola apa yang mencegah database utama lumpuh akibat query soal identik berulang?',
        options: [
          'Read-through CDN/Redis cache untuk naskah soal statis disertai request coalescing',
          'Memindahkan seluruh database ke file CSV tunggal',
          'Menonaktifkan koneksi HTTPS agar lebih cepat',
          'Menambah jumlah kolom pada tabel pengguna',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Caching naskah soal di lapisan tepi/in-memory dan penggabungan request identik melindungi database primer.',
        relatedChapterIndex: 0,
      },
      {
        id: 'sr1-pre-2',
        prompt: 'Apa fungsi pola Circuit Breaker ketika layanan pencetak PDF sertifikat mengalami timeout berkelanjutan?',
        options: [
          'Memutus panggilan ke layanan bermasalah sementara (fail-fast) agar thread aplikasi utama tetap sehat untuk fitur ujian',
          'Menghapus seluruh sertifikat lama',
          'Mematikan server database utama',
          'Mengubah seluruh kuis menjadi video',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Circuit Breaker mengisolasi kegagalan dependensi agar tidak menjatuhkan keseluruhan sistem.',
        relatedChapterIndex: 1,
      },
      {
        id: 'sr1-pre-3',
        prompt: 'Dalam arsitektur event-driven, mengapa pola Transactional Outbox penting saat menyimpan skor kelulusan sekaligus memicu penerbitan sertifikat?',
        options: [
          'Menjamin penulisan ke database dan publikasi event ke message broker terjadi secara atomik tanpa dual-write problem',
          'Menghapus kebutuhan akan database relasional',
          'Mempercepat ukuran gambar avatar',
          'Memungkinkan frontend terhubung langsung ke broker internal',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Outbox table memastikan event pasti terkirim meskipun broker sempat terputus tepat setelah commit DB.',
        relatedChapterIndex: 2,
      },
      {
        id: 'sr1-pre-4',
        prompt: 'Apa perbedaan utama antara Bulkhead Pattern dan Rate Limiting?',
        options: [
          'Bulkhead mempartisi kolam sumber daya internal antar-fitur, sedangkan Rate Limiting membatasi laju request dari klien eksternal',
          'Keduanya hanya berlaku pada CSS Grid',
          'Rate limiting selalu mematikan server setiap malam',
          'Bulkhead hanya dipakai untuk aplikasi offline',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Bulkhead mencegah satu fitur lambat menghabiskan seluruh thread pool layanan lain.',
        relatedChapterIndex: 1,
      },
      {
        id: 'sr1-pre-5',
        prompt: 'Mengapa Service Level Objective (SLO) lebih sering diukur menggunakan persentil P99 daripada rata-rata latensi?',
        options: [
          'P99 menangkap pengalaman terburuk yang memengaruhi pengguna paling aktif dan sensitif terhadap kegagalan',
          'Rata-rata selalu bernilai nol',
          'P99 lebih mudah dipalsukan',
          'Monitor browser tidak mendukung angka desimal',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Latensi rata-rata bisa tampak bagus padahal 5% pengguna mengalami timeout.',
        relatedChapterIndex: 3,
      },
    ],
    chapters: [
      {
        id: 'sr1-ch-1',
        title: 'Bab 1: Menahan Lonjakan Trafik & Cache Coalescing',
        startSec: 0,
        endSec: 30,
        competency: 'Konsep Dasar',
        summary: 'Melindungi basis data primer dari thundering herd ujian serentak.',
        keyTakeaways: [
          'Pisahkan beban baca materi (cacheable) dari beban tulis submit skor.',
          'Gunakan singleflight / request coalescing saat cache kedaluwarsa.',
        ],
        diagramType: 'hierarchy',
        diagramNodes: ['Edge CDN / Cache', 'Singleflight Coalescer', 'Queue Submit Async', 'Primary DB'],
        captions: [
          { startSec: 0, endSec: 15, text: 'Beban baca soal ujian dapat dilayani 99% dari cache terdistribusi.' },
          { startSec: 15, endSec: 30, text: 'Request coalescing mencegah seribu cache-miss menembus database bersamaan.' },
        ],
      },
      {
        id: 'sr1-ch-2',
        title: 'Bab 2: Circuit Breaker & Bulkhead Isolation',
        startSec: 30,
        endSec: 60,
        competency: 'Penerapan Kasus',
        summary: 'Mencegah kegagalan berantai melalui degradasi anggun (graceful degradation).',
        keyTakeaways: [
          'Pisahkan thread/connection pool fitur kritikal dari fitur sekunder.',
          'Fail-fast lebih sehat daripada membiarkan request menumpuk menunggu timeout.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Closed (Normal)', 'Threshold Gagal', 'Open (Fail-Fast)', 'Half-Open Probe'],
        captions: [
          { startSec: 30, endSec: 45, text: 'Fitur pencetak sertifikat yang lambat tidak boleh melumpuhkan proses submit ujian.' },
          { startSec: 45, endSec: 60, text: 'Circuit breaker memutus aliran sementara lalu menguji pemulihan secara bertahap.' },
        ],
      },
      {
        id: 'sr1-ch-3',
        title: 'Bab 3: Konsistensi Event-Driven & Transactional Outbox',
        startSec: 60,
        endSec: 90,
        competency: 'Optimasi & Evaluasi',
        summary: 'Menghindari inkonsistensi dual-write antara database dan antrean event.',
        keyTakeaways: [
          'Simpan state bisnis dan catatan event dalam satu transaksi DB lokal.',
          'Relay worker menerbitkan event secara at-least-once dengan konsumen idempoten.',
        ],
        diagramType: 'cycle',
        diagramNodes: ['Transaksi DB + Outbox', 'Relay Publisher', 'Message Broker', 'Consumer Idempoten'],
        captions: [
          { startSec: 60, endSec: 75, text: 'Menulis ke DB lalu mengirim ke Kafka dalam dua langkah terpisah rawan kehilangan event.' },
          { startSec: 75, endSec: 90, text: 'Pola Outbox menjamin event kelulusan pasti terkirim begitu transaksi DB commit.' },
        ],
      },
      {
        id: 'sr1-ch-4',
        title: 'Bab 4: Observability, Tail Latency (P99) & Error Budget',
        startSec: 90,
        endSec: 120,
        competency: 'Optimasi & Evaluasi',
        summary: 'Mengelola reliabilitas sebagai keputusan teknik berbasis angka.',
        keyTakeaways: [
          'Pantau P50, P95, dan P99 secara bersamaan pada setiap jalur kritis.',
          'Gunakan Error Budget untuk menyeimbangkan kecepatan rilis dan stabilitas.',
        ],
        diagramType: 'chart',
        diagramNodes: ['P50: 28ms', 'P95: 95ms', 'P99: 420ms (Target <500ms)'],
        captions: [
          { startSec: 90, endSec: 105, text: 'Rata-rata latensi menyembunyikan pengalaman buruk pengguna di ekor distribusi.' },
          { startSec: 105, endSec: 120, text: 'Error budget memberi kerangka objektif kapan fokus ke fitur dan kapan fokus ke reliabilitas.' },
        ],
      },
    ],
    checkpoint: {
      triggerSec: 60,
      question: 'Checkpoint Senior: Apa risiko utama pola dual-write (commit DB lalu publish ke broker tanpa outbox)?',
      options: [
        'Broker bisa gagal menerima pesan setelah DB commit, sehingga sistem hilir tidak pernah tahu peserta sudah lulus',
        'Database akan otomatis menghapus tabel pengguna',
        'CPU server berhenti mengeksekusi JavaScript',
      ],
      correctIndex: 0,
      feedback: 'Tepat! Transactional Outbox menyelesaikan celah dual-write tersebut secara atomik.',
    },
    postTest: [
      {
        id: 'sr1-post-1',
        prompt: 'Ketika TTL cache soal ujian habis tepat saat 10.000 peserta membuka halaman secara serentak (cache stampede), mekanisme apa yang mencegah 10.000 query masuk ke DB?',
        options: [
          'Singleflight / Request Coalescing sehingga hanya 1 query menuju DB dan hasilnya dibagikan ke seluruh pemanggil',
          'Menghapus indeks tabel soal',
          'Memaksa setiap peserta mengunduh database penuh',
          'Menonaktifkan cache sepenuhnya',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Singleflight menggabungkan permintaan cache-miss paralel menjadi satu panggilan ke sumber data.',
        relatedChapterIndex: 0,
      },
      {
        id: 'sr1-post-2',
        prompt: 'Layanan pengiriman email notifikasi sedang down. Agar peserta tetap dapat mengerjakan ujian dan video tanpa melambat, arsitektur terbaik adalah:',
        options: [
          'Memisahkan proses email ke antrean asinkron dengan Circuit Breaker sehingga jalur ujian tetap responsif',
          'Memblokir login seluruh peserta hingga server email pulih',
          'Menambah retry sinkron 30 detik di dalam request login',
          'Menghapus seluruh modul video',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Isolasi dependensi non-kritikal menjaga ketersediaan jalur inti platform.',
        relatedChapterIndex: 1,
      },
      {
        id: 'sr1-post-3',
        prompt: 'Penerima pesan (consumer) pada pola Transactional Outbox wajib bersifat idempoten karena:',
        options: [
          'Relay outbox menjamin pengiriman at-least-once sehingga pesan yang sama berpotensi terkirim lebih dari satu kali',
          'Database relasional tidak mendukung primary key',
          'Browser mengirim pesan MQTT langsung ke database',
          'Consumer hanya berjalan satu kali setahun',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'At-least-once delivery + idempotent consumer memberikan ekuivalen pemrosesan tepat satu kali.',
        relatedChapterIndex: 2,
      },
      {
        id: 'sr1-post-4',
        prompt: 'Mengapa memisahkan connection pool database untuk analitik laporan berat dan transaksi ujian harian (Bulkhead) sangat krusial?',
        options: [
          'Agar query analitik yang lambat tidak menghabiskan seluruh koneksi dan menghentikan peserta yang sedang ujian',
          'Agar laporan CSV memiliki lebih banyak kolom',
          'Untuk mengubah tipe data integer menjadi string',
          'Supaya server tidak memerlukan autentikasi',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Bulkhead memastikan kegagalan/kelambatan satu workload tidak mencekik workload lainnya.',
        relatedChapterIndex: 1,
      },
      {
        id: 'sr1-post-5',
        prompt: 'Jika Error Budget bulanan layanan LMS sudah habis terpakai di minggu kedua, keputusan engineering yang tepat adalah:',
        options: [
          'Membekukan rilis fitur baru berisiko tinggi dan memprioritaskan perbaikan stabilitas serta observabilitas',
          'Menghapus seluruh alert monitoring agar error tidak terlihat',
          'Mempercepat rilis eksperimen tanpa pengujian',
          'Mengubah angka SLO menjadi 10% agar selalu tercapai',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Error budget menyelaraskan prioritas tim produk dan engineering secara objektif.',
        relatedChapterIndex: 3,
      },
    ],
  },
  {
    id: 'senior-tech-leadership',
    code: 'LD-402',
    title: 'Kepemimpinan Teknis, ADR & Audit Dampak Bisnis',
    category: 'Arsitektur & Kepemimpinan',
    trackLevel: 'Senior',
    moduleOrderInTrack: 2,
    instructorName: 'Bagas Prakoso, M.Sc.',
    instructorRole: 'VP of Engineering & Strategy',
    instructorAvatar: INSTRUCTOR_AVATAR,
    coverImage: COVER_UI,
    syllabusDurationLabel: '55 Menit',
    videoDurationSec: 120,
    passingScore: 85,
    minWatchPercent: 80,
    description:
      'Menulis Architecture Decision Record (ADR) yang tajam, mengevaluasi biaya kepemilikan jangka panjang (TCO), dan menyelaraskan metrik teknis dengan dampak organisasi.',
    preTest: [
      {
        id: 'sr2-pre-1',
        prompt: 'Apa elemen paling krusial di dalam sebuah Architecture Decision Record (ADR) selain keputusan yang dipilih?',
        options: [
          'Konteks masalah, opsi alternatif yang dipertimbangkan, serta konsekuensi/trade-off yang diterima tim',
          'Daftar seluruh nama library CSS yang pernah ada',
          'Screenshot kode sepanjang 500 baris',
          'Jadwal libur tim selama satu tahun',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'ADR merekam alasan dan kompromi di balik keputusan agar tim di masa depan tidak mengulang perdebatan buta.',
        relatedChapterIndex: 0,
      },
      {
        id: 'sr2-pre-2',
        prompt: 'Kapan seorang Senior Engineer sebaiknya memilih teknologi yang sudah matang dan membosankan dibanding framework eksperimental terbaru?',
        options: [
          'Saat stabilitas operasional, ketersediaan talenta, dan biaya pemeliharaan 3–5 tahun ke depan menjadi prioritas bisnis',
          'Setiap saat tanpa pernah mengevaluasi kebutuhan domain',
          'Hanya ketika tim ingin memperlambat produk',
          'Ketika aplikasi tidak memiliki pengguna',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Innovation token dihemat untuk diferensiasi produk inti, bukan infrastruktur generik.',
        relatedChapterIndex: 1,
      },
      {
        id: 'sr2-pre-3',
        prompt: 'Dalam mengevaluasi inisiatif LMS internal, metrik mana yang paling kuat membuktikan dampak terhadap bisnis?',
        options: [
          'Penurunan waktu onboarding karyawan baru hingga produktif + kenaikan N-Gain kompetensi kerja nyata',
          'Jumlah baris kode yang ditulis oleh tim LMS',
          'Jumlah warna gradien pada halaman depan',
          'Total klik tombol menu dalam sehari',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Dampak organisasi diukur dari percepatan kapabilitas nyata, bukan sekadar output fitur.',
        relatedChapterIndex: 2,
      },
      {
        id: 'sr2-pre-4',
        prompt: 'Apa risiko organisasi apabila hanya satu Senior Engineer yang memahami cara kerja modul inti ujian?',
        options: [
          'Bus factor bernilai 1 yang menciptakan bottleneck review, kelelahan individu, dan risiko operasional tinggi',
          'Kecepatan server meningkat drastis',
          'Biaya cloud otomatis turun menjadi nol',
          'Kode menjadi lebih pendek',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Senior bertugas melipatgandakan kapasitas tim lewat dokumentasi, pairing, dan penyederhanaan desain.',
        relatedChapterIndex: 3,
      },
      {
        id: 'sr2-pre-5',
        prompt: 'Mengapa menghitung Total Cost of Ownership (TCO) lebih akurat daripada hanya membandingkan harga lisensi software?',
        options: [
          'Karena biaya terbesar sering berasal dari jam rekayasa integrasi, pemeliharaan, pelatihan, dan beban operasional jangka panjang',
          'Karena lisensi software selalu gratis',
          'Karena TCO hanya menghitung biaya listrik monitor',
          'Karena biaya cloud tidak bisa diukur',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Evaluasi Build vs Buy wajib memperhitungkan biaya pemeliharaan berkelanjutan.',
        relatedChapterIndex: 1,
      },
    ],
    chapters: [
      {
        id: 'sr2-ch-1',
        title: 'Bab 1: Menulis Architecture Decision Record (ADR) Efektif',
        startSec: 0,
        endSec: 30,
        competency: 'Konsep Dasar',
        summary: 'Mengubah perdebatan arsitektur panjang menjadi keputusan terdokumentasi yang jelas.',
        keyTakeaways: [
          'Nyatakan konteks, alternatif, keputusan, dan risiko yang disadari.',
          'ADR bersifat immutable; keputusan baru membuat ADR penerus.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Konteks & Kendala', 'Opsi A vs Opsi B', 'Keputusan ADR', 'Konsekuensi Tim'],
        captions: [
          { startSec: 0, endSec: 15, text: 'Tanpa ADR, tim baru sering mempertanyakan ulang keputusan lama tanpa tahu kendalanya.' },
          { startSec: 15, endSec: 30, text: 'Satu halaman ADR yang tajam menyelaraskan skuad lintas fungsi secara asinkron.' },
        ],
      },
      {
        id: 'sr2-ch-2',
        title: 'Bab 2: Build vs Buy & Manajemen Innovation Tokens',
        startSec: 30,
        endSec: 60,
        competency: 'Penerapan Kasus',
        summary: 'Menimbang biaya jangka panjang (TCO) dan fokus diferensiasi bisnis.',
        keyTakeaways: [
          'Gunakan komponen teruji untuk masalah komoditas seperti transcoding video.',
          'Fokuskan rekayasa kustom pada alur pedagogis inti perusahaan.',
        ],
        diagramType: 'chart',
        diagramNodes: ['Komoditas: Buy/Managed (TCO Rendah)', 'Inti Bisnis: Build Kustom (Nilai Tinggi)'],
        captions: [
          { startSec: 30, endSec: 45, text: 'Jangan menghabiskan kuota inovasi untuk membangun ulang sistem yang sudah mapan.' },
          { startSec: 45, endSec: 60, text: 'Hitung biaya pemeliharaan 3 tahun ke depan sebelum memutuskan membangun sendiri.' },
        ],
      },
      {
        id: 'sr2-ch-3',
        title: 'Bab 3: Mengukur ROI Program Pelatihan & Learning Impact',
        startSec: 60,
        endSec: 90,
        competency: 'Optimasi & Evaluasi',
        summary: 'Menghubungkan N-Gain LMS dengan KPI operasional tim di lapangan.',
        keyTakeaways: [
          'Kombinasikan skor N-Gain LMS dengan metrik pasca-pelatihan (misal penurunan bug produksi).',
          'Audit materi yang memiliki N-Gain rendah secara berkala.',
        ],
        diagramType: 'hierarchy',
        diagramNodes: ['Level 1: Kepuasan', 'Level 2: N-Gain Pre/Post', 'Level 3: Perilaku Kerja', 'Level 4: Dampak Bisnis'],
        captions: [
          { startSec: 60, endSec: 75, text: 'Jumlah video yang ditonton belum membuktikan dampak bisnis.' },
          { startSec: 75, endSec: 90, text: 'Padukan kenaikan skor Pre-to-Post dengan perubahan performa kerja nyata di tim.' },
        ],
      },
      {
        id: 'sr2-ch-4',
        title: 'Bab 4: Menggandakan Kapasitas Tim & Menaikkan Bus Factor',
        startSec: 90,
        endSec: 120,
        competency: 'Penerapan Kasus',
        summary: 'Membangun kemandirian engineer OJT hingga Middle melalui struktur yang jelas.',
        keyTakeaways: [
          'Sederhanakan kompleksitas agar kode mudah dipahami anggota baru.',
          'Desain jalur mentoring dan kurikulum internal berbasis data kesalahan review.',
        ],
        diagramType: 'cycle',
        diagramNodes: ['Identifikasi Bottleneck', 'Buat Playbook & ADR', 'Delegasi Terbimbing', 'Tim Mandiri'],
        captions: [
          { startSec: 90, endSec: 105, text: 'Keberhasilan Senior diukur dari seberapa cepat timnya mampu mengambil keputusan tepat tanpa dirinya.' },
          { startSec: 105, endSec: 120, text: 'Ubah temuan code review berulang menjadi modul pelatihan OJT dan Junior.' },
        ],
      },
    ],
    checkpoint: {
      triggerSec: 60,
      question: 'Checkpoint Senior: Kapan paling tepat menggunakan layanan terkelola (Buy) dibanding membangun sendiri (Build)?',
      options: [
        'Ketika kapabilitas tersebut bukan pembeda bisnis utama dan TCO pemeliharaan mandiri jauh lebih mahal',
        'Setiap kali tim belum membaca dokumentasi apa pun',
        'Hanya jika layanan tersebut tidak memiliki SLA',
      ],
      correctIndex: 0,
      feedback: 'Benar! Fokuskan energi tim pada keunggulan unik produk dan delegasikan komoditas secara terukur.',
    },
    postTest: [
      {
        id: 'sr2-post-1',
        prompt: 'Sebuah tim ingin mengganti arsitektur state di tengah jalan karena tidak tahu mengapa pola lama dipilih dua tahun lalu. Artefak apa yang seharusnya mencegah masalah ini?',
        options: [
          'Architecture Decision Record (ADR) yang menjelaskan konteks, alternatif, dan trade-off saat keputusan dibuat',
          'Pesan chat singkat yang sudah terhapus',
          'Komentar TODO di satu file komponen',
          'Daftar nama server di spreadsheet pribadi',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'ADR menjaga memori institusional tim tetap utuh meski anggota tim berganti.',
        relatedChapterIndex: 0,
      },
      {
        id: 'sr2-post-2',
        prompt: 'Dalam strategi Build vs Buy untuk platform LMS, komponen mana yang paling tepat menggunakan layanan terkelola (Buy)?',
        options: [
          'Pipeline transcoding video adaptif (HLS) dan pengiriman CDN global',
          'Logika alur penilaian kompetensi unik perusahaan Anda',
          'Aturan penguncian jalur karier OJT → Senior organisasi Anda',
          'Integrasi kurikulum internal divisi',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Transcoding video adalah masalah komoditas yang kompleks; layanan terkelola jauh lebih hemat TCO.',
        relatedChapterIndex: 1,
      },
      {
        id: 'sr2-post-3',
        prompt: 'Setelah meluncurkan Paket OJT, tim ingin membuktikan efektivitasnya ke pimpinan. Kombinasi bukti terkuat adalah:',
        options: [
          'Kenaikan rata-rata N-Gain dari Pre-Test ke Post-Test disertai penurunan insiden produksi oleh peserta baru',
          'Total menit video yang diunggah oleh admin',
          'Jumlah baris TypeScript pada proyek LMS',
          'Persentase peserta yang mengklik tombol halaman utama',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Menghubungkan learning gain dengan metrik operasional membuktikan ROI pelatihan secara menyeluruh.',
        relatedChapterIndex: 2,
      },
      {
        id: 'sr2-post-4',
        prompt: 'Jika seluruh PR arsitektur menumpuk menunggu persetujuan satu Tech Lead (bus factor 1), tindakan paling strategis adalah:',
        options: [
          'Mendokumentasikan standar lewat ADR, mendelegasikan otoritas review ke engineer Middle, dan menyederhanakan batas modul',
          'Meminta Tech Lead bekerja 16 jam sehari',
          'Menghapus seluruh proses code review',
          'Menutup penerimaan anggota OJT baru',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Distribusi kepemilikan teknis menaikkan ketahanan dan kecepatan pengiriman tim.',
        relatedChapterIndex: 3,
      },
      {
        id: 'sr2-post-5',
        prompt: 'Bagaimana Senior memanfaatkan data kegagalan Post-Test di LMS untuk meningkatkan kualitas tim engineering?',
        options: [
          'Menjadikan topik dengan skor terendah sebagai fokus materi video baru dan checklist code review',
          'Menghukum peserta tanpa memperbaiki materi',
          'Menurunkan KKM Senior dari 85% menjadi 40%',
          'Menyembunyikan laporan analitik dari manajer',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'LMS menjadi umpan balik tertutup untuk terus meningkatkan standar pengetahuan organisasi.',
        relatedChapterIndex: 2,
      },
    ],
  },
];

export function createInitialProgressStore(): LMSProgressStore {
  return {
    // Mulai berurutan dari Paket OJT Modul 1 (OJT-101); modul 2-6 dan paket Junior/Middle/Senior terkunci hingga prasyarat lulus
    'ojt-profil-perusahaan': {
      courseId: 'ojt-profil-perusahaan',
      preTestResult: null,
      watchedSeconds: [],
      lastPositionSec: 0,
      checkpointPassed: false,
      postTestAttempts: [],
      notes: [],
    },
    'ojt-talenta-sop-kpi': {
      courseId: 'ojt-talenta-sop-kpi',
      preTestResult: null,
      watchedSeconds: [],
      lastPositionSec: 0,
      checkpointPassed: false,
      postTestAttempts: [],
      notes: [],
    },
    'ojt-k3-lapangan': {
      courseId: 'ojt-k3-lapangan',
      preTestResult: null,
      watchedSeconds: [],
      lastPositionSec: 0,
      checkpointPassed: false,
      postTestAttempts: [],
      notes: [],
    },
    'ojt-p3k-darurat': {
      courseId: 'ojt-p3k-darurat',
      preTestResult: null,
      watchedSeconds: [],
      lastPositionSec: 0,
      checkpointPassed: false,
      postTestAttempts: [],
      notes: [],
    },
    'ojt-alat-kerja': {
      courseId: 'ojt-alat-kerja',
      preTestResult: null,
      watchedSeconds: [],
      lastPositionSec: 0,
      checkpointPassed: false,
      postTestAttempts: [],
      notes: [],
    },
    'ojt-jobdesk-teknis': {
      courseId: 'ojt-jobdesk-teknis',
      preTestResult: null,
      watchedSeconds: [],
      lastPositionSec: 0,
      checkpointPassed: false,
      postTestAttempts: [],
      notes: [],
    },

    // Track Junior: Terkunci hingga seluruh modul Paket OJT selesai
    'ui-design-accessibility': {
      courseId: 'ui-design-accessibility',
      preTestResult: null,
      watchedSeconds: [],
      lastPositionSec: 0,
      checkpointPassed: false,
      postTestAttempts: [],
      notes: [],
    },
    'data-analytics-decision': {
      courseId: 'data-analytics-decision',
      preTestResult: null,
      watchedSeconds: [],
      lastPositionSec: 0,
      checkpointPassed: false,
      postTestAttempts: [],
      notes: [],
    },
    'junior-softskill-core': {
      courseId: 'junior-softskill-core',
      preTestResult: null,
      watchedSeconds: [],
      lastPositionSec: 0,
      checkpointPassed: false,
      postTestAttempts: [],
      notes: [],
    },

    // Track Middle: Terkunci hingga seluruh modul Paket Junior selesai
    'frontend-state-arch': {
      courseId: 'frontend-state-arch',
      preTestResult: null,
      watchedSeconds: [],
      lastPositionSec: 0,
      checkpointPassed: false,
      postTestAttempts: [],
      notes: [],
    },
    'middle-api-contracts': {
      courseId: 'middle-api-contracts',
      preTestResult: null,
      watchedSeconds: [],
      lastPositionSec: 0,
      checkpointPassed: false,
      postTestAttempts: [],
      notes: [],
    },

    // Track Senior: Terkunci hingga seluruh modul Paket Middle selesai
    'senior-distributed-systems': {
      courseId: 'senior-distributed-systems',
      preTestResult: null,
      watchedSeconds: [],
      lastPositionSec: 0,
      checkpointPassed: false,
      postTestAttempts: [],
      notes: [],
    },
    'senior-tech-leadership': {
      courseId: 'senior-tech-leadership',
      preTestResult: null,
      watchedSeconds: [],
      lastPositionSec: 0,
      checkpointPassed: false,
      postTestAttempts: [],
      notes: [],
    },
  };
}

export function getWatchPercentage(progress: CourseProgress, course: Course): number {
  const uniqueWatched = new Set(progress.watchedSeconds).size;
  return Math.min(100, Math.round((uniqueWatched / course.videoDurationSec) * 100));
}

export function getBestPostScore(progress: CourseProgress): number | null {
  if (progress.postTestAttempts.length === 0) return null;
  return Math.max(...progress.postTestAttempts.map((a) => a.score));
}

export function computeNGain(preScore: number, postScore: number): number {
  if (preScore >= 100) return postScore >= 100 ? 1 : 0;
  const gain = (postScore - preScore) / (100 - preScore);
  return Math.round(gain * 100) / 100;
}

export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function isCoursePassed(course: Course, store: LMSProgressStore): boolean {
  const p = store[course.id];
  if (!p) return false;
  const best = getBestPostScore(p);
  return best !== null && best >= course.passingScore;
}

export function getCourseProgressPercentage(
  course: Course,
  progress?: CourseProgress
): number {
  if (!progress) return 0;
  const bestPost = getBestPostScore(progress);
  if (bestPost !== null && bestPost >= course.passingScore) {
    return 100;
  }
  let pct = 0;
  if (progress.preTestResult) pct += 20;
  const watchPct = getWatchPercentage(progress, course);
  pct += Math.round((watchPct / 100) * 55);
  if (progress.checkpointPassed) pct += 10;
  if (progress.postTestAttempts.length > 0) pct += 10;
  return Math.min(95, Math.max(0, pct));
}

export interface AccountPackageSummary {
  trackLevel: TrackLevel;
  trackName: string;
  progressPct: number;
  modulesPassed: number;
  modulesStarted: number;
  modulesTotal: number;
  avgVideoPct: number;
}

export function getAccountPackageSummary(
  trackLevel: TrackLevel,
  store: LMSProgressStore,
  courseList: Course[] = COURSES
): AccountPackageSummary {
  const track =
    LEARNING_TRACKS.find((t) => t.id === trackLevel) ?? LEARNING_TRACKS[0];
  const trackCourses = courseList.filter((c) => c.trackLevel === trackLevel);
  const total = trackCourses.length;
  if (total === 0) {
    return {
      trackLevel,
      trackName: track.name,
      progressPct: 0,
      modulesPassed: 0,
      modulesStarted: 0,
      modulesTotal: 0,
      avgVideoPct: 0,
    };
  }
  const passed = trackCourses.filter((c) => isCoursePassed(c, store)).length;
  const started = trackCourses.filter((c) => {
    const p = store[c.id];
    return Boolean(
      p &&
        (p.preTestResult ||
          p.watchedSeconds.length > 0 ||
          p.postTestAttempts.length > 0)
    );
  }).length;
  const sumProgressPct = trackCourses.reduce(
    (sum, c) => sum + getCourseProgressPercentage(c, store[c.id]),
    0
  );
  const sumVideoPct = trackCourses.reduce((sum, c) => {
    const p = store[c.id];
    return sum + (p ? getWatchPercentage(p, c) : 0);
  }, 0);

  return {
    trackLevel,
    trackName: track.name,
    progressPct: Math.round(sumProgressPct / total),
    modulesPassed: passed,
    modulesStarted: started,
    modulesTotal: total,
    avgVideoPct: Math.round(sumVideoPct / total),
  };
}

export function getTrackProgressSummary(
  trackLevel: TrackLevel,
  store: LMSProgressStore,
  courseList: Course[] = COURSES
): { total: number; passed: number; pct: number; completed: boolean } {
  const trackCourses = courseList.filter((c) => c.trackLevel === trackLevel);
  const passed = trackCourses.filter((c) => isCoursePassed(c, store)).length;
  const total = trackCourses.length;
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  return {
    total,
    passed,
    pct,
    completed: total > 0 && passed === total,
  };
}

export function isTrackUnlocked(
  trackLevel: TrackLevel,
  store: LMSProgressStore,
  _placementLevel: TrackLevel | null,
  unlockAllPreview: boolean,
  courseList: Course[] = COURSES,
  levelFlowMode: 'admin_assigned' | 'linear_sequential' | 'open_catalog' = 'open_catalog',
  userAssignedTrack: TrackLevel = 'OJT',
  trackSequence: TrackLevel[] = ['OJT', 'Junior', 'Middle', 'Senior']
): { unlocked: boolean; viaPlacement: boolean; reason: string } {
  if (unlockAllPreview) {
    return { unlocked: true, viaPlacement: false, reason: 'Mode Pratinjau Bebas' };
  }

  if (levelFlowMode === 'open_catalog') {
    return { unlocked: true, viaPlacement: false, reason: 'Alur Terbuka (Kebijakan Admin)' };
  }

  const orderedLevels =
    trackSequence.length > 0
      ? trackSequence
      : (['OJT', 'Junior', 'Middle', 'Senior'] as TrackLevel[]);
  const targetSeqIdx = orderedLevels.indexOf(trackLevel);
  const effectiveIdx =
    targetSeqIdx >= 0
      ? targetSeqIdx
      : (LEARNING_TRACKS.find((t) => t.id === trackLevel)?.order ?? 1) - 1;

  if (levelFlowMode === 'admin_assigned') {
    const assignedTrack = LEARNING_TRACKS.find((t) => t.id === userAssignedTrack);
    const targetTrack = LEARNING_TRACKS.find((t) => t.id === trackLevel);
    const assignedIdx = orderedLevels.indexOf(userAssignedTrack);

    // Check if all previous tracks before this target are completed
    let allPrevCompleted = true;
    let firstIncompletePrev: {
      track: LearningTrack;
      summary: { total: number; passed: number; pct: number; completed: boolean };
    } | null = null;
    for (let i = 0; i < effectiveIdx; i++) {
      const prevLvl = orderedLevels[i];
      const prevTrack = LEARNING_TRACKS.find((t) => t.id === prevLvl);
      if (!prevTrack) continue;
      const summary = getTrackProgressSummary(prevTrack.id, store, courseList);
      if (!summary.completed) {
        allPrevCompleted = false;
        firstIncompletePrev = { track: prevTrack, summary };
        break;
      }
    }

    if (effectiveIdx === 0) {
      return {
        unlocked: true,
        viaPlacement: userAssignedTrack === trackLevel,
        reason: 'Paket Dasar OJT Terbuka',
      };
    }

    if (
      allPrevCompleted &&
      ((assignedIdx >= 0 && effectiveIdx <= assignedIdx) ||
        (assignedTrack && targetTrack && assignedTrack.order >= targetTrack.order))
    ) {
      return {
        unlocked: true,
        viaPlacement: true,
        reason: `Ditetapkan Admin untuk akun Anda (${userAssignedTrack})`,
      };
    }

    if (allPrevCompleted) {
      return {
        unlocked: true,
        viaPlacement: false,
        reason: 'Seluruh paket sebelumnya telah lulus',
      };
    }

    if (firstIncompletePrev) {
      return {
        unlocked: false,
        viaPlacement: false,
        reason: `Selesaikan ${firstIncompletePrev.track.name} terlebih dahulu (${firstIncompletePrev.summary.passed}/${firstIncompletePrev.summary.total} modul lulus)`,
      };
    }

    return {
      unlocked: false,
      viaPlacement: false,
      reason: `Terkunci · Penugasan Admin saat ini di Paket ${userAssignedTrack}`,
    };
  }

  // linear_sequential mode: paket berikutnya terkunci hingga SELURUH paket sebelumnya selesai (100% lulus)
  if (effectiveIdx === 0) {
    return { unlocked: true, viaPlacement: false, reason: 'Jenjang Awal Wajib' };
  }

  for (let i = 0; i < effectiveIdx; i++) {
    const prevLevel = orderedLevels[i];
    const prevTrack = LEARNING_TRACKS.find((t) => t.id === prevLevel);
    if (!prevTrack) continue;
    const prevSummary = getTrackProgressSummary(prevTrack.id, store, courseList);
    if (!prevSummary.completed) {
      return {
        unlocked: false,
        viaPlacement: false,
        reason: `${prevTrack.name} belum selesai (${prevSummary.passed}/${prevSummary.total} modul lulus). Selesaikan paket sebelumnya terlebih dahulu.`,
      };
    }
  }

  const immediatePrevLevel = orderedLevels[effectiveIdx - 1];
  const immediatePrevTrack = LEARNING_TRACKS.find(
    (t) => t.id === immediatePrevLevel
  );
  return {
    unlocked: true,
    viaPlacement: false,
    reason: immediatePrevTrack
      ? `Lulus ${immediatePrevTrack.name}`
      : 'Paket Sebelumnya Selesai',
  };
}

export function isCourseUnlockedInTrack(
  course: Course,
  store: LMSProgressStore,
  allCourses: Course[],
  enforceModuleOrder: boolean,
  unlockAllPreview: boolean
): { unlocked: boolean; prerequisiteCourse: Course | null; reason: string } {
  if (unlockAllPreview || !enforceModuleOrder) {
    return { unlocked: true, prerequisiteCourse: null, reason: '' };
  }

  const trackCourses = allCourses
    .filter((c) => c.trackLevel === course.trackLevel)
    .sort((a, b) => a.moduleOrderInTrack - b.moduleOrderInTrack);

  const idx = trackCourses.findIndex((c) => c.id === course.id);
  if (idx <= 0) {
    return { unlocked: true, prerequisiteCourse: null, reason: '' };
  }

  for (let i = 0; i < idx; i++) {
    const prereq = trackCourses[i];
    if (!isCoursePassed(prereq, store)) {
      return {
        unlocked: false,
        prerequisiteCourse: prereq,
        reason: `Kerjakan & luluskan Modul ${i + 1} (${prereq.code} — ${prereq.title}) terlebih dahulu`,
      };
    }
  }

  return {
    unlocked: true,
    prerequisiteCourse: trackCourses[idx - 1],
    reason: '',
  };
}

export function getNextSequentialCourseId(
  allCourses: Course[],
  store: LMSProgressStore,
  trackSequence: TrackLevel[] = ['OJT', 'Junior', 'Middle', 'Senior']
): string {
  const orderedLevels =
    trackSequence.length > 0
      ? trackSequence
      : (['OJT', 'Junior', 'Middle', 'Senior'] as TrackLevel[]);
  for (const lvl of orderedLevels) {
    const trackCourses = allCourses
      .filter((c) => c.trackLevel === lvl)
      .sort((a, b) => a.moduleOrderInTrack - b.moduleOrderInTrack);
    for (const c of trackCourses) {
      if (!isCoursePassed(c, store)) {
        return c.id;
      }
    }
  }
  return allCourses[0]?.id ?? 'ojt-profil-perusahaan';
}

export const INITIAL_COHORT_LEARNERS = [
  {
    id: 'learner-1',
    name: 'Alya Putri',
    division: 'Automation Software Integration & IO',
    currentTrack: 'Middle' as TrackLevel,
    avgPreScore: 55,
    avgVideoPct: 92,
    bestPostScore: 100,
    nGain: 1.0,
    modulesPassed: 9,
    modulesTotal: 13,
    needsIntervention: false,
  },
  {
    id: 'learner-2',
    name: 'Bima Pratama',
    division: 'Camera Vision And Inspection',
    currentTrack: 'OJT' as TrackLevel,
    avgPreScore: 45,
    avgVideoPct: 48,
    bestPostScore: 60,
    nGain: 0.27,
    modulesPassed: 2,
    modulesTotal: 13,
    needsIntervention: true,
  },
  {
    id: 'learner-3',
    name: 'Citra Lestari',
    division: 'Coding and Marking',
    currentTrack: 'Senior' as TrackLevel,
    avgPreScore: 65,
    avgVideoPct: 96,
    bestPostScore: 100,
    nGain: 1.0,
    modulesPassed: 12,
    modulesTotal: 13,
    needsIntervention: false,
  },
  {
    id: 'learner-4',
    name: 'Deni Kurniawan',
    division: 'Procurement and Warehouse',
    currentTrack: 'OJT' as TrackLevel,
    avgPreScore: 50,
    avgVideoPct: 78,
    bestPostScore: 85,
    nGain: 0.7,
    modulesPassed: 4,
    modulesTotal: 13,
    needsIntervention: false,
  },
  {
    id: 'learner-5',
    name: 'Farah Nabila',
    division: 'Finance And Tax',
    currentTrack: 'Junior' as TrackLevel,
    avgPreScore: 60,
    avgVideoPct: 32,
    bestPostScore: null,
    nGain: null,
    modulesPassed: 6,
    modulesTotal: 13,
    needsIntervention: true,
  },
];

export function createCourseFromAdminInput(input: {
  code: string;
  title: string;
  category: string;
  trackLevel: TrackLevel;
  instructorName: string;
  syllabusDurationLabel: string;
  passingScore: number;
  minWatchPercent: number;
  description: string;
  moduleOrderInTrack?: number;
  videoUrl?: string;
  videoDurationSec?: number;
  idSuffix?: string;
  existingCourses: Course[];
}): Course {
  const sanitizedCode =
    input.code
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'kelas';
  const suffix = input.idSuffix ? `-${input.idSuffix}` : '';
  const id = `custom-${sanitizedCode}-${input.trackLevel.toLowerCase()}${suffix}-${Date.now()}`;
  const sameTrackCount = input.existingCourses.filter(
    (c) => c.trackLevel === input.trackLevel
  ).length;
  const orderInTrack =
    typeof input.moduleOrderInTrack === 'number' &&
    Number.isFinite(input.moduleOrderInTrack)
      ? Math.max(1, Math.min(sameTrackCount + 1, Math.round(input.moduleOrderInTrack)))
      : sameTrackCount + 1;
  const cover =
    input.trackLevel === 'Junior'
      ? COVER_UI
      : input.trackLevel === 'Middle'
        ? COVER_FRONTEND
        : COVER_ANALYTICS;

  const durationSec =
    typeof input.videoDurationSec === 'number' &&
    Number.isFinite(input.videoDurationSec)
      ? Math.max(10, Math.min(36000, Math.round(input.videoDurationSec)))
      : 120;
  const ch1End = Math.max(3, Math.round(durationSec / 3));
  const ch2End = Math.max(ch1End + 3, Math.round((durationSec * 2) / 3));
  const cleanVideoUrl =
    typeof input.videoUrl === 'string' && input.videoUrl.trim()
      ? input.videoUrl.trim()
      : undefined;

  return {
    id,
    code: input.code.toUpperCase(),
    title: input.title,
    category: input.category,
    trackLevel: input.trackLevel,
    moduleOrderInTrack: orderInTrack,
    instructorName: input.instructorName || 'Tim Kurikulum Lentera',
    instructorRole: `Instruktur Paket ${input.trackLevel}`,
    instructorAvatar: INSTRUCTOR_AVATAR,
    coverImage: cover,
    syllabusDurationLabel: input.syllabusDurationLabel || '30 Menit',
    videoDurationSec: durationSec,
    passingScore: input.passingScore,
    minWatchPercent: input.minWatchPercent,
    description:
      input.description ||
      `Modul pembelajaran terstruktur untuk jenjang ${input.trackLevel} yang mencakup Pre-Test, Video Learning, dan Post-Test.`,
    ...(cleanVideoUrl ? { videoUrl: cleanVideoUrl } : {}),
    preTest: [
      {
        id: `${id}-pre-1`,
        prompt: `Pada tahap awal mempelajari ${input.title}, aspek fundamental apa yang paling krusial untuk dipetakan terlebih dahulu?`,
        options: [
          'Memahami ruang lingkup masalah, standar kerja jenjang terkait, dan kriteria keberhasilan',
          'Langsung melewatkan perencanaan tanpa meninjau kebutuhan',
          'Menghindari diskusi dengan tim lintas fungsi',
          'Menunda dokumentasi hingga proyek berakhir',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Pemetaan ruang lingkup dan standar keberhasilan sejak awal mencegah kesalahan arah.',
        relatedChapterIndex: 0,
      },
      {
        id: `${id}-pre-2`,
        prompt: `Dalam penerapan praktis ${input.title}, langkah terbaik saat menemukan kendala teknis atau operasional adalah:`,
        options: [
          'Mengumpulkan fakta, mencoba isolasi penyebab, lalu mendokumentasikan temuan',
          'Mengubah seluruh konfigurasi produksi secara acak',
          'Mengabaikan kendala sampai keluhan pengguna menumpuk',
          'Menyalin solusi tanpa memahami dampaknya',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Isolasi berbasis fakta mempercepat penyelesaian masalah secara aman.',
        relatedChapterIndex: 1,
      },
      {
        id: `${id}-pre-3`,
        prompt: `Bagaimana cara mengevaluasi efektivitas penerapan materi ${input.title} di lingkungan kerja?`,
        options: [
          'Membandingkan metrik sebelum dan sesudah penerapan beserta umpan balik pemangku kepentingan',
          'Hanya menghitung jumlah rapat yang diadakan',
          'Mengandalkan asumsi pribadi tanpa pengukuran',
          'Menunggu evaluasi tahunan tanpa pencatatan',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Evaluasi objektif membutuhkan perbandingan baseline sebelum dan sesudah.',
        relatedChapterIndex: 2,
      },
    ],
    chapters: [
      {
        id: `${id}-ch-1`,
        title: `Bab 1: Fondasi & Kerangka Kerja ${input.title}`,
        startSec: 0,
        endSec: ch1End,
        competency: 'Konsep Dasar',
        summary: `Memahami tujuan inti dan standar kompetensi Paket ${input.trackLevel}.`,
        keyTakeaways: [
          'Menyelaraskan konsep dasar dengan standar operasional tim.',
          'Mengidentifikasi indikator keberhasilan yang terukur.',
        ],
        diagramType: 'hierarchy',
        diagramNodes: ['Tujuan Modul', 'Standar Jenjang', 'Eksekusi Terukur'],
        captions: [
          { startSec: 0, endSec: Math.max(2, Math.round(ch1End / 2)), text: `Selamat datang di modul ${input.title} untuk jenjang ${input.trackLevel}.` },
          { startSec: Math.max(2, Math.round(ch1End / 2)), endSec: ch1End, text: 'Pastikan setiap konsep dasar dipahami sebelum masuk ke studi kasus.' },
        ],
      },
      {
        id: `${id}-ch-2`,
        title: 'Bab 2: Penerapan Kasus & Mitigasi Risiko',
        startSec: ch1End,
        endSec: ch2End,
        competency: 'Penerapan Kasus',
        summary: 'Menerapkan teori ke skenario kerja nyata di lapangan.',
        keyTakeaways: [
          'Gunakan daftar periksa verifikasi sebelum menyerahkan hasil kerja.',
          'Komunikasikan asumsi dan risiko secara transparan.',
        ],
        diagramType: 'pipeline',
        diagramNodes: ['Analisis Kasus', 'Rancangan Solusi', 'Uji Validasi', 'Rilis Aman'],
        captions: [
          { startSec: ch1End, endSec: Math.round((ch1End + ch2End) / 2), text: 'Studi kasus membantu menjembatani teori ke keputusan harian.' },
          { startSec: Math.round((ch1End + ch2End) / 2), endSec: ch2End, text: 'Selalu uji dampak perubahan terhadap pengguna dan tim lain.' },
        ],
      },
      {
        id: `${id}-ch-3`,
        title: 'Bab 3: Evaluasi Dampak & Peningkatan Berkelanjutan',
        startSec: ch2End,
        endSec: durationSec,
        competency: 'Optimasi & Evaluasi',
        summary: 'Mengukur hasil nyata dan merencanakan iterasi perbaikan.',
        keyTakeaways: [
          'Bandingkan capaian pasca-implementasi dengan kondisi awal.',
          'Dokumentasikan pembelajaran sebagai referensi tim.',
        ],
        diagramType: 'cycle',
        diagramNodes: ['Baseline Awal', 'Implementasi', 'Audit Metrik', 'Iterasi'],
        captions: [
          { startSec: ch2End, endSec: Math.round((ch2End + durationSec) / 2), text: 'Pengukuran pasca-implementasi memastikan perbaikan memberi nilai nyata.' },
          { startSec: Math.round((ch2End + durationSec) / 2), endSec: durationSec, text: 'Siapkan diri Anda untuk mengerjakan Post-Test evaluasi setelah bab ini.' },
        ],
      },
    ],
    checkpoint: {
      triggerSec: Math.max(5, Math.round(durationSec / 2)),
      question: `Checkpoint Modul ${input.code.toUpperCase()}: Mengapa validasi berbasis data lebih diutamakan sebelum menetapkan solusi final?`,
      options: [
        'Karena mengurangi bias asumsi dan memastikan akar masalah benar-benar terselesaikan',
        'Agar proses diskusi menjadi lebih lama tanpa hasil',
        'Untuk menghindari dokumentasi kerja',
      ],
      correctIndex: 0,
      feedback: 'Tepat! Pendekatan berbasis bukti memastikan keputusan akurat dan dapat dipertanggungjawabkan.',
    },
    postTest: [
      {
        id: `${id}-post-1`,
        prompt: `Setelah mempelajari ${input.title}, langkah pertama yang tepat saat memulai tugas baru pada jenjang ${input.trackLevel} adalah:`,
        options: [
          'Memvalidasi definisi tujuan, batasan, dan kriteria keberhasilan bersama pihak terkait',
          'Langsung bekerja tanpa memeriksa spesifikasi',
          'Melewatkan tahap verifikasi',
          'Menghapus catatan tugas sebelumnya',
        ],
        correctIndex: 0,
        competency: 'Konsep Dasar',
        explanation: 'Kejelasan ekspektasi di awal mencegah pengerjaan ulang di akhir.',
        relatedChapterIndex: 0,
      },
      {
        id: `${id}-post-2`,
        prompt: 'Ketika solusi awal tidak berjalan sesuai rencana di lingkungan kerja, sikap profesional yang tepat adalah:',
        options: [
          'Melakukan analisis akar penyebab secara terstruktur, menyiapkan opsi mitigasi, dan melaporkannya terbuka',
          'Menyembunyikan kegagalan hingga tenggat berakhir',
          'Menyalahkan rekan kerja lain tanpa data',
          'Menghentikan seluruh pekerjaan',
        ],
        correctIndex: 0,
        competency: 'Penerapan Kasus',
        explanation: 'Transparansi dan analisis terstruktur menjaga keandalan tim.',
        relatedChapterIndex: 1,
      },
      {
        id: `${id}-post-3`,
        prompt: 'Indikator bahwa penerapan pembelajaran telah menghasilkan peningkatan nyata adalah:',
        options: [
          'Terukurnya perbaikan kualitas/kecepatan dibanding baseline awal dan tercapainya standar KKM',
          'Banyaknya pesan chat yang dikirim tanpa tindak lanjut',
          'Tidak adanya pengukuran sama sekali',
          'Bertambahnya jumlah bug berulang',
        ],
        correctIndex: 0,
        competency: 'Optimasi & Evaluasi',
        explanation: 'Perbandingan dengan baseline membuktikan dampak nyata pembelajaran.',
        relatedChapterIndex: 2,
      },
    ],
  };
}

