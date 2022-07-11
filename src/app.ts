import 'dotenv/config'
import { setTimeout } from 'timers/promises'
import { 
    CategoryChannel,
    Client,
    GuildBasedChannel,
    GuildChannel,
    Intents,
    TextBasedChannel
} from 'discord.js'

import { addRowToWl, getDiscordIds } from './data'

// TODO: Expand these for messages and structs
interface wlRow {
    discord_id: string,
    discord_username: string,
    category: string,
    email?: string,
    wl_address?: string
}

// TODO: Our example for settings to be stored and fetched in DB
const config = {
    scrape: false,
    monitor: true,
    allowOverwrite: false,
    categoryChannels: true,
    validateAddress: true,
    validateAddressBalance: false,
    validateAddressMembership: false,
}

// Create a new client instance
const client = new Client({ intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MEMBERS
] })

const TIMEOUT = 2500

// TODO: Set as option?
// let __channels = process.env.DISCORD_CHANNELS as string
// let channels = __channels.split(',')

// TODO: System setup for google sheet or something easy
// for people to use to store info

// TODO: Dynamic
let _category_channels = process.env.DISCORD_CATEGORY_CHANNELS as string
const category_channels = _category_channels.split(',')

let _roles = process.env.DISCORD_ROLES as string
const roles = _roles.split(',') // NOTE: Order does matter... 

// When the client is ready, run this code (only once)
client.once('ready', async() => {
	console.log('Ready!')
    // TODO: Set parse timeout to take all usernames who have posted in a channel
    // TODO: Store or automatically assign roles
    const system = await buildSystem()
    // TODO: Dynamic
    await addToWlByChannel(system.channels, system.currentList)
    await addToWlByRole(system.currentList)
    console.log('Scrape completed.')
})

client.on('messageCreate', async message => {
    console.log('Something happened')
    const system = await buildSystem()
    const textChannel = message.channel as GuildBasedChannel
    const discord_id = message.author.id as string
    const discord_username = message.author.username as string
    const category = textChannel.name as string
    try {
        await addToSheet(system.currentList, discord_id, discord_username, category)
    } catch(e) {
        console.error(e)
    }
})

// TODO: Need function to listen for category channel create or something
// TODO: Setup this for some other tracking???
client.on('channelCreate', async(channel) => {
    console.log('Channel created')
    //console.log(channel)
})

const buildSystem = async() => {
    let channels = []
    console.log('Our category channels')
    console.log(category_channels)
    
    for(let categoryId of category_channels) {
        try {
            const category = await client.channels.fetch(categoryId) as CategoryChannel
            for(let channel__ of category.children){
                channels.push(channel__[0].toString())
            }
        } catch (err) {
            console.error(`Channel not found: ${err}`)
        }
    }
    console.log('Our channels')
    console.log(channels)
    
    const currentList = await getDiscordIds()
    console.log('WL Discord Ids')
    console.log(currentList)
    return {
        channels: channels,
        currentList: currentList
    }
}

const addToWlByChannel = async(channels: any, currentList: any) => {
    for(let channel of channels) {
        const _channel = await client.channels.fetch(channel) as GuildChannel
        console.log(`Scraping channel: ${_channel.name} ${_channel.toString()}`)
        const __channel = _channel as TextBasedChannel
        try {
            const messages = await __channel.messages.fetch()
            for(let message of messages) {
                const textChannel = message[1].channel as GuildBasedChannel
                const discord_id = message[1].author.id as string
                const discord_username = message[1].author.username as string
                const category = textChannel.name as string
                await addToSheet(currentList, discord_id, discord_username, category)
            }
        } catch (err) {
            console.error(err)
            continue
        }
    }
}

// TODO: Fetch based on roles to add to WL
// Sync1, Sync2, Sync3, Basic WL???
const addToWlByRole = async(currentList: any) => {
    // TODO: Dynamic
    const guild = client.guilds.cache.get(process.env.DISCORD_GUID as string)

    for(let roleId of roles) {
        if(!guild){
            return
        }
        const roleDetails = await guild.members.fetch()
        const role = guild.roles.cache.get(roleId)
        if(!role){
            return
        }
        const roleName = role.name
        console.log(`Scraping for role: ${roleName}`)
        const members = roleDetails.filter(member => member.roles.cache.some(role => role.id === roleId))
        for(let member of members){
            const discord_id = member[1].id as string
            const discord_username = member[1].displayName as string
            const category = roleName
            await addToSheet(currentList, discord_id, discord_username, category)
        }
    }
}

const addToSheet = async(currentList: any, discord_id: string, discord_username: string, category: string) => {
    if(currentList.includes(discord_id)) {
        console.log('Discord user already in list')
        return
    }
    // TODO: Handle information for validity parsing
    const wlData = {
        discord_id: discord_id,
        discord_username: discord_username,
        category: category
    } as wlRow
    console.log('Sending to sheets from discord')
    console.log(wlData)
    await addRowToWl(wlData)
    await setTimeout(TIMEOUT) // TODO: Consider refactor in Google interface
    return
}

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN)