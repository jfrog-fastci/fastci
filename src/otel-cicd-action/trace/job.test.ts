import { trace, SpanStatusCode } from '@opentelemetry/api';
import { ProcessTree } from '../../types/process';
import { traceJob, filterProcessesBeforeTime } from './job';
import { traceStep } from './step';
import { traceProcessTrees, associateProcessesWithSteps } from './process';

// Import Jest
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mock dependencies
jest.mock('@opentelemetry/api');
jest.mock('./step');
jest.mock('./process');

describe('job.ts', () => {
  const mockSpan = {
    setStatus: jest.fn(),
    end: jest.fn(),
    addEvent: jest.fn()
  };
  
  const mockTracer = {
    startActiveSpan: jest.fn((_name, _options, fn) => {
      if (typeof fn === 'function') {
        return fn(mockSpan);
      }
      return undefined;
    })
  };
  
  const mockProcessTrees: ProcessTree[] = [
    {
      process: {
        pid: 1,
        ppid: 0,
        command: 'test-command',
        binary_path: '/bin/test',
        args: '-a -b -c',
        started_at: new Date('2023-01-01T00:00:00Z'),
        stopped_at: new Date('2023-01-01T00:05:00Z'),
        exit_code: 0,
        name: 'test-process',
        working_dir: '/workspace',
        environment: { PATH: '/bin' },
        cpu_time: 100,
        memory_usage: 1024,
        is_root_ci_step: true
      },
      file_events: [],
      children: []
    },
    {
      process: {
        pid: 2,
        ppid: 0,
        command: 'later-process',
        binary_path: '/bin/later',
        args: '-x -y -z',
        started_at: new Date('2023-01-01T00:10:00Z'),
        stopped_at: new Date('2023-01-01T00:15:00Z'),
        exit_code: 0,
        name: 'later-process',
        working_dir: '/workspace',
        environment: { PATH: '/bin' },
        cpu_time: 200,
        memory_usage: 2048,
        is_root_ci_step: true
      },
      file_events: [],
      children: []
    }
  ];

  const mockJob = {
    id: 98765,
    name: 'Test Job',
    run_id: 12345,
    run_url: 'https://api.github.com/runs/12345',
    head_sha: 'abc123',
    url: 'https://api.github.com/jobs/98765',
    status: 'completed',
    conclusion: 'success',
    started_at: '2023-01-01T00:05:00Z',
    completed_at: '2023-01-01T00:15:00Z',
    labels: ['ubuntu-latest'],
    runner_id: 1,
    check_run_url: 'https://api.github.com/check-runs/98765',
    steps: [
      {
        name: 'Step 1',
        status: 'completed',
        conclusion: 'success',
        number: 1,
        started_at: '2023-01-01T00:05:00Z',
        completed_at: '2023-01-01T00:10:00Z'
      },
      {
        name: 'Step 2',
        status: 'completed',
        conclusion: 'success',
        number: 2,
        started_at: '2023-01-01T00:10:00Z',
        completed_at: '2023-01-01T00:15:00Z'
      }
    ],
    node_id: 'node1',
    run_attempt: 1
  };

  const mockAnnotations = [
    {
      annotation_level: 'warning',
      message: 'Test warning'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup tracer mock
    (trace.getTracer as jest.MockedFunction<typeof trace.getTracer>).mockReturnValue(mockTracer as any);
    
    // Setup process association mock
    (associateProcessesWithSteps as jest.MockedFunction<typeof associateProcessesWithSteps>).mockReturnValue(
      new Map([[1, [mockProcessTrees[0]]], [2, [mockProcessTrees[1]]]])
    );
  });

  describe('traceJob', () => {
    it('should trace job with steps and processes', async () => {
      await traceJob(mockProcessTrees, mockJob as any, mockAnnotations as any);
      
      // Verify tracer was created
      expect(trace.getTracer).toHaveBeenCalledWith('otel-cicd-action');
      
      // Verify span was created with correct parameters
      expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
        mockJob.name,
        expect.objectContaining({
          attributes: expect.objectContaining({
            'github.job.id': mockJob.id,
            'github.job.name': mockJob.name,
            'github.job.labels': mockJob.labels.join(', ')
          }),
          startTime: new Date(mockJob.started_at)
        }),
        expect.any(Function)
      );
      
      // Verify processes were filtered and associated with steps
      expect(associateProcessesWithSteps).toHaveBeenCalledWith(
        expect.any(Array),
        mockJob.steps
      );
      
      // Verify each step was traced
      expect(traceProcessTrees).toHaveBeenCalledWith(
        expect.any(Array),
        mockJob.steps[0]
      );
      expect(traceStep).toHaveBeenCalledWith(mockJob.steps[0]);
      expect(traceProcessTrees).toHaveBeenCalledWith(
        expect.any(Array),
        mockJob.steps[1]
      );
      expect(traceStep).toHaveBeenCalledWith(mockJob.steps[1]);
      
      // Verify span was ended
      expect(mockSpan.end).toHaveBeenCalledWith(new Date(mockJob.completed_at));
    });

    it('should set span status to ERROR when job conclusion is failure', async () => {
      const failedJob = {
        ...mockJob,
        conclusion: 'failure'
      };
      
      await traceJob(mockProcessTrees, failedJob as any, mockAnnotations as any);
      
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
    });

    it('should set span status to OK when job conclusion is not failure', async () => {
      await traceJob(mockProcessTrees, mockJob as any, mockAnnotations as any);
      
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
    });

    it('should add event for step processes count', async () => {
      // Mock the process map to simulate step processes
      (associateProcessesWithSteps as jest.MockedFunction<typeof associateProcessesWithSteps>).mockReturnValue(
        new Map([
          [1, [mockProcessTrees[0]]],
          [2, [mockProcessTrees[1]]]
        ])
      );
      
      // Override the mockProcessTrees to match the timeframe of the job
      const jobStartTime = new Date(mockJob.started_at);
      
      // Update the first process to start after the job starts
      const updatedProcessTrees = [
        {
          ...mockProcessTrees[0],
          process: {
            ...mockProcessTrees[0].process,
            started_at: new Date(jobStartTime.getTime() + 1000) // 1 second after job start
          }
        },
        mockProcessTrees[1]
      ];
      
      await traceJob(updatedProcessTrees, mockJob as any, mockAnnotations as any);
      
      // Verify the addEvent was called for step processes
      expect(mockSpan.addEvent).toHaveBeenCalledWith(
        'step.processes.count',
        expect.objectContaining({
          step: expect.any(Number),
          name: expect.any(String),
          count: expect.any(Number)
        })
      );
    });
  });

  describe('filterProcessesBeforeTime', () => {
    it('should filter out processes that started before a given time', () => {
      const cutoffTime = new Date('2023-01-01T00:01:00Z');
      const testTrees = [...mockProcessTrees]; // Make a copy
      const result = filterProcessesBeforeTime(testTrees, cutoffTime);
      
      // Only the first process started before 2023-01-01T00:01:00Z
      expect(result).toHaveLength(1);
      expect(result[0].process.pid).toBe(1);
      
      // Original array should now only contain the second process
      expect(testTrees).toHaveLength(1);
      expect(testTrees[0].process.pid).toBe(2);
    });

    it('should return empty array when no processes started before the given time', () => {
      const cutoffTime = new Date('2022-12-31T00:00:00Z'); // Before all processes
      const testTrees = [...mockProcessTrees]; // Make a copy
      const result = filterProcessesBeforeTime(testTrees, cutoffTime);
      
      // No processes started before 2022-12-31
      expect(result).toHaveLength(0);
      
      // Original array should be unchanged
      expect(testTrees).toHaveLength(2);
    });

    it('should return all processes when all started before the given time', () => {
      const cutoffTime = new Date('2023-01-01T00:20:00Z'); // After all processes
      const testTrees = [...mockProcessTrees]; // Make a copy
      const result = filterProcessesBeforeTime(testTrees, cutoffTime);
      
      // Both processes started before 2023-01-01T00:20:00Z
      expect(result).toHaveLength(2);
      
      // Original array should now be empty
      expect(testTrees).toHaveLength(0);
    });
  });
}); 