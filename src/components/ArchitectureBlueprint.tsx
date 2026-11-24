import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Database,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { computeNGain, LEARNING_TRACKS } from '../data/courses';

interface ArchitectureBlueprintProps {
  onTryWorkspace: () => void;
  onOpenPlacementModal: () => void;
}

type StateNodeId =
  | 'ENROLLED'
  | 'PRETEST_DONE'
  | 'VIDEO_VERIFIED'
  | 'POSTTEST_PASSED';

const STATE_NODES: {
  id: StateNodeId;
  title: string;
  trigger: string;
  rule: string;
  payload: string;
}[] = [
  {
    id: 'ENROLLED',
    title: '01. Terdaftar (Siap Pre-Test)',
    trigger: 'Peserta membuka kursus pertama kali',
    rule: 'Tahap Video Learning dan Post-Test dikunci. Sistem menampilkan Pre-Test diagnostik untuk merekam baseline pengetahuan awal.',
    payload: `{
  "status": "PRETEST_REQUIRED",
  "preTestCompleted": false,
  "videoWatchPct": 0,
  "postTestUnlocked": false
}`,
  },
  {
    id: 'PRETEST_DONE',
    title: '02. Pre-Test Selesai',
    trigger: 'POST /api/assessments/pretest/submit',
    rule: 'Skor awal dan peta kelemahan per kompetensi disimpan. Video Learning terbuka, dengan penandaan bab prioritas sesuai soal Pre-Test yang salah.',
    payload: `{
  "status": "VIDEO_IN_PROGRESS",
  "preTestScore": 40,
  "weakCompetencies": ["Penerapan Kasus"],
  "videoUnlocked": true,
  "postTestUnlocked": false
}`,
  },
  {
    id: 'VIDEO_VERIFIED',
    title: '03. Video Terverifikasi (>= 80%)',
    trigger: 'Heartbeat detik tonton unik + Checkpoint lulus',
    rule: 'Backend mencatat bitmask/set detik unik yang benar-benar ditonton (bukan hasil skip scrubber). Setelah melewati ambang 80%, Post-Test terbuka.',
    payload: `{
  "status": "POSTTEST_UNLOCKED",
  "watchedUniqueSec": 98,
  "totalDurationSec": 120,
  "watchPct": 82,
  "checkpointPassed": true,
  "postTestUnlocked": true
}`,
  },
  {
    id: 'POSTTEST_PASSED',
    title: '04. Lulus Post-Test & Sertifikat',
    trigger: 'POST /api/assessments/posttest/submit (Skor >= KKM)',
    rule: 'Jika skor >= KKM jenjang (70–85%), sistem menghitung delta kenaikan dan N-Gain, lalu mengecek apakah seluruh modul di paket sudah tuntas untuk membuka paket berikutnya.',
    payload: `{
  "status": "COMPLETED_PASSED",
  "trackLevel": "Junior",
  "preTestScore": 40,
  "postTestScore": 90,
  "deltaPoints": 50,
  "normalizedGain": 0.83,
  "nextTrackUnlocked": true
}`,
  },
];

const DB_TABLES = [
  {
    name: 'learning_tracks & track_enrollments',
    columns: 'track_id (OJT|Junior|Middle|Senior), sort_order, min_pass_score | user_id, placement_level, exempted_tracks',
    purpose: 'Mengatur urutan prasyarat antar paket karier, standar KKM tiap jenjang, dan pengecualian hasil Ujian Penempatan.',
  },
  {
    name: 'courses & video_chapters',
    columns: 'id, track_id, module_order, code, passing_score, min_watch_pct, duration_sec, competency_tag',
    purpose: 'Menyimpan kurikulum tiap jenjang, urutan modul dalam paket, serta pemetaan bab ke kompetensi.',
  },
  {
    name: 'questions (bank soal)',
    columns: 'id, course_id, stage_type (PRETEST | POSTTEST | PLACEMENT), competency_tag, options_json, correct_idx',
    purpose: 'Memisahkan butir soal Pre-Test, Post-Test, dan Placement Test agar tetap adil mengukur kompetensi setara.',
  },
  {
    name: 'quiz_attempts & video_watch_segments',
    columns: 'attempt_id, user_id, score, elapsed_sec | unique_seconds_bitmap, last_position_sec, checkpoint_passed',
    purpose: 'Mencatat riwayat ujian serta bitmask detik tonton unik guna mencegah skip video sebelum Post-Test.',
  },
  {
    name: 'learning_notes & certificates',
    columns: 'note_id, timestamp_sec, content | cert_id, track_level, pre_score, post_score, n_gain, issued_at',
    purpose: 'Menyimpan catatan belajar berstempel waktu serta kredensial sertifikat per modul maupun per jenjang.',
  },
];

