/**
 * Group-related TypeScript interfaces
 */

export interface UserDto {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
}

export interface GroupDto {
  id: number;
  name: string;
  description?: string;
  users: UserDto[];
}

export interface GroupCreateDto {
  name: string;
  description?: string;
  userIds: number[];
}

export interface GroupUpdateDto {
  name: string;
  description?: string;
  userIds: number[];
}

