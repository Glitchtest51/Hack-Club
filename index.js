const { App } = require("@slack/bolt");
const enka = require("./enka");
require("dotenv").config();

const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	appToken: process.env.SLACK_APP_TOKEN,
	socketMode: true
});

app.command("/gachabot-help", async ({ ack, respond }) => {
	await ack();
	await respond({
		text:
			`Available Commands:

Misc:
/gachabot-help - Show available commands
/gachabot-ping - Displays available bot commands

Gacha:
/gachabot-gi [uid] - Displays Genshin Impact character builds!
/gachabot-hsr [uid] - Displays Honkai Star Rail character builds!
/gachabot-zzz [uid] - Displays Zenless Zone Zero agent builds!`
	});
});

app.command("/gachabot-ping", async ({ command, ack, respond }) => {
	const start = Date.now();
	await ack();
	const latency = Date.now() - start;
	await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/gachabot-zzz", async ({ command, ack, respond }) => {
	await ack();
	const uid = command.text.trim();

	try {
		if (!uid) {
			await respond({
				text: "Usage: `/gachabot-zzz [uid]`\nExample: `/gachabot-zzz 123456789`",
				response_type: "ephemeral",
			});
			return;
		}

		const player = await enka("zzz", uid);
		await respond({
            response_type: "ephemeral",
            text: `Profile for ${player.nickname ?? player.uid}`,
            blocks: formatProfile("zzz", player),
        });
	} catch (error) {
		await respond({
			text: `Error fetching data for UID ${uid}: ${error.message}`,
			response_type: "ephemeral",
		});
	}
});

app.command("/gachabot-hsr", async ({ command, ack, respond }) => {
	await ack();
	const uid = command.text.trim();

	try {
		if (!uid) {
			await respond({
				text: "Usage: `/gachabot-hsr [uid]`\nExample: `/gachabot-hsr 123456789`",
				response_type: "ephemeral",
			});
			return;
		}

		const player = await enka("hsr", uid);
		await respond({
            response_type: "ephemeral",
            text: `Profile for ${player.nickname ?? player.uid}`,
            blocks: formatProfile("hsr", player),
        });
	} catch (error) {
		await respond({
			text: `Error fetching data for UID ${uid}: ${error.message}`,
			response_type: "ephemeral",
		});
	}
});

app.command("/gachabot-gi", async ({ command, ack, respond }) => {
	await ack();
	const uid = command.text.trim();

	try {
		if (!uid) {
			await respond({
				text: "Usage: `/gachabot-gi [uid]`\nExample: `/gachabot-gi 123456789`",
				response_type: "ephemeral",
			});
			return;
		}

		const player = await enka("gi", uid);
		await respond({
            response_type: "ephemeral",
            text: `Profile for ${player.nickname ?? player.uid}`,
            blocks: formatProfile("gi", player),
        });
	} catch (error) {
		await respond({
			text: `Error fetching data for UID ${uid}: ${error.message}`,
			response_type: "ephemeral",
		});
	}
});

function formatProfile(game, player) {
	const gameNames = {
		gi: "Genshin Impact",
		hsr: "Honkai: Star Rail",
		zzz: "Zenless Zone Zero",
	};

	const blocks = [
		{ type: "header", text: { type: "plain_text", text: `${player.nickname ?? "Unknown Player"} · ${gameNames[game]}` } },
		{
			type: "section", text: {
				type: "mrkdwn",
				text: [
					`*UID:* ${player.uid ?? "Unknown"}`, `*Level:* ${player.level ?? "Unknown"}`,
					player.worldLevel != null ? `*World Level:* ${player.worldLevel}` : null,
					player.signature ? `*Signature:* ${player.signature}` : null,
				].filter(Boolean).join("\n"),
			},
			...(player.profileImage ? { accessory: { type: "image", image_url: player.profileImage, alt_text: "Player profile picture" } } : {}),
		},
	];

	//game specific
	if (game === "gi") {
		blocks.push({
			type: "section",
			fields: [
				{ type: "mrkdwn", text: `*Achievements*\n${player.achievements ?? "—"}` },
				{ type: "mrkdwn", text: `*Spiral Abyss*\n${player.towerFloor != null ? `${player.towerFloor}-${player.towerLevel ?? 0}` : "-"}` },
			],
		});
	}

	if (game === "hsr" && player.records) {
		blocks.push({ type: "section", text: { type: "mrkdwn", text: "*Trailblaze Records*\nProfile records available." } });
	}

	if (game === "zzz") {
		if (player.titleName) { blocks.push({ type: "section", text: { type: "mrkdwn", text: `*Title:* ${player.titleName}` }, }); }

		if (player.medals?.length) {
			blocks.push({ type: "section", text: { type: "mrkdwn", text: `*Medals:* ${player.medals.map(medal => medal.name).filter(Boolean).join(", ") || "None"}` } });
		}
	}

	//character showcase
	if (player.characters?.length) {
		for (const character of player.characters ?? []) {
			if (!character.image) continue;

			blocks.push({
				type: "context",
				elements: [
					{ type: "image", image_url: character.image, alt_text: character.name ?? "Character" },
					{ type: "mrkdwn", text: `*${character.name ?? "Unknown"}* - Lv. ${character.level ?? "?"}` },
				],
			});
		}
	}
	return blocks;
}

(async () => {
	await app.start();
	console.log("bot is running!");
})();