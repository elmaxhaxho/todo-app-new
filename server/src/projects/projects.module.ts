import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ProjectsController,
} from './projects.controller';

import {
  ProjectsService,
} from './projects.service';

import {
  Project,
  ProjectSchema,
} from './projects.schema';

import {
  Task,
  TaskSchema,
} from '../tasks/tasks.schema';

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
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],

  controllers: [
    ProjectsController,
  ],

  providers: [
    ProjectsService,
  ],
})
export class ProjectsModule {}