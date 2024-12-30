import { createCanvas, loadImage } from 'canvas';
import { TwitterApi, type SendTweetV2Params } from 'twitter-api-v2';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Replace with your actual credentials
const client = new TwitterApi({
	appKey: process.env.TWITTER_API_KEY!,
	appSecret: process.env.TWITTER_API_SECRET_KEY!,
	accessToken: process.env.TWITTER_ACCESS_TOKEN!,
	accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
});

function getSvgContent(color: string) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000"><rect width="1000" height="1000" fill="${color}"/></svg>`;
}

async function convertSvgToPng(svgContent: string, outputFilePath: string): Promise<void> {
	const canvas = createCanvas(1000, 1000); // Adjust size as needed
	const ctx = canvas.getContext('2d');

	// const img = await loadImage(svgContent);
	const img = await loadImage(`data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`);
	console.log(img);
	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

	const out = fs.createWriteStream(outputFilePath);
	const stream = canvas.createPNGStream();
	stream.pipe(out);

	await new Promise((resolve, reject) => {
		out.on('finish', resolve);
		out.on('error', reject);
	});
}

const postTweet = async (tweetText: string, color?: string) => {
	const uniqueId = uuidv4();
	const outputFilePath = path.resolve(__dirname, `${uniqueId}.png`);
	const payload: SendTweetV2Params = {};

	try {
		if (color) {
			const svgContent = getSvgContent(color);
			await convertSvgToPng(svgContent, outputFilePath);
			const fileData = fs.readFileSync(outputFilePath);
			const mediaId = await client.v1.uploadMedia(fileData, { mimeType: 'image/png' });
			payload.media = { media_ids: [mediaId] };
		}
		const response = await client.v2.tweet(tweetText, payload);
		console.log('Tweet posted successfully:', response);
	} catch (error) {
		console.error('Error posting tweet:', error);
	} finally {
		if (fs.existsSync(outputFilePath)) {
			fs.unlinkSync(outputFilePath);
		}
	}
};

export default postTweet;