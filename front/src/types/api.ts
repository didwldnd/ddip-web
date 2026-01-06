// 공통 사용자 타입
export interface UserResponse {
  id: number;
  email: string | null;
  name: string;
  nickname: string;
  profileImageUrl: string | null;
  phone: string | null;
}

// 인증 관련 타입
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  nickname: string;
  phone?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: UserResponse;
}

// 프로젝트 관련 타입
export interface RewardTierResponse {
  id: number;
  title: string;
  description: string;
  price: number;
  limitQuantity: number | null;
  soldQuantity: number;
}

export interface ProjectResponse {
  id: number;
  creator: UserResponse;
  title: string;
  description: string;
  imageUrl: string | null;
  targetAmount: number;
  currentAmount: number;
  status: 'DRAFT' | 'OPEN' | 'SUCCESS' | 'FAILED' | 'CANCELED';
  startAt: string;
  endAt: string;
  rewardTiers: RewardTierResponse[];
  createdAt: string;
  categoryPath?: string | null;
  tags?: string | null;
  summary?: string | null;
}

// 경매 관련 타입
export interface AuctionResponse {
  id: number;
  seller: UserResponse;
  title: string;
  description: string;
  imageUrl: string | null;
  startPrice: number;
  currentPrice: number;
  bidStep: number;
  buyoutPrice: number | null;
  status: 'SCHEDULED' | 'RUNNING' | 'ENDED' | 'CANCELED';
  startAt: string;
  endAt: string;
  winner: UserResponse | null;
}

// 후원 관련 타입
export interface SupportRequest {
  projectId: number;
  rewardTierId: number;
  amount: number;
}

export interface SupportResponse {
  id: number;
  projectId: number;
  projectTitle: string;
  rewardTierId: number;
  rewardTierTitle: string;
  amount: number;
  supporter: UserResponse;
  createdAt: string;
}

// 입찰 관련 타입
export interface BidResponse {
  id: number;
  auctionId: number;
  auctionTitle: string;
  amount: number;
  bidder: UserResponse;
  createdAt: string;
}
