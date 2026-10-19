/**
 * PROTÓTIPO (descartável): questionários de exemplo, escritos aqui, para
 * ver os modais com mais de um item. Aparecem com o selo "Exemplo" e ids
 * negativos (não existem no banco). As perguntas são simples e da clínica,
 * não escalas validadas (Oswestry, DASH etc. têm texto próprio).
 */
import type {
    PatientQuestionnaire,
    QuestionnaireQuestion,
    QuestionnaireTemplate,
} from '@/domain/clinic';

type Q =
    | [label: string, type: 'text', required?: boolean]
    | [label: string, type: 'scale', required?: boolean]
    | [
          label: string,
          type: 'multiple_choice' | 'checkbox',
          options: string[],
          required?: boolean,
      ];

let nextId = -1000;

/** Data fixa ao carregar o arquivo (os "há N dias" dos exemplos). */
const LOADED_AT = Date.now();

function template(
    id: number,
    title: string,
    description: string,
    sections: [title: string, questions: Q[]][],
): QuestionnaireTemplate {
    return {
        id,
        clinicId: 1,
        title,
        description,
        isActive: true,
        sections: sections.map(([sectionTitle, qs], si) => ({
            id: (nextId -= 1),
            title: sectionTitle,
            sortOrder: si,
            questions: qs.map((q, qi): QuestionnaireQuestion => {
                const hasOptions =
                    q[1] === 'multiple_choice' || q[1] === 'checkbox';
                return {
                    id: (nextId -= 1),
                    label: q[0],
                    type: q[1],
                    options: hasOptions ? (q[2] as string[]) : null,
                    scaleMin: 0,
                    scaleMax: 10,
                    required: Boolean(hasOptions ? q[3] : q[2]),
                    sortOrder: qi,
                };
            }),
        })),
    };
}

