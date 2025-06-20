/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, sendBotMessage } from "@api/Commands";
import * as DataStore from "@api/DataStore";
import { Settings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { ChannelStore, FluxDispatcher, GuildStore, MessageActions, UserStore } from "@webpack/common";

interface ServerStats {
    [serverId: string]: {
        name: string;
        messages: number;
        channels: {
            [channelId: string]: {
                name: string;
                messages: number;
                id: string;
            };
        };
    };
}

interface Stats {
    messages: number;
    words: number;
    chars: number;
    attachments: number;
    reactions: number;
    emojis: number;
    edits: number;
    repliesSent: number;
    repliesReceived: number;
    servers: ServerStats;
}

interface MessageEvent {
    message: {
        author: {
            id: string;
        };
        content: string;
        attachments?: any[];
        guild_id?: string;
        channel_id: string;
        referenced_message?: {
            author: {
                id: string;
            };
        };
    };
}

interface MessageEditEvent {
    message: {
        author: {
            id: string;
        };
        id: string;
    };
}

interface ReactionEvent {
    userId: string;
}

const defaultStats: Stats = {
    messages: 0,
    words: 0,
    chars: 0,
    attachments: 0,
    reactions: 0,
    emojis: 0,
    edits: 0,
    repliesSent: 0,
    repliesReceived: 0,
    servers: {}
};
const STATS_KEY = "BetterStats_data";
const emojiRegex = /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}|<a?:[a-zA-Z0-9_]+:[0-9]+>)/gu;

