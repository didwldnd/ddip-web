"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { surveyApi } from "@/src/services/api"
import { UserType } from "@/src/types/api"

// ────────────────────────────────────────────
// 설문 데이터
// ────────────────────────────────────────────
const QUESTIONS = [
  {
    step: 1,
    title: "프로젝트를 후원할 때\n가장 중요하게 생각하시나요?",
    subtitle: "선택에 따라 맞춤 프로젝트를 추천해드려요.",
    options: [
      {
        icon: "🌱",
        label: "사회적 가치",
        desc: "사회·환경에 긍정적 영향을 주는 프로젝트를 선호해요",
        type: "VALUE_ORIENTED" as UserType,
      },
      {
        icon: "⚡",
        label: "실용적 혜택",
        desc: "직접 쓸 수 있고 가성비 좋은 리워드를 중요하게 봐요",
        type: "PRACTICAL_ORIENTED" as UserType,
      },
      {
        icon: "🔥",
        label: "인기와 화제성",
        desc: "많이 후원되고 달성률이 높은 프로젝트가 끌려요",
        type: "TREND_ORIENTED" as UserType,
      },
    ],
  },
  {
    step: 2,
    title: "프로젝트 상세 페이지에서\n가장 먼저 확인하는 것은?",
    subtitle: "평소 후원 습관을 알려주세요.",
    options: [
      {
        icon: "💡",
        label: "창작자 소개와 프로젝트 목적",
        desc: "누가 왜 만드는지가 가장 중요해요",
        type: "VALUE_ORIENTED" as UserType,
      },
      {
        icon: "🎁",
        label: "리워드 종류와 가격 구성",
        desc: "어떤 혜택을 받을 수 있는지 먼저 봐요",
        type: "PRACTICAL_ORIENTED" as UserType,
      },
      {
        icon: "📊",
        label: "현재 달성률과 후원자 수",
        desc: "얼마나 많이 참여했는지가 신뢰 기준이에요",
        type: "TREND_ORIENTED" as UserType,
      },
    ],
  },
  {
    step: 3,
    title: "후원을 결정할 때\n가장 크게 영향받는 것은?",
    subtitle: "추천 상품의 기준을 맞춰드릴게요.",
    options: [
      {
        icon: "❤️",
        label: "주변의 긍정적인 반응과 평가",
        desc: "신뢰할 수 있는 사람들의 추천이 중요해요",
        type: "VALUE_ORIENTED" as UserType,
      },
      {
        icon: "💰",
        label: "리워드 대비 가격의 합리성",
        desc: "가성비가 확실해야 후원을 결정해요",
        type: "PRACTICAL_ORIENTED" as UserType,
      },
      {
        icon: "⏰",
        label: "마감 기간과 목표 달성 가능성",
        desc: "시간이 얼마 없으면 더 빨리 결정하게 돼요",
        type: "TREND_ORIENTED" as UserType,
      },
    ],
  },
]

// ────────────────────────────────────────────
// 결과 데이터
// ────────────────────────────────────────────
const RESULT_MAP: Record<UserType, {
  badge: string
  badgeColor: string
  title: string
  desc: string
  traits: string[]
  icon: string
}> = {
  VALUE_ORIENTED: {
    badge: "🌱 가치 지향형",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    title: "딱 맞는 유형을 찾았어요!",
    desc: "의미 있는 프로젝트를 신중하게 고르는 스타일이에요.",
    traits: ["사회적 가치 우선", "신뢰성 중시", "신중한 참여", "의미 있는 소비"],
    icon: "🌱",
  },
  PRACTICAL_ORIENTED: {
    badge: "⚡ 실용 탐색형",
    badgeColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    title: "딱 맞는 유형을 찾았어요!",
    desc: "가성비와 실용성을 꼼꼼히 따지는 스타일이에요.",
    traits: ["기능성 우선", "합리적 가격", "꼼꼼한 비교", "실용적 소비"],
    icon: "⚡",
  },
  TREND_ORIENTED: {
    badge: "🔥 트렌드 참여형",
    badgeColor: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    title: "딱 맞는 유형을 찾았어요!",
    desc: "인기 프로젝트에 빠르게 참여하는 스타일이에요.",
    traits: ["마감 임박 우선", "달성률 중시", "빠른 결정", "참여 증가 민감"],
    icon: "🔥",
  },
}

// 점수 계산 → 최다 선택 타입 반환
function calcUserType(answers: UserType[]): UserType {
  const count: Record<string, number> = {}
  for (const a of answers) count[a] = (count[a] ?? 0) + 1
  return (Object.entries(count).sort((a, b) => b[1] - a[1])[0][0]) as UserType
}

