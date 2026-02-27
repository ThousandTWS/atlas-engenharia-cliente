export type ObserverListener<TPayload> = (payload: TPayload) => void;

export class ObserverSubject<TPayload> {
  private listeners = new Set<ObserverListener<TPayload>>();

  subscribe(listener: ObserverListener<TPayload>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(payload: TPayload): void {
    for (const listener of this.listeners) {
      listener(payload);
    }
  }
}
