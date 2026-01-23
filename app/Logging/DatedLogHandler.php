<?php

namespace App\Logging;

use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Monolog\LogRecord;

class DatedLogHandler extends StreamHandler
{
    /**
     * Cria um handler de log que usa a estrutura ano/mês/dia dinamicamente.
     */
    public function __construct($level = Logger::DEBUG, bool $bubble = true, ?int $filePermission = null, bool $useLocking = false)
    {
        $path = logPathByDate();

        parent::__construct($path, $level, $bubble, $filePermission, $useLocking);
    }

    /**
     * Reescreve o método write para garantir que o path seja atualizado
     * se a data mudar durante a execução.
     */
    protected function write(LogRecord $record): void
    {
        $currentPath = logPathByDate();

        if ($this->url !== $currentPath) {
            $this->url = $currentPath;
            $this->close();
        }

        parent::write($record);
    }
}
