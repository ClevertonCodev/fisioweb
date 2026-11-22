# Decisões · Módulo de comunicação (e-mails)

## Sessão 2026-11-18

- **Quais e-mails entram na primeira fase?** → Programa enviado ao paciente, agenda do paciente (consulta marcada, remarcada, cancelada), questionário enviado ao paciente e a migração dos 2 e-mails de hoje (confirmação de cadastro da clínica e esqueci minha senha) para o template IVS MED. O questionário entra mesmo dependendo da página de resposta do paciente, que hoje não existe.
- **Como a clínica envia algo ao paciente?** → Tudo que vai ao paciente passa por um modal do design system (`DsModal`) que pergunta se a clínica quer enviar por WhatsApp ou por e-mail. Nada sai para o paciente sem essa escolha.
- **O que cada botão do modal faz?** → E-mail: o servidor envia (Resend, template IVS MED, pela fila); o `mailto:` sai. WhatsApp: continua abrindo o WhatsApp Web (`wa.me`) com o texto pronto, no aparelho de quem usa. Integração de WhatsApp por API fica fora.
- **Na agenda, quando o modal aparece?** → Abre ao salvar uma consulta marcada, remarcada ou cancelada que tenha paciente, com "Avisar o paciente?" e os botões E-mail, WhatsApp e "Não avisar". Fechar ou "Não avisar" = nada é enviado. Consulta sem paciente (evento vindo do Google Agenda) não abre o modal.
- **Lembrete automático de consulta entra?** → Entra, desligado por padrão; cada clínica liga numa configuração. É a única exceção à regra do modal (sai sozinho, por job agendado). Atenção ao limite do Resend grátis (100/dia somando todas as clínicas).
- **Como se configura o lembrete?** → Uma chave "Lembrar o paciente por e-mail antes da consulta" em `/clinica/dados` (tela do admin da clínica; quem edita segue a regra da tela, ver "Quem pode enviar?"). Antecedência fixa de 24 h, sem escolha. Paciente sem e-mail não recebe. Sem confirmação de presença pelo e-mail.
- **A página de resposta do questionário entra?** → Entra nesta feature, como tarefa própria: tela pública v2 (design system) em `/<clínica>/paciente/questionarios/<token>`, usando a API pública que já existe (`GET`/`POST /questionnaires/{token}`). Prototipada com variantes antes. O e-mail do questionário só vai ao ar junto com ela.
- **Como o clique vira e-mail, e quem é dono do texto?** → Módulo novo dono dos templates (layout IVS MED e o texto de cada e-mail) e do envio pela fila. O módulo de origem (`TreatmentProgram`, `ClinicScheduling`, `ClinicQuestionnaire`) ganha a ação "enviar por e-mail" e dispara um evento com tudo o que o e-mail precisa (nome e e-mail do destinatário, nome da clínica, link, mensagem). O módulo de e-mail escuta e envia, sem ler tabela de outro módulo.
- **Nome do módulo?** → `modules/Email` (namespace `Modules\Email`). Ele só cuida de e-mail: o WhatsApp continua no aparelho de quem usa (`wa.me`) e não passa pelo servidor, então "Communication" prometeria mais do que o módulo faz. "Mail" se confundiria com o `Illuminate\Mail` do Laravel.
- **Remetente e Reply-To?** → E-mails da clínica ao paciente: "De: <nome da clínica> via IVS MED <naoresponda@ivsmed.com>", com Reply-To para o e-mail cadastrado da clínica (sem Reply-To se a clínica não tiver e-mail). E-mails do sistema (confirmação de cadastro, esqueci minha senha): "IVS MED", sem Reply-To.
- **Histórico de envios?** → Sem tabela de histórico e sem nada na tela da clínica: a clínica não vê erro de sistema. Envio e falha ficam no log do Laravel; o job que esgota as tentativas cai na `failed_jobs` (driver `database-uuids`), como já acontece hoje. O log grava ids (clínica, tipo de e-mail, item de origem), não o e-mail do paciente.
- **O que o e-mail ao paciente mostra?** → Assunto neutro, sem dado clínico (ex.: "Seu programa de exercícios está disponível · <clínica>"). O título do programa ou do questionário vai só no corpo, junto com o nome do paciente, a mensagem da clínica e o botão com o link.
- **O paciente pode parar de receber o lembrete?** → Sim. Campo novo no paciente "Receber lembrete de consulta por e-mail" (ligado por padrão, migration), que a clínica vê e muda no cadastro. No rodapé do lembrete, um link assinado "Não quero mais receber lembretes" desliga o campo sem login. Vale só para o lembrete automático; os envios pelo modal não olham esse campo.
- **Onde o modal aparece no programa e no questionário?** → Ao salvar no assistente de programa e ao enviar o questionário, como hoje. E também num botão "Enviar ao paciente", que abre o mesmo modal, no detalhe do programa (no lugar do botão solto de WhatsApp) e no questionário pendente do prontuário, para reenviar.
- **Quem pode enviar?** → Quem já pode fazer a ação de origem: criar ou editar o programa, enviar o questionário, marcar ou mudar a consulta. O backend confere pela mesma Policy da origem e pelo `clinic_id`; item ou paciente de outra clínica dá 404. A chave do lembrete em `/clinica/dados` segue a regra que a tela já tem (o admin vê, o mestre edita).
- **Paciente sem e-mail?** → No modal, o botão E-mail fica desabilitado com o motivo ("Paciente sem e-mail cadastrado"), e o backend recusa com 422. O mesmo vale para WhatsApp sem celular, como hoje.
- **Remarcar arrastando a consulta na agenda conta?** → Conta: o arrasto é uma remarcação e abre o mesmo modal "Avisar o paciente?".
- **Cota do Resend (100/dia no grátis)?** → O sistema ainda está em teste: fica no plano grátis e o código não controla cota. Se estourar, o envio falha e cai no log e na `failed_jobs`. Quando entrar clínica de verdade, o usuário assina o Resend Pro.
- **Os 2 e-mails de hoje na migração?** → Confirmação de cadastro da clínica e esqueci minha senha (admin e clínica) passam a usar o layout IVS MED do módulo `Email`, pela fila. Junto, conferir e corrigir a pendência do `DEFERRED.md` da raiz: o reenvio da confirmação talvez seja síncrono.
- **Layout dos e-mails (protótipo)?** → Variante A, "Cabeçalho da marca", para todos os e-mails: faixa azul-marinho com o logo e o nome da clínica ("via IVS MED"; nos e-mails do sistema, só "IVS MED"), cartão branco com selo do tipo, título, detalhes num bloco cinza, mensagem do profissional em citação e botão largo. Protótipo na branch `prototype/022-emails`.
- **O paciente pode responder o e-mail?** → Não. Os e-mails não têm Reply-To e nenhum texto pede para responder; o caminho é o telefone da clínica ("Precisa remarcar? Ligue para a clínica: <telefone>"). O rodapé diz "Este endereço não recebe respostas". (Substitui a parte do Reply-To da decisão "Remetente e Reply-To?" desta mesma sessão; o "De: <clínica> via IVS MED" continua.)
- **"Como chegar" funciona?** → Sim: link de busca do Google Maps montado com o endereço da clínica (rua, número, cidade, UF de `/clinica/dados`), sem chave de API. Aparece nos e-mails de consulta marcada, remarcada e no lembrete, só quando a clínica tem endereço; sem endereço, o botão some. A consulta cancelada não tem botão, só o telefone.
- **Modal "Enviar ao paciente" (protótipo)?** → Variante C, "Ações diretas": uma linha por canal (E-mail, WhatsApp e, quando há link, Copiar link), cada uma com o próprio botão e o próprio status ("Enviado 14:32", "Aberto 14:33"); dá para usar os dois canais na mesma abertura; e-mail enviado vira "Reenviar". O rodapé tem "Não avisar" na agenda e "Fechar" no resto, e vira "Concluir" depois de um envio. Canal sem contato fica com o botão desabilitado e o motivo no lugar do endereço.
- **Página de resposta do questionário (protótipo)?** → Variante B, "Formulário inteiro", direto ao ponto: cabeçalho com clínica, título, profissional e prazo; todas as perguntas numa página, separadas por seção numerada; obrigatórias com `*`; barra fixa embaixo com "x de N respondidas" e o botão Enviar, que rola até a primeira obrigatória sem resposta e a marca em vermelho. Depois de enviar, tela "Respostas enviadas". Estados próprios para prazo vencido, já respondido e link inválido.

