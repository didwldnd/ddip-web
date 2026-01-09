import {
  UserResponse,
  ProjectResponse,
  AuctionResponse,
  RewardTierResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  SupportRequest,
  SupportResponse,
  BidResponse,
  OAuthProvider,
  OAuthCallbackRequest,
} from '@/src/types/api';
import { tokenStorage } from '@/src/lib/auth';

// 인메모리 저장소 (Mock API용)
const projectStore = new Map<number, ProjectResponse>();
const auctionStore = new Map<number, AuctionResponse>();
const supportStore = new Map<number, SupportResponse>();
const bidStore = new Map<number, BidResponse>();

// 이미지 저장소 (메모리 전용, localStorage에 저장하지 않음)
const imageStore = new Map<string, string>(); // key: "project-{id}" or "auction-{id}", value: base64 image

// localStorage 키
const PROJECT_STORE_KEY = 'ddip_projects';
const AUCTION_STORE_KEY = 'ddip_auctions';
const SUPPORT_STORE_KEY = 'ddip_supports';
const BID_STORE_KEY = 'ddip_bids';

// localStorage에서 데이터 로드
function loadProjectsFromStorage(): void {
  try {
    const stored = localStorage.getItem(PROJECT_STORE_KEY);
    if (stored) {
      const projects = JSON.parse(stored) as ProjectResponse[];
      projects.forEach(project => {
        projectStore.set(project.id, project);
      });
      console.log(`localStorage에서 ${projects.length}개 프로젝트 로드됨`);
    }
  } catch (error) {
    console.error('프로젝트 로드 실패:', error);
  }
}

function loadAuctionsFromStorage(): void {
  try {
    const stored = localStorage.getItem(AUCTION_STORE_KEY);
    if (stored) {
      const auctions = JSON.parse(stored) as AuctionResponse[];
      auctions.forEach(auction => {
        // 이미지는 localStorage에 저장하지 않으므로 null로 설정
        const auctionWithoutImages = {
          ...auction,
          imageUrl: null,
          imageUrls: null,
        };
        auctionStore.set(auction.id, auctionWithoutImages);
      });
      console.log(`localStorage에서 ${auctions.length}개 경매 로드됨 (이미지는 메모리에만 저장)`);
    }
  } catch (error) {
    console.error('경매 로드 실패:', error);
  }
}

