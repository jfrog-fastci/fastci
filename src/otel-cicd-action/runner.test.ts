// Import Jest first
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mock all dependencies before importing them
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}));

jest.mock('@actions/github', () => ({
  context: {
    runId: 12345,
    repo: { owner: 'test', repo: 'repo' }
  },
  getOctokit: jest.fn()
}));

jest.mock('@octokit/request-error');

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

// Mock other dependencies
jest.mock('./tracer', () => ({
  createTracerProvider: jest.fn()
}));

jest.mock('./trace/workflow', () => ({
  traceWorkflowRun: jest.fn()
}));

jest.mock('./github', () => ({
  getWorkflowRun: jest.fn(),
  listJobsForWorkflowRun: jest.fn(),
  getJobsAnnotations: jest.fn(),
  getPRsLabels: jest.fn()
}));

// Import dependencies after mocking
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
    (core.getInput as jest.Mock).mockImplementation((name) => {
      const inputs: Record<string, string> = {
        'fastci_otel_endpoint': 'http://otel.example.com',
        'fastci_otel_token': 'token123',
        'otelServiceName': 'test-service',
        'runId': '12345',
        'extra_attributes': 'key1=value1,key2=value2',
        'github_token': 'gh_token123'
      };
      return inputs[name] || '';
    });
    
    // Setup GitHub API mocks
    (getWorkflowRun as jest.Mock).mockResolvedValue(mockWorkflowRun);
    (listJobsForWorkflowRun as jest.Mock).mockResolvedValue(mockJobs);
    (getJobsAnnotations as jest.Mock).mockResolvedValue(mockJobAnnotations);
    (getPRsLabels as jest.Mock).mockResolvedValue(mockPrLabels);
    
    // Setup tracer mocks
    (createTracerProvider as jest.Mock).mockReturnValue(mockProvider);
    (traceWorkflowRun as jest.Mock).mockResolvedValue(mockTraceId);
    
    // Setup fs mocks
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockProcessTrees));
  });

  describe('loadProcessTrees', () => {
    it('should load process trees from file', () => {
      const result = loadProcessTrees();
      
      expect(fs.existsSync).toHaveBeenCalledWith(PROCESS_TREES_PATH);
      expect(fs.readFileSync).toHaveBeenCalledWith(PROCESS_TREES_PATH, 'utf-8');
      expect(result).toEqual(mockProcessTrees);
    });

    it('should return empty array when file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      const result = loadProcessTrees();
      
      expect(result).toEqual([]);
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('does not exist'));
    });

    it('should return empty array when file is empty', () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('');
      
      const result = loadProcessTrees();
      
      expect(result).toEqual([]);
      expect(core.info).toHaveBeenCalledWith('Process trees file is empty');
    });

    it('should return empty array and log error when JSON parsing fails', () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');
      
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
      (getWorkflowRun as jest.Mock).mockRejectedValue(mockError);
      
      await RunCiCdOtelExport();
      
      expect(core.setFailed).toHaveBeenCalledWith(mockError);
    });

    it('should handle RequestError for job annotations', async () => {
      // Create a RequestError
      const mockRequestOptions = {
        headers: { 'x-ratelimit-remaining': '0' },
        request: { 
          method: 'GET', 
          url: 'https://api.github.com/test', 
          headers: { 'accept': 'application/vnd.github.v3+json' } 
        }
      };
      const mockRequestError = new RequestError('API rate limit exceeded', 403, mockRequestOptions as any);
      
      (getJobsAnnotations as jest.Mock).mockRejectedValue(mockRequestError);
      
      await RunCiCdOtelExport();
      
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('Failed to get job annotations'));
      expect(core.setFailed).not.toHaveBeenCalled();
    });

    it('should handle RequestError for PR labels', async () => {
      // Create a RequestError
      const mockRequestOptions = {
        headers: { 'x-ratelimit-remaining': '0' },
        request: { 
          method: 'GET', 
          url: 'https://api.github.com/test', 
          headers: { 'accept': 'application/vnd.github.v3+json' } 
        }
      };
      const mockRequestError = new RequestError('API rate limit exceeded', 403, mockRequestOptions as any);
      
      (getPRsLabels as jest.Mock).mockRejectedValue(mockRequestError);
      
      await RunCiCdOtelExport();
      
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('Failed to get PRs labels'));
      expect(core.setFailed).not.toHaveBeenCalled();
    });
  });
}); 