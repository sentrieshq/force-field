import 'dotenv/config'
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet'

const credFile = process.env.GOOGLE_JSON

const creds = require(`../${credFile}.json`)

// Initialize the sheet - doc ID is the long id in the sheets URL

// TODO: Dynamic
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID)
const title = process.env.GOOGLE_SHEET_TITLE as string

const fetchSheet = async() => {
    // TODO: Expand this into class, we don't need to call it each time
    await doc.useServiceAccountAuth(creds)
    await doc.loadInfo()
    console.log(`Working document: ${doc.title}`)
    // TODO: Ensure we're working with a valid sheet with rows or setup
    const sheet = doc.sheetsByTitle[title]
    console.log(`Working sheet: ${sheet.title}`)
    console.log(`Row count: ${sheet.rowCount}`)
    return sheet
}

const fetchRowsFromSheet = async(sheet: GoogleSpreadsheetWorksheet) => {
    const rows = await sheet.getRows()
    console.log(`Data in rows: ${rows.length}`)
    return rows
}

const checkInSheet = async(sheet: GoogleSpreadsheetWorksheet, newWlProof: any) => {
    const rows = await fetchRowsFromSheet(sheet)

    console.log('Searching for already existing users')
    if(rows.map(r=>r.discord_id).includes(newWlProof.discord_id)) {
        console.log('Already on list')
        return true
    }
    return false
}

export const getDiscordIds = async() => {
    const sheet = await fetchSheet()
    const rows = await fetchRowsFromSheet(sheet)  
    
    const discordIds = rows.map(r => r.discord_id)
    return discordIds
}

export const addWalletToRow = async(discordId: string, walletAddress: string) => {
    const sheet = await fetchSheet()
    const rows = await fetchRowsFromSheet(sheet)
    
    if(rows.map(r=>r.discord_id).includes(discordId)){
        // TODO: Cleanup for faster processing
        for(let row in rows) {
            if(rows[row].discord_id === discordId) {
                //console.log(row)
                console.log(rows[row])
                rows[row].wl_address = walletAddress
                await rows[row].save()
                return true
            }
        }
    } else {
        return false
    }
}

export const addRowToWl = async(newWlProof: any) => {
    const sheet = await fetchSheet()
    // Check for already exists
    if(await checkInSheet(sheet, newWlProof)){
        return false
    }
    // TODO: Confirm data before entry
    console.log(`Adding to google sheet:`)
    console.log(newWlProof)
    const newRow = await sheet.addRow(
        newWlProof
    )
    newRow.save()
    return true
}

// TODO: Unused
export const fetchCountCategory = async(category: string) => {
    const sheet = await fetchSheet()
    const rows = await fetchRowsFromSheet(sheet)
    let category_count = 0
    for(let row in rows) {
        // console.log(rows[row].discord_id)
        if(rows[row].category === category) {
            category_count += category_count
        }
    }
    return category_count
}
