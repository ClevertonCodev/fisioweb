import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// O tailwind-merge padrão não conhece os nomes do DS: trata `text-ds-body-xs`
// como cor e o apaga ao lado de `text-ds-primary-80`. Aqui cada nome entra no
// grupo certo.
const DS_FONT_SIZES = [
    'micro',
    'caption',
    'body-compact',
    'body-xs',
    'body-emphasis',
    'body-sm',
    'body-md',
    'body-lg',
    'eyebrow',
    'page-title',
    'h4',
    'h3',
    'h2',
    'h1',
].map((size) => `ds-${size}`);

const DS_SHADOWS = [
    'xs',
    'sm',
    'md',
    'focus',
    'focus-success',
    'focus-danger',
].map((shadow) => `ds-${shadow}`);

const DS_RADII = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'pill', 'full'].map(
    (radius) => `ds-${radius}`,
);

// Lados e cantos de raio que o tailwind-merge separa em grupos próprios.
const RADIUS_SIDES = [
    's',
    'e',
    't',
    'r',
    'b',
    'l',
    'ss',
    'se',
    'ee',
    'es',
    'tl',
    'tr',
    'br',
    'bl',
] as const;

const dsRadiusSideGroups = Object.fromEntries(
    RADIUS_SIDES.map((side) => [
        `rounded-${side}`,
        [{ [`rounded-${side}`]: DS_RADII }],
    ]),
);

const twMergeDs = extendTailwindMerge<'ds-font-size'>({
    extend: {
        classGroups: {
            // Grupo próprio: no grupo `font-size` do tailwind-merge, o tamanho
            // apaga o `leading-*` anterior, mas os tokens do DS não trazem
            // altura de linha.
            'ds-font-size': [{ text: DS_FONT_SIZES }],
            'font-family': [{ font: ['ds', 'ds-mono'] }],
            shadow: [{ shadow: DS_SHADOWS }],
            rounded: [{ rounded: DS_RADII }],
            ...dsRadiusSideGroups,
        },
        conflictingClassGroups: {
            'ds-font-size': ['font-size'],
            'font-size': ['ds-font-size'],
        },
    },
});

export function dsCn(...inputs: ClassValue[]) {
    return twMergeDs(clsx(inputs));
}
