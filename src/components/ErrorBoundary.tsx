import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Terjadi kendala pada aplikasi.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendlyMessage =
        'Terjadi kendala saat memuat atau menyinkronkan data akun Anda.';
      try {
        const parsed = JSON.parse(this.state.message) as {
          error?: string;
          operationType?: string;
        };
        if (parsed.error) {
          friendlyMessage = `Sinkronisasi database (${parsed.operationType ?? 'akses'}) gagal: ${parsed.error}`;
        }
      } catch {
        if (this.state.message) {
          friendlyMessage = this.state.message;
        }
      }

      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8 space-y-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-red-700">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              <span>Pemulihan Sesi Aplikasi</span>
            </div>
            <h1 className="font-display text-xl font-bold text-slate-900">
              Tidak Dapat Memproses Permintaan
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed break-words">
              {friendlyMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