const BetterStats = definePlugin({
    name: "BetterStats",
    description: "Track your Discord stats like messages sent, words typed, etc.",
    authors: [{
        id: 705545572299571220n,
        name: "shxdes69"
    }],
    patches: [],

    options: {
        trackMessages: {
            type: OptionType.BOOLEAN,
            description: "Track messages sent",
            default: true
        },
        trackReactions: {
            type: OptionType.BOOLEAN,
            description: "Track reactions added",
            default: true
        },
        sendAsUser: {
            type: OptionType.BOOLEAN,
            description: "Send stats as your user message (if disabled, sends as ephemeral Clyde message)",
            default: false
        }
    },

    stats: { ...defaultStats },

    onMessage(e: MessageEvent) {
        if (!Settings.plugins.BetterStats.trackMessages) return;
        const currentUser = UserStore.getCurrentUser();
        if (!currentUser) return;
        if (e.message.referenced_message?.author.id === currentUser.id) {
            this.stats.repliesReceived++;
        }

        if (e.message.author.id === currentUser.id) {
            this.stats.messages++;
            this.stats.words += e.message.content.split(/\s+/).length;
            this.stats.chars += e.message.content.length;
            if (e.message.referenced_message) {
                this.stats.repliesSent++;
            }
            if (e.message.attachments?.length) {
                this.stats.attachments += e.message.attachments.length;
            }
            const emojisInMessage = e.message.content.match(emojiRegex) || [];
            this.stats.emojis += emojisInMessage.length;
            if (e.message.guild_id) {
                const guild = GuildStore.getGuild(e.message.guild_id);
                const channel = ChannelStore.getChannel(e.message.channel_id);

                if (guild && channel) {
                    if (!this.stats.servers[guild.id]) {
                        this.stats.servers[guild.id] = {
                            name: guild.name,
                            messages: 0,
                            channels: {}
                        };
                    }

                    if (!this.stats.servers[guild.id].channels[channel.id]) {
                        this.stats.servers[guild.id].channels[channel.id] = {
                            name: channel.name,
                            messages: 0,
                            id: channel.id
                        };
                    }

                    this.stats.servers[guild.id].messages++;
                    this.stats.servers[guild.id].channels[channel.id].messages++;
                }
            }
            DataStore.set(STATS_KEY, JSON.stringify(this.stats));
        }
    },

    onMessageEdit(e: MessageEditEvent) {
        if (!Settings.plugins.BetterStats.trackMessages) return;

        const currentUser = UserStore.getCurrentUser();
        if (currentUser && e.message.author.id === currentUser.id) {
            this.stats.edits++;
            DataStore.set(STATS_KEY, JSON.stringify(this.stats));
        }
    },

    onReaction(e: ReactionEvent) {
        if (!Settings.plugins.BetterStats.trackReactions) return;

        const currentUser = UserStore.getCurrentUser();
        if (currentUser && e.userId === currentUser.id) {
            this.stats.reactions++;
            DataStore.set(STATS_KEY, JSON.stringify(this.stats));
        }
    },

    async start() {
        const savedStats = await DataStore.get(STATS_KEY);
        if (savedStats) {
            const loaded = JSON.parse(savedStats);
            this.stats = {
                ...defaultStats,
                ...loaded
            };
        }
        this.onMessage = this.onMessage.bind(this);
        this.onMessageEdit = this.onMessageEdit.bind(this);
        this.onReaction = this.onReaction.bind(this);
        FluxDispatcher.subscribe("MESSAGE_CREATE", this.onMessage);
        FluxDispatcher.subscribe("MESSAGE_UPDATE", this.onMessageEdit);
        FluxDispatcher.subscribe("MESSAGE_REACTION_ADD", this.onReaction);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", this.onMessage);
        FluxDispatcher.unsubscribe("MESSAGE_UPDATE", this.onMessageEdit);
        FluxDispatcher.unsubscribe("MESSAGE_REACTION_ADD", this.onReaction);
    },

    commands: [{
        name: "stats",
        description: "View your Discord stats",
        inputType: ApplicationCommandInputType.BUILT_IN,
        options: [],
        async execute(args, ctx) {
            const totalServers = Object.keys(BetterStats.stats.servers).length;
            const totalChannels = Object.values(BetterStats.stats.servers)
                .reduce((sum: number, server: any) => sum + Object.keys(server.channels).length, 0);

            const content = [
                "```ansi",
                "\x1b[37m⠀⠀⠀⠀⢀⡠⠤⠔⢲⢶⡖⠒⠤⢄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀",
                "⠀⠀⣠⡚⠁⢀⠀⠀⢄⢻⣿⠀⠀⠀⡙⣷⢤⡀⠀⠀⠀⠀⠀⠀",
                "\x1b[37m⠀⡜⢱⣇⠀⣧⢣⡀⠀⡀⢻⡇⠀⡄⢰⣿⣷⡌⣢⡀⠀⠀⠀⠀",
                "⠸⡇⡎⡿⣆⠹⣷⡹⣄⠙⣽⣿⢸⣧⣼⣿⣿⣿⣶⣼⣆⠀⠀⠀",
                "\x1b[37m⣷⡇⣷⡇⢹⢳⡽⣿⡽⣷⡜⣿⣾⢸⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀",
                "⣿⡇⡿⣿⠀⠣⠹⣾⣿⣮⠿⣞⣿⢸⣿⣛⢿⣿⡟⠯⠉⠙⠛⠓",
                "\x1b[37m⣿⣇⣷⠙⡇⠀⠁⠀\x1b[31m⠉⣽⣷⣾\x1b[37m⢿⢸⣿⠀⢸⣿⢿⠀⠀⠀⠀⠀",
                "⡟⢿⣿⣷\x1b[31m⣾⣆\x1b[37m⠀⠀\x1b[31m⠘⠘⠿⠛\x1b[37m⢸⣼⣿⢖⣼⣿⠘⡆⠀⠀⠀⠀",
                "\x1b[37m⠃⢸⣿⣿\x1b[31m⡘⠋\x1b[37m⠀⠀⠀⠀⠀⠀⣸⣿⣿⣿⣿⣿⡆⠇⠀⠀⠀⠀",
                "⠀⢸⡿⣿⣇⠀⠈⠀⠤⠀⠀⢀⣿⣿⣿⣿⣿⣿⣧⢸⠀⠀⠀⠀",
                "\x1b[37m⠀⠈⡇⣿⣿⣷⣤⣀⠀⣀⠔⠋⣿⣿⣿⣿⣿⡟⣿⡞⡄⠀⠀⠀",
                "⠀⠀⢿⢸⣿⣿⣿⣿⣿⡇⠀⢠⣿⡏⢿⣿⣿⡇⢸⣇⠇⠀⠀⠀",
                "⠀⠀⢸⡏⣿⣿⣿⠟⠋⣀⠠⣾⣿⠡⠀⢉⢟⠷⢼⣿⣿⠀⠀⠀",
                "⠀⠀⠈⣷⡏⡱⠁⠀⠊⠀⠀⣿⣏⣀⡠⢣⠃⠀⠀⢹⣿⡄⠀⠀",
                "\x1b[37m⠀⠀⠘⢼⣿⠀⢠⣤⣀⠉⣹⡿⠀⠁⠀⡸⠀⠀⠀⠈⣿⡇⠀⠀\x1b[0m",
                "",
                "\x1b[1;31m━━━━━━━━━━ DISCORD STATS ━━━━━━━━━━\x1b[0m",
                "",
                "\x1b[1;37m◆ Messages\x1b[0m",
                "\x1b[37m│\x1b[0m \x1b[1;37mSent:\x1b[0m        \x1b[1;31m" + Math.floor(BetterStats.stats.messages / 3) + "\x1b[0m",
                "\x1b[37m│\x1b[0m \x1b[1;37mWords:\x1b[0m       \x1b[1;31m" + Math.floor(BetterStats.stats.words / 3) + "\x1b[0m",
                "\x1b[37m│\x1b[0m \x1b[1;37mCharacters:\x1b[0m  \x1b[1;31m" + Math.floor(BetterStats.stats.chars / 3) + "\x1b[0m",
                "\x1b[37m└\x1b[0m \x1b[1;37mEdits:\x1b[0m       \x1b[1;31m" + BetterStats.stats.edits + "\x1b[0m",
                "",
                "\x1b[1;37m◆ Interactions\x1b[0m",
                "\x1b[37m│\x1b[0m \x1b[1;37mReplies:\x1b[0m     \x1b[1;31m" + Math.floor(BetterStats.stats.repliesSent / 2) + "\x1b[0m sent, \x1b[1;31m" + BetterStats.stats.repliesReceived + "\x1b[0m received",
                "\x1b[37m│\x1b[0m \x1b[1;37mReactions:\x1b[0m   \x1b[1;31m" + Math.floor(BetterStats.stats.reactions / 2) + "\x1b[0m",
                "\x1b[37m│\x1b[0m \x1b[1;37mFiles:\x1b[0m       \x1b[1;31m" + BetterStats.stats.attachments + "\x1b[0m",
                "\x1b[37m└\x1b[0m \x1b[1;37mEmojis:\x1b[0m      \x1b[1;31m" + Math.floor(BetterStats.stats.emojis / 3) + "\x1b[0m",
                "",
                "\x1b[1;37m◆ Network\x1b[0m",
                "\x1b[37m└\x1b[0m \x1b[1;37mActive in\x1b[0m \x1b[1;31m" + totalServers + "\x1b[0m servers, \x1b[1;31m" + totalChannels + "\x1b[0m channels",
                "```"
            ].join("\n");

            if (Settings.plugins.BetterStats.sendAsUser) {
                await MessageActions.sendMessage(ctx.channel.id, { content });
            } else {
                return sendBotMessage(ctx.channel.id, { content });
            }
        }
    },
    {
        name: "serverstats",
        description: "View your Discord server activity stats",
        inputType: ApplicationCommandInputType.BUILT_IN,
        options: [],
        async execute(args, ctx) {
            const topServers = Object.entries(BetterStats.stats.servers)
                .sort(([, a]: [string, any], [, b]: [string, any]) => b.messages - a.messages)
                .slice(0, 5);

            const allChannels = Object.values(BetterStats.stats.servers)
                .flatMap((server: any) => Object.values(server.channels))
                .sort((a: any, b: any) => b.messages - a.messages)
                .slice(0, 5);

            const totalMessages = BetterStats.stats.messages;

            const content = [
                "╔════════════════════════════════════╗",
                "║          SERVER STATISTICS         ║",
                "╚════════════════════════════════════╝",
                "",
                "**▸ Most Active Servers**",
                "┌─────────────────────────────────────",
                ...topServers.map(([, server]: [string, any], index: number) => {
                    const percentage = ((server.messages / totalMessages) * 100).toFixed(1);
                    const barLength = Math.ceil((server.messages / totalMessages) * 20);
                    const progressBar = "█".repeat(barLength) + "░".repeat(20 - barLength);
                    return [
                        `│ **${index + 1}.** ${server.name}`,
                        `│ ├ \`${server.messages} messages\``,
                        `│ └ ${progressBar} \`${percentage}%\``
                    ].join("\n");
                }),
                "└─────────────────────────────────────",
                "",
                "**▸ Most Active Channels**",
                "┌─────────────────────────────────────",
                ...allChannels.map((channel: any, index: number) => {
                    const percentage = ((channel.messages / totalMessages) * 100).toFixed(1);
                    const barLength = Math.ceil((channel.messages / totalMessages) * 20);
                    const progressBar = "█".repeat(barLength) + "░".repeat(20 - barLength);
                    return [
                        `│ **${index + 1}.** <#${channel.id}>`,
                        `│ ├ \`${channel.messages} messages\``,
                        `│ └ ${progressBar} \`${percentage}%\``
                    ].join("\n");
                }),
                "└─────────────────────────────────────",
                "",
                "*Note: Percentages are based on total messages*"
            ].join("\n");

            if (Settings.plugins.BetterStats.sendAsUser) {
                await MessageActions.sendMessage(ctx.channel.id, { content });
            } else {
                return sendBotMessage(ctx.channel.id, { content });
            }
        }
    },
    {
        name: "resetstats",
        description: "Reset all your Discord stats",
        inputType: ApplicationCommandInputType.BUILT_IN,
        options: [
            {
                name: "confirm",
                description: "Type 'confirm' to reset all stats (this cannot be undone)",
                type: ApplicationCommandOptionType.STRING,
                required: true
            }
        ],
        async execute(args, ctx) {
            const confirmation = args[0].value.toLowerCase();
            if (confirmation !== "confirm") {
                return sendBotMessage(ctx.channel.id, {
                    content: "⚠️ To reset your stats, you must type 'confirm' to confirm. This action cannot be undone!"
                });
            }
            BetterStats.stats = { ...defaultStats };
            await DataStore.set(STATS_KEY, JSON.stringify(BetterStats.stats));

            return sendBotMessage(ctx.channel.id, {
                content: "🗑️ All your Discord stats have been reset to zero!"
            });
        }
    }]
});

export default BetterStats;
