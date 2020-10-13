export class Stack<V> {
  constructor(public head: V, public tail: Stack<V> | null = null) {}
}
