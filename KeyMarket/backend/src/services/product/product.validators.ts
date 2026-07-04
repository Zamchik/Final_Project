// Валидация ключей перед сохранением

import { BadRequestError, ConflictError } from '../../common/errors';
import { findExistingKeys } from './product.queries';

 // Проверяет, что в массиве нет дубликатов.
export const ensureNoDuplicates = (keys: string[]) => {
  const uniqueKeys = [...new Set(keys)];
  if (uniqueKeys.length !== keys.length) {
    throw new BadRequestError('Ключи не должны повторяться в рамках одного товара');
  }
  return uniqueKeys;
};

 // Проверяет глобальную уникальность ключей (что их нет в БД).
 // Выбрасывает ошибку, если хотя бы один ключ уже существует.
export const ensureGlobalUniqueness = async (keys: string[]) => {
  const existing = await findExistingKeys(keys);
  if (existing.length > 0) {
    throw new ConflictError(
      `Ключи уже существуют в системе: ${existing
        .map((k: { keyValue: string }) => k.keyValue)
        .join(', ')}`
    );
  }
};