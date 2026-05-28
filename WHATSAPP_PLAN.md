# Plano de Integração WhatsApp

> Status: planejamento
> Data: 2026-03-31

---

## Contexto do sistema

Sistema multi-tenant: **Admin** (geral) → **Clínicas** (cada uma com seus pacientes) → **Pacientes**.
Cada clínica tem seu próprio dashboard e gerencia seus pacientes de forma independente.

---

## Duas funcionalidades distintas

### A) Aniversariantes — SEM Twilio (gratuito)

No dashboard da clínica, exibir card "Aniversariantes do mês" listando os pacientes.
Ao lado de cada nome, um botão que **abre o WhatsApp Web** diretamente via link `https://wa.me/55{phone}?text={mensagem}`.

Não há integração com API nenhuma. O próprio clínico decide se quer mandar ou não.
Custo: **zero**.

### B) Link de tratamento — Twilio API

Quando o sistema precisa enviar um link de tratamento pro paciente (ação disparada pela clínica no sistema), usa a Twilio WhatsApp API para enviar a mensagem automaticamente, sem abrir WhatsApp Web.

---

## 1. Módulo `WhatsApp` — Infraestrutura genérica

Seguir o mesmo padrão do módulo `Cloudflare`: módulo de infraestrutura sem rotas próprias, apenas Service + Interface. Quem consome é o módulo `Clinic` (ou qualquer outro que precise enviar mensagem).

```
modules/WhatsApp/
├── app/
│   ├── Contracts/
│   │   └── WhatsAppServiceInterface.php
│   ├── Services/
│   │   └── TwilioWhatsAppService.php
│   ├── Jobs/
│   │   └── SendWhatsAppMessageJob.php
│   ├── Console/
│   │   └── Commands/
│   │       └── TestWhatsAppCommand.php
│   └── Providers/
│       ├── WhatsAppServiceProvider.php
│       ├── EventServiceProvider.php
│       └── RouteServiceProvider.php
├── config/
│   └── config.php
├── module.json
└── composer.json
```

### Por que genérico?

O módulo não sabe o que está sendo enviado. Ele recebe um número, uma mensagem (texto ou template) e opcionalmente um mediaUrl (vídeo, imagem, PDF). Qualquer módulo pode usar:

```php
// Exemplo de uso por qualquer módulo
app(WhatsAppServiceInterface::class)->send(
    to: '+5511999998888',
    body: 'Seu tratamento está disponível: https://app.clinica.com/t/abc123',
);

// Enviando vídeo ou mídia
app(WhatsAppServiceInterface::class)->send(
    to: '+5511999998888',
    body: 'Veja o vídeo do exercício:',
    mediaUrl: 'https://cdn.clinica.com/videos/exercicio-lombar.mp4',
);
```

---

## 2. Interface do serviço

```php
<?php

namespace Modules\WhatsApp\Contracts;

interface WhatsAppServiceInterface
{
    /**
     * Envia mensagem de texto simples (ou com mídia).
     *
     * @param  string       $to        Número no formato internacional (+5511999998888)
     * @param  string       $body      Corpo da mensagem
     * @param  string|null  $mediaUrl  URL pública de mídia (imagem, vídeo, PDF)
     * @return array{sid: string, status: string}
     */
    public function send(string $to, string $body, ?string $mediaUrl = null): array;

    /**
     * Envia mensagem usando template aprovado pela Meta.
     *
     * @param  string  $to              Número no formato internacional
     * @param  string  $contentSid      Content SID do template no Twilio
     * @param  array   $contentVariables  Variáveis do template (ex: ['1' => 'João'])
     * @return array{sid: string, status: string}
     */
    public function sendTemplate(string $to, string $contentSid, array $contentVariables = []): array;

    /**
     * Verifica se o serviço está configurado e operacional.
     */
    public function isConfigured(): bool;

    /**
     * Normaliza telefone BR para formato internacional.
     *
     * "(11) 99999-8888" → "+5511999998888"
     * "11999998888"     → "+5511999998888"
     * "+5511999998888"  → "+5511999998888"
     */
    public static function normalizePhone(string $phone, string $countryCode = '55'): string;
}
```

---

## 3. Job genérico (fila)

```php
// SendWhatsAppMessageJob — recebe qualquer payload

dispatch(new SendWhatsAppMessageJob(
    to: $patient->phone,
    body: "Olá {$patient->name}, seu plano de tratamento: {$link}",
    mediaUrl: null,
));
```

