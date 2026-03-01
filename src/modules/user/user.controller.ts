import {
  Controller,
  Delete,
  Inject,
  OnModuleInit,
  Param,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { USER_SERVICE_NAME, UserServiceClient } from '@volontariapp/contracts';
import { USER_PACKAGE } from '../../grpc/grpc-packages.js';

@Controller('users')
export class UserController implements OnModuleInit {
  private userService!: UserServiceClient;

  constructor(@Inject(USER_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.userService =
      this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser({ id });
  }
}
