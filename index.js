const express = require('express');
const axios = require('axios');
const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer');
const fs = require('fs');

// Change the filename here
require('dotenv').config({ path: '.num' });

const client = new Client({
    authStrategy: new LocalAuth(),
});

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', (session) => console.log(`💕Authenticated`));

client.on('✅Ready', () => console.log('Enjoy GPT for Text and Image Generation For Free! by : Anas-Altaf 🧙‍'));

client.on('message_create', message => commands(message));

client.initialize();

const commands = async (message) => {
    try {
        const iaCommands = {
            davinci3: ".xit",
            dalle: ".gen",
        };
        let firstWord = message.body.substring(0, message.body.indexOf(" "));
        const sender = message.from.includes(process.env.PHONE_NUMBER) ? message.to : message.from;

        switch (firstWord) {
            case iaCommands.davinci3:
                const question = message.body.substring(message.body.indexOf(" "));
                await handleTextGeneration(sender, question);
                break;

            case iaCommands.dalle:
                const imgDescription = message.body.substring(message.body.indexOf(" "));
                await handleImageGeneration(sender, imgDescription);
                break;
        }
    } catch (error) {
        console.error(`🙄Oops! Something went wrong: ${error.message}.*`);
        // Log the error and continue processing other messages
    }
};

const handleTextGeneration = async (sender, clientText) => {
    console.log('♻Please wait, generating text...*');

    // Initial GPT version
    let gptVersions = ['gpt2','gpt3', 'gpt4', 'gpt5'];

    for (const gptVersion of gptVersions) {
        const endpoint = `https://ultimetron.guruapi.tech/${gptVersion}?prompt=${encodeURIComponent(clientText)}`;
        const response = await axios.get(endpoint);

        if (response.status === 200 && response.data.completion !== 'null') {
            const textResponse = response.data.completion;
            const contact = await client.getContactById(sender);
            client.sendMessage(sender, `${textResponse}\n\n_✅Generated @${contact.id.user} by *XiT*_`, { mentions: [contact] });
            return;
        } else {
            console.error(`❎Oops! Text generation failed with status code ${response.status}.*`);
        }
    }

    console.error(`⚠Failed to generate text after multiple retries.*`);
};

const handleImageGeneration = async (sender, clientText) => {
    console.log('♻Please wait, generating image...*');

    // Initial GPT version
    let gptVersions = ['gpt3', 'gpt4', 'gpt5'];

    // Initial retry count for image generation
    let retryCount = 0;

    while (retryCount < 5) { // Retry up to 5 times
        for (const gptVersion of gptVersions) {
            const endpoint = `https://gurugpt.cyclic.app/dalle?prompt=${encodeURIComponent(clientText)}`;
            const response = await axios.get(endpoint, { responseType: 'arraybuffer' });

            if (response.status === 200) {
                // Save the image only if the response status is 200
                const imagePath = 'generated_image.png';
                fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

                const media = MessageMedia.fromFilePath(imagePath);
                const contact = await client.getContactById(sender);
                const options = {
                    mentions: [contact],
                    caption: `_🙄Generated @${contact.id.user} by *XiT*_`,
                    media: media,
                };
                await client.sendMessage(sender, media, options);
                return;
            } else {
                console.error(`❎Oops! Image generation failed with status code ${response.status}.*`);
            }
        }

        // Retry image generation
        retryCount++;
    }

    console.error(`⚠Failed to generate image after multiple retries.*`);
};

app.listen(port, () => {
    console.log(`Web server running at http://localhost:${port}`);
});