O job chama `WhatsAppServiceInterface::send()`, tem 3 retries com backoff exponencial, e loga sucesso/falha. Assim o request HTTP da clínica retorna instantâneo.

---

## 4. Configuração (.env)

```env
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=+14155238886
```

> `+14155238886` = número do sandbox Twilio para testes.
> Em produção, será o número aprovado pela Meta para a aplicação.

`config/whatsapp.php`:
```php
return [
    'twilio_sid'    => env('TWILIO_SID'),
    'twilio_token'  => env('TWILIO_AUTH_TOKEN'),
    'from_number'   => env('TWILIO_WHATSAPP_FROM'),
    'enabled'       => env('WHATSAPP_ENABLED', false),
];
```

---

## 5. Comando de teste (padrão Cloudflare)

```bash
php artisan whatsapp:test +5511999998888
```

Envia mensagem de teste pro número informado e exibe status. Mesmo padrão do `cloudflare:test`.

---

## 6. Funcionalidade A — Aniversariantes (Dashboard)

### Backend

Novo endpoint na rota do módulo Clinic (guard `clinic`):

```
GET /api/clinic/patients/birthdays?month={mm}
```

Retorna pacientes da clínica logada cujo `birth_date` tem mês igual ao informado (default: mês atual).

Response:
```json
{
  "data": [
    {
      "id": 42,
      "name": "José Antônio de Souza",
      "phone": "+5511999998888",
      "birth_date": "1985-03-03",
      "photo_url": "https://cdn.clinica.com/photos/jose.jpg"
    }
  ]
}
```

### Frontend — Card no DashboardPage.tsx

Card "Aniversariantes do mês" na página `pages/clinic/DashboardPage.tsx`:

- Lista nome, foto, dia do aniversário
- Botão "Enviar mensagem" ao lado de cada paciente
- O botão monta a URL `https://wa.me/55{phone}?text={mensagem_encoded}` e abre em nova aba
- A mensagem padrão é configurável (ex: "Olá {nome}, a equipe da clínica deseja um feliz aniversário!")
- Nenhuma API de WhatsApp envolvida — é só um link

```
┌─────────────────────────────────────────────┐
│  🎂 Aniversariantes de março (16)           │
├─────────────────────────────────────────────┤
│  👤 José Antônio de Souza     3 mar  [📱]  │
│  👤 Rejane Cristina Monte     4 mar  [📱]  │
│  👤 Lydia Constança Tinoco    7 mar  [📱]  │
│  👤 Paulo Arruda da Câmara    8 mar  [📱]  │
│  👤 Márcia de Fátima Pereira  12 mar [📱]  │
│  ...                                        │
└─────────────────────────────────────────────┘
                                  [📱] = abre wa.me
```

### Camadas (seguindo frontend-standards)

| Camada | Arquivo | Responsabilidade |
|---|---|---|
| domain | `domain/clinic/patient-birthday.ts` | Tipo `PatientBirthday` (id, name, phone, birthDate, photoUrl) |
| application | `application/clinic/use-patient-birthdays.ts` | Hook `usePatientBirthdays(month)` com React Query |
| infrastructure | `infrastructure/repositories/api-clinic-patients.ts` | Fetch do endpoint, mapper `toEntity()` |
| pages | `pages/clinic/DashboardPage.tsx` | Renderiza card com dados do hook |
| components | `components/clinic/BirthdayCard.tsx` | Componente visual do card de aniversariantes |

---

## 7. Funcionalidade B — Envio de tratamento (Twilio)

### Backend

Novo endpoint no módulo Clinic (guard `clinic`):

```
POST /api/clinic/patients/{patient}/send-treatment
```

Body:
```json
{
  "program_id": 15,
  "message": "Olá, seu plano de tratamento está disponível!"
}
```

O controller:
1. Busca o paciente (valida que pertence à clínica logada)
2. Monta o link do tratamento (ex: `https://app.com/t/{token}`)
3. Faz `dispatch(new SendWhatsAppMessageJob(...))`
4. Retorna 202 Accepted imediatamente

### Frontend

Na página do programa/tratamento do paciente, botão "Enviar via WhatsApp":
- Clica → `POST /api/clinic/patients/{id}/send-treatment`
- Toast de sucesso: "Mensagem enviada!"
- Toast de erro se paciente não tem telefone

---

## 8. Custo estimado (apenas funcionalidade B)

Aniversários são gratuitos (wa.me). Só o envio de tratamento usa Twilio.

