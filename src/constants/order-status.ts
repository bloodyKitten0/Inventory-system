const ORDER_STATUSES = [
  "pending",
  "processing",
  "completed",
  "cancelled",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

export { ORDER_STATUSES };
export type { OrderStatus };
