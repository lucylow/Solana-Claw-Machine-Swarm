import { storagePut } from "../storage";
import { hashCanonical } from "./hash";

export class PlanStorageService {
  async store(namespace: string, id: string, payload: unknown) {
    const localRef = `app://${namespace}/${id}.json`;
    const checksum = hashCanonical(payload);

    try {
      const upload = await storagePut(
        `${namespace}/${id}.json`,
        JSON.stringify(payload, null, 2),
        "application/json"
      );
      return {
        ref: upload.url,
        checksum: hashCanonical({ key: upload.key, checksum }),
        namespace,
        degraded: false,
      };
    } catch {
      return {
        ref: localRef,
        checksum,
        namespace,
        degraded: true,
      };
    }
  }
}
