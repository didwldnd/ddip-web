/**
 * 날짜 관련 유틸리티 함수
 */

/**
 * 날짜 문자열을 Date 객체로 안전하게 파싱
 * @param dateString ISO 형식의 날짜 문자열
 * @returns 유효한 Date 객체 또는 null
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 날짜가 유효한지 확인
 * @param date Date 객체
 * @returns 유효한 날짜인지 여부
 */
export function isValidDate(date: Date | null): date is Date {
  return date !== null && !isNaN(date.getTime());
}

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @param dateString ISO 형식의 날짜 문자열
 * @param options Intl.DateTimeFormatOptions
 * @returns 포맷된 날짜 문자열 또는 "날짜 오류"
 */
export function formatDate(
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseDate(dateString);
  if (!isValidDate(date)) {
    return '날짜 오류';
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return date.toLocaleDateString('ko-KR', defaultOptions);
}

/**
 * 두 날짜 사이의 일수 계산
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 * @returns 일수 (음수 가능)
 */
export function daysBetween(startDate: Date, endDate: Date): number {
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 날짜가 과거인지 확인
 * @param dateString ISO 형식의 날짜 문자열
 * @returns 과거 날짜인지 여부
 */
export function isPastDate(dateString: string | null | undefined): boolean {
  const date = parseDate(dateString);
  if (!isValidDate(date)) {
    return false;
  }
  return date.getTime() < Date.now();
}
