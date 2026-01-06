"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/src/components/ui/button"
import { Menu, Search, User, LogOut } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/src/components/ui/dropdown-menu"
import { Input } from "@/src/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { useAuth } from "@/src/contexts/auth-context"
import { toast } from "sonner"

export function Navigation() {
  const router = useRouter()
  const { user, isAuthenticated, logout, isLoading } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("로그아웃되었습니다")
      router.push("/")
      router.refresh()
    } catch (error) {
      toast.error("로그아웃에 실패했습니다")
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">D</span>
            </div>
            <span className="text-xl font-bold">DDIP</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              프로젝트
            </Link>
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              경매
            </Link>
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              둘러보기
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder="프로젝트 검색..." className="w-[240px] pl-10" />
            </div>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="size-5" />
          </Button>

          {isLoading ? (
            <div className="size-10" /> // 로딩 중 플레이스홀더
          ) : isAuthenticated ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="size-8">
                      <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.nickname || ""} />
                      <AvatarFallback>{user?.nickname?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.nickname}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">마이페이지</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 size-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="hidden items-center gap-2 md:flex">
                <Button variant="outline" asChild>
                  <Link href="/auction/create">경매 등록</Link>
                </Button>
                <Button asChild>
                  <Link href="/project/create">프로젝트 등록</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="md:hidden">
                <User className="size-5" />
              </Button>
              <Button variant="ghost" className="hidden md:inline-flex" asChild>
                <Link href="/login">로그인</Link>
              </Button>
              <Button className="hidden md:inline-flex" asChild>
                <Link href="/register">회원가입</Link>
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>프로젝트</DropdownMenuItem>
              <DropdownMenuItem>경매</DropdownMenuItem>
              <DropdownMenuItem>둘러보기</DropdownMenuItem>
              {isAuthenticated ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/project/create">프로젝트 등록</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/auction/create">경매 등록</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>로그아웃</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login">로그인</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register">회원가입</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
