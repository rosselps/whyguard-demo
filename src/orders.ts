import { capturePayment } from "./payments.js";

export type Cart = { id: string; amountCents: number; currency: string };

export type Order = {
  id: string;
  cartId: string;
  amountCents: number;
  idempotencyKey: string;
};

export type OrderStore = {
  findByIdempotencyKey(key: string): Order | undefined;
  save(order: Order): void;
};

export type CreateOrderDeps = {
  store: OrderStore;
  send: (amountCents: number, currency: string, key: string) => Promise<void>;
  newOrderId: () => string;
};

/** Creates the order for a cart and captures the payment. */
export async function createOrder(
  cart: Cart,
  idempotencyKey: string,
  deps: CreateOrderDeps,
): Promise<Order> {
  const order: Order = {
    id: deps.newOrderId(),
    cartId: cart.id,
    amountCents: cart.amountCents,
    idempotencyKey,
  };

  await capturePayment(cart.amountCents, cart.currency, idempotencyKey, deps.send);
  deps.store.save(order);
  return order;
}
