import {
  UserResponse,
  UserPageResponse,
  UserProfileResponse,
  ProjectResponse,
  AuctionResponse,
  AuctionSummary,
  AuctionCreateRequest,
  AuctionStatus,
  RewardTierResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  SupportRequest,
  SupportResponse,
  BidRequest,
  BidResponse,
  BidSummary,
  MyBidsSummary,
  OAuthProvider,
  OAuthCallbackRequest,
  PledgeCreateRequest,
  PledgeResponse,
  ProfileUpdateRequest,
} from '@/src/types/api';
import { tokenStorage } from '@/src/lib/auth';

// 백엔드 API 기본 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// API 요청 헬퍼 함수
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    // 토큰 앞뒤 공백 제거 및 Bearer 형식 확인
    const cleanToken = token.trim().replace(/^["']|["']$/g, ''); // 앞뒤 따옴표 제거
    headers['Authorization'] = `Bearer ${cleanToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // refreshToken 쿠키 저장을 위해 필수
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = '요청 처리 중 오류가 발생했습니다';
    let errorJson: any = null;
    
    try {
      errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    // 에러 로깅
    console.error(`API 요청 실패 [${response.status}]:`, {
      endpoint,
      status: response.status,
      errorMessage,
    });
    
    throw new Error(`${errorMessage} (${response.status})`);
  }

  // DELETE 요청 등은 응답 본문이 없을 수 있음
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  // 응답 본문 파싱
  const responseData = await response.json();
  return responseData as T;
}


// API 함수들 - 프로젝트 관련
export const projectApi = {
  /**
   * 프로젝트 목록 조회
   * GET /api/crowd
   */
  getProjects: async (params?: {
    status?: ProjectResponse['status'];
    page?: number;
    limit?: number;
  }): Promise<ProjectResponse[]> => {
    try {
      // 백엔드에서 전체 프로젝트 목록 조회
      const backendResponse = await apiRequest<any[]>('/api/crowd', {
        method: 'GET',
      });

      // 각 프로젝트를 프론트엔드 타입으로 변환
      const projects = backendResponse.map((backendProject: any) => {
        // Creator 정보 처리
        let creator: UserResponse;
        if (backendProject.creator) {
          creator = {
            id: backendProject.creator.id || backendProject.creatorId || 0,
            email: backendProject.creator.email || null,
            name: backendProject.creator.name || backendProject.creator.username || '',
            nickname: backendProject.creator.nickname || '',
            profileImageUrl: backendProject.creator.profileImageUrl || null,
            phone: backendProject.creator.phone || backendProject.creator.phoneNumber || null,
          };
        } else if (backendProject.creatorId) {
          creator = {
            id: backendProject.creatorId,
            email: null,
            name: '',
            nickname: `사용자 ${backendProject.creatorId}`,
            profileImageUrl: null,
            phone: null,
          };
        } else {
          creator = {
            id: 0,
            email: null,
            name: '',
            nickname: '알 수 없음',
            profileImageUrl: null,
            phone: null,
          };
        }

        // 이미지 처리
        const thumbnailUrl = backendProject.thumbnailUrl || backendProject.thumbnail_url || null;
        const imageUrl = backendProject.imageUrl || thumbnailUrl || null;
        const imageUrls = backendProject.imageUrls || (imageUrl ? [imageUrl] : null);

        // 날짜 필드 처리
        const startAt = backendProject.startAt || backendProject.start_at || '';
        const endAt = backendProject.endAt || backendProject.end_at || '';
        const createdAt = backendProject.createdAt || backendProject.created_date || backendProject.createdDate || '';

        return {
          id: backendProject.id,
          creator,
          title: backendProject.title || '',
          description: backendProject.description || '',
          imageUrl,
          imageUrls,
          targetAmount: backendProject.targetAmount || backendProject.target_amount || 0,
          currentAmount: backendProject.currentAmount || backendProject.current_amount || 0,
          status: backendProject.status || 'DRAFT',
          startAt,
          endAt,
          rewardTiers: (backendProject.rewardTiers || backendProject.reward_tiers || []).map((tier: any) => ({
            id: tier.id || 0,
            title: tier.title || '',
            description: tier.description || '',
            price: tier.price || 0,
            limitQuantity: tier.limitQuantity !== undefined ? tier.limitQuantity : (tier.limit_quantity !== undefined ? tier.limit_quantity : null),
            soldQuantity: tier.soldQuantity || tier.sold_quantity || 0,
          })),
          createdAt,
          categoryPath: backendProject.categoryPath || backendProject.category_path || null,
          tags: backendProject.tags || null,
          summary: backendProject.summary || null,
        } as ProjectResponse;
      });

      // 클라이언트 사이드 필터링 (백엔드에 필터링 파라미터가 없으므로)
      let filteredProjects = projects;
      
      // 상태 필터링
      if (params?.status) {
        filteredProjects = filteredProjects.filter(project => project.status === params.status);
      }

      // 최신순 정렬 (createdAt 기준)
      filteredProjects.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // 최신순
      });

      // 페이지네이션 적용
      if (params?.page && params?.limit) {
        const page = params.page;
        const limit = params.limit;
        const offset = (page - 1) * limit;
        return filteredProjects.slice(offset, offset + limit);
      }

      // limit만 있는 경우
      if (params?.limit) {
        return filteredProjects.slice(0, params.limit);
      }

      return filteredProjects;
    } catch (error) {
      console.error('프로젝트 목록 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 프로젝트 상세 조회
   * GET /api/crowd/{projectId}
   */
  getProject: async (id: number): Promise<ProjectResponse> => {
    try {
      // 백엔드 응답을 받아서 프론트엔드 타입으로 변환
      const backendResponse = await apiRequest<any>(`/api/crowd/${id}`, {
        method: 'GET',
      });

      // 디버깅: 백엔드 응답 구조 확인
      console.log('백엔드 프로젝트 응답:', JSON.stringify(backendResponse, null, 2));

      // 백엔드 응답을 프론트엔드 타입으로 변환
      // 백엔드 필드명이 다를 수 있으므로 안전하게 변환
      // 백엔드 쿼리 기준: creator_id는 있지만 creator 객체는 없을 수 있음
      // thumbnail_url은 있지만 imageUrl/imageUrls는 없을 수 있음
      
      // Creator 정보 처리
      let creator: UserResponse;
      if (backendResponse.creator) {
        // 백엔드에 creator 객체가 있는 경우
        creator = {
          id: backendResponse.creator.id || backendResponse.creatorId || 0,
          email: backendResponse.creator.email || null,
          name: backendResponse.creator.name || backendResponse.creator.username || '',
          nickname: backendResponse.creator.nickname || '',
          profileImageUrl: backendResponse.creator.profileImageUrl || backendResponse.creator.profile_image_url || null,
          phone: backendResponse.creator.phone || backendResponse.creator.phoneNumber || backendResponse.creator.phone_number || null,
        };
      } else if (backendResponse.creatorId) {
        // 백엔드에 creatorId만 있는 경우 - 사용자 정보 조회 시도
        try {
          // creatorId로 사용자 정보 조회 (백엔드에 해당 API가 있다면)
          // 일단 기본값으로 설정하고, 나중에 백엔드에서 creator 정보를 포함시키면 자동으로 사용됨
          creator = {
            id: backendResponse.creatorId,
            email: null,
            name: '',
            nickname: `사용자 ${backendResponse.creatorId}`,
            profileImageUrl: null,
            phone: null,
          };
        } catch (error) {
          console.warn('생성자 정보 조회 실패:', error);
          creator = {
            id: backendResponse.creatorId,
            email: null,
            name: '',
            nickname: `사용자 ${backendResponse.creatorId}`,
            profileImageUrl: null,
            phone: null,
          };
        }
      } else {
        // creatorId도 없는 경우 (에러 상황)
        creator = {
          id: 0,
          email: null,
          name: '',
          nickname: '알 수 없음',
          profileImageUrl: null,
          phone: null,
        };
      }

      // 이미지 처리 (백엔드에 thumbnail_url이 있을 수 있음)
      const thumbnailUrl = backendResponse.thumbnailUrl || backendResponse.thumbnail_url || null;
      const imageUrl = backendResponse.imageUrl || thumbnailUrl || null;
      const imageUrls = backendResponse.imageUrls || (imageUrl ? [imageUrl] : null);

      // 날짜 필드 처리 (백엔드 필드명이 다를 수 있음)
      const startAt = backendResponse.startAt || backendResponse.start_at || '';
      const endAt = backendResponse.endAt || backendResponse.end_at || '';
      const createdAt = backendResponse.createdAt || backendResponse.created_date || backendResponse.createdDate || '';

      const project: ProjectResponse = {
        id: backendResponse.id,
        creator,
        title: backendResponse.title || '',
        description: backendResponse.description || '',
        imageUrl,
        imageUrls,
        targetAmount: backendResponse.targetAmount || backendResponse.target_amount || 0,
        currentAmount: backendResponse.currentAmount || backendResponse.current_amount || 0,
        status: backendResponse.status || 'DRAFT',
        startAt,
        endAt,
        rewardTiers: (backendResponse.rewardTiers || backendResponse.reward_tiers || []).map((tier: any) => ({
          id: tier.id || 0,
          title: tier.title || '',
          description: tier.description || '',
          price: tier.price || 0,
          limitQuantity: tier.limitQuantity !== undefined ? tier.limitQuantity : (tier.limit_quantity !== undefined ? tier.limit_quantity : null),
          soldQuantity: tier.soldQuantity || tier.sold_quantity || 0,
        })),
        createdAt,
        categoryPath: backendResponse.categoryPath || backendResponse.category_path || null,
        tags: backendResponse.tags || null,
        summary: backendResponse.summary || null,
      };

      return project;
    } catch (error) {
      console.error('프로젝트 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 프로젝트 생성
   * POST /api/crowd
   * 백엔드 응답: Long projectId
   */
  createProject: async (
    data: Omit<ProjectResponse, 'id' | 'creator' | 'createdAt'>
  ): Promise<ProjectResponse> => {
    try {
      // 백엔드에 전송할 데이터 형식 변환
      // thumbnailImageUrl은 필수 필드이므로 첫 번째 이미지 URL을 사용
      const thumbnailImageUrl = data.imageUrl || (data.imageUrls && data.imageUrls.length > 0 ? data.imageUrls[0] : null);
      
      if (!thumbnailImageUrl) {
        throw new Error('프로젝트 이미지(썸네일)를 업로드해주세요');
      }

      const requestData = {
        title: data.title,
        description: data.description,
        targetAmount: data.targetAmount,
        startAt: data.startAt,
        endAt: data.endAt,
        thumbnailImageUrl: thumbnailImageUrl,
        rewardTiers: data.rewardTiers.map(tier => ({
          title: tier.title,
          description: tier.description,
          price: tier.price,
          limitQuantity: tier.limitQuantity,
        })),
        categoryPath: data.categoryPath || null,
        tags: data.tags || null,
        summary: data.summary || null,
        // 이미지는 별도 업로드 API가 필요할 수 있음
        // imageUrls: data.imageUrls || null,
      };

      console.log('프로젝트 생성 요청:', requestData);

      // 프로젝트 생성 요청
      const projectId = await apiRequest<number>('/api/crowd', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      console.log('프로젝트 생성 성공, ID:', projectId);

      // 생성된 프로젝트 ID로 상세 정보 조회
      const createdProject = await projectApi.getProject(projectId);
      
      return createdProject;
    } catch (error) {
      console.error('프로젝트 생성 실패:', error);
      throw error;
    }
  },

  /**
   * 프로젝트 수정
   * TODO: 백엔드에 수정 API가 추가되면 연동 필요 (현재 비활성화 상태)
   */
  updateProject: async (
    id: number,
    data: Partial<ProjectResponse>
  ): Promise<ProjectResponse> => {
    // 백엔드에 수정 API가 비활성화되어 있음
    throw new Error('프로젝트 수정 API가 현재 비활성화되어 있습니다.');
  },

  /**
   * 프로젝트 삭제
   * DELETE /api/crowd/{projectId}
   */
  deleteProject: async (id: number): Promise<void> => {
    try {
      await apiRequest(`/api/crowd/${id}`, {
        method: 'DELETE',
      });
      console.log('프로젝트 삭제 성공:', id);
    } catch (error) {
      console.error('프로젝트 삭제 실패:', error);
      throw error;
    }
  },

  /**
   * 프로젝트 후원하기 (하위 호환성 유지)
   * @deprecated createPledge 사용 권장
   */
  supportProject: async (data: SupportRequest): Promise<SupportResponse> => {
    // 새로운 API로 변환
    const pledgeResponse = await projectApi.createPledge(data.projectId, {
      rewardTierId: data.rewardTierId,
      amount: data.amount,
    });
    
    return {
      id: pledgeResponse.id,
      projectId: pledgeResponse.projectId,
      projectTitle: pledgeResponse.projectTitle || '',
      rewardTierId: pledgeResponse.rewardTierId,
      rewardTierTitle: pledgeResponse.rewardTierTitle || '',
      amount: pledgeResponse.amount,
      supporter: pledgeResponse.supporter || {
        id: 0,
        email: null,
        name: '',
        nickname: '',
        profileImageUrl: null,
        phone: null,
      },
      createdAt: pledgeResponse.createdAt,
    };
  },

  /**
   * 리워드 구매 (Pledge 생성)
   * POST /api/crowd/pledges/{projectId}
   */
  createPledge: async (
    projectId: number,
    data: { rewardTierId: number; amount: number }
  ): Promise<PledgeResponse> => {
    try {
      const backendResponse = await apiRequest<any>(`/api/crowd/pledges/${projectId}`, {
        method: 'POST',
        body: JSON.stringify({
          rewardTierId: data.rewardTierId,
          amount: data.amount,
        }),
      });

      // 백엔드 응답을 프론트엔드 타입으로 변환
      const pledge: PledgeResponse = {
        id: backendResponse.id || 0,
        projectId: backendResponse.projectId || projectId,
        projectTitle: backendResponse.projectTitle || null,
        rewardTierId: backendResponse.rewardTierId || data.rewardTierId,
        rewardTierTitle: backendResponse.rewardTierTitle || null,
        amount: backendResponse.amount || data.amount,
        supporter: backendResponse.supporter ? {
          id: backendResponse.supporter.id || 0,
          email: backendResponse.supporter.email || null,
          name: backendResponse.supporter.name || backendResponse.supporter.username || '',
          nickname: backendResponse.supporter.nickname || '',
          profileImageUrl: backendResponse.supporter.profileImageUrl || null,
          phone: backendResponse.supporter.phone || backendResponse.supporter.phoneNumber || null,
        } : undefined,
        createdAt: backendResponse.createdAt || new Date().toISOString(),
        status: backendResponse.status || null,
      };

      return pledge;
    } catch (error) {
      console.error('리워드 구매 실패:', error);
      throw error;
    }
  },

  /**
   * 본인의 리워드 전체 조회
   * GET /api/crowd/pledges
   */
  getMyPledges: async (): Promise<PledgeResponse[]> => {
    try {
      const backendResponse = await apiRequest<any[]>('/api/crowd/pledges', {
        method: 'GET',
      });

      return backendResponse.map((pledge: any) => ({
        id: pledge.id || 0,
        projectId: pledge.projectId || 0,
        projectTitle: pledge.projectTitle || null,
        rewardTierId: pledge.rewardTierId || 0,
        rewardTierTitle: pledge.rewardTierTitle || null,
        amount: pledge.amount || 0,
        supporter: pledge.supporter ? {
          id: pledge.supporter.id || 0,
          email: pledge.supporter.email || null,
          name: pledge.supporter.name || pledge.supporter.username || '',
          nickname: pledge.supporter.nickname || '',
          profileImageUrl: pledge.supporter.profileImageUrl || null,
          phone: pledge.supporter.phone || pledge.supporter.phoneNumber || null,
        } : undefined,
        createdAt: pledge.createdAt || new Date().toISOString(),
        status: pledge.status || null,
      }));
    } catch (error) {
      console.error('리워드 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 리워드 취소
   * PATCH /api/crowd/pledges/{pledgeId}/cancel
   */
  cancelPledge: async (pledgeId: number): Promise<void> => {
    try {
      await apiRequest(`/api/crowd/pledges/${pledgeId}/cancel`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('리워드 취소 실패:', error);
      throw error;
    }
  },

  getMySupports: async (userId?: number): Promise<SupportResponse[]> => {
    return [];
  },

  checkAndUpdateProjectStatus: async (projectId: number): Promise<ProjectResponse | null> => {
    return null;
  },

  checkAllProjectsStatus: async (): Promise<void> => {
    // 백엔드에서 자동 처리
  },

  /**
   * 통계 정보 조회
   * 프로젝트 목록을 가져와서 통계를 계산
   */
  getStatistics: async (): Promise<{
    totalAmount: number;
    totalParticipants: number;
    activeProjects: number;
  }> => {
    try {
      // 모든 프로젝트 조회
      const allProjects = await projectApi.getProjects();
      
      // 누적 후원금액: 모든 프로젝트의 currentAmount 합계
      const totalAmount = allProjects.reduce((sum, project) => {
        return sum + (project.currentAmount || 0);
      }, 0);
      
      // 참여자 수: 모든 프로젝트의 rewardTiers의 soldQuantity 합계
      const totalParticipants = allProjects.reduce((sum, project) => {
        const participants = project.rewardTiers.reduce((tierSum, tier) => {
          return tierSum + (tier.soldQuantity || 0);
        }, 0);
        return sum + participants;
      }, 0);
      
      // 진행 중인 프로젝트: status가 'OPEN'인 프로젝트 수
      const activeProjects = allProjects.filter(
        project => project.status === 'OPEN'
      ).length;
      
      return {
        totalAmount,
        totalParticipants,
        activeProjects,
      };
    } catch (error) {
      console.error('통계 조회 실패:', error);
      // 에러 발생 시 기본값 반환
      return {
        totalAmount: 0,
        totalParticipants: 0,
        activeProjects: 0,
      };
    }
  },

  searchProjects: async (query: string, params?: {
    status?: ProjectResponse['status'];
    limit?: number;
  }): Promise<ProjectResponse[]> => {
    return [];
  },
};

// API 함수들 - 경매 관련
export const auctionApi = {
  /**
   * 경매 목록 조회
   * GET /api/auctions
   */
  getAuctions: async (params?: {
    status?: AuctionStatus;
    page?: number;
    limit?: number;
  }): Promise<AuctionSummary[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const endpoint = `/api/auctions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const backendResponse = await apiRequest<AuctionSummary[]>(endpoint, {
        method: 'GET',
      });

      return backendResponse.map((auction: any) => ({
        id: auction.id || 0,
        title: auction.title || '',
        thumbnailImageUrl: auction.thumbnailImageUrl || auction.thumbnail_url || null,
        startPrice: auction.startPrice || auction.start_price || 0,
        currentPrice: auction.currentPrice || auction.current_price || 0,
        bidStep: auction.bidStep || auction.bid_step || 0,
        status: auction.status || 'SCHEDULED',
        startAt: auction.startAt || auction.start_at || '',
        endAt: auction.endAt || auction.end_at || '',
        bidCount: auction.bidCount || auction.bid_count || 0,
        categoryPath: auction.categoryPath || auction.category_path || null,
        summary: auction.summary || null,
      }));
    } catch (error) {
      console.error('경매 목록 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 경매 상세 조회
   * GET /api/auctions/{id}
   */
  getAuction: async (id: number): Promise<AuctionResponse> => {
    try {
      const backendResponse = await apiRequest<any>(`/api/auctions/${id}`, {
        method: 'GET',
      });

      // 백엔드 응답을 프론트엔드 타입으로 변환
      const thumbnailUrl = backendResponse.thumbnailImageUrl || backendResponse.thumbnail_url || null;
      const imageUrl = backendResponse.imageUrl || thumbnailUrl || null;
      const imageUrls = backendResponse.imageUrls || (imageUrl ? [imageUrl] : null);

      return {
        id: backendResponse.id || 0,
        seller: backendResponse.seller ? {
          id: backendResponse.seller.id || 0,
          email: backendResponse.seller.email || null,
          name: backendResponse.seller.name || backendResponse.seller.username || '',
          nickname: backendResponse.seller.nickname || '',
          profileImageUrl: backendResponse.seller.profileImageUrl || backendResponse.seller.profile_image_url || null,
          phone: backendResponse.seller.phone || backendResponse.seller.phoneNumber || null,
        } : {
          id: 0,
          email: null,
          name: '',
          nickname: '',
          profileImageUrl: null,
          phone: null,
        },
        title: backendResponse.title || '',
        description: backendResponse.description || '',
        thumbnailImageUrl: thumbnailUrl,
        imageUrl,
        imageUrls,
        startPrice: backendResponse.startPrice || backendResponse.start_price || 0,
        currentPrice: backendResponse.currentPrice || backendResponse.current_price || 0,
        bidStep: backendResponse.bidStep || backendResponse.bid_step || 0,
        buyoutPrice: backendResponse.buyoutPrice || backendResponse.buyout_price || null,
        status: backendResponse.status || 'SCHEDULED',
        startAt: backendResponse.startAt || backendResponse.start_at || '',
        endAt: backendResponse.endAt || backendResponse.end_at || '',
        winner: backendResponse.winner ? {
          id: backendResponse.winner.id || 0,
          email: backendResponse.winner.email || null,
          name: backendResponse.winner.name || backendResponse.winner.username || '',
          nickname: backendResponse.winner.nickname || '',
          profileImageUrl: backendResponse.winner.profileImageUrl || backendResponse.winner.profile_image_url || null,
          phone: backendResponse.winner.phone || backendResponse.winner.phoneNumber || null,
        } : null,
        categoryPath: backendResponse.categoryPath || backendResponse.category_path || null,
        tags: backendResponse.tags || null,
        summary: backendResponse.summary || null,
        bids: backendResponse.bids ? backendResponse.bids.map((bid: any) => ({
          id: bid.id || 0,
          bidder: bid.bidder ? {
            id: bid.bidder.id || 0,
            email: bid.bidder.email || null,
            name: bid.bidder.name || bid.bidder.username || '',
            nickname: bid.bidder.nickname || '',
            profileImageUrl: bid.bidder.profileImageUrl || bid.bidder.profile_image_url || null,
            phone: bid.bidder.phone || bid.bidder.phoneNumber || null,
          } : {
            id: 0,
            email: null,
            name: '',
            nickname: '',
            profileImageUrl: null,
            phone: null,
          },
          bidderNickname: bid.bidderNickname || bid.bidder_nickname || bid.bidder?.nickname || '',
          bidPrice: bid.bidPrice || bid.bid_price || 0,
          bidAt: bid.bidAt || bid.bid_at || bid.createdAt || '',
        })) : [],
        createdAt: backendResponse.createdAt || backendResponse.created_at || '',
        updatedAt: backendResponse.updatedAt || backendResponse.updated_at || '',
      };
    } catch (error) {
      console.error('경매 상세 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 경매 생성
   * POST /api/auctions
   */
  createAuction: async (data: AuctionCreateRequest): Promise<AuctionResponse> => {
    try {
      const requestData = {
        title: data.title,
        description: data.description,
        startPrice: data.startPrice,
        bidStep: data.bidStep,
        endAt: data.endAt,
        thumbnailImageUrl: data.thumbnailImageUrl || null,
        categoryPath: data.categoryPath || null,
        tags: data.tags || null,
        summary: data.summary || null,
      };

      console.log('경매 생성 요청:', requestData);

      const auctionId = await apiRequest<number>('/api/auctions', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      console.log('경매 생성 성공, ID:', auctionId);

      // 생성된 경매 ID로 상세 정보 조회
      const createdAuction = await auctionApi.getAuction(auctionId);
      
      return createdAuction;
    } catch (error) {
      console.error('경매 생성 실패:', error);
      throw error;
    }
  },

  /**
   * 경매 수정
   * PUT /api/auctions/{id}
   */
  updateAuction: async (
    id: number,
    data: Partial<AuctionCreateRequest>
  ): Promise<AuctionResponse> => {
    try {
      const requestData: any = {};
      if (data.title !== undefined) requestData.title = data.title;
      if (data.description !== undefined) requestData.description = data.description;
      if (data.startPrice !== undefined) requestData.startPrice = data.startPrice;
      if (data.bidStep !== undefined) requestData.bidStep = data.bidStep;
      if (data.endAt !== undefined) requestData.endAt = data.endAt;
      if (data.thumbnailImageUrl !== undefined) requestData.thumbnailImageUrl = data.thumbnailImageUrl;
      if (data.categoryPath !== undefined) requestData.categoryPath = data.categoryPath;
      if (data.tags !== undefined) requestData.tags = data.tags;
      if (data.summary !== undefined) requestData.summary = data.summary;

      await apiRequest(`/api/auctions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(requestData),
      });

      // 수정된 경매 정보 조회
      return await auctionApi.getAuction(id);
    } catch (error) {
      console.error('경매 수정 실패:', error);
      throw error;
    }
  },

  /**
   * 경매 삭제
   * DELETE /api/auctions/{id}
   */
  deleteAuction: async (id: number): Promise<void> => {
    try {
      await apiRequest(`/api/auctions/${id}`, {
        method: 'DELETE',
      });
      console.log('경매 삭제 성공:', id);
    } catch (error) {
      console.error('경매 삭제 실패:', error);
      throw error;
    }
  },

  /**
   * 경매 입찰
   * POST /api/auctions/{auctionId}/bids
   */
  placeBid: async (
    auctionId: number,
    bidData: BidRequest
  ): Promise<BidResponse> => {
    try {
      const backendResponse = await apiRequest<any>(`/api/auctions/${auctionId}/bids`, {
        method: 'POST',
        body: JSON.stringify({
          price: bidData.price,
        }),
      });

      return {
        bidId: backendResponse.bidId || backendResponse.bid_id || 0,
        auction: backendResponse.auction ? await auctionApi.getAuction(backendResponse.auction.id || auctionId) : await auctionApi.getAuction(auctionId),
        bidPrice: backendResponse.bidPrice || backendResponse.bid_price || bidData.price,
        isHighestBidder: backendResponse.isHighestBidder || backendResponse.is_highest_bidder || false,
      };
    } catch (error) {
      console.error('경매 입찰 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 경매의 입찰 내역 조회
   * GET /api/auctions/{auctionId}/bids
   */
  getBidsByAuction: async (auctionId: number): Promise<BidSummary[]> => {
    try {
      const backendResponse = await apiRequest<any[]>(`/api/auctions/${auctionId}/bids`, {
        method: 'GET',
      });

      return backendResponse.map((bid: any) => ({
        id: bid.id || 0,
        bidder: bid.bidder ? {
          id: bid.bidder.id || 0,
          email: bid.bidder.email || null,
          name: bid.bidder.name || bid.bidder.username || '',
          nickname: bid.bidder.nickname || '',
          profileImageUrl: bid.bidder.profileImageUrl || bid.bidder.profile_image_url || null,
          phone: bid.bidder.phone || bid.bidder.phoneNumber || null,
        } : {
          id: 0,
          email: null,
          name: '',
          nickname: '',
          profileImageUrl: null,
          phone: null,
        },
        bidderNickname: bid.bidderNickname || bid.bidder_nickname || bid.bidder?.nickname || '',
        bidPrice: bid.bidPrice || bid.bid_price || 0,
        bidAt: bid.bidAt || bid.bid_at || bid.createdAt || '',
      }));
    } catch (error) {
      console.error('입찰 내역 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 사용자의 입찰 내역 조회 (마이페이지용)
   * GET /api/auctions/my-bids
   */
  getMyBids: async (): Promise<MyBidsSummary[]> => {
    try {
      const backendResponse = await apiRequest<any[]>('/api/auctions/my-bids', {
        method: 'GET',
      });

      return backendResponse.map((myBid: any) => ({
        auctionId: myBid.auctionId || myBid.auction_id || 0,
        auctionTitle: myBid.auctionTitle || myBid.auction_title || '',
        auctionThumbnailUrl: myBid.auctionThumbnailUrl || myBid.auction_thumbnail_url || null,
        auctionStatus: myBid.auctionStatus || myBid.auction_status || 'SCHEDULED',
        myAuctionStatus: myBid.myAuctionStatus || myBid.my_auction_status || 'OUTBID',
        lastBidPrice: myBid.lastBidPrice || myBid.last_bid_price || 0,
        currentPrice: myBid.currentPrice || myBid.current_price || 0,
        isHighestBidder: myBid.isHighestBidder !== undefined ? myBid.isHighestBidder : (myBid.is_highest_bidder !== undefined ? myBid.is_highest_bidder : false),
        lastBidAt: myBid.lastBidAt || myBid.last_bid_at || '',
        auctionEndAt: myBid.auctionEndAt || myBid.auction_end_at || '',
        isPaid: myBid.isPaid !== undefined ? myBid.isPaid : (myBid.is_paid !== undefined ? myBid.is_paid : false),
      }));
    } catch (error) {
      console.error('내 입찰 내역 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 경매 검색
   * GET /api/auctions/search?query={query}&status={status}&limit={limit}
   */
  searchAuctions: async (query: string, params?: {
    status?: AuctionStatus;
    limit?: number;
  }): Promise<AuctionSummary[]> => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('query', query);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const endpoint = `/api/auctions/search?${queryParams.toString()}`;
      const backendResponse = await apiRequest<AuctionSummary[]>(endpoint, {
        method: 'GET',
      });

      return backendResponse.map((auction: any) => ({
        id: auction.id || 0,
        title: auction.title || '',
        thumbnailImageUrl: auction.thumbnailImageUrl || auction.thumbnail_url || null,
        startPrice: auction.startPrice || auction.start_price || 0,
        currentPrice: auction.currentPrice || auction.current_price || 0,
        bidStep: auction.bidStep || auction.bid_step || 0,
        status: auction.status || 'SCHEDULED',
        startAt: auction.startAt || auction.start_at || '',
        endAt: auction.endAt || auction.end_at || '',
        bidCount: auction.bidCount || auction.bid_count || 0,
        categoryPath: auction.categoryPath || auction.category_path || null,
        summary: auction.summary || null,
      }));
    } catch (error) {
      console.error('경매 검색 실패:', error);
      throw error;
    }
  },
};

// API 함수들 - 사용자 관련
export const userApi = {
  /**
   * 마이페이지 데이터 조회 (내 경매, 입찰 내역 등)
   * GET /api/users/my-page
   */
  getMyPage: async (): Promise<UserPageResponse> => {
    try {
      const backendResponse = await apiRequest<any>('/api/users/my-page', {
        method: 'GET',
      });

      return {
        user: backendResponse.user ? {
          id: backendResponse.user.id || 0,
          email: backendResponse.user.email || null,
          name: backendResponse.user.name || backendResponse.user.username || '',
          nickname: backendResponse.user.nickname || '',
          profileImageUrl: backendResponse.user.profileImageUrl || backendResponse.user.profile_image_url || null,
          phone: backendResponse.user.phone || backendResponse.user.phoneNumber || null,
          roleLevel: backendResponse.user.roleLevel || backendResponse.user.role_level || 0,
        } : {
          id: 0,
          email: null,
          name: '',
          nickname: '',
          profileImageUrl: null,
          phone: null,
        },
        auctions: (backendResponse.auctions || []).map((auction: any) => ({
          id: auction.id || 0,
          title: auction.title || '',
          thumbnailImageUrl: auction.thumbnailImageUrl || auction.thumbnail_url || null,
          startPrice: auction.startPrice || auction.start_price || 0,
          currentPrice: auction.currentPrice || auction.current_price || 0,
          bidStep: auction.bidStep || auction.bid_step || 0,
          status: auction.status || 'SCHEDULED',
          startAt: auction.startAt || auction.start_at || '',
          endAt: auction.endAt || auction.end_at || '',
          bidCount: auction.bidCount || auction.bid_count || 0,
          categoryPath: auction.categoryPath || auction.category_path || null,
          summary: auction.summary || null,
        })),
        myBids: await Promise.all((backendResponse.myBids || []).map(async (bid: any) => {
          let auction: AuctionResponse;
          if (bid.auction) {
            auction = await auctionApi.getAuction(bid.auction.id || bid.auctionId || bid.auction_id);
          } else {
            // auction 정보가 없으면 빈 경매 객체 반환
            auction = {
              id: bid.auctionId || bid.auction_id || 0,
              seller: { id: 0, email: null, name: '', nickname: '', profileImageUrl: null, phone: null },
              title: '',
              description: '',
              thumbnailImageUrl: null,
              imageUrl: null,
              startPrice: 0,
              currentPrice: 0,
              bidStep: 0,
              buyoutPrice: null,
              status: 'SCHEDULED',
              startAt: '',
              endAt: '',
              winner: null,
            };
          }
          return {
            bidId: bid.bidId || bid.bid_id || 0,
            auction,
            bidPrice: bid.bidPrice || bid.bid_price || 0,
            isHighestBidder: bid.isHighestBidder !== undefined ? bid.isHighestBidder : (bid.is_highest_bidder !== undefined ? bid.is_highest_bidder : false),
          };
        })),
        myMyBids: (backendResponse.myMyBids || []).map((myBid: any) => ({
          auctionId: myBid.auctionId || myBid.auction_id || 0,
          auctionTitle: myBid.auctionTitle || myBid.auction_title || '',
          auctionThumbnailUrl: myBid.auctionThumbnailUrl || myBid.auction_thumbnail_url || null,
          auctionStatus: myBid.auctionStatus || myBid.auction_status || 'SCHEDULED',
          myAuctionStatus: myBid.myAuctionStatus || myBid.my_auction_status || 'OUTBID',
          lastBidPrice: myBid.lastBidPrice || myBid.last_bid_price || 0,
          currentPrice: myBid.currentPrice || myBid.current_price || 0,
          isHighestBidder: myBid.isHighestBidder !== undefined ? myBid.isHighestBidder : (myBid.is_highest_bidder !== undefined ? myBid.is_highest_bidder : false),
          lastBidAt: myBid.lastBidAt || myBid.last_bid_at || '',
          auctionEndAt: myBid.auctionEndAt || myBid.auction_end_at || '',
          isPaid: myBid.isPaid !== undefined ? myBid.isPaid : (myBid.is_paid !== undefined ? myBid.is_paid : false),
        })),
      };
    } catch (error) {
      console.error('마이페이지 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 상세 조회 (다른 사용자 프로필 보기)
   * GET /api/users/{id}/profile
   */
  getUserProfile: async (id: number): Promise<UserProfileResponse> => {
    try {
      const backendResponse = await apiRequest<any>(`/api/users/${id}/profile`, {
        method: 'GET',
      });

      return {
        user: backendResponse.user ? {
          id: backendResponse.user.id || 0,
          email: backendResponse.user.email || null,
          name: backendResponse.user.name || backendResponse.user.username || '',
          nickname: backendResponse.user.nickname || '',
          profileImageUrl: backendResponse.user.profileImageUrl || backendResponse.user.profile_image_url || null,
          phone: backendResponse.user.phone || backendResponse.user.phoneNumber || null,
          roleLevel: backendResponse.user.roleLevel || backendResponse.user.role_level || 0,
        } : {
          id: 0,
          email: null,
          name: '',
          nickname: '',
          profileImageUrl: null,
          phone: null,
        },
      };
    } catch (error) {
      console.error('프로필 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 사용자 정보 조회 (프로필 상세와 동일)
   * GET /api/users/{id}
   */
  getUser: async (id: number): Promise<UserResponse> => {
    try {
      const profile = await userApi.getUserProfile(id);
      return profile.user;
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 현재 로그인한 사용자 정보 조회
   * TODO: authApi.getCurrentUser 사용
   */
  getCurrentUser: async (): Promise<UserResponse> => {
    throw new Error('authApi.getCurrentUser를 사용하세요');
  },

  /**
   * 사용자 정보 수정
   * PUT /api/users/me
   */
  updateUser: async (
    data: ProfileUpdateRequest
  ): Promise<UserResponse> => {
    try {
      const requestData: any = {};
      if (data.username !== undefined) requestData.username = data.username;
      if (data.nickname !== undefined) requestData.nickname = data.nickname;
      if (data.phoneNumber !== undefined) requestData.phoneNumber = data.phoneNumber;
      if (data.profileImageUrl !== undefined) requestData.profileImageUrl = data.profileImageUrl;

      const backendResponse = await apiRequest<any>('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(requestData),
      });

      return {
        id: backendResponse.id || 0,
        email: backendResponse.email || null,
        name: backendResponse.name || backendResponse.username || '',
        nickname: backendResponse.nickname || '',
        profileImageUrl: backendResponse.profileImageUrl || backendResponse.profile_image_url || null,
        phone: backendResponse.phone || backendResponse.phoneNumber || null,
        roleLevel: backendResponse.roleLevel || backendResponse.role_level || 0,
      };
    } catch (error) {
      console.error('사용자 정보 수정 실패:', error);
      throw error;
    }
  },
};

// API 함수들 - 인증 관련
export const authApi = {
  /**
   * 로그인
   * POST /api/users/login
   * 백엔드 응답:
   * - 헤더: Authorization: Bearer {accessToken}
   * - 쿠키: refresh_token={refreshToken} (HttpOnly, Secure)
   * - 본문: { "access_token": "{accessToken}" }
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    // 요청 데이터 검증 및 로깅 (try-catch 밖에서 먼저 실행)
    const requestBody = {
      email: data.email,
      password: data.password,
    };
    
    const jsonBody = JSON.stringify(requestBody);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // refreshToken 쿠키 저장을 위해 필수
        body: jsonBody,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        
        console.error('로그인 실패:', {
          status: response.status,
          statusText: response.statusText,
          errorMessage,
        });
        
        throw new Error(errorMessage);
      }

      // 응답 본문에서 access_token 추출
      // 백엔드 응답 형식: { "access_token": "..." }
      const responseData = await response.json();
      const accessToken = responseData.access_token;
      
      if (!accessToken) {
        throw new Error('로그인 응답에 토큰이 없습니다');
      }

      // accessToken 저장
      tokenStorage.setAccessToken(accessToken);
      
      // refreshToken은 쿠키에 저장되므로 별도 저장 불필요
      // 백엔드가 자동으로 쿠키를 처리함

      // 로그인 응답에 사용자 정보가 포함되어 있는지 확인
      let user: UserResponse | null = null;
      
      if (responseData.user) {
        // 로그인 응답에 사용자 정보가 포함되어 있는 경우
        user = responseData.user;
        if (user) {
          tokenStorage.setUser(user);
        }
      } else if (responseData.id || responseData.email) {
        // 응답 본문 자체가 사용자 정보인 경우 (UserResponseDto)
        user = {
          id: responseData.id,
          email: responseData.email,
          name: responseData.name || responseData.username || '',
          nickname: responseData.nickname || '',
          profileImageUrl: responseData.profileImageUrl || null,
          phone: responseData.phoneNumber || responseData.phone || null,
        };
        tokenStorage.setUser(user);
      } else {
        // 로그인 응답에 사용자 정보가 없으면 null로 설정
        // 사용자 정보는 나중에 필요할 때 /api/users/profile로 조회
        user = null;
      }
      
      return {
        accessToken,
        refreshToken: '', // refreshToken은 쿠키에 저장되므로 빈 문자열
        user: user || {
          // 임시 사용자 정보 (사용자 정보 조회 실패 시)
          id: 0,
          email: null,
          name: '',
          nickname: '',
          profileImageUrl: null,
          phone: null,
        },
      };
    } catch (error) {
      console.error('로그인 실패 상세:', {
        error,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // 네트워크 오류 처리
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // CORS 에러인지 확인
        const errorStr = String(error);
        if (errorStr.includes('CORS') || errorStr.includes('cors')) {
          throw new Error(
            'CORS 정책 오류: 백엔드 CORS 설정을 확인해주세요.\n' +
            '필요한 설정:\n' +
            '1. setAllowCredentials(true)\n' +
            '2. setAllowedOrigins(List.of("http://localhost:3000"))\n' +
            '3. setExposedHeaders(List.of("Authorization"))'
          );
        }
        throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      }
      
      // 에러 메시지 그대로 전달
      throw error instanceof Error ? error : new Error('로그인에 실패했습니다');
    }
  },

  /**
   * 회원가입
   * POST /api/users/register
   * 백엔드에서 UserResponseDto만 반환하므로, 회원가입 후 자동 로그인 처리
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    
    // 회원가입 요청 데이터 준비
    const requestBody = {
      email: data.email,
      password: data.password,
      username: data.username,
      nickname: data.nickname,
      phoneNumber: data.phoneNumber,
      account: data.account || null,
      accountHolder: data.accountHolder || null,
      bankType: data.bankType || null,
    };
    const jsonBody = JSON.stringify(requestBody);
    
    // 회원가입 요청 로그
    console.group('🟢 회원가입 요청 상세 정보');
    console.log('📤 요청 URL:', `${API_BASE_URL}/api/users/register`);
    console.log('📤 요청 메서드:', 'POST');
    console.log('📤 요청 헤더:', {
      'Content-Type': 'application/json',
    });
    console.log('📤 요청 Body (JSON 문자열):', jsonBody);
    console.log('📤 요청 Body (객체):', {
      ...requestBody,
      password: '***' + (requestBody.password?.slice(-2) || ''),
    });
    console.log('📤 Body 길이:', jsonBody.length, 'bytes');
    console.groupEnd();
    
    try {
      // 회원가입 요청
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // refreshToken 쿠키 저장을 위해 필수
        body: jsonBody,
      });
      
      console.log('회원가입 응답 받음:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
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
      console.log('회원가입 성공, 자동 로그인 시도...');
      try {
        const loginResponse = await authApi.login({
          email: data.email,
          password: data.password,
        });
        console.log('자동 로그인 성공');
        return loginResponse;
      } catch (loginError) {
        // 자동 로그인 실패해도 회원가입은 성공한 것으로 처리
        console.warn('자동 로그인 실패 (회원가입은 성공):', loginError);
        // 사용자 정보만 반환 (수동 로그인 필요)
        const user: UserResponse = {
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.username || '',
          nickname: userData.nickname || '',
          profileImageUrl: userData.profileImageUrl || null,
          phone: userData.phoneNumber || userData.phone || null,
        };
        return {
          accessToken: '',
          refreshToken: '',
          user,
        };
      }
    } catch (error) {
      console.error('회원가입 실패 상세:', {
        error,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      
      // 네트워크 오류인 경우 더 명확한 메시지 제공
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const errorStr = String(error);
        if (errorStr.includes('CORS') || errorStr.includes('cors')) {
          throw new Error(
            'CORS 정책 오류: 백엔드 CORS 설정을 확인해주세요.\n' +
            '필요한 설정:\n' +
            '1. setAllowCredentials(true)\n' +
            '2. setAllowedOrigins(List.of("http://localhost:3000"))\n' +
            '3. /api/users/register 경로를 permitAll()로 설정'
          );
        }
        throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      }
      
      throw error instanceof Error ? error : new Error('회원가입에 실패했습니다');
    }
  },

  /**
   * 로그아웃
   * POST /api/users/logout
   */
  logout: async (): Promise<void> => {
    try {
      await apiRequest<void>('/api/users/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
      // API 호출 실패해도 클라이언트에서 토큰 삭제는 진행
      // (네트워크 오류 등으로 백엔드 호출이 실패해도 로그아웃은 처리)
    }
  },

  /**
   * 토큰 갱신
   * TODO: 백엔드 API 연동 필요
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    throw new Error('토큰 갱신 API가 아직 구현되지 않았습니다');
  },

  /**
   * 현재 사용자 정보 조회 (토큰으로)
   * GET /api/users/profile
   * 
   * 주의: 백엔드에 해당 엔드포인트가 없을 수 있음
   * 이 경우 에러를 던지고, 호출하는 쪽에서 처리해야 함
   */
  getCurrentUser: async (): Promise<UserResponse> => {
    try {
      // 백엔드 응답을 받아서 구조 확인
      const backendResponse = await apiRequest<any>('/api/users/profile', {
        method: 'GET',
      });
      
      // 백엔드 응답 검증
      if (!backendResponse) {
        throw new Error('백엔드 응답이 비어있습니다');
      }
      
      // 백엔드 응답을 프론트엔드 타입으로 변환
      // 백엔드 필드명이 다를 수 있으므로 안전하게 변환
      const user: UserResponse = {
        id: backendResponse.id ?? backendResponse.userId ?? 0,
        email: backendResponse.email ?? null,
        name: backendResponse.name ?? backendResponse.username ?? '',
        nickname: backendResponse.nickname ?? '',
        profileImageUrl: backendResponse.profileImageUrl ?? backendResponse.profile_image_url ?? null,
        phone: backendResponse.phone ?? backendResponse.phoneNumber ?? backendResponse.phone_number ?? null,
      };
      
      // 사용자 정보를 localStorage에 저장
      tokenStorage.setUser(user);
      
      return user;
    } catch (error) {
      console.error('getCurrentUser 실패:', error);
      
      // 401 Unauthorized인 경우 토큰이 만료되었거나 유효하지 않음
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
        // 토큰 삭제
        tokenStorage.clearAll();
        throw new Error('로그인이 필요합니다');
      }
      
      // 404 Not Found인 경우 엔드포인트가 없을 수 있음
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('Not Found'))) {
        throw new Error('사용자 정보 조회 API가 없습니다');
      }
      
      // 500 Internal Server Error인 경우 백엔드 에러
      if (error instanceof Error && (error.message.includes('500') || error.message.includes('Internal Server Error'))) {
        throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      
      // 다른 에러는 그대로 던짐
      throw error;
    }
  },

  /**
   * OAuth 로그인 시작 (백엔드로 리다이렉트)
   * @param provider OAuth 제공자 (google, kakao, naver)
   * @returns OAuth 로그인 페이지 URL
   */
  oauthLogin: async (provider: OAuthProvider): Promise<string> => {
    // 백엔드 API 엔드포인트
    // 백엔드에서 OAuth 로그인 엔드포인트를 제공한다고 가정
    // 예: GET /oauth2/{provider} -> OAuth 제공자 페이지로 리다이렉트
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    const redirectUrl = `${API_BASE_URL}/oauth2/authorization/${provider}`;
    
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
      // POST /oauth2/callback/{provider}
      // Body: { code: string, state?: string }
      const response = await fetch(`${API_BASE_URL}/oauth2/callback/${provider}`, {
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

  /**
   * 프로필 업데이트
   * PATCH /api/users/update-profile
   * 백엔드 응답: {"newAccessToken": "..."}
   */
  updateProfile: async (data: ProfileUpdateRequest): Promise<UserResponse> => {
    try {
      // 백엔드 DTO에 맞게 필드명 변환
      const requestData: any = {
        username: data.username || data.name,  // username 우선, 없으면 name 사용
        nickname: data.nickname,
        phoneNumber: data.phoneNumber || data.phone,  // phoneNumber 우선, 없으면 phone 사용
        profileImageUrl: data.profileImageUrl,
      };
      
      const backendResponse = await apiRequest<any>('/api/users/update-profile', {
        method: 'PATCH',
        body: JSON.stringify(requestData),
      });

      // 백엔드 응답에서 newAccessToken 추출 및 저장
      if (backendResponse.newAccessToken) {
        tokenStorage.setAccessToken(backendResponse.newAccessToken);
        console.log('새로운 accessToken이 저장되었습니다');
      }

      // 사용자 정보는 별도로 조회 (백엔드가 newAccessToken만 반환하는 경우)
      // 또는 응답에 사용자 정보가 포함되어 있다면 사용
      let user: UserResponse;
      
      if (backendResponse.id || backendResponse.email) {
        // 응답에 사용자 정보가 포함된 경우
        user = {
          id: backendResponse.id ?? backendResponse.userId ?? 0,
          email: backendResponse.email ?? null,
          name: backendResponse.name ?? backendResponse.username ?? '',
          nickname: backendResponse.nickname ?? '',
          profileImageUrl: backendResponse.profileImageUrl ?? backendResponse.profile_image_url ?? null,
          phone: backendResponse.phone ?? backendResponse.phoneNumber ?? backendResponse.phone_number ?? null,
          roleLevel: backendResponse.roleLevel ?? backendResponse.role_level ?? 0,
        };
      } else {
        // 응답에 사용자 정보가 없는 경우, 새 토큰으로 사용자 정보 조회
        user = await authApi.getCurrentUser();
      }

      tokenStorage.setUser(user);
      return user;
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      throw error;
    }
  },
};

