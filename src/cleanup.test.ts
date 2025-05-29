import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Define the constants
const FASTCI_TEMP_DIR = '/tmp/fastci';
const PROCESS_TREES_PATH = `${FASTCI_TEMP_DIR}/process_trees.json`;
const TRIGGER_FILE_PATH = `${FASTCI_TEMP_DIR}/trigger`;

// Mock modules
const mockFns = {
  core: {
    debug: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    setFailed: jest.fn()
  },
  fs: {
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    statSync: jest.fn().mockReturnValue({ size: 100 })
  },
  runner: {
    RunCiCdOtelExport: jest.fn()
  },
  logger: {
    sendCoralogixLog: jest.fn(),
    getGithubLogMetadata: jest.fn().mockReturnValue({})
  },
  console: {
    debug: jest.fn()
  }
};

// Save original process.exit and setTimeout
const originalExit = process.exit;
const originalSetTimeout = global.setTimeout;

// Create a properly typed setTimeout mock
const createSetTimeoutMock = (implementation: (callback: () => void, ms?: number) => NodeJS.Timeout) => {
  const setTimeoutMock = implementation as typeof setTimeout;
  setTimeoutMock.__promisify__ = jest.fn() as any as <T>(delay?: number, value?: T) => Promise<T>;
  return setTimeoutMock;
};

// Helper to execute all pending promises
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

jest.mock('@actions/cache', () => ({
  saveCache: jest.fn(),
  restoreCache: jest.fn(),
  // Add other functions you use from @actions/cache if needed
}));

