# Adiado · 003 design system v2

Decidido no refinamento de 2026-10-15:

- Migrar telas, layouts e componentes da v1 para o DS. Será outra feature.
- Colocar o `DsThemeToggle` em algum layout. Entra quando existirem as telas v2.
- Dark mode para as telas v1 (o bloco `.dark` do `app.css` continua sem uso).
- Trocar a paleta roxa do DS pela teal da v1. Basta mudar os tokens `--ds-*`.
- Storybook.

Decidido na implementação (2026-10-15):

- Bandeiras de país como imagem. No Vue, elas vinham de `/assets/lojas/assets/images/bandeiras/XX.png`, que não existe no fisioweb, e por isso viraram emoji (`countryFlagEmoji`). Se quiserem imagens, é preciso adicionar os arquivos em `public/` e trocar o componente `Flag` em `components/ds/select/DsFieldSelect.tsx`.
- Formatação de telefone exata por país. O Vue usava o vue-tel-input (libphonenumber). Sem dependência nova, o Brasil tem o formato completo e os outros países usam DDI + grupos de 3 dígitos (`formatInternationalPhone`). A validação é a mesma do Vue (`getPhoneValidationError`). Se for preciso o formato oficial de cada país, avaliar adicionar `libphonenumber-js`.
- Lista de países. No Vue ela vinha de outro app da Paytour (`@/apps/venda-backoffice/.../paises`). Aqui virou a tabela ISO → DDI em `components/ds/phone/countries.ts`, com os nomes vindos do `Intl.DisplayNames('pt-BR')`.
- CNPJ alfanumérico. O DS aceita (como o Vue), mas o backend (`ValidationHelper::validateCnpj`) só aceita numérico. A skill avisa e manda validar também com `@/lib/br-document-validation`. Quando o backend aceitar letras, unificar as duas validações (revisão adversária, rodada 1).
- Fontes Poppins e Geist Mono pelo Google Fonts no `app.css` global, no mesmo padrão de Inter, Lora e Space Mono. Hospedar as fontes no próprio app vale para as quatro fontes e fica para outra mudança (revisão adversária, rodada 1).
