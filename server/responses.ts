import { User } from "./app";
import { KeyExistsError, NoPhaseError, PhaseDoc } from "./concepts/phase";
import { PostAuthorNotMatchError, PostDoc } from "./concepts/post";
import { Router } from "./framework/router";

const PHASES = ["Start", "Review", "Completed"];

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
 */
export default class Responses {
  /**
   * Convert PostDoc into more readable format for the frontend by
   * converting the author id into a username.
   */
  static async post(post: PostDoc | null) {
    if (!post) {
      return post;
    }
    const author = await User.getUserById(post.author);
    return { ...post, author: author.username };
  }

  /**
   * Same as {@link post} but for an array of PostDoc for improved performance.
   */
  static async posts(posts: PostDoc[]) {
    const authors = await User.idsToUsernames(posts.map((post) => post.author));
    return posts.map((post, i) => ({ ...post, author: authors[i] }));
  }

  /**
   * Convert PhaseDoc into more readable format for the frontend by
   * converting the key id into a debate prompt and the curPhase into
   * a string format.
   */
  static async phase(phase: PhaseDoc | null) {
    if (!phase) {
      return phase;
    }
    // const debate = await Debate.getDebateById(phase.key);
    const debate = { prompt: "temp DELETE ME" };
    const curPhase = PHASES[phase.curPhase - 1];
    return { ...phase, key: debate.prompt, curPhase };
  }

  /**
   * Same as {@link phase} but for an array of PhaseDoc for improved performance.
   */
  static async phases(phases: PhaseDoc[]) {
    // const debates = await Promise.all(phases.map(async (phase) => await Debate.getDebateById(phase.key)));
    const debates = [{ prompt: "temp DELETE ME" }];
    return phases.map((phase, i) => ({ ...phase, key: debates[0].prompt, curPhase: PHASES[phase.curPhase - 1] }));
  }
}

Router.registerError(PostAuthorNotMatchError, async (e) => {
  const username = (await User.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(KeyExistsError, async (e) => {
  // const debateObj = await Debate.getDebateById(e.key);
  // const promptFormatted = '\"' + debate.prompt + '\"';
  // return e.formatWith(promptFormatted);
  return e; // DELETE ME
});

Router.registerError(NoPhaseError, async (e) => {
  // const debateObj = await Debate.getDebateById(e.key);
  // const promptFormatted = '\"' + debate.prompt + '\"';
  // return e.formatWith(promptFormatted);
  return e; // DELETE ME
});