### Critérios de sucesso

- Clicar em E-mail no modal (programa, questionário, consulta) põe um job na fila. O e-mail chega com o layout IVS MED (variante A), "De: <clínica> via IVS MED", sem Reply-To, assunto sem dado clínico e o link certo. Teste com `Mail::fake` / `Queue::fake` e um envio real para uma caixa Gmail no smoke.
- O botão de enviar por e-mail de um item ou paciente de outra clínica dá 404, com teste.
- Paciente sem e-mail: botão desabilitado na tela e 422 no backend.
- Com a chave da clínica ligada, o job agendado manda um lembrete por consulta com paciente que tenha e-mail e o campo de lembrete ligado, 24 h antes, e não manda de novo. Clínica com a chave desligada não recebe nada.
- O link "Não quero mais receber lembretes" desliga o campo do paciente certo, sem login; link adulterado não muda nada.
- O link do questionário abre a tela pública de resposta (sem 404) e a resposta é gravada.
- Confirmação de cadastro e esqueci minha senha saem com o layout IVS MED, pela fila.
- Envio e falha aparecem no log com ids, sem o e-mail do paciente.

### Fora do escopo

- WhatsApp por API (Twilio, Meta). O WhatsApp continua no `wa.me`, no aparelho de quem usa.
- Tabela de histórico de envios e o menu "Notificações" (`/clinica/notificacoes`, `/admin/notificacoes`).
- Cron que lê a `failed_jobs` (ou os logs) e avisa o admin geral sobre e-mail que falhou.
- Controle de cota do Resend; troca para o plano Pro fica com o usuário, quando houver clínica de verdade.
- Confirmar presença pelo e-mail do lembrete e escolher a antecedência (fica 24 h fixo).
- E-mails para a equipe da clínica (convite de usuário, primeiro acesso do mestre, questionário respondido, dor alta, exercício aprovado ou recusado, mídia, Google Agenda desconectado).
- E-mails de segurança da conta (senha trocada, e-mail trocado, código para trocar senha, suporte entrou na conta).
- Acesso do paciente à área dele (senha inicial) e "esqueci minha senha" do paciente.
- Programa concluído ou arquivado, lembrete de questionário perto de vencer, recibo de pagamento, clínica cancelada ou reativada.

