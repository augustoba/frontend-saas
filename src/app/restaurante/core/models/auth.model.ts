export interface RolResumen {
  id: number;
  nombre: string;
}

/** Quién soy y qué roles tengo, de `/api/v1/auth/me`. */
export interface Me {
  id: number;
  email: string;
  nombre: string;
  apellido: string | null;
  roles: RolResumen[];
}

export interface AuthResult {
  ok: boolean;
  message?: string;
}
