/**
 * Registro central do Chart.js — importa apenas os controllers/elementos usados
 * pelos gráficos do dashboard (Captação = rosca; Taxa de ocupação = barras),
 * mantendo o bundle enxuto. Importe este módulo uma vez antes de renderizar
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
    LinearScale,
    Tooltip,
} from 'chart.js';

Chart.register(
    BarController,
    BarElement,
    DoughnutController,
    ArcElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
);
