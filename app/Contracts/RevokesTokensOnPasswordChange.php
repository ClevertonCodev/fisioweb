<?php

namespace App\Contracts;

interface RevokesTokensOnPasswordChange
{
    /** Se um token emitido neste instante (`iat`, em segundos) já perdeu a validade. */
    public function tokenIssuedBeforePasswordChange(int $issuedAt): bool;
}
