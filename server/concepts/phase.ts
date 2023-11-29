import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface PhaseDoc extends NewPhaseDoc {
  deadline: Date;
}

export interface NewPhaseDoc extends BaseDoc {
  key: ObjectId;
  curPhase: number;
}

export default class PhaseConcept {
  private readonly store = new DocCollection<NewPhaseDoc>("store phases");
  public readonly active = new DocCollection<PhaseDoc>("active phases");
  public readonly expired = new DocCollection<PhaseDoc>("expired phases");
  private maxPhase = 3;
  private deadlineExtension = 24;
  public numPromptsPerDay = 2;

  /**
   * Creates a new store phase for a given item
   * @param key id of the object
   * @returns an object containing a success message and the phase object
   */
  async initialize(key: ObjectId) {
    await this.expireOld();
    await this.alreadyExists(key);
    const _id = await this.store.createOne({ key, curPhase: 0 });
    await this.start();
    return { msg: "New stored phase successfully created!", phase: await this.store.readOne({ _id }) };
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
   * Gets all expired phases
   * @returns all expired phase objects (if any)
   */
  async getHistory() {
    await this.expireOld();
    return await this.expired.readMany({});
  }

  /**
   * Edits the deadline for a given item if the new deadline
   * hasn't passed yet
   * @param key id of the item
   * @param newDeadline new date (should be in the future)
   * @returns an object containing a success message
   */
  async editDeadline(key: ObjectId, newDeadline: Date) {
    this.alreadyExpired(newDeadline);
    await this.active.updateOne({ key }, { deadline: newDeadline });
    return { msg: "Successfully updated the deadline" };
  }

  /**
   * Removes the active phase by key (could be =0 or =1)
   * @param key id of the item being deleted
   * @returns an object containing a success message
   */
  async deleteActive(key: ObjectId) {
    await this.expireOld();
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
   * Change the value of numPromptsPerDay
   * @param newMax a positive integer
   * @throws BadValuesError if numPromptsPerDay is 0 or less or isn't an integer
   */
  changeNumPromptsPerDay(newVal: number) {
    if (newVal > 0 && Number.isInteger(newVal)) {
      this.numPromptsPerDay = newVal;
      return { msg: "Successfully updated number of prompts per day value" };
    }
    throw new BadValuesError(newVal + " must be an integer greater than 0");
  }

  /**
   * Change the max phase
   * @param newMax a positive integer
   * @throws BadValuesError if newMax is 0 or less or isn't an integer
   */
  changeMaxPhase(newMax: number) {
    if (newMax > 0 && Number.isInteger(newMax)) {
      this.maxPhase = newMax;
      return { msg: "Successfully updated max phase value" };
    }
    throw new BadValuesError(newMax + " must be an integer greater than 0");
  }

  /**
   * Change the deadline extending (hours)
   * @param newVal number of hours that the deadline will be
   * extended by
   * @throws BadValuesError if newVal is 0 or less
   */
  changeDeadlineExtension(newVal: number) {
    if (newVal > 0) {
      this.deadlineExtension = newVal;
      return { msg: "Successfully updated deadline extension value" };
    }
    throw new BadValuesError(newVal + " must be greater than 0");
  }

  /**
   * Adds new phase 1 items from the store into the active group
   */
  private async start() {
    const existingPhase1s = await this.active.readMany({ curPhase: 1 });
    if (existingPhase1s.length < this.numPromptsPerDay) {
      const phase1 = await this.store.readMany({}, { limit: this.numPromptsPerDay });

      const deadline = new Date();
      deadline.setTime(deadline.getTime() + this.deadlineExtension * 60 * 60 * 1000);
      for (const item of phase1) {
        await this.active.createOne({ key: item.key, deadline, curPhase: 1 });
        await this.store.deleteOne({ _id: item._id });
      }
    }
  }

  /**
   * Moves all expired phases that are currently in active into expired
   * if maxed out on the phase or progresses the phase and deadline
   */
  private async expireOld() {
    const now = new Date();
    const expired = await this.active.readMany({ deadline: { $lt: now } });

    for (const phase of expired) {
      if (phase.curPhase === this.maxPhase) {
        await this.expired.createOne({ key: phase.key, deadline: phase.deadline });
        await this.active.deleteOne({ _id: phase._id });
      } else {
        const newDate: Date = phase.deadline;
        let newPhase = phase.curPhase;

        while (newDate < now && newPhase < this.maxPhase) {
          newDate.setTime(newDate.getTime() + this.deadlineExtension * 60 * 60 * 1000);
          newPhase += 1;
        }

        if (newDate < now) {
          await this.expired.createOne({ key: phase.key, deadline: phase.deadline });
          await this.active.deleteOne({ _id: phase._id });
        } else {
          await this.active.updateOne({ _id: phase._id }, { deadline: newDate, curPhase: newPhase });
        }
      }
    }
    await this.start();
  }

  /**
   * Checks if the given date is already expired
   * @param date date we're checking
   * @throws NotAllowedError if the date has already past
   */
  private alreadyExpired(date: Date) {
    const now = new Date();
    if (date < now) {
      throw new NotAllowedError("The date given (" + date.toString() + ") is already expired!");
    }
  }

  /**
   * Figures out if the key given already has an active phase object
   * @param key id of the item
   * @throws KeyExistsError if the key already has an active phase
   */
  private async alreadyExists(key: ObjectId) {
    const phase = await this.active.readOne({ key });
    const phaseStored = await this.store.readOne({ key });
    if (phase || phaseStored) {
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
    super("{0} already has an active or stored phase!", key);
  }
}

export class NoPhaseError extends NotFoundError {
  constructor(public readonly key: ObjectId) {
    super("{0} doesn't have an active phase!", key);
  }
}
