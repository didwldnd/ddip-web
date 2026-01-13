/**
 * 스크롤 위치 보존 유틸리티
 * 페이지를 떠났다가 돌아왔을 때 스크롤 위치를 복원
 */

const SCROLL_POSITION_KEY_PREFIX = 'ddip_scroll_'

/**
 * 현재 페이지의 스크롤 위치 저장
 */
export function saveScrollPosition(pathname: string): void {
  if (typeof window === 'undefined') return
  
  const key = `${SCROLL_POSITION_KEY_PREFIX}${pathname}`
  const scrollY = window.scrollY
  
  try {
    sessionStorage.setItem(key, String(scrollY))
  } catch (error) {
    console.error('스크롤 위치 저장 실패:', error)
  }
}

/**
 * 저장된 스크롤 위치 복원
 * @param pathname 경로
 * @param delay 복원 지연 시간 (ms) - 데이터 로드 대기용
 */
export function restoreScrollPosition(pathname: string, delay: number = 0): void {
  if (typeof window === 'undefined') return
  
  const key = `${SCROLL_POSITION_KEY_PREFIX}${pathname}`
  
  try {
    const savedScrollY = sessionStorage.getItem(key)
    if (savedScrollY !== null) {
      const scrollY = parseInt(savedScrollY, 10)
      if (!isNaN(scrollY) && scrollY > 0) {
        const restore = () => {
          // 여러 프레임에 걸쳐 복원 시도 (DOM 렌더링 대기)
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo({
                top: scrollY,
                behavior: 'auto' // 즉시 이동 (부드러운 스크롤 없음)
              })
            })
          })
        }
        
        if (delay > 0) {
          setTimeout(restore, delay)
        } else {
          restore()
        }
      }
    }
  } catch (error) {
    console.error('스크롤 위치 복원 실패:', error)
  }
}

/**
 * 저장된 스크롤 위치 삭제
 */
export function clearScrollPosition(pathname: string): void {
  if (typeof window === 'undefined') return
  
  const key = `${SCROLL_POSITION_KEY_PREFIX}${pathname}`
  
  try {
    sessionStorage.removeItem(key)
  } catch (error) {
    console.error('스크롤 위치 삭제 실패:', error)
  }
}

/**
 * 모든 스크롤 위치 삭제
 */
export function clearAllScrollPositions(): void {
  if (typeof window === 'undefined') return
  
  try {
    const keys = Object.keys(sessionStorage)
    keys.forEach(key => {
      if (key.startsWith(SCROLL_POSITION_KEY_PREFIX)) {
        sessionStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('스크롤 위치 전체 삭제 실패:', error)
  }
}
