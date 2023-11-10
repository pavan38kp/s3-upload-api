const a = require("axios");

const axios = a.create({
    baseURL: "https://ultimate-escargot-82.hasura.app",
    headers: {
        "x-hasura-admin-secret": "bGSqowfrlJe8qG1BqSnWysGLL7Ct00B4Aek971CjxMMCwBbLxuMga7tNJD6q4uEi"
    }
})

module.exports = {axios}