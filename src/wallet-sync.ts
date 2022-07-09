import 'dotenv/config'
import { 
	Client,
	MessageActionRow,
	Modal,
	TextInputComponent,
	Intents,
	ModalActionRowComponent,
	GuildMemberRoleManager,
	MessageEmbed,
	TextBasedChannel
} from 'discord.js'

import { addWalletToRow } from './data'
import { validateSolanaAddress } from './utils'

// TODO: Refactor to commands
const client = new Client({ intents: [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	Intents.FLAGS.GUILD_MEMBERS
] })

client.once('ready', async() => {
	console.log('Ready!')
})


let _roles = process.env.DISCORD_ROLES as string
const wlRoles = _roles.split(',') // NOTE: Order does matter... 

// TODO: Dynamic
const color = '#ffffff'

// TODO: Setup embed
client.on('interactionCreate',async (interaction) => {
	if (!interaction.isCommand()) return

	if (interaction.commandName === 'testembed') {
		const embed = createEmbed()
		console.log('Created embed')
		// TODO: Which channel?
		//await (discord.channel as TextChannel).send({ embeds: [embed] })
	}
	
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return
	
	if (interaction.commandName === 'testaddwallet') {
		const roles = interaction.member?.roles as unknown as GuildMemberRoleManager
		const memberRoles = roles.cache.some(r => wlRoles.includes(r.id))

		if(memberRoles){
			console.log(roles.cache)
		} else {
			await interaction.reply({ content: '🚫 Error you do not have permission to do that.', ephemeral: true })
			return
		}
		// TODO: Fetch user ID from WL sheet as well
		// Create the modal
		const modal = new Modal()
			.setCustomId('walletModal')
			.setTitle('Whitelist Wallet')
		// Add components to modal
		// Create the text input components
		const walletIdInput = new TextInputComponent()
			.setCustomId('walletId')
		    // The label is the prompt the user sees for this input
			.setLabel("Insert your wallet for whitelist")
		    // Short means only a single line of text
			.setStyle('SHORT')
			.setRequired(true)
		// TODO: Can I set a valid auth key or something so the comms between this
		// and the pickup from modal so no one can override?
		// An action row only holds one text input,
		// so you need one action row per text input.
		const firstActionRow = new MessageActionRow<ModalActionRowComponent>()
		firstActionRow.addComponents(walletIdInput)

		// Add inputs to the modal
		modal.addComponents(firstActionRow)
		// Show the modal to the user
		await interaction.showModal(modal)
	}
	return
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isModalSubmit()) return
	// Get the data entered by the user
	console.log(`Received submission from: ${interaction.user.id}`)
	const discordId = interaction.user.id
	const walletIdInput = interaction.fields.getTextInputValue('walletId')
	await interaction.deferReply({ ephemeral: true })

	const isValidWallet = await validateSolanaAddress(walletIdInput)
	if(isValidWallet) {
		console.log('Wallet is valid address')
		// TODO: Handle if no row??
		// TODO: If value is filled, do not fill, as we likely want them to open a ticket
		// this is to prevent hacking of the endpoint and overwriting address
		const addedWallet = await addWalletToRow(discordId as string, walletIdInput as string)
		if (addedWallet) {
			await interaction.editReply({ content: `✅ You've succesfully addeded ${walletIdInput}`})
		} else {
			await interaction.editReply({ content: `🚫 Error adding wallet, not found on whitelist`})
		}
	} else {
		console.log('Wallet is invalid address')
		await interaction.editReply({ content: `🚫 Error adding wallet, not valid Solana Address`})
	}
	return
})

const createEmbed = () => {
	let embedMessage = new MessageEmbed()
		.setColor(color)
		.setTitle('Wallet Whitelist Submission')
		.setURL('')
		.setAuthor({
			name: 'Sentries Whitelist Manager',
			iconURL: '',
			url: '',
		})
		.setDescription('Use the two buttons below to submit your wallet with Sentries Whitlist Manager')
		.setThumbnail('')
		.addFields({
			name: 'Information',
			value: 'If you need help or cannot use the tool please open a support ticket.'
		})
		.addField('Details', 'Stub test field for other content if needed.')
		.setFooter({
			text: 'Use Sentries products for your community, contact us today!',
			iconURL: ''
		})
	return embedMessage
}

client.login(process.env.DISCORD_TOKEN)