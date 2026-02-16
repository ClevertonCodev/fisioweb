<?php

use Illuminate\Support\Facades\Log;

if (! function_exists('log_path_by_date')) {
    /**
     * @param  DateTimeInterface|string|null  $date  Data para o log (padrão: hoje)
     * @return string Caminho completo do arquivo de log
     *
     * @example
     * // Usar data atual (hoje)
     * $path = logPathByDate();
     * // Retorna: /path/to/storage/logs/2026/01/23.log
     */
    function logPathByDate($date = null): string
    {
        if ($date === null) {
            $dateTime = new DateTime;
        } elseif (is_string($date)) {
            $dateTime = new DateTime($date);
        } elseif ($date instanceof DateTimeInterface) {
            $dateTime = $date instanceof DateTime ? $date : DateTime::createFromInterface($date);
        } else {
            throw new InvalidArgumentException('A data deve ser uma string, DateTimeInterface ou null');
        }

        $year  = $dateTime->format('Y');
        $month = $dateTime->format('m');
        $day   = $dateTime->format('d');

        $logPath = storage_path("logs/{$year}/{$month}");

        if (! is_dir($logPath)) {
            mkdir($logPath, 0755, true);
        }

        return $logPath . '/' . $day . '.log';
    }
}

if (! function_exists('logEmergency')) {
    function logEmergency(string $message, array $context = []): void
    {
        Log::channel('dated')->emergency($message, $context);
    }
}

if (! function_exists('logAlert')) {
    function logAlert(string $message, array $context = []): void
    {
        Log::channel('dated')->alert($message, $context);
    }
}

if (! function_exists('logCritical')) {
    function logCritical(string $message, array $context = []): void
    {
        Log::channel('dated')->critical($message, $context);
    }
}

if (! function_exists('logError')) {
    function logError(string $message, array $context = []): void
    {
        Log::channel('dated')->error($message, $context);
    }
}

if (! function_exists('logWarning')) {
    function logWarning(string $message, array $context = []): void
    {
        Log::channel('dated')->warning($message, $context);
    }
}

if (! function_exists('logNotice')) {
    function logNotice(string $message, array $context = []): void
    {
        Log::channel('dated')->notice($message, $context);
    }
}

if (! function_exists('logInfo')) {
    function logInfo(string $message, array $context = []): void
    {
        Log::channel('dated')->info($message, $context);
    }
}

if (! function_exists('logDebug')) {
    function logDebug(string $message, array $context = []): void
    {
        Log::channel('dated')->debug($message, $context);
    }
}
