import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export abstract class PrismaRepository {
  protected handleAndThrowError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new Error(error.message);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error(`Database error [${error.code}]: ${error.message}`);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(String(error));
  }
}
