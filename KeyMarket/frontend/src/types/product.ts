// Типы, относящиеся к товарам и категориям

// Категория товара, получаемая с бэкенда
export interface Category {
  id: number;
  name: string;
}

// Значения полей формы создания/редактирования товара
export interface FormValues {
  title: string;
  description?: string;
  price: number;
  categoryId: number;
  status?: string;
  keys?: string;
  newKeys?: string;
}