<?php

namespace Modules\Media\Exceptions;

/**
 * O arquivo (vídeo ou thumbnail) não está no storage. A mensagem é para o
 * usuário, ao contrário de outras RuntimeException (ex.: PDOException).
 */
class VideoStorageFileMissingException extends \RuntimeException {}
