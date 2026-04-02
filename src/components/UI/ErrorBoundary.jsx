import { Component } from "react"
import { RotateCw, AlertTriangle } from "lucide-react"

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[#0a0e1a] rounded-[2.5rem]">
          <div className="text-center p-8 max-w-xs">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            </div>
            <h3 className="text-white font-bold text-base mb-2">Something went wrong</h3>
            <p className="text-white/40 text-sm mb-5">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-[#006BB6] text-white text-sm font-semibold hover:bg-[#006BB6]/80 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
