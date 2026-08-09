# Contract — Module Boundaries

**Feature**: `specs/016-patient-login-area` | **Skill**: `architecture-paradigm-modular-monolith`

---

## 1. Mapa de ownership

| Capacidade | Módulo dono | Esta feature toca? |
|------------|-------------|--------------------|
| Identidade e autenticação do paciente | **Patient** | **Sim** — é o escopo inteiro |
| Cadastro do paciente (criação, senha padrão) | **Patient** | Não — só leitura do que já é gravado |
| Identificação da clínica (`id`, `name`, `slug`) | **Clinic** | Leitura mínima pela relação existente |
| Programas do paciente (destino pós-login) | **TreatmentProgram** | **Não** |

**Resumo**: uma feature de fronteira estreita. Todo código novo de backend nasce e morre em `modules/Patient`.

---

## 2. Dependências permitidas

### `Patient` → `Clinic` (leitura de identificação)

```php
// modules/Patient/app/Models/Patient.php — já existe
public function clinic(): BelongsTo
{
    return $this->belongsTo(Clinic::class);
}
```

**Permitido** porque:
- A relação **já existe** e já é usada por `AuthController::findClinics` (`with('clinic:id,name')`).
- Lê apenas dados de **identificação pública** — `id`, `name`, `slug`. Nenhuma regra de negócio de Clinic atravessa a fronteira.
- `patients.clinic_id` é FK direta: o vínculo é estrutural, não uma dependência inventada por esta feature.

**Limite**: esta feature estende o `select` para incluir `slug` e nada mais. Se em algum momento o login precisar de **regra** de Clinic (ex.: "clínica com plano suspenso não autentica paciente"), isso **não** pode virar query direta em tabela de Clinic — exige um contrato público (`ClinicServiceInterface`) exposto por Clinic. Não é o caso no v1.

### `Patient` → `clinics.slug` (resolução do contexto)

O passo contextual precisa traduzir `slug` → `clinic_id`. Duas formas aceitáveis:

| Forma | Quando |
|-------|--------|
| Frontend já envia `clinic_id`, resolvido por um endpoint público de Clinic | Preferível se Clinic já expõe leitura por slug |
| `Patient` resolve o slug pela relação `clinic` | Aceitável — mesma natureza de leitura do `findClinics` |

Verificar na implementação se `Clinic` já expõe leitura pública por slug; havendo, **reusar** em vez de duplicar a tradução dentro de Patient.

---

## 3. Dependências proibidas

| Proibido | Motivo |
|----------|--------|
| `Patient` importar Model/Repository de `TreatmentProgram` | Login não conhece programa. O destino pós-login é decisão de **navegação**, resolvida no frontend pelo `next` |
| `TreatmentProgram` importar `PatientAuthService` ou o novo VO | Identidade já chega pelo guard: `auth('patient')->user()` |
| Qualquer módulo consultar `patients.password` fora de `Patient` | Credencial é interna ao dono da identidade |
| `Patient` escrever em tabela de `Clinic` | Leitura de identificação apenas |

---

## 4. ADR-016 — Login do paciente permanece em `modules/Patient`

**Status**: Aceito · **Data**: 2026-08-08

**Contexto**

O login do paciente serve as telas de `TreatmentProgram` (lista, execução, feedback). Surge a pergunta natural de onde a capacidade deve viver: perto de quem a consome, ou perto de quem é dono da identidade.

**Decisão**

A capacidade permanece em `modules/Patient`. `TreatmentProgram` não é tocado por esta feature.

**Consequências**

*Positivas*
- Fronteira intacta: identidade num módulo, prescrição em outro.
- `TreatmentProgram` continua recebendo o paciente autenticado pelo guard, sem conhecer o mecanismo.
- Se um terceiro consumidor de identidade do paciente aparecer, não há nada a mover.

*Negativas*
- A regra de "para onde ir depois do login" fica no frontend, não no backend. Aceitável: é decisão de navegação, não de domínio — e é o que permite o backend não conhecer programa.

*Neutras*
- `Patient` passa a ler `clinics.slug` além de `id`/`name`. Ampliação mínima de uma leitura que já existia.

**Alternativas rejeitadas**

| Alternativa | Motivo da rejeição |
|-------------|--------------------|
| Mover login para `TreatmentProgram` | Inverte a fronteira; prescrição passaria a conhecer credencial |
| Criar módulo `Auth` transversal | Módulo anêmico, sem segundo consumidor; terceiro lugar para procurar regra de autenticação |
| Duplicar login dentro de `TreatmentProgram` | Duas fontes de verdade para credencial — o pior desfecho possível |

---

## 5. Fitness check

Verificações que a implementação deve sustentar:

```bash
# 1. Patient não conhece TreatmentProgram
grep -rn "TreatmentProgram" modules/Patient/app/ && echo "VIOLAÇÃO" || echo "ok"

# 2. TreatmentProgram não conhece o serviço de auth do paciente
grep -rn "PatientAuthService\|PatientIdentifier" modules/TreatmentProgram/app/ && echo "VIOLAÇÃO" || echo "ok"

# 3. Nenhum módulo além de Patient toca a coluna password de paciente
grep -rn "patients.*password\|->password" modules/ --include=*.php | grep -v "modules/Patient" && echo "REVISAR" || echo "ok"

# 4. Página de login não importa apiClient (regra 4 do projeto)
grep -rn "apiClient\|axios" resources/js/pages/patient/ && echo "VIOLAÇÃO" || echo "ok"
```

---

## 6. Fronteiras no frontend

```
pages/patient/auth/PatientLoginPage.tsx
        │  (nunca importa apiClient — regra 4)
        ▼
application/patient/use-patient-auth.ts
        │  (hooks + orquestração dos passos)
        ▼
infrastructure/repositories/api-patient-auth.ts
        │  (único ponto de HTTP; mapeia snake_case ↔ camelCase — regra 5)
        ▼
infrastructure/api/client.ts  →  /api/patient/auth/*  (guard `patient` inferido pela URL)
```

`domain/patient/auth.ts` é folha: tipos puros em camelCase, sem `_at`, sem prefixo `Api`, sem constante de UI (regra 6). Não importa nada das camadas acima.

`application/patient/patient-auth-paths.ts` é irmão de `patient-program-paths.ts` e concentra tanto os paths do login quanto a **validação do `next`** — mantendo a regra de open redirect num único lugar testável, em vez de espalhada entre página e navbar.
