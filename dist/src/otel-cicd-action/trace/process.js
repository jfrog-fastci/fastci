"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceProcessTree = traceProcessTree;
exports.traceProcessTrees = traceProcessTrees;
exports.associateProcessesWithSteps = associateProcessesWithSteps;
exports.addStepContextToSpan = addStepContextToSpan;
const api_1 = require("@opentelemetry/api");
const core_1 = require("@actions/core");
/**
 * Creates traces for a process tree and all its children
 * @param processTree Root process tree to trace
 * @param step Optional GitHub workflow step for context
 */
async function traceProcessTree(processTree, step) {
    const tracer = api_1.trace.getTracer("otel-cicd-action");
    // Create the parent process span
    (0, core_1.info)(`Tracing process tree ${processTree.process.command}`);
    await tracer.startActiveSpan(processTree.process.command || "process", {
        startTime: processTree.process.started_at,
        attributes: processToAttributes(processTree, step)
    }, async (parentSpan) => {
        // Add step context if available
        if (step) {
            addStepContextToSpan(parentSpan, step);
        }
        // Add file events as events on the span
        addFileEventsToSpan(parentSpan, processTree.file_events);
        // Set status based on exit code if process is completed
        if (processTree.process.stopped_at) {
            const exitCode = processTree.process.exit_code || 0;
            if (exitCode !== 0) {
                parentSpan.setStatus({ code: api_1.SpanStatusCode.ERROR });
                parentSpan.setAttribute("error", true);
                parentSpan.setAttribute("error.message", `Process exited with code ${exitCode}`);
            }
            else {
                parentSpan.setStatus({ code: api_1.SpanStatusCode.OK });
            }
        }
        // Recursively trace child processes
        const childPromises = processTree.children.map(child => traceChildProcess(child, parentSpan, step));
        await Promise.all(childPromises);
        // End the span with the stopped time if available, otherwise use current time
        parentSpan.end(processTree.process.stopped_at || new Date());
    });
}
/**
 * Traces a child process in the context of its parent
 * @param childProcess Child process tree to trace
 * @param parentSpan Parent process span
 * @param step Optional GitHub workflow step for context
 */
async function traceChildProcess(childProcess, parentSpan, step) {
    const tracer = api_1.trace.getTracer("otel-cicd-action");
    return api_1.context.with(api_1.trace.setSpan(api_1.context.active(), parentSpan), async () => {
        await tracer.startActiveSpan(childProcess.process.command || "child-process", {
            startTime: childProcess.process.started_at,
            attributes: processToAttributes(childProcess, step)
        }, async (childSpan) => {
            // Add step context if available
            if (step) {
                addStepContextToSpan(childSpan, step);
            }
            // Add file events as events on the span
            addFileEventsToSpan(childSpan, childProcess.file_events);
            // Set status based on exit code if process is completed
            if (childProcess.process.stopped_at) {
                const exitCode = childProcess.process.exit_code || 0;
                if (exitCode !== 0) {
                    childSpan.setStatus({ code: api_1.SpanStatusCode.ERROR });
                    childSpan.setAttribute("error", true);
                    childSpan.setAttribute("error.message", `Process exited with code ${exitCode}`);
                }
                else {
                    childSpan.setStatus({ code: api_1.SpanStatusCode.OK });
                }
            }
            // Recursively trace child processes
            const grandChildPromises = childProcess.children.map(grandChild => traceChildProcess(grandChild, childSpan, step));
            await Promise.all(grandChildPromises);
            // End the span with the stopped time if available, otherwise use current time
            childSpan.end(childProcess.process.stopped_at || new Date());
        });
    });
}
/**
 * Adds file events as span events
 * @param span Span to add events to
 * @param fileEvents File events to add
 */
function addFileEventsToSpan(span, fileEvents) {
    for (const event of fileEvents) {
        span.addEvent(`${event.mode}:${event.file_path}`, {
            "file.path": event.file_path,
            "file.sha256": event.sha256,
            "file.size": event.size,
            "file.uid": event.uid,
            "file.gid": event.gid,
            "file.permissions": event.permissions,
            "pid": event.pid
        }, event.timestamp);
    }
}
/**
 * Converts a process tree to span attributes
 * @param processTree Process tree to convert
 * @param step Optional GitHub workflow step for context
 * @returns Attributes for the span
 */
