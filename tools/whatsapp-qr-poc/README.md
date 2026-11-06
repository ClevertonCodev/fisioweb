# POC WhatsApp QR (descartável)

Teste local do fluxo **QR → dispositivo vinculado → enviar mensagem**, parecido com o sistema que você viu, **sem API oficial da Meta**.

- **Backend mínimo:** Node + [Baileys](https://github.com/WhiskeySockets/Baileys) (protocolo multidevice / “WhatsApp Web” no servidor).
- **Front:** HTML estático servido pelo Express (só UI; o WhatsApp **não** roda no browser).

## Rodar

```bash
cd tools/whatsapp-qr-poc
npm install
npm start
```

Abra **http://localhost:8787** (não abra o `index.html` pelo Finder — o WhatsApp roda no Node).

1. Escaneie o QR se pedir; status verde = conectado.
2. Nome + telefone (`84991234567` ou `5584991234567`) → **Enviar convite**.

Se travar: `Ctrl+C`, apague `auth_info/`, `npm start`, escaneie de novo.

A sessão fica em `auth_info/` (gitignored).

## Avisos

- Uso não oficial; **pode banir o número**. Use chip de teste.
- Não é o módulo WhatsApp do fisioweb (Twilio / API oficial).
- Não commitar `auth_info/`.
