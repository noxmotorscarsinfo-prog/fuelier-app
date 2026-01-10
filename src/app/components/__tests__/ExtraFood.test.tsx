/**
 * Tests para ExtraFood component
 * 
 * Prueba el formulario de comida extra con accesibilidad mejorada
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExtraFood from '../ExtraFood';
import { createMockUser, createMockDailyLog } from '@/tests/mocks/mockData';

describe('ExtraFood', () => {
  const mockOnClose = vi.fn();
  const mockOnAdd = vi.fn();
  
  const defaultProps = {
    user: createMockUser(),
    currentLog: createMockDailyLog({
      breakfast: null,
      lunch: null,
      snack: null,
      dinner: null
    }),
    onClose: mockOnClose,
    onAdd: mockOnAdd
  };

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnAdd.mockClear();
  });

  it('should render the form with all fields', () => {
    render(<ExtraFood {...defaultProps} />);
    
    expect(screen.getByText('Comida Extra')).toBeInTheDocument();
    expect(screen.getByLabelText(/¿qué comiste\?/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/calorías/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/proteína/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/carbohidratos/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/grasas/i)).toBeInTheDocument();
  });

  it('should update name field when typing', async () => {
    const user = userEvent.setup();
    render(<ExtraFood {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/¿qué comiste\?/i);
    await user.type(nameInput, 'Pizza');
    
    expect(nameInput).toHaveValue('Pizza');
  });

  it('should update calories field when typing', async () => {
    const user = userEvent.setup();
    render(<ExtraFood {...defaultProps} />);
    
    const caloriesInput = screen.getByLabelText(/calorías/i);
    await user.type(caloriesInput, '500');
    
    expect(caloriesInput).toHaveValue(500);
  });

  it('should update macro fields when typing', async () => {
    const user = userEvent.setup();
    render(<ExtraFood {...defaultProps} />);
    
    const proteinInput = screen.getByLabelText(/proteína/i);
    const carbsInput = screen.getByLabelText(/carbohidratos/i);
    const fatInput = screen.getByLabelText(/grasas/i);
    
    await user.type(proteinInput, '25');
    await user.type(carbsInput, '50');
    await user.type(fatInput, '15');
    
    expect(proteinInput).toHaveValue(25);
    expect(carbsInput).toHaveValue(50);
    expect(fatInput).toHaveValue(15);
  });

  it('should show error when trying to add without name', async () => {
    const user = userEvent.setup();
    render(<ExtraFood {...defaultProps} />);
    
    const caloriesInput = screen.getByLabelText(/calorías/i);
    await user.type(caloriesInput, '300');
    
    const addButton = screen.getByRole('button', { name: /añadir/i });
    await user.click(addButton);
    
    expect(screen.getByText(/el nombre es obligatorio/i)).toBeInTheDocument();
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('should show error when trying to add without calories', async () => {
    const user = userEvent.setup();
    render(<ExtraFood {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/¿qué comiste\?/i);
    await user.type(nameInput, 'Helado');
    
    const addButton = screen.getByRole('button', { name: /añadir/i });
    await user.click(addButton);
    
    expect(screen.getByText(/debes introducir al menos las calorías/i)).toBeInTheDocument();
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('should call onAdd with correct data when form is valid', async () => {
    const user = userEvent.setup();
    render(<ExtraFood {...defaultProps} />);
    
    await user.type(screen.getByLabelText(/¿qué comiste\?/i), 'Chocolate');
    await user.type(screen.getByLabelText(/calorías/i), '250');
    await user.type(screen.getByLabelText(/proteína/i), '3');
    await user.type(screen.getByLabelText(/carbohidratos/i), '30');
    await user.type(screen.getByLabelText(/grasas/i), '12');
    
    const addButton = screen.getByRole('button', { name: /añadir/i });
    await user.click(addButton);
    
    expect(mockOnAdd).toHaveBeenCalledWith({
      name: 'Chocolate',
      calories: 250,
      protein: 3,
      carbs: 30,
      fat: 12
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExtraFood {...defaultProps} />);
    
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons[0]; // First button is the X button
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should round macro values when adding', async () => {
    const user = userEvent.setup();
    render(<ExtraFood {...defaultProps} />);
    
    await user.type(screen.getByLabelText(/¿qué comiste\?/i), 'Test');
    await user.type(screen.getByLabelText(/calorías/i), '250.7');
    await user.type(screen.getByLabelText(/proteína/i), '3.4');
    await user.type(screen.getByLabelText(/carbohidratos/i), '30.8');
    await user.type(screen.getByLabelText(/grasas/i), '12.3');
    
    const addButton = screen.getByRole('button', { name: /añadir/i });
    await user.click(addButton);
    
    expect(mockOnAdd).toHaveBeenCalledWith({
      name: 'Test',
      calories: 251, // rounded
      protein: 3,    // rounded
      carbs: 31,     // rounded
      fat: 12        // rounded
    });
  });

  it('should show impact preview when calories are entered', async () => {
    const user = userEvent.setup();
    render(<ExtraFood {...defaultProps} />);
    
    await user.type(screen.getByLabelText(/calorías/i), '300');
    
    // Should show preview of impact on macros
    expect(screen.getByText(/impacto/i)).toBeInTheDocument();
  });
});
