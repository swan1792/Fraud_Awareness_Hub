# Project Conventions

## Language & Extensions
- All source files use `.jsx` extension (NOT `.tsx`)
- All config files use `.js` extension (NOT `.mjs` or `.cjs`)
- No TypeScript in this project

## Naming
- Components: `PascalCase` filename and export (e.g., `HeroSection`, `ScamCard`)
- Utilities: `camelCase` filename and export (e.g., `cn`, `containsOTP`)
- Constants: `camelCase` for local, `UPPER_SNAKE_CASE` only for true constants
- Files: `kebab-case` for components (e.g., `hero-section.jsx`), `camelCase` for utils (e.g., `utils.js`)

## Imports
- Use `@/` alias for src imports: `import { Button } from "@/components/ui/button"`
- Group imports: React → third-party → local components → lib → utils
- No relative path imports (`../`) when `@/` alias works

## Component Structure
```jsx
import { useState, useCallback } from "react"
import { SomeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MyComponent({ prop1, prop2 }) {
  // State
  const [value, setValue] = useState(null)

  // Callbacks
  const handleClick = useCallback(() => { ... }, [])

  // Effects (if any)
  useEffect(() => { ... }, [])

  // Render
  return (
    <div>...</div>
  )
}
```

## API Pattern (TanStack Query + Axios)
```js
// In lib/axios.js
import axios from 'axios'
const apiClient = axios.create({ baseURL: 'http://localhost:3001/api' })
export default apiClient

// In lib/api.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from './axios'

export function useItemsQuery() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => apiClient.get('/items').then((res) => res.data),
  })
}

export function useCreateItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => apiClient.post('/items', body).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  })
}
```

## CSS Classes
- Use Tailwind utility classes directly
- Use `cn()` helper for conditional classes: `cn("base-class", condition && "conditional-class")`
- No inline styles except for dynamic values (e.g., `width: ${percent}%`)
- No separate CSS files for components
