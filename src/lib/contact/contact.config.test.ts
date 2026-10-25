import { describe, expect, it } from 'vitest';
import { CONTACT_CONFIG, hasContactInfo } from './contact.config';
import { generateWhatsAppMessage } from './message-generator';

describe('contacto del catálogo (US-1 CA-3)', () => {
  it('no trae el teléfono ni el Instagram del cliente anterior', () => {
    expect(CONTACT_CONFIG).toEqual({ phoneNumber: '', instagramUser: '' });
    expect(hasContactInfo(CONTACT_CONFIG)).toBe(false);
  });

  it('con al menos un dato de contacto, los botones se muestran', () => {
    expect(hasContactInfo({ phoneNumber: '5491100000000', instagramUser: '' })).toBe(true);
    expect(hasContactInfo({ phoneNumber: '', instagramUser: 'empanaderiaisabela' })).toBe(true);
  });

  it('el mensaje de WhatsApp saluda a la empanadería', () => {
    expect(generateWhatsAppMessage({ name: 'Empanada de carne' })).toBe('¡Hola Empanadería Isabela! Me interesa el *Empanada de carne*. ¿Lo tienen disponible? ¡Muchas gracias!');
  });
});
