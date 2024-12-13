import * as bcrypt from 'bcrypt';
import { ENV } from 'src/common/constants/constants';

export async function comparePassoword(password: string, ecrypted: string) {
  return await bcrypt.compare(password, ecrypted);
}

export function encryptPassword(password: string): string {
  return bcrypt.hashSync(password, 8);
}