export const DEMO_TEMPLATES: QuestionnaireTemplate[] = [
    template(-1, 'Retorno semanal', 'Como foi a semana entre as sessões.', [
        [
            'Sua semana',
            [
                [
                    'De 0 a 10, quanto doeu em média nesta semana?',
                    'scale',
                    true,
                ],
                [
                    'Fez os exercícios de casa?',
                    'multiple_choice',
                    ['Todos os dias', 'Alguns dias', 'Não consegui'],
                    true,
                ],
                ['O que ficou mais fácil?', 'text'],
                [
                    'Teve alguma dificuldade?',
                    'checkbox',
                    [
                        'Dor ao fazer',
                        'Falta de tempo',
                        'Esqueci',
                        'Não entendi algum exercício',
                    ],
                ],
                [
                    'A dor atrapalhou o sono?',
                    'multiple_choice',
                    ['Não', 'Às vezes', 'Quase toda noite'],
                ],
            ],
        ],
    ]),
    template(
        -2,
        'Dor lombar — primeira consulta',
        'Para conhecer a dor antes da avaliação.',
        [
            [
                'Sua dor',
                [
                    ['De 0 a 10, quanto dói agora?', 'scale', true],
                    [
                        'Há quanto tempo sente essa dor?',
                        'multiple_choice',
                        [
                            'Menos de 1 semana',
                            '1 a 4 semanas',
                            '1 a 3 meses',
                            'Mais de 3 meses',
                        ],
                        true,
                    ],
                    [
                        'A dor desce para a perna?',
                        'multiple_choice',
                        ['Não', 'Até o joelho', 'Até o pé'],
                    ],
                    [
                        'O que piora?',
                        'checkbox',
                        [
                            'Ficar sentado',
                            'Ficar em pé',
                            'Andar',
                            'Pegar peso',
                            'Ao acordar',
                        ],
                    ],
                ],
            ],
            [
                'Sua rotina',
                [
                    [
                        'Como é o seu trabalho?',
                        'multiple_choice',
                        [
                            'Sentado',
                            'Em pé',
                            'Com esforço físico',
                            'Não trabalho no momento',
                        ],
                    ],
                    [
                        'Pratica atividade física?',
                        'multiple_choice',
                        ['Não', '1 a 2 vezes por semana', '3 ou mais vezes'],
                    ],
                    ['O que você espera do tratamento?', 'text'],
                ],
            ],
        ],
    ),
    template(
        -3,
        'Pós-operatório de joelho',
        'Acompanhamento depois da cirurgia.',
        [
            [
                'Como está o joelho',
                [
                    ['De 0 a 10, quanto dói ao caminhar?', 'scale', true],
                    [
                        'O joelho está inchado?',
                        'multiple_choice',
                        ['Não', 'Um pouco', 'Bastante'],
                        true,
                    ],
                    [
                        'Consegue dobrar o joelho até onde?',
                        'multiple_choice',
                        ['Quase nada', 'Até a metade', 'Quase todo'],
                    ],
                    [
                        'Usa muleta ou andador?',
                        'multiple_choice',
                        ['Não', 'Às vezes', 'Sempre'],
                    ],
                    [
                        'Consegue subir escada?',
                        'multiple_choice',
                        ['Sim', 'Com apoio', 'Não'],
                    ],
                    ['Algo mais que queira contar?', 'text'],
                ],
            ],
        ],
    ),
    template(
        -4,
        'Satisfação com o atendimento',
        'Rápido, para melhorar o atendimento.',
        [
            [
                'Sua opinião',
                [
                    [
                        'De 0 a 10, quanto recomendaria a clínica?',
                        'scale',
                        true,
                    ],
                    [
                        'As explicações foram claras?',
                        'multiple_choice',
                        ['Sim', 'Mais ou menos', 'Não'],
                    ],
                    [
                        'O que mais gostou?',
                        'checkbox',
                        [
                            'Atenção do fisioterapeuta',
                            'Exercícios',
                            'Horários',
                            'Ambiente',
                        ],
                    ],
                    ['O que podemos melhorar?', 'text'],
                ],
            ],
        ],
    ),
    template(-5, 'Rotina e sono', 'Hábitos que influenciam a recuperação.', [
        [
            'Rotina',
            [
                [
                    'Quantas horas dorme por noite?',
                    'multiple_choice',
                    ['Menos de 5', '5 a 6', '7 a 8', 'Mais de 8'],
                ],
                ['De 0 a 10, como avalia o seu sono?', 'scale'],
                [
                    'Passa muitas horas sentado?',
                    'multiple_choice',
                    ['Menos de 4 horas', '4 a 8 horas', 'Mais de 8 horas'],
                ],
                ['Toma algum remédio para dor?', 'text'],
                [
                    'Quais atividades faz no dia a dia?',
                    'checkbox',
                    [
                        'Caminhada',
                        'Musculação',
                        'Pilates',
                        'Cuidar da casa',
                        'Cuidar de criança',
                    ],
                ],
            ],
        ],
    ]),
    template(-6, 'Alta — como você está', 'Para fechar o tratamento.', [
        [
            'Fim do tratamento',
            [
                ['De 0 a 10, quanto dói hoje?', 'scale', true],
                ['De 0 a 10, quanto melhorou desde o início?', 'scale', true],
                [
                    'Voltou às atividades que fazia antes?',
                    'multiple_choice',
                    ['Sim, todas', 'Quase todas', 'Ainda não'],
                ],
                [
                    'Vai continuar os exercícios em casa?',
                    'multiple_choice',
                    ['Sim', 'Talvez', 'Não'],
                ],
                ['Quer deixar um recado?', 'text'],
            ],
        ],
    ]),
];

/** Envios de exemplo, para ver os selos de status nos cartões. */
export function demoLastSent(
    templateId: number,
): PatientQuestionnaire | undefined {
    const daysAgo = (n: number) =>
        new Date(LOADED_AT - n * 24 * 60 * 60 * 1000).toISOString();
    const base = {
        id: templateId,
        clinicId: 1,
        patientId: 0,
        clinicUserId: 0,
        questionnaireTemplateId: templateId,
        modality: 'remoto' as const,
        answeredAt: null,
        expiresAt: null,
    };
    if (templateId === -1) {
        return { ...base, status: 'pending', createdAt: daysAgo(2) };
    }
    if (templateId === -2) {
        return {
            ...base,
            status: 'answered',
            createdAt: daysAgo(40),
            answeredAt: daysAgo(39),
        };
    }
    if (templateId === -5) {
        return { ...base, status: 'expired', createdAt: daysAgo(20) };
    }
    return undefined;
}
