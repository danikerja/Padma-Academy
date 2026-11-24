import React, { useState } from 'react';
import { Award, CheckCircle2, Compass, X } from 'lucide-react';
import { PLACEMENT_QUESTIONS } from '../data/courses';
import { TrackLevel } from '../types/lms';

interface PlacementTestModalProps {
  currentPlacement: TrackLevel | null;
  onClose: () => void;
  onApplyPlacement: (level: TrackLevel) => void;
}

export const PlacementTestModal: React.FC<PlacementTestModalProps> = ({
  currentPlacement,
  onClose,
  onApplyPlacement,
}) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submittedLevel, setSubmittedLevel] = useState<TrackLevel | null>(null);

  const allAnswered = PLACEMENT_QUESTIONS.every(
    (q) => typeof answers[q.id] === 'number'
  );

  const handleEvaluate = () => {
    if (!allAnswered) return;
    // Sequential highest mastered level: must pass OJT -> Junior -> Middle -> Senior
    let highest: TrackLevel = 'OJT';
    const order: TrackLevel[] = ['OJT', 'Junior', 'Middle', 'Senior'];

    for (let i = 0; i < PLACEMENT_QUESTIONS.length; i++) {
      const q = PLACEMENT_QUESTIONS[i];
      if (answers[q.id] === q.correctIndex) {
        highest = order[i];
      } else {
        break;
      }
    }

    setSubmittedLevel(highest);
    onApplyPlacement(highest);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="placement-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
              <Compass className="w-4 h-4" aria-hidden="true" />
              <span>Penempatan Jalur Belajar Adaptif</span>
            </div>
            <h2
              id="placement-modal-title"
              className="font-display text-xl font-bold text-slate-900"
            >
              Ujian Penempatan Jenjang (OJT – Senior)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Peserta berpengalaman tidak harus mengulang dari Paket OJT. Jawab 4 soal kalibrasi
              berjenjang ini untuk membuka paket sesuai kompetensi Anda saat ini.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Ujian Penempatan"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {submittedLevel ? (
          <div className="py-4 space-y-5">
            <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <Award className="w-4 h-4" aria-hidden="true" />
                <span>Hasil Kalibrasi Penempatan</span>
              </div>
              <div className="font-display text-2xl font-bold text-slate-900">
                Rekomendasi Mulai: Paket {submittedLevel}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                Seluruh jenjang hingga <strong>Paket {submittedLevel}</strong> kini telah terbuka
                otomatis. Anda tetap dapat mengakses modul sebelumnya jika ingin menyegarkan materi.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
              >
                Lihat Paket Terbuka
              </button>
            </div>
          </div>
        ) : (
          <>
            {currentPlacement && (
              <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
                Penempatan aktif saat ini: <strong className="text-slate-900">Paket {currentPlacement}</strong>
              </div>
            )}

            <div className="space-y-6">
              {PLACEMENT_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="space-y-2.5">
                  <div className="text-xs text-slate-500 font-medium">
                    <span className="font-mono text-blue-700 font-semibold">
                      Kalibrasi 0{idx + 1}
                    </span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>Level {q.levelLabel}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {q.prompt}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const selected = answers[q.id] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() =>
                            setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                          }
                          className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border transition-colors flex items-start gap-2.5 ${
                            selected
                              ? 'bg-blue-50 border-blue-600 text-slate-900 font-medium'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span
                            className={`font-mono text-xs w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                              selected
                                ? 'bg-blue-700 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500 tabular-nums">
                {Object.keys(answers).length}/{PLACEMENT_QUESTIONS.length} terjawab
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!allAnswered}
                  onClick={handleEvaluate}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 rounded-lg transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>Hitung Penempatan Jenjang</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
