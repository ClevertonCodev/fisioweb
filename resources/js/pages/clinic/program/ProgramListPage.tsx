import { useLocation } from 'react-router-dom';

import ExerciseLibraryPage from './exercise-library/ExerciseLibraryPage';
import ProgramModelsPage from './program-models/ProgramModelsPage';
import ProgramHistoryPage from './ProgramHistoryPage';
import { programsTabFromPath } from './programs-shell/programs-tabs';

export default function ProgramListPage() {
    const location = useLocation();
    const tab = programsTabFromPath(location.pathname);
    if (tab === 'historico') return <ProgramHistoryPage />;
    if (tab === 'exercicios') return <ExerciseLibraryPage />;
    return <ProgramModelsPage />;
}
