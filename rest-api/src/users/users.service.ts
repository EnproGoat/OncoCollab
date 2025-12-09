import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import * as argon2 from "argon2";
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>) { }

    async create(createUserDto: CreateUserDto) {
        createUserDto.password = await argon2.hash(createUserDto.password);
        const createdUser = new this.userModel(createUserDto)
        return createdUser.save();
    }

    findAll() {
        // à faire si on veut un panel admin de l'app
        return;
    }

    findOne(id: string) {
        return this.userModel.findById(id).exec();
    }

    findByEmail(email: string) {
        return this.userModel.findOne({ email }).exec();
    }

    update(id: string, updateUserDto: UpdateUserDto) {
        return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
    }

    remove(id: string) {
        return this.userModel.findByIdAndDelete(id).exec();
    }
}
