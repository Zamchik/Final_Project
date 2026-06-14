// Валидатор для поля ключей (формат, дубликаты, обязательность)

import { KEY_PATTERN } from '../constants/validation';

/**
 * Кастомный валидатор для поля ключей.
 * Проверяет:
 *   1. Наличие хотя бы одного ключа.
 *   2. Формат каждого ключа (XXXXX-XXXXX-XXXXX).
 *   3. Отсутствие дубликатов.
 */
export const validateKeys = (_: unknown, value: string | undefined) => {
  if (!value || !value.trim()) {
    return Promise.reject(new Error('Добавьте хотя бы один ключ'));
  }

  // Разбиваем строку на массив ключей, удаляем пустые
  const keys = value
    .split('\n')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  // Проверка формата
  const invalidKeys: string[] = [];
  keys.forEach((key) => {
    if (!KEY_PATTERN.test(key)) {
      invalidKeys.push(key);
    }
  });
  if (invalidKeys.length > 0) {
    return Promise.reject(
      new Error(
        `Некорректные ключи: ${invalidKeys.join(', ')}. Ожидаемый формат: XXXXX-XXXXX-XXXXX`
      )
    );
  }

  // Проверка на дубликаты
  const seen = new Set<string>();
  const duplicates: string[] = [];
  keys.forEach((key) => {
    if (seen.has(key)) {
      duplicates.push(key);
    } else {
      seen.add(key);
    }
  });
  if (duplicates.length > 0) {
    return Promise.reject(
      new Error(`Обнаружены повторяющиеся ключи: ${duplicates.join(', ')}`)
    );
  }

  return Promise.resolve();
};