## Sessão 2026-11-18 (escrever-plano, "Ataque o plano")

- **Como o módulo `Email` consegue os dados do e-mail?** → O evento de integração leva só ids (clínica, item, paciente, quem pediu, tipo). O listener do `Email` busca nome, e-mail, endereço, título e link por contratos públicos de leitura dos módulos donos (o padrão do `GoogleCalendar`). (Substitui a parte "dispara um evento com tudo o que o e-mail precisa" da decisão "Como o clique vira e-mail" da sessão anterior; o resto continua.) O usuário aprovou o desenho das camadas.
- **Testes?** → Os quatro grupos: isolamento e papéis, conteúdo do e-mail, lembrete e telas.
- **E-mail de consulta remarcada mostra o horário antigo?** → Não. A consulta não guarda o horário anterior; o e-mail mostra só o novo horário ("Sua consulta mudou de horário"). Sem migration para isso.
- **Cabeçalho da página pública do questionário?** → Só o nome da clínica ("A <clínica> pediu que você responda"), sem o nome do profissional. O GET público ganha o nome da clínica; o ADR 023 fica intacto.
- **Editar a consulta sem mudar data ou hora abre o modal?** → Não. O `AppointmentRescheduled` dispara em qualquer edição, mas o modal "Avisar o paciente?" só abre quando o início ou o fim mudou (modal de edição ou arrasto). Mudar status para realizada ou faltou não abre o modal.
- **Página pública diferencia vencido e já respondido?** → Sim. Hoje o 422 traz a mesma mensagem para os dois; ele ganha um campo `reason` (`answered` ou `expired`).
- **Nome no "Olá, <nome>!"?** → O apelido quando o paciente usa apelido; senão, o primeiro nome. Datas e horas no fuso da clínica.
- **Clicar em "Reenviar" muitas vezes?** → Limite no backend de 5 envios por minuto por usuário nos endpoints de e-mail (429 depois disso).
- **Consulta marcada a menos de 23 h do horário recebe lembrete?** → Não. O lembrete pega só consultas que começam entre 23 h e 24 h depois da rodada de hora em hora, com status marcada ou confirmada.

