<?php

namespace Modules\Media\Exceptions;

/**
 * A clínica trocou a proposta depois que o operador abriu a revisão: decidir agora seria decidir sobre uma mídia que ele não viu.
 */
class MediaProposalChangedException extends \RuntimeException
{
    public function __construct()
    {
        parent::__construct('A proposta mudou desde que a revisão foi aberta. Recarregue a lista e confira a mídia nova.');
    }
}
