// Типы, относящиеся к товарам и категориям, используемые в сущности Product.
// Вынесены сюда, чтобы избежать дублирования в разных компонентах.

// Категория товара.
export interface Category {
    id: number;
    name: string;
    slug: string;
}

// Интерфейс товара для отображения в карточке (каталог, главная, избранное).
export interface Product {
    id: number;
    title: string;
    price: string;
    imageUrl: string | null;
    productType?: 'GAME' | 'DLC';
    category?: { name: string };
    sales?: number;
}

// Значения полей формы создания/редактирования товара.
export interface FormValues {
    title: string;
    description?: string;
    price: number;
    categoryId: number;
    status?: string;
    keys?: string;
    newKeys?: string;
    productType?: 'GAME' | 'DLC';
}