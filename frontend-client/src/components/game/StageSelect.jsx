import { useTranslation } from "react-i18next"
import { Gamepad2, Shield, AlertTriangle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useStagesQuery } from "@/lib/api"

const categoryConfig = {
  "Fake APK": { icon: AlertTriangle, color: "bg-orange-100 text-orange-800" },
  "Phishing Link": { icon: Shield, color: "bg-blue-100 text-blue-800" },
  "Social Engineering": { icon: Users, color: "bg-purple-100 text-purple-800" },
}

const difficultyLabels = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
  4: "Expert",
  5: "Master",
}

/**
 * StageSelect - Stage selection screen
 * @param {function} onSelectStage - Called with stage ID when selected
 */
export function StageSelect({ onSelectStage }) {
  const { t } = useTranslation()
  const { data: stages = [], isLoading } = useStagesQuery()

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
        <p className="mt-2 text-gray-500">{t("game.loading")}</p>
      </div>
    )
  }

  if (stages.length === 0) {
    return (
      <div className="text-center py-8">
        <Gamepad2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">{t("game.noStages")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">{t("game.selectStage")}</h2>
        <p className="text-gray-600 mt-1">{t("game.selectStageDescription")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stages.map((stage) => {
          const category = categoryConfig[stage.category] || categoryConfig["Phishing Link"]
          const CategoryIcon = category.icon
          // Use translated stage data if available
          const translated = t(`game.stages.${stage.id}`, { returnObjects: true })
          const title = translated?.title || stage.title
          const description = translated?.description || stage.description
          const categoryLabel = translated?.category || stage.category

          return (
            <Card
              key={stage.id}
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-cyan-300"
              onClick={() => onSelectStage(stage.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className={category.color}>
                    <CategoryIcon className="h-3 w-3 mr-1" />
                    {categoryLabel}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {t(`game.difficulty.${stage.difficulty}`, difficultyLabels[stage.difficulty] || "Medium")}
                  </span>
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm line-clamp-2">
                  {description}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
