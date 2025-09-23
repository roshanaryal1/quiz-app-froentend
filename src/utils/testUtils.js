// Test utilities for consistent testing across components
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

// Mock user data
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'PLAYER',
  firstName: 'Test',
  lastName: 'User'
};

export const mockAdmin = {
  ...mockUser,
  id: 2,
  username: 'admin',
  email: 'admin@example.com',
  role: 'ADMIN'
};

// Mock auth context
export const mockAuthContext = {
  isAuthenticated: true,
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  isLoading: false,
  error: null
};

// Wrapper component for tests that need routing and auth
export const TestWrapper = ({ children, authValue = mockAuthContext }) => (
  <BrowserRouter>
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  </BrowserRouter>
);

// Custom render function with providers
export const renderWithProviders = (ui, options = {}) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper authValue={options.authValue}>
        {children}
      </TestWrapper>
    ),
    ...options
  });
};

// Mock API responses
export const mockTournament = {
  id: 1,
  name: 'Test Tournament',
  category: 'Science',
  difficulty: 'medium',
  startDate: '2024-01-01T10:00:00Z',
  endDate: '2024-01-31T10:00:00Z',
  minimumPassingScore: 70,
  participantCount: 5,
  likesCount: 3
};

export const mockApiResponse = (data, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data });
    }, delay);
  });
};

export const mockApiError = (message = 'API Error', status = 500) => {
  const error = new Error(message);
  error.response = { status, data: { message } };
  return Promise.reject(error);
};

// Helper functions for common test scenarios
export const fillForm = async (fields) => {
  for (const [name, value] of Object.entries(fields)) {
    const input = screen.getByLabelText(new RegExp(name, 'i'));
    fireEvent.change(input, { target: { value } });
  }
};

export const submitForm = async () => {
  const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
  fireEvent.click(submitButton);
  await waitFor(() => {
    expect(submitButton).toBeEnabled();
  });
};
