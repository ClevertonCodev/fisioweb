# 018 · Senha do paciente acompanha a troca de CPF

Origem: correção rápida (`correcao-rapida`), tarefa `000-senha-acompanha-cpf`.
Fecha o item de 2026-11-03 do `.ai-workbench/DEFERRED.md` da raiz ("Senha do app
não acompanha a troca de CPF na edição"). Decisão do usuário (2026-11-06,
revista depois do teste manual): a senha **sempre** acompanha a troca de CPF.
Hoje o paciente não tem como escolher a própria senha; quando existir "trocar
minha senha", essa feature cria a marca de senha personalizada e a regra passa
a respeitá-la.

```
Hoje:      QUANDO a clínica troca o CPF do paciente, o sistema mantém a senha antiga (o CPF velho), e o paciente não entra com o CPF novo.
Esperado:  QUANDO a clínica troca o CPF, o sistema DEVE trocar a senha para o CPF novo (só os números), seja qual for a senha de antes.
Continua:  QUANDO o estrangeiro sem CPF troca o e-mail, o sistema DEVE trocar a senha para o e-mail novo.
           QUANDO o paciente tem CPF e só o e-mail muda, o sistema DEVE CONTINUAR sem mexer na senha.
           QUANDO a atualização não muda CPF nem e-mail, o sistema DEVE CONTINUAR sem mexer na senha.
```

## Arquivos alterados

- `modules/Patient/app/Services/PatientService.php`: `update` busca o paciente
  atual e, se a senha padrão (CPF, ou e-mail quando não há CPF) mudou, grava a
  nova padrão como senha.
- `modules/Patient/tests/Feature/PatientPasswordFollowsDocumentTest.php` (novo).
- `modules/Patient/tests/Unit/PatientServiceTest.php`: mock do `find` no teste
  de `update`.

## Verificação

- `php artisan test --filter=PatientPasswordFollowsDocumentTest`: sem a
  correção, 5 falham (Esperado, incluindo o caminho PUT da clínica → login do
  paciente) e 2 passam (Continua); com ela, 7 passam.
- Teste manual do usuário com o paciente 5 (senha do seeder, diferente do CPF
  antigo) falhou na primeira versão (só sincronizava se a senha fosse o CPF
  antigo); foi isso que mudou a regra.
- `bash bin/verificar.sh`: tudo OK menos Vitest, por
  `ExerciseLibraryPage.test.tsx` (falha antiga, já no `DEFERRED.md` da raiz em
  2026-11-01, sem relação com esta mudança).
- Smoke test pulado por decisão do usuário: não há mudança de tela e ele vai
  testar à mão.
