import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-300">404</p>
        <h1 className="text-2xl font-bold mt-4">Page Not Found</h1>
        <p className="text-gray-500 mt-2">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
