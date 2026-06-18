# Módulo GoogleCalendar

Integração **bidirecional** entre a Agenda do sistema e o Google Calendar de cada usuário (fisioterapeuta).

- **Push** (sistema → Google): ao criar/editar/cancelar uma consulta, o evento é refletido no Google Calendar do responsável.
- **Pull** (Google → sistema): a cada poucos minutos o sistema busca os eventos da agenda Google de cada usuário conectado e os mostra na Agenda.

A conexão é **individual por usuário**: cada fisioterapeuta autoriza a própria conta Google. Um não vê a agenda Google do outro.

---

## 1. Como funciona (visão geral)

```
                 PUSH (imediato, via fila)
  Consulta criada ──────────────────────────────►  Google Calendar
  no sistema          SyncAppointmentToGoogleJob       (do usuário)

                 PULL (a cada ~5 min, via fila)
  Google Calendar ──────────────────────────────►  Agenda do sistema
  (do usuário)        PullGoogleCalendarJob          (clinic_appointments)
```

- Tabela única: **`clinic_appointments`**. A coluna **`source`** distingue a origem:
  - `system` → consulta criada no sistema
  - `google` → evento trazido do Google
- A coluna **`google_event_id`** liga cada linha ao evento no Google e **garante que o pull não duplique** (idempotência).
- Os tokens OAuth de cada usuário ficam em colunas `google_*` da tabela **`clinic_users`** (criptografados).
- Horários são sempre armazenados em **UTC** e exibidos no fuso da clínica (GMT-3).

---

## 2. Configuração (uma vez por ambiente)

### 2.1. Variáveis no `.env`

```env
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=sua-chave-secreta
GOOGLE_REDIRECT_URI="http://localhost:8000/api/clinic/google-calendar/callback"

# Opcionais (têm padrão)
GOOGLE_PULL_INTERVAL_MINUTES=5      # de quanto em quanto tempo o pull roda
GOOGLE_PULL_WINDOW_MONTHS=3         # quantos meses à frente sincronizar do Google
GOOGLE_FRONTEND_REDIRECT="/clinica/usuarios"   # tela para onde volta após conectar
```

> ⚠️ O `GOOGLE_REDIRECT_URI` precisa bater **exatamente** (protocolo, host, porta e caminho) com o que está cadastrado no Google Cloud Console. Sempre que mexer no `.env`, rode `php artisan config:clear`.

### 2.2. Credenciais no Google Cloud Console

1. Acesse https://console.cloud.google.com
2. **APIs e Serviços → Biblioteca** → ative a **Google Calendar API**
3. **APIs e Serviços → Credenciais** → **Criar credenciais → ID do cliente OAuth** → tipo **Aplicativo da Web**
4. Em **URIs de redirecionamento autorizados**, cadastre **exatamente**:
   ```
   http://localhost:8000/api/clinic/google-calendar/callback
   ```
   (esse é o **callback do backend** — NÃO é a tela do frontend)
5. Copie o **Client ID** e o **Client Secret** para o `.env`
6. **APIs e Serviços → Tela de consentimento OAuth → Usuários de teste**: adicione os e-mails que vão conectar (até 100, de graça). Sem isso, o login dá `Erro 403: access_denied`.

---

## 3. Comandos

> **Tudo roda via filas.** Os comandos abaixo **enfileiram** trabalho; quem executa de verdade é o **worker da fila**. Sem um worker rodando, nada acontece.

### 3.1. Subir o ambiente de desenvolvimento (recomendado)

```bash
composer run dev
```

Sobe **tudo junto**: servidor Laravel + **fila (`queue:listen`)** + logs + Vite.
O `queue:listen` **recarrega o código a cada job** — ideal em desenvolvimento (pega mudanças de código sem reiniciar).

### 3.2. Rodar a fila manualmente (alternativa ao `composer run dev`)

```bash
# Recarrega o código a cada job (mais lento, mas pega alterações na hora):
php artisan queue:listen

# OU mantém o código em memória (mais rápido, mas NÃO pega alterações de código):
php artisan queue:work
```

> 🛑 **Pegadinha importante:** se você usar `queue:work` e **alterar o código** de um Job/Service, precisa **reiniciar o worker** para ele pegar a mudança:
> ```bash
> php artisan queue:restart   # sinaliza os workers a reiniciar
> ```
> (o `queue:work` morre após o sinal e precisa ser iniciado de novo; o `queue:listen` recarrega sozinho).

