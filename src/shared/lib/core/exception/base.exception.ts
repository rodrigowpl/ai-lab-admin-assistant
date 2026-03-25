export abstract class BaseException {
  readonly status: number = 500;
  readonly name: string;

  constructor(
    readonly message: string,
    readonly details: string[] = [],
  ) {
    this.name = this.constructor.name;
  }
}

export class BadRequestException extends BaseException {
  override readonly status = 400;

  constructor(message: string, details: string[] = []) {
    super(message, details);
  }
}

export class NotFoundException extends BaseException {
  override readonly status = 404;

  constructor(message: string, details: string[] = []) {
    super(message, details);
  }
}

export class ConflictException extends BaseException {
  override readonly status = 409;

  constructor(message: string, details: string[] = []) {
    super(message, details);
  }
}

export class InternalServerException extends BaseException {
  override readonly status = 500;

  constructor(message: string, details: string[] = []) {
    super(message, details);
  }
}
