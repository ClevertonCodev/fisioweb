<?php

namespace Modules\Media\Exceptions;

class MediaProposalNotPendingException extends \RuntimeException
{
    public function __construct()
    {
        parent::__construct('Este exercício não tem proposta de mídia esperando revisão.');
    }
}