// localStorage에 데이터 저장 (할당량 초과 시 오래된 항목 삭제)
function saveProjectsToStorage(): void {
  try {
    const projects = Array.from(projectStore.values());
    const dataString = JSON.stringify(projects);
    
    try {
      localStorage.setItem(PROJECT_STORE_KEY, dataString);
    } catch (error) {
      // QuotaExceededError 처리: 오래된 항목 삭제 후 재시도
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage 할당량 초과. 오래된 프로젝트를 삭제합니다.');
        
        // 생성일 기준으로 정렬하여 최신 항목만 유지 (최대 50개)
        const sortedProjects = projects
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 50);
        
        // 이미지 완전 제거하여 크기 최소화 (base64 이미지가 너무 큼)
        const trimmedProjects = sortedProjects.map(project => ({
          ...project,
          imageUrls: null, // 이미지 제거
          imageUrl: null, // 이미지 제거
        }));
        
        try {
          localStorage.setItem(PROJECT_STORE_KEY, JSON.stringify(trimmedProjects));
          console.log(`프로젝트 저장 성공 (${trimmedProjects.length}개 유지, 이미지 제거됨)`);
        } catch (retryError) {
          console.error('프로젝트 저장 재시도 실패:', retryError);
          // 더 적은 개수로 재시도 (최대 20개)
          const furtherTrimmed = sortedProjects.slice(0, 20).map(project => ({
            ...project,
            imageUrls: null,
            imageUrl: null,
          }));
          
          try {
            localStorage.setItem(PROJECT_STORE_KEY, JSON.stringify(furtherTrimmed));
            console.log(`프로젝트 저장 성공 (${furtherTrimmed.length}개만 유지)`);
          } catch (finalError) {
            // 최후의 수단: localStorage 비우기
            try {
              localStorage.removeItem(PROJECT_STORE_KEY);
              console.warn('localStorage에서 프로젝트 데이터를 삭제했습니다.');
            } catch (clearError) {
              console.error('localStorage 삭제 실패:', clearError);
            }
          }
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('프로젝트 저장 실패:', error);
  }
}

function saveAuctionsToStorage(): void {
  try {
    const auctions = Array.from(auctionStore.values());
    const dataString = JSON.stringify(auctions);
    
    try {
      localStorage.setItem(AUCTION_STORE_KEY, dataString);
    } catch (error) {
      // QuotaExceededError 처리: 오래된 항목 삭제 후 재시도
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage 할당량 초과. 오래된 경매를 삭제합니다.');
        
        // 생성일 기준으로 정렬하여 최신 항목만 유지 (최대 50개)
        const sortedAuctions = auctions
          .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
          .slice(0, 50);
        
        // 이미지 완전 제거하여 크기 최소화 (base64 이미지가 너무 큼)
        const trimmedAuctions = sortedAuctions.map(auction => ({
          ...auction,
          imageUrls: null, // 이미지 제거
          imageUrl: null, // 이미지 제거
        }));
        
        try {
          localStorage.setItem(AUCTION_STORE_KEY, JSON.stringify(trimmedAuctions));
          console.log(`경매 저장 성공 (${trimmedAuctions.length}개 유지, 이미지 제거됨)`);
        } catch (retryError) {
          console.error('경매 저장 재시도 실패:', retryError);
          // 더 적은 개수로 재시도 (최대 20개)
          const furtherTrimmed = sortedAuctions.slice(0, 20).map(auction => ({
            ...auction,
            imageUrls: null,
            imageUrl: null,
          }));
          
          try {
            localStorage.setItem(AUCTION_STORE_KEY, JSON.stringify(furtherTrimmed));
            console.log(`경매 저장 성공 (${furtherTrimmed.length}개만 유지)`);
          } catch (finalError) {
            // 최후의 수단: localStorage 비우기
            try {
              localStorage.removeItem(AUCTION_STORE_KEY);
              console.warn('localStorage에서 경매 데이터를 삭제했습니다.');
            } catch (clearError) {
              console.error('localStorage 삭제 실패:', clearError);
            }
          }
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('경매 저장 실패:', error);
  }
}

function loadSupportsFromStorage(): void {
  try {
    const stored = localStorage.getItem(SUPPORT_STORE_KEY);
    if (stored) {
      const supports = JSON.parse(stored) as SupportResponse[];
      supports.forEach(support => {
        supportStore.set(support.id, support);
      });
      console.log(`localStorage에서 ${supports.length}개 후원 내역 로드됨`);
    }
  } catch (error) {
    console.error('후원 내역 로드 실패:', error);
  }
}

function saveSupportsToStorage(): void {
  try {
    const supports = Array.from(supportStore.values());
    localStorage.setItem(SUPPORT_STORE_KEY, JSON.stringify(supports));
  } catch (error) {
    console.error('후원 내역 저장 실패:', error);
  }
}

function loadBidsFromStorage(): void {
  try {
    const stored = localStorage.getItem(BID_STORE_KEY);
    if (stored) {
      const bids = JSON.parse(stored) as BidResponse[];
      bids.forEach(bid => {
        bidStore.set(bid.id, bid);
      });
      console.log(`localStorage에서 ${bids.length}개 입찰 내역 로드됨`);
    }
  } catch (error) {
    console.error('입찰 내역 로드 실패:', error);
  }
}

function saveBidsToStorage(): void {
  try {
    const bids = Array.from(bidStore.values());
    localStorage.setItem(BID_STORE_KEY, JSON.stringify(bids));
  } catch (error) {
    console.error('입찰 내역 저장 실패:', error);
  }
}

// 초기화 시 localStorage에서 로드
if (typeof window !== 'undefined') {
  loadProjectsFromStorage();
  loadAuctionsFromStorage();
  loadSupportsFromStorage();
  loadBidsFromStorage();
}

// Mock 데이터 생성 함수들
const createMockUser = (id: number, overrides?: Partial<UserResponse>): UserResponse => ({
  id,
  email: `user${id}@example.com`,
  name: `사용자${id}`,
  nickname: `nickname${id}`,
  profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
  phone: `010-${String(id).padStart(4, '0')}-${String(id * 2).padStart(4, '0')}`,
  ...overrides,
});

// 현재 로그인한 사용자 정보 가져오기
function getCurrentUser(): UserResponse {
  const savedUser = tokenStorage.getUser();
  if (savedUser) {
    return savedUser;
  }
  // 사용자 정보가 없으면 기본 Mock 사용자 반환 (비로그인 상태)
  return createMockUser(1);
}

const createMockRewardTier = (
  id: number,
  overrides?: Partial<RewardTierResponse>
): RewardTierResponse => ({
  id,
  title: `리워드 티어 ${id}`,
  description: `리워드 티어 ${id}에 대한 설명입니다.`,
  price: (id + 1) * 10000,
  limitQuantity: id % 2 === 0 ? 100 : null,
  soldQuantity: Math.floor(Math.random() * 50),
  ...overrides,
});

const createMockProject = (
  id: number,
  overrides?: Partial<ProjectResponse>
): ProjectResponse => {
  const creator = createMockUser(id);
  const rewardTiers = [
    createMockRewardTier(id * 10 + 1),
    createMockRewardTier(id * 10 + 2),
    createMockRewardTier(id * 10 + 3),
  ];

  const statuses: ProjectResponse['status'][] = [
    'DRAFT',
    'OPEN',
    'SUCCESS',
    'FAILED',
    'CANCELED',
  ];
  const status = statuses[id % statuses.length];

  // 기본 날짜 생성 (안전하게)
  // id가 타임스탬프처럼 큰 숫자면 작은 값으로 변환
  const normalizedId = id > 1000000 ? id % 1000 : id
  const defaultStartDate = new Date(Date.now() - normalizedId * 86400000)
  const defaultEndDate = new Date(Date.now() + (30 - normalizedId) * 86400000)
  const defaultCreatedAt = new Date(Date.now() - (normalizedId + 10) * 86400000)

  // overrides의 날짜가 유효한지 검증
  // 이미 ISO 문자열이면 그대로 사용, 아니면 파싱 후 변환
  let startAt: string
  let endAt: string
  let createdAt: string

  if (overrides?.startAt) {
    // 이미 ISO 문자열 형식인지 확인
    if (typeof overrides.startAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(overrides.startAt)) {
      // 이미 ISO 형식이면 그대로 사용
      const date = new Date(overrides.startAt)
      if (isNaN(date.getTime())) {
        console.error("Invalid startAt ISO string:", overrides.startAt)
        startAt = defaultStartDate.toISOString()
      } else {
        startAt = overrides.startAt // 이미 ISO 형식이므로 그대로 사용
      }
    } else {
      // 다른 형식이면 파싱 후 변환
      const date = new Date(overrides.startAt)
      if (isNaN(date.getTime())) {
        console.error("Invalid startAt in overrides:", overrides.startAt)
        startAt = defaultStartDate.toISOString()
      } else {
        startAt = date.toISOString()
      }
    }
  } else {
    startAt = defaultStartDate.toISOString()
  }

  if (overrides?.endAt) {
    // 이미 ISO 문자열 형식인지 확인
    if (typeof overrides.endAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(overrides.endAt)) {
      // 이미 ISO 형식이면 그대로 사용
      const date = new Date(overrides.endAt)
      if (isNaN(date.getTime())) {
        console.error("Invalid endAt ISO string:", overrides.endAt)
        endAt = defaultEndDate.toISOString()
      } else {
        endAt = overrides.endAt // 이미 ISO 형식이므로 그대로 사용
      }
    } else {
      // 다른 형식이면 파싱 후 변환
      const date = new Date(overrides.endAt)
      if (isNaN(date.getTime())) {
        console.error("Invalid endAt in overrides:", overrides.endAt)
        endAt = defaultEndDate.toISOString()
      } else {
        endAt = date.toISOString()
      }
    }
  } else {
    endAt = defaultEndDate.toISOString()
  }

  if (overrides?.createdAt) {
    const date = new Date(overrides.createdAt)
    if (isNaN(date.getTime())) {
      console.error("Invalid createdAt in overrides:", overrides.createdAt)
      createdAt = defaultCreatedAt.toISOString()
    } else {
      createdAt = date.toISOString()
    }
  } else {
    createdAt = defaultCreatedAt.toISOString()
  }

  // imageUrls가 있으면 첫 번째를 imageUrl로 설정, 없으면 기본값 사용
  const defaultImageUrl = `https://picsum.photos/800/600?random=${id}`
  const imageUrls = overrides?.imageUrls || null
  const imageUrl = imageUrls && imageUrls.length > 0 ? imageUrls[0] : (overrides?.imageUrl || defaultImageUrl)

  // overrides를 먼저 스프레드하고, 검증된 날짜로 덮어쓰기
  return {
    id,
    creator,
    title: `프로젝트 제목 ${id}`,
    description: `프로젝트 ${id}에 대한 상세 설명입니다.`,
    // 기본값 설정 (overrides에 없을 경우에만 사용)
    targetAmount: overrides?.targetAmount ?? 1000000,
    currentAmount: overrides?.currentAmount ?? Math.floor(Math.random() * 1000000),
    status: overrides?.status ?? status,
    rewardTiers: overrides?.rewardTiers ?? rewardTiers,
    // overrides의 다른 필드들
    ...overrides,
    // 날짜는 위에서 검증된 값으로 덮어쓰기 (overrides의 날짜가 유효하지 않을 수 있으므로)
    startAt,
    endAt,
    createdAt,
    // imageUrl과 imageUrls는 위에서 처리한 값으로 덮어쓰기 (overrides보다 나중에 설정하여 덮어쓰기)
    imageUrl,
    imageUrls,
  };
};

const createMockAuction = (
  id: number,
  overrides?: Partial<AuctionResponse>
): AuctionResponse => {
  const seller = createMockUser(id);
  const statuses: AuctionResponse['status'][] = [
    'SCHEDULED',
    'RUNNING',
    'ENDED',
    'CANCELED',
  ];
  const status = statuses[id % statuses.length];
  const winner = status === 'ENDED' ? createMockUser(id + 100) : null;

  // 기본 날짜 생성 (안전하게)
  // overrides에 날짜가 없을 때만 기본 날짜 생성
  // id가 타임스탬프처럼 큰 숫자면 작은 값으로 변환
  const normalizedId = id > 1000000 ? id % 1000 : id
  const defaultStartDate = new Date(Date.now() - normalizedId * 86400000)
  const defaultEndDate = new Date(Date.now() + (7 - normalizedId) * 86400000)

  // overrides의 날짜가 유효한지 검증
  // 이미 ISO 문자열이면 그대로 사용, 아니면 파싱 후 변환
  let startAt: string
  let endAt: string

  if (overrides?.startAt) {
    // 이미 ISO 문자열 형식인지 확인
    if (typeof overrides.startAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(overrides.startAt)) {
      // 이미 ISO 형식이면 그대로 사용
      const date = new Date(overrides.startAt)
      if (isNaN(date.getTime())) {
        console.error("Invalid startAt ISO string:", overrides.startAt)
        startAt = defaultStartDate.toISOString()
      } else {
        startAt = overrides.startAt // 이미 ISO 형식이므로 그대로 사용
      }
    } else {
      // 다른 형식이면 파싱 후 변환
      const date = new Date(overrides.startAt)
      if (isNaN(date.getTime())) {
        console.error("Invalid startAt in overrides:", overrides.startAt)
        startAt = defaultStartDate.toISOString()
      } else {
        startAt = date.toISOString()
      }
    }
  } else {
    startAt = defaultStartDate.toISOString()
  }

  if (overrides?.endAt) {
    // 이미 ISO 문자열 형식인지 확인
    if (typeof overrides.endAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(overrides.endAt)) {
      // 이미 ISO 형식이면 그대로 사용
      const date = new Date(overrides.endAt)
      if (isNaN(date.getTime())) {
        console.error("Invalid endAt ISO string:", overrides.endAt)
        endAt = defaultEndDate.toISOString()
      } else {
        endAt = overrides.endAt // 이미 ISO 형식이므로 그대로 사용
      }
    } else {
      // 다른 형식이면 파싱 후 변환
      const date = new Date(overrides.endAt)
      if (isNaN(date.getTime())) {
        console.error("Invalid endAt in overrides:", overrides.endAt)
        endAt = defaultEndDate.toISOString()
      } else {
        endAt = date.toISOString()
      }
    }
  } else {
    endAt = defaultEndDate.toISOString()
  }

  // imageUrls가 있으면 첫 번째를 imageUrl로 설정, 없으면 기본값 사용
  const defaultImageUrl = `https://picsum.photos/800/600?random=${id + 1000}`
  const imageUrls = overrides?.imageUrls || null
  const imageUrl = imageUrls && imageUrls.length > 0 ? imageUrls[0] : (overrides?.imageUrl || defaultImageUrl)

  // overrides를 먼저 스프레드하고, 검증된 날짜로 덮어쓰기
  return {
    id,
    seller,
    title: `경매 상품 ${id}`,
    description: `경매 상품 ${id}에 대한 상세 설명입니다.`,
    startPrice: 50000,
    currentPrice: 50000 + id * 10000,
    bidStep: 5000,
    buyoutPrice: id % 2 === 0 ? 200000 : null,
    status,
    winner,
    ...overrides,
    // 날짜는 위에서 검증된 값으로 덮어쓰기 (overrides의 날짜가 유효하지 않을 수 있으므로)
    startAt,
    endAt,
    // imageUrl과 imageUrls는 위에서 처리한 값으로 덮어쓰기 (overrides보다 나중에 설정하여 덮어쓰기)
    imageUrl,
    imageUrls,
  };
};

// API 함수들 - 프로젝트 관련
export const projectApi = {
  /**
   * 프로젝트 목록 조회
   */
  getProjects: async (params?: {
    status?: ProjectResponse['status'];
    page?: number;
    limit?: number;
  }): Promise<ProjectResponse[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    // localStorage에서 저장된 프로젝트 가져오기
    const storedProjects = Array.from(projectStore.values());
    
    // 상태 필터링
    let filteredProjects = storedProjects;
    if (params?.status) {
      filteredProjects = storedProjects.filter(project => project.status === params.status);
    }
    
    // 최신순 정렬 (ID가 타임스탬프이므로 큰 순서대로)
    filteredProjects.sort((a, b) => b.id - a.id);
    
    // limit 적용
    const limit = params?.limit || 10;
    return filteredProjects.slice(0, limit);
  },

  /**
   * 프로젝트 상세 조회
   */
  getProject: async (id: number): Promise<ProjectResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // 저장된 프로젝트가 있으면 반환
    const storedProject = projectStore.get(id);
    if (storedProject) {
      // 메모리에서 이미지 복원
      const imageUrls: string[] = [];
      for (let i = 0; i < 3; i++) {
        const imageKey = `project-${id}-${i}`;
        const image = imageStore.get(imageKey);
        if (image) {
          imageUrls.push(image);
        }
      }
      
      const projectWithImages = {
        ...storedProject,
        imageUrl: imageUrls[0] || storedProject.imageUrl,
        imageUrls: imageUrls.length > 0 ? imageUrls : storedProject.imageUrls,
      };
      
      console.log("저장된 프로젝트 반환:", { id, title: projectWithImages.title });
      return projectWithImages;
    }
    
    // 없으면 기본 Mock 데이터 반환
    console.log("기본 Mock 프로젝트 반환:", id);
    return createMockProject(id);
  },

  /**
   * 프로젝트 생성
   */
  createProject: async (
    data: Omit<ProjectResponse, 'id' | 'creator' | 'createdAt'>
  ): Promise<ProjectResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // 날짜 유효성 검사 및 로깅
    console.log("createProject received data:", {
      startAt: data.startAt,
      endAt: data.endAt,
      startAtType: typeof data.startAt,
      endAtType: typeof data.endAt
    })
    
    // startAt과 endAt이 이미 ISO 문자열인지 확인
    if (data.startAt && typeof data.startAt === 'string') {
      const startDate = new Date(data.startAt)
      if (isNaN(startDate.getTime())) {
        console.error("Invalid startAt in createProject:", data.startAt)
        throw new Error("유효하지 않은 시작일입니다")
      }
    }
    
    if (data.endAt && typeof data.endAt === 'string') {
      const endDate = new Date(data.endAt)
      if (isNaN(endDate.getTime())) {
        console.error("Invalid endAt in createProject:", data.endAt)
        throw new Error("유효하지 않은 종료일입니다")
      }
    }
    
    const projectId = Date.now();
    const currentUser = getCurrentUser();
    
    // 이미지를 메모리에 저장 (localStorage 할당량 문제 방지)
    if (data.imageUrls && data.imageUrls.length > 0) {
      data.imageUrls.forEach((imageUrl, index) => {
        imageStore.set(`project-${projectId}-${index}`, imageUrl);
      });
    } else if (data.imageUrl) {
      imageStore.set(`project-${projectId}-0`, data.imageUrl);
    }
    
    // localStorage에는 이미지 없이 저장
    const dataWithoutImages = {
      ...data,
      imageUrl: null,
      imageUrls: null,
    };
    
    const result = createMockProject(projectId, {
      ...dataWithoutImages,
      creator: currentUser,
      createdAt: new Date().toISOString(),
    });
    
    // 메모리에는 이미지 포함하여 저장
    const resultWithImages = {
      ...result,
      imageUrl: data.imageUrl,
      imageUrls: data.imageUrls,
    };
    
    // 생성한 프로젝트를 저장소에 저장
    projectStore.set(projectId, resultWithImages);
    saveProjectsToStorage(); // localStorage에는 이미지 없이 저장
    
    console.log("createProject result:", {
      id: result.id,
      title: result.title,
      startAt: result.startAt,
      endAt: result.endAt
    })
    
    return result
  },

  /**
   * 프로젝트 수정
   */
  updateProject: async (
    id: number,
    data: Partial<ProjectResponse>
  ): Promise<ProjectResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // 기존 프로젝트 가져오기
    const existingProject = projectStore.get(id);
    const updatedProject = createMockProject(id, {
      ...existingProject,
      ...data,
    });
    
    // 저장소에 업데이트된 프로젝트 저장
    projectStore.set(id, updatedProject);
    saveProjectsToStorage(); // localStorage에도 저장
    
    return updatedProject;
  },

  /**
   * 프로젝트 삭제
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteProject: async (id: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // 저장소에서 프로젝트 삭제
    projectStore.delete(id);
    saveProjectsToStorage(); // localStorage에도 반영
  },

  /**
   * 프로젝트 후원하기
   */
  supportProject: async (data: SupportRequest): Promise<SupportResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // 프로젝트 가져오기
    const project = projectStore.get(data.projectId);
    if (!project) {
      throw new Error('프로젝트를 찾을 수 없습니다');
    }

    // 프로젝트 상태 확인
    if (project.status !== 'OPEN') {
      throw new Error('진행 중인 프로젝트에만 후원할 수 있습니다');
    }

    // 리워드 티어 찾기
    const rewardTier = project.rewardTiers.find(tier => tier.id === data.rewardTierId);
    if (!rewardTier) {
      throw new Error('리워드 티어를 찾을 수 없습니다');
    }

    // 후원 금액 검증
    if (data.amount < rewardTier.price) {
      throw new Error(`최소 후원 금액은 ${rewardTier.price.toLocaleString()}원입니다`);
    }

    // 리워드 티어 한정 수량 확인
    if (rewardTier.limitQuantity !== null && rewardTier.soldQuantity >= rewardTier.limitQuantity) {
      throw new Error('해당 리워드 티어의 한정 수량이 모두 소진되었습니다');
    }

    // 목표 금액 초과 확인 (선택사항 - 경고만)
    if (project.currentAmount + data.amount > project.targetAmount) {
      console.warn('후원 금액이 목표 금액을 초과합니다');
    }

    // 현재 로그인한 사용자 정보 가져오기
    const currentUser = getCurrentUser();

    // 후원 내역 생성
    const supportId = Date.now();
    const support: SupportResponse = {
      id: supportId,
      projectId: data.projectId,
      projectTitle: project.title,
      rewardTierId: data.rewardTierId,
      rewardTierTitle: rewardTier.title,
      amount: data.amount,
      supporter: currentUser,
      createdAt: new Date().toISOString(),
    };

    // 후원 내역 저장
    supportStore.set(supportId, support);
    saveSupportsToStorage();

    // 프로젝트 업데이트: 현재 금액 증가, 리워드 티어 판매 수량 증가
    const updatedProject = {
      ...project,
      currentAmount: project.currentAmount + data.amount,
      rewardTiers: project.rewardTiers.map(tier =>
        tier.id === data.rewardTierId
          ? { ...tier, soldQuantity: tier.soldQuantity + 1 }
          : tier
      ),
    };

    projectStore.set(data.projectId, updatedProject);
    saveProjectsToStorage();

    return support;
  },

  /**
   * 사용자의 후원 내역 조회
   */
  getMySupports: async (userId?: number): Promise<SupportResponse[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // Mock: userId가 없으면 모든 후원 내역 반환 (실제로는 인증된 사용자 ID 사용)
    const supports = Array.from(supportStore.values());
    if (userId) {
      return supports.filter(support => support.supporter.id === userId);
    }
    return supports.sort((a, b) => b.id - a.id); // 최신순
  },

  /**
   * 프로젝트 상태 자동 체크 및 업데이트
   * 종료 시간이 지났고 OPEN 상태면 목표 달성 여부로 SUCCESS/FAILED 전이
   */
  checkAndUpdateProjectStatus: async (projectId: number): Promise<ProjectResponse | null> => {
    const project = projectStore.get(projectId);
    if (!project) {
      return null;
    }

    const now = new Date();
    const endTime = new Date(project.endAt);
    
    // 종료 시간이 지났고 OPEN 상태인 경우
    if (project.status === 'OPEN' && now >= endTime) {
      const newStatus: 'SUCCESS' | 'FAILED' = project.currentAmount >= project.targetAmount ? 'SUCCESS' : 'FAILED';
      
      const updatedProject = {
        ...project,
        status: newStatus,
      };
      
      projectStore.set(projectId, updatedProject);
      saveProjectsToStorage();
      
      console.log(`프로젝트 ${projectId} 상태 전이: OPEN → ${newStatus}`);
      return updatedProject;
    }

    // 시작 시간이 지났고 DRAFT 상태인 경우 OPEN으로 전이
    const startTime = new Date(project.startAt);
    if (project.status === 'DRAFT' && now >= startTime) {
      const updatedProject = {
        ...project,
        status: 'OPEN' as const,
      };
      
      projectStore.set(projectId, updatedProject);
      saveProjectsToStorage();
      
      console.log(`프로젝트 ${projectId} 상태 전이: DRAFT → OPEN`);
      return updatedProject;
    }

    return project;
  },

  /**
   * 모든 프로젝트 상태 일괄 체크 및 업데이트
   */
  checkAllProjectsStatus: async (): Promise<void> => {
    const projects = Array.from(projectStore.values());
    for (const project of projects) {
      await projectApi.checkAndUpdateProjectStatus(project.id);
    }
  },

  /**
   * 통계 정보 조회
   */
  getStatistics: async (): Promise<{
    totalAmount: number;      // 누적 후원금액
    totalParticipants: number; // 참여자 수
    activeProjects: number;     // 진행 중인 프로젝트 수
  }> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const projects = Array.from(projectStore.values());
    
    // 누적 후원금액: 모든 프로젝트의 currentAmount 합계
    const totalAmount = projects.reduce((sum, project) => sum + project.currentAmount, 0);
    
    // 참여자 수: 모든 프로젝트의 rewardTiers의 soldQuantity 합계
    const totalParticipants = projects.reduce((sum, project) => {
      const backers = project.rewardTiers.reduce((tierSum, tier) => tierSum + tier.soldQuantity, 0);
      return sum + backers;
    }, 0);
    
    // 진행 중인 프로젝트 수: status가 'OPEN'인 프로젝트 수
    const activeProjects = projects.filter(project => project.status === 'OPEN').length;
    
    return {
      totalAmount,
      totalParticipants,
      activeProjects,
    };
  },

  /**
   * 프로젝트 검색
   */
  searchProjects: async (query: string, params?: {
    status?: ProjectResponse['status'];
    limit?: number;
  }): Promise<ProjectResponse[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!query || query.trim() === '') {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const storedProjects = Array.from(projectStore.values());

    // 제목, 설명, 태그에서 검색
    let filteredProjects = storedProjects.filter(project => {
      const titleMatch = project.title.toLowerCase().includes(searchTerm);
      const descriptionMatch = project.description.toLowerCase().includes(searchTerm);
      const tagsMatch = project.tags?.toLowerCase().includes(searchTerm) || false;
      const summaryMatch = project.summary?.toLowerCase().includes(searchTerm) || false;
      
      return titleMatch || descriptionMatch || tagsMatch || summaryMatch;
    });

    // 상태 필터링
    if (params?.status) {
      filteredProjects = filteredProjects.filter(project => project.status === params.status);
    }

    // 최신순 정렬
    filteredProjects.sort((a, b) => b.id - a.id);

    // limit 적용
    const limit = params?.limit || 50;
    return filteredProjects.slice(0, limit);
  },
};