### 3.3. Disparar o PULL (Google → sistema) manualmente

```bash
php artisan google-calendar:pull
```

- Enfileira **um `PullGoogleCalendarJob` para cada usuário conectado**.
- Só tem efeito com o **worker da fila rodando**.
- Saída esperada: `Pull despachado para N usuário(s) conectado(s).`

### 3.4. Pull automático (agendado)

O pull roda sozinho a cada `GOOGLE_PULL_INTERVAL_MINUTES` (padrão 5 min), **se o scheduler estiver ativo**:

```bash
php artisan schedule:work
```

Mantenha esse comando rodando num terminal separado (em produção, isso vira um cron único de `schedule:run`).

### 3.5. Comandos úteis de fila / diagnóstico

```bash
php artisan queue:restart        # manda os workers reiniciarem (após mudar código)
php artisan queue:failed         # lista jobs que falharam
php artisan queue:flush          # limpa os jobs falhados
php artisan config:clear         # recarrega o .env (após editar variáveis)
```

---

## 4. Fluxo de uso (pelo fisioterapeuta)

1. Login no sistema → **editar o próprio perfil de usuário**
2. No card **"Google Calendar"**, clicar em **"Conectar"**
3. Fazer login na conta Google e **autorizar** (em modo de teste aparece um aviso de "app não verificado" → "Avançar")
4. Pronto. A partir daí, push e pull funcionam automaticamente para ele.

> O card só aparece no **próprio** perfil — conectar exige a autorização do dono da conta.

---

## 5. Endpoints (API)

Base: `/api/clinic/google-calendar` · Guard: `auth:clinic` (exceto o callback)

| Método | Rota | Função |
|--------|------|--------|
| `GET`  | `/connect`  | Devolve a URL de consentimento do Google |
| `GET`  | `/callback` | Retorno do Google (público); salva os tokens |
| `GET`  | `/status`   | Estado da conexão do usuário logado |
| `DELETE` | `/`       | Desconecta (limpa os tokens) |

---

## 6. Solução de problemas (erros que já aconteceram)

| Sintoma | Causa | Solução |
|---------|-------|---------|
| **`Erro 400: redirect_uri_mismatch`** | O `GOOGLE_REDIRECT_URI` não bate com o cadastrado no Google | Cadastre no Google **exatamente** `http://localhost:8000/api/clinic/google-calendar/callback` e rode `php artisan config:clear` |
| **`Erro 403: access_denied`** | App em modo de teste e o e-mail não está na lista | Adicione o e-mail em **Tela de consentimento → Usuários de teste** |
| **Rodei o pull e nada apareceu** | Não tem worker de fila rodando, ou o job ficou pendente | Suba `queue:work`/`queue:listen` (ou `composer run dev`) e rode o pull de novo |
| **Apareceu com código antigo / errado** | `queue:work` rodando com código velho em memória | `php artisan queue:restart` e reinicie o worker |
| **Centenas de eventos repetidos no futuro** | Bug já corrigido: expansão de eventos recorrentes sem janela | Garantido pelo `GOOGLE_PULL_WINDOW_MONTHS` (janela de meses) |
| **Evento com horário 3h deslocado** | Bug já corrigido: faltava normalizar para UTC no pull | Já tratado no `PullGoogleCalendarJob` |
| **Eventos não atualizam na tela** | Cache do frontend (TanStack Query) | Dê um refresh completo na Agenda (Cmd+Shift+R) |

---

## 7. Estrutura do módulo

```
modules/GoogleCalendar/
├── app/
│   ├── Console/Commands/PullGoogleCalendarCommand.php   # comando google-calendar:pull
│   ├── Contracts/GoogleCalendarServiceInterface.php
│   ├── Http/Controllers/GoogleCalendarController.php     # connect/callback/status/disconnect
│   ├── Jobs/
│   │   ├── SyncAppointmentToGoogleJob.php                # push (sistema → Google)
│   │   └── PullGoogleCalendarJob.php                     # pull (Google → sistema)
│   ├── Providers/                                        # service provider + rotas + agendamento
│   └── Services/GoogleCalendarService.php                # cliente google/apiclient
├── config/config.php
├── routes/api.php
└── tests/
```

O **dispatch do push** está no `AppointmentService` do módulo **Clinic** (`create/update/cancel`), que só dispara quando o responsável tem o Google conectado.
