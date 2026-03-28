import discord
from discord.ext import commands
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix='!', intents=intents)


@bot.event
async def on_ready():
    print(f'=== BOT CONNECTED ===')
    print(f'Bot: {bot.user}')
    print(f'ID: {bot.user.id}')
    print(f'Guilds: {len(bot.guilds)}')
    for guild in bot.guilds:
        print(f'  Server: {guild.name} ({guild.id})')
    print(f'Commands: {[c.name for c in bot.commands]}')
    print('====================')
    await bot.change_presence(activity=discord.Activity(
        type=discord.ActivityType.watching,
        name="Philly Gas Prices | !gas-help"
    ))

@bot.event
async def on_message(message):
    print(f"MSG: '{message.content}' | Author: {message.author} | Channel: #{message.channel}")
    await bot.process_commands(message)

@bot.event
async def on_command(ctx):
    print(f"CMD: {ctx.command} triggered")

@bot.event
async def on_error(event, *args, **kwargs):
    import traceback
    print(f"ERROR in {event}: {args}")
    traceback.print_exc()


@bot.command(name='gas-help', help='Show all available commands')
async def help_command(ctx):
    embed = discord.Embed(
        title="PhillyGasAlerts Bot Commands",
        description="Available commands for gas price tracking\nAll times displayed in EST/EDT",
        color=0x00FF00
    )
    
    commands_list = [
        ("!gas-stats", "Show current database statistics"),
        ("!gas-top", "Show top 5 cheapest stations (24h)"),
        ("!gas-expensive", "Show top 5 most expensive stations (24h)"),
        ("!gas-map", "Generate interactive gas price map"),
        ("!gas-zip [zip]", "Show prices for a specific ZIP code"),
        ("!gas-trends", "Show price volatility statistics"),
        ("!gas-help", "Show this help message"),
    ]
    
    for cmd, desc in commands_list:
        embed.add_field(name=cmd, value=desc, inline=False)
    
    embed.set_footer(text="PhillyGasAlerts | Times in EST/EDT | Data stored in UTC")
    await ctx.send(embed=embed)


@bot.command(name='gas-stats', help='Show current database statistics')
async def stats_command(ctx):
    try:
        from utils.database import get_total_stats, get_last_scrape_time
        
        stats = get_total_stats()
        
        if not stats or stats['total_records'] == 0:
            await ctx.send("No data available in the database.")
            return
        
        last_scrape = get_last_scrape_time()
        if last_scrape:
            time_diff = datetime.now(last_scrape.tzinfo) - last_scrape
            hours = time_diff.total_seconds() / 3600
            if hours < 1:
                last_scrape_str = f"{int(hours * 60)} minutes ago"
            else:
                last_scrape_str = f"{int(hours)} hours ago"
        else:
            last_scrape_str = "Unknown"
        
        embed = discord.Embed(
            title="📊 PhillyGasAlerts - Current Statistics",
            color=0x3498DB
        )
        
        embed.add_field(
            name="Database",
            value=f"Total Records: **{stats['total_records']}**\n"
                  f"Unique Stations: **{stats['unique_stations']}**\n"
                  f"ZIP Codes: **{stats['zip_codes']}**",
            inline=True
        )
        
        embed.add_field(
            name="Price Range (24h)",
            value=f"Lowest: **${stats['min_price']}**\n"
                  f"Highest: **${stats['max_price']}**\n"
                  f"Average: **${stats['avg_price']}**",
            inline=True
        )
        
        embed.add_field(
            name="Data Freshness",
            value=f"Last scrape: **{last_scrape_str}**\n"
                  f"First record: {stats['first_record'].strftime('%Y-%m-%d') if stats['first_record'] else 'N/A'}",
            inline=False
        )
        
        embed.set_footer(text="PhillyGasAlerts | Times in EST/EDT")
        await ctx.send(embed=embed)
        
    except Exception as e:
        await ctx.send(f"Error retrieving stats: {e}")


@bot.command(name='gas-top', help='Show top 5 cheapest stations')
async def top_command(ctx):
    try:
        from utils.database import get_top_stations
        
        stations = get_top_stations(limit=5, cheapest=True)
        
        if not stations:
            await ctx.send("No recent data available.")
            return
        
        embed = discord.Embed(
            title="🏆 Top 5 Cheapest Stations (24h)",
            description="Lowest gas prices in Philadelphia area",
            color=0x2ECC71
        )
        
        for i, station in enumerate(stations, 1):
            emoji = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else "⛽"
            embed.add_field(
                name=f"{emoji} {station['station_name']}",
                value=f"**${station['price_regular']:.2f}/gal**\n"
                      f"{station['address']}\n"
                      f"ZIP: {station['zip_code']}",
                inline=False
            )
        
        embed.set_footer(text="PhillyGasAlerts | Times in EST/EDT")
        await ctx.send(embed=embed)
        
    except Exception as e:
        await ctx.send(f"Error retrieving top stations: {e}")


