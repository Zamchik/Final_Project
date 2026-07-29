// Типы для страницы деталей заказа
export interface OrderItem {
  id: number;
  price: string;
  product: {
    id: number;
    title: string;
    price: string;
    imageUrl?: string | null;
  };
  productKey?: {
    id: number;
    keyValue: string;
  };
}

export interface OrderDetails {
  id: number;
  totalPrice: string;
  status: string;
  createdAt: string;
  buyerId: number;
  sellerId: number;
  items: OrderItem[];
}