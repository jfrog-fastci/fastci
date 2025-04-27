import { context, trace, SpanStatusCode } from '@opentelemetry/api';
import { ProcessTree } from '../../types/process';
import { traceWorkflowRun } from './workflow';
import { traceJob } from './job';
import * as core from '@actions/core';

// Import Jest
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mock dependencies
jest.mock('@opentelemetry/api');
jest.mock('./job');
jest.mock('@actions/core');
// Mock sendCoralogixLog module
jest.mock('../../sendCoralogixLog', () => ({
  sendTraceWorkflowRunLog: jest.fn().mockResolvedValue({}),
  sendCoralogixLog: jest.fn().mockResolvedValue({})
}));

describe('workflow.ts', () => {
  const mockSpanContext = { traceId: '1234567890abcdef', spanId: 'span1', traceFlags: 1 };
  const mockSpan = {
    setStatus: jest.fn(),
    end: jest.fn(),
    addEvent: jest.fn(),
    spanContext: jest.fn().mockReturnValue(mockSpanContext)
  };
  const mockQueuedSpan = {
    end: jest.fn()
  };
  const mockTracer = {
    startActiveSpan: jest.fn().mockImplementation((name, options, fn) => {
      return fn(mockSpan);
    }),
    startSpan: jest.fn().mockReturnValue(mockQueuedSpan)
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
    }
  ];

  const mockWorkflowRun = {
    id: 12345,
    workflow_id: 67890,
    run_number: 1,
    run_attempt: 1,
    name: 'Test Workflow',
    event: 'push',
    status: 'completed',
    conclusion: 'success',
    repository: { full_name: 'test/repo' },
    head_sha: 'abc123',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:10:00Z',
    run_started_at: '2023-01-01T00:01:00Z',
    html_url: 'https://github.com/test/repo/actions/runs/12345',
    pull_requests: [{ number: 42, head: { ref: 'feature', sha: 'sha456', repo: { id: 1, url: 'url', name: 'repo' } }, base: { ref: 'main', sha: 'sha123', repo: { id: 1, url: 'url', name: 'repo' } } }],
    head_commit: {
      id: 'abc123',
      tree_id: 'tree123',
      author: { name: 'Author', email: 'author@example.com' },
      committer: { name: 'Committer', email: 'committer@example.com' },
      message: 'Test commit',
      timestamp: '2023-01-01T00:00:00Z'
    }
  };

  const mockJobs = [
    {
      id: 98765,
      name: 'Test Job',
      run_id: 12345,
      run_url: 'https://api.github.com/runs/12345',
      head_sha: 'abc123',
      url: 'https://api.github.com/jobs/98765',
      status: 'completed',
      conclusion: 'success',
      started_at: '2023-01-01T00:01:00Z',
      completed_at: '2023-01-01T00:05:00Z',
      labels: ['ubuntu-latest'],
      runner_id: 1,
      check_run_url: 'https://api.github.com/check-runs/98765',
      steps: [],
      node_id: 'node1',
      run_attempt: 1
    }
  ];

  const mockJobAnnotations = { 98765: [] };
  const mockPrLabels = { 42: ['bug', 'feature'] };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup tracer mock
    (trace.getTracer as jest.MockedFunction<typeof trace.getTracer>).mockReturnValue(mockTracer as any);
    
    // Setup context mock
    (context.active as jest.MockedFunction<typeof context.active>).mockReturnValue({} as any);
  });

  it('should trace workflow run and return trace ID', async () => {
    const traceId = await traceWorkflowRun(
      mockProcessTrees,
      mockWorkflowRun as any,
      mockJobs as any,
      mockJobAnnotations,
      mockPrLabels
    );
    
    // Verify tracer was created
    expect(trace.getTracer).toHaveBeenCalledWith('otel-cicd-action');
    
    // Verify span was created with correct parameters
    expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
      mockWorkflowRun.name,
      expect.objectContaining({
        attributes: expect.objectContaining({
          'github.workflow_id': mockWorkflowRun.workflow_id,
          'github.run_id': mockWorkflowRun.id,
          'github.event': mockWorkflowRun.event
        }),
        root: true,
        startTime: new Date(mockWorkflowRun.run_started_at)
      }),
      expect.any(Function)
    );
    
    // Verify queued span was created
    expect(mockTracer.startSpan).toHaveBeenCalledWith(
      'Queued',
      expect.objectContaining({
        startTime: new Date(mockWorkflowRun.run_started_at)
      }),
      expect.any(Object)
    );
    
    // Verify each job was traced
    expect(traceJob).toHaveBeenCalledWith(
      mockProcessTrees,
      mockJobs[0],
      mockJobAnnotations[mockJobs[0].id]
    );
    
    // Verify span was ended
    expect(mockSpan.end).toHaveBeenCalledWith(new Date(mockWorkflowRun.updated_at));
    
    // Verify trace ID was returned
    expect(traceId).toEqual(mockSpanContext.traceId);
  });

  it('should set span status to ERROR when workflow conclusion is failure', async () => {
    const failedWorkflowRun = {
      ...mockWorkflowRun,
      conclusion: 'failure'
    };
    
    await traceWorkflowRun(
      mockProcessTrees,
      failedWorkflowRun as any,
      mockJobs as any,
      mockJobAnnotations,
      mockPrLabels
    );
    
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
  });

  it('should set span status to OK when workflow conclusion is not failure', async () => {
    await traceWorkflowRun(
      mockProcessTrees,
      mockWorkflowRun as any,
      mockJobs as any,
      mockJobAnnotations,
      mockPrLabels
    );
    
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
  });

  it('should log each job being traced', async () => {
    await traceWorkflowRun(
      mockProcessTrees,
      mockWorkflowRun as any,
      mockJobs as any,
      mockJobAnnotations,
      mockPrLabels
    );
    
    expect(core.debug).toHaveBeenCalledWith(`Tracing job ${mockJobs[0].name}`);
  });
}); 