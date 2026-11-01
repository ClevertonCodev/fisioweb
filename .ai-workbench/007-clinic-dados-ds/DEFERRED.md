# Adiado — 007-clinic-dados-ds

- **2026-10-19, 001-tela-dados-clinica-ds:** o `UpdateClinicProfileRequest`
  ainda exige e aceita `status`. Na v2 a situação da clínica é só leitura e o
  front reenvia o valor atual. Decidir depois se o backend deve parar de
  aceitar `status` neste `PUT` (o mestre ainda consegue mudar pela API). Não
  mudamos a regra sem perguntar.
- **2026-10-19, 001-tela-dados-clinica-ds:** a Clínica Start do
  `DatabaseSeeder` também tem documento de 11 dígitos (`72686859040`) com
  tipo PJ padrão. Fora do pedido (só a clínica 1). Salvar os dados dela na
  v2 pode falhar na validação de CNPJ até o seed ser corrigido.
