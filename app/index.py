import os
import discord
import qrcode
import asyncio
from discord.ext import commands
from discord import app_commands

class oldQRcode(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="oldqrcode", description="URLや文字列からQRコードを生成します")
    @app_commands.describe(text="なんだい")
    async def qrcode(self, interaction: discord.Interaction, text: str):
        await interaction.response.defer(ephemeral=True)

        img = qrcode.make(text)
        path = f"qr_{interaction.user.id}.png"
        img.save(path)

        file = discord.File(path, filename="qrcode.png")
        message = await interaction.followup.send(
            content=f"✅ QRコードを生成しました: `{text}`\n※このメッセージは15分後に削除されます。",
            file=file,
            ephemeral=False  # 他の人にも見せたいなら False
        )
        os.remove(path)

        # 15分待ってから削除
        await asyncio.sleep(900)
        try:
            await message.delete()
        except discord.NotFound:
            pass  # メッセージがすでに削除されていたら無視

async def setup(bot):
    await bot.add_cog(oldQRcode(bot))