// API 함수들 - 경매 관련
export const auctionApi = {
  /**
   * 경매 목록 조회
   */
  getAuctions: async (params?: {
    status?: AuctionResponse['status'];
    page?: number;
    limit?: number;
  }): Promise<AuctionResponse[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    // localStorage에서 저장된 경매 가져오기
    const storedAuctions = Array.from(auctionStore.values());
    
    // 상태 필터링
    let filteredAuctions = storedAuctions;
    if (params?.status) {
      filteredAuctions = storedAuctions.filter(auction => auction.status === params.status);
    }
    
    // 최신순 정렬 (ID가 타임스탬프이므로 큰 순서대로)
    filteredAuctions.sort((a, b) => b.id - a.id);
    
    // limit 적용
    const limit = params?.limit || 10;
    return filteredAuctions.slice(0, limit);
  },

  /**
   * 경매 상세 조회
   */
  getAuction: async (id: number): Promise<AuctionResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // 저장된 경매가 있으면 반환
    const storedAuction = auctionStore.get(id);
    if (storedAuction) {
      // 메모리에서 이미지 복원
      const imageUrls: string[] = [];
      for (let i = 0; i < 3; i++) {
        const imageKey = `auction-${id}-${i}`;
        const image = imageStore.get(imageKey);
        if (image) {
          imageUrls.push(image);
        }
      }
      
      const auctionWithImages = {
        ...storedAuction,
        imageUrl: imageUrls[0] || storedAuction.imageUrl,
        imageUrls: imageUrls.length > 0 ? imageUrls : storedAuction.imageUrls,
      };
      
      console.log("저장된 경매 반환:", { id, title: auctionWithImages.title });
      return auctionWithImages;
    }
    
    // 없으면 기본 Mock 데이터 반환
    console.log("기본 Mock 경매 반환:", id);
    return createMockAuction(id);
  },

  /**
   * 경매 생성
   */
  createAuction: async (
    data: Omit<AuctionResponse, 'id' | 'seller' | 'winner'>
  ): Promise<AuctionResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // 날짜 유효성 검사 및 로깅
    console.log("createAuction received data:", {
      startAt: data.startAt,
      endAt: data.endAt,
      startAtType: typeof data.startAt,
      endAtType: typeof data.endAt
    })
    
    // startAt과 endAt이 이미 ISO 문자열인지 확인
    if (data.startAt && typeof data.startAt === 'string') {
      const startDate = new Date(data.startAt)
      if (isNaN(startDate.getTime())) {
        console.error("Invalid startAt in createAuction:", data.startAt)
        throw new Error("유효하지 않은 시작일입니다")
      }
    }
    
    if (data.endAt && typeof data.endAt === 'string') {
      const endDate = new Date(data.endAt)
      if (isNaN(endDate.getTime())) {
        console.error("Invalid endAt in createAuction:", data.endAt)
        throw new Error("유효하지 않은 종료일입니다")
      }
    }
    
    const auctionId = Date.now();
    const currentUser = getCurrentUser();
    
    // 이미지를 메모리에 저장 (localStorage 할당량 문제 방지)
    if (data.imageUrls && data.imageUrls.length > 0) {
      data.imageUrls.forEach((imageUrl, index) => {
        imageStore.set(`auction-${auctionId}-${index}`, imageUrl);
      });
    } else if (data.imageUrl) {
      imageStore.set(`auction-${auctionId}-0`, data.imageUrl);
    }
    
    // localStorage에는 이미지 없이 저장
    const dataWithoutImages = {
      ...data,
      imageUrl: null,
      imageUrls: null,
    };
    
    const result = createMockAuction(auctionId, {
      ...dataWithoutImages,
      seller: currentUser,
      winner: null,
    });
    
    // 메모리에는 이미지 포함하여 저장
    const resultWithImages = {
      ...result,
      imageUrl: data.imageUrl,
      imageUrls: data.imageUrls,
    };
    
    // 생성한 경매를 저장소에 저장
    auctionStore.set(auctionId, resultWithImages);
    saveAuctionsToStorage(); // localStorage에는 이미지 없이 저장
    
    console.log("createAuction result:", {
      id: result.id,
      title: result.title,
      startAt: result.startAt,
      endAt: result.endAt
    })
    
    return result
  },

  /**
   * 경매 수정
   */
  updateAuction: async (
    id: number,
    data: Partial<AuctionResponse>
  ): Promise<AuctionResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // 기존 경매 가져오기
    const existingAuction = auctionStore.get(id);
    const updatedAuction = createMockAuction(id, {
      ...existingAuction,
      ...data,
    });
    
    // 저장소에 업데이트된 경매 저장
    auctionStore.set(id, updatedAuction);
    saveAuctionsToStorage(); // localStorage에도 저장
    
    return updatedAuction;
  },

  /**
   * 경매 삭제
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteAuction: async (id: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // 저장소에서 경매 삭제
    auctionStore.delete(id);
    saveAuctionsToStorage(); // localStorage에도 반영
  },

  /**
   * 경매 입찰
   */
  placeBid: async (
    auctionId: number,
    bidAmount: number
  ): Promise<AuctionResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // 저장된 경매가 있으면 사용, 없으면 기본 Mock 데이터
    const existingAuction = auctionStore.get(auctionId);
    const auction = existingAuction || createMockAuction(auctionId);
    
    // 경매 상태 확인
    if (auction.status !== 'RUNNING') {
      throw new Error('진행 중인 경매에만 입찰할 수 있습니다');
    }
    
    // 입찰 금액 검증
    const minBidAmount = auction.currentPrice + auction.bidStep;
    if (bidAmount < minBidAmount) {
      throw new Error(`최소 입찰 금액은 ${minBidAmount.toLocaleString()}원입니다`);
    }
    
    // 즉시 구매가가 있고 입찰 금액이 즉시 구매가 이상이면 즉시 구매 처리
    if (auction.buyoutPrice && bidAmount >= auction.buyoutPrice) {
      // 즉시 구매 처리
      const currentUser = getCurrentUser();
      const updatedAuction = {
        ...auction,
        currentPrice: auction.buyoutPrice,
        status: 'ENDED' as const,
        winner: currentUser,
      };
      auctionStore.set(auctionId, updatedAuction);
      saveAuctionsToStorage();
      
      // 입찰 내역 저장
      const bidId = Date.now();
      const bid: BidResponse = {
        id: bidId,
        auctionId: auctionId,
        auctionTitle: auction.title,
        amount: auction.buyoutPrice,
        bidder: currentUser,
        createdAt: new Date().toISOString(),
      };
      bidStore.set(bidId, bid);
      saveBidsToStorage();
      
      return updatedAuction;
    }
    
    // 현재 로그인한 사용자 정보 가져오기
    const currentUser = getCurrentUser();
    
    // 입찰 내역 생성
    const bidId = Date.now();
    const bid: BidResponse = {
      id: bidId,
      auctionId: auctionId,
      auctionTitle: auction.title,
      amount: bidAmount,
      bidder: currentUser,
      createdAt: new Date().toISOString(),
    };
    
    // 입찰 내역 저장
    bidStore.set(bidId, bid);
    saveBidsToStorage();
    
    const updatedAuction = {
      ...auction,
      currentPrice: bidAmount,
    };
    
    // 입찰 후 업데이트된 경매를 저장소에 저장
    auctionStore.set(auctionId, updatedAuction);
    saveAuctionsToStorage(); // localStorage에도 저장
    
    return updatedAuction;
  },

  /**
   * 특정 경매의 입찰 내역 조회
   */
  getBidsByAuction: async (auctionId: number): Promise<BidResponse[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const bids = Array.from(bidStore.values());
    const auctionBids = bids
      .filter(bid => bid.auctionId === auctionId)
      .sort((a, b) => b.id - a.id); // 최신순 (가장 최근 입찰이 위로)
    
    return auctionBids;
  },

  /**
   * 사용자의 입찰 내역 조회
   */
  getMyBids: async (userId?: number): Promise<BidResponse[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // Mock: userId가 없으면 모든 입찰 내역 반환 (실제로는 인증된 사용자 ID 사용)
    const bids = Array.from(bidStore.values());
    if (userId) {
      return bids.filter(bid => bid.bidder.id === userId);
    }
    return bids.sort((a, b) => b.id - a.id); // 최신순
  },

  /**
   * 경매 상태 자동 체크 및 업데이트
   * 시작 시간이 지났고 SCHEDULED 상태면 RUNNING으로 전이
   * 종료 시간이 지났고 RUNNING 상태면 ENDED로 전이하고 낙찰자 확정
   */
  checkAndUpdateAuctionStatus: async (auctionId: number): Promise<AuctionResponse | null> => {
    const auction = auctionStore.get(auctionId);
    if (!auction) {
      return null;
    }

    const now = new Date();
    const startTime = new Date(auction.startAt);
    const endTime = new Date(auction.endAt);
    
    // 시작 시간이 지났고 SCHEDULED 상태인 경우 RUNNING으로 전이
    if (auction.status === 'SCHEDULED' && now >= startTime && now < endTime) {
      const updatedAuction = {
        ...auction,
        status: 'RUNNING' as const,
      };
      
      auctionStore.set(auctionId, updatedAuction);
      saveAuctionsToStorage();
      
      console.log(`경매 ${auctionId} 상태 전이: SCHEDULED → RUNNING`);
      return updatedAuction;
    }

    // 종료 시간이 지났고 RUNNING 상태인 경우 ENDED로 전이하고 낙찰자 확정
    if (auction.status === 'RUNNING' && now >= endTime) {
      // 최고 입찰자 찾기
      const bids = Array.from(bidStore.values())
        .filter(bid => bid.auctionId === auctionId)
        .sort((a, b) => b.amount - a.amount); // 금액 내림차순
      
      const winner = bids.length > 0 ? bids[0].bidder : null;
      const finalPrice = bids.length > 0 ? bids[0].amount : auction.currentPrice;
      
      const updatedAuction = {
        ...auction,
        status: 'ENDED' as const,
        currentPrice: finalPrice,
        winner: winner,
      };
      
      auctionStore.set(auctionId, updatedAuction);
      saveAuctionsToStorage();
      
      console.log(`경매 ${auctionId} 상태 전이: RUNNING → ENDED`, {
        winner: winner?.id,
        finalPrice,
      });
      return updatedAuction;
    }

    return auction;
  },

  /**
   * 모든 경매 상태 일괄 체크 및 업데이트
   */
  checkAllAuctionsStatus: async (): Promise<void> => {
    const auctions = Array.from(auctionStore.values());
    for (const auction of auctions) {
      await auctionApi.checkAndUpdateAuctionStatus(auction.id);
    }
  },

  /**
   * 경매 검색
   */
  searchAuctions: async (query: string, params?: {
    status?: AuctionResponse['status'];
    limit?: number;
  }): Promise<AuctionResponse[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!query || query.trim() === '') {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const storedAuctions = Array.from(auctionStore.values());

    // 제목, 설명, 태그에서 검색
    let filteredAuctions = storedAuctions.filter(auction => {
      const titleMatch = auction.title.toLowerCase().includes(searchTerm);
      const descriptionMatch = auction.description.toLowerCase().includes(searchTerm);
      const tagsMatch = auction.tags?.toLowerCase().includes(searchTerm) || false;
      const summaryMatch = auction.summary?.toLowerCase().includes(searchTerm) || false;
      
      return titleMatch || descriptionMatch || tagsMatch || summaryMatch;
    });

    // 상태 필터링
    if (params?.status) {
      filteredAuctions = filteredAuctions.filter(auction => auction.status === params.status);
    }

    // 최신순 정렬
    filteredAuctions.sort((a, b) => b.id - a.id);

    // limit 적용
    const limit = params?.limit || 50;
    return filteredAuctions.slice(0, limit);
  },
};

