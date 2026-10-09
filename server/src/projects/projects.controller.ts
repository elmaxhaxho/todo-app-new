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

import { ProjectsService } from './projects.service';

import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../common/admin.guard';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
  ) {}

  @Get()
  getProjects(@Req() req: any) {
    return this.projectsService.getProjects(
      req.user,
    );
  }

  @Get('archive')
  getArchive(@Req() req: any) {
    return this.projectsService.getArchive(
      req.user,
    );
  }

  @Post()
  @UseGuards(AdminGuard)
  createProject(
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.projectsService.create(
      body,
      req.user,
    );
  }

  @Put(':projectId')
  @UseGuards(AdminGuard)
  updateProject(
    @Param('projectId') projectId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.projectsService.update(
      projectId,
      body,
      req.user,
    );
  }

  @Put(':projectId/archive')
  @UseGuards(AdminGuard)
  archiveProject(
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    return this.projectsService.archive(
      projectId,
      req.user,
    );
  }

  @Put(':projectId/restore')
  @UseGuards(AdminGuard)
  restoreProject(
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    return this.projectsService.restore(
      projectId,
      req.user,
    );
  }

  @Delete(':projectId')
  @UseGuards(AdminGuard)
  deleteProject(
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    return this.projectsService.delete(
      projectId,
      req.user,
    );
  }
}