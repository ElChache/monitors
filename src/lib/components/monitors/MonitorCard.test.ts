// MonitorCard Component Unit Tests
// Comprehensive testing for monitor card UI component

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import MonitorCard from './MonitorCard.svelte';
import type { Monitor, MonitorEvaluation } from '$lib/types/monitor';

// Mock Lucide icons
vi.mock('lucide-svelte', () => ({
  Play: 'div',
  Pause: 'div',
  Edit: 'div',
  Trash2: 'div',
  RefreshCw: 'div',
  Calendar: 'div',
  Clock: 'div',
  TrendingUp: 'div',
  Activity: 'div'
}));

describe('MonitorCard Component', () => {
  // Mock data setup
  const mockLastEvaluation: MonitorEvaluation = {
    id: 'eval-1',
    monitorId: 'monitor-1',
    evaluationResult: true,
    stateChanged: false,
    evaluatedAt: new Date('2024-01-15T10:30:00Z'),
    createdAt: new Date('2024-01-15T10:30:00Z')
  };

  const mockCurrentStateMonitor: Monitor = {
    id: 'monitor-1',
    userId: 'user-1',
    name: 'Tesla Stock Price Monitor',
    description: 'Track Tesla stock price movements',
    naturalLanguagePrompt: 'Monitor Tesla stock when it goes below $200',
    monitorType: 'CURRENT_STATE',
    isActive: true,
    evaluationFrequencyMins: 15,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    facts: [
      {
        id: 'fact-1',
        monitorId: 'monitor-1',
        factName: 'tesla_stock_price',
        factPrompt: 'Current Tesla stock price',
        createdAt: new Date('2024-01-01T00:00:00Z')
      },
      {
        id: 'fact-2',
        monitorId: 'monitor-1',
        factName: 'market_status',
        factPrompt: 'Market open status',
        createdAt: new Date('2024-01-01T00:00:00Z')
      }
    ],
    lastEvaluation: mockLastEvaluation
  };

  const mockHistoricalChangeMonitor: Monitor = {
    ...mockCurrentStateMonitor,
    id: 'monitor-2',
    name: 'Tesla Stock Drop Monitor',
    naturalLanguagePrompt: 'Monitor Tesla stock when it drops more than 10%',
    monitorType: 'HISTORICAL_CHANGE',
    facts: [
      {
        id: 'fact-3',
        monitorId: 'monitor-2',
        factName: 'tesla_stock_change',
        factPrompt: 'Tesla stock percentage change',
        createdAt: new Date('2024-01-01T00:00:00Z')
      }
    ]
  };

  const mockInactiveMonitor: Monitor = {
    ...mockCurrentStateMonitor,
    id: 'monitor-3',
    name: 'Inactive Monitor',
    isActive: false,
    lastEvaluation: {
      ...mockLastEvaluation,
      evaluationResult: false
    }
  };

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleActive: vi.fn(),
    onEvaluateNow: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.confirm for delete tests
    global.confirm = vi.fn();
  });

  describe('Rendering Tests', () => {
    it('should render current state monitor correctly', () => {
      render(MonitorCard, {
        props: { monitor: mockCurrentStateMonitor }
      });

      expect(screen.getByText('Tesla Stock Price Monitor')).toBeInTheDocument();
      expect(screen.getByText('Current State')).toBeInTheDocument();
      expect(screen.getByText('Track Tesla stock price movements')).toBeInTheDocument();
      expect(screen.getByText('Monitor Tesla stock when it goes below $200')).toBeInTheDocument();
      expect(screen.getByText('Every 15min')).toBeInTheDocument();
      expect(screen.getByText('2 facts')).toBeInTheDocument();
    });

    it('should render historical change monitor correctly', () => {
      render(MonitorCard, {
        props: { monitor: mockHistoricalChangeMonitor }
      });

      expect(screen.getByText('Historical Change')).toBeInTheDocument();
      expect(screen.getByText('1 fact')).toBeInTheDocument();
    });

    it('should render monitor without description in compact mode', () => {
      render(MonitorCard, {
        props: { 
          monitor: mockCurrentStateMonitor,
          compact: true
        }
      });

      expect(screen.getByText('Tesla Stock Price Monitor')).toBeInTheDocument();
      expect(screen.queryByText('Track Tesla stock price movements')).not.toBeInTheDocument();
      expect(screen.queryByText('Monitor Tesla stock when it goes below $200')).not.toBeInTheDocument();
    });

    it('should render fact tags when 3 or fewer facts', () => {
      render(MonitorCard, {
        props: { monitor: mockCurrentStateMonitor }
      });

      expect(screen.getByText('tesla_stock_price')).toBeInTheDocument();
      expect(screen.getByText('market_status')).toBeInTheDocument();
    });

    it('should not render fact tags when more than 3 facts', () => {
      const monitorWithManyFacts = {
        ...mockCurrentStateMonitor,
        facts: [
          ...mockCurrentStateMonitor.facts!,
          { id: 'fact-3', monitorId: 'monitor-1', factName: 'fact3', factPrompt: 'prompt', createdAt: new Date() },
          { id: 'fact-4', monitorId: 'monitor-1', factName: 'fact4', factPrompt: 'prompt', createdAt: new Date() }
        ]
      };

      render(MonitorCard, {
        props: { monitor: monitorWithManyFacts }
      });

      expect(screen.getByText('4 facts')).toBeInTheDocument();
      expect(screen.queryByText('tesla_stock_price')).not.toBeInTheDocument();
    });
  });

  describe('Status Indicator Tests', () => {
    it('should show correct status for active monitor with positive evaluation', () => {
      render(MonitorCard, {
        props: { monitor: mockCurrentStateMonitor }
      });

      expect(screen.getByText('Condition met')).toBeInTheDocument();
      const statusIndicator = screen.getByText('Condition met').closest('.status-indicator');
      expect(statusIndicator).toHaveClass('success');
    });

    it('should show correct status for active monitor with negative evaluation', () => {
      const monitorWithNegativeEval = {
        ...mockCurrentStateMonitor,
        lastEvaluation: {
          ...mockLastEvaluation,
          evaluationResult: false
        }
      };

      render(MonitorCard, {
        props: { monitor: monitorWithNegativeEval }
      });

      expect(screen.getByText('Monitoring')).toBeInTheDocument();
      const statusIndicator = screen.getByText('Monitoring').closest('.status-indicator');
      expect(statusIndicator).toHaveClass('neutral');
    });

    it('should show correct status for inactive monitor', () => {
      render(MonitorCard, {
        props: { monitor: mockInactiveMonitor }
      });

      expect(screen.getByText('Inactive')).toBeInTheDocument();
      const statusIndicator = screen.getByText('Inactive').closest('.status-indicator');
      expect(statusIndicator).toHaveClass('inactive');
    });

    it('should show never evaluated status for monitor without evaluations', () => {
      const { lastEvaluation, ...monitorWithoutEval } = mockCurrentStateMonitor;

      render(MonitorCard, {
        props: { monitor: monitorWithoutEval }
      });

      expect(screen.getByText('Never evaluated')).toBeInTheDocument();
    });
  });

  describe('CSS Classes Tests', () => {
    it('should apply correct CSS classes for current state monitor', () => {
      const { container } = render(MonitorCard, {
        props: { monitor: mockCurrentStateMonitor }
      });

      const card = container.querySelector('.monitor-card');
      expect(card).toHaveClass('current-state');
      expect(card).toHaveClass('active');
      expect(card).not.toHaveClass('historical-change');
      expect(card).not.toHaveClass('inactive');
    });

    it('should apply correct CSS classes for historical change monitor', () => {
      const { container } = render(MonitorCard, {
        props: { monitor: mockHistoricalChangeMonitor }
      });

      const card = container.querySelector('.monitor-card');
      expect(card).toHaveClass('historical-change');
      expect(card).not.toHaveClass('current-state');
    });

    it('should apply compact class when compact prop is true', () => {
      const { container } = render(MonitorCard, {
        props: { 
          monitor: mockCurrentStateMonitor,
          compact: true
        }
      });

      const card = container.querySelector('.monitor-card');
      expect(card).toHaveClass('compact');
    });

    it('should apply has-activity class for recent evaluations', () => {
      const recentEvaluation = {
        ...mockLastEvaluation,
        createdAt: new Date() // Very recent
      };

      const monitorWithRecentActivity = {
        ...mockCurrentStateMonitor,
        lastEvaluation: recentEvaluation
      };

      const { container } = render(MonitorCard, {
        props: { monitor: monitorWithRecentActivity }
      });

      const card = container.querySelector('.monitor-card');
      expect(card).toHaveClass('has-activity');
    });
  });

  describe('Action Button Tests', () => {
    it('should render edit button when onEdit handler provided', () => {
      render(MonitorCard, {
        props: { 
          monitor: mockCurrentStateMonitor,
          onEdit: mockHandlers.onEdit
        }
      });

      const editButton = screen.getByTitle('Edit monitor');
      expect(editButton).toBeInTheDocument();
    });

    it('should call onEdit handler when edit button clicked', async () => {
      render(MonitorCard, {
        props: { 
          monitor: mockCurrentStateMonitor,
          onEdit: mockHandlers.onEdit
        }
      });

      const editButton = screen.getByTitle('Edit monitor');
      await fireEvent.click(editButton);

      expect(mockHandlers.onEdit).toHaveBeenCalledOnce();
      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockCurrentStateMonitor);
    });

    it('should render delete button when onDelete handler provided', () => {
      render(MonitorCard, {
        props: { 
          monitor: mockCurrentStateMonitor,
          onDelete: mockHandlers.onDelete
        }
      });

      const deleteButton = screen.getByTitle('Delete monitor');
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveClass('danger');
    });

    it('should call onDelete handler when delete confirmed', async () => {
      vi.mocked(global.confirm).mockReturnValue(true);

      render(MonitorCard, {
        props: { 
          monitor: mockCurrentStateMonitor,
          onDelete: mockHandlers.onDelete
        }
      });

      const deleteButton = screen.getByTitle('Delete monitor');
      await fireEvent.click(deleteButton);

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete "Tesla Stock Price Monitor"?');
      expect(mockHandlers.onDelete).toHaveBeenCalledOnce();
      expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockCurrentStateMonitor);
    });

    it('should not call onDelete handler when delete cancelled', async () => {
      vi.mocked(global.confirm).mockReturnValue(false);

      render(MonitorCard, {
        props: { 
          monitor: mockCurrentStateMonitor,
          onDelete: mockHandlers.onDelete
        }
      });

      const deleteButton = screen.getByTitle('Delete monitor');
      await fireEvent.click(deleteButton);

      expect(global.confirm).toHaveBeenCalled();
      expect(mockHandlers.onDelete).not.toHaveBeenCalled();
    });

    it('should render toggle active button with correct icon for active monitor', () => {
      render(MonitorCard, {
        props: { 
          monitor: mockCurrentStateMonitor,
          onToggleActive: mockHandlers.onToggleActive
        }
      });

      const toggleButton = screen.getByTitle('Pause monitor');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should render toggle active button with correct icon for inactive monitor', () => {
      render(MonitorCard, {
        props: { 
          monitor: mockInactiveMonitor,
          onToggleActive: mockHandlers.onToggleActive
        }
      });

      const toggleButton = screen.getByTitle('Activate monitor');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should call onToggleActive handler when toggle button clicked', async () => {
      render(MonitorCard, {
        props: { 
          monitor: mockCurrentStateMonitor,
          onToggleActive: mockHandlers.onToggleActive
        }
      });

      const toggleButton = screen.getByTitle('Pause monitor');
      await fireEvent.click(toggleButton);

      expect(mockHandlers.onToggleActive).toHaveBeenCalledOnce();
      expect(mockHandlers.onToggleActive).toHaveBeenCalledWith(mockCurrentStateMonitor);
    });

    it('should render evaluate now button when handler provided', () => {
      render(MonitorCard, {
        props: { 
          monitor: mockCurrentStateMonitor,
          onEvaluateNow: mockHandlers.onEvaluateNow
        }
      });

      const evaluateButton = screen.getByTitle('Evaluate now');
      expect(evaluateButton).toBeInTheDocument();
    });

    it('should disable evaluate now button for inactive monitor', () => {
      render(MonitorCard, {
        props: { 
          monitor: mockInactiveMonitor,
          onEvaluateNow: mockHandlers.onEvaluateNow
        }
      });

      const evaluateButton = screen.getByTitle('Evaluate now');
      expect(evaluateButton).toBeDisabled();
    });

    it('should call onEvaluateNow handler when evaluate button clicked', async () => {
      render(MonitorCard, {
        props: { 
          monitor: mockCurrentStateMonitor,
          onEvaluateNow: mockHandlers.onEvaluateNow
        }
      });

      const evaluateButton = screen.getByTitle('Evaluate now');
      await fireEvent.click(evaluateButton);

      expect(mockHandlers.onEvaluateNow).toHaveBeenCalledOnce();
      expect(mockHandlers.onEvaluateNow).toHaveBeenCalledWith(mockCurrentStateMonitor);
    });
  });

  describe('Date Formatting Tests', () => {
    it('should format dates correctly', () => {
      render(MonitorCard, {
        props: { monitor: mockCurrentStateMonitor }
      });

      // Check that the last evaluation date is displayed
      expect(screen.getByText(/Last:/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
    });

    it('should not show last evaluation date when no evaluation exists', () => {
      const { lastEvaluation, ...monitorWithoutEval } = mockCurrentStateMonitor;

      render(MonitorCard, {
        props: { monitor: monitorWithoutEval }
      });

      expect(screen.queryByText(/Last:/)).not.toBeInTheDocument();
    });
  });

  describe('Facts Display Tests', () => {
    it('should display singular fact count correctly', () => {
      const monitorWithOneFact = {
        ...mockCurrentStateMonitor,
        facts: [mockCurrentStateMonitor.facts![0]]
      };

      render(MonitorCard, {
        props: { monitor: monitorWithOneFact }
      });

      expect(screen.getByText('1 fact')).toBeInTheDocument();
    });

    it('should display plural fact count correctly', () => {
      render(MonitorCard, {
        props: { monitor: mockCurrentStateMonitor }
      });

      expect(screen.getByText('2 facts')).toBeInTheDocument();
    });

    it('should handle monitor without facts', () => {
      const monitorWithoutFacts = {
        ...mockCurrentStateMonitor,
        facts: []
      };

      render(MonitorCard, {
        props: { monitor: monitorWithoutFacts }
      });

      expect(screen.getByText('0 facts')).toBeInTheDocument();
    });

    it('should handle monitor with undefined facts', () => {
      const { facts, ...monitorWithUndefinedFacts } = mockCurrentStateMonitor;

      const { container } = render(MonitorCard, {
        props: { monitor: monitorWithUndefinedFacts }
      });

      // Should not crash and should not display facts section
      expect(container.querySelector('.facts-summary')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA labels and titles for buttons', () => {
      render(MonitorCard, {
        props: { 
          monitor: mockCurrentStateMonitor,
          ...mockHandlers
        }
      });

      expect(screen.getByTitle('Edit monitor')).toBeInTheDocument();
      expect(screen.getByTitle('Delete monitor')).toBeInTheDocument();
      expect(screen.getByTitle('Pause monitor')).toBeInTheDocument();
      expect(screen.getByTitle('Evaluate now')).toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
      render(MonitorCard, {
        props: { monitor: mockCurrentStateMonitor }
      });

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Tesla Stock Price Monitor');
    });

    it('should render buttons as actual button elements', () => {
      render(MonitorCard, {
        props: { 
          monitor: mockCurrentStateMonitor,
          onEdit: mockHandlers.onEdit
        }
      });

      const editButton = screen.getByTitle('Edit monitor');
      expect(editButton.tagName).toBe('BUTTON');
    });
  });

  describe('Edge Cases', () => {
    it('should handle monitor with very long name', () => {
      const monitorWithLongName = {
        ...mockCurrentStateMonitor,
        name: 'A'.repeat(200)
      };

      render(MonitorCard, {
        props: { monitor: monitorWithLongName }
      });

      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
    });

    it('should handle monitor with very long prompt', () => {
      const monitorWithLongPrompt = {
        ...mockCurrentStateMonitor,
        naturalLanguagePrompt: 'Monitor Tesla stock '.repeat(50)
      };

      render(MonitorCard, {
        props: { monitor: monitorWithLongPrompt }
      });

      expect(screen.getByText('Monitor Tesla stock '.repeat(50))).toBeInTheDocument();
    });

    it('should handle monitor with zero frequency', () => {
      const monitorWithZeroFreq = {
        ...mockCurrentStateMonitor,
        evaluationFrequencyMins: 0
      };

      render(MonitorCard, {
        props: { monitor: monitorWithZeroFreq }
      });

      expect(screen.getByText('Every 0min')).toBeInTheDocument();
    });

    it('should handle monitor with high frequency', () => {
      const monitorWithHighFreq = {
        ...mockCurrentStateMonitor,
        evaluationFrequencyMins: 1440 // 24 hours
      };

      render(MonitorCard, {
        props: { monitor: monitorWithHighFreq }
      });

      expect(screen.getByText('Every 1440min')).toBeInTheDocument();
    });
  });
});