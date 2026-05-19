// client/src/store/slices/postSlice.js
import { createSlice } from "@reduxjs/toolkit";

const postSlice = createSlice({
  name: "posts",
  initialState: {
    feed:       [],
    cursor:     null,
    hasMore:    true,
    trending:   [],
  },
  reducers: {
    setPosts: (state, { payload }) => {
      state.feed    = payload.posts;
      state.cursor  = payload.nextCursor;
      state.hasMore = payload.hasMore;
    },
    appendPosts: (state, { payload }) => {
      // Deduplicate before appending
      const ids     = new Set(state.feed.map((p) => p._id));
      const newOnes = payload.posts.filter((p) => !ids.has(p._id));
      state.feed    = [...state.feed, ...newOnes];
      state.cursor  = payload.nextCursor;
      state.hasMore = payload.hasMore;
    },
    prependPost: (state, { payload }) => {
      state.feed.unshift(payload); // optimistic new post
    },
    updatePost: (state, { payload }) => {
      const idx = state.feed.findIndex((p) => p._id === payload._id);
      if (idx !== -1) state.feed[idx] = { ...state.feed[idx], ...payload };
    },
    removePost: (state, { payload: postId }) => {
      state.feed = state.feed.filter((p) => p._id !== postId);
    },
    toggleLike: (state, { payload: { postId, userId } }) => {
      const post = state.feed.find((p) => p._id === postId);
      if (!post) return;
      const idx = post.likes.indexOf(userId);
      if (idx !== -1) post.likes.splice(idx, 1);
      else             post.likes.push(userId);
    },
    setTrending: (state, { payload }) => {
      state.trending = payload;
    },
  },
});

export const {
  setPosts, appendPosts, prependPost,
  updatePost, removePost, toggleLike, setTrending,
} = postSlice.actions;
export default postSlice.reducer;