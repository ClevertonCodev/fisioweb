<?php

namespace Modules\ClinicFinance\Enums;

/** Editar ou excluir um lançamento de série: "só esta" ou "esta e as próximas". */
enum SeriesScope: string
{
    case Only      = 'only';
    case Following = 'following';
}
