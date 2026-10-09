import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import * as bcrypt from 'bcrypt';

import {
  User,
  UserDocument,
} from './users.schema';

import {
  Project,
  ProjectDocument,
} from '../projects/projects.schema';

import {
  Task,
  TaskDocument,
} from '../tasks/tasks.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,

    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
  ) {}

  async findAll(workspaceId: any) {
    const users =
      await this.userModel
        .find({ workspaceId })
        .select('-password')
        .sort({ createdAt: -1 })
        .lean();

    return users.map((user: any) => ({
      ...user,
      role: user.role || 'employee',
    }));
  }

  async create(
    body: any,
    workspaceId: any,
  ) {
    const name =
      String(body.name || '').trim();

    const email =
      String(body.email || '')
        .trim()
        .toLowerCase();

    const password =
      String(body.password || '');

    const role =
      body.role === 'admin'
        ? 'admin'
        : 'employee';

    if (!name || !email || !password) {
      throw new BadRequestException(
        'Name, email, and password are required.',
      );
    }

    if (password.length < 6) {
      throw new BadRequestException(
        'Password must be at least 6 characters.',
      );
    }

    const existingUser =
      await this.userModel.findOne({ email });

    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists.',
      );
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    const user =
      await this.userModel.create({
        name,
        email,
        password: hashedPassword,
        role,
        workspaceId,
      });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
    };
  }

  async updateProfile(
    currentUser: any,
    body: any,
  ) {
    const name =
      String(body.name || '').trim();

    const email =
      String(body.email || '')
        .trim()
        .toLowerCase();

    const newPassword =
      String(body.password || '');

    if (!name || !email) {
      throw new BadRequestException(
        'Name and email are required.',
      );
    }

    const existingEmailUser =
      await this.userModel.findOne({
        email,
        _id: {
          $ne: currentUser._id,
        },
      });

    if (existingEmailUser) {
      throw new ConflictException(
        'Another account already uses this email.',
      );
    }

    const user =
      await this.userModel.findById(
        currentUser._id,
      );

    if (!user) {
      throw new NotFoundException(
        'User not found.',
      );
    }

    user.name = name;
    user.email = email;

    if (newPassword) {
      if (newPassword.length < 6) {
        throw new BadRequestException(
          'Password must be at least 6 characters.',
        );
      }

      user.password =
        await bcrypt.hash(
          newPassword,
          12,
        );
    }

    await user.save();

    return {
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
      },
    };
  }

  async changeRole(
    id: string,
    role: string,
    currentUser: any,
  ) {
    if (
      !['admin', 'employee'].includes(role)
    ) {
      throw new BadRequestException(
        'Invalid role.',
      );
    }

    if (
      id === currentUser._id.toString() &&
      role !== 'admin'
    ) {
      throw new BadRequestException(
        'You cannot remove your own admin role.',
      );
    }

    const user =
      await this.userModel
        .findOneAndUpdate(
          {
            _id: id,
            workspaceId:
              currentUser.workspaceId,
          },
          { role },
          { new: true },
        )
        .select('-password');

    if (!user) {
      throw new NotFoundException(
        'User not found.',
      );
    }

    return user;
  }

  async delete(
    id: string,
    currentUser: any,
  ) {
    if (
      id === currentUser._id.toString()
    ) {
      throw new BadRequestException(
        'You cannot delete your own account.',
      );
    }

    const user =
      await this.userModel.findOne({
        _id: id,
        workspaceId:
          currentUser.workspaceId,
      });

    if (!user) {
      throw new NotFoundException(
        'User not found.',
      );
    }

    await this.projectModel.updateMany(
      {
        workspaceId:
          currentUser.workspaceId,
        members: user._id,
      },
      {
        $pull: {
          members: user._id,
        },
      },
    );

    await this.taskModel.updateMany(
      {
        workspaceId:
          currentUser.workspaceId,
        assignedTo: user._id,
      },
      {
        $set: {
          assignedTo: null,
        },
      },
    );

    await this.userModel.findByIdAndDelete(
      user._id,
    );

    return {
      message: 'User deleted successfully.',
    };
  }
}