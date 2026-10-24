import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator.js';
import { DemoService } from './demo.service.js';

@Public()
@Controller('demo')
export class DemoController {
  constructor(private readonly demo: DemoService) {}

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  reset(): Promise<{ users: string[]; password: string }> {
    return this.demo.resetDemo();
  }
}
