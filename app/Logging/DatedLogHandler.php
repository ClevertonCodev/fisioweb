<?php

namespace App\Logging;

use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Monolog\LogRecord;

class DatedLogHandler extends StreamHandler
{
    public function __construct($level = Logger::DEBUG, bool $bubble = true, ?int $filePermission = null, bool $useLocking = false)
    {
        $path = logPathByDate();

        parent::__construct($path, $level, $bubble, $filePermission, $useLocking);
    }

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
