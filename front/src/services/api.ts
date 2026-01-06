import {
  UserResponse,
  ProjectResponse,
  AuctionResponse,
  RewardTierResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '@/src/types/api';

// 인메모리 저장소 (Mock API용)
const projectStore = new Map<number, ProjectResponse>();
const auctionStore = new Map<number, AuctionResponse>();

// localStorage 키
const PROJECT_STORE_KEY = 'ddip_projects';
const AUCTION_STORE_KEY = 'ddip_auctions';

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
        auctionStore.set(auction.id, auction);
      });
      console.log(`localStorage에서 ${auctions.length}개 경매 로드됨`);
    }
  } catch (error) {
    console.error('경매 로드 실패:', error);
  }
}

// localStorage에 데이터 저장
function saveProjectsToStorage(): void {
  try {
    const projects = Array.from(projectStore.values());
    localStorage.setItem(PROJECT_STORE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('프로젝트 저장 실패:', error);
  }
}

function saveAuctionsToStorage(): void {
  try {
    const auctions = Array.from(auctionStore.values());
    localStorage.setItem(AUCTION_STORE_KEY, JSON.stringify(auctions));
  } catch (error) {
    console.error('경매 저장 실패:', error);
  }
}

// 초기화 시 localStorage에서 로드
if (typeof window !== 'undefined') {
  loadProjectsFromStorage();
  loadAuctionsFromStorage();
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

  // overrides를 먼저 스프레드하고, 검증된 날짜로 덮어쓰기
  return {
    id,
    creator,
    title: `프로젝트 제목 ${id}`,
    description: `프로젝트 ${id}에 대한 상세 설명입니다.`,
    imageUrl: `https://picsum.photos/800/600?random=${id}`,
    targetAmount: 1000000,
    currentAmount: Math.floor(Math.random() * 1000000),
    status,
    rewardTiers,
    ...overrides,
    // 날짜는 위에서 검증된 값으로 덮어쓰기 (overrides의 날짜가 유효하지 않을 수 있으므로)
    startAt,
    endAt,
    createdAt,
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

  // overrides를 먼저 스프레드하고, 검증된 날짜로 덮어쓰기
  return {
    id,
    seller,
    title: `경매 상품 ${id}`,
    description: `경매 상품 ${id}에 대한 상세 설명입니다.`,
    imageUrl: `https://picsum.photos/800/600?random=${id + 1000}`,
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
      console.log("저장된 프로젝트 반환:", { id, title: storedProject.title });
      return storedProject;
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
    const result = createMockProject(projectId, {
      ...data,
      creator: createMockUser(1),
      createdAt: new Date().toISOString(),
    });
    
    // 생성한 프로젝트를 저장소에 저장
    projectStore.set(projectId, result);
    saveProjectsToStorage(); // localStorage에도 저장
    
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
      console.log("저장된 경매 반환:", { id, title: storedAuction.title });
      return storedAuction;
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
    const result = createMockAuction(auctionId, {
      ...data,
      seller: createMockUser(1),
      winner: null,
    });
    
    // 생성한 경매를 저장소에 저장
    auctionStore.set(auctionId, result);
    saveAuctionsToStorage(); // localStorage에도 저장
    
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
    
    const updatedAuction = {
      ...auction,
      currentPrice: bidAmount,
    };
    
    // 입찰 후 업데이트된 경매를 저장소에 저장
    auctionStore.set(auctionId, updatedAuction);
    saveAuctionsToStorage(); // localStorage에도 저장
    
    return updatedAuction;
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
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Mock: 새 사용자 생성
    const user = createMockUser(Date.now(), {
      email: data.email,
      name: data.name,
      nickname: data.nickname,
      phone: data.phone || null,
    });
    
    return {
      accessToken: `mock-access-token-${Date.now()}`,
      refreshToken: `mock-refresh-token-${Date.now()}`,
      user,
    };
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
    return createMockUser(1);
  },
};
