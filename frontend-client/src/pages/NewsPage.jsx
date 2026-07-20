import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Newspaper, Globe, MapPin, Loader2 } from 'lucide-react'
import { useNewsQuery } from '@/lib/api'
import { NewsCard } from '@/components/features/news-card'
import { AnimatedBackground } from '@/components/section/animated-background'

export function NewsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('international')
  const { data: news = [], isLoading } = useNewsQuery(activeTab)

  const tabs = [
    { id: 'international', label: t('news.tabs.international'), icon: Globe },
    { id: 'myanmar', label: t('news.tabs.myanmar'), icon: MapPin },
  ]

  return (
    <div className="relative isolate min-h-screen bg-[#09090c]">
      <AnimatedBackground />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="relative mx-auto flex max-w-6xl flex-col gap-3 px-4 pt-24 pb-6 sm:pt-28 sm:pb-12 md:pt-32 md:pb-20">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-xl bg-orange-500/15 p-2.5">
                <Newspaper className="h-6 w-6 text-orange-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-400">
                {t('news.badge')}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
              {t('news.title')}{' '}
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                {t('news.titleHighlight')}
              </span>
            </h1>
            <p className="max-w-2xl text-base sm:text-lg text-slate-400 leading-7">
              {t('news.description')}
            </p>
          </div>
        </section>

        {/* Tabs + Content */}
        <section className="px-4 pb-16 sm:pb-24">
          <div className="mx-auto max-w-6xl">
            {/* Tab Switcher */}
            <div className="mb-8 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-sm w-fit">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-orange-500/20 text-orange-300 shadow-sm'
                        : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-orange-400 mb-4" />
                <p className="text-sm text-zinc-500">{t('news.loading')}</p>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && news.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-2xl bg-white/5 p-4 mb-4">
                  <Newspaper className="h-10 w-10 text-zinc-600" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-300 mb-1">{t('news.emptyTitle')}</h3>
                <p className="text-sm text-zinc-500">{t('news.emptyDesc')}</p>
              </div>
            )}

            {/* News Grid */}
            {!isLoading && news.length > 0 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {news.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
