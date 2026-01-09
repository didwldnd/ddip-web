/**
 * 권한 관리 유틸리티
 * OAuth 도입 시에도 확장 가능하도록 설계
 */

import { UserResponse } from "@/src/types/api"
import { ProjectResponse, AuctionResponse } from "@/src/types/api"

/**
 * 사용자가 프로젝트의 생성자인지 확인
 */
export function isProjectCreator(
  project: ProjectResponse,
  user: UserResponse | null
): boolean {
  if (!user || !project) return false
  return project.creator.id === user.id
}

/**
 * 사용자가 경매의 판매자인지 확인
 */
export function isAuctionSeller(
  auction: AuctionResponse,
  user: UserResponse | null
): boolean {
  if (!user || !auction) return false
  return auction.seller.id === user.id
}

/**
 * 사용자가 프로젝트를 수정할 수 있는지 확인
 * - 생성자만 수정 가능
 * - DRAFT 상태일 때만 수정 가능
 */
export function canEditProject(
  project: ProjectResponse,
  user: UserResponse | null
): boolean {
  if (!isProjectCreator(project, user)) return false
  // DRAFT 상태일 때만 수정 가능
  return project.status === "DRAFT"
}

/**
 * 사용자가 경매를 수정할 수 있는지 확인
 * - 판매자만 수정 가능
 * - SCHEDULED 상태일 때만 수정 가능
 */
export function canEditAuction(
  auction: AuctionResponse,
  user: UserResponse | null
): boolean {
  if (!isAuctionSeller(auction, user)) return false
  // SCHEDULED 상태일 때만 수정 가능
  return auction.status === "SCHEDULED"
}

/**
 * 사용자가 프로젝트를 취소할 수 있는지 확인
 * - 생성자만 취소 가능
 * - DRAFT 또는 OPEN 상태일 때만 취소 가능
 */
export function canCancelProject(
  project: ProjectResponse,
  user: UserResponse | null
): boolean {
  if (!isProjectCreator(project, user)) return false
  // DRAFT 또는 OPEN 상태일 때만 취소 가능
  return project.status === "DRAFT" || project.status === "OPEN"
}

/**
 * 사용자가 경매를 취소할 수 있는지 확인
 * - 판매자만 취소 가능
 * - SCHEDULED 또는 RUNNING 상태일 때만 취소 가능
 */
export function canCancelAuction(
  auction: AuctionResponse,
  user: UserResponse | null
): boolean {
  if (!isAuctionSeller(auction, user)) return false
  // SCHEDULED 또는 RUNNING 상태일 때만 취소 가능
  return auction.status === "SCHEDULED" || auction.status === "RUNNING"
}

/**
 * 사용자가 프로젝트에 후원할 수 있는지 확인
 * - 로그인한 사용자만 가능
 * - 생성자는 자신의 프로젝트에 후원 불가
 * - OPEN 상태일 때만 가능
 */
export function canSupportProject(
  project: ProjectResponse,
  user: UserResponse | null
): boolean {
  if (!user) return false
  // 생성자는 자신의 프로젝트에 후원 불가
  if (isProjectCreator(project, user)) return false
  // OPEN 상태일 때만 후원 가능
  return project.status === "OPEN"
}

/**
 * 사용자가 경매에 입찰할 수 있는지 확인
 * - 로그인한 사용자만 가능
 * - 판매자는 자신의 경매에 입찰 불가
 * - RUNNING 상태일 때만 가능
 */
export function canBidAuction(
  auction: AuctionResponse,
  user: UserResponse | null
): boolean {
  if (!user) return false
  // 판매자는 자신의 경매에 입찰 불가
  if (isAuctionSeller(auction, user)) return false
  // RUNNING 상태일 때만 입찰 가능
  return auction.status === "RUNNING"
}
