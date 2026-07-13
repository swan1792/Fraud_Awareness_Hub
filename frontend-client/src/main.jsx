import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { GameProvider } from "./contexts/GameContext"
import App from "./App.jsx"
import i18n from "./i18n"
import "./index.css"

function syncMeta(lang) {
  document.documentElement.lang = lang
  document.title = i18n.t("meta.title")
  const desc = document.querySelector('meta[name="description"]')
  if (desc) desc.setAttribute("content", i18n.t("meta.description"))
}
i18n.on("languageChanged", syncMeta)
syncMeta(i18n.language)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <App />
      </GameProvider>
    </QueryClientProvider>
  </StrictMode>
)
