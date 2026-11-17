/** Thrown by stubs for AI features that aren't wired up yet. The UI shows the message as-is. */
export class NotConnectedError extends Error {
  override readonly name: string = "NotConnectedError";

  constructor(message: string) {
    super(message);
  }
}

export const notConnected = (feature: string) => new NotConnectedError(`${feature} isn't connected yet.`);
