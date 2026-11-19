<?php

namespace Modules\Email\Listeners;

use Illuminate\Mail\Events\MessageSending;

class EmbedBrandLogo
{
    public function handle(MessageSending $event): void
    {
        $cid  = (string) config('email.logo_cid');
        $html = $event->message->getHtmlBody();

        if (!is_string($html) || !str_contains($html, "cid:{$cid}")) {
            return;
        }

        $event->message->embedFromPath(dirname(__DIR__, 2) . '/resources/images/logo-mark-white.png', $cid, 'image/png');
    }
}