// API 함수들 - 사용자 관련
export const userApi = {
  /**
   * 사용자 정보 조회
   */
  getUser: async (id: number): Promise<UserResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return createMockUser(id);
  },

  /**
   * 현재 로그인한 사용자 정보 조회
   */
  getCurrentUser: async (): Promise<UserResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return createMockUser(1);
  },

  /**
   * 사용자 정보 수정
   */
  updateUser: async (
    id: number,
    data: Partial<UserResponse>
  ): Promise<UserResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return createMockUser(id, data);
  },
};

// API 함수들 - 인증 관련
export const authApi = {
  /**
   * 로그인
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Mock: 이메일과 비밀번호 검증 (실제로는 백엔드에서 처리)
    if (data.email && data.password) {
      const user = createMockUser(1, {
        email: data.email,
        name: '사용자',
        nickname: 'nickname1',
      });
      
      return {
        accessToken: `mock-access-token-${Date.now()}`,
        refreshToken: `mock-refresh-token-${Date.now()}`,
        user,
      };
    }
    
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');
  },

  /**
   * 회원가입
   * POST /api/users/register
   * 백엔드에서 UserResponseDto만 반환하므로, 회원가입 후 자동 로그인 처리
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    
    try {
      // 회원가입 요청
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          username: data.username,
          nickname: data.nickname,
          phoneNumber: data.phoneNumber,
          account: data.account || null,
          accountHolder: data.accountHolder || null,
          bankType: data.bankType || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '회원가입 실패' }));
        throw new Error(errorData.message || '회원가입에 실패했습니다');
      }

      // 백엔드에서 UserResponseDto 반환 (토큰 없음)
      const userData = await response.json();
      
      // 백엔드가 토큰을 함께 반환하는 경우
      if (userData.accessToken) {
        return {
          accessToken: userData.accessToken,
          refreshToken: userData.refreshToken,
          user: userData.user || userData,
        };
      }
      
      // 백엔드가 UserResponseDto만 반환하는 경우, 자동 로그인 처리
      // 회원가입 후 자동 로그인을 위해 로그인 API 호출
      const loginResponse = await authApi.login({
        email: data.email,
        password: data.password,
      });
      
      return loginResponse;
    } catch (error) {
      console.error('회원가입 실패:', error);
      
      // 네트워크 오류인 경우 더 명확한 메시지 제공
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      }
      
      throw error instanceof Error ? error : new Error('회원가입에 실패했습니다');
    }
  },

  /**
   * 로그아웃
   */
  logout: async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // Mock: 토큰 삭제는 클라이언트에서 처리
  },

  /**
   * 토큰 갱신
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const user = createMockUser(1);
    return {
      accessToken: `mock-access-token-${Date.now()}`,
      refreshToken: `mock-refresh-token-${Date.now()}`,
      user,
    };
  },

  /**
   * 현재 사용자 정보 조회 (토큰으로)
   */
  getCurrentUser: async (): Promise<UserResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const savedUser = tokenStorage.getUser();
    if (savedUser) {
      return savedUser;
    }
    // 토큰이 없으면 에러 발생 (실제로는 인증 필요)
    throw new Error('로그인이 필요합니다');
  },

  /**
   * OAuth 로그인 시작 (백엔드로 리다이렉트)
   * @param provider OAuth 제공자 (google, kakao, naver)
   * @returns OAuth 로그인 페이지 URL
   */
  oauthLogin: async (provider: OAuthProvider): Promise<string> => {
    // 백엔드 API 엔드포인트
    // 백엔드에서 OAuth 로그인 엔드포인트를 제공한다고 가정
    // 예: GET /api/auth/oauth2/{provider} -> OAuth 제공자 페이지로 리다이렉트
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    const redirectUrl = `${API_BASE_URL}/api/auth/oauth2/${provider}`;
    
    // 실제 백엔드 연동 시:
    // 1. 백엔드가 OAuth 제공자 로그인 페이지로 리다이렉트
    // 2. 사용자 인증 후 백엔드 콜백 URL로 돌아옴
    // 3. 백엔드에서 토큰 발급 후 프론트엔드 콜백 URL로 리다이렉트
    //    예: /auth/oauth/callback?provider={provider}&code={code}&state={state}
    
    return redirectUrl;
  },

  /**
   * OAuth 콜백 처리 (백엔드에서 코드를 받아 토큰으로 교환)
   * @param provider OAuth 제공자
   * @param code OAuth 인증 코드
   * @param state OAuth state (CSRF 방지용)
   * @returns 인증 정보 (accessToken, refreshToken, user)
   */
  oauthCallback: async (
    provider: OAuthProvider,
    code: string,
    state?: string
  ): Promise<AuthResponse> => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    
    try {
      // 백엔드 OAuth 콜백 엔드포인트 호출
      // POST /api/auth/oauth2/callback/{provider}
      // Body: { code: string, state?: string }
      const response = await fetch(`${API_BASE_URL}/api/auth/oauth2/callback/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'OAuth 인증 실패' }));
        throw new Error(errorData.message || 'OAuth 인증에 실패했습니다');
      }

      const data = await response.json();
      
      // 백엔드 응답 형식에 맞게 변환
      // 백엔드에서 AuthResponse 형식으로 반환한다고 가정
      // 예: { accessToken: string, refreshToken?: string, user: UserResponse }
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      };
    } catch (error) {
      console.error('OAuth 콜백 처리 실패:', error);
      throw error instanceof Error ? error : new Error('OAuth 인증에 실패했습니다');
    }
  },
};