export const ArchitectureBlueprint: React.FC<ArchitectureBlueprintProps> = ({
  onTryWorkspace,
  onOpenPlacementModal,
}) => {
  const [selectedStateId, setSelectedStateId] =
    useState<StateNodeId>('PRETEST_DONE');
  const [simPre, setSimPre] = useState<number>(40);
  const [simPost, setSimPost] = useState<number>(85);

  const selectedNode =
    STATE_NODES.find((n) => n.id === selectedStateId) ?? STATE_NODES[0];
  const simDelta = simPost - simPre;
  const simNGain = computeNGain(simPre, simPost);
  const gainCategory =
    simNGain >= 0.7
      ? 'Tinggi (Materi sangat efektif)'
      : simNGain >= 0.3
        ? 'Sedang (Efektivitas cukup baik)'
        : 'Rendah (Perlu revisi video/latihan)';

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      {/* Intro Banner */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <p className="text-xs font-semibold text-blue-700">
            Rancangan Teknis &amp; Pedagogis
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Arsitektur LMS Bertingkat: OJT, Junior, Middle &amp; Senior
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Panduan lengkap bagaimana paket modul karier dipadukan dengan siklus
            Pre-Test → Video Learning → Post-Test serta mekanisme Ujian Penempatan agar
            peserta berpengalaman tidak perlu mengulang materi dasar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenPlacementModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Compass className="w-4 h-4 text-blue-700" aria-hidden="true" />
            <span>Coba Ujian Penempatan</span>
          </button>
          <button
            type="button"
            onClick={onTryWorkspace}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>Buka Ruang Belajar</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Learning Path Design Section */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
            <Compass className="w-4 h-4" aria-hidden="true" />
            <span>1. Pola Desain Learning Path (OJT → Junior → Middle → Senior)</span>
          </div>
          <p className="text-sm text-slate-600 max-w-3xl">
            Di dunia nyata, peserta memiliki titik awal yang berbeda. LMS yang matang menggabungkan
            jalur berjenjang dengan opsi kalibrasi penempatan awal:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-sm font-bold text-slate-900">
              Pola A: Jalur Linear Terkunci (Untuk OJT / Fresh Graduate)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Peserta wajib menuntaskan seluruh modul di <strong>Paket OJT</strong> (lulus
              Post-Test minimal KKM 70%) sebelum <strong>Paket Junior</strong> (KKM 75%) terbuka.
              Ambang KKM dan kedalaman studi kasus meningkat bertahap hingga{' '}
              <strong>Senior</strong> (KKM 85%).
            </p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-sm font-bold text-slate-900">
              Pola B: Penempatan Adaptif / Fast-Track (Untuk Rekrutan Berpengalaman)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Melalui <strong>Ujian Penempatan</strong> di awal pendaftaran, sistem menguji 1–2
              kompetensi kunci per level. Jika kandidat lolos hingga pertanyaan level Middle, paket
              OJT &amp; Junior otomatis ditandai <em>Disetarakan</em> sehingga kandidat langsung
              fokus ke Paket Middle.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {LEARNING_TRACKS.map((t) => (
            <div
              key={t.id}
              className="p-4 border border-slate-200 rounded-lg space-y-2 bg-white"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-blue-700">
                  0{t.order}. {t.id}
                </span>
                <span className="font-mono text-slate-600 tabular-nums">
                  KKM {t.minPassScore}%
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900">{t.subtitle}</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t.targetAudience}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive State Machine Explorer */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Layers className="w-4 h-4 text-blue-700" aria-hidden="true" />
            <span>2. Mesin Status di Dalam Setiap Modul</span>
          </div>
          <p className="text-sm text-slate-600">
            Klik setiap tahapan di bawah untuk melihat syarat transisi dan payload state per modul.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-2.5">
            {STATE_NODES.map((node) => {
              const active = node.id === selectedStateId;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedStateId(node.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    active
                      ? 'bg-blue-50/70 border-blue-700'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-bold text-slate-900">
                    {node.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Pemicu: {node.trigger}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="space-y-1.5">
              <div className="text-xs font-mono font-semibold text-blue-700">
                STATE: {selectedNode.id}
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                {selectedNode.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {selectedNode.rule}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-700">
                Contoh Payload Status Progres
              </div>
              <pre className="bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-lg overflow-x-auto leading-relaxed">
                {selectedNode.payload}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Database Schema & Interactive N-Gain Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Database className="w-4 h-4 text-blue-700" aria-hidden="true" />
            <span>3. Rancangan Tabel Basis Data (Mendukung Paket Jenjang)</span>
          </div>

          <div className="divide-y divide-slate-200">
            {DB_TABLES.map((tbl) => (
              <div key={tbl.name} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                <div className="font-mono text-sm font-semibold text-slate-900">
                  {tbl.name}
                </div>
                <div className="font-mono text-xs text-blue-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                  {tbl.columns}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {tbl.purpose}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              <span>4. Simulasi Kalkulator N-Gain (Hake)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Geser nilai Pre-Test dan Post-Test untuk melihat bagaimana LMS menilai efektivitas pembelajaran secara adil.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="sim-pre" className="font-semibold text-slate-800">
                  Skor Pre-Test Awal
                </label>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {simPre} / 100
                </span>
              </div>
              <input
                id="sim-pre"
                type="range"
                min={0}
                max={95}
                step={5}
                value={simPre}
                onChange={(e) => setSimPre(Number(e.target.value))}
                className="w-full accent-blue-700"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="sim-post" className="font-semibold text-slate-800">
                  Skor Post-Test Akhir
                </label>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {simPost} / 100
                </span>
              </div>
              <input
                id="sim-post"
                type="range"
                min={0}
                max={100}
                step={5}
                value={simPost}
                onChange={(e) => setSimPost(Number(e.target.value))}
                className="w-full accent-emerald-700"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="font-mono text-xs text-slate-600">
              N-Gain = (Post - Pre) / (100 - Pre)
            </div>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <div className="text-xs text-slate-500">Selisih Poin</div>
                <div
                  className={`font-mono text-2xl font-semibold tabular-nums ${
                    simDelta >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {simDelta >= 0 ? `+${simDelta}` : simDelta}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Nilai N-Gain</div>
                <div className="font-mono text-2xl font-semibold text-blue-700 tabular-nums">
                  {simNGain.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="text-xs font-medium text-slate-800 pt-2 border-t border-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />
              <span>Interpretasi: {gainCategory}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
