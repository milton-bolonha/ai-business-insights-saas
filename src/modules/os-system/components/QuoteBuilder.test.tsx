import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuoteBuilder } from './QuoteBuilder';
import React from 'react';

describe('QuoteBuilder', () => {
  it('calculates totals correctly when items are added', () => {
    const mockOnSubmit = vi.fn();
    
    // Provide initial items to test calculation logic easily
    const initialItems = [
      { id: '1', description: 'Tela', type: 'part' as const, quantity: 1, unitCost: 100, unitPrice: 200 },
      { id: '2', description: 'Mão de Obra', type: 'labor' as const, quantity: 2, unitCost: 50, unitPrice: 150 }
    ];

    render(<QuoteBuilder onQuoteSubmit={mockOnSubmit} initialItems={initialItems} />);
    
    // Total Cost = (1 * 100) + (2 * 50) = 200
    expect(screen.getAllByText(/R\$ 200.00/i).length).toBeGreaterThan(0);
    
    // Total Price = (1 * 200) + (2 * 150) = 500
    expect(screen.getAllByText(/R\$ 500.00/i).length).toBeGreaterThan(0);

    // Margin = ((500 - 200) / 500) * 100 = 60%
    expect(screen.getByText(/60.0%/i)).toBeDefined();
  });

  it('allows adding a new item and updates totals', () => {
    const mockOnSubmit = vi.fn();
    render(<QuoteBuilder onQuoteSubmit={mockOnSubmit} />);
    
    // Find inputs
    const descriptionInput = screen.getByPlaceholderText(/Ex: Tela IPS/i);
    const costInputs = screen.getAllByRole('spinbutton');
    // costInputs[0] is unitCost, costInputs[1] is unitPrice based on layout
    const costInput = costInputs[0];
    const priceInput = costInputs[1];
    
    const addButton = screen.getByText('Adicionar');

    // Initially empty
    expect(screen.getByText(/Nenhum item adicionado/i)).toBeDefined();

    // Add item
    fireEvent.change(descriptionInput, { target: { value: 'Bateria' } });
    fireEvent.change(costInput, { target: { value: '50' } });
    fireEvent.change(priceInput, { target: { value: '100' } });
    fireEvent.click(addButton);

    // Verify item is in the table
    expect(screen.getByText(/Bateria/i)).toBeDefined();
    
    // Verify totals
    expect(screen.getAllByText(/R\$ 50.00/i).length).toBeGreaterThan(0); // Custo total
    expect(screen.getAllByText(/R\$ 100.00/i).length).toBeGreaterThan(0); // Preço total
    expect(screen.getAllByText(/50.0%/i).length).toBeGreaterThan(0); // Margem
  });

  it('submits correct totals on completion', () => {
    const mockOnSubmit = vi.fn();
    const initialItems = [
      { id: '1', description: 'Reparo', type: 'labor' as const, quantity: 1, unitCost: 10, unitPrice: 100 }
    ];

    render(<QuoteBuilder onQuoteSubmit={mockOnSubmit} initialItems={initialItems} />);
    
    const submitBtn = screen.getByText(/Finalizar e Enviar para Aprovação/i);
    fireEvent.click(submitBtn);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    const submittedTotals = mockOnSubmit.mock.calls[0][1];
    expect(submittedTotals.totalCost).toBe(10);
    expect(submittedTotals.totalPrice).toBe(100);
    expect(submittedTotals.margin).toBe(90);
  });
});
