import discord
import os
from dotenv import load_dotenv

load_dotenv('.env')
TOKEN = os.environ.get('DISCORD_BOT_TOKEN')

print("Starting test bot...")
print(f"Token: {TOKEN[:20]}...")

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.messages = True

print(f"Intents - message_content: {intents.message_content}")

client = discord.Client(intents=intents)

@client.event
async def on_ready():
    print(f"✓ on_ready fired!")
    print(f"Bot: {client.user}")
    print(f"ID: {client.user.id}")
    print(f"Servers: {len(client.guilds)}")
    for g in client.guilds:
        print(f"  - {g.name}")
    
@client.event
async def on_message(message):
    print(f"MSG: '{message.content}' | Author: {message.author} | Guild: {message.guild}")
    if message.content.startswith('!test'):
        await message.channel.send("Test response working!")

@client.event
async def on_error(event, *args):
    print(f"ERROR: {event} - {args}")

print("Running bot...")
client.run(TOKEN)
