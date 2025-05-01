import { DotaDatabaseMethods } from '@/app/services/dota/database/DotaDatabaseMethods';
import { MarciClient } from '@/core/client/ClientClass';
import { LogLevel } from '@/enums/LogLevel';
import mongoose, { ConnectOptions } from 'mongoose';

export class DatabaseService {
    public readonly dota: DotaDatabaseMethods;

    constructor(private client: MarciClient) {
        this.dota = new DotaDatabaseMethods(client);
    }

    async connect(options: ConnectOptions) {
        await mongoose
            .connect(process.env['DATABASE_URL']!, options)
            .then(() =>
                this.client.logger.log(
                    LogLevel.INFO,
                    'Успешное подключение к базе данных'
                )
            );

        await this.dota
            .init()
            .then(() =>
                this.client.logger.log(
                    LogLevel.INFO,
                    'Проинициализирован кэш базы данных'
                )
            );

        await this.client.services.methods.parser
            .initCache()
            .then(() =>
                this.client.logger.log(
                    LogLevel.INFO,
                    'Проинициализирован кэш тг каналов'
                )
            );
    }
}
