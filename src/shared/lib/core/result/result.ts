export class Result<T, E = string> {
  private constructor(
    private readonly _value: T | null,
    private readonly _error: E | null,
  ) {}

  isSuccess(): this is Result<T, null> {
    return this._error === null;
  }

  isFailure(): this is Result<null, E> {
    return this._error !== null;
  }

  get value(): T {
    if (!this.isSuccess()) {
      throw new Error('Cannot get value of a failed result');
    }
    return this._value as T;
  }

  get error(): E {
    if (!this.isFailure()) {
      throw new Error('Cannot get error of a successful result');
    }
    return this._error as E;
  }

  match<U>(options: {
    onSuccess: (value: T) => U;
    onFailure: (error: E) => U;
  }): U {
    if (this.isSuccess()) {
      return options.onSuccess(this._value as T);
    }
    return options.onFailure(this._error as E);
  }

  static ok<T>(data: T): Result<T, null> {
    return new Result<T, null>(data, null);
  }

  static fail<E>(error: E): Result<null, E> {
    return new Result<null, E>(null, error);
  }
}

export type Either<T, E> = Result<T, null> | Result<null, E>;
