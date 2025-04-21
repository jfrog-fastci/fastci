import { trace, SpanStatusCode } from '@opentelemetry/api';
import { traceStep } from './step';

// Import Jest
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mock dependencies
jest.mock('@opentelemetry/api');

describe('step.ts', () => {
  const mockSpan = {
    setStatus: jest.fn(),
    end: jest.fn()
  };
  
  const mockTracer = {
    startActiveSpan: jest.fn().mockImplementation((name, options, fn) => {
      return fn(mockSpan);
    })
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup tracer mock
    (trace.getTracer as jest.MockedFunction<typeof trace.getTracer>).mockReturnValue(mockTracer as any);
  });

  it('should trace step with success conclusion', async () => {
    const step = {
      name: 'Test Step',
      status: 'completed',
      conclusion: 'success',
      number: 1,
      started_at: '2023-01-01T00:00:00Z',
      completed_at: '2023-01-01T00:05:00Z'
    };
    
    await traceStep(step as any);
    
    // Verify tracer was created
    expect(trace.getTracer).toHaveBeenCalledWith('otel-cicd-action');
    
    // Verify span was created with correct parameters
    expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
      step.name,
      expect.objectContaining({
        attributes: expect.objectContaining({
          'github.job.step.name': step.name,
          'github.job.step.number': step.number,
          'github.job.step.conclusion': step.conclusion
        }),
        startTime: new Date(step.started_at)
      }),
      expect.any(Function)
    );
    
    // Verify span status set to OK
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
    
    // Verify span was ended
    expect(mockSpan.end).toHaveBeenCalledWith(new Date(step.completed_at));
  });

  it('should trace step with failure conclusion', async () => {
    const step = {
      name: 'Failed Step',
      status: 'completed',
      conclusion: 'failure',
      number: 2,
      started_at: '2023-01-01T00:05:00Z',
      completed_at: '2023-01-01T00:10:00Z'
    };
    
    await traceStep(step as any);
    
    // Verify span status set to ERROR
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
    
    // Verify error attribute is set
    expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
      step.name,
      expect.objectContaining({
        attributes: expect.objectContaining({
          'error': true
        })
      }),
      expect.any(Function)
    );
  });

  it('should handle cancelled steps', async () => {
    const step = {
      name: 'Cancelled Step',
      status: 'completed',
      conclusion: 'cancelled',
      number: 3,
      started_at: '2023-01-01T00:10:00Z',
      completed_at: null
    };
    
    await traceStep(step as any);
    
    // For cancelled steps, completed_at is set to started_at
    expect(mockSpan.end).toHaveBeenCalledWith(new Date(step.started_at));
  });

  it('should handle skipped steps', async () => {
    const step = {
      name: 'Skipped Step',
      status: 'completed',
      conclusion: 'skipped',
      number: 4,
      started_at: '2023-01-01T00:15:00Z',
      completed_at: null
    };
    
    await traceStep(step as any);
    
    // For skipped steps, completed_at is set to started_at
    expect(mockSpan.end).toHaveBeenCalledWith(new Date(step.started_at));
  });

  it('should handle uncompleted steps', async () => {
    const step = {
      name: 'Running Step',
      status: 'in_progress',
      conclusion: null,
      number: 5,
      started_at: '2023-01-01T00:20:00Z',
      completed_at: null
    };
    
    // Mock current date
    const mockDate = new Date('2023-01-01T00:25:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
    
    await traceStep(step as any);
    
    // For uncompleted steps, completed_at is set to current time
    expect(mockSpan.end).toHaveBeenCalledWith(mockDate);
    
    // Restore Date
    (global.Date as any).mockRestore();
  });
}); 