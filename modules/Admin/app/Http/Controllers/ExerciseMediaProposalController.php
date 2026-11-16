<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Modules\Admin\Contracts\ExerciseMediaProposalServiceInterface;
use Modules\Admin\Http\Requests\ListMediaProposalsRequest;
use Modules\Admin\Http\Requests\ReviewMediaProposalRequest;
use Modules\Media\Exceptions\MediaProposalChangedException;
use Modules\Media\Exceptions\MediaProposalNotPendingException;

class ExerciseMediaProposalController extends Controller
{
    public function __construct(
        protected ExerciseMediaProposalServiceInterface $proposals,
    ) {}

    public function index(ListMediaProposalsRequest $request): JsonResponse
    {
        $page = $this->proposals->list($request->page(), $request->perPage());

        return response()->json([
            'data' => $page['items'],
            'meta' => [
                'current_page' => $page['current_page'],
                'per_page'     => $page['per_page'],
                'total'        => $page['total'],
                'last_page'    => $page['last_page'],
            ],
        ]);
    }

    public function approve(ReviewMediaProposalRequest $request, int $id): JsonResponse
    {
        return $this->decide(
            fn (int $videoId, string $version) => $this->proposals->approve($id, $videoId, $version),
            $request,
            $id,
            'Proposta de mídia aprovada.',
        );
    }

    public function reject(ReviewMediaProposalRequest $request, int $id): JsonResponse
    {
        return $this->decide(
            fn (int $videoId, string $version) => $this->proposals->reject($id, $videoId, $version),
            $request,
            $id,
            'Proposta de mídia rejeitada.',
        );
    }

    /**
     * @param  callable(int, string): void  $decision
     */
    private function decide(callable $decision, ReviewMediaProposalRequest $request, int $exerciseId, string $message): JsonResponse
    {
        $videoId = (int) $request->validated('video_id');

        try {
            $decision($videoId, (string) $request->validated('proposal_version'));
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Exercício não encontrado.'], 404);
        } catch (MediaProposalNotPendingException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (MediaProposalChangedException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return response()->json([
            'message' => $message,
            'data'    => ['exercise_id' => $exerciseId, 'video_id' => $videoId],
        ]);
    }
}
