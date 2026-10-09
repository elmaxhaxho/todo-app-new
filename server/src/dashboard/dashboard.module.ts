import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

import {
  Project,
  ProjectSchema,
} from '../projects/projects.schema';

import {
  Task,
  TaskSchema,
} from '../tasks/tasks.schema';

import {
  Client,
  ClientSchema,
} from '../clients/clients.schema';

import {
  User,
  UserSchema,
} from '../users/users.schema';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,

    MongooseModule.forFeature([
      {
        name: Project.name,
        schema: ProjectSchema,
      },
      {
        name: Task.name,
        schema: TaskSchema,
      },
      {
        name: Client.name,
        schema: ClientSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],

  controllers: [
    DashboardController,
  ],

  providers: [
    DashboardService,
  ],
})
export class DashboardModule {}