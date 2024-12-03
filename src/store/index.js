import { createStore } from 'vuex';

export default createStore({
  state: {
    user: {
      token: localStorage.getItem('token'),
      username: localStorage.getItem('username'),
      role: localStorage.getItem('userRole')
    }
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user;
      localStorage.setItem('token', user.token);
      localStorage.setItem('username', user.username);
      localStorage.setItem('userRole', user.role);
    },
    CLEAR_USER(state) {
      state.user = {
        token: '',
        username: '',
        role: ''
      };
      localStorage.clear();
    }
  },
  actions: {
    login({ commit }, user) {
      commit('SET_USER', user);
    },
    logout({ commit }) {
      commit('CLEAR_USER');
    }
  }
});
