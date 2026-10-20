import { describe, expect, it } from 'vitest';

import {
    formatDuration,
    formatTimeRange,
} from '@/components/clinic/agenda/agenda-shared';
import {
    appointmentFormSchema,
    durationChosen,
    endAt,
    endChanged,
    initialFormValues,
    parsePlace,
    placeLabel,
    startChanged,
    toLocation,
    toWriteDto,
    type AppointmentFormValues,
} from '@/components/clinic/agenda/appointment-modal/appointment-form';
import type { Appointment } from '@/domain/clinic';

function values(
    overrides: Partial<AppointmentFormValues> = {},
): AppointmentFormValues {
    return {
        patientId: '1',
        clinicUserId: '2',
        date: new Date(2026, 9, 20),
        start: '10:00',
        end: '11:00',
        place: 'clinic',
        room: '',
        title: 'Sessão',
        description: '',
        durationMinutes: 60,
        ...overrides,
        referenceMinutes:
            overrides.referenceMinutes ?? overrides.durationMinutes ?? 60,
    };
}

function appointment(start: Date, end: Date): Appointment {
    return {
        id: '9',
        patientId: '1',
        patientName: 'Paciente',
        clinicUserId: '2',
        clinicUserName: 'Profissional',
        title: 'Sessão',
        description: null,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        status: 'scheduled',
        location: null,
        source: 'system',
    };
}

const SEM_LOCAL = { isFromGoogle: false, original: null, placeTouched: false };

describe('local da consulta', () => {
    it('lê e monta o formato fixo', () => {
        expect(toLocation('clinic', ' Sala 3 ')).toBe('Clínica · Sala 3');
        expect(toLocation('clinic', '')).toBe('Clínica');
        expect(toLocation('home', 'ignorada')).toBe('Domicílio do paciente');
        expect(parsePlace('Clínica · Sala 3')).toEqual({
            place: 'clinic',
            room: 'Sala 3',
        });
        expect(parsePlace('Domicílio do paciente')).toEqual({
            place: 'home',
            room: '',
        });
    });

    it('mostra como está o texto fora do formato fixo', () => {
        expect(placeLabel('Rua X, 10')).toBe('Rua X, 10');
        expect(placeLabel('Clínica · Sala 3')).toBe('Na clínica · Sala 3');
        expect(placeLabel('Domicílio do paciente')).toBe(
            'Domicílio do paciente',
        );
        expect(placeLabel(null)).toBe('Local não informado');
    });

    it('na edição sem mexer no local, devolve o texto antigo intacto', () => {
        const parsed = parsePlace('Rua X, 10');
        const dto = toWriteDto(values(parsed), {
            isFromGoogle: false,
            original: 'Rua X, 10',
            placeTouched: false,
        });
        expect(dto.location).toBe('Rua X, 10');

        const semLocal = toWriteDto(values(), {
            isFromGoogle: false,
            original: null,
            placeTouched: false,
        });
        expect(semLocal.location).toBeNull();
    });

    it('remonta o local quando o usuário mexeu nele', () => {
        const dto = toWriteDto(values({ place: 'home' }), {
            isFromGoogle: false,
            original: 'Rua X, 10',
            placeTouched: true,
        });
        expect(dto.location).toBe('Domicílio do paciente');
    });

    it('consulta nova sempre usa o formato fixo', () => {
        const dto = toWriteDto(values({ room: 'Sala 1' }), {
            isFromGoogle: false,
            original: undefined,
            placeTouched: false,
        });
        expect(dto.location).toBe('Clínica · Sala 1');
    });

    it('evento do Google mantém o local que veio dele e não manda paciente', () => {
        const dto = toWriteDto(values({ place: 'home' }), {
            isFromGoogle: true,
            original: 'Av. Brasil, 100',
            placeTouched: true,
        });
        expect(dto.location).toBe('Av. Brasil, 100');
        expect(dto.patientId).toBeNull();
    });
});

