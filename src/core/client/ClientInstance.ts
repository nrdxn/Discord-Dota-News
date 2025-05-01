import { LogLevel } from '@/enums/LogLevel';
import { MarciClient } from '@/core/client/ClientClass';

export const client = new MarciClient();

export const start = () => {
    client.logger.listen();
    client.login(process.env['BOT_TOKEN']).then(async () => {
        client.logger.log(
            LogLevel.INFO,
            `Клиент запущен на кластере #${client.cluster.id + 1}`
        );

        await client.services.database.connect({
            serverSelectionTimeoutMS: 20000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000
        });

        client.events.load();
        client.components.load();
        client.commands.load();
    });
};
