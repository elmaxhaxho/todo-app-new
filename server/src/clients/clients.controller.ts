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

import { ClientsService } from './clients.service';

import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../common/admin.guard';

@Controller('clients')
@UseGuards(AuthGuard, AdminGuard)
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
  ) {}

  @Get()
  getClients(@Req() req: any) {
    return this.clientsService.findAll(
      req.user.workspaceId,
    );
  }

  @Post()
  createClient(
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.clientsService.create(
      body,
      req.user.workspaceId,
    );
  }

  @Put(':id')
  updateClient(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.clientsService.update(
      id,
      body,
      req.user.workspaceId,
    );
  }

  @Delete(':id')
  deleteClient(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.clientsService.delete(
      id,
      req.user.workspaceId,
    );
  }
}