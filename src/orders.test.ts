import { describe, expect, it } from "vitest";
import { createOrder, type CreateOrderDeps, type Order } from "./orders.js";

function inMemoryDeps(): CreateOrderDeps & { captures: number } {
  const saved: Order[] = [];
  const deps = {
    captures: 0,
    store: {
      findByIdempotencyKey: (key: string) => saved.find((o) => o.idempotencyKey === key),
      save: (order: Order) => void saved.push(order),
    },
    send: async () => {
      deps.captures += 1;
    },
    newOrderId: () => `ord_${saved.length + 1}`,
  };
  return deps;
}

const cart = { id: "cart_1", amountCents: 4990, currency: "USD" };

describe("createOrder", () => {
  it("captures the payment once for a new idempotency key", async () => {
    const deps = inMemoryDeps();

    const order = await createOrder(cart, "key_1", deps);

    expect(order.amountCents).toBe(4990);
    expect(deps.captures).toBe(1);
  });

  // Regression test for #1. A retried checkout must not produce a second capture.
  it("returns the original order and does not capture again on a repeat", async () => {
    const deps = inMemoryDeps();

    const first = await createOrder(cart, "key_1", deps);
    const second = await createOrder(cart, "key_1", deps);

    expect(second.id).toBe(first.id);
    expect(deps.captures).toBe(1);
  });

  it("keeps orders with different keys independent", async () => {
    const deps = inMemoryDeps();

    const first = await createOrder(cart, "key_1", deps);
    const second = await createOrder(cart, "key_2", deps);

    expect(second.id).not.toBe(first.id);
    expect(deps.captures).toBe(2);
  });
});
