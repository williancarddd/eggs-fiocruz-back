import * as bcrypt from 'bcryptjs';

export function encryptPassword(password: string): string {
  return bcrypt.hashSync(password, 8);
}

export function comparePasswords(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
