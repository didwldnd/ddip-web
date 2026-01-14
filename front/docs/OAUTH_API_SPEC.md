# OAuth 관련 API 명세서

## 1. OAuth Provider 타입

```typescript
type OAuthProvider = 'google' | 'kakao' | 'naver'
```

## 2. OAuth 로그인 시작

### 프론트엔드 → 백엔드
- **URL**: `GET /oauth2/authorization/{provider}`
- **Provider**: `google`, `kakao`, `naver` 중 하나
- **동작**: 백엔드가 OAuth 제공자 로그인 페이지로 리다이렉트

## 3. OAuth 콜백 처리 (현재 사용하지 않음, 참고용)

### 프론트엔드 → 백엔드
- **URL**: `POST /oauth2/callback/{provider}`
- **Request Body**:
```json
{
  "code": "string",
  "state": "string (optional)"
}
```

### 백엔드 → 프론트엔드 응답
- **Response Body**:
```json
{
  "accessToken": "string",
  "refreshToken": "string (optional)",
  "user": {
    "id": "number",
    "email": "string | null",
    "name": "string",
    "nickname": "string",
    "profileImageUrl": "string | null",
    "phone": "string | null",
    "roleLevel": "number (optional)"
  }
}
```

## 4. OAuth 성공 후 리다이렉트 (현재 사용 중)

### 백엔드 → 프론트엔드 리다이렉트 URL

**현재 구현 방식:**
```
http://localhost:3000/oauth/callback?access_token={accessToken}
```

**권장 방식 (사용자 정보 포함):**
```
http://localhost:3000/oauth/callback?access_token={accessToken}&user_id={userId}&email={email}&name={name}&nickname={nickname}&profile_image_url={profileImageUrl}
```

### 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `access_token` | string | ✅ | JWT Access Token |
| `user_id` | number | ❌ | 사용자 ID (있으면 즉시 사용) |
| `email` | string | ❌ | 사용자 이메일 |
| `name` | string | ❌ | 사용자 이름 (username) |
| `nickname` | string | ❌ | 사용자 닉네임 |
| `profile_image_url` | string | ❌ | 프로필 이미지 URL |

### 예시

```java
String redirectUrl = "http://localhost:3000/oauth/callback" +
    "?access_token=" + accessToken +
    "&user_id=" + user.getId() +
    "&email=" + (user.getEmail() != null ? URLEncoder.encode(user.getEmail(), "UTF-8") : "") +
    "&name=" + (user.getName() != null ? URLEncoder.encode(user.getName(), "UTF-8") : "") +
    "&nickname=" + (user.getNickname() != null ? URLEncoder.encode(user.getNickname(), "UTF-8") : "") +
    "&profile_image_url=" + (user.getProfileImageUrl() != null ? URLEncoder.encode(user.getProfileImageUrl(), "UTF-8") : "");
response.sendRedirect(redirectUrl);
```

## 5. UserResponse 타입

```typescript
interface UserResponse {
  id: number;
  email: string | null;
  name: string;              // 백엔드의 username 필드
  nickname: string;
  profileImageUrl: string | null;
  phone: string | null;
  roleLevel?: number;        // 권한 레벨 (0: 일반 사용자, 50: 중간 관리자, 100: 최고 관리자)
}
```

## 6. 프로필 완성 페이지

OAuth 로그인 후 프로필이 완성되지 않은 경우:
- **URL**: `/auth/profile/complete`
- **조건**: `nickname`, `phone`, `name` 중 하나라도 없으면 리다이렉트

### 프로필 업데이트 API

- **URL**: `PATCH /api/users/update-profile`
- **Request Body**:
```json
{
  "username": "string",      // 필수 (이름)
  "nickname": "string",      // 필수 (닉네임)
  "phoneNumber": "string"   // 필수 (전화번호, 숫자만, 10-11자리)
}
```

- **Response Body**:
```json
{
  "id": "number",
  "email": "string | null",
  "name": "string",
  "nickname": "string",
  "profileImageUrl": "string | null",
  "phone": "string | null",
  "roleLevel": "number"
}
```

## 7. 주의사항

1. **URL 인코딩**: 쿼리 파라미터에 특수문자가 포함될 수 있으므로 `URLEncoder.encode()` 사용 필수
2. **프로토콜**: 개발 환경에서는 `http://localhost:3000` 사용 (SSL 에러 방지)
3. **사용자 정보**: 쿼리 파라미터로 전달하면 별도 API 호출 없이 즉시 사용 가능
4. **프로필 완성**: OAuth 로그인 시 프로필이 완성되지 않았으면 자동으로 프로필 완성 페이지로 리다이렉트
