import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';

import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../common/admin.guard';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @UseGuards(AdminGuard)
  getUsers(@Req() req: any) {
    return this.usersService.findAll(
      req.user.workspaceId,
    );
  }

  @Post()
  @UseGuards(AdminGuard)
  createUser(
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.usersService.create(
      body,
      req.user.workspaceId,
    );
  }

  @Put('profile')
  updateProfile(
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.usersService.updateProfile(
      req.user,
      body,
    );
  }

  @Put(':id/role')
  @UseGuards(AdminGuard)
  changeRole(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.usersService.changeRole(
      id,
      body.role,
      req.user,
    );
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  deleteUser(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.usersService.delete(
      id,
      req.user,
    );
  }
}