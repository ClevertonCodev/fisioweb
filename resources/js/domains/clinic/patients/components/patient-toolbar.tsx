import {
    ChevronDown,
    ClipboardList,
    FileText,
    Printer,
    Search,
    SlidersHorizontal,
    Upload,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import type { Tab } from '../types';
import { TAB_OPTIONS } from '../utils';

interface PatientToolbarProps {
    activeTab: Tab;
    activeTabLabel: string;
    onTabChange: (tab: Tab) => void;
}

export function PatientToolbar({ activeTab, activeTabLabel, onTabChange }: PatientToolbarProps) {
    return (
        <div className="border-b border-border bg-background px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
                {activeTab === 'prontuario' && (
                    <>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Pesquisar" className="pl-9" />
                        </div>
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                            <SlidersHorizontal className="h-4 w-4" />
                            Filtros
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                            <Printer className="h-4 w-4" />
                            Imprimir
                        </Button>
                    </>
                )}

                <div className={activeTab === 'prontuario' ? 'ml-auto flex items-center gap-2' : 'flex items-center gap-2'}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="gap-2">
                                {activeTabLabel}
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {TAB_OPTIONS.map((tab) => (
                                <DropdownMenuItem
                                    key={tab.value}
                                    onClick={() => onTabChange(tab.value)}
                                    className={activeTab === tab.value ? 'bg-accent' : ''}
                                >
                                    {tab.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {activeTab === 'prontuario' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="gap-2">
                                    Adicionar
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem className="gap-2">
                                    <FileText className="h-4 w-4" />
                                    Evolução
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2">
                                    <ClipboardList className="h-4 w-4" />
                                    Avaliação
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2">
                                    <ClipboardList className="h-4 w-4" />
                                    Questionário
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2">
                                    <Upload className="h-4 w-4" />
                                    Adicionar arquivos
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </div>
    );
}
