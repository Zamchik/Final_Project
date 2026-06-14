// Компонент визуального отображения списка ключей с индикаторами валидности

import { Typography } from 'antd';
import { KEY_PATTERN } from '../constants/validation';

const { Text } = Typography;

interface KeyPreviewListProps {
  keys: string[];
}

/**
 * Отображает список ключей с цветными точками:
 * - зелёная — ключ соответствует формату XXXXX-XXXXX-XXXXX
 * - красная — ключ невалиден
 */
export const KeyPreviewList = ({ keys }: KeyPreviewListProps) => {
  if (keys.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      {keys.map((key, idx) => {
        const isValid = KEY_PATTERN.test(key);
        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 0',
            }}
          >
            {/* Индикатор валидности */}
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isValid ? '#52c41a' : '#ff4d4f',
                display: 'inline-block',
              }}
            />
            <Text
              style={{
                color: isValid ? '#52c41a' : '#ff4d4f',
                fontFamily: 'monospace',
              }}
            >
              {key}
            </Text>
            {!isValid && (
              <Text type="danger" style={{ fontSize: 12 }}>
                Неверный формат
              </Text>
            )}
          </div>
        );
      })}
    </div>
  );
};