import type { User } from "../services/authService";
import { authSessionStore } from "../services/authSessionStore";
import { ObserverSubject } from "../patterns/observer";

export type UserUpdatedListener = (user: User | null) => void;

const parseStoredUser = (): User | null => authSessionStore.getUser();

const userObserver = new ObserverSubject<User | null>();

export const subscribeUserUpdated = (
  listener: UserUpdatedListener,
): (() => void) => userObserver.subscribe(listener);

export const notifyUserUpdated = (user?: User | null): void => {
  const nextUser = user === undefined ? parseStoredUser() : user;
  userObserver.notify(nextUser ?? null);
};
