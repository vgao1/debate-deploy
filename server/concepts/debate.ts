import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface DebateDoc extends BaseDoc {
  prompt: string;
  category: string;
  participants: Array<string>;
}

export interface OpinionDoc extends BaseDoc {
  content: string;
  author: string;
  likertScale: string;
  debate: ObjectId;
}

export interface DifferentOpinionMatchDoc extends BaseDoc {
  reviewer: string;
  matchedDifferentOpinions: Array<string>;
  debate: ObjectId;
}

export default class DebateConcept {
  public readonly debates = new DocCollection<DebateDoc>("debates");
  public readonly opinions = new DocCollection<OpinionDoc>("opinions");
  public readonly differentOpinionMatches = new DocCollection<DifferentOpinionMatchDoc>("opinion matches");

  async getDebateById(_id: ObjectId) {
    return await this.getDebate(_id);
  }

  /**
   * Creates a new debate for a given prompt
   * @param prompt a statement that the debate's participants write opinions about
   * @param category a broad topic that the debate's prompt falls under
   * @returns an object containing a success message and the debate object
   */
  async suggestPrompt(prompt: string, category: string) {
    await this.promptAlreadyUsed(prompt);
    await this.debates.createOne({ prompt, category, participants: [] });
    const debateObj = await this.debates.readOne({ prompt, category });
    if (debateObj) {
      return { msg: "Thanks for the suggestion!", debateId: debateObj._id };
    }
  }

  /**
   * Submits a user's written response and how strongly they agree with debate prompt
   * @param _id the ObjectId of debate
   * @param user the user submitting an opinion
   * @param content the written response to prompt
   * @param likerScale a number quantifying how much user agrees with prompt
   * @returns a message stating that opinion was added successfully or throws an error
   */
  async addOpinion(_id: ObjectId, user: string, content: string, likertScale: string) {
    const existingDebate = await this.getDebate(_id);
    if (!(await this.isParticipant(_id, user))) {
      console.log("new participant");
      const allParticipants = existingDebate.participants;
      allParticipants.push(user);
      await this.opinions.createOne({ content, author: user, likertScale, debate: _id });
      await this.debates.updateOne({ _id }, { participants: allParticipants });
    } else {
      console.log("update old response");
      await this.opinions.updateOne({ author: user, debate: _id }, { content, likertScale });
    }
    return { msg: "Successfully added opinion!" };
  }

  /**
   * Checks if user is a participant of a debate
   * @param _id the ObjectId of debate
   * @param user the user we are checking to see if they are a participant of a debate
   * @returns true if user is a participant of debate,  false otherwise
   */
  async isParticipant(_id: ObjectId, user: string) {
    const existingDebate = await this.getDebate(_id);
    return existingDebate.participants.includes(user);
  }

  /**
   * Gets all participants of a debate
   * @param _id the ObjectId of debate
   * @returns an array of the ObjectIds of users participating in debate
   */
  async getParticipants(_id: ObjectId) {
    const existingDebate = await this.getDebate(_id);
    return existingDebate.participants;
  }

  /**
   * Matches all users to other users' opinions whose likertScale value is different from the user's own
   * opinion's likertScale value
   * @param _id the ObjectId of debate
   * @returns an array containing a document for each participant of debate and the different
   * opinions they are matched to
   */
  async matchParticipantToDifferentOpinions(_id: ObjectId) {
    const allOpinions = await this.opinions.readMany({ debate: _id });
    for (const opinion of allOpinions) {
      for (const otherOpinion of allOpinions) {
        const opinionObj = await this.opinions.readOne({ _id: opinion._id });
        const otherOpinionObj = await this.opinions.readOne({ _id: otherOpinion._id });
        if (!opinionObj || !otherOpinionObj) {
          throw new NotFoundError("");
        } else {
          if (opinionObj.likertScale !== otherOpinionObj.likertScale) {
            const opinionObjAuthor = opinionObj.author;
            const participantMatchedOpinions = await this.differentOpinionMatches.readOne({ reviewer: opinionObjAuthor, debate: _id });
            if (participantMatchedOpinions) {
              if (!participantMatchedOpinions.matchedDifferentOpinions.includes(otherOpinion._id.toString())) {
                const matchedOpinions = participantMatchedOpinions.matchedDifferentOpinions;
                matchedOpinions.push(otherOpinion._id.toString());
                await this.differentOpinionMatches.updateOne({ reviewer: opinionObjAuthor, debate: _id }, { matchedDifferentOpinions: matchedOpinions });
              }
            } else {
              await this.differentOpinionMatches.createOne({ reviewer: opinionObjAuthor, debate: _id, matchedDifferentOpinions: [otherOpinion._id.toString()] });
            }
          }
        }
      }
    }
    return this.differentOpinionMatches.readMany({ debate: _id });
  }

