import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { RequestError } from '@octokit/request-error';
import * as fs from 'fs';
import { ProcessTree } from '../types/process';
import { PROCESS_TREES_PATH } from '../types/constants';
import { RunCiCdOtelExport, loadProcessTrees } from './runner';
import { createTracerProvider } from './tracer';
import { traceWorkflowRun } from './trace/workflow';
import { getJobsAnnotations, getPRsLabels, getWorkflowRun, listJobsForWorkflowRun } from './github';

// Import Jest
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mock dependencies
jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('@octokit/request-error');
jest.mock('fs');
jest.mock('./tracer');
jest.mock('./trace/workflow');
jest.mock('./github');

describe('runner.ts', () => {
  const mockTraceId = '1234567890abcdef';
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
    repository: { full_name: 'test/repo' },
    head_sha: 'abc123',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:10:00Z',
    run_started_at: '2023-01-01T00:01:00Z',
    pull_requests: [{ number: 42 }]
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
  const mockProvider = {
    forceFlush: jest.fn().mockResolvedValue(undefined),
    shutdown: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup core mocks
    (core.getInput as jest.MockedFunction<typeof core.getInput>).mockImplementation((name) => {
      const inputs = {
        'fastci_otel_endpoint': 'http://otel.example.com',
        'fastci_otel_token': 'token123',
        'otelServiceName': 'test-service',
        'runId': '12345',
        'extra_attributes': 'key1=value1,key2=value2',
        'github_token': 'gh_token123'
      };
      return inputs[name] || '';
    });
    
    // Setup context mock
    (context as any).runId = 12345;
    (context as any).repo = { owner: 'test', repo: 'repo' };
    
    // Setup octokit mock
    (getOctokit as jest.MockedFunction<typeof getOctokit>).mockReturnValue({} as any);
    
    // Setup GitHub API mocks
    (getWorkflowRun as jest.MockedFunction<typeof getWorkflowRun>).mockResolvedValue(mockWorkflowRun as any);
    (listJobsForWorkflowRun as jest.MockedFunction<typeof listJobsForWorkflowRun>).mockResolvedValue(mockJobs as any);
    (getJobsAnnotations as jest.MockedFunction<typeof getJobsAnnotations>).mockResolvedValue(mockJobAnnotations as any);
    (getPRsLabels as jest.MockedFunction<typeof getPRsLabels>).mockResolvedValue(mockPrLabels as any);
    
    // Setup tracer mocks
    (createTracerProvider as jest.MockedFunction<typeof createTracerProvider>).mockReturnValue(mockProvider as any);
    (traceWorkflowRun as jest.MockedFunction<typeof traceWorkflowRun>).mockResolvedValue(mockTraceId);
    
    // Setup fs mocks
    (fs.existsSync as jest.MockedFunction<typeof fs.existsSync>).mockReturnValue(true);
    (fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>).mockReturnValue(JSON.stringify(mockProcessTrees));
  });

  describe('loadProcessTrees', () => {
    it('should load process trees from file', () => {
      const result = loadProcessTrees();
      
      expect(fs.existsSync).toHaveBeenCalledWith(PROCESS_TREES_PATH);
      expect(fs.readFileSync).toHaveBeenCalledWith(PROCESS_TREES_PATH, 'utf-8');
      expect(result).toEqual(mockProcessTrees);
    });

    it('should return empty array when file does not exist', () => {
      (fs.existsSync as jest.MockedFunction<typeof fs.existsSync>).mockReturnValue(false);
      
      const result = loadProcessTrees();
      
      expect(result).toEqual([]);
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('does not exist'));
    });

    it('should return empty array when file is empty', () => {
      (fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>).mockReturnValue('');
      
      const result = loadProcessTrees();
      
      expect(result).toEqual([]);
      expect(core.info).toHaveBeenCalledWith('Process trees file is empty');
    });

    it('should return empty array and log error when JSON parsing fails', () => {
      (fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>).mockReturnValue('invalid json');
      
      const result = loadProcessTrees();
      
      expect(result).toEqual([]);
      expect(core.error).toHaveBeenCalledWith(expect.stringContaining('Failed to load process trees'));
    });
  });

  describe('RunCiCdOtelExport', () => {
    it('should run the complete workflow and export traces', async () => {
      await RunCiCdOtelExport();
      
      // Check inputs were read
      expect(core.getInput).toHaveBeenCalledWith('fastci_otel_endpoint');
      expect(core.getInput).toHaveBeenCalledWith('fastci_otel_token');
      expect(core.getInput).toHaveBeenCalledWith('runId');
      
      // Check GitHub API calls
      expect(getOctokit).toHaveBeenCalledWith('gh_token123');
      expect(getWorkflowRun).toHaveBeenCalled();
      expect(listJobsForWorkflowRun).toHaveBeenCalled();
      expect(getJobsAnnotations).toHaveBeenCalled();
      expect(getPRsLabels).toHaveBeenCalled();
      
      // Check tracer provider was created and used
      expect(createTracerProvider).toHaveBeenCalledWith(
        'http://otel.example.com',
        'Authorization=Bearer token123',
        expect.objectContaining({
          'service.name': 'test-service'
        })
      );
      
      // Check workflow was traced
      expect(traceWorkflowRun).toHaveBeenCalledWith(
        expect.any(Array),
        mockWorkflowRun,
        mockJobs,
        mockJobAnnotations,
        mockPrLabels
      );
      
      // Check trace ID was set as output
      expect(core.setOutput).toHaveBeenCalledWith('traceId', mockTraceId);
      
      // Check provider was flushed and shutdown
      expect(mockProvider.forceFlush).toHaveBeenCalled();
      expect(mockProvider.shutdown).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Test error');
      (getWorkflowRun as jest.MockedFunction<typeof getWorkflowRun>).mockRejectedValue(mockError);
      
      await RunCiCdOtelExport();
      
      expect(core.setFailed).toHaveBeenCalledWith(mockError);
    });

    it('should handle RequestError for job annotations', async () => {
      const mockRequestError = new RequestError('API rate limit exceeded', 403, {
        headers: {},
        request: { method: 'GET', url: 'https://api.github.com/test' }
      });
      (getJobsAnnotations as jest.MockedFunction<typeof getJobsAnnotations>).mockRejectedValue(mockRequestError);
      
      await RunCiCdOtelExport();
      
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('Failed to get job annotations'));
      expect(core.setFailed).not.toHaveBeenCalled();
    });

    it('should handle RequestError for PR labels', async () => {
      const mockRequestError = new RequestError('API rate limit exceeded', 403, {
        headers: {},
        request: { method: 'GET', url: 'https://api.github.com/test' }
      });
      (getPRsLabels as jest.MockedFunction<typeof getPRsLabels>).mockRejectedValue(mockRequestError);
      
      await RunCiCdOtelExport();
      
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('Failed to get PRs labels'));
      expect(core.setFailed).not.toHaveBeenCalled();
    });
  });
}); 