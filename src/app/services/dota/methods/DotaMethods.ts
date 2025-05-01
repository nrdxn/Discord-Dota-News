import { MarciClient } from '@/core/client/ClientClass';
import { LogLevel } from '@/enums/LogLevel';
import { ChannelInfoDto } from '@/services/telegram/dto/ChannelInfoDto';
import { BaseGuildTextChannel } from 'discord.js';

export class DotaMethods {
    constructor(private client: MarciClient) {}

    public async posting() {
        const guildsCache = this.client.services.database.dota.cache;

        for (const [_, guild] of guildsCache) {
            if (guild.isEnabledPosting) {
                for (const channel of guild.tgChannels) {
                    const postInfo =
                        await this.client.services.methods.parser.getInfoOfPost(
                            channel
                        );
                    const channelInfo =
                        this.client.services.methods.parser.cache.get(channel)!;

                    const guildChannel = (await this.client.channels
                        .fetch(guild.channelForPosting)
                        .catch(() => {})) as BaseGuildTextChannel;

                    if (
                        guild.usedPostsIds.includes(
                            `${postInfo.data.channel}.${postInfo.data.postId}`
                        ) ||
                        postInfo.data.error === 'NO_POST_FOUND' ||
                        !guildChannel
                    )
                        continue;

                    const embed =
                        this.client.services.builders.embeds.telegramPost(
                            postInfo.data
                        );

                    if (guild.isEnabledWebhook) {
                        const webhook = await this.findWebhookByChannel(
                            guildChannel,
                            channelInfo
                        );

                        await webhook
                            .send({
                                embeds: [embed],
                                components:
                                    this.client.services.builders.rows.buttons.telegramPostLink(
                                        `https://t.me/${postInfo.data.channel}/${postInfo.data.postId}`
                                    )
                            })
                            .catch(() => {
                                this.client.logger.log(
                                    LogLevel.ERROR,
                                    `Не удалось отправить пост в гильдию ${guild.guild}`
                                );
                            });
                    } else {
                        await guildChannel
                            .send({
                                embeds: [embed],
                                components:
                                    this.client.services.builders.rows.buttons.telegramPostLink(
                                        `https://t.me/${postInfo.data.channel}/${postInfo.data.postId}`
                                    )
                            })
                            .catch(() => {
                                this.client.logger.log(
                                    LogLevel.ERROR,
                                    `Не удалось отправить пост в гильдию ${guild.guild}`
                                );
                            });
                    }

                    guild.usedPostsIds.push(
                        `${postInfo.data.channel}.${postInfo.data.postId}`
                    );
                    await this.client.services.database.dota.save(guild);
                    await this.client.services.methods.parser.sendNotifyToDeveloper(
                        `Отправлен пост ${postInfo.data.channel}.${postInfo.data.postId} на гильдию ${guild.guild}`
                    );
                    await this.client.services.baseUtils.sleep(5000);
                }
            }
        }
    }

    private async findWebhookByChannel(
        guildChannel: BaseGuildTextChannel,
        channelInfo: ChannelInfoDto
    ) {
        let webhook = (await guildChannel.fetchWebhooks()).find(
            (w) => w.name === channelInfo.title
        );

        if (!webhook)
            webhook = await guildChannel.createWebhook({
                name: channelInfo.title,
                avatar: channelInfo.profile
            });

        return webhook;
    }
}
