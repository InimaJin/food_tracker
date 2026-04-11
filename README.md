# A web app for tracking food consumption

This app allows you to track calorie and protein intake. Currently, it is intended for usage on a smartphone and might not provide a particularly good experience for devices with wide screens, such as laptops or tablets.

## Setup

1. Clone the repo and `cd` into it.
2. `npm install`
3. Generate a secure secret for signing JSON web tokens, perhaps using a tool like [this](https://tooleroid.com/jwt-secret-generator). Export the key into a shell environment variable named JWT_SECRET. The API expects this and uses it for authenticating users.
4. Start the API: `node api/src/main.js`
5. Start the dev server in a new tab: `npm run dev -w app`

## Repo structure

[/api](/api): The express API is found in [src](/api/src/), where request and response formats are documented in the comments in [main.js](/api/src/main.js). A model of the database is available in [doc](/api/doc).

[/app](/app) holds the frontend JS, HTML and CSS.
