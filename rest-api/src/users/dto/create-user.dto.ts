import { IsString, IsNotEmpty, IsEmail, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    fistName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsString()
    @IsNotEmpty()
    job: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsBoolean()
    @IsOptional()
    isAdmin?: boolean;
}
