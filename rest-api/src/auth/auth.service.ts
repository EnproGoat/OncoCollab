import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthDto } from './dto/auth.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService) { }

    async register(createUserDto: CreateUserDto) {
        const userExists = await this.usersService.findByEmail(createUserDto.email);
        if (userExists) {
            throw new BadRequestException('User already exists');
        }
        return this.usersService.create(createUserDto);
    }

    async login(authDto: AuthDto) {
        const user = await this.usersService.findByEmail(authDto.email);
        if (!user) {
            throw new UnauthorizedException('Access Denied');
        }

        const passwordMatches = await argon2.verify(user.password, authDto.password);
        if (!passwordMatches) {
            throw new UnauthorizedException('Access Denied: Invalid password');
        }

        return user;
    }
}
