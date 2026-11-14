import { Component, type ReactNode } from 'react';

/** Shows a friendly Arabic message instead of a blank page when a screen crashes. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e: unknown) { console.error(e); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <button type="button" onClick={() => { window.location.hash = '#/'; this.setState({ failed: false }); }}
          className="min-h-16 rounded-3xl bg-teal-600 px-6 py-4 text-xl font-bold text-white shadow">
          <span aria-hidden>⚠️ </span>حدث خطأ، اضغط للعودة
        </button>
      </main>
    );
  }
}