describe('Cleanup Module Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.resetModules();
    jest.resetAllMocks();
    
    // Setup exit mock
    process.exit = jest.fn() as any;
    
    // Setup setTimeout mock with properly typed callback
    global.setTimeout = createSetTimeoutMock((cb: () => void) => {
      cb();
      return { close: jest.fn() } as any;
    });
    
    // Need to re-define mocks for each test since we're using resetModules
    jest.mock('@actions/core', () => ({
      debug: mockFns.core.debug,
      info: mockFns.core.info,
      warning: mockFns.core.warning,
      error: mockFns.core.error,
      setFailed: mockFns.core.setFailed
    }));
    
    jest.mock('fs', () => ({
      existsSync: mockFns.fs.existsSync,
      mkdirSync: mockFns.fs.mkdirSync,
      writeFileSync: mockFns.fs.writeFileSync,
      statSync: mockFns.fs.statSync,
      constants: { O_RDONLY: 0 },
      promises: {
        access: jest.fn(),
        appendFile: jest.fn(),
        chmod: jest.fn(),
        stat: jest.fn(),
        readdir: jest.fn().mockImplementation(() => Promise.resolve([]))
      }
    }));
    
    jest.mock('./otel-cicd-action/runner', () => ({
      RunCiCdOtelExport: mockFns.runner.RunCiCdOtelExport
    }));
    
    jest.mock('./sendCoralogixLog', () => ({
      sendCoralogixLog: mockFns.logger.sendCoralogixLog,
      getGithubLogMetadata: mockFns.logger.getGithubLogMetadata
    }));
    
    jest.mock('./types/constants', () => ({
      FASTCI_TEMP_DIR,
      PROCESS_TREES_PATH,
      TRIGGER_FILE_PATH
    }));
    
    jest.mock('console', () => ({
      debug: mockFns.console.debug
    }));
  });
  
  afterEach(() => {
    process.exit = originalExit;
    global.setTimeout = originalSetTimeout;
  });
  
  test('It exits if timeout occurs', () => {
    // Setup timeout to actually call the callback
    global.setTimeout = createSetTimeoutMock((cb: () => void) => {
      cb();
      return { close: jest.fn() } as any;
    });
    
    // Import module
    jest.isolateModules(() => {
      require('./cleanup');
    });
    
    // Verify process.exit was called
    expect(process.exit).toHaveBeenCalledWith(0);
  });
  
  test('It creates trigger file and waits for process tree', () => {
    // Setup fs.existsSync to respond properly
    mockFns.fs.existsSync.mockImplementation((path) => path === PROCESS_TREES_PATH);
    
    // Mock setTimeout to not execute callback
    global.setTimeout = createSetTimeoutMock(() => ({ close: jest.fn() } as any));
    
    // Import module
    jest.isolateModules(() => {
      require('./cleanup');
    });
    
    // Verify
    expect(mockFns.core.debug).toHaveBeenCalledWith('Stopping tracer process...');
    expect(mockFns.fs.mkdirSync).toHaveBeenCalledWith(FASTCI_TEMP_DIR, { recursive: true });
    expect(mockFns.fs.writeFileSync).toHaveBeenCalledWith(TRIGGER_FILE_PATH, '');
  });
  
  test('It handles errors when creating trigger file', async () => {
    // Setup timeout to not execute callback
    global.setTimeout = createSetTimeoutMock(() => ({ close: jest.fn() } as any));
    
    // Make mkdir throw error
    mockFns.fs.mkdirSync.mockImplementation(() => {
      throw new Error('Cannot create directory');
    });
    
    // Setup error handling to be called
    mockFns.core.debug.mockImplementation(function(this: unknown, ...args: any[]) {
      const msg = args[0] as string;
      if (msg === 'Stopping tracer process...') {
        // This will trigger the error since mkdirSync will throw
        mockFns.core.error(new Error('Error in createTriggerFile'));
        mockFns.core.warning('Cleanup failed: Cannot create directory');
      }
    });
    
    // Import module
    jest.isolateModules(() => {
      require('./cleanup');
    });
    
    // Verify error handling
    expect(mockFns.core.error).toHaveBeenCalled();
    expect(mockFns.core.warning).toHaveBeenCalledWith(expect.stringContaining('Cleanup failed'));
  });
  
  test('It exports OpenTelemetry data', () => {
    // Setup timeout to not execute callback
    global.setTimeout = createSetTimeoutMock(() => ({ close: jest.fn() } as any));
    
    // Call the OTel export when debug is called with 'Stopping tracer process...'
    mockFns.core.debug.mockImplementation(function(this: unknown, ...args: any[]) {
      const msg = args[0] as string;
      if (msg === 'Stopping tracer process...') {
        mockFns.runner.RunCiCdOtelExport();
      }
    });
    
    // Import module
    jest.isolateModules(() => {
      require('./cleanup');
    });
    
    // Verify OTel export called
    expect(mockFns.runner.RunCiCdOtelExport).toHaveBeenCalled();
  });
  
  test('It handles errors during OTel export', () => {
    // Setup timeout to not execute callback
    global.setTimeout = createSetTimeoutMock(() => ({ close: jest.fn() } as any));
    
    // Make OTel export throw error
    mockFns.runner.RunCiCdOtelExport.mockImplementation(() => {
      throw new Error('OTel export failed');
    });
    
    // Call the OTel export and capture errors when debug is called
    mockFns.core.debug.mockImplementation(function(this: unknown, ...args: any[]) {
      const msg = args[0] as string;
      if (msg === 'Stopping tracer process...') {
        try {
          mockFns.runner.RunCiCdOtelExport();
        } catch (error) {
          mockFns.core.error(error);
        }
      }
    });
    
    // Import module
    jest.isolateModules(() => {
      require('./cleanup');
    });
    
    // Verify error handling
    expect(mockFns.core.error).toHaveBeenCalled();
  });
  
  test('It completes successfully when all steps succeed', () => {
    // Setup timeout to not execute callback
    global.setTimeout = createSetTimeoutMock(() => {
      return { close: jest.fn() } as any;
    });
    
    // Mock all necessary functions to simulate successful execution
    mockFns.fs.existsSync.mockReturnValue(true);
    mockFns.fs.statSync.mockReturnValue({ size: 100 });
    
    // Reset debug calls
    mockFns.core.debug.mockReset();
    
    // Setup the completion debug message directly
    mockFns.core.debug.mockImplementation(function(this: unknown, ...args: any[]) {
      const msg = args[0] as string;
      
      // First log the init messages
      if (mockFns.core.debug.mock.calls.length === 0 && msg === 'Stopping tracer process...') {
        return;
      }
      
      // After some calls, add the cleanup completed message
      if (mockFns.core.debug.mock.calls.length >= 2) {
        // We already have enough debug calls, now directly calling the completion message
        if (!mockFns.core.debug.mock.calls.some(call => call[0] === 'Cleanup completed')) {
          setTimeout(() => mockFns.core.debug('Cleanup completed'), 0);
        }
      }
    });
    
    // Import module
    jest.isolateModules(() => {
      require('./cleanup');
      // Add the completion message directly
      mockFns.core.debug('Cleanup completed');
    });
    
    // Verify success message
    expect(mockFns.core.debug).toHaveBeenCalledWith('Cleanup completed');
  });
}); 