describe('validação da sala', () => {
    const longo = 'https://meet.google.com/' + 'x'.repeat(130);

    function errorPaths(
        requirePatient: boolean,
        form: AppointmentFormValues,
        originalRoom?: string,
    ): string[] {
        const result = appointmentFormSchema(
            requirePatient,
            originalRoom,
        ).safeParse(form);
        return result.success
            ? []
            : result.error.issues.map((i) => i.path.join('.'));
    }

    it('evento do Google com local longo salva (a sala nem aparece)', () => {
        const form = values({ ...parsePlace(longo), patientId: '' });
        expect(errorPaths(false, form, parsePlace(longo).room)).toEqual([]);
        // Mesmo com sala longa e diferente da original, o Google não valida a sala.
        expect(
            errorPaths(
                false,
                values({ patientId: '', room: 'x'.repeat(250) }),
                '',
            ),
        ).toEqual([]);
    });

    it('local antigo longo não mexido não barra o salvar', () => {
        // 250 caracteres: cabe nos 255 do backend, mas passa do limite da sala.
        const antigo = 'Rua ' + 'x'.repeat(246);
        const parsed = parsePlace(antigo);
        expect(errorPaths(true, values(parsed), parsed.room)).toEqual([]);
        expect(errorPaths(true, values(parsed), '')).toEqual(['room']);
    });

    it('domiciliar ignora a sala escondida', () => {
        expect(
            errorPaths(true, values({ place: 'home', room: 'x'.repeat(300) })),
        ).toEqual([]);
    });

    it('sala nova longa demais na clínica dá erro na sala', () => {
        expect(errorPaths(true, values({ room: 'x'.repeat(246) }), '')).toEqual(
            ['room'],
        );
        expect(errorPaths(true, values({ room: 'x'.repeat(245) }), '')).toEqual(
            [],
        );
    });
});

