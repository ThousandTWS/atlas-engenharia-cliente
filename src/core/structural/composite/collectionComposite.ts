export interface CollectionComponent<T> {
  toArray(): T[];
}

export class CollectionLeaf<T> implements CollectionComponent<T> {
  private readonly items: T[];

  constructor(items: T[]) {
    this.items = items;
  }

  toArray(): T[] {
    return this.items;
  }
}

export class CollectionComposite<T> implements CollectionComponent<T> {
  private readonly children: CollectionComponent<T>[] = [];

  add(component: CollectionComponent<T>): void {
    this.children.push(component);
  }

  toArray(): T[] {
    return this.children.flatMap((child) => child.toArray());
  }
}
