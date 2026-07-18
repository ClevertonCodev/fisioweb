import { type RouteObject } from 'react-router-dom';

import AdminEditExercisePage from '@/pages/admin/exercises/AdminEditExercisePage';
import AdminExerciseDetailPage from '@/pages/admin/exercises/AdminExerciseDetailPage';
import AdminExerciseReviewPage from '@/pages/admin/exercises/AdminExerciseReviewPage';
import AdminExercisesIndexPage from '@/pages/admin/exercises/AdminExercisesIndexPage';
import AdminNewExercisePage from '@/pages/admin/exercises/AdminNewExercisePage';
import AdminVideoCreatePage from '@/pages/admin/exercises/AdminVideoCreatePage';
import AdminVideoDetailPage from '@/pages/admin/exercises/AdminVideoDetailPage';
import AdminVideoEditPage from '@/pages/admin/exercises/AdminVideoEditPage';
import AdminVideosPage from '@/pages/admin/exercises/AdminVideosPage';

export const exerciseRoutes: RouteObject[] = [
    { path: 'videos', element: <AdminVideosPage /> },
    { path: 'videos/novo', element: <AdminVideoCreatePage /> },
    { path: 'videos/:id', element: <AdminVideoDetailPage /> },
    { path: 'videos/:id/editar', element: <AdminVideoEditPage /> },
    { path: 'exercicios', element: <AdminExercisesIndexPage /> },
    { path: 'exercicios/revisar', element: <AdminExerciseReviewPage /> },
    { path: 'exercicios/novo', element: <AdminNewExercisePage /> },
    { path: 'exercicios/:id', element: <AdminExerciseDetailPage /> },
    { path: 'exercicios/:id/editar', element: <AdminEditExercisePage /> },
];
