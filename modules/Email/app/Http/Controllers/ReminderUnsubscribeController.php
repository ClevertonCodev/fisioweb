<?php

namespace Modules\Email\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Modules\Email\Contracts\ReminderUnsubscribeServiceInterface;
use Modules\Email\Http\Requests\ReminderUnsubscribeRequest;

class ReminderUnsubscribeController extends Controller
{
    public function __construct(
        protected ReminderUnsubscribeServiceInterface $unsubscribes,
    ) {}

    public function store(ReminderUnsubscribeRequest $request): JsonResponse
    {
        if (!$this->unsubscribes->unsubscribe($request->validated()['token'])) {
            return response()->json(['message' => 'Link inválido.'], 404);
        }

        return response()->json(['data' => ['unsubscribed' => true]]);
    }
}
