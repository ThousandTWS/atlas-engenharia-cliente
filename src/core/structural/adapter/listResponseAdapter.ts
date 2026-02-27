export interface Adapter<TInput, TOutput> {
  adapt(input: TInput): TOutput;
}

interface PaginatedLike<T> {
  content?: T[];
}

class ArrayOrPaginatedAdapter<T> implements Adapter<unknown, T[]> {
  adapt(input: unknown): T[] {
    if (Array.isArray(input)) {
      return input as T[];
    }

    if (input && typeof input === 'object' && 'content' in input) {
      const content = (input as PaginatedLike<T>).content;
      return Array.isArray(content) ? content : [];
    }

    return [];
  }
}

export const adaptListResponse = <T>(input: unknown): T[] =>
  new ArrayOrPaginatedAdapter<T>().adapt(input);
