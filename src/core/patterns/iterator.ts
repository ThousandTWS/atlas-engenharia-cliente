export interface ResettableIterator<T> {
  hasNext(): boolean;
  next(): T | undefined;
  reset(): void;
}

export class ArrayIterator<T> implements ResettableIterator<T> {
  private readonly items: readonly T[];

  private index = 0;

  constructor(items: readonly T[]) {
    this.items = items;
  }

  hasNext(): boolean {
    return this.index < this.items.length;
  }

  next(): T | undefined {
    if (!this.hasNext()) {
      return undefined;
    }

    const item = this.items[this.index];
    this.index += 1;
    return item;
  }

  reset(): void {
    this.index = 0;
  }
}

export const createArrayIterator = <T>(
  items: readonly T[],
): ResettableIterator<T> => new ArrayIterator(items);
