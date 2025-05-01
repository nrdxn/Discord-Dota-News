import { DotaModel } from './models/Central';
import { Dota } from '@/app/services/dota/database/models/Dota';
import { ChangeEnablingDto } from '@/app/services/dota/dto/ChangeEnablingDto';
import { SetChannelDto } from '@/app/services/dota/dto/SetChannelDto';
import { UpdateTgChannelsDto } from '@/app/services/dota/dto/UpdateTgChannelsDto';
import { MarciClient } from '@/core/client/ClientClass';
import { LogLevel } from '@/enums/LogLevel';
import { DocumentType } from '@typegoose/typegoose';
import { Collection } from 'discord.js';

export class DotaDatabaseMethods {
    public readonly cache: Collection<string, DocumentType<Dota>> =
        new Collection();

    constructor(private client: MarciClient) {}

    public async init() {
        const allGuildsInDb = await DotaModel.find();

        for (let i = 0; i < allGuildsInDb.length; i++) {
            const doc = allGuildsInDb[i];
            this.cache.set(doc.guild, doc);
        }
    }

    public async findGuildById(guildId: string) {
        let guild =
            this.cache.get(guildId) ??
            (await DotaModel.findOne({ guild: guildId })) ??
            (await DotaModel.create({ guild: guildId }));

        this.cache.set(guildId, guild);
        return guild;
    }

    public async changeEnabling(dto: ChangeEnablingDto) {
        const guild = await this.findGuildById(dto.guildId);

        switch (dto.type) {
            case 'Post':
                guild.isEnabledPosting = !guild.isEnabledPosting;
                break;
            case 'Comments':
                guild.isEnabledComments = !guild.isEnabledComments;
                break;
            case 'Webhook':
                guild.isEnabledWebhook = !guild.isEnabledWebhook;
                break;
        }
        await this.save(guild);

        return guild;
    }

    public async updateTgChannels(dto: UpdateTgChannelsDto) {
        const guild = await this.findGuildById(dto.guildId);
        const sortedChannels = this.resolveChannels(guild!, dto.channels);

        guild.tgChannels = [
            ...guild.tgChannels.filter(
                (channel) => !sortedChannels.channelsForRemove.includes(channel)
            ),
            ...sortedChannels.channelsForPush
        ];
        await this.save(guild);

        return {
            sortedChannels,
            guild
        };
    }

    public async setChannelForPosting(dto: SetChannelDto) {
        const guild = await this.findGuildById(dto.guildId);

        guild.channelForPosting = dto.channelId;
        await this.save(guild);

        return guild;
    }

    public async save(doc: DocumentType<Dota>) {
        await doc.save().catch(() => {
            this.client.logger.log(
                LogLevel.ERROR,
                `Не удалось сохранить гильдию ${doc.guild}`
            );
        });
        this.cache.set(doc.guild, doc);
    }

    private resolveChannels(dto: DocumentType<Dota>, channels: string[]) {
        return {
            channelsForRemove: channels.filter((channel) =>
                dto.tgChannels.includes(channel)
            ),
            channelsForPush: channels.filter(
                (channel) => !dto.tgChannels.includes(channel)
            )
        };
    }
}