// ────────────────────────────────────────────
// 스텝 인디케이터
// ────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {Array.from({ length: total }).map((_, i) => {
        const done = i + 1 < current
        const active = i + 1 === current
        return (
          <div key={i} className="flex items-center">
            <div
              className={`
                flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold border-2 transition-all
                ${done ? "bg-blue-500 border-blue-500 text-white" : ""}
                ${active ? "bg-blue-500 border-blue-500 text-white scale-110" : ""}
                ${!done && !active ? "bg-transparent border-zinc-600 text-zinc-500" : ""}
              `}
            >
              {done ? "✓" : i + 1}
            </div>
            {i < total - 1 && (
              <div className={`w-14 h-0.5 transition-all ${done ? "bg-blue-500" : "bg-zinc-700"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ────────────────────────────────────────────
// 메인 페이지
// ────────────────────────────────────────────
export default function SurveyPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)                          // 1~3: 질문, 4: 결과
  const [answers, setAnswers] = useState<(UserType | null)[]>([null, null, null])
  const [selected, setSelected] = useState<UserType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resultType, setResultType] = useState<UserType | null>(null)

  const q = QUESTIONS[step - 1]

  // 옵션 선택
  const handleSelect = (type: UserType) => setSelected(type)

  // 다음 단계
  const handleNext = () => {
    if (!selected) return
    const next = [...answers]
    next[step - 1] = selected

    if (step < 3) {
      setAnswers(next)
      setSelected(answers[step] ?? null)   // 다음 질문 기존 답 복원
      setStep(step + 1)
    } else {
      // 마지막 질문 → 결과 계산
      setAnswers(next)
      const type = calcUserType(next as UserType[])
      setResultType(type)
      setStep(4)
    }
  }

  // 이전 단계
  const handlePrev = () => {
    if (step <= 1) return
    setSelected(answers[step - 2])
    setStep(step - 1)
  }

  // 제출 → BE 저장 후 메인으로
  const handleConfirm = async () => {
    if (!resultType) return
    try {
      setIsSubmitting(true)
      await surveyApi.saveSurvey(resultType)
      toast.success("성향이 저장되었어요! 맞춤 추천을 시작합니다.")
      router.push("/")
    } catch {
      toast.error("저장에 실패했어요. 다시 시도해주세요.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 다시 설정
  const handleReset = () => {
    setStep(1)
    setAnswers([null, null, null])
    setSelected(null)
    setResultType(null)
  }

  // ── 결과 화면 ──────────────────────────────
  if (step === 4 && resultType) {
    const r = RESULT_MAP[resultType]
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-12">
        <StepIndicator current={4} total={3} />

        <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-7 border border-zinc-800">
          {/* 뱃지 */}
          <div className="flex justify-center mb-5">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${r.badgeColor}`}>
              {r.badge}
            </span>
          </div>

          {/* 타이틀 */}
          <h2 className="text-2xl font-bold text-white text-center mb-2">{r.title}</h2>
          <p className="text-zinc-400 text-sm text-center mb-6">{r.desc}</p>

          {/* 성향 태그 */}
          <div className="flex flex-wrap gap-2 justify-center mb-7">
            {r.traits.map((t) => (
              <span key={t} className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full border border-zinc-700">
                {t}
              </span>
            ))}
          </div>

          {/* 버튼 */}
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all disabled:opacity-50 mb-3"
          >
            {isSubmitting ? "저장 중..." : "이 성향으로 시작하기"}
          </button>
          <button
            onClick={handleReset}
            className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-all"
          >
            다시 설정하기
          </button>
        </div>
      </div>
    )
  }

  // ── 질문 화면 ──────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-12">
      <StepIndicator current={step} total={3} />

      <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-7 border border-zinc-800">
        {/* 질문 헤더 */}
        <p className="text-xs text-zinc-500 mb-3">질문 {step}/3</p>
        <h2 className="text-xl font-bold text-white whitespace-pre-line leading-snug mb-1">
          {q.title}
        </h2>
        <p className="text-zinc-500 text-sm mb-6">{q.subtitle}</p>

        {/* 옵션 목록 */}
        <div className="space-y-3 mb-7">
          {q.options.map((opt) => {
            const isSelected = selected === opt.type
            return (
              <button
                key={opt.type}
                onClick={() => handleSelect(opt.type)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all
                  ${isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
                  }
                `}
              >
                <span className="text-2xl shrink-0">{opt.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${isSelected ? "text-blue-300" : "text-white"}`}>
                    {opt.label}
                  </p>
                  <p className="text-zinc-500 text-xs mt-0.5 leading-snug">{opt.desc}</p>
                </div>
                <div className={`
                  shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                  ${isSelected ? "border-blue-500 bg-blue-500" : "border-zinc-600"}
                `}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={handlePrev}
              className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-all"
            >
              ← 이전
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!selected}
            className={`
              py-3 rounded-xl font-semibold transition-all
              ${step > 1 ? "flex-1" : "w-full"}
              ${selected
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }
            `}
          >
            {step === 3 ? "결과 보기 →" : "다음 →"}
          </button>
        </div>
      </div>
    </div>
  )
}
