"use client"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Search, TrendingUp, Users, Zap } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/src/contexts/auth-context"

export function HeroBanner() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // TODO: 검색 기능 구현
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const popularCategories = [
    { name: "테크", href: "/?category=tech" },
    { name: "디자인", href: "/?category=design" },
    { name: "음식", href: "/?category=food" },
    { name: "패션", href: "/?category=fashion" },
    { name: "뷰티", href: "/?category=beauty" },
  ]

  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 to-background px-4 py-12 md:py-16">
      <div className="container mx-auto">
        {/* 검색바 */}
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="새로운 일상이 필요하신가요?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 rounded-full border-2 border-primary/20 bg-background pl-12 pr-4 text-base shadow-lg transition-all focus:border-primary focus:shadow-xl"
              />
              <Button
                type="submit"
                size="lg"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6"
              >
                검색
              </Button>
            </div>
          </form>

          {/* 인기 카테고리 */}
          <div className="mb-8">
            <p className="mb-3 text-sm font-medium text-muted-foreground">인기 카테고리</p>
            <div className="flex flex-wrap gap-2">
              {popularCategories.map((category) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* 통계 정보 */}
          <div className="grid grid-cols-3 gap-4 rounded-lg border bg-card p-6 shadow-sm">
            <div className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <TrendingUp className="size-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">1,234억</div>
              <div className="text-xs text-muted-foreground">누적 후원금액</div>
            </div>
            <div className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <Users className="size-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">12,345</div>
              <div className="text-xs text-muted-foreground">참여자 수</div>
            </div>
            <div className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <Zap className="size-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">567</div>
              <div className="text-xs text-muted-foreground">진행 중인 프로젝트</div>
            </div>
          </div>

          {/* CTA 버튼 (로그인한 경우만) */}
          {isAuthenticated && (
            <div className="mt-6 flex justify-center gap-3">
              <Button size="lg" variant="outline" asChild>
                <Link href="/auction/create">경매 등록</Link>
              </Button>
              <Button size="lg" asChild>
                <Link href="/project/create">프로젝트 시작하기</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
