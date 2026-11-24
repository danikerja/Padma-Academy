import React, { useState } from 'react';
import { Award, Download, Printer } from 'lucide-react';
import { AttemptResult, Course } from '../types/lms';
import { computeNGain } from '../data/courses';

interface CertificationProps {
  course: Course;
  preTestResult: AttemptResult | null;
  bestPostScore: number | null;
  watchPct: number;
  completedAt?: string;
  defaultRecipientName?: string;
}

export const Certification: React.FC<CertificationProps> = ({
  course,
  preTestResult,
  bestPostScore,
  watchPct,
  completedAt,
  defaultRecipientName,
}) => {
  const [recipientName, setRecipientName] = useState<string>(
    defaultRecipientName?.trim() || 'Peserta Lentera Akademi'
  );
  const [instructorImgErr, setInstructorImgErr] = useState(false);

  // Strictly appear only when Post-Test is passed AND score > 80%
  const isEligible =
    bestPostScore !== null &&
    bestPostScore >= course.passingScore &&
    bestPostScore > 80;

  if (!isEligible || bestPostScore === null) {
    return null;
  }

  const preScore = preTestResult?.score ?? null;
  const delta = preScore !== null ? bestPostScore - preScore : null;
  const nGain = preScore !== null ? computeNGain(preScore, bestPostScore) : null;
  const credentialId = `LA-${course.code}-2026`;
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(completedAt ? new Date(completedAt) : new Date());

  const handleDownloadCertificate = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1130;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clean archival ivory-white paper backdrop
    ctx.fillStyle = '#FAFBFD';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer hairline frame
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.strokeRect(64, 64, canvas.width - 128, canvas.height - 128);

    // Top bar accent rule
    ctx.fillStyle = '#1D4ED8';
    ctx.fillRect(64, 64, canvas.width - 128, 10);

    // Brand & Credential ID
    ctx.fillStyle = '#0F172A';
    ctx.font = '700 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Lentera Akademi', 120, 165);

    ctx.fillStyle = '#64748B';
    ctx.font = '500 20px "IBM Plex Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`ID KREDENSIAL: ${credentialId}`, canvas.width - 120, 165);
    ctx.textAlign = 'left';

    // Certificate Label
    ctx.fillStyle = '#1D4ED8';
    ctx.font = '600 22px "DM Sans", sans-serif';
    ctx.fillText(`SERTIFIKAT KELULUSAN · PAKET ${course.trackLevel.toUpperCase()}`, 120, 260);

    // Recipient
    ctx.fillStyle = '#475569';
    ctx.font = '400 24px "DM Sans", sans-serif';
    ctx.fillText('Diberikan kepada:', 120, 330);

    ctx.fillStyle = '#0F172A';
    ctx.font = '700 54px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(recipientName.trim() || 'Peserta Lentera Akademi', 120, 405);

    // Course Title
    ctx.fillStyle = '#475569';
    ctx.font = '400 24px "DM Sans", sans-serif';
    ctx.fillText('Atas keberhasilan menuntaskan seluruh rangkaian modul:', 120, 480);

    ctx.fillStyle = '#0F172A';
    ctx.font = '700 38px "Plus Jakarta Sans", sans-serif';
    const words = course.title.split(' ');
    let line = '';
    let y = 540;
    words.forEach((w) => {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > canvas.width - 240) {
        ctx.fillText(line, 120, y);
        line = w;
        y += 48;
      } else {
        line = test;
      }
    });
    if (line) ctx.fillText(line, 120, y);

    // Description
    ctx.fillStyle = '#475569';
    ctx.font = '400 22px "DM Sans", sans-serif';
    ctx.fillText(
      `Menyelesaikan Pre-Test, Video Learning (${watchPct}%), dan Post-Test melampaui batas sertifikasi (>80%).`,
      120,
      y + 62
    );

    // Divider line
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, 745);
    ctx.lineTo(canvas.width - 120, 745);
    ctx.stroke();

    // Metrics strip
    const metrics = [
      { label: 'SKOR PRE-TEST', value: preScore !== null ? `${preScore} / 100` : '—' },
      { label: 'SKOR POST-TEST', value: `${bestPostScore} / 100` },
      { label: 'PENINGKATAN', value: delta !== null ? `${delta >= 0 ? '+' : ''}${delta} poin` : '—' },
      { label: 'N-GAIN SCORE', value: nGain !== null ? nGain.toFixed(2) : '—' },
    ];

    metrics.forEach((m, i) => {
      const mx = 120 + i * 340;
      ctx.fillStyle = '#64748B';
      ctx.font = '500 18px "DM Sans", sans-serif';
      ctx.fillText(m.label, mx, 800);

      ctx.fillStyle = i === 1 ? '#047857' : '#0F172A';
      ctx.font = '700 34px "IBM Plex Mono", monospace';
      ctx.fillText(m.value, mx, 848);
    });

    // Footer Signature & Date
    ctx.fillStyle = '#0F172A';
    ctx.font = '700 24px "DM Sans", sans-serif';
    ctx.fillText(course.instructorName, 120, 985);

    ctx.fillStyle = '#64748B';
    ctx.font = '400 20px "DM Sans", sans-serif';
    ctx.fillText(`${course.instructorRole} · ${course.code}`, 120, 1018);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569';
    ctx.font = '500 20px "DM Sans", sans-serif';
    ctx.fillText(`Diterbitkan pada ${formattedDate}`, canvas.width - 120, 1000);

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `sertifikat-${course.code.toLowerCase()}-lentera-akademi.png`;
    link.click();
  };

  return (
    <section
      aria-labelledby="certification-heading"
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 space-y-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <Award className="w-4 h-4" aria-hidden="true" />
            <span>
              Sertifikat Kelulusan Terbuka · Skor Post-Test {bestPostScore}% (&gt; 80%)
            </span>
          </div>
          <h2
            id="certification-heading"
            className="font-display text-2xl font-bold text-slate-900 mt-1"
          >
            Sertifikat Penyelesaian Modul
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownloadCertificate}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Unduh Sertifikat (PNG)</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Recipient Name Customization */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 max-w-xl">
        <label
          htmlFor="certificate-recipient-name"
          className="text-xs font-semibold text-slate-700 whitespace-nowrap"
        >
          Nama pada Sertifikat:
        </label>
        <input
          id="certificate-recipient-name"
          type="text"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          placeholder="Masukkan nama lengkap Anda"
          className="flex-1 px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Clean Editorial Certificate Frame */}
      <div className="border border-slate-300 rounded-xl p-8 sm:p-10 bg-[#FAFBFD] space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="font-display text-lg font-bold text-slate-900">
            Lentera Akademi · Paket {course.trackLevel}
          </div>
          <div className="font-mono text-xs text-slate-500 tabular-nums">
            ID Kredensial: {credentialId}
          </div>
        </div>

        <div className="space-y-3 max-w-2xl">
          <p className="text-xs font-medium text-slate-500">
            Diberikan kepada{' '}
            <strong className="text-slate-900">
              {recipientName.trim() || 'Peserta Lentera Akademi'}
            </strong>{' '}
            atas keberhasilan menuntaskan modul
          </p>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
            {course.title}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Telah menyelesaikan Pre-Test diagnostik, verifikasi tonton Video Learning (
            {watchPct}%), serta lulus Post-Test evaluasi dengan skor {bestPostScore}% (di atas
            batas sertifikasi 80%) untuk jenjang Paket {course.trackLevel}.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-slate-200">
          <div>
            <div className="text-xs text-slate-500">Skor Pre-Test</div>
            <div className="font-mono text-xl font-semibold text-slate-900 mt-0.5 tabular-nums">
              {preScore !== null ? `${preScore}/100` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Skor Post-Test Terbaik</div>
            <div className="font-mono text-xl font-semibold text-emerald-700 mt-0.5 tabular-nums">
              {bestPostScore}/100
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Peningkatan</div>
            <div className="font-mono text-xl font-semibold text-blue-700 mt-0.5 tabular-nums">
              {delta !== null ? `${delta >= 0 ? `+${delta}` : delta} poin` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">N-Gain Score</div>
            <div className="font-mono text-xl font-semibold text-slate-900 mt-0.5 tabular-nums">
              {nGain !== null ? nGain.toFixed(2) : '—'}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-3">
            {!instructorImgErr ? (
              <img
                src={course.instructorAvatar}
                alt={course.instructorName}
                referrerPolicy="no-referrer"
                onError={() => setInstructorImgErr(true)}
                className="w-11 h-11 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                {course.instructorName.slice(0, 2)}
              </div>
            )}
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {course.instructorName}
              </div>
              <div className="text-xs text-slate-500">{course.instructorRole}</div>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Diterbitkan pada {formattedDate}
          </div>
        </div>
      </div>
    </section>
  );
};
