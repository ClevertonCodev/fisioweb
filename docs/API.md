# API Reference - Clinic App

## Base URL

```
http://localhost:8000/api
```

Todas as requisições devem incluir os headers:
```
Content-Type: application/json
Accept: application/json
```

Rotas protegidas exigem:
```
Authorization: Bearer {jwt_token}
```

---

## Endpoints por Módulo

Cada módulo (admin, clinic, patient) possui os mesmos 4 endpoints:

### Login
```
POST /{modulo}/auth/login
```

**Body:**
```json
{
    "email": "string (required)",
    "password": "string (required, min:6)"
}
```

**Response 200:**
```json
{
    "access_token": "eyJ0eXAiOiJKV1Q...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
        "id": 1,
        "name": "Nome",
        "email": "email@exemplo.com",
        "created_at": "2026-02-27T00:00:00.000000Z",
        "updated_at": "2026-02-27T00:00:00.000000Z"
    }
}
```

**Response 401:**
```json
{
    "message": "Credenciais inválidas."
}
```

---

### Me (dados do usuário autenticado)
```
GET /{modulo}/auth/me
```
**Headers:** `Authorization: Bearer {token}`

**Response 200:**
```json
{
    "id": 1,
    "name": "Nome",
    "email": "email@exemplo.com",
    "created_at": "...",
    "updated_at": "..."
}
```

---

### Logout
```
POST /{modulo}/auth/logout
```
**Headers:** `Authorization: Bearer {token}`

**Response 200:**
```json
{
    "message": "Logout realizado com sucesso."
}
```

---

### Refresh Token
```
POST /{modulo}/auth/refresh
```
**Headers:** `Authorization: Bearer {token}`

**Response 200:**
```json
{
    "access_token": "novo_token...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": { ... }
}
```

---

## Tabela de Rotas Completa

| Método | URI                          | Guard   |
|--------|------------------------------|---------|
| POST   | /api/admin/auth/login        | -       |
| GET    | /api/admin/auth/me           | admin   |
| POST   | /api/admin/auth/logout       | admin   |
| POST   | /api/admin/auth/refresh      | admin   |
| POST   | /api/clinic/auth/login       | -       |
| GET    | /api/clinic/auth/me          | clinic  |
| POST   | /api/clinic/auth/logout      | clinic  |
| POST   | /api/clinic/auth/refresh     | clinic  |
| POST   | /api/patient/auth/login      | -       |
| GET    | /api/patient/auth/me         | patient |
| POST   | /api/patient/auth/logout     | patient |
| POST   | /api/patient/auth/refresh    | patient |
