# DDIP 웹 애플리케이션 기능 정리

## 📋 목차
1. [인증 및 사용자 관리](#인증-및-사용자-관리)
2. [프로젝트(크라우드펀딩) 기능](#프로젝트크라우드펀딩-기능)
3. [경매 기능](#경매-기능)
4. [사용자 프로필 및 마이페이지](#사용자-프로필-및-마이페이지)
5. [배송지 관리](#배송지-관리)
6. [API 엔드포인트 정리](#api-엔드포인트-정리)
7. [타입 정의](#타입-정의)

---

## 인증 및 사용자 관리

### 1. 회원가입
- **페이지**: `/register`
- **기능**:
  - 이메일, 비밀번호, 이름, 닉네임, 전화번호 필수 입력
  - 계좌번호, 예금주, 은행 선택 (선택사항)
  - BankType 타입 안전성 보장 (`'KB' | 'SHINHAN' | 'WOORI' | 'HANA' | 'NH' | 'IBK' | 'KAKAO' | 'TOSS' | null`)
  - 비밀번호 확인 및 최소 6자 검증
  - 회원가입 성공 시 자동 로그인 및 메인 페이지 이동

**주요 수정 사항**:
- `bankType` 필드 타입 에러 수정 (`string | null` → `BankType | undefined`)
- 빈 문자열 처리 로직 추가

### 2. 로그인
- **페이지**: `/login`
- **기능**:
  - 이메일/비밀번호 로그인
  - 로그인 성공 시 토큰 저장 및 사용자 정보 조회
  - 자동 리다이렉트

### 3. OAuth 로그인
- **지원 제공자**: Google, Kakao, Naver
- **페이지**: `/oauth/callback`
- **기능**:
  - OAuth 인증 후 콜백 처리
  - 백엔드에서 사용자 정보 조회
  - 프로필 완성 여부 확인 (이름, 닉네임, 전화번호)
  - 완성된 경우 메인 페이지로, 미완성인 경우 프로필 완성 페이지로 이동

**주요 수정 사항**:
- 쿼리 파라미터 정보 대신 백엔드 API로 실제 사용자 정보 조회
- 프로필 완성 여부 정확한 판단 로직 구현

### 4. 프로필 완성
- **페이지**: `/auth/profile/complete`
- **기능**: OAuth 로그인 후 추가 정보 입력

---

## 프로젝트(크라우드펀딩) 기능

### 1. 프로젝트 목록 조회
- **페이지**: `/projects`
- **API**: `GET /api/crowd`
- **기능**:
  - 전체 프로젝트 목록 조회
  - 상태별 필터링 (DRAFT, OPEN, SUCCESS, FAILED, CANCELED)
  - 페이지네이션 지원

### 2. 프로젝트 상세 조회
- **페이지**: `/project/[id]`
- **API**: `GET /api/crowd/{id}`
- **기능**:
  - 프로젝트 상세 정보 표시
  - 리워드 티어 목록
  - 후원하기 기능
  - 프로젝트 생성자 정보

### 3. 프로젝트 생성
- **페이지**: `/project/create`
- **API**: `POST /api/crowd`
- **기능**:
  - 프로젝트 제목, 설명, 목표 금액 입력
  - 시작일/종료일 설정
  - 썸네일 이미지 업로드 (필수)
  - 리워드 티어 추가 (최소 1개 이상)
  - 카테고리, 태그, 요약 입력 (선택)

**주요 수정 사항**:
- `thumbnailImageUrl` 필드 필수 처리
- 이미지 미업로드 시 에러 메시지 표시
- 백엔드 DTO 구조에 맞춘 요청 데이터 형식

### 4. 프로젝트 수정
- **페이지**: `/project/[id]/edit`
- **API**: `PUT /api/crowd/{id}` (현재 비활성화)
- **기능**: 프로젝트 정보 수정 (백엔드 API 대기 중)

### 5. 프로젝트 삭제
- **API**: `DELETE /api/crowd/{id}`
- **기능**: 본인 프로젝트만 삭제 가능

### 6. 후원하기 (Pledge)
- **API**: `POST /api/crowd/{projectId}/pledges`
- **기능**:
  - 리워드 티어 선택 및 후원 금액 입력
  - 후원 내역 저장
  - 내 후원 내역 조회 (`GET /api/crowd/pledges`)

---

## 경매 기능

### 1. 경매 목록 조회
- **페이지**: `/auctions`
- **API**: `GET /api/auctions`
- **기능**:
  - 전체 경매 목록 조회
  - 상태별 필터링 (SCHEDULED, RUNNING, ENDED, CANCELED)
  - 페이지네이션 지원
  - 경매 요약 정보 표시 (제목, 썸네일, 시작가, 현재가, 입찰 수 등)

### 2. 경매 상세 조회
- **페이지**: `/auction/[id]`
- **API**: `GET /api/auctions/{id}`
- **기능**:
  - 경매 상세 정보 표시
  - 판매자 정보
  - 입찰 내역 리스트 (BidSummary)
  - 실시간 입찰가 표시
  - 입찰하기 기능

### 3. 경매 생성
- **페이지**: `/auction/create`
- **API**: `POST /api/auctions`
- **기능**:
  - 경매 제목, 설명 입력
  - 시작가, 입찰 단위 설정
  - 종료 시간 설정 (미래 시간 필수)
  - 썸네일 이미지 업로드
  - 카테고리, 태그, 요약 입력 (선택)

**타입 정의**:
- `AuctionCreateRequest`: 경매 생성 요청 타입
- 유효성 검사: 시작가 최소 100원, 입찰 단위 양수, 종료 시간 미래

### 4. 경매 수정
- **페이지**: `/auction/[id]/edit`
- **API**: `PUT /api/auctions/{id}`
- **기능**: 경매 정보 수정

### 5. 경매 삭제
- **API**: `DELETE /api/auctions/{id}`
- **기능**: 본인 경매만 삭제 가능

### 6. 입찰하기
- **API**: `POST /api/auctions/{auctionId}/bids`
- **기능**:
  - 입찰 가격 입력 (최소 100원)
  - 입찰 성공 시 경매 정보 업데이트
  - 최고 입찰자 여부 확인
  - 입찰 내역에 추가

**타입 정의**:
- `BidRequest`: 입찰 요청 (`{ price: number }`)
- `BidResponse`: 입찰 응답 (입찰 ID, 경매 정보, 입찰가, 최고 입찰자 여부)

### 7. 입찰 내역 조회
- **API**: `GET /api/auctions/{auctionId}/bids`
- **기능**:
  - 특정 경매의 입찰 내역 조회
  - 입찰자 정보, 입찰가, 입찰 시간 표시

**타입 정의**:
- `BidSummary`: 입찰 요약 (입찰자, 입찰가, 입찰 시간)

### 8. 내 입찰 내역 조회
- **API**: `GET /api/auctions/my-bids`
- **기능**:
  - 사용자가 참여한 경매 목록 조회
  - 내 입찰 상태 확인 (최고 입찰자, 상위 입찰됨, 종료 후 낙찰/미낙찰)
  - 마지막 입찰가, 현재가 비교
  - 결제 여부 확인

**타입 정의**:
- `MyBidsSummary`: 내 입찰 현황 (경매 정보, 내 상태, 입찰가, 최고 입찰자 여부 등)

---

## 사용자 프로필 및 마이페이지

### 1. 마이페이지
- **페이지**: `/profile`
- **API**: `GET /api/users/my-page`
- **기능**:
  - 내 정보 표시
  - 내가 생성한 경매 목록 (`auctions`)
  - 내 입찰 응답 목록 (`myBids`)
  - 내 입찰 현황 목록 (`myMyBids`)
  - 내 프로젝트 목록 (별도 조회)
  - 내 후원 내역 (별도 조회)
  - 찜한 항목 목록

**타입 정의**:
- `UserPageResponse`: 마이페이지 응답 (백엔드 UserPageResponseDto와 일치)
  - `user`: 사용자 정보
  - `auctions`: 내가 생성한 경매 목록 (AuctionSummary[])
  - `myBids`: 내 입찰 응답 목록 (BidResponse[])
  - `myMyBids`: 내 입찰 현황 목록 (MyBidsSummary[])

### 2. 프로필 상세 조회
- **API**: `GET /api/users/{id}/profile`
- **기능**: 다른 사용자의 프로필 정보 조회

**타입 정의**:
- `UserProfileResponse`: 프로필 상세 응답
  - `user`: 사용자 정보

### 3. 사용자 정보 수정
- **API**: `PUT /api/users/me`
- **기능**:
  - 이름, 닉네임, 전화번호 수정
  - 프로필 이미지 업데이트

**타입 정의**:
- `ProfileUpdateRequest`: 프로필 수정 요청

---

## 배송지 관리

### 1. 마이페이지 배송지 관리
- **페이지**: `/profile` (배송지 관리 탭)
- **기능**:
  - 배송지 목록 조회 및 표시
  - 배송지 추가 (수령인 이름, 전화번호, 우편번호, 주소, 상세주소)
  - 배송지 수정
  - 배송지 삭제
  - 기본 배송지 설정
  - 기본 배송지 표시 (배지)

**주요 특징**:
- 배송지가 없을 때 안내 메시지 표시
- 기본 배송지 자동 선택 및 표시
- 페이지 새로고침 시에도 배송지 목록 유지
- UI 개선: "기본 배송지로 설정", "배송지 수정", "배송지 삭제" 텍스트 버튼

### 2. 리워드 구매 시 배송지 선택
- **페이지**: `/project/[id]` (리워드 구매 다이얼로그)
- **기능**:
  - 기본 배송지 자동 선택
  - 배송지 드롭다운으로 선택 가능
  - 배송지가 없을 경우 다이얼로그에서 바로 추가 가능
  - 배송지 추가 후 자동 선택 및 구매 진행

**사용자 플로우**:
1. 마이페이지에서 배송지 미리 등록/관리
2. 리워드 구매 시:
   - 배송지 있음 → 기본 배송지 자동 선택 (변경 가능)
   - 배송지 없음 → 다이얼로그에서 바로 추가 가능
3. 배송지 추가 후 구매 진행

**타입 정의**:
- `AddressCreateRequest`: 배송지 생성 요청
  - `label?`: 배송지 라벨 (선택사항, 최대 30자)
  - `recipientName`: 수령인 이름 (필수, 최대 100자)
  - `phone`: 전화번호 (필수, 최대 20자)
  - `zipCode`: 우편번호 (필수, 최대 10자)
  - `address`: 주소 (필수, 최대 255자, 백엔드: address1)
  - `detailAddress`: 상세주소 (필수, 최대 255자, 백엔드: address2)
  - `setAsDefault?`: 기본 배송지로 설정 여부

- `AddressUpdateRequest`: 배송지 수정 요청 (모든 필드 선택사항)

- `AddressResponse`: 배송지 응답
  - `id`: 배송지 ID
  - `recipientName`: 수령인 이름
  - `phone`: 전화번호
  - `zipCode`: 우편번호
  - `address`: 주소
  - `detailAddress`: 상세주소
  - `isDefault`: 기본 배송지 여부

**API 함수** (`addressApi`):
- `getDefaultAddress()`: 기본 배송지 조회 (204면 null 반환)
- `getMyAddresses()`: 내 배송지 목록 조회
- `createAddress(data)`: 배송지 생성
- `getAddress(addressId)`: 배송지 상세 조회
- `updateAddress(addressId, data)`: 배송지 수정
- `deleteAddress(addressId)`: 배송지 삭제
- `setDefaultAddress(addressId)`: 기본 배송지 설정

**백엔드 DTO 매핑**:
- 프론트엔드 `address` → 백엔드 `address1`
- 프론트엔드 `detailAddress` → 백엔드 `address2`

---

## API 엔드포인트 정리

### 인증 관련
```
POST   /api/auth/login          - 로그인
POST   /api/auth/register       - 회원가입
POST   /api/auth/logout         - 로그아웃
GET    /api/auth/me             - 현재 사용자 정보 조회
GET    /api/auth/oauth/{provider} - OAuth 로그인 시작
```

### 프로젝트 관련
```
GET    /api/crowd               - 프로젝트 목록 조회
GET    /api/crowd/{id}          - 프로젝트 상세 조회
POST   /api/crowd               - 프로젝트 생성
PUT    /api/crowd/{id}          - 프로젝트 수정 (비활성화)
DELETE /api/crowd/{id}          - 프로젝트 삭제
POST   /api/crowd/{projectId}/pledges - 후원하기
GET    /api/crowd/pledges      - 내 후원 내역 조회
```

### 배송지 관련
```
GET    /api/addresses/default          - 기본 배송지 조회 (204면 없음)
GET    /api/addresses                  - 내 배송지 목록 조회
POST   /api/addresses                  - 배송지 생성 (201 Created + ID)
GET    /api/addresses/{addressId}      - 배송지 상세 조회
PATCH  /api/addresses/{addressId}      - 배송지 수정
DELETE /api/addresses/{addressId}      - 배송지 삭제
PUT    /api/addresses/{addressId}/default - 기본 배송지 설정
```

### 경매 관련
```
GET    /api/auctions            - 경매 목록 조회
GET    /api/auctions/{id}      - 경매 상세 조회
POST   /api/auctions            - 경매 생성
PUT    /api/auctions/{id}      - 경매 수정
DELETE /api/auctions/{id}      - 경매 삭제
POST   /api/auctions/{auctionId}/bids - 입찰하기
GET    /api/auctions/{auctionId}/bids - 입찰 내역 조회
GET    /api/auctions/my-bids   - 내 입찰 내역 조회
GET    /api/auctions/search    - 경매 검색
```

### 사용자 관련
```
GET    /api/users/my-page       - 마이페이지 데이터 조회
GET    /api/users/{id}/profile  - 프로필 상세 조회
GET    /api/users/{id}          - 사용자 정보 조회
PUT    /api/users/me            - 사용자 정보 수정
```

---

## 타입 정의

### 인증 관련 타입
```typescript
// 사용자 정보
interface UserResponse {
  id: number;
  email: string | null;
  name: string;
  nickname: string;
  profileImageUrl: string | null;
  phone: string | null;
  roleLevel?: number;
}

// 회원가입 요청
interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  nickname: string;
  phoneNumber: string;
  account?: string | null;
  accountHolder?: string | null;
  bankType?: BankType;
}

// 로그인 요청
interface LoginRequest {
  email: string;
  password: string;
}

// 인증 응답
interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: UserResponse;
}
```

### 배송지 관련 타입
```typescript
// 배송지 생성 요청
interface AddressCreateRequest {
  label?: string; // 배송지 라벨 (선택사항, 최대 30자)
  recipientName: string; // 수령인 이름 (필수, 최대 100자)
  phone: string; // 전화번호 (필수, 최대 20자)
  zipCode: string; // 우편번호 (필수, 최대 10자)
  address: string; // 주소 (필수, 최대 255자, 백엔드: address1)
  detailAddress: string; // 상세주소 (필수, 최대 255자, 백엔드: address2)
  setAsDefault?: boolean; // 기본 배송지로 설정 여부
}

// 배송지 수정 요청
interface AddressUpdateRequest {
  recipientName?: string;
  phone?: string;
  zipCode?: string;
  address?: string;
  detailAddress?: string;
}

// 배송지 응답
interface AddressResponse {
  id: number;
  recipientName: string;
  phone: string;
  zipCode: string;
  address: string;
  detailAddress: string;
  isDefault: boolean; // 기본 배송지 여부
}
```

### 프로젝트 관련 타입
```typescript
// 프로젝트 응답
interface ProjectResponse {
  id: number;
  creator: UserResponse;
  title: string;
  description: string;
  imageUrl: string | null;
  imageUrls?: string[] | null;
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

// 리워드 티어
interface RewardTierResponse {
  id: number;
  title: string;
  description: string;
  price: number;
  limitQuantity: number | null;
  soldQuantity: number;
}

// 후원 요청
interface PledgeCreateRequest {
  rewardTierId: number;
  amount: number;
}
```

### 경매 관련 타입
```typescript
// 경매 상태
type AuctionStatus = 'SCHEDULED' | 'RUNNING' | 'ENDED' | 'CANCELED';
type MyAuctionStatus = 'HIGHEST_BIDDER' | 'OUTBID' | 'ENDED_WON' | 'ENDED_LOST';

// 경매 생성 요청
interface AuctionCreateRequest {
  title: string;
  description: string;
  startPrice: number;
  bidStep: number;
  endAt: string; // ISO 8601
  thumbnailImageUrl?: string | null;
  categoryPath?: string | null;
  tags?: string | null;
  summary?: string | null;
}

// 경매 상세 응답
interface AuctionResponse {
  id: number;
  seller: UserResponse;
  title: string;
  description: string;
  thumbnailImageUrl: string | null;
  startPrice: number;
  currentPrice: number;
  bidStep: number;
  buyoutPrice: number | null;
  status: AuctionStatus;
  startAt: string;
  endAt: string;
  winner: UserResponse | null;
  bids?: BidSummary[];
  // ... 기타 필드
}

// 경매 목록 요약
interface AuctionSummary {
  id: number;
  title: string;
  thumbnailImageUrl: string | null;
  startPrice: number;
  currentPrice: number;
  bidStep: number;
  status: AuctionStatus;
  startAt: string;
  endAt: string;
  bidCount: number;
  categoryPath?: string | null;
  summary?: string | null;
}

// 입찰 요청
interface BidRequest {
  price: number;
}

// 입찰 응답
interface BidResponse {
  bidId: number;
  auction: AuctionResponse;
  bidPrice: number;
  isHighestBidder: boolean;
}

// 입찰 요약
interface BidSummary {
  id: number;
  bidder: UserResponse;
  bidderNickname: string;
  bidPrice: number;
  bidAt: string;
}

// 내 입찰 현황
interface MyBidsSummary {
  auctionId: number;
  auctionTitle: string;
  auctionThumbnailUrl: string | null;
  auctionStatus: AuctionStatus;
  myAuctionStatus: MyAuctionStatus;
  lastBidPrice: number;
  currentPrice: number;
  isHighestBidder: boolean;
  lastBidAt: string;
  auctionEndAt: string;
  isPaid: boolean;
}
```

### 사용자 관련 타입
```typescript
// 마이페이지 응답
interface UserPageResponse {
  user: UserResponse;
  auctions: AuctionSummary[];
  myBids: BidResponse[];
  myMyBids: MyBidsSummary[];
}

// 프로필 상세 응답
interface UserProfileResponse {
  user: UserResponse;
}

// 프로필 수정 요청
interface ProfileUpdateRequest {
  username?: string;
  nickname?: string;
  phoneNumber?: string;
  profileImageUrl?: string | null;
}
```

---

## 주요 수정 사항 및 개선점

### 1. 타입 안전성 개선
- BankType 타입 에러 수정
- 모든 API 응답 타입 명시
- 백엔드 DTO와 프론트엔드 타입 일치

### 2. OAuth 로그인 개선
- 백엔드 API를 통한 실제 사용자 정보 조회
- 프로필 완성 여부 정확한 판단

### 3. 프로젝트 생성 개선
- thumbnailImageUrl 필수 필드 처리
- 이미지 업로드 검증 추가

### 4. 경매/입찰 기능 구현
- 완전한 CRUD 기능
- 입찰 내역 및 내 입찰 현황 조회
- 타입 안전성 보장

### 5. 마이페이지 및 프로필 분리
- 마이페이지: 내 정보 및 활동 내역
- 프로필 상세: 다른 사용자 정보 조회
- 백엔드 DTO 구조와 일치

### 6. 배송지 관리 기능 구현
- 마이페이지 배송지 관리 탭 추가
- 배송지 CRUD 기능 (생성, 조회, 수정, 삭제)
- 기본 배송지 설정 및 표시
- 리워드 구매 시 배송지 선택 기능
- 배송지 없을 경우 구매 다이얼로그에서 바로 추가 가능
- 백엔드 DTO 필드명 매핑 (address1/address2)
- 페이지 새로고침 시 배송지 목록 유지
- UI 개선: 명확한 버튼 텍스트 및 수령인 표시

---

## 파일 구조

```
front/
├── app/                          # Next.js 페이지
│   ├── register/                 # 회원가입
│   ├── login/                    # 로그인
│   ├── oauth/callback/           # OAuth 콜백
│   ├── profile/                  # 마이페이지
│   ├── project/                  # 프로젝트 관련
│   │   ├── create/               # 프로젝트 생성
│   │   └── [id]/                 # 프로젝트 상세/수정
│   ├── auction/                  # 경매 관련
│   │   ├── create/               # 경매 생성
│   │   └── [id]/                 # 경매 상세/수정
│   └── ...
├── src/
│   ├── services/
│   │   └── api.ts                # API 서비스 레이어
│   ├── types/
│   │   └── api.ts                # 타입 정의
│   ├── contexts/
│   │   └── auth-context.tsx      # 인증 컨텍스트
│   └── ...
└── docs/
    └── FEATURE_SUMMARY.md        # 이 문서
```

---

## 향후 개선 사항

1. **웹소켓 연동**: 실시간 입찰 업데이트
2. **이미지 업로드**: 별도 이미지 업로드 API 연동
3. **검색 기능**: 프로젝트/경매 통합 검색
4. **알림 기능**: 입찰 알림, 경매 종료 알림
5. **결제 기능**: 입찰 성공 후 결제 처리

---

**최종 업데이트**: 2026년
**문서 버전**: 1.0
