// Enhanced tournament API with better state management
export const tournamentAPI = {
  getAll: async (forceRefresh = false) => {
    console.log('🎯 TournamentAPI.getAll called, forceRefresh:', forceRefresh);
    try {
      console.log('🌐 Fetching tournaments from API...');
      const response = await api.get('/tournaments');
      let tournaments = [];
      if (Array.isArray(response.data)) {
        tournaments = response.data;
      } else if (response.data && Array.isArray(response.data.content)) {
        tournaments = response.data.content;
      } else if (response.data && Array.isArray(response.data.tournaments)) {
        tournaments = response.data.tournaments;
      }
      console.log(`📊 Retrieved ${tournaments.length} tournaments`);
      return { ...response, data: tournaments };
    } catch (error) {
      console.error('❌ Tournament API error:', error);
      throw error;
    }
  },
  participate: async (id, answers) => {
    try {
      console.log('🎮 Participating in tournament:', id);
      const response = await api.post(`/tournaments/${id}/participate`, answers);
      console.log('✅ Participation successful');
      return response;
    } catch (error) {
      console.error('❌ Participation failed:', error);
      throw error;
    }
  },
  like: async (id) => {
    try {
      console.log('❤️ Liking tournament:', id);
      const response = await api.post(`/tournaments/${id}/like`);
      console.log('✅ Like successful');
      return response;
    } catch (error) {
      console.error('❌ Like failed:', error);
      return { success: false, error: error.message };
    }
  },
  unlike: async (id) => {
    try {
      console.log('💔 Unliking tournament:', id);
      const response = await api.delete(`/tournaments/${id}/like`);
      console.log('✅ Unlike successful');
      return response;
    } catch (error) {
      console.error('❌ Unlike failed:', error);
      return { success: false, error: error.message };
    }
  },
  getById: (id) => api.get(`/tournaments/${id}`),
  create: (data) => api.post('/tournaments', data),
  update: (id, data) => api.put(`/tournaments/${id}`, data),
  delete: (id) => api.delete(`/tournaments/${id}`),
  getQuestions: (id) => api.get(`/tournaments/${id}/questions`),
  getScores: (id) => api.get(`/tournaments/${id}/scores`),
};
