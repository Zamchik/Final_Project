import { describe, it, expect } from 'vitest';
import { validateKeys } from '../validateKeys';

describe('validateKeys', () => {
  it('успешно проходит валидный ключ', async () => {
    await expect(validateKeys(null, 'AAAAA-BBBBB-CCCCC')).resolves.toBeUndefined();
  });

  it('отклоняет пустую строку', async () => {
    await expect(validateKeys(null, '')).rejects.toThrow('Добавьте хотя бы один ключ');
  });

  it('отклоняет невалидный формат', async () => {
    await expect(validateKeys(null, 'BADFORMAT')).rejects.toThrow('Некорректные ключи');
  });

  it('отклоняет дубликаты', async () => {
    await expect(validateKeys(null, 'AAAAA-BBBBB-CCCCC\nAAAAA-BBBBB-CCCCC')).rejects.toThrow('Обнаружены повторяющиеся ключи');
  });
});