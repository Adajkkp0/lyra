require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    ApplicationCommandOptionType, 
    AttachmentBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ChannelType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const discordTranscripts = require('discord-html-transcripts');

// ==========================================
// FILE DATABASE (OPERAZIONI ASINCRONE)
// ==========================================
const warnsFilePath = path.join(__dirname, 'warnings.json');
const ticketDataFilePath = path.join(__dirname, 'ticketData.json');
const notesFilePath = path.join(__dirname, 'notes.json');
const afkFilePath = path.join(__dirname, 'afk.json');
const tempbansFilePath = path.join(__dirname, 'tempbans.json');

async function readJsonFile(filePath, defaultValue = {}) {
    try {
        if (!fsSync.existsSync(filePath)) {
            await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 4), 'utf8');
            return defaultValue;
        }
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Errore nella lettura di ${filePath}:`, err);
        return defaultValue;
    }
}

async function writeJsonFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 4), 'utf8');
    } catch (err) {
        console.error(`Errore nel salvataggio di ${filePath}:`, err);
    }
}

const getWarnDatabase = () => readJsonFile(warnsFilePath, {});
const saveWarnDatabase = (data) => writeJsonFile(warnsFilePath, data);

const getTicketData = () => readJsonFile(ticketDataFilePath, { counters: { assistenza: 1040, amministrazione: 5000, partnership: 7000 }, openTickets: {}, panelMessageId: null });
const saveTicketData = (data) => writeJsonFile(ticketDataFilePath, data);

const getNotesDatabase = () => readJsonFile(notesFilePath, {});
const saveNotesDatabase = (data) => writeJsonFile(notesFilePath, data);

const getAfkDatabase = () => readJsonFile(afkFilePath, {});
const saveAfkDatabase = (data) => writeJsonFile(afkFilePath, data);

const getTempbansDatabase = () => readJsonFile(tempbansFilePath, []);
const saveTempbansDatabase = (data) => writeJsonFile(tempbansFilePath, data);

// ==========================================
// CONFIGURAZIONE CANALI E RUOLI
// ==========================================
const TICKET_PANEL_CHANNEL_ID = '1417274065747443792';
const STAFF_TAG_CHANNEL_ID = '1540999651371515944';
const FEEDBACK_CHANNEL_ID = '1551582528157253682';
const SUGGESTIONS_CHANNEL_ID = '1551582528157253682';
const PARTNER_ROLE_ID = '1418320157369176155';
const GENERAL_LOG_CHANNEL_ID = '1509951423024992438';
const GESTIONE_STAFF_CHANNEL_ID = '1520126179351199925';
const GESTIONE_STAFF_ROLE_ID = '1520128603495333938';
const AUTO_ROLE_ID = process.env.AUTO_ROLE_ID || '1417312724748341248';

const NOTIFICATION_ROLES = [
    { label: 'Annunci', value: 'role_annunci', id: '1417553870812348457', emoji: '📢' },
    { label: 'Eventi', value: 'role_eventi', id: '1417312724748341248', emoji: '🎉' },
    { label: 'Partnership', value: 'role_partner', id: '1418320157369176155', emoji: '🤝' }
];

const TICKET_CATEGORIES = {
    assistenza: '1534255336838660308',
    amministrazione: '1534255423492722788',
    partnership: '1534255539851104286'
};

const LOG_CHANNELS = {
    kick: '1509942864577036468',
    ban: '1509942942834360451',
    unban: '1509942942834360451',
    timeout: '1509942700395462797',
    untimeout: '1509942700395462797',
    warn: '1509954077218443374',
    'revoca-warn': '1509954077218443374',
    clear: '1509951423024992438',
    'gestione-staff': '1509951423024992438'
};

const ROLE_PERMISSIONS = {
    MODERATION: ['1417553870812348457'],
    KICK: [
        '1442260063455805512', '1442259332023717949', '1442260394625204425', 
        '1439337067489398907', '1439337507182481652', '1447183953307111435', 
        '1447183795030851617', '1439337919465652315', '1416857780161089597'
    ],
    BAN: [
        '1442260394625204425', '1439337067489398907', '1439337507182481652', 
        '1447183953307111435', '1447183795030851617', '1439337919465652315',
        '1416857780161089597'
    ]
};

const CANCEL_ROLES = {
    FOUNDER: '1416857780161089597',
    LIMITED: [
        '1439337919465652315',
        '1447183795030851617',
        '1447183953307111435',
        '1439337067489398907'
    ]
};

const STAFF_ROLE_IDS = new Set([
    ...ROLE_PERMISSIONS.MODERATION,
    ...ROLE_PERMISSIONS.KICK,
    ...ROLE_PERMISSIONS.BAN,
    CANCEL_ROLES.FOUNDER,
    ...CANCEL_ROLES.LIMITED
]);

const STAFF_TAG_ROLES = [
    { id: '1442260394625204425', tag: 'ꜱʀ. ᴀᴅᴍɪɴ' },
    { id: '1442259332023717949', tag: 'ᴀᴅᴍɪɴ' },
    { id: '1442260063455805512', tag: 'ᴊʀ ᴀᴅ模' },
    { id: '1442255399586631842', tag: 'ꜱʀ. ᴍᴏᴅ' },
    { id: '1442254817178288229', tag: 'ᴍᴏᴅ +' },
    { id: '1439336361453686896', tag: 'ᴍᴏᴅ' },
    { id: '1442252907096576090', tag: 'ᴊʀ ᴍᴏᴅ' },
    { id: '1541011474519031829', tag: 'ᴛ. ᴍᴏᴅ' },
    { id: '1442144023887478868', tag: 'ʜᴇʟᴘᴇʀ +' },
    { id: '1417312724748341248', tag: 'ʜᴇʟᴘᴇʀ' },
    { id: '1417553955776630967', tag: 'ᴛ. ʜᴇʟᴘᴇʀ' }
];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// ==========================================
// UTILITY HELPERS
// ==========================================
function parseDuration(str) {
    if (!str) return null;
    const regex = /^(\d+)\s*([smhd])$/i;
    const match = str.trim().match(regex);
    if (!match) {
        const num = parseInt(str, 10);
        return isNaN(num) ? null : num * 60 * 1000;
    }
    const val = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    switch (unit) {
        case 's': return val * 1000;
        case 'm': return val * 60 * 1000;
        case 'h': return val * 60 * 60 * 1000;
        case 'd': return val * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

function getBatteryEmoji(count) {
    if (count <= 5) return '<:Batteria_100:1534228987750912243>';
    if (count <= 10) return '<:Batteria_75:1534228805273780426>';
    if (count <= 15) return '<:Batteria_50:1534228665150210068>';
    return '<:Batteria_25:1534229084865957948>';
}

async function countOpenCategoryTickets(categoryKey) {
    const data = await getTicketData();
    let count = 0;
    for (const channelId in data.openTickets) {
        if (data.openTickets[channelId].category === categoryKey) {
            count++;
        }
    }
    return count;
}

async function sendModerationLog(guild, actionName, targetUser, moderatorUser, reason) {
    const channelId = LOG_CHANNELS[actionName] || GENERAL_LOG_CHANNEL_ID;
    const logChannel = guild.channels.cache.get(channelId);
    if (!logChannel) return;

    const actionEmoji = actionName === 'ban' ? '🔨' : actionName === 'unban' ? '🔓' : actionName === 'kick' ? '👢' : actionName === 'timeout' ? '⏰' : actionName === 'untimeout' ? '✅' : actionName === 'warn' ? '⚠️' : actionName === 'revoca-warn' ? '✅' : '📝';

    const logEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setAuthor({ name: '🛡️ Sistema Moderazione', iconURL: guild.iconURL() })
        .setTitle(`${actionEmoji} Sanzione: /${actionName.toUpperCase()}`)
        .setDescription(
            '```yaml\nNuova azione di moderazione registrata\n```'
        )
        .addFields(
            { name: '👤 Utente Sanzionato', value: `${targetUser} (\`${targetUser.id}\`)`, inline: true },
            { name: '👮 Moderatore', value: `${moderatorUser} (\`${moderatorUser.id}\`)`, inline: true },
            { name: '📝 Motivazione', value: reason || 'Nessuna motivazione fornita', inline: false },
            { name: '🕐 Data e Ora', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
        )
        .setFooter({ text: 'Lyra Bot • Moderation Logs', iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
}

// TIMERS & BACKGROUND JOBS
async function checkTempbans() {
    const tempbans = await getTempbansDatabase();
    if (!Array.isArray(tempbans) || tempbans.length === 0) return;

    const now = Date.now();
    const active = [];

    for (const tb of tempbans) {
        if (tb.expiresAt <= now) {
            try {
                const guild = client.guilds.cache.get(tb.guildId);
                if (guild) {
                    await guild.members.unban(tb.userId, 'Temp-ban scaduto');
                    const dummyUser = { id: tb.userId, username: tb.userId, toString: () => `<@${tb.userId}>` };
                    await sendModerationLog(guild, 'unban', dummyUser, client.user, 'Scadenza Temp-ban automatica');
                }
            } catch (err) {
                console.error(`Errore revoca temp-ban per ${tb.userId}:`, err);
            }
        } else {
            active.push(tb);
        }
    }

    if (active.length !== tempbans.length) {
        await saveTempbansDatabase(active);
    }
}

// PANNELLI
async function autoCheckAndSendTicketPanel(guild) {
    const channel = guild.channels.cache.get(TICKET_PANEL_CHANNEL_ID);
    if (!channel) return;

    try {
        const countAssistenza = await countOpenCategoryTickets('assistenza');
        const countAmministrazione = await countOpenCategoryTickets('amministrazione');
        const countPartnership = await countOpenCategoryTickets('partnership');

        const embed = new EmbedBuilder()
            .setColor('#00bfff')
            .setAuthor({ name: '🎫 Sistema di Supporto', iconURL: guild.iconURL() })
            .setTitle('<:crown:1534254001514610728> Centro Assistenza')
            .setDescription(
                '```yaml\nBenvenuto nel centro assistenza di Lyra!\n```\n' +
                'Seleziona la categoria appropriata dal menu sottostante per aprire un ticket privato con il nostro Staff.\n\n' +
                '> 📊 **Statistiche Ticket Attivi:**\n' +
                `└─ **Assistenza:** ${getBatteryEmoji(countAssistenza)} \`${countAssistenza}\`\n` +
                `└─ **Amministrazione:** ${getBatteryEmoji(countAmministrazione)} \`${countAmministrazione}\`\n` +
                `└─ **Partnership:** ${getBatteryEmoji(countPartnership)} \`${countPartnership}\`\n\n` +
                '**⚠️ Nota:** Si prega di aprire ticket solo per necessità reali. L\'abuso del sistema può portare a sanzioni.'
            )
            .setImage('attachment://8.gif')
            .setFooter({ text: 'Lyra Bot • Sistema Ticketing', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('ticket_select_category')
                .setPlaceholder('Seleziona la tipologia di ticket...')
                .addOptions([
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Assistenza')
                        .setValue('assistenza')
                        .setDescription('Richiedi supporto generale o aiuto nel server')
                        .setEmoji('<:Help:1534253332015874250>'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Amministrazione')
                        .setValue('amministrazione')
                        .setDescription('Contatta l\'amministrazione superiore per pratiche riservate')
                        .setEmoji('<:crown:1534254001514610728>'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Partnership')
                        .setValue('partnership')
                        .setDescription('Proponi o gestisci la tua partnership con noi')
                        .setEmoji('<:Partner:1534230817146933309>')
                ])
        );

        const data = await getTicketData();

        if (data.panelMessageId) {
            const existingMsg = await channel.messages.fetch(data.panelMessageId).catch(() => null);
            if (existingMsg) {
                await existingMsg.edit({ embeds: [embed], components: [selectMenu] });
                return;
            }
        }

        let attachment = new AttachmentBuilder('./8.gif', { name: '8.gif' });
        const newMsg = await channel.send({ embeds: [embed], components: [selectMenu], files: [attachment] });
        data.panelMessageId = newMsg.id;
        await saveTicketData(data);

    } catch (err) {
        console.error('Errore durante l\'aggiornamento del pannello ticket:', err);
    }
}

async function autoCheckAndSendTagPanel(guild) {
    const channel = guild.channels.cache.get(STAFF_TAG_CHANNEL_ID);
    if (!channel) return;

    try {
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setAuthor({ name: '🏷️ Sistema Tag Staff', iconURL: guild.iconURL() })
            .setTitle('<:Help:1534253332015874250> Aggiornamento Tag')
            .setDescription(
                '```diff\n+ Mantieni il tuo nickname in ordine!\n```\n' +
                'Tutti i membri dello Staff devono avere la tag corretta sul proprio nickname.\n\n' +
                '> 📌 **Istruzioni:**\n' +
                'Clicca il pulsante sottostante per aggiornare automaticamente il tuo nickname in base al tuo ruolo attuale.\n\n' +
                '**⚙️ Il bot aggiornerà automaticamente la tag corrispondente al tuo ruolo.**'
            )
            .setImage('attachment://9.gif')
            .setFooter({ text: 'Lyra Bot • Staff Management', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_update_staff_tag')
                .setLabel('Aggiorna Tag')
                .setStyle(ButtonStyle.Primary)
        );

        let attachment = new AttachmentBuilder('./9.gif', { name: '9.gif' });
        await channel.send({ embeds: [embed], components: [buttonRow], files: [attachment] });

    } catch (err) {
        console.error('Errore durante l\'invio del pannello tag:', err);
    }
}

async function autoCheckAndSendFeedbackPanel(guild) {
    const channel = guild.channels.cache.get(FEEDBACK_CHANNEL_ID);
    if (!channel) return;

    try {
        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setAuthor({ name: '⭐ Centro Feedback', iconURL: guild.iconURL() })
            .setTitle('📝 Recensioni & Segnalazioni')
            .setDescription(
                '```yaml\nLa tua opinione ci aiuta a migliorare!\n```\n' +
                'Scegli una categoria dal menu sottostante per inviare il tuo feedback:\n\n' +
                '> 🤖 **Recensione Bot**\nLascia un giudizio e suggerimenti sulle funzionalità del bot.\n\n' +
                '> 🐛 **Segnalazione Bug**\nRiporta malfunzionamenti o errori riscontrati.\n\n' +
                '> 🛡️ **Recensione Staff**\nValuta l\'operato e la disponibilità dello Staff.'
            )
            .setImage('attachment://10.gif')
            .setFooter({ text: 'Lyra Bot • Feedback System', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('feedback_select_type')
                .setPlaceholder('Seleziona la tipologia di feedback...')
                .addOptions([
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Recensione Bot')
                        .setValue('feedback_bot')
                        .setDescription('Lascia una recensione o un suggerimento sul bot')
                        .setEmoji('🤖'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Bug del Bot')
                        .setValue('feedback_bug')
                        .setDescription('Segnala un bug o un errore riscontrato nel bot')
                        .setEmoji('🐛'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Recensione Staff')
                        .setValue('feedback_staff')
                        .setDescription('Lascia un feedback per lo Staff del server')
                        .setEmoji('🛡️')
                ])
        );

        let attachment = new AttachmentBuilder('./10.gif', { name: '10.gif' });
        await channel.send({ embeds: [embed], components: [selectMenu], files: [attachment] });

    } catch (err) {
        console.error('Errore durante l\'invio del pannello feedback:', err);
    }
}

// ARRESTO SICURO
const handleShutdown = (signal) => {
    console.log(`\n[AVVISO] Ricevuto segnale ${signal}. Arresto dei protocolli...`);
    try {
        client.destroy();
        console.log("[OK] Connessione chiusa in sicurezza.");
    } catch (error) {
        console.error("[ERRORE] Anomalia spegnimento:", error);
    }
    process.exit(0);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// READY EVENT
client.once('clientReady', async () => {
    console.log(`[SISTEMA] Bot online. Identificativo: ${client.user.tag}`);

    setInterval(checkTempbans, 30000);

    try {
        await client.application.commands.set([
            {
                name: 'ticket',
                description: 'Invia il pannello dei ticket.',
                defaultMemberPermissions: PermissionFlagsBits.Administrator.toString(),
                dmPermission: false
            },
            {
                name: 'messages',
                description: 'Pannello Founder per inviare i messaggi ufficiali.',
                defaultMemberPermissions: PermissionFlagsBits.Administrator.toString(),
                dmPermission: false
            },
            {
                name: 'status',
                description: 'Aggiorna lo stato ufficiale del bot.',
                defaultMemberPermissions: PermissionFlagsBits.Administrator.toString(),
                dmPermission: false,
                options: [
                    {
                        name: 'stato',
                        description: 'Stato operativo',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        choices: [
                            { name: 'Online', value: 'on' },
                            { name: 'Offline', value: 'off' },
                            { name: 'Manutenzione', value: 'manutenzione' }
                        ]
                    }
                ]
            },
            {
                name: 'gestione-staff',
                description: 'Invia un provvedimento per la gestione staff.',
                defaultMemberPermissions: PermissionFlagsBits.Administrator.toString(),
                dmPermission: false,
                options: [
                    {
                        name: 'tipo',
                        description: 'Tipologia di gestione',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        choices: [
                            { name: 'Promozione', value: 'Promozione' },
                            { name: 'Degradazione', value: 'Degradazione' },
                            { name: 'Licenziamento', value: 'Licenziamento' },
                            { name: 'Sospensione', value: 'Sospensione' },
                            { name: 'Avvertimento', value: 'Avvertimento' }
                        ]
                    },
                    { name: 'staffer', description: 'Membro dello staff destinatario', type: ApplicationCommandOptionType.User, required: true },
                    { name: 'motivazione', description: 'Motivo del provvedimento', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'grado_precedente', description: 'Ruolo precedente dello staffer', type: ApplicationCommandOptionType.Role, required: true },
                    { name: 'grado_successivo', description: 'Ruolo successivo dello staffer', type: ApplicationCommandOptionType.Role, required: true }
                ]
            },
            {
                name: 'bandi',
                description: 'Invia il pannello delle candidature staff.',
                defaultMemberPermissions: PermissionFlagsBits.Administrator.toString(),
                dmPermission: false,
                options: [
                    {
                        name: 'stato',
                        description: 'Stato dei bandi',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        choices: [
                            { name: 'Aperti', value: 'aperti' },
                            { name: 'In fase di chiusura', value: 'chiusura' },
                            { name: 'Chiusi', value: 'chiusi' }
                        ]
                    }
                ]
            },
            {
                name: 'ban',
                description: 'Banna un utente dal server (opzionalmente a tempo).',
                defaultMemberPermissions: PermissionFlagsBits.BanMembers.toString(),
                dmPermission: false,
                options: [
                    { name: 'target', description: 'Utente da bannare', type: ApplicationCommandOptionType.User, required: true },
                    { name: 'motivo', description: 'Motivo del ban', type: ApplicationCommandOptionType.String, required: false },
                    { name: 'durata', description: 'Durata (es. 10m, 2h, 1d)', type: ApplicationCommandOptionType.String, required: false }
                ]
            },
            {
                name: 'unban',
                description: 'Revoca il ban di un utente tramite ID.',
                defaultMemberPermissions: PermissionFlagsBits.BanMembers.toString(),
                dmPermission: false,
                options: [
                    { name: 'id', description: 'ID utente da sbannare', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'motivo', description: 'Motivo revoca', type: ApplicationCommandOptionType.String, required: false }
                ]
            },
            {
                name: 'kick',
                description: 'Espelli un utente dal server.',
                defaultMemberPermissions: PermissionFlagsBits.KickMembers.toString(),
                dmPermission: false,
                options: [
                    { name: 'target', description: 'Utente da espellere', type: ApplicationCommandOptionType.User, required: true },
                    { name: 'motivo', description: 'Motivo espulsione', type: ApplicationCommandOptionType.String, required: false }
                ]
            },
            {
                name: 'timeout',
                description: 'Sospende temporaneamente un utente.',
                defaultMemberPermissions: PermissionFlagsBits.ModerateMembers.toString(),
                dmPermission: false,
                options: [
                    { name: 'utente', description: 'Utente da sospendere', type: ApplicationCommandOptionType.User, required: true },
                    { name: 'durata', description: 'Durata in minuti', type: ApplicationCommandOptionType.Integer, required: true },
                    { name: 'motivo', description: 'Motivo sospensione', type: ApplicationCommandOptionType.String, required: false }
                ]
            },
            {
                name: 'untimeout',
                description: 'Rimuove il timeout ad un utente.',
                defaultMemberPermissions: PermissionFlagsBits.ModerateMembers.toString(),
                dmPermission: false,
                options: [
                    { name: 'utente', description: 'Utente a cui rimuovere il timeout', type: ApplicationCommandOptionType.User, required: true },
                    { name: 'motivo', description: 'Motivo revoca', type: ApplicationCommandOptionType.String, required: false }
                ]
            },
            {
                name: 'warn',
                description: 'Richiama un utente.',
                defaultMemberPermissions: PermissionFlagsBits.ModerateMembers.toString(),
                dmPermission: false,
                options: [
                    { name: 'utente', description: 'Utente da richiamare', type: ApplicationCommandOptionType.User, required: true },
                    { name: 'motivo', description: 'Motivo del richiamo', type: ApplicationCommandOptionType.String, required: true }
                ]
            },
            {
                name: 'revoca-warn',
                description: 'Revoca l\'ultimo richiamo ad un utente.',
                defaultMemberPermissions: PermissionFlagsBits.ModerateMembers.toString(),
                dmPermission: false,
                options: [
                    { name: 'utente', description: 'Utente a cui revocare il warn', type: ApplicationCommandOptionType.User, required: true }
                ]
            },
            {
                name: 'notes',
                description: 'Gestione note interne staff.',
                defaultMemberPermissions: PermissionFlagsBits.ModerateMembers.toString(),
                dmPermission: false,
                options: [
                    {
                        name: 'add',
                        description: 'Aggiunge una nota.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            { name: 'utente', description: 'Utente interessato', type: ApplicationCommandOptionType.User, required: true },
                            { name: 'nota', description: 'Testo della nota', type: ApplicationCommandOptionType.String, required: true }
                        ]
                    },
                    {
                        name: 'view',
                        description: 'Visualizza le note di un utente.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            { name: 'utente', description: 'Utente interessato', type: ApplicationCommandOptionType.User, required: true }
                        ]
                    },
                    {
                        name: 'remove',
                        description: 'Rimuove una nota per indice.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            { name: 'utente', description: 'Utente interessato', type: ApplicationCommandOptionType.User, required: true },
                            { name: 'indice', description: 'Numero della nota', type: ApplicationCommandOptionType.Integer, required: true }
                        ]
                    }
                ]
            },


            {
                name: 'afk',
                description: 'Imposta il tuo stato su AFK.',
                dmPermission: false,
                options: [
                    { name: 'motivo', description: 'Motivo dell\'assenza', type: ApplicationCommandOptionType.String, required: false }
                ]
            },

            {
                name: 'clear',
                description: 'Cancella messaggi nel canale corrente.',
                defaultMemberPermissions: PermissionFlagsBits.ManageMessages.toString(),
                dmPermission: false,
                options: [
                    { name: 'quantita', description: 'Numero di messaggi da eliminare', type: ApplicationCommandOptionType.Integer, required: true }
                ]
            },
            {
                name: 'slowmode',
                description: 'Imposta la modalità lenta in un canale.',
                defaultMemberPermissions: PermissionFlagsBits.ManageChannels.toString(),
                dmPermission: false,
                options: [
                    { name: 'secondi', description: 'Secondi di intervallo', type: ApplicationCommandOptionType.Integer, required: true }
                ]
            },
            {
                name: 'poll',
                description: 'Crea un soundaggio.',
                dmPermission: false,
                options: [
                    { name: 'domanda', description: 'Domanda sondaggio', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'opzione1', description: 'Prima opzione', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'opzione2', description: 'Seconda opzione', type: ApplicationCommandOptionType.String, required: true }
                ]
            },
            {
                name: 'warnings',
                description: 'Mostra lo storico degli avvertimenti e permette di rimuoverli.',
                dmPermission: false,
                options: [
                    { name: 'utente', description: 'Utente da controllare', type: ApplicationCommandOptionType.User, required: true }
                ]
            },
            {
                name: 'embed',
                description: 'Crea messaggi formattati.',
                options: [
                    { name: 'titolo', description: 'Titolo embed', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'descrizione', description: 'Descrizione embed', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'colore', description: 'Colore HEX (es: #ff0000)', type: ApplicationCommandOptionType.String, required: false }
                ]
            },
            { 
                name: '8ball', 
                description: 'Fai una domanda alla sfera di cristallo.', 
                options: [{ name: 'domanda', description: 'La tua domanda', type: ApplicationCommandOptionType.String, required: true }] 
            },
            { 
                name: 'roll', 
                description: 'Lancia un dado.', 
                options: [{ name: 'facce', description: 'Numero di facce del dado', type: ApplicationCommandOptionType.Integer, required: false }] 
            },
            { name: 'coinflip', description: 'Lancia una moneta.' },
            { 
                name: 'rps', 
                description: 'Gioca a sasso, carta o forbice.', 
                options: [{ 
                    name: 'scelta', 
                    description: 'La tua mossa', 
                    type: ApplicationCommandOptionType.String, 
                    required: true, 
                    choices: [
                        { name: 'Sasso', value: 'sasso' }, 
                        { name: 'Carta', value: 'carta' }, 
                        { name: 'Forbice', value: 'forbice' }
                    ] 
                }] 
            },
            { name: 'trivia', description: 'Quiz di cultura generale.' }
        ]);
        console.log('[OK] Comandi registrati con successo.');

    } catch (error) {
        console.error('[ERRORE] Registrazione comandi fallita:', error);
    }
});

// MESSAGGI GENERICI & GESTIONE AFK
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // Controllo AFK dell'autore del messaggio
    const afkData = await getAfkDatabase();
    if (afkData[message.author.id]) {
        delete afkData[message.author.id];
        await saveAfkDatabase(afkData);
        const afkReturnEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setAuthor({ name: '👋 Bentornato!', iconURL: message.author.displayAvatarURL() })
            .setDescription(`<@${message.author.id}> ho rimosso il tuo stato AFK.`)
            .setFooter({ text: 'Lyra Bot • AFK System', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        await message.reply({ embeds: [afkReturnEmbed] }).catch(() => {});
    }

    // Controllo menzioni ad utenti AFK
    if (message.mentions.users.size > 0) {
        for (const [userId, userObj] of message.mentions.users) {
            if (afkData[userId]) {
                const info = afkData[userId];
                const afkEmbed = new EmbedBuilder()
                    .setColor('#f39c12')
                    .setAuthor({ name: '⚠️ Utente AFK', iconURL: userObj.displayAvatarURL() })
                    .setDescription(`<@${userId}> è attualmente assente.`)
                    .addFields(
                        { name: '📝 Motivo', value: info.reason, inline: true },
                        { name: '⏰ Da quando', value: `<t:${Math.floor(info.timestamp / 1000)}:R>`, inline: true }
                    )
                    .setFooter({ text: 'Lyra Bot • AFK System', iconURL: client.user.displayAvatarURL() })
                    .setTimestamp();
                await message.reply({ embeds: [afkEmbed] }).catch(() => {});
            }
        }
    }

    if (message.mentions.has(client.user.id) && !message.mentions.everyone) {
        const mentionEmbed = new EmbedBuilder()
            .setColor('#00bfff')
            .setAuthor({ name: '🤖 Lyra Bot', iconURL: client.user.displayAvatarURL() })
            .setTitle('Ciao!')
            .setDescription(
                '```yaml\nSono il bot ufficiale di LYRA\n```' +
                '\nIl mio compito è fornire supporto e funzionalità esclusive ai membri di questa community.\n\n' +
                '> ✨ Usa /help per vedere tutti i comandi disponibili\n> 🎫 Usa il pannello ticket per richiedere supporto'
            )
            .setFooter({ text: 'Lyra Bot • Official', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        return await message.reply({ embeds: [mentionEmbed] });
    }
});

// ==========================================
// SMISTAMENTO INTERAZIONI
// ==========================================
client.on('interactionCreate', async (interaction) => {
    const { guild, user, member } = interaction;

    // --- SELEZIONE RUOLI INTERATTIVA (msg_role) ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'role_select_menu') {
        const selectedValues = interaction.values;
        const memberRoles = member.roles;

        try {
            for (const roleOpt of NOTIFICATION_ROLES) {
                if (guild.roles.cache.has(roleOpt.id)) {
                    if (selectedValues.includes(roleOpt.value)) {
                        if (!memberRoles.cache.has(roleOpt.id)) await memberRoles.add(roleOpt.id);
                    } else {
                        if (memberRoles.cache.has(roleOpt.id)) await memberRoles.remove(roleOpt.id);
                    }
                }
            }
            return await interaction.reply({ content: '<:Tick:1541029265536192563> I tuoi ruoli sono stati aggiornati correttamente!', ephemeral: true });
        } catch (err) {
            console.error('Errore aggiornamento ruoli:', err);
            return await interaction.reply({ content: '<:X_:1541029308716425286> Impossibile aggiornare i ruoli.', ephemeral: true });
        }
    }



    // --- PANNELLO PROPOSTE / SUGGESTIONS (PULSANTI STAFF) ---
    if (interaction.isButton() && interaction.customId.startsWith('btn_suggest_')) {
        const isStaff = member.roles.cache.some(r => STAFF_ROLE_IDS.has(r.id));
        if (!isStaff) return await interaction.reply({ content: '<:X_:1541029308716425286> Azione riservata allo Staff.', ephemeral: true });

        const embed = EmbedBuilder.from(interaction.message.embeds[0]);

        if (interaction.customId === 'btn_suggest_approve') {
            embed.setColor('#2ecc71').spliceFields(0, 1, { name: 'Stato Proposta', value: '🟢 **APPROVATA**', inline: true });
        } else if (interaction.customId === 'btn_suggest_reject') {
            embed.setColor('#e74c3c').spliceFields(0, 1, { name: 'Stato Proposta', value: '🔴 **RIFIUTATA**', inline: true });
        } else if (interaction.customId === 'btn_suggest_progress') {
            embed.setColor('#f1c40f').spliceFields(0, 1, { name: 'Stato Proposta', value: '🟡 **IN LAVORAZIONE**', inline: true });
        }

        await interaction.message.edit({ embeds: [embed] });
        return await interaction.reply({ content: '<:Tick:1541029265536192563> Stato proposta aggiornato.', ephemeral: true });
    }



    // --- PANNELLO MESSAGES (MESSAGES COMMAND SELECT MENU) ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_messages_panel') {
        const selected = interaction.values[0];

        if (selected === 'msg_ticket') {
            await autoCheckAndSendTicketPanel(guild);
            return await interaction.reply({ content: '<:Tick:1541029265536192563> Pannello Ticket inviato/aggiornato con successo.', ephemeral: true });
        } else if (selected === 'msg_tag') {
            await autoCheckAndSendTagPanel(guild);
            return await interaction.reply({ content: '<:Tick:1541029265536192563> Pannello Tag Staff inviato/aggiornato con successo.', ephemeral: true });
        } else if (selected === 'msg_feedback') {
            await autoCheckAndSendFeedbackPanel(guild);
            return await interaction.reply({ content: '<:Tick:1541029265536192563> Pannello Feedback inviato/aggiornato con successo.', ephemeral: true });
        } else if (selected === 'msg_role') {
            const roleEmbed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setAuthor({ name: '🎭 Selezione Ruoli', iconURL: guild.iconURL() })
                .setTitle('Scegli i tuoi ruoli notifica')
                .setDescription(
                    '```yaml\nPersonalizza le tue notifiche\n```' +
                    '\nSeleziona o deseleziona dal menu sottostante i ruoli notifica di tuo interesse.\n\n' +
                    '> ✅ Puoi selezionare più ruoli contemporaneamente\n> 🔄 Puoi cambiare la tua selezione in qualsiasi momento'
                )
                .setFooter({ text: 'Lyra Bot • Role System', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            const selectOptions = NOTIFICATION_ROLES.map(r => 
                new StringSelectMenuOptionBuilder()
                    .setLabel(r.label)
                    .setValue(r.value)
                    .setEmoji(r.emoji)
            );

            const roleMenu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('role_select_menu')
                    .setPlaceholder('Scegli i tuoi ruoli notifica...')
                    .setMinValues(0)
                    .setMaxValues(NOTIFICATION_ROLES.length)
                    .addOptions(selectOptions)
            );

            await interaction.channel.send({ embeds: [roleEmbed], components: [roleMenu] });
            return await interaction.reply({ content: '<:Tick:1541029265536192563> Pannello Ruoli inviato con successo nel canale.', ephemeral: true });
        }
    }

    // --- CANDIDATURE & REQUISITI ---
    if (interaction.isButton() && interaction.customId === 'btn_requisiti_view') {
        const reqEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setAuthor({ name: '📌 Requisiti Candidatura', iconURL: guild.iconURL() })
            .setTitle('Requisiti per entrare nello Staff')
            .setDescription(
                '```yaml\nPrima di candidarti, assicurati di soddisfare:\n```' +
                '\n> ✅ **Essere attivi** sul server Discord\n' +
                '> ✅ **Avere maturità** necessaria per il ruolo\n' +
                '> ✅ **Conoscere** e applicare il regolamento\n' +
                '> ✅ **Avere un microfono** funzionante per le valutazioni'
            )
            .setFooter({ text: 'Lyra Bot • Staff Requirements', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        return await interaction.reply({ embeds: [reqEmbed], ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'btn_candidatura_open') {
        const modal = new ModalBuilder()
            .setCustomId('modal_candidatura_staff')
            .setTitle('Modulo Candidatura Staff');

        const ageInput = new TextInputBuilder()
            .setCustomId('cand_eta')
            .setLabel('Quanti anni hai?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const expInput = new TextInputBuilder()
            .setCustomId('cand_esperienza')
            .setLabel('Hai esperienze pregresse come Staff?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const whyInput = new TextInputBuilder()
            .setCustomId('cand_motivo')
            .setLabel('Perché dovremmo scegliere te?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(ageInput),
            new ActionRowBuilder().addComponents(expInput),
            new ActionRowBuilder().addComponents(whyInput)
        );

        return await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_candidatura_staff') {
        const eta = interaction.fields.getTextInputValue('cand_eta');
        const esp = interaction.fields.getTextInputValue('cand_esperienza');
        const motivo = interaction.fields.getTextInputValue('cand_motivo');

        const candLogChannel = guild.channels.cache.get(GESTIONE_STAFF_CHANNEL_ID);
        const candEmbed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setAuthor({ name: '📑 Nuova Candidatura', iconURL: user.displayAvatarURL() })
            .setTitle('Candidatura Staff Ricevuta')
            .setDescription(
                '```yaml\nNuova richiesta di candidatura\n```'
            )
            .addFields(
                { name: '👤 Candidato', value: `${user} (\`${user.id}\`)`, inline: true },
                { name: '🎂 Età', value: eta, inline: true },
                { name: '💼 Esperienza', value: esp, inline: false },
                { name: '💡 Motivazione', value: motivo, inline: false }
            )
            .setFooter({ text: 'Lyra Bot • Staff Applications', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        if (candLogChannel) await candLogChannel.send({ embeds: [candEmbed] });

        return await interaction.reply({
            content: '<:Tick:1541029265536192563> La tua candidatura è stata inviata con successo! Lo Staff la valuterà a breve.',
            ephemeral: true
        });
    }

    // --- SELEZIONE E INVIO FEEDBACK ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'feedback_select_type') {
        const selected = interaction.values[0];

        if (selected === 'feedback_bot') {
            const modal = new ModalBuilder()
                .setCustomId('modal_feedback_bot')
                .setTitle('Recensione Bot');

            const ratingInput = new TextInputBuilder()
                .setCustomId('fb_bot_rating')
                .setLabel('Valutazione (da 1 a 5 stelle)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Es: 5/5')
                .setRequired(true);

            const commentInput = new TextInputBuilder()
                .setCustomId('fb_bot_comment')
                .setLabel('La tua recensione / consigli')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(ratingInput),
                new ActionRowBuilder().addComponents(commentInput)
            );

            return await interaction.showModal(modal);
        }

        if (selected === 'feedback_bug') {
            const modal = new ModalBuilder()
                .setCustomId('modal_feedback_bug')
                .setTitle('Segnalazione Bug Bot');

            const titleInput = new TextInputBuilder()
                .setCustomId('fb_bug_command')
                .setLabel('Comando / Funzione interessata')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Es: /ticket oppure menu a tendina')
                .setRequired(true);

            const descInput = new TextInputBuilder()
                .setCustomId('fb_bug_desc')
                .setLabel('Descrivi il problema riscontrato')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descInput)
            );

            return await interaction.showModal(modal);
        }

        if (selected === 'feedback_staff') {
            const modal = new ModalBuilder()
                .setCustomId('modal_feedback_staff')
                .setTitle('Recensione Staff');

            const stafferInput = new TextInputBuilder()
                .setCustomId('fb_staff_member')
                .setLabel('Nome / ID dello Staffer (Opzionale)')
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            const ratingInput = new TextInputBuilder()
                .setCustomId('fb_staff_rating')
                .setLabel('Valutazione (da 1 a 5 stelle)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Es: 5/5')
                .setRequired(true);

            const commentInput = new TextInputBuilder()
                .setCustomId('fb_staff_comment')
                .setLabel('La tua opinione sullo Staff')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(stafferInput),
                new ActionRowBuilder().addComponents(ratingInput),
                new ActionRowBuilder().addComponents(commentInput)
            );

            return await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_feedback_')) {
        const feedbackChannel = guild.channels.cache.get(FEEDBACK_CHANNEL_ID);

        if (interaction.customId === 'modal_feedback_bot') {
            const rating = interaction.fields.getTextInputValue('fb_bot_rating');
            const comment = interaction.fields.getTextInputValue('fb_bot_comment');

            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setAuthor({ name: '🤖 Recensione Bot', iconURL: user.displayAvatarURL() })
                .setTitle('Nuova recensione ricevuta')
                .setDescription(
                    '```yaml\nFeedback sul funzionamento del bot\n```'
                )
                .addFields(
                    { name: '👤 Utente', value: `${user} (\`${user.id}\`)`, inline: true },
                    { name: '⭐ Voto', value: rating, inline: true },
                    { name: '📝 Recensione', value: comment, inline: false }
                )
                .setFooter({ text: 'Lyra Bot • Feedback System', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            if (feedbackChannel) await feedbackChannel.send({ embeds: [embed] });
            return await interaction.reply({ content: '<:Tick:1541029265536192563> Grazie per la tua recensione sul bot!', ephemeral: true });
        }

        if (interaction.customId === 'modal_feedback_bug') {
            const command = interaction.fields.getTextInputValue('fb_bug_command');
            const desc = interaction.fields.getTextInputValue('fb_bug_desc');

            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setAuthor({ name: '🐛 Segnalazione Bug', iconURL: user.displayAvatarURL() })
                .setTitle('Nuovo bug segnalato')
                .setDescription(
                    '```yaml\nErrore o malfunzionamento riscontrato\n```'
                )
                .addFields(
                    { name: '👤 Segnalato da', value: `${user} (\`${user.id}\`)`, inline: true },
                    { name: '⚙️ Comando/Modulo', value: command, inline: true },
                    { name: '📝 Descrizione', value: desc, inline: false }
                )
                .setFooter({ text: 'Lyra Bot • Bug Reports', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            if (feedbackChannel) await feedbackChannel.send({ embeds: [embed] });
            return await interaction.reply({ content: '<:Tick:1541029265536192563> Segnalazione inviata con successo! Verificheremo al più presto.', ephemeral: true });
        }

        if (interaction.customId === 'modal_feedback_staff') {
            const staffer = interaction.fields.getTextInputValue('fb_staff_member') || 'Non specificato';
            const rating = interaction.fields.getTextInputValue('fb_staff_rating');
            const comment = interaction.fields.getTextInputValue('fb_staff_comment');

            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setAuthor({ name: '🛡️ Recensione Staff', iconURL: user.displayAvatarURL() })
                .setTitle('Nuova recensione Staff ricevuta')
                .setDescription(
                    '```yaml\nFeedback sull\'operato dello Staff\n```'
                )
                .addFields(
                    { name: '👤 Utente', value: `${user} (\`${user.id}\`)`, inline: true },
                    { name: '👮 Staffer', value: staffer, inline: true },
                    { name: '⭐ Voto', value: rating, inline: true },
                    { name: '📝 Opinione', value: comment, inline: false }
                )
                .setFooter({ text: 'Lyra Bot • Staff Feedback', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            if (feedbackChannel) await feedbackChannel.send({ embeds: [embed] });
            return await interaction.reply({ content: '<:Tick:1541029265536192563> Grazie per aver lasciato la tua recensione sullo Staff!', ephemeral: true });
        }
    }

    // --- SELEZIONE CATEGORIA TICKET ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select_category') {
        const categoryKey = interaction.values[0];
        const ticketData = await getTicketData();

        const userAlreadyHasTicket = Object.values(ticketData.openTickets).some(
            t => t.creatorId === user.id
        );

        if (userAlreadyHasTicket) {
            return interaction.reply({ 
                content: '<:X_:1541029308716425286> Hai già un ticket aperto! Chiudilo prima di aprirne un altro.', 
                ephemeral: true 
            });
        }

        const modal = new ModalBuilder()
            .setCustomId(`modal_ticket_${categoryKey}`)
            .setTitle(`Ticket ${categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}`);

        const reasonInput = new TextInputBuilder()
            .setCustomId('ticket_reason')
            .setLabel('Descrivi di cosa hai bisogno')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(firstActionRow);

        return await interaction.showModal(modal);
    }

    // --- INVIO MODAL CREAZIONE TICKET ---
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_ticket_')) {
        const categoryKey = interaction.customId.replace('modal_ticket_', '');
        const reason = interaction.fields.getTextInputValue('ticket_reason');
        const ticketData = await getTicketData();

        const userAlreadyHasTicket = Object.values(ticketData.openTickets).some(
            t => t.creatorId === user.id
        );

        if (userAlreadyHasTicket) {
            return interaction.reply({ content: '<:X_:1541029308716425286> Hai già un ticket aperto!', ephemeral: true });
        }

        let currentNumber = ticketData.counters[categoryKey];
        let ticketChannelName = '';

        if (categoryKey === 'assistenza') {
            ticketChannelName = `assistenza-${currentNumber}`;
        } else if (categoryKey === 'amministrazione') {
            ticketChannelName = `amministrazione-${currentNumber}`;
        } else if (categoryKey === 'partnership') {
            ticketChannelName = `PartnerShip-${currentNumber}`;
        }

        ticketData.counters[categoryKey] += 1;

        const permissionOverwrites = [
            {
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.EmbedLinks,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            }
        ];

        STAFF_ROLE_IDS.forEach(roleId => {
            if (guild.roles.cache.has(roleId)) {
                permissionOverwrites.push({
                    id: roleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                });
            }
        });

        if (categoryKey === 'partnership' && guild.roles.cache.has(PARTNER_ROLE_ID)) {
            permissionOverwrites.push({
                id: PARTNER_ROLE_ID,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.EmbedLinks,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            });
        }

        try {
            const parentCategoryId = TICKET_CATEGORIES[categoryKey] || TICKET_CATEGORIES.assistenza;

            const ticketChannel = await guild.channels.create({
                name: ticketChannelName,
                type: ChannelType.GuildText,
                parent: parentCategoryId,
                permissionOverwrites: permissionOverwrites
            });

            ticketData.openTickets[ticketChannel.id] = {
                category: categoryKey,
                creatorId: user.id,
                ticketNumber: currentNumber,
                claimedBy: null
            };
            await saveTicketData(ticketData);

            await interaction.reply({
                content: `<:Tick:1541029265536192563> Il tuo ticket è stato creato: ${ticketChannel}`,
                ephemeral: true
            });

            await autoCheckAndSendTicketPanel(guild);

            let catFormattedName = categoryKey === 'assistenza' ? 'Assistenza' : categoryKey === 'amministrazione' ? 'Amministrazione' : 'Partnership';
            let catEmoji = categoryKey === 'assistenza' ? '🆘' : categoryKey === 'amministrazione' ? '👑' : '🤝';

            const innerEmbed = new EmbedBuilder()
                .setColor('#00bfff')
                .setAuthor({ name: `${catEmoji} Ticket ${catFormattedName}`, iconURL: user.displayAvatarURL() })
                .setTitle('🎫 Ticket Aperto')
                .setDescription(
                    '```diff\n+ Il tuo ticket è stato creato con successo!\n```\n' +
                    'Un membro dello Staff si occuperà al più presto della tua richiesta.\n\n' +
                    '> 📋 **Istruzioni:**\n' +
                    '• Descrivi nel dettaglio il tuo problema o richiesta\n' +
                    '• Attendi pazientemente la risposta dello Staff\n' +
                    '• Puoi chiudere il ticket in qualsiasi momento con il pulsante 🔒'
                )
                .addFields(
                    { name: '📁 Categoria', value: catFormattedName, inline: true },
                    { name: '👤 Creatore', value: user.toString(), inline: true },
                    { name: '🆔 ID Ticket', value: `#${currentNumber}`, inline: true },
                    { name: '📝 Motivo', value: reason || 'Nessun motivo fornito', inline: false }
                )
                .setThumbnail(user.displayAvatarURL())
                .setFooter({ text: `Lyra Bot • Ticket #${currentNumber}`, iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            const actionButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_ticket_close')
                    .setLabel('Chiudi')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('btn_ticket_claim')
                    .setLabel('Claim')
                    .setEmoji('📌')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('btn_ticket_staff_cmds')
                    .setLabel('Comandi Staff')
                    .setEmoji('⚙️')
                    .setStyle(ButtonStyle.Secondary)
            );

            await ticketChannel.send({
                content: `${user}`,
                embeds: [innerEmbed],
                components: [actionButtons]
            });

        } catch (err) {
            console.error('Errore creazione ticket:', err);
            await interaction.reply({ content: '<:X_:1541029308716425286> Errore durante la creazione del ticket.', ephemeral: true });
        }
        return;
    }

    // --- RIMOZIONE WARN DA PULSANTE ---
    if (interaction.isButton() && interaction.customId.startsWith('remove_warn_')) {
        const parts = interaction.customId.split('_');
        const targetUserId = parts[2];
        const warnIndex = parseInt(parts[3], 10);

        const warnData = await getWarnDatabase();
        if (warnData[targetUserId] && Array.isArray(warnData[targetUserId]) && warnData[targetUserId][warnIndex] !== undefined) {
            warnData[targetUserId].splice(warnIndex, 1);
            await saveWarnDatabase(warnData);

            return await interaction.update({
                content: `<:Tick:1541029265536192563> Ammonizione #${warnIndex + 1} rimossa con successo dall'utente <@${targetUserId}>!`,
                embeds: [],
                components: []
            });
        } else {
            return await interaction.reply({ content: '<:X_:1541029308716425286> Impossibile trovare o rimuovere questo warn.', ephemeral: true });
        }
    }

    // --- BOTTONI TICKET & TAG STAFF ---
    if (interaction.isButton()) {

        if (interaction.customId === 'btn_update_staff_tag') {
            const memberObj = interaction.member;
            let assignedTag = null;

            for (const roleObj of STAFF_TAG_ROLES) {
                if (memberObj.roles.cache.has(roleObj.id)) {
                    assignedTag = roleObj.tag;
                    break; 
                }
            }

            if (!assignedTag) {
                return await interaction.reply({ 
                    content: '<:X_:1541029308716425286> Nessun ruolo Staff valido trovato per il tuo profilo.', 
                    ephemeral: true 
                });
            }

            try {
                let baseName = memberObj.displayName.split('┃')[0].trim();
                let newNick = `${baseName}┃${assignedTag}`;
                
                if (newNick.length > 32) {
                    newNick = newNick.substring(0, 32);
                }

                await memberObj.setNickname(newNick);
                return await interaction.reply({ 
                    content: `<:Tick:1541029265536192563> Profilo aggiornato correttamente: **${newNick}**`, 
                    ephemeral: true 
                });
            } catch (err) {
                console.error(err);
                return await interaction.reply({ 
                    content: '<:X_:1541029308716425286> Il bot non ha i permessi necessari (deve avere un ruolo superiore al tuo).', 
                    ephemeral: true 
                });
            }
        }

        const ticketData = await getTicketData();
        const currentTicket = ticketData.openTickets[interaction.channelId];

        if (interaction.customId === 'btn_ticket_close') {
            await interaction.reply({ content: '🔒 **Generazione del transcript e chiusura del ticket in corso...**' });

            try {
                const transcriptFile = await discordTranscripts.createTranscript(interaction.channel, {
                    limit: -1,
                    returnType: 'attachment',
                    filename: `transcript-${interaction.channel.name}.html`,
                    saveImages: true,
                    poweredBy: false
                });

                const logChannel = guild.channels.cache.get(GENERAL_LOG_CHANNEL_ID);
                if (logChannel) {
                    const transcriptEmbed = new EmbedBuilder()
                        .setColor('#e74c3c')
                        .setAuthor({ name: '📄 Transcript Ticket', iconURL: guild.iconURL() })
                        .setTitle('Ticket chiuso')
                        .setDescription(
                            '```yaml\nTranscript salvato con successo\n```'
                        )
                        .addFields(
                            { name: '📁 Canale', value: `\`${interaction.channel.name}\``, inline: true },
                            { name: '👤 Chiuso da', value: `${user} (\`${user.id}\`)`, inline: true },
                            { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                        )
                        .setFooter({ text: 'Lyra Bot • Ticket System', iconURL: client.user.displayAvatarURL() })
                        .setTimestamp();

                    await logChannel.send({ embeds: [transcriptEmbed], files: [transcriptFile] });
                }
            } catch (err) {
                console.error('Errore durante la generazione del transcript:', err);
            }

            setTimeout(async () => {
                if (ticketData.openTickets[interaction.channelId]) {
                    delete ticketData.openTickets[interaction.channelId];
                    await saveTicketData(ticketData);
                }
                await interaction.channel.delete().catch(() => {});
                await autoCheckAndSendTicketPanel(guild);
            }, 3000);
            return;
        }

        if (interaction.customId === 'btn_ticket_claim') {
            const isStaff = member.roles.cache.some(r => STAFF_ROLE_IDS.has(r.id));
            if (!isStaff) {
                return await interaction.reply({ content: '<:X_:1541029308716425286> Solo lo staff può prendere in carico un ticket.', ephemeral: true });
            }

            if (currentTicket && currentTicket.claimedBy) {
                return await interaction.reply({ content: `<:X_:1541029308716425286> Ticket già preso in carico da <@${currentTicket.claimedBy}>.`, ephemeral: true });
            }

            if (currentTicket) {
                currentTicket.claimedBy = user.id;
                await saveTicketData(ticketData);
            }

            for (const roleId of STAFF_ROLE_IDS) {
                if (guild.roles.cache.has(roleId)) {
                    await interaction.channel.permissionOverwrites.edit(roleId, { ViewChannel: false }).catch(() => {});
                }
            }
            await interaction.channel.permissionOverwrites.edit(user.id, {
                ViewChannel: true,
                SendMessages: true,
                AttachFiles: true,
                EmbedLinks: true,
                ReadMessageHistory: true
            }).catch(() => {});

            const updatedRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_ticket_close')
                    .setLabel('Chiudi')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('btn_ticket_unclaim')
                    .setLabel('Unclaim')
                    .setEmoji('🔓')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('btn_ticket_staff_cmds')
                    .setLabel('Comandi Staff')
                    .setEmoji('⚙️')
                    .setStyle(ButtonStyle.Secondary)
            );

            await interaction.update({ components: [updatedRow] });
            return await interaction.followUp({ content: `📌 Ticket preso in carico da ${user}. Gli altri membri dello Staff non possono più visualizzarlo.` });
        }

        if (interaction.customId === 'btn_ticket_unclaim') {
            const isStaff = member.roles.cache.some(r => STAFF_ROLE_IDS.has(r.id));
            if (!isStaff) {
                return await interaction.reply({ content: '<:X_:1541029308716425286> Solo lo staff può rilasciare un ticket.', ephemeral: true });
            }

            if (currentTicket) {
                currentTicket.claimedBy = null;
                await saveTicketData(ticketData);
            }

            for (const roleId of STAFF_ROLE_IDS) {
                if (guild.roles.cache.has(roleId)) {
                    await interaction.channel.permissionOverwrites.edit(roleId, { ViewChannel: true }).catch(() => {});
                }
            }
            await interaction.channel.permissionOverwrites.delete(user.id).catch(() => {});

            const updatedRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_ticket_close')
                    .setLabel('Chiudi')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('btn_ticket_claim')
                    .setLabel('Claim')
                    .setEmoji('📌')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('btn_ticket_staff_cmds')
                    .setLabel('Comandi Staff')
                    .setEmoji('⚙️')
                    .setStyle(ButtonStyle.Secondary)
            );

            await interaction.update({ components: [updatedRow] });
            return await interaction.followUp({ content: `🔓 Ticket rilasciato da ${user}. Tutto lo Staff può nuovamente visualizzarlo.` });
        }

        if (interaction.customId === 'btn_ticket_staff_cmds') {
            const isStaff = member.roles.cache.some(r => STAFF_ROLE_IDS.has(r.id));
            if (!isStaff) {
                return await interaction.reply({ content: '<:X_:1541029308716425286> Accesso riservato allo Staff.', ephemeral: true });
            }

            return await interaction.reply({
                content: `⚙️ **Pannello Gestione Staff Ticket**:\n- **Canale**: ${interaction.channel}\n- **ID Creatore**: \`${currentTicket ? currentTicket.creatorId : 'N/D'}\`\n- **Stato Claim**: ${currentTicket && currentTicket.claimedBy ? `<@${currentTicket.claimedBy}>` : 'Non preso in carico'}`,
                ephemeral: true
            });
        }
    }

    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, channel } = interaction;

    // CHECK RUOLI E PERMESSI GENERALI
    let requiredRoles = [];
    if (['status', 'messages', 'ticket'].includes(commandName)) {
        requiredRoles = [CANCEL_ROLES.FOUNDER];
    } else if (commandName === 'gestione-staff') {
        requiredRoles = [GESTIONE_STAFF_ROLE_ID];
    } else if (['warn', 'revoca-warn', 'timeout', 'untimeout', 'slowmode', 'poll', 'warnings', 'bandi', 'notes'].includes(commandName)) {
        requiredRoles = ROLE_PERMISSIONS.MODERATION;
    } else if (commandName === 'kick') {
        requiredRoles = ROLE_PERMISSIONS.KICK;
    } else if (['ban', 'unban'].includes(commandName)) {
        requiredRoles = ROLE_PERMISSIONS.BAN;
    }

    if (requiredRoles.length > 0) {
        const hasPermission = member.roles.cache.some(role => requiredRoles.includes(role.id));
        if (!hasPermission) {
            return interaction.reply({ 
                content: '<:X_:1541029308716425286> Accesso negato: Non hai i ruoli necessari.', 
                ephemeral: true 
            });
        }
    }

    // LOG COMANDI GENERICO
    const targetLogId = LOG_CHANNELS[commandName] || GENERAL_LOG_CHANNEL_ID;
    const logChannel = guild.channels.cache.get(targetLogId);

    const generalLogEmbed = new EmbedBuilder()
        .setColor('#3498db')
        .setAuthor({ name: '📝 Log Comandi', iconURL: guild.iconURL() })
        .setTitle(`Esecuzione: /${commandName}`)
        .setDescription(
            '```yaml\nComando eseguito con successo\n```'
        )
        .addFields(
            { name: '👤 Utente', value: `${user} (\`${user.id}\`)`, inline: true },
            { name: '📝 Canale', value: `${channel}`, inline: true }
        )
        .setFooter({ text: 'Lyra Bot • Command Logs', iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    if (logChannel) logChannel.send({ embeds: [generalLogEmbed] }).catch(() => {});



    // --- COMANDO /AFK ---
    if (commandName === 'afk') {
        const reason = options.getString('motivo') || 'Nessun motivo fornito';
        const afkData = await getAfkDatabase();

        afkData[user.id] = {
            reason: reason,
            timestamp: Date.now()
        };
        await saveAfkDatabase(afkData);

        const afkEmbed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setAuthor({ name: '💤 Sistema AFK', iconURL: user.displayAvatarURL() })
            .setTitle('Stato AFK attivato')
            .setDescription(
                '```yaml\nSei ora impostato come assente\n```' +
                `\n> 📝 **Motivo:** ${reason}\n> ⏰ **Il tuo stato verrà rimosso quando scriverai un messaggio**`
            )
            .setFooter({ text: 'Lyra Bot • AFK System', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        return await interaction.reply({ embeds: [afkEmbed], ephemeral: true });
    }



    // --- COMANDO /NOTES ---
    if (commandName === 'notes') {
        const subcommand = options.getSubcommand();
        const targetUser = options.getUser('utente');
        const notesDb = await getNotesDatabase();
        if (!Array.isArray(notesDb[targetUser.id])) notesDb[targetUser.id] = [];

        if (subcommand === 'add') {
            const noteText = options.getString('nota');
            notesDb[targetUser.id].push({
                note: noteText,
                authorId: user.id,
                date: new Date().toLocaleDateString('it-IT')
            });
            await saveNotesDatabase(notesDb);
            return await interaction.reply({ content: `<:Tick:1541029265536192563> Nota aggiunta al profilo di **${targetUser.tag}**.`, ephemeral: true });
        }

        if (subcommand === 'view') {
            const userNotes = notesDb[targetUser.id];
            if (userNotes.length === 0) {
                return await interaction.reply({ content: `📋 Nessuna nota interna presente per **${targetUser.tag}**.`, ephemeral: true });
            }

            const formattedNotes = userNotes.map((n, i) => `**${i + 1}.** 📝 ${n.note}\n   👤 Da: <@${n.authorId}> | 📅 ${n.date}`).join('\n');
            const embed = new EmbedBuilder()
                .setColor('#f39c12')
                .setAuthor({ name: '📋 Note Staff', iconURL: targetUser.displayAvatarURL() })
                .setTitle(`Note di ${targetUser.username}`)
                .setDescription(
                    '```yaml\nNote interne dello staff\n```' +
                    `\n${formattedNotes}`
                )
                .setFooter({ text: 'Lyra Bot • Staff Notes', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'remove') {
            const index = options.getInteger('indice') - 1;
            if (index < 0 || index >= notesDb[targetUser.id].length) {
                return await interaction.reply({ content: '<:X_:1541029308716425286> Indice nota non valido.', ephemeral: true });
            }

            notesDb[targetUser.id].splice(index, 1);
            await saveNotesDatabase(notesDb);
            return await interaction.reply({ content: `<:Tick:1541029265536192563> Nota #${index + 1} rimossa per **${targetUser.tag}**.`, ephemeral: true });
        }
    }





    // COMANDO TICKET (SOLO FOUNDER)
    if (commandName === 'ticket') {
        await autoCheckAndSendTicketPanel(guild);
        return await interaction.reply({ content: '<:Tick:1541029265536192563> Pannello Ticket inviato/aggiornato con successo.', ephemeral: true });
    }

    // COMANDO MESSAGES (SOLO FOUNDER)
    if (commandName === 'messages') {
        const selectMenuRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_messages_panel')
                .setPlaceholder('Seleziona il messaggio da inviare...')
                .addOptions([
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Pannello Ticket')
                        .setValue('msg_ticket')
                        .setDescription('Invia il pannello principale per l\'apertura dei ticket')
                        .setEmoji('🎫'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Pannello Feedback')
                        .setValue('msg_feedback')
                        .setDescription('Invia il pannello per le recensioni e segnalazioni')
                        .setEmoji('⭐'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Pannello Role')
                        .setValue('msg_role')
                        .setDescription('Invia il pannello per l\'assegnazione ruoli')
                        .setEmoji('🎭'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Pannello Tag Staff')
                        .setValue('msg_tag')
                        .setDescription('Invia il pannello per l\'aggiornamento della Tag Staff')
                        .setEmoji('🏷️')
                ])
        );

        return await interaction.reply({
            content: '⚙️ **Pannello Gestione Messaggi (Founder Only)**\nSeleziona dal menu sottostante quale messaggio vuoi inviare:',
            components: [selectMenuRow],
            ephemeral: true
        });
    }

    // GESTIONE STAFF
    if (commandName === 'gestione-staff') {
        await interaction.deferReply({ ephemeral: true });

        const tipo = options.getString('tipo');
        const targetUser = options.getUser('staffer');
        const motivo = options.getString('motivazione');
        const gradoPrec = options.getRole('grado_precedente');
        const gradoSucc = options.getRole('grado_successivo');

        let embedColor = '#00ff00';
        if (tipo === 'Promozione') embedColor = '#00ff00';
        else if (tipo === 'Degradazione' || tipo === 'Licenziamento') embedColor = '#ff0000';
        else if (tipo === 'Sospensione') embedColor = '#ff6600';
        else if (tipo === 'Avvertimento') embedColor = '#ffff00';

        let roleError = false;
        const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

        if (targetMember) {
            try {
                if (targetMember.roles.cache.has(gradoPrec.id)) {
                    await targetMember.roles.remove(gradoPrec.id);
                }
                await targetMember.roles.add(gradoSucc.id);
            } catch (err) {
                console.error('Errore nell\'assegnazione/rimozione dei ruoli:', err);
                roleError = true;
            }
        }

        const targetChannel = guild.channels.cache.get(GESTIONE_STAFF_CHANNEL_ID);
        if (!targetChannel) {
            return await interaction.editReply({ content: '<:X_:1541029308716425286> Canale gestione staff non trovato.' });
        }

        const now = new Date();
        const dateFormatted = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ', ' + now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        const staffEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setAuthor({ name: '🛑 Gestione Staff', iconURL: guild.iconURL() })
            .setTitle(`${tipo} - Staff di Lyra`)
            .setDescription(
                '```yaml\nNuovo provvedimento staff registrato\n```'
            )
            .addFields(
                { name: '👤 Staffer', value: targetUser.toString(), inline: true },
                { name: '👮 Supervisore', value: user.toString(), inline: true },
                { name: '📝 Motivazione', value: motivo, inline: false },
                { name: '⬇️ Grado Precedente', value: gradoPrec.toString(), inline: true },
                { name: '⬆️ Grado Successivo', value: gradoSucc.toString(), inline: true },
                { name: '📅 Data', value: dateFormatted, inline: false }
            )
            .setFooter({ text: 'Lyra Bot • Staff Management', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        try {
            await targetChannel.send({ content: `${targetUser}`, embeds: [staffEmbed] });

            let dmSent = true;
            await targetUser.send({
                content: 'Hai ricevuto un provvedimento dallo staff di Lyra.',
                embeds: [staffEmbed]
            }).catch(() => {
                dmSent = false;
            });

            let statusMsg = dmSent 
                ? '<:Tick:1541029265536192563> Provvedimento inviato nel canale dedicato e in DM allo staffer.' 
                : '<:Tick:1541029265536192563> Provvedimento inviato nel canale, ma l\'utente ha i DM disabilitati.';

            if (roleError) {
                statusMsg += '\n⚠️ **Attenzione:** Errore durante l\'aggiornamento dei ruoli su Discord (verifica la gerarchia del bot).';
            } else {
                statusMsg += '\n<:Tick:1541029265536192563> Ruolo precedente rimosso e nuovo ruolo applicato con successo.';
            }

            return await interaction.editReply({ content: statusMsg });

        } catch (error) {
            console.error('Errore durante l\'esecuzione di gestione-staff:', error);
            return await interaction.editReply({ content: '<:X_:1541029308716425286> Si è verificato un errore durante la trasmissione del provvedimento.' });
        }
    }

    // --- WARN CON SANZIONI AUTOMATICHE ---
    if (commandName === 'warn') {
        const targetUser = options.getUser('utente');
        const reason = options.getString('motivo');

        try {
            const warnData = await getWarnDatabase();
            if (!Array.isArray(warnData[targetUser.id])) {
                let count = typeof warnData[targetUser.id] === 'number' ? warnData[targetUser.id] : 0;
                warnData[targetUser.id] = [];
                for (let i = 0; i < count; i++) {
                    warnData[targetUser.id].push({ reason: 'Motivo precedente', date: 'Data N/D' });
                }
            }

            const now = new Date();
            const dateStr = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });

            warnData[targetUser.id].push({
                reason: reason,
                date: dateStr
            });
            await saveWarnDatabase(warnData);

            const totalWarns = warnData[targetUser.id].length;

            const warnEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: '⚠️ Sanzione Applicata', iconURL: guild.iconURL() })
                .setTitle('<a:Sirena_warn:1509834825014575195> Warn Ricevuto')
                .setDescription(
                    '```diff\n- Hai ricevuto un avvertimento.\n```\n' +
                    'Ti preghiamo di rivedere il tuo comportamento per evitare sanzioni più severe.'
                )
                .addFields(
                    { name: '👤 Utente', value: targetUser.toString(), inline: true },
                    { name: '📝 Motivo', value: reason, inline: false },
                    { name: '📊 Warn Totali', value: `${totalWarns}/7`, inline: true }
                )
                .setFooter({ text: 'Lyra Bot • Moderation System', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            await sendModerationLog(guild, 'warn', targetUser, user, reason);
            await interaction.reply({ content: `${targetUser}`, embeds: [warnEmbed] });

            // LOGICA PROGRESSIONE SANZIONI AUTOMATICHE
            const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
            if (targetMember) {
                if (totalWarns === 3) {
                    await targetMember.timeout(3600000, 'Sanzione automatica: Raggiunti 3 Warn');
                    await sendModerationLog(guild, 'timeout', targetUser, client.user, 'Sanzione Automatica: Timeout 1 ora per 3 Warn');
                } else if (totalWarns === 5) {
                    await targetMember.ban({ reason: 'Sanzione automatica: Raggiunti 5 Warn (Temp-ban 24h)' });
                    const tempbans = await getTempbansDatabase();
                    tempbans.push({
                        guildId: guild.id,
                        userId: targetUser.id,
                        expiresAt: Date.now() + 86400000
                    });
                    await saveTempbansDatabase(tempbans);
                    await sendModerationLog(guild, 'ban', targetUser, client.user, 'Sanzione Automatica: Temp-ban 24h per 5 Warn');
                } else if (totalWarns >= 7) {
                    await targetMember.ban({ reason: 'Sanzione automatica: Raggiunti 7 o più Warn (Ban Permanente)' });
                    await sendModerationLog(guild, 'ban', targetUser, client.user, 'Sanzione Automatica: Ban Permanente per 7+ Warn');
                }
            }
            return;
        } catch (e) {
            console.error('Errore comando warn:', e);
            return await interaction.reply({ content: '<:X_:1541029308716425286> Errore durante l\'assegnazione del warn.', ephemeral: true });
        }
    }

    // STORICO WARN CON PULSANTI
    if (commandName === 'warnings') {
        const targetUser = options.getUser('utente');
        const warnData = await getWarnDatabase();
        let userWarns = warnData[targetUser.id] || [];

        if (typeof userWarns === 'number') {
            let count = userWarns;
            userWarns = [];
            for (let i = 0; i < count; i++) userWarns.push({ reason: 'Motivo non registrato', date: 'N/D' });
        }

        if (userWarns.length === 0) {
            const noWarnEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ name: '📋 Storico Warn', iconURL: targetUser.displayAvatarURL() })
                .setTitle(`Warn di ${targetUser.username}`)
                .setDescription(
                    '```diff\n+ L\'utente non ha alcun warn attivo.\n```\n' +
                    'Questo utente ha un profilo pulito!'
                )
                .setFooter({ text: 'Lyra Bot • Warning System', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();
            return await interaction.reply({ embeds: [noWarnEmbed], ephemeral: true });
        }

        let warnListText = userWarns.map((w, index) => {
            return `**${index + 1}.** 📝 *${w.reason}*\n   📅 Data: \`${w.date || 'N/D'}\``;
        }).join('\n');

        const warnEmbed = new EmbedBuilder()
            .setColor('#ffaa00')
            .setAuthor({ name: '📋 Storico Warn', iconURL: targetUser.displayAvatarURL() })
            .setTitle(`Warn di ${targetUser.username}`)
            .setDescription(
                '```yaml\nStorico ammonizioni dell\'utente\n```' +
                `\nL'utente possiede **${userWarns.length}** ammonizione/i:\n\n${warnListText}`
            )
            .setFooter({ text: 'Seleziona un pulsante per revocare una specifica ammonizione.', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const row = new ActionRowBuilder();
        userWarns.slice(0, 5).forEach((_, idx) => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`remove_warn_${targetUser.id}_${idx}`)
                    .setLabel(`Rimuovi Warn #${idx + 1}`)
                    .setStyle(ButtonStyle.Danger)
            );
        });

        return await interaction.reply({
            embeds: [warnEmbed],
            components: userWarns.length > 0 ? [row] : [],
            ephemeral: true
        });
    }

    // REVOCA WARN
    if (commandName === 'revoca-warn') {
        await interaction.deferReply({ ephemeral: true });
        const targetUser = options.getUser('utente');

        try {
            const warnData = await getWarnDatabase();
            let userWarns = warnData[targetUser.id];
            if (!userWarns || (Array.isArray(userWarns) && userWarns.length === 0) || (typeof userWarns === 'number' && userWarns === 0)) {
                return await interaction.editReply({ content: '<:X_:1541029308716425286> Nessun warn presente per questo utente.' });
            }

            if (Array.isArray(userWarns)) {
                userWarns.pop();
            } else {
                warnData[targetUser.id] = Math.max(0, userWarns - 1);
            }
            await saveWarnDatabase(warnData);

            const newTotal = Array.isArray(warnData[targetUser.id]) ? warnData[targetUser.id].length : warnData[targetUser.id];
            await sendModerationLog(guild, 'revoca-warn', targetUser, user, 'Revoca ultimo warn');

            return await interaction.editReply({ content: `<:Tick:1541029265536192563> Ultimo warn revocato a **${targetUser.tag}** (Rimanenti:${newTotal}).` });
        } catch (e) { 
            return await interaction.editReply({ content: '<:X_:1541029308716425286> Errore durante la revoca del warn.' }); 
        }
    }

    // BANDI
    if (commandName === 'bandi') {
        await interaction.deferReply({ ephemeral: true });
        const stato = options.getString('stato');

        const bandiEmbed = new EmbedBuilder()
            .setColor(stato === 'aperti' ? '#00ff00' : stato === 'chiusura' ? '#ffaa00' : '#ff0000')
            .setAuthor({ name: '📣 Bandi Staff', iconURL: guild.iconURL() })
            .setTitle(stato === 'aperti' ? '🟢 BANDI APERTI!' : stato === 'chiusura' ? '🟡 IN FASE DI CHIUSURA' : '🔴 BANDI CHIUSI')
            .setDescription(
                '```yaml\nCandidature per lo Staff di Lyra\n```' +
                '\nSei pronto a metterti in gioco? Il nostro Staff è alla ricerca di nuove figure motivate.\n\n' +
                '> 📌 **Come candidarsi:**\n' +
                'Utilizza i pulsanti sottostanti per visualizzare i requisiti e compilare il modulo.\n\n' +
                '> ✨ **Cosa cerchiamo:**\n' +
                'Membri attivi, maturi e costanti pronti a contribuire alla community.\n\n' +
                '**⚠️ Scadenza:** Verrà comunicata non appena i bandi entreranno in una nuova fase.'
            )
            .setFooter({ text: 'Lyra Bot • Staff Recruitment', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const bandiRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_candidatura_open')
                .setLabel('Candidatura')
                .setEmoji('📑')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('btn_requisiti_view')
                .setLabel('Requisiti')
                .setEmoji('📌')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.channel.send({ embeds: [bandiEmbed], components: [bandiRow] });
        return await interaction.editReply({ content: '<:Tick:1541029265536192563> Pannello bandi inviato con successo nel canale.' });
    }



    // SLOWMODE
    if (commandName === 'slowmode') {
        const secondi = options.getInteger('secondi');
        await channel.setRateLimitPerUser(secondi);
        const slowmodeEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setAuthor({ name: '⏱️ Slowmode', iconURL: channel.guild.iconURL() })
            .setTitle('Modalità lenta aggiornata')
            .setDescription(
                '```yaml\nIl cooldown dei messaggi è stato modificato\n```' +
                `\n> ⏱️ **Nuovo intervallo:** ${secondi} secondi`
            )
            .setFooter({ text: 'Lyra Bot • Channel Management', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        return await interaction.reply({ embeds: [slowmodeEmbed], ephemeral: true });
    }

    // POLL
    if (commandName === 'poll') {
        const domanda = options.getString('domanda');
        const op1 = options.getString('opzione1');
        const op2 = options.getString('opzione2');

        const pollEmbed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setAuthor({ name: '📊 Sondaggio', iconURL: user.displayAvatarURL() })
            .setTitle(domanda)
            .setDescription(
                '```yaml\nVota usando le reazioni!\n```' +
                `\n> 1️⃣ ${op1}\n> 2️⃣ ${op2}`
            )
            .setFooter({ text: `Creato da ${user.tag}`, iconURL: user.displayAvatarURL() })
            .setTimestamp();

        const pollMsg = await interaction.reply({ embeds: [pollEmbed], fetchReply: true });
        await pollMsg.react('1️⃣');
        await pollMsg.react('2️⃣');
        return;
    }

    // EMBED
    if (commandName === 'embed') {
        const titolo = options.getString('titolo');
        const descrizione = options.getString('descrizione');
        const colore = options.getString('colore') || '#3498db';

        const customEmbed = new EmbedBuilder()
            .setColor(colore)
            .setAuthor({ name: '📝 Annuncio', iconURL: user.displayAvatarURL() })
            .setTitle(titolo)
            .setDescription(descrizione)
            .setFooter({ text: `Creato da ${user.tag}`, iconURL: user.displayAvatarURL() })
            .setTimestamp();
        return await interaction.reply({ embeds: [customEmbed] });
    }

    // FUN COMMANDS
    if (commandName === '8ball') {
        const domanda = options.getString('domanda');
        const risposte = ['Sì, assolutamente.', 'No, decisamente no.', 'Chiedimelo più tardi.', 'Molto probabile.', 'Le mie fonti dicono di no.'];
        const risposta = risposte[Math.floor(Math.random() * risposte.length)];
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setAuthor({ name: '🎱 Sfera di Cristallo', iconURL: client.user.displayAvatarURL() })
            .setTitle('La tua domanda')
            .setDescription(`> ${domanda}`)
            .addFields({ name: 'Risposta', value: risposta })
            .setFooter({ text: 'Lyra Bot • Fun Commands', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'roll') {
        const facce = options.getInteger('facce') || 6;
        const risultato = Math.floor(Math.random() * facce) + 1;
        const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setAuthor({ name: '🎲 Lancio del Dado', iconURL: user.displayAvatarURL() })
            .setTitle('Risultato')
            .setDescription(
                '```yaml\nDado lanciato!\n```' +
                `\n> 🎲 **Facce:** ${facce}\n> 🎯 **Risultato:** ${risultato}`
            )
            .setFooter({ text: `Tentato da ${user.tag}`, iconURL: user.displayAvatarURL() })
            .setTimestamp();
        return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'coinflip') {
        const esito = Math.random() < 0.5 ? 'Testa 🪙' : 'Croce 🪙';
        const embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setAuthor({ name: '🪙 Lancio della Moneta', iconURL: user.displayAvatarURL() })
            .setTitle('Risultato')
            .setDescription(
                '```yaml\nMoneta lanciata!\n```' +
                `\n> 🪙 **Esito:** ${esito}`
            )
            .setFooter({ text: `Tentato da ${user.tag}`, iconURL: user.displayAvatarURL() })
            .setTimestamp();
        return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'rps') {
        const mossaUtente = options.getString('scelta');
        const opzioni = ['sasso', 'carta', 'forbice'];
        const mossaBot = opzioni[Math.floor(Math.random() * opzioni.length)];

        let esito = '';
        if (mossaUtente === mossaBot) esito = 'Pareggio! 🤝';
        else if (
            (mossaUtente === 'sasso' && mossaBot === 'forbice') ||
            (mossaUtente === 'carta' && mossaBot === 'sasso') ||
            (mossaUtente === 'forbice' && mossaBot === 'carta')
        ) esito = 'Hai vinto! 🎉';
        else esito = 'Ha vinto il bot! 🤖';

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setAuthor({ name: '✂️ Sasso, Carta, Forbice', iconURL: user.displayAvatarURL() })
            .setTitle('Risultato della partita')
            .setDescription(
                '```yaml\nSfida contro il bot\n```' +
                `\n> 👤 **Tu:** ${mossaUtente}\n> 🤖 **Bot:** ${mossaBot}\n> 🏆 **Risultato:** ${esito}`
            )
            .setFooter({ text: `Giocato da ${user.tag}`, iconURL: user.displayAvatarURL() })
            .setTimestamp();
        return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'trivia') {
        const domandaEmbed = new EmbedBuilder()
            .setColor('#e67e22')
            .setAuthor({ name: '❓ Quiz di Cultura Generale', iconURL: client.user.displayAvatarURL() })
            .setTitle('Domanda')
            .setDescription(
                '```yaml\nQual è la capitale della Francia?\n```' +
                '\n> 1️⃣ Berlino\n> 2️⃣ Parigi\n> 3️⃣ Madrid\n> 4️⃣ Roma'
            )
            .setFooter({ text: 'Lyra Bot • Trivia', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        return await interaction.reply({ embeds: [domandaEmbed] });
    }

    // STATUS
    if (commandName === 'status') {
        await interaction.deferReply({ ephemeral: true });
        const stato = options.getString('stato');
        const statusChannel = guild.channels.cache.get('1513127635553615992');

        if (!statusChannel) return await interaction.editReply({ content: '<:X_:1541029308716425286> Canale status irraggiungibile.' });

        try {
            await statusChannel.bulkDelete(100, true).catch(() => {});
            const statusEmbed = new EmbedBuilder().setTimestamp();
            let attachment;

            if (stato === 'on') {
                attachment = new AttachmentBuilder('./1.gif', { name: '1.gif' });
                statusEmbed
                    .setColor('#00ff2b')
                    .setAuthor({ name: '🟢 Stato Bot', iconURL: client.user.displayAvatarURL() })
                    .setTitle('<:Bot_on:1510604438539075595> STATO: ONLINE')
                    .setDescription('```diff\n+ Il bot è completamente operativo\n```')
                    .setImage('attachment://1.gif')
                    .setFooter({ text: 'Lyra Bot • Status System', iconURL: client.user.displayAvatarURL() });
            } else if (stato === 'off') {
                attachment = new AttachmentBuilder('./2.gif', { name: '2.gif' });
                statusEmbed
                    .setColor('#ff0000')
                    .setAuthor({ name: '🔴 Stato Bot', iconURL: client.user.displayAvatarURL() })
                    .setTitle('<:Bot_offline:1510604379215106118> STATO: OFFLINE')
                    .setDescription('```diff\n- Il bot è offline\n```')
                    .setImage('attachment://2.gif')
                    .setFooter({ text: 'Lyra Bot • Status System', iconURL: client.user.displayAvatarURL() });
            } else if (stato === 'manutenzione') {
                attachment = new AttachmentBuilder('./3.gif', { name: '3.gif' });
                statusEmbed
                    .setColor('#ffa600')
                    .setAuthor({ name: '🟡 Stato Bot', iconURL: client.user.displayAvatarURL() })
                    .setTitle('<:Bot_manutenzione:1513128950749204642> STATO: MANUTENZIONE')
                    .setDescription('```yaml\nIl bot è in manutenzione\n```')
                    .setImage('attachment://3.gif')
                    .setFooter({ text: 'Lyra Bot • Status System', iconURL: client.user.displayAvatarURL() });
            }

            await statusChannel.send({ embeds: [statusEmbed], files: [attachment] });
            return await interaction.editReply({ content: `<:Tick:1541029265536192563> Status aggiornato a: **${stato.toUpperCase()}**.` });
        } catch (error) {
            return await interaction.editReply({ content: '<:X_:1541029308716425286> Errore aggiornamento status.' });
        }
    }

    // CLEAR
    if (commandName === 'clear') {
        await interaction.deferReply({ ephemeral: true });
        const quantita = options.getInteger('quantita');

        const isFounder = member.roles.cache.has(CANCEL_ROLES.FOUNDER);
        const isLimitedRole = member.roles.cache.some(role => CANCEL_ROLES.LIMITED.includes(role.id));

        if (!isFounder && !isLimitedRole) {
            return await interaction.editReply({ content: '<:X_:1541029308716425286> Privilegi insufficienti.' });
        }

        try {
            const deleted = await channel.bulkDelete(quantita, true);
            
            if (channel.id === TICKET_PANEL_CHANNEL_ID) {
                await autoCheckAndSendTicketPanel(guild);
            }

            return await interaction.editReply({ content: `<:Tick:1541029265536192563> Eliminati **${deleted.size}** messaggi.` });
        } catch (error) {
            return await interaction.editReply({ content: '<:X_:1541029308716425286> Errore durante la cancellazione.' });
        }
    }

    // BAN (CON TEMP-BAN), UNBAN, KICK, TIMEOUT
    if (commandName === 'ban') {
        await interaction.deferReply({ ephemeral: true });
        const targetUser = options.getUser('target');
        const reason = options.getString('motivo') || 'Nessun motivo';
        const durationStr = options.getString('durata');

        try {
            const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
            if (!targetMember || !targetMember.bannable) {
                return await interaction.editReply({ content: '<:X_:1541029308716425286> Impossibile bannare questo utente.' });
            }

            if (targetMember.roles.highest.position >= member.roles.highest.position) {
                return await interaction.editReply({ content: '<:X_:1541029308716425286> Non puoi bannare un utente con un ruolo pari o superiore al tuo!' });
            }

            const durationMs = durationStr ? parseDuration(durationStr) : null;
            await targetMember.ban({ reason });

            // Invia DM all'utente
            const banEmbed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setAuthor({ name: '🔨 Ban Applicato', iconURL: guild.iconURL() })
                .setTitle('Sei stato bannato dal server')
                .setDescription(
                    '```diff\n- Hai ricevuto una sanzione di ban.\n```\n' +
                    'Questa decisione è stata presa dallo Staff dopo aver valutato la tua condotta.'
                )
                .addFields(
                    { name: '🌐 Server', value: guild.name, inline: true },
                    { name: '👮 Moderatore', value: user.tag, inline: true },
                    { name: '📝 Motivo', value: reason, inline: false },
                    { name: '⏱️ Durata', value: durationStr ? durationStr : 'Permanente', inline: true }
                )
                .setFooter({ text: 'Se ritieni che questo sia un errore, contatta il supporto.', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            await targetUser.send({ embeds: [banEmbed] }).catch(() => {});

            if (durationMs) {
                const tempbans = await getTempbansDatabase();
                tempbans.push({
                    guildId: guild.id,
                    userId: targetUser.id,
                    expiresAt: Date.now() + durationMs
                });
                await saveTempbansDatabase(tempbans);
                await sendModerationLog(guild, 'ban', targetUser, user, `Temp-ban (${durationStr}) | Motivo: ${reason}`);
                return await interaction.editReply({ content: `<:Tick:1541029265536192563> **${targetUser.tag}** bannato temporaneamente per **${durationStr}**.` });
            } else {
                await sendModerationLog(guild, 'ban', targetUser, user, reason);
                return await interaction.editReply({ content: `<:Tick:1541029265536192563> **${targetUser.tag}** bannato permanentemente.` });
            }
        } catch (e) {
            return await interaction.editReply({ content: '<:X_:1541029308716425286> Errore durante l\'esecuzione del ban.' });
        }
    }

    if (commandName === 'unban') {
        await interaction.deferReply({ ephemeral: true });
        const userId = options.getString('id');
        const reason = options.getString('motivo') || 'Nessun motivo';

        try {
            await guild.members.unban(userId, reason);
            const dummyUser = { id: userId, username: userId, toString: () => `<@${userId}>` };
            await sendModerationLog(guild, 'unban', dummyUser, user, reason);

            // Invia DM all'utente
            const unbanEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setAuthor({ name: '🔓 Ban Revocato', iconURL: guild.iconURL() })
                .setTitle('Sei stato sbannato dal server')
                .setDescription(
                    '```diff\n+ Il tuo ban è stato revocato.\n```\n' +
                    'Sei nuovamente libero di unirti al server. Ti auguriamo un buon permanenza!'
                )
                .addFields(
                    { name: '🌐 Server', value: guild.name, inline: true },
                    { name: '👮 Moderatore', value: user.tag, inline: true },
                    { name: '📝 Motivo', value: reason, inline: false }
                )
                .setFooter({ text: 'Lyra Bot • Moderation System', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            await client.users.send(userId, { embeds: [unbanEmbed] }).catch(() => {});

            return await interaction.editReply({ content: `<:Tick:1541029265536192563> Utente con ID **${userId}** sbannato.` });
        } catch (e) {
            return await interaction.editReply({ content: '<:X_:1541029308716425286> ID non valido o utente non trovato nella lista ban.' });
        }
    }

    if (commandName === 'kick') {
        await interaction.deferReply({ ephemeral: true });
        const targetUser = options.getUser('target');
        const reason = options.getString('motivo') || 'Nessun motivo';

        try {
            const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
            if (!targetMember || !targetMember.kickable) {
                return await interaction.editReply({ content: '<:X_:1541029308716425286> Impossibile espellere questo utente.' });
            }

            if (targetMember.roles.highest.position >= member.roles.highest.position) {
                return await interaction.editReply({ content: '<:X_:1541029308716425286> Non puoi espellere un utente con un ruolo pari o superiore al tuo!' });
            }

            await targetMember.kick(reason);
            await sendModerationLog(guild, 'kick', targetUser, user, reason);

            // Invia DM all'utente
            const kickEmbed = new EmbedBuilder()
                .setColor('#e67e22')
                .setAuthor({ name: '👢 Kick Applicato', iconURL: guild.iconURL() })
                .setTitle('Sei stato espulso dal server')
                .setDescription(
                    '```diff\n- Hai ricevuto un kick dal server.\n```\n' +
                    'Sei stato temporaneamente rimosso. Puoi rientrare, ma ti preghiamo di rispettare le regole.'
                )
                .addFields(
                    { name: '🌐 Server', value: guild.name, inline: true },
                    { name: '👮 Moderatore', value: user.tag, inline: true },
                    { name: '📝 Motivo', value: reason, inline: false }
                )
                .setFooter({ text: 'Per rientrare, usa un nuovo invite del server.', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            await targetUser.send({ embeds: [kickEmbed] }).catch(() => {});

            return await interaction.editReply({ content: `<:Tick:1541029265536192563> **${targetUser.tag}** espulso.` });
        } catch (e) {
            return await interaction.editReply({ content: '<:X_:1541029308716425286> Errore durante l\'espulsione.' });
        }
    }

    if (commandName === 'timeout') {
        await interaction.deferReply({ ephemeral: true });
        const targetUser = options.getUser('utente');
        const durationMinutes = options.getInteger('durata');
        const reason = options.getString('motivo') || 'Nessun motivo';

        try {
            const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
            if (!targetMember || !targetMember.moderatable) {
                return await interaction.editReply({ content: '<:X_:1541029308716425286> Impossibile mettere in timeout questo utente.' });
            }

            if (targetMember.roles.highest.position >= member.roles.highest.position) {
                return await interaction.editReply({ content: '<:X_:1541029308716425286> Non puoi mettere in timeout un utente con un ruolo pari o superiore al tuo!' });
            }

            await targetMember.timeout(durationMinutes * 60 * 1000, reason);
            await sendModerationLog(guild, 'timeout', targetUser, user, `Durata: ${durationMinutes}m | Motivo: ${reason}`);

            // Invia DM all'utente
            const timeoutEmbed = new EmbedBuilder()
                .setColor('#f39c12')
                .setAuthor({ name: '⏰ Timeout Applicato', iconURL: guild.iconURL() })
                .setTitle('Sei stato messo in isolamento')
                .setDescription(
                    '```diff\n- Hai ricevuto un timeout temporaneo.\n```\n' +
                    'Non potrai inviare messaggi nei canali fino alla scadenza del timeout.'
                )
                .addFields(
                    { name: '🌐 Server', value: guild.name, inline: true },
                    { name: '👮 Moderatore', value: user.tag, inline: true },
                    { name: '⏱️ Durata', value: `${durationMinutes} minuti`, inline: true },
                    { name: '📝 Motivo', value: reason, inline: false }
                )
                .setFooter({ text: 'Rifletti sul tuo comportamento durante questo periodo.', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            await targetUser.send({ embeds: [timeoutEmbed] }).catch(() => {});

            return await interaction.editReply({ content: `<:Tick:1541029265536192563> **${targetUser.tag}** in isolamento per ${durationMinutes} minuti.` });
        } catch (e) {
            return await interaction.editReply({ content: '<:X_:1541029308716425286> Errore durante il timeout.' });
        }
    }

    if (commandName === 'untimeout') {
        await interaction.deferReply({ ephemeral: true });
        const targetUser = options.getUser('utente');
        const reason = options.getString('motivo') || 'Revoca manuale';

        try {
            const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
            if (!targetMember) return await interaction.editReply({ content: '<:X_:1541029308716425286> Utente non trovato.' });

            await targetMember.timeout(null, reason);
            await sendModerationLog(guild, 'untimeout', targetUser, user, reason);

            // Invia DM all'utente
            const untimeoutEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setAuthor({ name: '✅ Timeout Revocato', iconURL: guild.iconURL() })
                .setTitle('Il tuo isolamento è terminato')
                .setDescription(
                    '```diff\n+ Il tuo timeout è stato revocato.\n```\n' +
                    'Puoi nuovamente inviare messaggi nei canali del server. Ti auguriamo una buona permanenza!'
                )
                .addFields(
                    { name: '🌐 Server', value: guild.name, inline: true },
                    { name: '👮 Moderatore', value: user.tag, inline: true },
                    { name: '📝 Motivo', value: reason, inline: false }
                )
                .setFooter({ text: 'Lyra Bot • Moderation System', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            await targetUser.send({ embeds: [untimeoutEmbed] }).catch(() => {});

            return await interaction.editReply({ content: `<:Tick:1541029265536192563> Isolamento revocato a **${targetUser.tag}**.` });
        } catch (e) {
            return await interaction.editReply({ content: '<:X_:1541029308716425286> Errore durante la revoca del timeout.' });
        }
    }
});

// BENVENUTO E AUTO-ROLE MEMBRI
client.on('guildMemberAdd', async (member) => {
    if (AUTO_ROLE_ID && member.guild.roles.cache.has(AUTO_ROLE_ID)) {
        await member.roles.add(AUTO_ROLE_ID).catch(err => console.error('Errore durante l\'assegnazione dell\'auto-role:', err));
    }

    const welcomeChannel = member.guild.channels.cache.get('1503075342355529949');
    if (welcomeChannel) {
        const welcomeEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setAuthor({ name: '🎉 Benvenuto/a!', iconURL: member.user.displayAvatarURL() })
            .setTitle(`Bentornato ${member.user.username}!`)
            .setDescription(
                '```yaml\nNuovo membro nella community\n```' +
                '\nTi diamo il benvenuto in **Lyra**! Siamo felici di averti con noi.\n\n' +
                '> 📖 Leggi il regolamento nei canali dedicati\n> 🎫 Usa il pannello ticket se hai bisogno di aiuto\n> 🎭 Personalizza i tuoi ruoli nel canale apposito'
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setFooter({ text: `Ora siamo ${member.guild.memberCount} membri!`, iconURL: member.guild.iconURL() })
            .setTimestamp();
        await welcomeChannel.send({ content: `${member}`, embeds: [welcomeEmbed] }).catch(() => {});
    }
});

// GESTIONE ERRORI
client.on('error', (error) => console.error('Errore client Discord:', error));
process.on('uncaughtException', (error) => console.error('Eccezione non gestita:', error));
process.on('unhandledRejection', (reason) => console.error('Promise rifiutata:', reason));

client.login(process.env.DISCORD_TOKEN);