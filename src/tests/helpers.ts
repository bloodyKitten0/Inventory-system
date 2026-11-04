type MockHandler = (req: unknown, res: unknown, next: unknown) => Promise<void>;

const asMockHandler = (handler: unknown) => handler as MockHandler;

export { asMockHandler };
export type { MockHandler };
