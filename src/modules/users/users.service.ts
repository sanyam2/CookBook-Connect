import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserInput: CreateUserInput) {
    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: createUserInput.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: createUserInput.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    return this.prisma.user.create({
      data: createUserInput,
      include: {
        recipes: {
          include: {
            ratings: true,
            comments: true,
          },
        },
        followers: {
          include: {
            follower: true,
          },
        },
        following: {
          include: {
            following: true,
          },
        },
      },
    });
  }

  async findAll(skip?: number, take?: number) {
    return this.prisma.user.findMany({
      skip,
      take,
      include: {
        recipes: {
          include: {
            ratings: true,
            comments: true,
          },
        },
        followers: {
          include: {
            follower: true,
          },
        },
        following: {
          include: {
            following: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        recipes: {
          include: {
            ratings: true,
            comments: true,
            ingredients: true,
            instructions: true,
          },
        },
        followers: {
          include: {
            follower: true,
          },
        },
        following: {
          include: {
            following: true,
          },
        },
        ratings: {
          include: {
            recipe: true,
          },
        },
        comments: {
          include: {
            recipe: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: {
        recipes: {
          include: {
            ratings: true,
            comments: true,
          },
        },
        followers: {
          include: {
            follower: true,
          },
        },
        following: {
          include: {
            following: true,
          },
        },
      },
    });
  }

  async update(id: string, updateUserInput: UpdateUserInput) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being updated and if it already exists
    if (updateUserInput.email && updateUserInput.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserInput.email },
      });
      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check if username is being updated and if it already exists
    if (
      updateUserInput.username &&
      updateUserInput.username !== existingUser.username
    ) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: updateUserInput.username },
      });
      if (usernameExists) {
        throw new ConflictException('Username already exists');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserInput,
      include: {
        recipes: {
          include: {
            ratings: true,
            comments: true,
          },
        },
        followers: {
          include: {
            follower: true,
          },
        },
        following: {
          include: {
            following: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }

  // Additional methods for complex queries
  async getUsersWithMostRecipes(limit: number = 10) {
    return this.prisma.user.findMany({
      take: limit,
      include: {
        recipes: true,
        _count: {
          select: {
            recipes: true,
          },
        },
      },
      orderBy: {
        recipes: {
          _count: 'desc',
        },
      },
    });
  }

  async getUsersWithMostFollowers(limit: number = 10) {
    return this.prisma.user.findMany({
      take: limit,
      include: {
        followers: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      orderBy: {
        followers: {
          _count: 'desc',
        },
      },
    });
  }

  async searchUsers(query: string, skip?: number, take?: number) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      skip,
      take,
      include: {
        recipes: {
          include: {
            ratings: true,
            comments: true,
          },
        },
        followers: {
          include: {
            follower: true,
          },
        },
        following: {
          include: {
            following: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
