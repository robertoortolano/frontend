/**
 * Role-related TypeScript interfaces
 * 
 * Nota: Role rappresenta ruoli CUSTOM per il Permission system (es: "Developer", "QA").
 * I ruoli di sistema ADMIN/USER sono gestiti separatamente tramite UserRole.
 */

export interface RoleDto {
  id: number;
  name: string;
  description?: string;
  defaultRole: boolean;
  // NO scope - i Role custom sono sempre a livello TENANT implicitamente
}

export interface RoleCreateDto {
  name: string;
  description?: string;
}

export interface RoleUpdateDto {
  name: string;
  description?: string;
}

