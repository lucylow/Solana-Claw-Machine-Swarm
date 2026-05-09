import type {
  ZeroGComputeJob,
  ZeroGDataAvailabilityRecord,
  ZeroGStorageArtifact,
} from "./types";
import { ZeroGOrchestratorStore } from "./artifacts";

export function createZeroGReplayService(store: ZeroGOrchestratorStore) {
  return {
    getArtifact(storageRef: string): ZeroGStorageArtifact | null {
      return store.getArtifactByRef(storageRef);
    },
    getComputeJob(jobId: string): ZeroGComputeJob | null {
      return store.getJobById(jobId);
    },
    getAvailability(
      availabilityRef: string,
    ): ZeroGDataAvailabilityRecord | null {
      return store.getAvailabilityByRef(availabilityRef);
    },
    getGraph() {
      return {
        artifacts: store.listArtifacts(),
        computeJobs: store.listComputeJobs(),
        availability: store.listAvailability(),
        links: store.listLinks(),
        receipts: store.listReceipts(),
      };
    },
  };
}
