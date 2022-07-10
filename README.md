# Force Field
Force Field is a Sentries tool designed to help Discord communities manage lists of roles with intention to use for whitelisting for mints. It also has in Discord commands for users who are approved and listed to submit and validate their Solana wallet address.

# Installation
Requires Node and Yarn

Follow the instructions to enable Google Sheets api https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication and save your auth .json file in the repo directory.

`git clone https://github.com/sentrieshq/force-field.git`

`cd force-field`

`yarn install`

`cp example.env .env`

`vim .env`

Update with all of your Discord and Google Auth details

- Channel Categories for your WL assignment
If you do not want to scrape for Collabs, you can instead leave that blank and instead insert the roles you want to track. Make sure you've enabled developer mode in Discord to copy IDs.

- Roles
These are the roles you want to keep track of in your spreadsheet.

# Operation
`yarn launch`

# ToDo
Update instructions to include wallet assignment.
Expand documentation.