| Item | Valor |
|---|---|
| Taxa Twilio | US$ 0,005/mensagem |
| Taxa Meta (utilitário, Brasil) | US$ 0,0034/mensagem |
| **Total por mensagem** | **~US$ 0,0084 (~R$ 0,05)** |
| 100 tratamentos/mês | ~US$ 0,84/mês |
| 500 tratamentos/mês | ~US$ 4,20/mês |
| Trial gratuito Twilio | US$ 15,50 de crédito (~1.800 mensagens) |

---

## 9. Dependência

```bash
composer require twilio/sdk
```

---

## 10. Arquivos a criar / modificar

### Criar (módulo WhatsApp — infraestrutura)

| Arquivo | Descrição |
|---|---|
| `modules/WhatsApp/module.json` | Registro do módulo |
| `modules/WhatsApp/composer.json` | Dependências do módulo |
| `modules/WhatsApp/app/Contracts/WhatsAppServiceInterface.php` | Interface genérica |
| `modules/WhatsApp/app/Services/TwilioWhatsAppService.php` | Implementação Twilio |
| `modules/WhatsApp/app/Jobs/SendWhatsAppMessageJob.php` | Job genérico para fila |
| `modules/WhatsApp/app/Console/Commands/TestWhatsAppCommand.php` | Comando de teste |
| `modules/WhatsApp/app/Providers/WhatsAppServiceProvider.php` | Bind interface → implementação |
| `modules/WhatsApp/app/Providers/EventServiceProvider.php` | Eventos (vazio por ora) |
| `modules/WhatsApp/app/Providers/RouteServiceProvider.php` | Sem rotas (igual Cloudflare) |
| `modules/WhatsApp/config/config.php` | Config Twilio |

### Criar (funcionalidade A — aniversariantes)

| Arquivo | Descrição |
|---|---|
| `modules/Clinic/app/Http/Controllers/PatientBirthdayController.php` | Endpoint birthdays |
| `resources/js/domain/clinic/patient-birthday.ts` | Tipo PatientBirthday |
| `resources/js/application/clinic/use-patient-birthdays.ts` | Hook React Query |
| `resources/js/infrastructure/repositories/api-clinic-birthdays.ts` | Repository API |
| `resources/js/components/clinic/BirthdayCard.tsx` | Componente visual |
| `resources/js/pages/clinic/DashboardPage.tsx` | Modificar — adicionar card |

### Criar (funcionalidade B — envio de tratamento)

| Arquivo | Descrição |
|---|---|
| `modules/Clinic/app/Http/Controllers/SendTreatmentController.php` | Endpoint send-treatment |
| `modules/Clinic/app/Http/Requests/SendTreatmentRequest.php` | Validação |
| `modules/Clinic/routes/api.php` | Modificar — adicionar rota |
| Frontend (na página de programa do paciente) | Botão + mutation useSendTreatment |

### Modificar

| Arquivo | Mudança |
|---|---|
| `.env` + `.env.example` | Variáveis Twilio |
| `composer.json` | `twilio/sdk` |
| `modules_statuses.json` | Ativar módulo WhatsApp |

---

## 11. Passos para implementar

### Fase 1 — Módulo WhatsApp (infraestrutura)
1. Criar estrutura do módulo seguindo padrão Cloudflare
2. `composer require twilio/sdk`
3. Implementar `TwilioWhatsAppService` + Job + comando de teste
4. Adicionar variáveis no `.env`
5. Testar com `php artisan whatsapp:test +55XXXXXXXXXXX`

### Fase 2 — Aniversariantes (dashboard, gratuito)
6. Criar endpoint `GET /api/clinic/patients/birthdays`
7. Criar componente `BirthdayCard.tsx` + hook
8. Integrar no `DashboardPage.tsx`
9. Testar abertura do `wa.me/` em nova aba

### Fase 3 — Envio de tratamento (Twilio)
10. Criar endpoint `POST /api/clinic/patients/{patient}/send-treatment`
11. quando clicar em enviar 
12. Testar no sandbox Twilio
13. Aprovação de template na Meta + upgrade para produção

---

## 12. Referências

- [Twilio WhatsApp Quickstart (PHP)](https://www.twilio.com/docs/whatsapp/quickstart/php)
- [Twilio PHP SDK](https://www.twilio.com/docs/libraries/php)
- [WhatsApp Pricing Brasil](https://www.twilio.com/pt-br/whatsapp/pricing)
- [wa.me Deep Links](https://faq.whatsapp.com/5913398998672934/)
- [Meta Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines/)
