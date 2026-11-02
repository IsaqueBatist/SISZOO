import { Component, type ReactNode } from 'react'

interface RouteErrorBoundaryProps {
  children: ReactNode
}

interface RouteErrorBoundaryState {
  temErro: boolean
}

export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { temErro: false }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { temErro: true }
  }

  private tentarNovamente = () => {
    window.location.reload()
  }

  render() {
    if (this.state.temErro) {
      return (
        <div className="page-header" role="alert">
          <div className="title-block">
            <h1>Não foi possível carregar esta página</h1>
            <p className="subtitle">Verifique sua conexão com a internet e tente novamente.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={this.tentarNovamente}>
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
