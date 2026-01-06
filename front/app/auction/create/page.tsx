"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Navigation } from "@/src/components/navigation"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { ProtectedRoute } from "@/src/components/protected-route"
import { ImageUpload } from "@/src/components/image-upload"
import { auctionApi } from "@/src/services/api"
import { auctionCreateSchema, AuctionCreateFormData } from "@/src/lib/validations"
import { toast } from "sonner"

export default function CreateAuctionPage() {
  const router = useRouter()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startDateTime, setStartDateTime] = useState<string>("")

  // 오늘 날짜와 시간을 datetime-local 형식으로 가져오기
  const now = new Date()
  const today = now.toISOString().slice(0, 16)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AuctionCreateFormData>({
    resolver: zodResolver(auctionCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      startPrice: undefined,
      bidStep: undefined,
      buyoutPrice: null,
      startAt: "",
      endAt: "",
    },
  })

  const buyoutPrice = watch("buyoutPrice")

  const onSubmit = async (data: AuctionCreateFormData) => {
    try {
      setIsSubmitting(true)

      // 이미지 파일이 있으면 base64로 변환 (localStorage 저장용)
      let imageUrl: string | null = null
      if (imageFile) {
        // Mock: 실제로는 FormData로 백엔드에 업로드
        // localStorage 저장을 위해 base64로 변환
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(imageFile)
        })
      }

      // 날짜 유효성 검사 및 ISO 형식으로 변환
      if (!data.startAt || !data.endAt || data.startAt.trim() === "" || data.endAt.trim() === "") {
        toast.error("시작일과 종료일을 모두 선택해주세요")
        return
      }

      // datetime-local은 YYYY-MM-DDTHH:mm 형식
      // 빈 문자열이나 잘못된 형식 체크
      const startDateTimeStr = data.startAt.trim()
      const endDateTimeStr = data.endAt.trim()

      if (!startDateTimeStr || !endDateTimeStr) {
        toast.error("시작일과 종료일을 모두 선택해주세요")
        return
      }

      // Date 객체 생성 및 유효성 검사
      const startDateTimeObj = new Date(startDateTimeStr)
      const endDateTimeObj = new Date(endDateTimeStr)

      // Invalid Date 체크
      if (isNaN(startDateTimeObj.getTime())) {
        toast.error(`유효하지 않은 시작일입니다: ${startDateTimeStr}`)
        return
      }

      if (isNaN(endDateTimeObj.getTime())) {
        toast.error(`유효하지 않은 종료일입니다: ${endDateTimeStr}`)
        return
      }

      if (endDateTimeObj <= startDateTimeObj) {
        toast.error("종료일은 시작일 이후여야 합니다")
        return
      }

      // ISO 형식으로 변환
      let startDateTimeISO: string
      let endDateTimeISO: string

      try {
        startDateTimeISO = startDateTimeObj.toISOString()
        endDateTimeISO = endDateTimeObj.toISOString()
      } catch (error) {
        toast.error("날짜 변환 중 오류가 발생했습니다")
        console.error("Date conversion error:", error)
        return
      }

      const auctionData = {
        ...data,
        startAt: startDateTimeISO,
        endAt: endDateTimeISO,
        imageUrl,
        currentPrice: data.startPrice,
        status: "SCHEDULED" as const,
        winner: null,
        buyoutPrice: data.buyoutPrice ?? null, // undefined를 null로 변환
      }

      const createdAuction = await auctionApi.createAuction(auctionData)
      toast.success("경매가 생성되었습니다!")
      router.push(`/auction/${createdAuction.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "경매 생성에 실패했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Card className="mx-auto max-w-4xl">
            <CardHeader>
              <CardTitle className="text-2xl">새 경매 만들기</CardTitle>
              <CardDescription>경매 상품을 등록하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 경매 이미지 */}
                <div className="space-y-2">
                  <Label>경매 상품 이미지 *</Label>
                  <ImageUpload value={imageFile} onChange={setImageFile} />
                  {!imageFile && (
                    <p className="text-sm text-muted-foreground">경매 상품을 대표할 이미지를 업로드해주세요</p>
                  )}
                </div>

                {/* 제목 */}
                <div className="space-y-2">
                  <Label htmlFor="title">경매 상품 제목 *</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="예: 한정판 빈티지 카메라 콜렉션"
                  />
                  {errors.title && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{errors.title.message}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* 설명 */}
                <div className="space-y-2">
                  <Label htmlFor="description">경매 상품 설명 *</Label>
                  <textarea
                    id="description"
                    {...register("description")}
                    rows={6}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="경매 상품에 대한 상세한 설명을 작성해주세요..."
                  />
                  {errors.description && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{errors.description.message}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* 가격 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startPrice">시작가 (원) *</Label>
                    <Input
                      id="startPrice"
                      type="number"
                      min="1000"
                      step="1000"
                      {...register("startPrice", { 
                        valueAsNumber: true,
                        onChange: (e) => {
                          if (e.target.value === "0") {
                            e.target.value = ""
                          }
                        }
                      })}
                      placeholder="50000"
                      defaultValue=""
                    />
                    {errors.startPrice && (
                      <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{errors.startPrice.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bidStep">입찰 단위 (원) *</Label>
                    <Input
                      id="bidStep"
                      type="number"
                      min="1000"
                      step="1000"
                      {...register("bidStep", { 
                        valueAsNumber: true,
                        onChange: (e) => {
                          if (e.target.value === "0") {
                            e.target.value = ""
                          }
                        }
                      })}
                      placeholder="5000"
                      defaultValue=""
                    />
                    {errors.bidStep && (
                      <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{errors.bidStep.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                {/* 즉시 구매가 */}
                <div className="space-y-2">
                  <Label htmlFor="buyoutPrice">즉시 구매가 (원) - 선택사항</Label>
                  <Input
                    id="buyoutPrice"
                    type="number"
                    min="1000"
                    step="1000"
                    {...register("buyoutPrice", {
                      valueAsNumber: true,
                      setValueAs: (v) => (v === "" || v === 0 ? null : Number(v)),
                    })}
                    placeholder="200000 (선택사항)"
                  />
                  <p className="text-sm text-muted-foreground">
                    즉시 구매가를 설정하면 해당 금액으로 바로 구매할 수 있습니다
                  </p>
                </div>

                {/* 기간 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startAt">경매 시작일 *</Label>
                    <Input
                      id="startAt"
                      type="datetime-local"
                      min={today}
                      {...register("startAt", {
                        onChange: (e) => {
                          setStartDateTime(e.target.value)
                        },
                      })}
                    />
                    {errors.startAt && (
                      <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{errors.startAt.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endAt">경매 종료일 *</Label>
                    <Input
                      id="endAt"
                      type="datetime-local"
                      min={startDateTime || today}
                      {...register("endAt")}
                    />
                    {errors.endAt && (
                      <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{errors.endAt.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                {/* 제출 버튼 */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      "경매 생성"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
