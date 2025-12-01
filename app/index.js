import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import QRCode from "qrcode";
import { Client, GatewayIntentBits, AttachmentBuilder, Events, REST, Routes, SlashCommandBuilder } from "discord.js";

// __dirname を使えるようにする
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// トークンとクライアントID/GUILD_ID は環境変数に入れると安全です
const TOKEN = "YOUR_BOT_TOKEN";
const CLIENT_ID = "YOUR_CLIENT_ID";
const GUILD_ID = "YOUR_GUILD_ID";

// スラッシュコマンド登録
const commands = [
  new SlashCommandBuilder()
    .setName("oldqrcode")
    .setDescription("URLや文字列からQRコードを生成します")
    .addStringOption(option =>
      option.setName("text")
        .setDescription("なんだい")
        .setRequired(true)
    )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands },
    );
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "oldqrcode") {
    const text = interaction.options.getString("text");

    await interaction.deferReply({ ephemeral: true });

    // QRコード生成
    const qrPath = path.join(__dirname, `qr_${interaction.user.id}.png`);
    await QRCode.toFile(qrPath, text);

    const file = new AttachmentBuilder(qrPath, { name: "qrcode.png" });

    const message = await interaction.followUp({
      content: `✅ QRコードを生成しました: \`${text}\`\n※このメッセージは15分後に削除されます。`,
      files: [file],
      ephemeral: false, // 他の人にも見せたい場合は false
    });

    // ファイル削除
    fs.unlink(qrPath, err => {
      if (err) console.error("QRコードファイル削除エラー:", err);
    });

    // 15分後に削除
    setTimeout(async () => {
      try {
        await message.delete();
      } catch (err) {
        console.log("メッセージはすでに削除されていました。");
      }
    }, 15 * 60 * 1000); // 15分
  }
});

client.login(TOKEN);
