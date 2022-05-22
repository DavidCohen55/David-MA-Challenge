const fs = require('fs');
const express = require('express')
const app = express()
const port = +process.argv[2] || 3000

const client = require('redis').createClient()
client.on('error', (err) => console.log('Redis Client Error', err));

client.on('ready', () => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`Example app listening at http://0.0.0.0:${port}`)
    })
})

const cardsData = fs.readFileSync('./cards.json');
const cards = JSON.parse(cardsData);

async function getMissingCard(key) {
    const userCards = await client.zRange(key, 0, -1)
    return cards.at(userCards.length)
}

app.get('/card_add', async (req, res) => {
    const  key = 'user_id:' + req.query.id
    let missingCard = ''
    let result = 0
   do{
        missingCard = await getMissingCard(key);
        if(missingCard === undefined){
            res.send({id: "ALL CARDS"})
            return
        }
        result = await client.ZADD(key, {score: 0, value: JSON.stringify(missingCard)}, 'NX')
    } while (result === 0)
    res.send(missingCard)
})

app.get('/ready', async (req, res) => {
    res.send({ready: true})
})

client.connect();
