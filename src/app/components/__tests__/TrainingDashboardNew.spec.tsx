import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as api from '../../utils/api';
import { TrainingDashboardNew } from '../TrainingDashboardNew';

vi.mock('../../utils/api');

const mockedApi = api as unknown as jest.Mocked<typeof api>;

describe('TrainingDashboardNew component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('handles null dayPlanIndex from API and shows Start button for next day', async () => {
    mockedApi.getCompletedWorkouts = vi.fn().mockResolvedValue([
      {
        date: '2026-01-10',
        dayPlanIndex: null,
        dayPlanName: 'Día 1'
      }
    ] as any);

    const weekPlan = [
      {
        dayName: 'Día 1',
        exercises: []
      }
    ];

    render(<TrainingDashboardNew user={{ email: 'prueba222@gmail.com' }} trainingDays={1} weekPlan={weekPlan} />);

    // Wait for the component to fetch and render the Start button
    await waitFor(() => {
      expect(screen.queryByText(/Iniciar Entrenamiento/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});