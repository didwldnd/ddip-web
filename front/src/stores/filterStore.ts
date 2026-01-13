import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ProjectResponse, AuctionResponse } from '@/src/types/api'

// 프로젝트 필터 타입
export type ProjectStatus = 'ALL' | 'OPEN' | 'SUCCESS' | 'FAILED' | 'CANCELED'
export type ProjectSort = 'latest' | 'popular' | 'ending' | 'amount'

// 경매 필터 타입
export type AuctionStatus = 'ALL' | 'SCHEDULED' | 'RUNNING' | 'ENDED' | 'CANCELED'
export type AuctionSort = 'latest' | 'price' | 'ending' | 'bidCount'

interface FilterState {
  // 프로젝트 필터
  projectStatus: ProjectStatus
  projectSort: ProjectSort
  
  // 경매 필터
  auctionStatus: AuctionStatus
  auctionSort: AuctionSort
  
  // 마지막 방문 경로 (필터 초기화용)
  lastVisitedPath: string | null
  
  // 액션
  setProjectStatus: (status: ProjectStatus) => void
  setProjectSort: (sort: ProjectSort) => void
  setAuctionStatus: (status: AuctionStatus) => void
  setAuctionSort: (sort: AuctionSort) => void
  setLastVisitedPath: (path: string | null) => void
  resetFilters: () => void
  resetFiltersIfPathChanged: (currentPath: string) => void
}

const initialState = {
  projectStatus: 'ALL' as ProjectStatus,
  projectSort: 'latest' as ProjectSort,
  auctionStatus: 'ALL' as AuctionStatus,
  auctionSort: 'latest' as AuctionSort,
  lastVisitedPath: null as string | null,
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setProjectStatus: (status) => set({ projectStatus: status }),
      setProjectSort: (sort) => set({ projectSort: sort }),
      setAuctionStatus: (status) => set({ auctionStatus: status }),
      setAuctionSort: (sort) => set({ auctionSort: sort }),
      setLastVisitedPath: (path) => set({ lastVisitedPath: path }),
      
      resetFilters: () => set({
        ...initialState,
        lastVisitedPath: get().lastVisitedPath, // 경로는 유지
      }),
      
      // 경로가 변경되었는지 확인하고, 변경되었다면 필터 초기화
      resetFiltersIfPathChanged: (currentPath: string) => {
        const state = get()
        const lastPath = state.lastVisitedPath
        
        // 필터/정렬이 기본값이 아니면 체크
        const hasActiveFilters = 
          state.projectStatus !== 'ALL' ||
          state.projectSort !== 'latest' ||
          state.auctionStatus !== 'ALL' ||
          state.auctionSort !== 'latest'
        
        // 다른 페이지에서 왔고, 필터가 활성화되어 있으면 초기화
        if (lastPath && lastPath !== currentPath && hasActiveFilters) {
          set({
            ...initialState,
            lastVisitedPath: currentPath,
          })
          return true // 초기화됨
        }
        
        // 경로 업데이트
        set({ lastVisitedPath: currentPath })
        return false // 초기화 안 됨
      },
    }),
    {
      name: 'ddip-filters', // localStorage 키
    }
  )
)

// 필터링 및 정렬 유틸리티 함수
export const filterAndSortProjects = (
  projects: ProjectResponse[],
  status: ProjectStatus,
  sort: ProjectSort
): ProjectResponse[] => {
  // 상태 필터링
  let filtered = projects
  if (status !== 'ALL') {
    filtered = projects.filter(project => project.status === status)
  }
  
  // 정렬
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
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
}

export const filterAndSortAuctions = (
  auctions: AuctionResponse[],
  status: AuctionStatus,
  sort: AuctionSort
): AuctionResponse[] => {
  // 상태 필터링
  let filtered = auctions
  if (status !== 'ALL') {
    filtered = auctions.filter(auction => auction.status === status)
  }
  
  // 정렬
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'latest':
        return b.id - a.id // ID가 타임스탬프이므로 큰 순서대로
      case 'price':
        // 현재가 순
        return b.currentPrice - a.currentPrice
      case 'ending':
        // 마감 임박순
        const endTimeA = new Date(a.endAt).getTime()
        const endTimeB = new Date(b.endAt).getTime()
        return endTimeA - endTimeB
      case 'bidCount':
        // 입찰 횟수 순 (현재는 0이므로 ID 순으로 대체)
        return b.id - a.id
      default:
        return 0
    }
  })
  
  return sorted
}
