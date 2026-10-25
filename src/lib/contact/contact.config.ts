import { ContactInfo } from '@/lib/contact/message-generator';

export const CONTACT_CONFIG: ContactInfo = {
  phoneNumber: '',
  instagramUser: '',
};

export function hasContactInfo(info: ContactInfo): boolean {
  return Boolean(info.phoneNumber || info.instagramUser);
}
