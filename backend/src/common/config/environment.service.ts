import { Injectable } from '@nestjs/common';

@Injectable()
export class EnvironmentService {
  get<T = string>(key: string): T | undefined {
    return process.env[key] as T | undefined;
  }
}
