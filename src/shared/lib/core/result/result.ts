export class Result<T, E = string> {
  private constructor(
    private readonly _value: T | null,
    private readonly _error: E | null,
  ) {}

  isSuccess(): boolean {
    return this._error === null;
  }

  isFailure(): boolean {
    return this._error !== null;
  }

  get value(): T {
    if (this._error !== null) {
      throw new Error('Cannot get value of a failed result');
    }
    return this._value as T;
  }

  get error(): E {
    if (this._error === null) {
      throw new Error('Cannot get error of a successful result');
    }
    return this._error as E;
  }

  match<U>(options: {
    onSuccess: (value: T) => U;
    onFailure: (error: E) => U;
  }): U {
    if (this._error === null) {
      return options.onSuccess(this._value as T);
    }
    return options.onFailure(this._error as E);
  }

  static ok<T, E = never>(data: T): Result<T, E> {
    return new Result<T, E>(data, null);
  }

  static fail<E, T = never>(error: E): Result<T, E> {
    return new Result<T, E>(null, error);
  }
}

export type Either<T, E> = Result<T, E>;
