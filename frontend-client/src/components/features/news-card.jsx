import { ExternalLink, Calendar } from 'lucide-react'

export function NewsCard({ article }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:border-orange-200 hover:shadow-lg hover:-translate-y-1">
      {/* Image */}
      {article.imageUrl && (
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Category badge */}
        <div className="mb-3">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            article.category === 'international'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}>
            {article.category === 'international' ? 'International' : 'Myanmar'}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-base font-bold leading-snug text-gray-950 line-clamp-2 group-hover:text-orange-700 transition-colors">
          {article.title}
        </h3>

        {/* Summary */}
        {article.summary && (
          <p className="mb-4 text-sm leading-6 text-gray-600 line-clamp-3">
            {article.summary}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            {article.sourceName && (
              <span className="font-medium text-gray-700">{article.sourceName}</span>
            )}
            {article.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(article.publishedAt)}
              </span>
            )}
          </div>
          {article.sourceUrl && (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-800 transition-colors"
            >
              Read more
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
