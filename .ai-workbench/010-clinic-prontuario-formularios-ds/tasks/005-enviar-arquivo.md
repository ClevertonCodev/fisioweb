# Enviar arquivo vira Foto do documento

**Tipo:** História
**Plano:** `../plans/clinic-prontuario-formularios-ds.md`
**Histórias:** 24, 25, 26, 27, 28, 29
**Issue:** ainda não criada

## Descrição

“Enviar arquivo” ainda abre o modal da v1. O protótipo B simula o
envio. Esta fatia promove a Foto do documento e grava no R2.

## O que construir

- **Tela:** overlay v2: “Fotografar” (câmera traseira no celular) ou
  “Escolher arquivo”; prévia grande; tipo em chips (Exame de imagem,
  Laudo, Receita, Atestado, Outro) que monta o nome. Um arquivo por vez.
- **Gravar:** o hook de upload que já existe. Depois, o arquivo
  aparece na aba Arquivos.
- **Validação:** JPEG, PNG, PDF e DOCX até 20 MB, com o motivo na tela,
  alinhado às regras que o backend já usa.
- **Papel:** os três papéis enviam, como hoje.
- **Saída:** `PatientFileUploadModal` no prontuário e pasta `new-file`.

## Critérios de Aceite

- [x] “Enviar arquivo” abre a Foto do documento (não o modal v1) (teste).
- [x] Arquivo válido grava e aparece na aba Arquivos (teste).
- [x] Tipo escolhido entra no nome enviado (`Laudo: …`) (teste).
- [x] Tipo ou tamanho inválido recusa antes do POST, com o motivo (teste).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/clinic-prontuario-formularios-ds`
- **Exemplo no código:** `new-file/` (VariantB); `useUploadPatientFile`;
  `patient-file-upload-rules`; teste de arquivo no `PatientRecordPage.test.tsx`.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`,
  `api-client`.

## Como testar na mão

1. Admin, paciente da clínica A. Enviar arquivo: escolha uma imagem, tipo Laudo, envie.
2. Aba Arquivos: o nome começa com “Laudo:”. Baixe.
3. Tente um tipo que o backend recusa: motivo na tela, sem POST.
4. Secretária consegue enviar.
5. Clínica B: 404 no prontuário.
