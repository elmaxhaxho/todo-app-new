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

import { TasksService } from './tasks.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../common/admin.guard';

@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('archived')
  getArchived(@Req() req: any) {
    return this.tasksService.getArchived(req.user);
  }

  @Post()
  @UseGuards(AdminGuard)
  createTask(@Body() body: any, @Req() req: any) {
    return this.tasksService.create(body, req.user);
  }

  @Put(':taskId')
  updateTask(
    @Param('taskId') taskId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.tasksService.update(taskId, body, req.user);
  }

  @Put(':taskId/archive')
  @UseGuards(AdminGuard)
  archiveTask(@Param('taskId') taskId: string, @Req() req: any) {
    return this.tasksService.archive(taskId, req.user);
  }

  @Put(':taskId/restore')
  @UseGuards(AdminGuard)
  restoreTask(@Param('taskId') taskId: string, @Req() req: any) {
    return this.tasksService.restore(taskId, req.user);
  }

  @Delete(':taskId')
  @UseGuards(AdminGuard)
  deleteTask(@Param('taskId') taskId: string, @Req() req: any) {
    return this.tasksService.delete(taskId, req.user);
  }
}
