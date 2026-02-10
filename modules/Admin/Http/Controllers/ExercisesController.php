<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Admin\Contracts\ExerciseServiceInterface;
use Modules\Admin\Http\Requests\ExerciseMediaUploadRequest;
use Modules\Admin\Http\Requests\ExerciseStoreRequest;
use Modules\Admin\Http\Requests\ExerciseUpdateRequest;
use Modules\Admin\Models\BodyRegion;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Media\Contracts\VideoServiceInterface;

class ExercisesController extends Controller
{
    public function __construct(
        protected ExerciseServiceInterface $exerciseService,
    ) {}

    public function index(Request $request): Response
    {
        $exercises = $this->exerciseService->list(
            filters: $request->only([
                'search', 'physio_area_id', 'physio_subarea_id',
                'body_region_id', 'difficulty_level', 'movement_form', 'is_active',
            ]),
            perPage: 15,
        );

        return Inertia::render('admin/exercises/index', [
            'exercises' => $exercises,
            'filters' => $request->only([
                'search', 'physio_area_id', 'physio_subarea_id',
                'body_region_id', 'difficulty_level', 'movement_form', 'is_active',
            ]),
            'physioAreas' => PhysioArea::orderBy('name')->get(['id', 'name']),
            'bodyRegions' => BodyRegion::with('children:id,name,parent_id')->roots()->orderBy('name')->get(['id', 'name']),
            'difficulties' => Exercise::DIFFICULTIES,
            'movementForms' => Exercise::MOVEMENT_FORMS,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/exercises/create', [
            'physioAreas' => PhysioArea::with('subareas:id,physio_area_id,name')->orderBy('name')->get(['id', 'name']),
            'bodyRegions' => BodyRegion::with('children:id,name,parent_id')->roots()->orderBy('name')->get(['id', 'name']),
            'difficulties' => Exercise::DIFFICULTIES,
            'movementForms' => Exercise::MOVEMENT_FORMS,
        ]);
    }

    public function store(ExerciseStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['created_by'] = auth()->id();

        $this->exerciseService->create($data);

        return redirect()
            ->route('admin.exercises.index')
            ->with('success', 'Exercício criado com sucesso!');
    }

    public function show(int $id): Response
    {
        $exercise = $this->exerciseService->find($id);
        $exercise->load([
            'physioArea', 'physioSubarea', 'bodyRegion',
            'createdBy', 'media', 'videos',
        ]);

        return Inertia::render('admin/exercises/show', [
            'exercise' => $exercise,
        ]);
    }

    public function edit(int $id): Response
    {
        $exercise = $this->exerciseService->find($id);
        $exercise->load(['media', 'videos']);

        return Inertia::render('admin/exercises/edit', [
            'exercise' => $exercise,
            'physioAreas' => PhysioArea::with('subareas:id,physio_area_id,name')->orderBy('name')->get(['id', 'name']),
            'bodyRegions' => BodyRegion::with('children:id,name,parent_id')->roots()->orderBy('name')->get(['id', 'name']),
            'difficulties' => Exercise::DIFFICULTIES,
            'movementForms' => Exercise::MOVEMENT_FORMS,
        ]);
    }

    public function update(ExerciseUpdateRequest $request, int $id): RedirectResponse
    {
        $this->exerciseService->update($id, $request->validated());

        return redirect()
            ->route('admin.exercises.index')
            ->with('success', 'Exercício atualizado com sucesso!');
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->exerciseService->delete($id);

        return redirect()
            ->route('admin.exercises.index')
            ->with('success', 'Exercício removido com sucesso!');
    }

    public function uploadMedia(ExerciseMediaUploadRequest $request, int $id): RedirectResponse
    {
        $exercise = $this->exerciseService->find($id);
        $this->exerciseService->uploadMedia($exercise, $request->file('files'), $request->input('type'));

        return redirect()
            ->back()
            ->with('success', 'Mídia enviada com sucesso!');
    }

    public function destroyMedia(int $id, int $mediaId): RedirectResponse
    {
        $this->exerciseService->deleteMedia($mediaId);

        return redirect()
            ->back()
            ->with('success', 'Mídia removida com sucesso!');
    }

    public function uploadVideo(Request $request, int $id, VideoServiceInterface $videoService): RedirectResponse
    {
        $request->validate([
            'video' => ['required', 'file', 'mimetypes:video/mp4,video/mpeg,video/quicktime,video/webm', 'max:10240'],
        ], [
            'video.required' => 'O vídeo é obrigatório.',
            'video.mimetypes' => 'Formato de vídeo não suportado.',
            'video.max' => 'O vídeo excede o tamanho máximo de 10MB.',
        ]);

        $exercise = $this->exerciseService->find($id);
        $videoService->dispatchUpload($request->file('video'), 'exercises/videos', $exercise);

        return redirect()
            ->back()
            ->with('success', 'Vídeo enviado! O processamento será feito em segundo plano.');
    }
}
