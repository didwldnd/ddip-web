import { Navigation } from "@/src/components/navigation"
import { HeroBanner } from "@/src/components/hero-banner"
import { ProjectCard } from "@/src/components/project-card"
import { AuctionCard } from "@/src/components/auction-card"
import { Button } from "@/src/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"

// TODO: 나중에 API로 교체 (projectApi.getProjects(), auctionApi.getAuctions())
// 현재는 Mock 데이터 사용 - 실제로는 판매자가 등록한 이미지 URL이 API 응답에 포함됨
const projects = [
  {
    id: "1",
    title: "스마트 홈 IoT 조명 시스템",
    description: "음성 제어가 가능한 차세대 스마트 조명으로 집안 분위기를 한층 업그레이드하세요",
    image: "/placeholder.svg",
    category: "테크",
    currentAmount: 15000000,
    goalAmount: 20000000,
    backers: 342,
    daysLeft: 14,
  },
  {
    id: "2",
    title: "친환경 대나무 칫솔 세트",
    description: "100% 생분해 가능한 대나무로 만든 프리미엄 칫솔로 지구를 지키세요",
    image: "/placeholder.svg",
    category: "친환경",
    currentAmount: 8500000,
    goalAmount: 10000000,
    backers: 521,
    daysLeft: 7,
  },
  {
    id: "3",
    title: "아티스트 컬래버레이션 아트북",
    description: "국내 유명 일러스트레이터 20명의 작품을 담은 특별한 아트북 프로젝트",
    image: "/placeholder.svg",
    category: "아트",
    currentAmount: 12000000,
    goalAmount: 15000000,
    backers: 287,
    daysLeft: 21,
  },
  {
    id: "4",
    title: "커피 애호가를 위한 휴대용 그라인더",
    description: "언제 어디서나 갓 갈은 원두로 최상의 커피를 즐기세요",
    image: "/placeholder.svg",
    category: "라이프",
    currentAmount: 25000000,
    goalAmount: 30000000,
    backers: 612,
    daysLeft: 10,
  },
]

const auctions = [
  {
    id: "1",
    title: "한정판 빈티지 카메라 콜렉션",
    description: "1970년대 생산된 희귀 필름 카메라, 완벽한 작동 상태",
    image: "/placeholder.svg",
    category: "콜렉터블",
    currentBid: 2500000,
    bidCount: 23,
    timeLeft: "2시간 30분",
    isLive: true,
  },
  {
    id: "2",
    title: "유명 작가 사인본 소설 세트",
    description: "베스트셀러 작가의 친필 사인과 메시지가 담긴 특별판",
    image: "/placeholder.svg",
    category: "도서",
    currentBid: 850000,
    bidCount: 15,
    timeLeft: "5시간 12분",
    isLive: true,
  },
  {
    id: "3",
    title: "프리미엄 기계식 시계",
    description: "스위스 무브먼트를 탑재한 럭셔리 시계, 미개봉 새 제품",
    image: "/placeholder.svg",
    category: "패션",
    currentBid: 4200000,
    bidCount: 31,
    timeLeft: "1일 3시간",
    isLive: false,
  },
  {
    id: "4",
    title: "희귀 레코드 LP 한정판",
    description: "절판된 재즈 클래식 레코드, 완벽한 컨디션",
    image: "/placeholder.svg",
    category: "음악",
    currentBid: 620000,
    bidCount: 18,
    timeLeft: "12시간 45분",
    isLive: true,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroBanner />

      <main className="container mx-auto px-4 py-12">
        <Tabs defaultValue="projects" className="w-full">
          <div className="mb-8 flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="projects" className="text-base">
                크라우드펀딩
              </TabsTrigger>
              <TabsTrigger value="auctions" className="text-base">
                진행 중인 경매
              </TabsTrigger>
            </TabsList>

            <Button variant="outline">전체보기</Button>
          </div>

          <TabsContent value="projects" className="mt-0">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">인기 프로젝트</h2>
              <p className="text-muted-foreground">지금 가장 핫한 크라우드펀딩 프로젝트를 만나보세요</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} {...project} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="auctions" className="mt-0">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">라이브 경매</h2>
              <p className="text-muted-foreground">지금 실시간으로 진행 중인 경매에 참여하세요</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {auctions.map((auction) => (
                <AuctionCard key={auction.id} {...auction} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 font-bold">FundIt</h3>
              <p className="text-sm text-muted-foreground">혁신적인 아이디어와 특별한 제품을 만나는 공간</p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">서비스</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>크라우드펀딩</li>
                <li>경매</li>
                <li>프로젝트 시작하기</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">지원</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>고객센터</li>
                <li>가이드</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">회사</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>소개</li>
                <li>이용약관</li>
                <li>개인정보처리방침</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            © 2026 FundIt. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