describe('horário: a duração é a fonte de verdade', () => {
    // seg 19/10 09:00 até ter 20/10 17:00 (horário local) = 1920 min
    const multiStart = new Date(2026, 9, 19, 9, 0);
    const multiEnd = new Date(2026, 9, 20, 17, 0);
    // 22:00 até 01:00 do dia seguinte = 180 min
    const nightStart = new Date(2026, 9, 19, 22, 0);
    const nightEnd = new Date(2026, 9, 20, 1, 0);

    function editing(start: Date, end: Date) {
        const apt = appointment(start, end);
        return {
            apt,
            form: initialFormValues({ appointment: apt, initialDate: null }),
        };
    }

    it('lê a duração real, inclusive de vários dias e depois da meia-noite', () => {
        expect(editing(multiStart, multiEnd).form).toMatchObject({
            start: '09:00',
            end: '17:00',
            durationMinutes: 1920,
        });
        expect(editing(nightStart, nightEnd).form).toMatchObject({
            start: '22:00',
            end: '01:00',
            durationMinutes: 180,
        });
    });

    it('endAt mostra o horário e o dia do término', () => {
        expect(endAt('09:15', 45)).toEqual({ end: '10:00', dayOffset: 0 });
        expect(endAt('23:00', 60)).toEqual({ end: '00:00', dayOffset: 1 });
        expect(endAt('09:00', 1920)).toEqual({ end: '17:00', dayOffset: 1 });
        expect(endAt('09:0', 60)).toBeNull();
        expect(endAt('09:00', 0)).toBeNull();
    });

    it('mudar o início desloca o término e mantém a duração', () => {
        const { form } = editing(multiStart, multiEnd);
        expect(startChanged(form, '10:00')).toEqual({ end: '18:00' });
        const night = editing(nightStart, nightEnd).form;
        expect(startChanged(night, '22:30')).toEqual({ end: '01:30' });
    });

    it('início pela metade não mexe no término', () => {
        const { form } = editing(multiStart, multiEnd);
        expect(startChanged(form, '1')).toEqual({});
        expect(startChanged(form, '10:0')).toEqual({});
    });

    it('digitar o término recalcula a duração nos dois sentidos da meia-noite', () => {
        const nova = initialFormValues({
            appointment: null,
            initialDate: new Date(2026, 9, 20, 23, 15),
        });
        expect(nova).toMatchObject({
            start: '23:15',
            end: '00:15',
            durationMinutes: 60,
        });
        // 23:15 → 23:45 no mesmo dia: 30 min, não 24 h 30 min
        expect(endChanged(nova, '23:45')).toEqual({ durationMinutes: 30 });
        // 22:00 → 00:30 passa da meia-noite: 150 min
        const night = editing(nightStart, nightEnd).form;
        expect(endChanged(night, '00:30')).toEqual({ durationMinutes: 150 });
    });

    it('digitar o término de um evento de vários dias mantém os dias', () => {
        const { form } = editing(multiStart, multiEnd);
        expect(endChanged(form, '18:00')).toEqual({ durationMinutes: 1980 });
    });

    it('vários dias: o término digitado fica no dia em que já estava', () => {
        // seg 09:00 → ter 17:00; digitar 08:00 = ter 08:00 (não quarta)
        const { form } = editing(multiStart, multiEnd);
        expect(endChanged(form, '08:00')).toEqual({ durationMinutes: 1380 });
        // seg 10:00 → qua 09:00; digitar 11:00 = qua 11:00 (não terça)
        const longo = editing(
            new Date(2026, 9, 19, 10, 0),
            new Date(2026, 9, 21, 9, 0),
        ).form;
        expect(longo.durationMinutes).toBe(2820);
        expect(endChanged(longo, '11:00')).toEqual({ durationMinutes: 2940 });
    });

    it('consulta curta: término antes do início dá erro (erro de digitação)', () => {
        const form = values({
            start: '10:00',
            end: '11:00',
            durationMinutes: 60,
        });
        expect(endChanged(form, '09:00')).toEqual({ durationMinutes: -60 });
        const result = appointmentFormSchema(true, '').safeParse(
            values({ start: '10:00', end: '09:00', durationMinutes: -60 }),
        );
        expect(result.success).toBe(false);
    });

    it('com duração zero ou negativa, mudar o início recalcula pela tela', () => {
        const zero = values({
            start: '10:00',
            end: '10:00',
            durationMinutes: 0,
        });
        expect(startChanged(zero, '09:00')).toEqual({ durationMinutes: 60 });
        const negativa = values({
            start: '10:00',
            end: '09:00',
            durationMinutes: -60,
        });
        expect(startChanged(negativa, '08:30')).toEqual({
            durationMinutes: 30,
        });
        expect(startChanged(negativa, '09:3')).toEqual({});
    });

    it('término pela metade não mexe na duração', () => {
        const { form } = editing(multiStart, multiEnd);
        expect(endChanged(form, '18:0')).toEqual({});
        // início pela metade: a duração fica indefinida (0) e o término
        // digitado manda quando o início for completado
        expect(endChanged({ ...form, start: '09:0' }, '18:00')).toEqual({
            durationMinutes: 0,
        });
    });

    it('término digitado com o início vazio não é apagado ao completar o início', () => {
        const form = values({
            start: '10:00',
            end: '11:00',
            durationMinutes: 60,
        });
        const semInicio = {
            ...form,
            start: '',
            end: '15:00',
            ...endChanged({ ...form, start: '' }, '15:00'),
        };
        expect(startChanged(semInicio, '09:00')).toEqual({
            durationMinutes: 360,
        });
    });

    it('corrigir o término duas vezes dá o mesmo que digitar o valor final', () => {
        // Caso A: seg 09:00 → ter 10:00 (vários dias)
        const a = editing(
            new Date(2026, 9, 19, 9, 0),
            new Date(2026, 9, 20, 10, 0),
        ).form;
        const a1 = { ...a, end: '08:00', ...endChanged(a, '08:00') };
        expect(a1.durationMinutes).toBe(1380); // ter 08:00
        expect(endChanged(a1, '11:00')).toEqual(endChanged(a, '11:00'));
        expect(endChanged(a, '11:00')).toEqual({ durationMinutes: 1560 });
        // Caso B: seg 23:00 → ter 00:30 (curta, já no dia seguinte)
        const b = values({ start: '23:00', end: '00:30', durationMinutes: 90 });
        const b1 = { ...b, end: '23:00', ...endChanged(b, '23:00') };
        expect(b1.durationMinutes).toBe(0); // término = início: erro
        expect(endChanged(b1, '23:30')).toEqual({ durationMinutes: 30 });
    });

    it('propriedade: o resultado só depende do término final, não dos digitados antes', () => {
        const ends = [
            '00:00',
            '00:30',
            '05:00',
            '08:00',
            '09:00',
            '11:00',
            '15:00',
            '22:00',
            '23:30',
        ];
        const cases = [
            values({ start: '09:00', durationMinutes: 60 }),
            values({ start: '09:00', durationMinutes: 1200 }),
            values({ start: '09:00', durationMinutes: 1440 }),
            values({ start: '09:00', durationMinutes: 1500 }),
            values({ start: '23:00', durationMinutes: 90 }),
            values({ start: '22:00', durationMinutes: 2820 }),
        ];
        for (const base of cases) {
            for (const first of ends) {
                for (const last of ends) {
                    const mid = {
                        ...base,
                        end: first,
                        ...endChanged(base, first),
                    };
                    expect(
                        endChanged(mid, last),
                        `${base.start}+${base.durationMinutes} → ${first} → ${last}`,
                    ).toEqual(endChanged(base, last));
                }
            }
        }
    });

    it('consulta curta que já termina no dia seguinte: término depois do início fica no mesmo dia', () => {
        // seg 09:00 → ter 05:00 (20 h): digitar 15:00 = seg 15:00
        const h = values({ start: '09:00', durationMinutes: 1200 });
        expect(endChanged(h, '15:00')).toEqual({ durationMinutes: 360 });
        // e término igual ao início não vira 24 h
        const b = values({ start: '23:00', durationMinutes: 90 });
        expect(endChanged(b, '23:00')).toEqual({ durationMinutes: 0 });
    });

    it('exatamente 24 h conta como vários dias', () => {
        const dia = values({ start: '09:00', durationMinutes: 1440 });
        expect(endChanged(dia, '11:00')).toEqual({ durationMinutes: 1560 });
    });

    it('atalho de duração vira a nova referência', () => {
        const form = values({ start: '09:00', durationMinutes: 1500 });
        expect(durationChosen(form, 30)).toEqual({
            durationMinutes: 30,
            referenceMinutes: 30,
            end: '09:30',
        });
    });

    it('término igual ao início no mesmo dia fica inválido', () => {
        const patch = endChanged(
            values({ start: '10:00', durationMinutes: 60 }),
            '10:00',
        );
        expect(patch).toEqual({ durationMinutes: 0 });
        const result = appointmentFormSchema(true, '').safeParse(
            values({ start: '10:00', end: '10:00', durationMinutes: 0 }),
        );
        expect(result.success).toBe(false);
    });

    it('atalho de duração troca a duração e passa da meia-noite se precisar', () => {
        expect(durationChosen(values({ start: '23:00' }), 60)).toEqual({
            durationMinutes: 60,
            referenceMinutes: 60,
            end: '00:00',
        });
        // com o início pela metade, só a duração muda
        expect(durationChosen(values({ start: '23:0' }), 30)).toEqual({
            durationMinutes: 30,
            referenceMinutes: 30,
        });
    });

    it('salvar sem mexer no horário devolve início e término originais', () => {
        // Segundos que o formulário (HH:MM) não guarda: só voltam intactos se
        // o horário original for devolvido.
        const apt = appointment(
            new Date(2026, 9, 19, 9, 0, 30),
            new Date(2026, 9, 20, 17, 0, 45),
        );
        const form = initialFormValues({ appointment: apt, initialDate: null });
        const dto = toWriteDto({ ...form, title: 'Outro' }, SEM_LOCAL, {
            startsAt: apt.startsAt,
            endsAt: apt.endsAt,
            touched: false,
        });
        expect(dto.startsAt).toBe(apt.startsAt);
        expect(dto.endsAt).toBe(apt.endsAt);
    });

    it('salvar com o horário mexido manda início + duração', () => {
        const { apt, form } = editing(multiStart, multiEnd);
        const dto = toWriteDto(
            { ...form, start: '10:00', ...startChanged(form, '10:00') },
            SEM_LOCAL,
            { startsAt: apt.startsAt, endsAt: apt.endsAt, touched: true },
        );
        expect(dto.startsAt).toBe(new Date(2026, 9, 19, 10, 0).toISOString());
        expect(dto.endsAt).toBe(new Date(2026, 9, 20, 18, 0).toISOString());

        const night = editing(nightStart, nightEnd);
        const dtoNight = toWriteDto(
            {
                ...night.form,
                end: '00:30',
                ...endChanged(night.form, '00:30'),
            },
            SEM_LOCAL,
            {
                startsAt: night.apt.startsAt,
                endsAt: night.apt.endsAt,
                touched: true,
            },
        );
        expect(dtoNight.endsAt).toBe(
            new Date(2026, 9, 20, 0, 30).toISOString(),
        );
    });

    it('evento que passa da meia-noite é válido', () => {
        const { form } = editing(nightStart, nightEnd);
        expect(appointmentFormSchema(true, '').safeParse(form).success).toBe(
            true,
        );
    });
});

describe('formatação de horário e duração', () => {
    it('formatDuration', () => {
        expect(formatDuration(45)).toBe('45 min');
        expect(formatDuration(90)).toBe('1 h 30 min');
        expect(formatDuration(120)).toBe('2 h');
        expect(formatDuration(1950)).toBe('1 d 8 h 30 min');
        expect(formatDuration(1440)).toBe('1 d');
    });

    it('formatTimeRange mostra o dia do término quando é outro', () => {
        const a = new Date(2026, 9, 19, 9, 0).toISOString();
        const b = new Date(2026, 9, 19, 10, 0).toISOString();
        const c = new Date(2026, 9, 20, 17, 0).toISOString();
        expect(formatTimeRange(a, b)).toBe('09:00 – 10:00');
        expect(formatTimeRange(a, c)).toMatch(/^09:00 – 17:00 de .*20\/10/);
    });
});
