import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Phase, Post, User, WebSession } from "./app";
import { PostDoc, PostOptions } from "./concepts/post";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

class Routes {
  ////////////////////////// SESSION //////////////////////////

  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  ////////////////////////// USER //////////////////////////

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  ////////////////////////// DEBATE //////////////////////////

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  ////////////////////////// PHASES //////////////////////////

  @Router.get("/phase")
  async getActivePhases() {
    return await Responses.phases(await Phase.getActive());
  }

  @Router.get("/phase/:key")
  async getPhaseByKey(key: ObjectId) {
    return await Responses.phase(await Phase.getPhaseByKey(new ObjectId(key)));
  }

  @Router.post("/phase")
  async addStoredPhase(key: ObjectId) {
    // TO-DO Synchronize with debate creation
    return await Phase.initialize(new ObjectId(key));
  }

  @Router.patch("/phase")
  async editPhaseDeadline(key: ObjectId, newDeadline: Date) {
    return await Phase.editDeadline(new ObjectId(key), new Date(newDeadline));
  }

  @Router.patch("/phase/extension")
  changeDeadlineExtension(newVal: number) {
    return Phase.changeDeadlineExtension(newVal);
  }

  @Router.post("/phase/maxPhase")
  changeMaxPhase(newMax: number) {
    return Phase.changeMaxPhase(newMax);
  }

  @Router.delete("/phase/active/:key")
  async deleteActive(key: ObjectId) {
    return await Phase.deleteActive(new ObjectId(key));
  }

  @Router.delete("/phase/expired/:key")
  async deleteExpired(key: ObjectId) {
    return await Phase.deleteExpired(new ObjectId(key));
  }
}

export default getExpressRouter(new Routes());
