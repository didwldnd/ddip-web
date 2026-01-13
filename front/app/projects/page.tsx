"use client"

import { Navigation } from "@/src/components/navigation"
import { ProjectCard } from "@/src/components/project-card"
import { EmptyState } from "@/src/components/empty-state"
import { FilterBar } from "@/src/components/filter-bar"
import { Button } from "@/src/components/ui/button"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"
import { projectApi } from "@/src/services/api"
import { ProjectResponse } from "@/src/types/api"
import { useFilterStore, filterAndSortProjects } from "@/src/stores/filterStore"
import { saveScrollPosition, restoreScrollPosition } from "@/src/lib/scroll-restore"
import { Loader2, Package } from "lucide-react"

export default function ProjectsPage() {
  const pathname = usePathname()
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const pageRef = useRef(1)
  const observerTarget = useRef<HTMLDivElement>(null)
  const PAGE_SIZE = 20
  
  const { projectStatus, projectSort, resetFiltersIfPathChanged } = useFilterStore()
  const isBackNavigation = useRef(false)
  const hasInitialData = useRef(false) // 초기 데이터 로드 여부 추적
  const CACHE_KEY = 'ddip_projects_cache'
  
  // 뒤로가기/앞으로가기 감지
  useEffect(() => {
    const handlePopState = () => {
      isBackNavigation.current = true
      // 충분한 시간 후 리셋 (데이터 로드 및 스크롤 복원 완료 대기)
      setTimeout(() => {
        isBackNavigation.current = false
      }, 1000)
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])
  
  // 페이지 진입 시 필터 초기화 체크
  useEffect(() => {
    // 뒤로가기/앞으로가기면 필터 초기화하지 않음
    if (!isBackNavigation.current) {
      resetFiltersIfPathChanged(pathname)
      hasInitialData.current = false // 일반 네비게이션 시 초기화
    } else {
      // 뒤로가기 시 경로만 업데이트 (필터 유지)
      useFilterStore.getState().setLastVisitedPath(pathname)
    }
  }, [pathname, resetFiltersIfPathChanged])
  
  // 페이지를 떠날 때 스크롤 위치 및 데이터 저장
  useEffect(() => {
    return () => {
      saveScrollPosition(pathname)
      // 데이터 캐싱
      if (projects.length > 0) {
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            data: projects,
            status: projectStatus,
            sort: projectSort,
            page: pageRef.current
          }))
        } catch (error) {
          console.error("데이터 캐싱 실패:", error)
        }
      }
    }
  }, [pathname, projects, projectStatus, projectSort])
  
  // 스크롤 이벤트 리스너 (스크롤 위치 주기적 저장)
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null
    
    const handleScroll = () => {
      // 스크롤이 멈춘 후 저장 (성능 최적화)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      scrollTimeout = setTimeout(() => {
        saveScrollPosition(pathname)
      }, 150) // 150ms 후 저장
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [pathname])

  // 초기 데이터 로드 및 필터/정렬 변경 시 초기화
  useEffect(() => {
    // 뒤로가기로 돌아왔을 때 캐시된 데이터 복원
    if (isBackNavigation.current) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data: cachedData, status: cachedStatus, sort: cachedSort, page: cachedPage } = JSON.parse(cached)
          // 필터가 동일하면 캐시된 데이터 사용
          if (cachedStatus === projectStatus && cachedSort === projectSort) {
            console.log(`[ProjectsPage] 캐시된 데이터 복원: ${cachedData.length}개`)
            setProjects(cachedData)
            setHasMore(cachedData.length === PAGE_SIZE)
            pageRef.current = cachedPage
            hasInitialData.current = true
            setLoading(false)
            
            // 스크롤 위치 복원
            setTimeout(() => {
              restoreScrollPosition(pathname, 0)
            }, 100)
            return
          }
        }
      } catch (error) {
        console.error("캐시 복원 실패:", error)
      }
    }
    
    // 뒤로가기로 돌아왔고 이미 데이터가 있으면 다시 로드하지 않음
    if (isBackNavigation.current && hasInitialData.current && projects.length > 0) {
      // 스크롤 위치만 복원
      setTimeout(() => {
        restoreScrollPosition(pathname, 0)
      }, 50)
      return
    }
    
    const loadData = async () => {
      try {
        setLoading(true)
        pageRef.current = 1
        
        await projectApi.checkAllProjectsStatus()
        const data = await projectApi.getProjects({ 
          page: 1, 
          limit: PAGE_SIZE, 
          status: projectStatus === 'ALL' ? undefined : projectStatus 
        })
        
        console.log(`[ProjectsPage] 로드된 데이터: ${data.length}개, 페이지: 1, 상태: ${projectStatus}`)
        setProjects(data)
        hasInitialData.current = true
        
        // 데이터 캐싱
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            data,
            status: projectStatus,
            sort: projectSort,
            page: pageRef.current
          }))
        } catch (error) {
          console.error("데이터 캐싱 실패:", error)
        }
        
        // API에서 필터링된 데이터를 가져오므로, 실제 응답 길이로 판단
        const hasMoreData = data.length === PAGE_SIZE
        console.log(`[ProjectsPage] hasMore 설정: ${hasMoreData} (데이터 ${data.length}개, PAGE_SIZE ${PAGE_SIZE}개)`)
        setHasMore(hasMoreData)
        
        // 데이터 로드 완료 후 스크롤 위치 복원 (뒤로가기 시)
        if (isBackNavigation.current) {
          // DOM 렌더링 완료 대기
          setTimeout(() => {
            restoreScrollPosition(pathname, 0)
          }, 200)
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [projectStatus, projectSort, pathname])

  // 상태 주기적 체크 (1분마다) - 첫 페이지만 새로고침
  useEffect(() => {
    const checkStatus = async () => {
      try {
        await projectApi.checkAllProjectsStatus()
        // 첫 페이지만 새로고침 (무한 스크롤 중에는 방해하지 않음)
        if (pageRef.current === 1) {
          const data = await projectApi.getProjects({ 
            page: 1, 
            limit: PAGE_SIZE,
            status: projectStatus === 'ALL' ? undefined : projectStatus
          })
          setProjects(data)
        }
      } catch (error) {
        console.error("상태 체크 실패:", error)
      }
    }

    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [projectStatus])

  // 더 많은 데이터 로드
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) {
      console.log(`[ProjectsPage] loadMore 스킵: loadingMore=${loadingMore}, hasMore=${hasMore}`)
      return
    }

    try {
      setLoadingMore(true)
      const nextPage = pageRef.current + 1
      
      console.log(`[ProjectsPage] 다음 페이지 로드 시작: 페이지 ${nextPage}, 상태: ${projectStatus}`)
      const data = await projectApi.getProjects({ 
        page: nextPage, 
        limit: PAGE_SIZE,
        status: projectStatus === 'ALL' ? undefined : projectStatus
      })
      
      console.log(`[ProjectsPage] 페이지 ${nextPage} 로드 완료: ${data.length}개`)
      
      if (data.length === 0) {
        console.log(`[ProjectsPage] 더 이상 데이터 없음 - hasMore를 false로 설정`)
        setHasMore(false)
      } else {
        setProjects(prev => {
          const updated = [...prev, ...data]
          console.log(`[ProjectsPage] 총 프로젝트 수: ${updated.length}개 (이전: ${prev.length}개 + 새로: ${data.length}개)`)
          return updated
        })
        // API에서 필터링된 데이터를 가져오므로, 실제 응답 길이로 판단
        const hasMoreData = data.length === PAGE_SIZE
        console.log(`[ProjectsPage] hasMore 설정: ${hasMoreData} (데이터 ${data.length}개, PAGE_SIZE ${PAGE_SIZE}개)`)
        setHasMore(hasMoreData)
        pageRef.current = nextPage
        console.log(`[ProjectsPage] 다음 페이지: ${nextPage + 1}, hasMore: ${hasMoreData}`)
      }
    } catch (error) {
      console.error("추가 데이터 로드 실패:", error)
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, projectStatus])

  // Intersection Observer로 무한 스크롤
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0].isIntersecting
        console.log(`[ProjectsPage] Observer: intersecting=${isIntersecting}, hasMore=${hasMore}, loadingMore=${loadingMore}, projects.length=${projects.length}`)
        
        if (isIntersecting && hasMore && !loadingMore) {
          console.log(`[ProjectsPage] 트리거 감지! loadMore 호출`)
          loadMore()
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px' // 200px 전에 미리 로드 (더 빠른 로딩)
      }
    )

    // 타겟이 렌더링될 때까지 기다림
    const setupObserver = () => {
      const currentTarget = observerTarget.current
      if (currentTarget) {
        console.log(`[ProjectsPage] Observer 등록됨 (hasMore: ${hasMore})`)
        observer.observe(currentTarget)
        return true
      }
      return false
    }

    // 즉시 시도
    if (!setupObserver()) {
      // 타겟이 아직 렌더링되지 않았을 수 있으므로 짧은 지연 후 재시도
      console.warn(`[ProjectsPage] Observer 타겟이 없음 - 재시도 중...`)
      const timeoutId = setTimeout(() => {
        if (!setupObserver()) {
          console.warn(`[ProjectsPage] Observer 타겟을 찾을 수 없음`)
        }
      }, 200)
      
      return () => {
        clearTimeout(timeoutId)
        if (observerTarget.current) {
          observer.unobserve(observerTarget.current)
        }
      }
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [hasMore, loadingMore, loadMore, projects.length])

  // 정렬된 프로젝트 (API에서 이미 필터링된 데이터를 가져오므로 정렬만 수행)
  const sortedProjects = useMemo(() => {
    // API에서 이미 필터링된 데이터를 가져오므로, 클라이언트에서는 정렬만 수행
    const sorted = [...projects].sort((a, b) => {
      switch (projectSort) {
        case 'latest':
          return b.id - a.id // ID가 타임스탬프이므로 큰 순서대로
        case 'popular':
          // 후원자 수 기준
          const backersA = a.rewardTiers.reduce((sum, tier) => sum + tier.soldQuantity, 0)
          const backersB = b.rewardTiers.reduce((sum, tier) => sum + tier.soldQuantity, 0)
          return backersB - backersA
        case 'ending':
          // 마감 임박순
          const endTimeA = new Date(a.endAt).getTime()
          const endTimeB = new Date(b.endAt).getTime()
          return endTimeA - endTimeB
        case 'amount':
          // 모금액 순
          return b.currentAmount - a.currentAmount
        default:
          return 0
      }
    })
    return sorted
  }, [projects, projectSort])

  // 프로젝트 데이터를 ProjectCard props로 변환
  const projectCards = sortedProjects.map((project) => {
    const endTime = new Date(project.endAt)
    const now = new Date()
    const daysLeft = isNaN(endTime.getTime()) 
      ? 0 
      : Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const backers = project.rewardTiers.reduce((sum, tier) => sum + tier.soldQuantity, 0)

    return {
      id: String(project.id),
      title: project.title,
      description: project.description,
      image: project.imageUrl || "/placeholder.svg",
      category: "프로젝트",
      currentAmount: project.currentAmount,
      goalAmount: project.targetAmount,
      backers,
      daysLeft: daysLeft > 0 ? daysLeft : 0,
    }
  })

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">크라우드펀딩 프로젝트</h1>
          <p className="text-muted-foreground">모든 크라우드펀딩 프로젝트를 둘러보세요</p>
        </div>

        <FilterBar type="project" />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : projectCards.length === 0 ? (
          projectStatus !== 'ALL' || projectSort !== 'latest' ? (
            <EmptyState
              icon={Package}
              title="필터 조건에 맞는 프로젝트가 없습니다"
              description="다른 필터 조건을 선택하거나 필터를 초기화해보세요"
              action={{
                label: "필터 초기화",
                onClick: () => {
                  useFilterStore.getState().resetFilters()
                },
              }}
            />
          ) : (
            <EmptyState
              icon={Package}
              title="등록된 프로젝트가 없습니다"
              description="첫 번째 크라우드펀딩 프로젝트를 시작해보세요"
              action={{
                label: "프로젝트 등록하기",
                href: "/project/create",
              }}
            />
          )
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
              {projectCards.map((project) => (
                <ProjectCard key={project.id} {...project} />
              ))}
            </div>
            
            {/* 무한 스크롤 트리거 - 항상 렌더링하여 Observer가 등록되도록 */}
            <div 
              ref={observerTarget} 
              className="flex items-center justify-center py-8 min-h-[200px]"
              style={{ visibility: hasMore ? 'visible' : 'hidden' }}
            >
              {loadingMore && (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">더 많은 프로젝트를 불러오는 중...</p>
                </div>
              )}
              {!loadingMore && hasMore && (
                <p className="text-sm text-muted-foreground">스크롤하여 더 보기</p>
              )}
            </div>
            {!hasMore && projectCards.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">모든 프로젝트를 불러왔습니다 (총 {projectCards.length}개)</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
