/**
 * Registro central do Chart.js — importa controllers/elementos usados
 * pelos gráficos do dashboard e finanças. Importe uma vez antes de renderizar
 * qualquer gráfico (efeito colateral de registro).
 */
import {
    ArcElement,
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    DoughnutController,
    Legend,
    LineController,
    LineElement,
    LinearScale,
    PieController,
    PointElement,
    Tooltip,
} from 'chart.js';

Chart.register(
    BarController,
    BarElement,
    DoughnutController,
    PieController,
    LineController,
    LineElement,
    PointElement,
    ArcElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
);