## Implementação da 007 (2026-11-21, revisão adversária)

- **Mudar o horário de consulta concluída ou com falta abre o aviso?** → Não. O arrasto já não move consulta encerrada; pelo modal de edição, o aviso de remarcada só abre se a consulta não está concluída nem com falta. O endpoint continua aceitando `rescheduled` para consulta não cancelada, como a tarefa pede. Decidido durante a revisão (ACHADO-003); o usuário pode rever.

## Implementação da 009 (2026-11-21, planejamento)

- **Consulta entre 23h e 0h lembrada na madrugada do mesmo dia diz "amanhã"?** → Não. Quando a data da consulta, no fuso da clínica, é a mesma do dia em que a fila envia o e-mail, o assunto e o título dizem "hoje"; senão, "amanhã".
- **Clínica cancelada com a chave ligada recebe lembrete?** → Não. O contrato de contato da clínica passa a dizer se ela está cancelada, e o listener do lembrete não envia para clínica cancelada.
- **Endereço do link de sair dos lembretes?** → `APP_URL/lembretes/sair?token=<clinicId>.<patientId>.<hmac>`, HMAC-SHA256 com a `app.key`. A verificação e a página ficam na 010.
- **Falha no envio depois de reservar o lembrete?** → A reserva é apagada e o erro sobe, para a próxima tentativa da fila enviar.
- **A janela do lembrete depende do minuto em que o cron rodou?** → Não. A janela se ancora na hora cheia da rodada: [hora + 23 h, hora + 24 h). Uma rodada atrasada dentro da hora cobre a mesma faixa, e o único da tabela evita duplicata. Efeito aceito: uma rodada atrasada pode lembrar uma consulta marcada há pouco menos de 23 h. A trava do `withoutOverlapping` dura 55 minutos, para um processo que morreu não travar o lembrete por 24 h. Decidido durante a revisão (ACHADO-001 e ACHADO-005 da rodada 1).
- **Paciente com status de óbito, alta ou cancelado recebe o lembrete?** → Não. O contrato de contato do paciente passa a dizer se ele está ativo (fora de `Patient::INACTIVE_STATUSES`), e o lembrete automático não sai para paciente inativo. O envio pelo modal não muda. Decidido pelo usuário durante a revisão da 009 (ACHADO-007 da rodada 1).
- **Consulta marcada entre 23 h e 24 h antes do horário recebe lembrete?** → Só se ela já existia na rodada da hora cheia anterior. Criada depois dessa rodada, ela fica abaixo das 23 h na rodada seguinte e não recebe lembrete. Efeito aceito do desenho de hora em hora, como o caso de menos de 23 h. Registrado na revisão da 009 (ACHADO-004 da rodada 2); o usuário pode rever.
- **Paciente inativado pela clínica ("Inativar paciente", `is_active` desligado) recebe o lembrete?** → Não. O `active` do contrato de contato do paciente passa a exigir `is_active` ligado e status fora de óbito, alta e cancelado, juntando o `is_active` do filtro da lista com os status de saída do painel. O login é diferente e deixa entrar quem teve alta. Decidido pelo usuário depois da 3ª rodada da revisão da 009 (ACHADO-001 da rodada 3).

## Implementação da 010 (2026-11-21, planejamento)

- **Limite no POST público de sair dos lembretes?** → Sim: 10 pedidos por minuto por IP, com 429 depois disso. O token não dá para adivinhar; o limite só protege o servidor de pedidos em massa.
- **Resposta do endpoint?** → 200 `{ data: { unsubscribed: true } }` com token válido, de novo a cada chamada; 404 para token inválido, adulterado ou de paciente que não é daquela clínica; 422 sem token.

## QA de aceite (2026-11-21, rodada 1)

- **Cabeçalho da página pública do questionário sem a seta de voltar e sem o título "Questionário" do protótipo B?** → Fica como está: a página é aberta por link e não tem tela anterior. (Decidido pelo usuário no QA da feature.)
- **Modal "Enviar ao paciente" sem a frase de orientação acima dos canais do protótipo C?** → Fica como está: o título e as linhas dos canais já dizem o que fazer. (Decidido pelo usuário no QA da feature.)
