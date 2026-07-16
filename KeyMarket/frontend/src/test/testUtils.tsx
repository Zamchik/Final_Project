// Утилиты для тестов: обёртка MemoryRouter с включёнными будущими флагами React Router,
// чтобы убрать предупреждения о v7_startTransition и v7_relativeSplatPath.
import React from 'react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';

 // Тестовый роутер с будущими флагами React Router.
 // Используйте его вместо <MemoryRouter> в тестах, чтобы избежать
 // предупреждений в консоли.
export const TestRouter: React.FC<{ children: React.ReactNode; initialEntries?: MemoryRouterProps['initialEntries'] }> = ({
  children,
  initialEntries,
}) => (
  <MemoryRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
    initialEntries={initialEntries}
  >
    {children}
  </MemoryRouter>
);