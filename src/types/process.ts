export interface ProcessTree {
    process: ProcessState;
    file_events: FileEvent[];
    children: ProcessTree[];
}

export interface ProcessState {
    // Process identification
    pid: number;
    ppid: number;
    command: string;
    binary_path: string;
    args: string;

    // Process timing
    started_at: Date;
    stopped_at: Date | null; // Nullable for running processes
    exit_code: number | null; // Nullable, only valid when process is stopped

    // Process details from enricher
    name: string;
    working_dir: string;
    environment: Record<string, string>;

    // Resource usage
    cpu_time: number; // Using number for time.Duration
    memory_usage: number; // Using number for uint64
    is_root_ci_step: boolean;
}

export type FileEventType = 'read' | 'write' | 'delete' | 'create' | 'modify' | 'rename' | 'chmod' | 'chown';

export interface FileEvent {
    timestamp: Date;
    file_path: string;
    pid: number;
    mode: FileEventType;
    sha256: string;
    size: number;
    uid: number;
    gid: number;
    permissions: string;
}