// The controllers, services and middlewares are typed with Express's Request
// and Response. The unit tests call them with small hand-written mocks, so this
// view of a handler accepts any req / res / next.
type MockHandler = (req: unknown, res: unknown, next: unknown) => Promise<void>;

const asMockHandler = (handler: unknown) => handler as MockHandler;

export { asMockHandler };
export type { MockHandler };
