import {
  MAIN_TO_WORKER,
  createCancelledMessage,
  createErrorMessage,
  createProgressMessage,
  createResultMessage,
  validateMainToWorkerMessage
} from "./worker-protocol.js";
import { finalizeGbmRun, prepareGbmRun, simulateGbmPath } from "../monte-carlo/gbm.js";

const activeRuns = new Map();

self.onmessage = (event) => {
  const checked = validateMainToWorkerMessage(event.data);
  if (!checked.valid) {
    const runId = typeof event.data?.runId === "string" ? event.data.runId : "invalid";
    self.postMessage(createErrorMessage(runId, checked.code, checked.message));
    return;
  }

  const message = checked.value;
  if (message.type === MAIN_TO_WORKER.CANCEL) {
    const run = activeRuns.get(message.runId);
    if (run) run.cancelled = true;
    return;
  }
  startGbmRun(message, event.data?.alignedHistory);
};

function startGbmRun(message, alignedCloses) {
  try {
    const simulation = prepareGbmRun(message.inputs, alignedCloses);
    const run = { cancelled: false, inputs: message.inputs, simulation };
    activeRuns.set(message.runId, run);
    self.postMessage(createProgressMessage(message.runId, 0, message.inputs.pathCount));
    queueMicrotask(() => advanceGbmRun(message.runId, run));
  } catch (error) {
    self.postMessage(createErrorMessage(message.runId, safeCode(error), safeMessage(error)));
  }
}

function advanceGbmRun(runId, run) {
  if (activeRuns.get(runId) !== run) return;
  if (run.cancelled) {
    activeRuns.delete(runId);
    self.postMessage(createCancelledMessage(runId));
    return;
  }
  try {
    // Yield regularly so cancellation and progress remain observable on mobile.
    const end = Math.min(run.inputs.pathCount, run.simulation.completedPaths + 10);
    while (run.simulation.completedPaths < end) simulateGbmPath(run.simulation, run.simulation.completedPaths);
    self.postMessage(createProgressMessage(runId, run.simulation.completedPaths, run.inputs.pathCount));
    if (run.simulation.completedPaths < run.inputs.pathCount) {
      setTimeout(() => advanceGbmRun(runId, run), 0);
      return;
    }
    activeRuns.delete(runId);
    self.postMessage(createResultMessage(runId, finalizeGbmRun(run.simulation)));
  } catch (error) {
    activeRuns.delete(runId);
    self.postMessage(createErrorMessage(runId, safeCode(error), safeMessage(error)));
  }
}

function safeCode(error) {
  return typeof error?.code === "string" && error.code.length <= 500 ? error.code : "GBM_SIMULATION_FAILED";
}

function safeMessage(error) {
  return typeof error?.message === "string" && error.message.trim() && error.message.length <= 500
    ? error.message
    : "GBM simulation could not be completed.";
}
