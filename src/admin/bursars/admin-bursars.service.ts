import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Staff } from '../../profile/entities/models/staff.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserAccountsService } from '../accounts/user-accounts.service';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { UpdateStaffDto } from '../dto/update-staff.dto';

const cleared = (value: string | null | undefined) =>
  value === undefined ? undefined : value?.trim() || null;

export type BursarStatus = 'invited' | 'active' | 'removed';

@Injectable()
export class AdminBursarsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly accounts: UserAccountsService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll() {
    // Listed by account, so a bursar without a profile still shows up.
    const bursars = await this.userRepository.find({
      where: { role: UserRole.BURSAR },
      relations: ['staffProfile'],
      order: { createdAt: 'ASC' },
    });
    return bursars.map((b) => this.toView(b));
  }

  async findOne(id: string) {
    return this.toView(await this.findBursar(id));
  }

  // Creates the profile if the bursar doesn't have one yet.
  async update(id: string, dto: UpdateStaffDto) {
    const bursar = await this.findBursar(id);
    await this.dataSource.transaction(async (manager) => {
      if (dto.username !== undefined) {
        await this.accounts.changeUsername(
          bursar.id,
          dto.username.trim(),
          manager,
        );
      }
      const profile =
        bursar.staffProfile ??
        manager.create(Staff, {
          firstName: bursar.username,
          lastName: '',
          user: { id: bursar.id } as User,
        });
      if (dto.firstName !== undefined) profile.firstName = dto.firstName.trim();
      if (dto.lastName !== undefined) profile.lastName = dto.lastName.trim();
      if (dto.email !== undefined) profile.email = cleared(dto.email) ?? null;
      if (dto.phoneNumber !== undefined)
        profile.phoneNumber = cleared(dto.phoneNumber) ?? null;
      await manager.save(profile);
    });
    return this.findOne(id);
  }

  // Returns the temporary password once so the admin can share it.
  async invite(dto: CreateStaffDto) {
    const username = dto.username.trim();
    if (await this.accounts.usernameTaken(username)) {
      throw new ConflictException(`Username ${username} is already in use`);
    }
    const password = this.accounts.generatePassword();
    const passwordHash = await this.accounts.hashPassword(password);

    const id = await this.dataSource.transaction(async (manager) => {
      const user = await manager.save(
        manager.create(User, {
          username,
          password: passwordHash,
          role: UserRole.BURSAR,
        }),
      );
      await manager.save(
        manager.create(Staff, {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: dto.email?.trim() || null,
          phoneNumber: dto.phoneNumber?.trim() || null,
          user,
        }),
      );
      return user.id;
    });

    return { bursar: this.toView(await this.findBursar(id)), password };
  }

  async setPassword(id: string, newPassword: string) {
    const bursar = await this.findBursar(id);
    return this.accounts.setPassword(bursar.id, newPassword);
  }

  async setActive(id: string, isActive: boolean) {
    const bursar = await this.findBursar(id);
    await this.accounts.setActive(bursar.id, isActive);
    return this.toView(await this.findBursar(id));
  }

  async deletePermanently(id: string) {
    const bursar = await this.findBursar(id);
    await this.dataSource.manager.delete(User, { id: bursar.id });
    return { id };
  }

  private async findBursar(id: string) {
    const bursar = await this.userRepository.findOne({
      where: { id, role: UserRole.BURSAR },
      relations: ['staffProfile'],
    });
    if (!bursar) throw new NotFoundException('Bursar not found');
    return bursar;
  }

  private toView(user: User) {
    const profile = user.staffProfile;
    const status: BursarStatus = !user.isActive
      ? 'removed'
      : user.lastLoginAt
        ? 'active'
        : 'invited';
    return {
      id: user.id,
      username: user.username,
      firstName: profile?.firstName ?? user.username,
      lastName: profile?.lastName ?? '',
      email: profile?.email ?? null,
      phoneNumber: profile?.phoneNumber ?? null,
      status,
      lastLoginAt: user.lastLoginAt,
      invitedAt: user.createdAt,
    };
  }
}