  /**
   * Remove opinion that was matched to a user
   * @param debate the ObjectId of debate
   * @param reviewer the ObjectId of user reviewing the opinion
   * @param opinionId the ObjectId of opinion that was matched to the reviewer
   * @returns a message stating that opinion matched to reviewer was successfully removed or throws an error
   */
  async removeDifferentOpinion(debate: ObjectId, reviewer: string, opinionId: string) {
    const existingMatchedOpinions = await this.differentOpinionMatches.readOne({ reviewer, debate });
    if (!existingMatchedOpinions) {
      throw new NotFoundError("");
    } else {
      const allMatchedOpinions = existingMatchedOpinions.matchedDifferentOpinions;
      const opinionIndex = allMatchedOpinions.indexOf(opinionId);
      if (opinionIndex == -1) {
        throw new NotFoundError("");
      } else {
        allMatchedOpinions.splice(opinionIndex, 1);
        await this.differentOpinionMatches.updateOne({ reviewer, debate }, { matchedDifferentOpinions: allMatchedOpinions });
      }
    }
    return { msg: "Successfully removed opinion that was matched to you!" };
  }

  /**
   * Deletes info about which the set of different opinions matched to each participant
   * @param debateIDs ObjectIds of debates
   * @returns an object containing a success message
   */
  async deleteMatchesForDebate(debateIDs: ObjectId[]) {
    for (const debate of debateIDs) {
      await this.differentOpinionMatches.deleteMany({ debate });
    }
    return { msg: "Successfully removed all opinion matches for the given debates!" };
  }

  /**
   * Gets an opinion object given the debate and author of opinion.
   * @param debate the ObjectId of debate
   * @returns an object with previously submitted written opinion (or empty string
   * if the user hasn't added an opinion to debate yet), likertScale value (of previous submission
   * or default value of 50), and text of button to render.
   */
  async getOpinionForDebateByAuthor(debate: ObjectId, author: string) {
    const existingOpinion = await this.opinions.readOne({ author, debate });
    if (existingOpinion) {
      return { content: existingOpinion.content, likertScale: existingOpinion.likertScale, buttonText: "Update" };
    } else {
      return { content: "", likertScale: 50, buttonText: "Submit" };
    }
  }

  /**
   * Removes a participant from a debate
   * @param _id the ObjectId of debate
   * @param user the string representation of ObjectId of user to remove from a debate
   * @returns a message stating that opinion matched to reviewer was successfully removed or throws an error
   */
  async removeParticipant(_id: ObjectId, user: string) {
    const existingDebate = await this.getDebate(_id);
    const allParticipants = existingDebate.participants;
    const participantIndex = allParticipants.indexOf(user);
    if (participantIndex != -1) {
      allParticipants.splice(participantIndex, 1);
      await this.debates.updateOne({ _id }, { participants: allParticipants });
      return { msg: "Successfully removed participant!" };
    } else {
      throw new NotFoundError("User was not a participant of given debate");
    }
  }

  /**
   * Figures out if the prompt has already been used in an existing debate object
   * @param prompt a statement that the debate's participants write opinions about
   * @throws UsedPromptError if the prompt is already used in an existing debate object
   */
  private async promptAlreadyUsed(prompt: string) {
    const debate = await this.debates.readOne({ prompt: prompt });
    if (debate) {
      throw new UsedPromptError(prompt);
    }
  }

  /**
   * Get debate with ObjectId _id
   * @param _id the ObjectId of debate
   * @returns document in debates corresponding to debate with ObjectId _id
   */
  private async getDebate(_id: ObjectId) {
    const debate = await this.debates.readOne({ _id });
    if (debate) {
      return debate;
    } else {
      throw new NotFoundError("");
    }
  }

  /**
   * Removes debate and all opinions associated with debate
   * @param _id the objectId of debate
   * @returns an object containing a success message
   */
  async delete(_id: ObjectId) {
    const allOpinions = await this.opinions.readMany({ debate: _id });
    for (const opinion of allOpinions) {
      await this.opinions.deleteOne({ _id: new ObjectId(opinion._id) });
    }
    await this.debates.deleteOne({ _id });
    await this.differentOpinionMatches.deleteMany({ debate: _id });
    return { msg: "Debate and related deleted successfully!" };
  }

  /**
   * Removes one opinion associated with a debate
   * @param debate the objectId of debate
   * @param author the string representation of an objectId of a user
   * @returns an object containing a success message
   */
  async deleteOneOpinion(debate: ObjectId, author: string) {
    await this.opinions.deleteOne({ debate, author });
    await this.removeParticipant(debate, author);
    return { msg: "Opinion deleted successfully!" };
  }

  async getAllOpinionsForDebate(debate: ObjectId) {
    const allOpinions = this.opinions.readMany({ debate });
    return allOpinions;
  }
}

export class UsedPromptError extends NotAllowedError {
  constructor(public readonly prompt: string) {
    super("{0} already used in a debate!", prompt);
  }
}

export class AlreadyAParticipantError extends NotAllowedError {
  constructor() {
    super("Already a participant!");
  }
}
