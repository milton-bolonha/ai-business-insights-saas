import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OSStatusBadge } from './OSStatusBadge';
import { OSStatus } from '@/modules/os-system/types/OSEntity';
import React from 'react';

describe('OSStatusBadge', () => {
  it('renders intake status correctly', () => {
    render(<OSStatusBadge status={'intake' as OSStatus} />);
    expect(screen.getByText('Triagem')).toBeDefined();
    // Use className check as a proxy for styling
    expect(screen.getByText('Triagem').className).toContain('bg-gray-100');
  });

  it('renders in_production status correctly', () => {
    render(<OSStatusBadge status={'in_production' as OSStatus} />);
    expect(screen.getByText('Em Produção')).toBeDefined();
    expect(screen.getByText('Em Produção').className).toContain('bg-purple-100');
  });

  it('renders delivered status correctly', () => {
    render(<OSStatusBadge status={'delivered' as OSStatus} />);
    expect(screen.getByText('Entregue')).toBeDefined();
    expect(screen.getByText('Entregue').className).toContain('bg-teal-100');
  });

  it('renders unknown status gracefully', () => {
    render(<OSStatusBadge status={'unknown_status' as any} />);
    expect(screen.getByText('unknown_status')).toBeDefined();
    expect(screen.getByText('unknown_status').className).toContain('bg-gray-100');
  });
});
