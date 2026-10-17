import type { RouteObject } from 'react-router-dom';

// Rotas só de desenvolvimento. Em build de produção, import.meta.env.DEV vira
// `false` e o ramo inteiro (com o import dinâmico) sai do bundle.
export const devRoutes: RouteObject[] = import.meta.env.DEV
    ? [
          {
              path: '/design-system',
              lazy: async () => {
                  const { default: Component } =
                      await import('@/pages/dev/DesignSystemPage');
                  return { Component };
              },
          },
      ]
    : [];
