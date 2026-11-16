<?php

namespace Modules\Admin\Exceptions;

/**
 * Exercício aprovado já está nos programas das outras clínicas; tirá-lo da aprovação destravaria a mídia do vídeo para a clínica dona (ADR 029).
 */
class ExerciseAlreadyApprovedException extends \RuntimeException
{
    public function __construct()
    {
        parent::__construct('Exercício já aprovado. Para tirar do catálogo, desative-o.');
    }
}
