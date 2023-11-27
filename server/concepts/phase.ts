import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface PhaseDoc extends BaseDoc {
  key: ObjectId;
  deadline: Date;
}

export default class PhaseConcept {
  public readonly active = new DocCollection<PhaseDoc>("active phases");
  public readonly expired = new DocCollection<PhaseDoc>("expired phases");

  /**
   * Creates a new active phase for a given item that expires at a given time
   * @param key id of the object
   * @param deadline date and time when the phase should expire
   * @returns an object containing a success message and the phase object
   */
  async initialize(key: ObjectId, deadline: Date) {
    await this.alreadyExists(key);
    const _id = await this.active.createOne({ key, deadline });
    return { msg: "Active phase successfully created!", phase: await this.active.readOne({ _id }) };
  }

  /**
   * Gets all active phases
   * @returns all active phase objects (if any)
   */
  async getActive() {
    await this.expireOld();
    return await this.active.readMany({});
  }

  /**
   * Gets an phase object by the key of the item in the phase (if active and exists)
   * @param key id of the item that's currently in an active phase
   * @returns phase object if found
   */
  async getPhaseByKey(key: ObjectId) {
    await this.expireOld();
    return await this.active.readOne({ key });
  }

  /**
   * Removes the active phase by key (could be =0 or =1)
   * @param key id of the item being deleted
   * @returns an object containing a success message
   */
  async deleteActive(key: ObjectId) {
    await this.active.deleteOne({ key });
    return { msg: "Active phase deleted successfully!" };
  }

  /**
   * Removes the expired phases by key (could be >=0)
   * @param key id of the item being deleted
   * @returns an object containing a success message
   */
  async deleteExpired(key: ObjectId) {
    await this.expired.deleteMany({ key });
    return { msg: "Expired phases deleted successfully!" };
  }

  /**
   * Moves all expired phases that are currently in active into expired
   */
  private async expireOld() {
    const now = new Date();
    const expired = await this.active.readMany({ deadline: { $lt: now } });

    for (const phase of expired) {
      await this.expired.createOne({ key: phase.key, deadline: phase.deadline });
      await this.active.deleteOne({ _id: phase._id });
    }
  }

  /**
   * Figures out if the key given already has an active phase object
   * @param key id of the item
   * @throws KeyExistsError if the key already has an active phase
   */
  private async alreadyExists(key: ObjectId) {
    const phase = await this.active.readOne({ key });
    if (phase) {
      throw new KeyExistsError(key);
    }
  }

  /**
   * Figures out if the key given doesn't have an active phase
   * @param key id of the item
   * @throws NoPhaseError if the user doesn't have an active phase
   */
  private async doesntExist(key: ObjectId) {
    const phase = await this.active.readOne({ key });
    if (!phase) {
      throw new NoPhaseError(key);
    }
    return phase;
  }
}

export class KeyExistsError extends NotAllowedError {
  constructor(public readonly key: ObjectId) {
    super("{0} already has an active phase!", key);
  }
}

export class NoPhaseError extends NotFoundError {
  constructor(public readonly key: ObjectId) {
    super("{0} doesn't have an active phase!", key);
  }
}
