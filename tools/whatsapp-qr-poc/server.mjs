import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
} from '@whiskeysockets/baileys';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 8787);
const AUTH_DIR = path.join(__dirname, 'auth_info');

/** @type {'idle' | 'qr' | 'connected' | 'connecting'} */
let connectionPhase = 'idle';
/** @type {string | null} */
let qrDataUrl = null;
/** @type {string | null} */
let lastError = null;
/** @type {import('@whiskeysockets/baileys').WASocket | null} */
let sock = null;

/** Evita vários sockets ao mesmo tempo (bug que impedia o QR). */
let connectInFlight = false;
/** @type {ReturnType<typeof setTimeout> | null} */
let reconnectTimer = null;

function empty(value) {
    return value === undefined || value === null || value === '';
}

function is_null(value) {
    return value === null || value === undefined;
}

function clearReconnectTimer() {
    if (!is_null(reconnectTimer)) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
}

function normalizePhone(raw) {
    let digits = String(raw).replace(/\D/g, '');
    if (digits.startsWith('0')) {
        digits = digits.replace(/^0+/, '');
    }
    if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith('55')) {
        digits = `55${digits}`;
    }
    if (digits.length < 12 || digits.length > 15) {
        return null;
    }
    return digits;
}

function disconnectReasonLabel(statusCode) {
    if (statusCode === DisconnectReason.loggedOut) {
        return 'Desconectado no celular. Use “Resetar sessão” e escaneie o QR de novo.';
    }
    if (statusCode === DisconnectReason.restartRequired) {
        return 'WhatsApp pediu reinício — reconectando em alguns segundos…';
    }
    if (statusCode === DisconnectReason.timedOut) {
        return 'Timeout — reconectando…';
    }
    if (!is_null(statusCode)) {
        return `Conexão caiu (código ${statusCode}).`;
    }
    return 'Conexão caiu.';
}

function scheduleReconnect(statusCode) {
    if (statusCode === DisconnectReason.loggedOut) {
        return;
    }
    if (!is_null(reconnectTimer)) {
        return;
    }
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        void startWhatsApp();
    }, 4000);
}

async function destroySocket() {
    if (is_null(sock)) {
        return;
    }
    const old = sock;
    sock = null;
    try {
        old.ev.removeAllListeners('connection.update');
        old.ev.removeAllListeners('creds.update');
        old.end(undefined);
    } catch {
        /* ignore */
    }
}

async function startWhatsApp() {
    if (connectInFlight) {
        return;
    }
    if (connectionPhase === 'connected' && !is_null(sock)) {
        return;
    }

    connectInFlight = true;
    clearReconnectTimer();
    connectionPhase = 'connecting';
    qrDataUrl = null;

    await destroySocket();

    try {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

        sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            browser: ['Chrome', 'MacOS', '14.0'],
            syncFullHistory: false,
            markOnlineOnConnect: false,
            defaultQueryTimeoutMs: 60_000,
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (!empty(qr)) {
                connectionPhase = 'qr';
                lastError = null;
                qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 280 });
                console.log('[poc] QR pronto — escaneie no celular (Aparelhos conectados)');
            }

            if (connection === 'open') {
                connectionPhase = 'connected';
                qrDataUrl = null;
                lastError = null;
                connectInFlight = false;
                console.log('[poc] Conectado como', sock?.user?.id ?? '?');
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                lastError = disconnectReasonLabel(statusCode);
                console.log('[poc] Conexão fechou:', lastError);
                connectionPhase = 'idle';
                qrDataUrl = null;
                connectInFlight = false;
                await destroySocket();
                scheduleReconnect(statusCode);
            }
        });
    } catch (err) {
        connectInFlight = false;
        lastError = err instanceof Error ? err.message : 'Falha ao iniciar WhatsApp';
        connectionPhase = 'idle';
        console.error('[poc]', lastError);
    }
}

async function resolveWhatsAppJid(phoneDigits) {
    const candidates = [phoneDigits];

    if (phoneDigits.startsWith('55') && phoneDigits.length === 13) {
        const ddd = phoneDigits.slice(2, 4);
        const rest = phoneDigits.slice(4);
        if (rest.length === 9 && rest.startsWith('9')) {
            candidates.push(`55${ddd}${rest.slice(1)}`);
        } else if (rest.length === 8) {
            candidates.push(`55${ddd}9${rest}`);
        }
    }

    for (const candidate of candidates) {
        const jid = `${candidate}@s.whatsapp.net`;
        const check = await sock.onWhatsApp(jid);
        const row = check?.[0];
        if (!is_null(row) && row.exists) {
            return { jid: row.jid, candidate };
        }
    }

    return null;
}

function resetAuthDir() {
    if (fs.existsSync(AUTH_DIR)) {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/state', (_req, res) => {
    res.json({
        phase: connectionPhase,
        qrDataUrl,
        lastError,
        linkedAs: sock?.user?.id ?? null,
    });
});

app.post('/api/connect', (_req, res) => {
    if (connectionPhase === 'connected') {
        res.json({ ok: true, already: true });
        return;
    }
    void startWhatsApp();
    res.json({ ok: true });
});

app.post('/api/reset', async (_req, res) => {
    clearReconnectTimer();
    connectInFlight = false;
    connectionPhase = 'idle';
    qrDataUrl = null;
    lastError = null;
    await destroySocket();
    resetAuthDir();
    void startWhatsApp();
    res.json({ ok: true });
});

app.post('/api/send-invite', async (req, res) => {
    if (connectionPhase !== 'connected' || is_null(sock)) {
        res.status(409).json({
            error: 'WhatsApp não conectado. Espere o status verde ou escaneie o QR.',
        });
        return;
    }

    const phone = normalizePhone(req.body?.phone);
    const studentName = String(req.body?.studentName ?? '').trim();

    if (is_null(phone) || empty(studentName)) {
        res.status(422).json({
            error:
                'Informe nome e telefone. Ex.: DDD + número (84991234567) ou 5584991234567.',
        });
        return;
    }

    const text =
        String(req.body?.message ?? '').trim() ||
        `Olá! Você foi convidado(a) para participar. Aluno: ${studentName}.`;

    try {
        const resolved = await resolveWhatsAppJid(phone);
        if (is_null(resolved)) {
            res.status(422).json({
                error: `Nenhum WhatsApp encontrado para ${phone}. Confira DDI 55 e o 9 do celular.`,
            });
            return;
        }

        await sock.sendMessage(resolved.jid, { text });
        res.json({ ok: true, jid: resolved.jid, usedNumber: resolved.candidate });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao enviar';
        lastError = message;
        res.status(500).json({ error: message });
    }
});

app.listen(PORT, () => {
    console.log(`POC WhatsApp: http://localhost:${PORT}`);
    void startWhatsApp();
});