@bot.command(name='gas-expensive', help='Show top 5 most expensive stations')
async def expensive_command(ctx):
    try:
        from utils.database import get_top_stations
        
        stations = get_top_stations(limit=5, cheapest=False)
        
        if not stations:
            await ctx.send("No recent data available.")
            return
        
        embed = discord.Embed(
            title="💸 Top 5 Most Expensive Stations (24h)",
            description="Highest gas prices in Philadelphia area",
            color=0xE74C3C
        )
        
        for i, station in enumerate(stations, 1):
            embed.add_field(
                name=f"{i}. {station['station_name']}",
                value=f"**${station['price_regular']:.2f}/gal**\n"
                      f"{station['address']}\n"
                      f"ZIP: {station['zip_code']}",
                inline=False
            )
        
        embed.set_footer(text="PhillyGasAlerts | Times in EST/EDT")
        await ctx.send(embed=embed)
        
    except Exception as e:
        await ctx.send(f"Error retrieving expensive stations: {e}")


@bot.command(name='gas-map', help='Generate interactive gas price map')
async def map_command(ctx):
    await ctx.send("🗺️ Generating interactive map... This may take a moment.")
    
    try:
        from map_generator import save_map
        
        map_file = save_map()
        
        if map_file and os.path.exists(map_file):
            await ctx.send(
                "📍 **Interactive Gas Price Map Generated!**\n"
                "Open the attached HTML file in a browser to explore:\n"
                "- Click markers for station details\n"
                "- Use cluster view for dense areas\n"
                "- Toggle layers (Map/Clusters/Heatmap)\n"
                "- Fullscreen available"
            )
            await ctx.send(file=discord.File(map_file))
        else:
            await ctx.send("❌ Failed to generate map. Please try again later.")
            
    except Exception as e:
        await ctx.send(f"Error generating map: {e}")


@bot.command(name='gas-trends', help='Show price volatility statistics')
async def trends_command(ctx):
    try:
        from utils.database import get_volatility_stats
        
        trends = get_volatility_stats()
        
        if not trends:
            await ctx.send("Not enough data for volatility analysis yet.")
            return
        
        embed = discord.Embed(
            title="📈 Price Volatility Analysis (7 days)",
            description="Stations with the most price variation",
            color=0x9B59B6
        )
        
        for station in trends[:7]:
            if station['price_range'] and station['price_range'] > 0:
                embed.add_field(
                    name=f"⛽ {station['station_name']}",
                    value=f"Range: **${station['price_range']:.2f}**\n"
                          f"Min: ${station['min_price']} | Max: ${station['max_price']}\n"
                          f"Price changes: {station['price_changes']}",
                    inline=False
                )
        
        embed.set_footer(text="PhillyGasAlerts | Times in EST/EDT | Higher range = More volatile")
        await ctx.send(embed=embed)
        
    except Exception as e:
        await ctx.send(f"Error retrieving trends: {e}")


@bot.command(name='gas-zip', help='Show prices for a specific ZIP code')
async def zip_command(ctx, zip_code: str = None):
    if not zip_code:
        await ctx.send("Please provide a ZIP code: `!gas-zip 19125`")
        return
    
    try:
        from utils.database import get_recent_records
        
        records = get_recent_records(hours=24, limit=100)
        zip_records = [r for r in records if r['zip_code'] == zip_code]
        
        if not zip_records:
            await ctx.send(f"No data found for ZIP code {zip_code}")
            return
        
        prices = [float(r['price_regular']) for r in zip_records]
        
        embed = discord.Embed(
            title=f"📍 Gas Prices in ZIP {zip_code}",
            description=f"{len(zip_records)} stations found",
            color=0xF39C12
        )
        
        unique_stations = {}
        for r in zip_records:
            key = r['station_name']
            if key not in unique_stations or r['time'] > unique_stations[key]['time']:
                unique_stations[key] = r
        
        sorted_stations = sorted(unique_stations.values(), key=lambda x: float(x['price_regular']))
        
        for station in sorted_stations[:10]:
            embed.add_field(
                name=f"⛽ {station['station_name']}",
                value=f"**${station['price_regular']:.2f}/gal**\n{station['address']}",
                inline=False
            )
        
        embed.add_field(
            name="ZIP Statistics",
            value=f"Lowest: **${min(prices):.2f}**\n"
                  f"Highest: **${max(prices):.2f}**\n"
                  f"Average: **${sum(prices)/len(prices):.2f}**",
            inline=False
        )
        
        await ctx.send(embed=embed)
        
    except Exception as e:
        await ctx.send(f"Error retrieving ZIP data: {e}")


@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.MissingRequiredArgument):
        await ctx.send(f"Missing required argument. Use `!gas-help` for command list.")
    elif isinstance(error, commands.CommandNotFound):
        pass
    else:
        await ctx.send(f"An error occurred: {error}")


if __name__ == "__main__":
    if not TOKEN:
        print("ERROR: DISCORD_BOT_TOKEN not found in environment")
        sys.exit(1)
    
    print("Starting PhillyGasAlerts Bot...")
    bot.run(TOKEN)
