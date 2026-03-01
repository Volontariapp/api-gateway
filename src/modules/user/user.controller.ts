import { Controller, Get, Inject, OnModuleInit, Param } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

interface UserServiceClient {
  findOne(data: { id: string }): Observable<any>;
}

@Controller('users')
export class UserController implements OnModuleInit {
  private userService: UserServiceClient;

  constructor(@Inject('USER_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceClient>('UserService');
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.userService.findOne({ id });
  }
}
