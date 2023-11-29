import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface DebateDoc extends BaseDoc {
  prompt: string;
  category: string;
  participants: Array<string>;
  opinions: Array<string>;
}

export interface OpinionDoc extends BaseDoc {
  content: string;
  author: string;
  likertScale: string;
}

export interface DifferentOpinionMatchDoc extends BaseDoc {
  reviewer: string;
  matchedDifferentOpinions: Array<string>;
  debate: ObjectId;
}

export interface PromptDoc extends BaseDoc {
  prompt: string;
  category: string;
}

export default class DebateConcept {
  public readonly debates = new DocCollection<DebateDoc>("debates");
  public readonly opinions = new DocCollection<OpinionDoc>("opinions");
  public readonly differentOpinionMatches = new DocCollection<DifferentOpinionMatchDoc>("opinion matches");
  public readonly prompts = new DocCollection<PromptDoc>("prompts");
  public readonly numPromptsPerDay = 2;

  async getDebates() {
    return await this.debates.readMany({});
  }

  async suggestPrompt(prompt: string, category: string) {
    const existingPrompt = await this.prompts.readOne({ prompt });
    if (!existingPrompt) {
      await this.prompts.createOne({ prompt, category });
    }
    const promptObj = await this.prompts.readOne({ prompt });
    return { msg: "Thanks for the suggestion!", promptObj };
  }

  /**
   * Creates a new debate for a given prompt
   * @param prompt a statement that the debate's participants write opinions about
   * @param category a broad topic that the debate's prompt falls under
   * @returns an object containing a success message and the debate object
   */
  async initialize(prompt: string, category: string) {
    await this.promptAlreadyUsed(prompt);
    const _id = await this.debates.createOne({ prompt, category, participants: [], opinions: [] });
    return { msg: "Debate for prompt successfully created!", debate: await this.debates.readOne({ _id }) };
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
    const allOpinions = existingDebate.opinions;
    if (!(await this.isParticipant(_id, user))) {
      const allParticipants = existingDebate.participants;
      allParticipants.push(user);
      const newOpinion = await this.opinions.createOne({ content, author: user, likertScale });
      allOpinions.push(newOpinion.toString());
      await this.debates.updateOne({ _id }, { participants: allParticipants, opinions: allOpinions });
    } else {
      await this.opinions.updateOne({ author: user }, { content });
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
    console.log("check debate participants");
    console.log(existingDebate.participants.includes(user));
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
    const existingDebate = await this.getDebate(_id);
    for (const opinion of existingDebate.opinions) {
      for (const otherOpinion of existingDebate.opinions) {
        const opinionObj = await this.opinions.readOne({ _id: new ObjectId(opinion) });
        const otherOpinionObj = await this.opinions.readOne({ _id: new ObjectId(otherOpinion) });
        if (!opinionObj || !otherOpinionObj) {
          throw new NotFoundError("");
        } else {
          if (opinionObj.likertScale !== otherOpinionObj.likertScale) {
            const opinionObjAuthor = opinionObj.author;
            const participantMatchedOpinions = await this.differentOpinionMatches.readOne({ reviewer: opinionObjAuthor, debate: _id });
            if (participantMatchedOpinions) {
              console.log("found matched opinions");
              if (!participantMatchedOpinions.matchedDifferentOpinions.includes(otherOpinion)) {
                const matchedOpinions = participantMatchedOpinions.matchedDifferentOpinions;
                matchedOpinions.push(otherOpinion);
                await this.differentOpinionMatches.updateOne({ reviewer: opinionObjAuthor, debate: _id }, { matchedDifferentOpinions: matchedOpinions });
              }
            } else {
              console.log("initialize new matched opinions");
              await this.differentOpinionMatches.createOne({ reviewer: opinionObjAuthor, debate: _id, matchedDifferentOpinions: [otherOpinion] });
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
