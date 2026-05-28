<?php

return [
    'twilio_sid'   => env('TWILIO_SID'),
    'twilio_token' => env('TWILIO_AUTH_TOKEN'),
    'from_number'  => env('TWILIO_WHATSAPP_FROM', '+14155238886'),
    'enabled'      => env('WHATSAPP_ENABLED', false),
];
