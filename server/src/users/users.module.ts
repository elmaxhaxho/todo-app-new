import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

import {
  User,
  UserSchema,
} from './users.schema';

import {
  Project,
  ProjectSchema,
} from '../projects/projects.schema';

import {
  Task,
  TaskSchema,
} from '../tasks/tasks.schema';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,

    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Project.name,
        schema: ProjectSchema,
      },
      {
        name: Task.name,
        schema: TaskSchema,
      },
    ]),
  ],

  controllers: [UsersController],

  providers: [UsersService],
})
export class UsersModule {}