import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center w-full h-full min-h-[300px]">
          <div className="text-center max-w-md p-6 space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground break-all">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={this.handleReset}>
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()}>
                Reload App
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
