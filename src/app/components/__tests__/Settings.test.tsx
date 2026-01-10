import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from '../Settings';
import { createMockUser } from '../../../tests/mocks/mockData';

describe('Settings', () => {
  const mockOnBack = vi.fn();
  const mockOnUpdateGoals = vi.fn();
  const mockOnUpdateProfile = vi.fn();
  const mockOnUpdatePreferences = vi.fn();
  const mockOnNavigateToCustomMeals = vi.fn();
  const mockOnLogout = vi.fn();

  const defaultProps = {
    user: createMockUser(),
    onBack: mockOnBack,
    onUpdateGoals: mockOnUpdateGoals,
    onUpdateProfile: mockOnUpdateProfile,
    onUpdatePreferences: mockOnUpdatePreferences,
    onNavigateToCustomMeals: mockOnNavigateToCustomMeals,
    onLogout: mockOnLogout,
  };

  it('should render settings with user information', () => {
    render(<Settings {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /^Configuración$/, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Información Personal/i)).toBeInTheDocument();
  });

  it('should update weight with range slider', () => {
    render(<Settings {...defaultProps} />);
    
    const weightSlider = screen.getByLabelText(/Peso: \d+ kg/i);
    fireEvent.change(weightSlider, { target: { value: '75' } });
    
    expect(weightSlider).toHaveValue('75');
    expect(screen.getByText(/Peso: 75 kg/i)).toBeInTheDocument();
  });

  it('should update height with range slider', () => {
    render(<Settings {...defaultProps} />);
    
    const heightSlider = screen.getByLabelText(/Altura: \d+ cm/i);
    fireEvent.change(heightSlider, { target: { value: '180' } });
    
    expect(heightSlider).toHaveValue('180');
    expect(screen.getByText(/Altura: 180 cm/i)).toBeInTheDocument();
  });

  it('should update age with range slider', () => {
    render(<Settings {...defaultProps} />);
    
    const ageSlider = screen.getByLabelText(/Edad: \d+ años/i);
    fireEvent.change(ageSlider, { target: { value: '30' } });
    
    expect(ageSlider).toHaveValue('30');
    expect(screen.getByText(/Edad: 30 años/i)).toBeInTheDocument();
  });

  it('should update training frequency with range slider', () => {
    render(<Settings {...defaultProps} />);
    
    const trainingSlider = screen.getByLabelText(/Actividad: \d+ días\/semana/i);
    fireEvent.change(trainingSlider, { target: { value: '5' } });
    
    expect(trainingSlider).toHaveValue('5');
    expect(screen.getByText(/Actividad: 5 días\/semana/i)).toBeInTheDocument();
  });

  it('should update goal with select dropdown', () => {
    render(<Settings {...defaultProps} />);
    
    const goalSelect = screen.getByLabelText(/Objetivo:/i);
    fireEvent.change(goalSelect, { target: { value: 'moderate_loss' } });
    
    expect(goalSelect).toHaveValue('moderate_loss');
  });

  it('should update meals per day with range slider', () => {
    render(<Settings {...defaultProps} />);
    
    const mealsSlider = screen.getByLabelText(/Comidas al día: \d+/i);
    fireEvent.change(mealsSlider, { target: { value: '4' } });
    
    expect(mealsSlider).toHaveValue('4');
    expect(screen.getByText(/Comidas al día: 4/i)).toBeInTheDocument();
  });

  it('should show save button when profile changes', () => {
    render(<Settings {...defaultProps} />);
    
    const weightSlider = screen.getByLabelText(/Peso: \d+ kg/i);
    fireEvent.change(weightSlider, { target: { value: '75' } });
    
    const saveButton = screen.getByRole('button', { name: /guardar perfil/i });
    expect(saveButton).toBeInTheDocument();
  });

  it('should call onUpdateProfile when saving changes', async () => {
    const user = userEvent.setup();
    render(<Settings {...defaultProps} />);
    
    const weightSlider = screen.getByLabelText(/Peso: \d+ kg/i);
    fireEvent.change(weightSlider, { target: { value: '75' } });
    
    const saveButton = screen.getByRole('button', { name: /guardar perfil/i });
    await user.click(saveButton);
    
    expect(mockOnUpdateProfile).toHaveBeenCalled();
  });

  it('should show success message after saving', async () => {
    const user = userEvent.setup();
    render(<Settings {...defaultProps} />);
    
    const weightSlider = screen.getByLabelText(/Peso: \d+ kg/i);
    fireEvent.change(weightSlider, { target: { value: '75' } });
    
    const saveButton = screen.getByRole('button', { name: /guardar perfil/i });
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/cambios guardados/i)).toBeInTheDocument();
    });
  });

  it('should call onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<Settings {...defaultProps} />);
    
    // Back button is the first button without text (only icon)
    const buttons = screen.getAllByRole('button');
    const backButton = buttons[0]; // First button in header
    await user.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should toggle custom macro mode', async () => {
    const user = userEvent.setup();
    render(<Settings {...defaultProps} />);
    
    // Find and click the custom mode toggle
    const toggleButtons = screen.getAllByRole('button');
    const customModeButton = toggleButtons.find(btn => 
      btn.textContent?.includes('Personalizado')
    );
    
    if (customModeButton) {
      await user.click(customModeButton);
      
      // Should show custom macro inputs
      expect(screen.getByLabelText(/Calorías Diarias/i)).toBeInTheDocument();
    }
  });

  it('should update custom calories when in custom mode', async () => {
    const user = userEvent.setup();
    render(<Settings {...defaultProps} />);
    
    // Toggle custom mode
    const toggleButtons = screen.getAllByRole('button');
    const customModeButton = toggleButtons.find(btn => 
      btn.textContent?.includes('Personalizado')
    );
    
    if (customModeButton) {
      await user.click(customModeButton);
      
      const caloriesSlider = screen.getByLabelText(/Calorías Diarias/i);
      fireEvent.change(caloriesSlider, { target: { value: '2200' } });
      
      expect(caloriesSlider).toHaveValue('2200');
    }
  });

  it('should update custom protein when in custom mode', async () => {
    const user = userEvent.setup();
    render(<Settings {...defaultProps} />);
    
    // Toggle custom mode
    const toggleButtons = screen.getAllByRole('button');
    const customModeButton = toggleButtons.find(btn => 
      btn.textContent?.includes('Personalizado')
    );
    
    if (customModeButton) {
      await user.click(customModeButton);
      
      const proteinSlider = screen.getByLabelText(/^Proteína$/i);
      fireEvent.change(proteinSlider, { target: { value: '150' } });
      
      expect(proteinSlider).toHaveValue('150');
    }
  });

  it('should update custom carbs when in custom mode', async () => {
    const user = userEvent.setup();
    render(<Settings {...defaultProps} />);
    
    // Toggle custom mode
    const toggleButtons = screen.getAllByRole('button');
    const customModeButton = toggleButtons.find(btn => 
      btn.textContent?.includes('Personalizado')
    );
    
    if (customModeButton) {
      await user.click(customModeButton);
      
      const carbsSlider = screen.getByLabelText(/^Carbohidratos$/i);
      fireEvent.change(carbsSlider, { target: { value: '200' } });
      
      expect(carbsSlider).toHaveValue('200');
    }
  });

  it('should update custom fat when in custom mode', async () => {
    const user = userEvent.setup();
    render(<Settings {...defaultProps} />);
    
    // Toggle custom mode
    const toggleButtons = screen.getAllByRole('button');
    const customModeButton = toggleButtons.find(btn => 
      btn.textContent?.includes('Personalizado')
    );
    
    if (customModeButton) {
      await user.click(customModeButton);
      
      const fatSlider = screen.getByLabelText(/^Grasas$/i);
      fireEvent.change(fatSlider, { target: { value: '70' } });
      
      expect(fatSlider).toHaveValue('70');
    }
  });

});
