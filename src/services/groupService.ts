import api from '../api/api';
import { GroupDto, GroupCreateDto, GroupUpdateDto } from '../types/group.types';

const groupService = {
  async getAll(): Promise<GroupDto[]> {
    const response = await api.get('/groups');
    return response.data;
  },

  async getById(id: number): Promise<GroupDto> {
    const response = await api.get(`/groups/${id}`);
    return response.data;
  },

  async create(data: GroupCreateDto): Promise<GroupDto> {
    const response = await api.post('/groups', data);
    return response.data;
  },

  async update(id: number, data: GroupUpdateDto): Promise<GroupDto> {
    const response = await api.put(`/groups/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/groups/${id}`);
  }
};

export default groupService;