function processToAttributes(processTree, step) {
    const { process } = processTree;
    const attributes = {
        "process.pid": process.pid,
        "process.ppid": process.ppid,
        "process.command": process.command,
        "process.binary_path": process.binary_path,
        "process.args": process.args,
        "process.name": process.name,
        "process.working_dir": process.working_dir,
        "process.started_at": new Date(process.started_at).toISOString(),
        "process.stopped_at": process.stopped_at ? new Date(process.stopped_at).toISOString() : undefined,
        "process.exit_code": process.exit_code !== null ? process.exit_code : undefined,
        "process.cpu_time": process.cpu_time,
        "process.memory_usage": process.memory_usage,
        "process.is_root_ci_step": process.is_root_ci_step,
        "process.child_count": processTree.children.length,
        "process.file_event_count": processTree.file_events.length,
        // Some custom process-specific attributes to help with analysis
        "is_shell": /sh$|bash$|zsh$|fish$|cmd.exe$|powershell.exe$/i.test(process.binary_path),
        "is_package_manager": /npm|yarn|pnpm|pip|composer|gem|mvn|gradle|nuget/i.test(process.command),
        "is_build_tool": /make|cmake|gcc|g\+\+|javac|dotnet|webpack|babel|tsc|rollup/i.test(process.command),
        "is_test_runner": /jest|mocha|pytest|rspec|phpunit|junit|cypress|karma|playwright|webdriver/i.test(process.command),
        "is_docker": /docker|podman|containerd/i.test(process.command),
    };
    // Add step context if available
    if (step) {
        attributes["github.step.number"] = step.number;
        attributes["github.step.name"] = step.name;
    }
    return attributes;
}
/**
 * Batch traces multiple process trees
 * @param processTrees Array of process trees to trace
 * @param step Optional GitHub workflow step for context
 */
async function traceProcessTrees(processTrees, step) {
    const promises = processTrees.map(tree => traceProcessTree(tree, step));
    await Promise.all(promises);
}
/**
 * Associates process trees with GitHub workflow steps based on timestamps
 * @param processTrees Process trees to classify
 * @param steps GitHub workflow steps
 * @returns Map of step ID to associated process trees
 */
function associateProcessesWithSteps(processTrees, steps) {
    const stepMap = new Map();
    // Initialize map with empty arrays for each step
    steps.forEach(step => {
        stepMap.set(step.number, []);
    });
    // For each process, find the step it belongs to based on timestamps
    for (const processTree of processTrees) {
        const processStartTime = processTree.process.started_at;
        // Find the step that this process most likely belongs to
        let bestMatchStep;
        let minTimeDiff = Number.MAX_SAFE_INTEGER;
        for (const step of steps) {
            if (!step.started_at)
                continue;
            const stepStartTime = new Date(step.started_at);
            // If step has a completed_at time, check if process started during the step's timeframe
            if (step.completed_at) {
                const stepEndTime = new Date(step.completed_at);
                if (processStartTime >= stepStartTime && processStartTime <= stepEndTime) {
                    bestMatchStep = step;
                    break; // Exact match found
                }
            }
            // If no exact match, find closest step by start time
            const timeDiff = Math.abs(processStartTime.getTime() - stepStartTime.getTime());
            if (timeDiff < minTimeDiff) {
                minTimeDiff = timeDiff;
                bestMatchStep = step;
            }
        }
        // If we found a matching step, add the process to its array
        if (bestMatchStep) {
            const stepProcesses = stepMap.get(bestMatchStep.number) || [];
            stepProcesses.push(processTree);
            stepMap.set(bestMatchStep.number, stepProcesses);
        }
    }
    return stepMap;
}
/**
 * Adds step/job context to process tree spans
 * @param span The span to add context to
 * @param step The GitHub workflow step
 */
function addStepContextToSpan(span, step) {
    span.setAttribute("github.step.number", step.number);
    span.setAttribute("github.step.name", step.name);
    span.setAttribute("github.step.status", step.status);
    span.setAttribute("github.step.conclusion", step.conclusion || "unknown");
    if (step.started_at) {
        span.setAttribute("github.step.started_at", step.started_at);
    }
    if (step.completed_at) {
        span.setAttribute("github.step.completed_at", step.completed_at);
    }
}
