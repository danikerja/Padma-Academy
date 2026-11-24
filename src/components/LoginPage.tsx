import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { extractEmailDomain, isCorporateDomain } from '../lib/firebase';
import { COMPANY_DEPARTMENTS } from '../data/courses';

interface LoginPageProps {
  onLoginWithGoogle: (workEmailHint: string, division: string) => Promise<void>;
  authError: string | null;
  isSigningIn: boolean;
}

const DIVISIONS = COMPANY_DEPARTMENTS;

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginWithGoogle,
  authError,
  isSigningIn,
}) => {
  const [workEmail, setWorkEmail] = useState('');
  const [division, setDivision] = useState<string>(DIVISIONS[0]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const trimmedEmail = workEmail.trim();
  const domain = extractEmailDomain(trimmedEmail);
  const looksValidEmail =
    !trimmedEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const corporateHint = domain ? isCorporateDomain(domain) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (trimmedEmail && !looksValidEmail) {
      setValidationError(
        'Format email kantor belum valid. Contoh yang benar: nama@perusahaan.co.id'
      );
      return;
    }

    await onLoginWithGoogle(trimmedEmail, division);
  };

  const displayError = validationError || authError;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            Lentera Akademi
          </span>
          <span className="hidden sm:inline text-xs font-medium text-slate-500 whitespace-nowrap">
            Portal Pembelajaran Karyawan · Pre-Test, Video Learning, Post-Test
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 whitespace-nowrap shrink-0">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>SSO Email Kantor</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          {/* Left Editorial Overview Column */}
          <section className="lg:col-span-6 flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-semibold text-blue-700">
                Akses Akun Perusahaan &amp; Jalur Karier
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-[1.15] text-balance">
                Masuk ke Ruang Belajar dengan Email Kantor Anda
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Satu pintu masuk untuk karyawan OJT, Junior, Middle, hingga Senior. Nilai Pre-Test, progres tonton video, dan sertifikat kelulusan di atas 80% tersimpan langsung di profil akun Anda.
              </p>
            </div>

            <div className="border-t border-slate-200 divide-y divide-slate-200">
              <div className="py-4 space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  01. Verifikasi Email Kantor (Google Workspace SSO)
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Gunakan akun Google Workspace perusahaan (misal{' '}
                  <span className="font-mono text-slate-800">nama@perusahaan.co.id</span>) tanpa perlu membuat kata sandi baru.
                </p>
              </div>
              <div className="py-4 space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  02. Pembagian Peran Otomatis (Peserta &amp; Admin L&amp;D)
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Peserta masuk ke Paket Belajar &amp; Ruang Belajar, sementara pengelola L&amp;D terverifikasi dapat mengakses Dashboard Admin dan kebijakan domain kantor.
                </p>
              </div>
              <div className="py-4 space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  03. Kredensial Sertifikat Terhubung ke Profil
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Nama lengkap akun kantor Anda otomatis tercantum pada sertifikat kelulusan saat Post-Test melampaui 80%.
                </p>
              </div>
            </div>
          </section>

          {/* Right Focused Login Card */}
          <section className="lg:col-span-6 flex items-center">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-10 space-y-6"
            >
              <div className="space-y-1.5 pb-5 border-b border-slate-200">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                  Masuk Akun LMS
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Masukkan email kantor sebagai petunjuk akun, lalu lanjutkan autentikasi Google yang aman.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="work-email-input"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Email Kantor (Opsional sebagai petunjuk akun)
                  </label>
                  <div className="relative">
                    <Mail
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      id="work-email-input"
                      type="email"
                      autoComplete="email"
                      value={workEmail}
                      onChange={(e) => {
                        setWorkEmail(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      placeholder="nama@perusahaan.co.id"
                      className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors"
                    />
                  </div>
                  {trimmedEmail && looksValidEmail && (
                    <div className="flex items-center gap-1.5 text-xs pt-0.5">
                      {corporateHint ? (
                        <>
                          <CheckCircle2
                            className="w-3.5 h-3.5 text-emerald-700 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="text-emerald-700 font-medium">
                            Domain kantor terdeteksi:{' '}
                            <span className="font-mono">{domain}</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck
                            className="w-3.5 h-3.5 text-slate-500 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="text-slate-600">
                            Domain <span className="font-mono">{domain}</span> — diizinkan selama pembatasan domain kantor tidak dikunci Admin.
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="division-select"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Departemen (untuk pendaftaran profil baru)
                  </label>
                  <div className="relative">
                    <Building2
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <select
                      id="division-select"
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors"
                    >
                      {DIVISIONS.map((div) => (
                        <option key={div} value={div}>
                          {div}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {displayError && (
                <div
                  role="alert"
                  className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs sm:text-sm text-red-800"
                >
                  <AlertTriangle
                    className="w-4 h-4 text-red-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{displayError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full py-3 px-5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"
                  />
                </svg>
                <span>
                  {isSigningIn
                    ? 'Memverifikasi Akun Kantor...'
                    : 'Masuk dengan Email Kantor (Google)'}
                </span>
              </button>

              <div className="pt-4 border-t border-slate-200 space-y-1.5 text-xs text-slate-500 leading-relaxed">
                <p>
                  Autentikasi menggunakan verifikasi Google resmi (<span className="font-mono text-slate-700">Google Workspace / Gmail</span>). Admin dapat mendaftarkan email peserta training serta mengatur pembatasan domain kantor melalui tab <strong>Dashboard Admin</strong>.
                </p>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};
