import React from 'react'

interface State { error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="text-4xl">🚧</div>
          <h1 className="mt-3 text-xl font-extrabold text-ink">Er ging iets mis</h1>
          <p className="mt-2 text-ink-soft">Herlaad de pagina of ga terug naar zoeken. Je opgeslagen reizen blijven bewaard.</p>
          <div className="mt-4 flex justify-center gap-2">
            <button onClick={() => { this.setState({ error: null }); history.back() }} className="btn-ghost">Terug</button>
            <a href="/" className="btn-primary">Naar zoeken</a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
