export const enum TransportOptions {
  /**
   * Write Message and wait confirm from client, keep the order (Slow)
   */
  Confirm = 0,

  /**
   * Write Message without confirm from client, does not guarantee the order (Fast)
   */
  Transfer = 1,
}
