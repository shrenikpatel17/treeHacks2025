"use client";

import { createSlice } from "@reduxjs/toolkit";

// Initial state
const initialState = {
  mode: "light",
  user: {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  },
  token: "",
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setMode: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
    setLogin: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    setLogout: (state) => {
      state.user = {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        projects: [],
        groups: [],
      };
      state.token = "";
    },
    addProjectToUser: (state, action) => {
      state.user.projects.push(action.payload);
    },
    addGroupToUser: (state, action) => {
      state.user.groups.push(action.payload);
    },
  },
});

export const authActions = authSlice.actions;

export default authSlice.reducer;
