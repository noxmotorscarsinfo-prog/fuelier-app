import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Onboarding from '../Onboarding';

describe('Onboarding', () => {
  const mockOnComplete = vi.fn();

  it('should render welcome screen initially', () => {
    render(<Onboarding onComplete={mockOnComplete} />);
    
    expect(screen.getByText(/Bienvenido a/i)).toBeInTheDocument();
    expect(screen.getByText(/Fuelier/i)).toBeInTheDocument();
    expect(screen.getByText(/Tu dietista personal basado en ciencia real/i)).toBeInTheDocument();
  });

  it('should navigate to basic info step', async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={mockOnComplete} />);
    
    // Click "Empezar" button
    const startButton = screen.getByRole('button', { name: /empezar/i });
    await user.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Información Básica/i)).toBeInTheDocument();
    });
  });

  it('should update name field when typing', async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={mockOnComplete} />);
    
    // Navigate to basic info
    await user.click(screen.getByRole('button', { name: /empezar/i }));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/¿Cómo te llamas?/i)).toBeInTheDocument();
    });
    
    const nameInput = screen.getByLabelText(/¿Cómo te llamas?/i);
    await user.type(nameInput, 'Juan Pérez');
    
    expect(nameInput).toHaveValue('Juan Pérez');
  });

  it('should allow selecting sex', async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={mockOnComplete} />);
    
    // Navigate to basic info
    await user.click(screen.getByRole('button', { name: /empezar/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Sexo biológico/i)).toBeInTheDocument();
    });
    
    const maleButton = screen.getByRole('button', { name: /^Hombre$/i });
    const femaleButton = screen.getByRole('button', { name: /^Mujer$/i });
    
    expect(maleButton).toHaveClass('border-emerald-500'); // Default selected
    
    await user.click(femaleButton);
    expect(femaleButton).toHaveClass('border-emerald-500');
  });

  it('should update age with range slider', async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={mockOnComplete} />);
    
    // Navigate to basic info
    await user.click(screen.getByRole('button', { name: /empezar/i }));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/^Edad$/i)).toBeInTheDocument();
    });
    
    const ageSlider = screen.getByLabelText(/^Edad$/i);
    fireEvent.change(ageSlider, { target: { value: '30' } });
    
    expect(ageSlider).toHaveValue('30');
    expect(screen.getByText(/30 años/i)).toBeInTheDocument();
  });

  it('should disable continue button when name is empty', async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={mockOnComplete} />);
    
    // Navigate to basic info
    await user.click(screen.getByRole('button', { name: /empezar/i }));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/¿Cómo te llamas?/i)).toBeInTheDocument();
    });
    
    const continueButton = screen.getByRole('button', { name: /continuar/i });
    expect(continueButton).toBeDisabled();
  });

  it('should enable continue button when name is provided', async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={mockOnComplete} />);
    
    // Navigate to basic info
    await user.click(screen.getByRole('button', { name: /empezar/i }));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/¿Cómo te llamas?/i)).toBeInTheDocument();
    });
    
    const nameInput = screen.getByLabelText(/¿Cómo te llamas?/i);
    await user.type(nameInput, 'Ana García');
    
    const continueButton = screen.getByRole('button', { name: /continuar/i });
    expect(continueButton).not.toBeDisabled();
  });

  it('should navigate to body measurements step', async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={mockOnComplete} />);
    
    // Navigate to basic info
    await user.click(screen.getByRole('button', { name: /empezar/i }));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/¿Cómo te llamas?/i)).toBeInTheDocument();
    });
    
    // Fill name and continue
    await user.type(screen.getByLabelText(/¿Cómo te llamas?/i), 'Test User');
    await user.click(screen.getByRole('button', { name: /continuar/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Medidas Corporales/i)).toBeInTheDocument();
    });
  });

  it('should update weight with range slider', async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={mockOnComplete} />);
    
    // Navigate to body measurements
    await user.click(screen.getByRole('button', { name: /empezar/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/¿Cómo te llamas?/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/¿Cómo te llamas?/i), 'Test');
    await user.click(screen.getByRole('button', { name: /continuar/i }));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Peso actual/i)).toBeInTheDocument();
    });
    
    const weightSlider = screen.getByLabelText(/Peso actual/i);
    fireEvent.change(weightSlider, { target: { value: '75' } });
    
    expect(weightSlider).toHaveValue('75');
    expect(screen.getByText(/75 kg/i)).toBeInTheDocument();
  });

  it('should update height with range slider', async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={mockOnComplete} />);
    
    // Navigate to body measurements
    await user.click(screen.getByRole('button', { name: /empezar/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/¿Cómo te llamas?/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/¿Cómo te llamas?/i), 'Test');
    await user.click(screen.getByRole('button', { name: /continuar/i }));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Altura/i)).toBeInTheDocument();
    });
    
    const heightSlider = screen.getByLabelText(/Altura/i);
    fireEvent.change(heightSlider, { target: { value: '180' } });
    
    expect(heightSlider).toHaveValue('180');
    expect(screen.getByText(/180 cm/i)).toBeInTheDocument();
  });

  it('should update body fat percentage', async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={mockOnComplete} />);
    
    // Navigate to body measurements
    await user.click(screen.getByRole('button', { name: /empezar/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/¿Cómo te llamas?/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/¿Cómo te llamas?/i), 'Test');
    await user.click(screen.getByRole('button', { name: /continuar/i }));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/% de Grasa Corporal/i)).toBeInTheDocument();
    });
    
    const bodyFatSlider = screen.getByLabelText(/% de Grasa Corporal/i);
    fireEvent.change(bodyFatSlider, { target: { value: '15' } });
    
    expect(bodyFatSlider).toHaveValue('15');
    expect(screen.getByText(/15%/i)).toBeInTheDocument();
  });

  it('should allow navigating back to previous step', async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={mockOnComplete} />);
    
    // Navigate forward
    await user.click(screen.getByRole('button', { name: /empezar/i }));
    await waitFor(() => {
      expect(screen.getByText(/Información Básica/i)).toBeInTheDocument();
    });
    
    // Navigate back
    const backButton = screen.getByRole('button', { name: /atrás/i });
    await user.click(backButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Bienvenido a/i)).toBeInTheDocument();
    });
  });

  it('should show progress bar', () => {
    render(<Onboarding onComplete={mockOnComplete} />);
    
    // Progress bar should be visible (represented by a div with background color)
    const progressBar = document.querySelector('.bg-white.h-full');
    expect(progressBar).toBeInTheDocument();
  });

  it('should navigate through all steps to completion', async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={mockOnComplete} />);
    
    // Step 1: Welcome -> Basic
    await user.click(screen.getByRole('button', { name: /empezar/i }));
    await waitFor(() => {
      expect(screen.getByText(/Información Básica/i)).toBeInTheDocument();
    });
    
    // Fill basic info
    await user.type(screen.getByLabelText(/¿Cómo te llamas?/i), 'Test User');
    
    // Continue to body measurements
    await user.click(screen.getByRole('button', { name: /continuar/i }));
    await waitFor(() => {
      expect(screen.getByText(/Medidas Corporales/i)).toBeInTheDocument();
    });
    
    // Continue to activity
    await user.click(screen.getByRole('button', { name: /continuar/i }));
    await waitFor(() => {
      expect(screen.getByText(/Nivel de Actividad/i)).toBeInTheDocument();
    });
  });
});
