import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from '../users/users.schema';
import { Project, ProjectDocument } from '../projects/projects.schema';
import { Task, TaskDocument } from '../tasks/tasks.schema';
import { Client, ClientDocument } from '../clients/clients.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,

    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,

    @InjectModel(Client.name)
    private readonly clientModel: Model<ClientDocument>,

    private readonly jwtService: JwtService,
  ) {}

  async signup(body: any) {
    const name = String(body.name || '').trim();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();

    const password = String(body.password || '');

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

    const existingUser = await this.userModel.findOne({ email });

    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists.',
      );
    }

    const workspaceId = new Types.ObjectId();
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      workspaceId,
    });

    const token = this.createToken(user);

    return {
      message: 'Admin account created successfully.',
      token,
      user: this.userResponse(user),
    };
  }

  async login(body: any) {
    const email = String(body.email || '')
      .trim()
      .toLowerCase();

    const password = String(body.password || '');

    if (!email || !password) {
      throw new BadRequestException(
        'Please provide both email and password.',
      );
    }

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid email.');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid password.');
    }

    if (!user.role) {
      user.role = 'admin';
    }

    await this.ensureWorkspace(user);
    await user.save();

    const token = this.createToken(user);

    return {
      message: 'Login successful.',
      token,
      user: this.userResponse(user),
    };
  }

  createToken(user: UserDocument) {
    return this.jwtService.sign({
      id: user._id.toString(),
      email: user.email,
      workspaceId: user.workspaceId?.toString(),
    });
  }

  userResponse(user: UserDocument) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'admin',
      workspaceId: user.workspaceId,
    };
  }

  async validateToken(token: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(token);
      const user = await this.userModel.findById(decoded.id);

      if (!user) {
        throw new UnauthorizedException('User account no longer exists.');
      }

      if (!user.role) {
        user.role = 'admin';
      }

      await this.ensureWorkspace(user);
      await user.save();

      user.password = undefined as any;

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired session.');
    }
  }

  async ensureWorkspace(user: UserDocument) {
    if (user.workspaceId) {
      return user;
    }

    let workspaceId: Types.ObjectId;

    const existingWorkspaceUser = await this.userModel.findOne({
      workspaceId: {
        $exists: true,
        $ne: null,
      },
    });

    if (existingWorkspaceUser?.workspaceId) {
      workspaceId = existingWorkspaceUser.workspaceId;
    } else {
      workspaceId = new Types.ObjectId();
    }

    await this.userModel.updateMany(
      { workspaceId: { $exists: false } },
      { $set: { workspaceId } },
    );

    await this.userModel.updateMany(
      { workspaceId: null },
      { $set: { workspaceId } },
    );

    await this.projectModel.updateMany(
      { workspaceId: { $exists: false } },
      { $set: { workspaceId } },
    );

    await this.taskModel.updateMany(
      { workspaceId: { $exists: false } },
      { $set: { workspaceId } },
    );

    await this.clientModel.updateMany(
      { workspaceId: { $exists: false } },
      { $set: { workspaceId } },
    );

    user.workspaceId = workspaceId;

    return user;
  }
}


