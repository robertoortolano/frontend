import api from '../api/api';

const groupService = {
  // Ottiene tutti i gruppi
  async getAll() {
    const response = await api.get('/groups');
    return response.data;
  },

  // Ottiene un gruppo per ID
  async getById(id) {
    const response = await api.get(`/groups/${id}`);
    return response.data;
  },

  // Crea un nuovo gruppo
  async create(groupData) {
    const response = await api.post('/groups', groupData);
    return response.data;
  },

  // Aggiorna un gruppo esistente
  async update(id, groupData) {
    const response = await api.put(`/groups/${id}`, groupData);
    return response.data;
  },

  // Elimina un gruppo
  async delete(id) {
    await api.delete(`/groups/${id}`);
  }
};

export default groupService;





