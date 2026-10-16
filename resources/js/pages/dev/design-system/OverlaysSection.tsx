import {
    CalendarDays,
    Columns3,
    Filter,
    MoreHorizontal,
    Pencil,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

import type {
    DrawerPlacement,
    DrawerSize,
    DropdownItem,
    ModalSize,
} from '@/components/ds';
import { DsButton, DsDrawer, DsDropdown, DsModal } from '@/components/ds';

import { CatalogRow, CatalogSection } from './CatalogSection';

const MODAL_SIZES: ModalSize[] = ['sm', 'md', 'lg', 'full'];
const DRAWER_SIZES: DrawerSize[] = ['sm', 'md', 'lg', 'xl'];

const PERIODS: DropdownItem[] = [
    { key: 'hoje', label: 'Hoje' },
    { key: 'semana', label: 'Esta semana', icon: <CalendarDays /> },
    { key: 'mes', label: 'Este mês', icon: <Sparkles />, badge: 'Novo' },
    { key: 'ano', label: 'Este ano', disabled: true },
];

const COLUMNS: DropdownItem[] = [
    { key: 'paciente', label: 'Paciente' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'convenio', label: 'Convênio' },
    { key: 'proxima', label: 'Próxima sessão' },
    { key: 'cpf', label: 'CPF', disabled: true },
];

const ACTIONS: DropdownItem[] = [
    { key: 'editar', label: 'Editar', icon: <Pencil /> },
    { key: 'remarcar', label: 'Remarcar', icon: <CalendarDays /> },
    { key: 'excluir', label: 'Excluir', icon: <Trash2 /> },
];

type DrawerConfig = { placement: DrawerPlacement; size: DrawerSize };

export function OverlaysSection() {
    // Tamanho e posição ficam guardados ao fechar, para a animação de saída.
    const [modalOpen, setModalOpen] = useState(false);
    const [modalSize, setModalSize] = useState<ModalSize>('md');
    const [lockedModal, setLockedModal] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawer, setDrawer] = useState<DrawerConfig>({
        placement: 'right',
        size: 'md',
    });
    const [period, setPeriod] = useState<string | string[]>('semana');
    const [columns, setColumns] = useState<string | string[]>([
        'paciente',
        'proxima',
    ]);
    const [status, setStatus] = useState<string | string[]>('ativos');

    return (
        <CatalogSection
            id="overlays"
            title="Overlays"
            description="Modal e drawer prendem o foco, fecham com Esc ou no fundo e devolvem o foco ao botão. O dropdown abre com Enter ou seta para baixo."
        >
            <CatalogRow label="Modal (sm, md, lg, full)">
                {MODAL_SIZES.map((size) => (
                    <DsButton
                        key={size}
                        variant="secondary"
                        label={`Modal ${size}`}
                        onClick={() => {
                            setModalSize(size);
                            setModalOpen(true);
                        }}
                    />
                ))}
                <DsButton
                    variant="tertiary"
                    label="Sem fechar no fundo"
                    onClick={() => setLockedModal(true)}
                />
                <DsModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    size={modalSize}
                    title="Remarcar sessão"
                    meta="Maria Fictícia · Pilates clínico"
                    footer={
                        <>
                            <DsButton
                                variant="secondary"
                                label="Cancelar"
                                onClick={() => setModalOpen(false)}
                            />
                            <DsButton
                                label="Confirmar"
                                onClick={() => setModalOpen(false)}
                            />
                        </>
                    }
                >
                    <p>
                        A sessão de quinta, 10h, será movida para sexta, 14h. O
                        paciente recebe o aviso por WhatsApp.
                    </p>
                </DsModal>
                <DsModal
                    open={lockedModal}
                    onOpenChange={setLockedModal}
                    size="sm"
                    title="Excluir paciente?"
                    closeOnBackdrop={false}
                    footer={
                        <>
                            <DsButton
                                variant="secondary"
                                label="Voltar"
                                onClick={() => setLockedModal(false)}
                            />
                            <DsButton
                                variant="destructive"
                                label="Excluir"
                                onClick={() => setLockedModal(false)}
                            />
                        </>
                    }
                >
                    <p>Clicar no fundo não fecha; use Esc ou os botões.</p>
                </DsModal>
            </CatalogRow>

            <CatalogRow label="Drawer à direita (sm, md, lg, xl) e embaixo">
                {DRAWER_SIZES.map((size) => (
                    <DsButton
                        key={size}
                        variant="secondary"
                        label={`Drawer ${size}`}
                        onClick={() => {
                            setDrawer({ placement: 'right', size });
                            setDrawerOpen(true);
                        }}
                    />
                ))}
                <DsButton
                    variant="secondary"
                    label="Drawer embaixo"
                    onClick={() => {
                        setDrawer({ placement: 'bottom', size: 'md' });
                        setDrawerOpen(true);
                    }}
                />
                <DsDrawer
                    open={drawerOpen}
                    onOpenChange={setDrawerOpen}
                    placement={drawer.placement}
                    size={drawer.size}
                    title="Filtros da agenda"
                    meta="3 filtros ativos"
                    footer={
                        <>
                            <span className="mr-auto text-ds-caption text-ds-content-muted">
                                42 sessões encontradas
                            </span>
                            <DsButton
                                variant="secondary"
                                label="Limpar"
                                onClick={() => setDrawerOpen(false)}
                            />
                            <DsButton
                                label="Aplicar"
                                onClick={() => setDrawerOpen(false)}
                            />
                        </>
                    }
                >
                    <div className="flex flex-col gap-3">
                        <p>Profissional: Dra. Ana Fictícia</p>
                        <p>Sala: Pilates 2</p>
                        <p>Status: confirmadas e pendentes</p>
                    </div>
                </DsDrawer>
            </CatalogRow>

            <CatalogRow label="Dropdown (text, checkbox, radio)">
                <DsDropdown
                    items={PERIODS}
                    value={period}
                    onValueChange={setPeriod}
                    menuTitle="Período"
                    icon={<CalendarDays />}
                />
                <DsDropdown
                    items={COLUMNS}
                    mode="checkbox"
                    value={columns}
                    onValueChange={setColumns}
                    fixedLabel="Colunas"
                    menuTitle="Mostrar colunas"
                    menuVariant="column-selector"
                    menuWidth={220}
                    icon={<Columns3 />}
                />
                <DsDropdown
                    items={[
                        { key: 'ativos', label: 'Ativos' },
                        { key: 'inativos', label: 'Inativos' },
                        { key: 'todos', label: 'Todos' },
                    ]}
                    mode="radio"
                    value={status}
                    onValueChange={setStatus}
                    icon={<Filter />}
                />
                <DsDropdown
                    items={ACTIONS}
                    fixedLabel="Ações"
                    label="Ações da sessão"
                    menuAlign="right"
                    menuWidth={180}
                    icon={<MoreHorizontal />}
                />
                <DsDropdown items={PERIODS} placeholder="Sem valor" />
            </CatalogRow>
        </CatalogSection>
    );
}
