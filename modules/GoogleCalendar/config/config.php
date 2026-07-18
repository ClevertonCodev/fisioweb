<?php

return [
    'name' => 'GoogleCalendar',

    // Credenciais OAuth (espelham config/services.php → services.google).
    'client_id'     => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect'      => env('GOOGLE_REDIRECT_URI'),

    // Intervalo do polling reverso (Google → sistema), em minutos.
    'pull_interval_minutes' => (int) env('GOOGLE_PULL_INTERVAL_MINUTES', 5),

    // Janela (em meses, a partir de hoje) sincronizada do Google → evita
    // expandir eventos recorrentes por anos.
    'pull_window_months' => (int) env('GOOGLE_PULL_WINDOW_MONTHS', 3),

    // Para onde redirecionar o SPA após o callback OAuth.
    'frontend_redirect' => env('GOOGLE_FRONTEND_REDIRECT', '/clinica/usuarios'),
];

// Criar credenciais OAuth no Google Cloud Console (https://console.cloud.google.com):

// Ativar a Google Calendar API
// Criar credencial OAuth client ID → tipo Web application
// Em Authorized redirect URIs, cadastrar exatamente: http://localhost/api/clinic/google-calendar/callback
// Copiar o Client ID e Client Secret para as duas primeiras linhas do .env
// Limpar o cache de config depois de preencher:

// php artisan config:clear
// Polling reverso (Google → sistema): depende do scheduler rodando. Em desenvolvimento:

// php artisan schedule:work
// (e um worker de fila ativo — composer run dev já sobe o queue:listen).
// fisioweb-499801
