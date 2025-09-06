import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { EventPublisherService } from '../../common/services/event-publisher.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FollowUserInput } from './dto/follow-user.input';

@Injectable()
export class FollowsService {
  constructor(
    private prisma: PrismaService,
    private eventPublisher: EventPublisherService,
    private notificationsService: NotificationsService,
  ) {}

  async follow(followUserInput: FollowUserInput, followerId: string) {
    // Check if user is trying to follow themselves
    if (followerId === followUserInput.followingId) {
      throw new ForbiddenException('You cannot follow yourself');
    }

    // Check if the user to follow exists
    const userToFollow = await this.prisma.user.findUnique({
      where: { id: followUserInput.followingId },
    });

    if (!userToFollow) {
      throw new NotFoundException('User to follow not found');
    }

    // Check if already following
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: followUserInput.followingId,
        },
      },
    });

    if (existingFollow) {
      throw new ConflictException('You are already following this user');
    }

    const follow = await this.prisma.follow.create({
      data: {
        followerId,
        followingId: followUserInput.followingId,
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
          },
        },
        following: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Publish user followed event
    await this.eventPublisher.publishUserFollowed({
      followerId: follow.followerId,
      followingId: follow.followingId,
      userId: followerId,
      follower: {
        id: follow.follower.id,
        username: follow.follower.username,
      },
      following: {
        id: follow.following.id,
        username: follow.following.username,
      },
    });

    // Create notification for the user being followed
    await this.notificationsService.createFollowNotification(
      followerId,
      followUserInput.followingId,
    );

    return follow;
  }

  async unfollow(followingId: string, followerId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!follow) {
      throw new NotFoundException('You are not following this user');
    }

    return this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  async getFollowers(userId: string, skip?: number, take?: number) {
    return this.prisma.follow.findMany({
      where: { followingId: userId },
      skip,
      take,
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            _count: {
              select: {
                recipes: true,
                followers: true,
                following: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getFollowing(userId: string, skip?: number, take?: number) {
    return this.prisma.follow.findMany({
      where: { followerId: userId },
      skip,
      take,
      include: {
        following: {
          select: {
            id: true,
            username: true,
            _count: {
              select: {
                recipes: true,
                followers: true,
                following: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async isFollowing(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }

  async getFollowStats(userId: string) {
    const [followersCount, followingCount] = await Promise.all([
      this.prisma.follow.count({
        where: { followingId: userId },
      }),
      this.prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      followersCount,
      followingCount,
    };
  }
}
