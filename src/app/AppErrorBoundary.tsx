import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { failed: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('Application render failed', error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="error-page">
          <section className="card">
            <p className="eyebrow">Beklenmeyen hata</p>
            <h1>Sayfa görüntülenemedi</h1>
            <p>İşleminize devam etmek için sayfayı güvenli biçimde yeniden yükleyin.</p>
            <button type="button" onClick={() => window.location.reload()}>
              Sayfayı yeniden yükle
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
