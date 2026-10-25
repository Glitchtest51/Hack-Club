const axios = require("axios");

const ENKA_STORE = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/refs/heads/master/store/";
const ENKA_API = "https://enka.network/api/";
const ENKA_ENDPOINTS = {
    gi: "",
    hsr: "hsr/",
    zzz: "zzz/",
};

const REQUEST_CONFIG = { headers: { "User-Agent": "GachaBot/1.0" }};
const imageUrl = path => path ? `https://enka.network${path.startsWith("/") ? "" : "/"}${path}` : null;

async function enka(game, uid) {
    if (!Object.hasOwn(ENKA_ENDPOINTS, game)) {  throw new Error(`Unknown game: ${game}`); }

    const cleanUid = String(uid).trim();
    if (!/^\d+$/.test(cleanUid)) { throw new Error("Invalid UID"); }

    const url = `${ENKA_API}${ENKA_ENDPOINTS[game]}uid/${encodeURIComponent(cleanUid)}/`;

    let json;
    try {
        const response = await axios.get(url, REQUEST_CONFIG);
        json = response.data;
    } catch (error) {
        if (error.response) { throw new Error(`API error: ${error.response.status}`); }
        throw new Error(`Failed to contact API: ${error.message}`);
    }

    switch (game) {
        case "gi":
            return resolveGI(parseGI(json));
        case "hsr":
            return resolveHSR(parseHSR(json));
        case "zzz":
            return resolveZZZ(parseZZZ(json));
    }
}

// Parsers (extracts the data we want from the api response.)

function parseGI(json) {
    const info = json.playerInfo ?? {};

    return {
        uid: json.uid ?? null,
        nickname: info.nickname ?? null,
        signature: info.signature ?? null,
        level: info.level ?? null,
        worldLevel: info.worldLevel ?? null,

        achievements: info.finishAchievementNum ?? null,
        towerFloor: info.towerFloorIndex ?? null,
        towerLevel: info.towerLevelIndex ?? null,

        profilePictureId: info.profilePicture?.id ?? null,
        cardId: info.nameCardId ?? null,

        characters: info.showAvatarInfoList ?? [],
    };
}

function parseHSR(json) {
    const detail = json.detailInfo ?? {};

    return {
        uid: detail.uid ?? json.uid ?? null,
        nickname: detail.nickname ?? null,
        signature: detail.signature ?? null,
        level: detail.level ?? null,
        worldLevel: detail.worldLevel ?? null,

        profilePictureId: detail.headIcon ?? null,
        records: detail.recordInfo ?? null,

        characters: (detail.avatarDetailList ?? []).map(avatar => ({
            id: avatar.avatarId,
            level: avatar.level ?? null,
        })),
    };
}

function parseZZZ(json) {
    const social = json.PlayerInfo?.SocialDetail ?? {};
    const profile = social.ProfileDetail ?? {};

    return {
        uid: profile.Uid ?? json.uid ?? null,
        nickname: profile.Nickname ?? null,
        signature: social.Desc ?? null,
        level: profile.Level ?? null,

        profilePictureId: profile.ProfileId ?? null,
        cardId: profile.CallingCardId ?? null,
        titleId: profile.TitleInfo?.Title ?? null,

        medals: social.MedalList ?? [],

        characters: (json.PlayerInfo?.ShowcaseDetail?.AvatarList ?? []).map(avatar => ({
            id: avatar.Id,
            level: avatar.Level ?? null,
        })),
    };
}

// Store cache
const storeCache = new Map();

async function getStore(path) {
    if (!storeCache.has(path)) {
        const request = axios.get(`${ENKA_STORE}${path}`).then(response => response.data).catch(error => {
                storeCache.delete(path);
                throw error;
            });
        storeCache.set(path, request);
    }
    return storeCache.get(path);
}

// Resolvers (uses the store to get relevant URLs for images and strings names.)

async function resolveGI(player) {
    const [avatars, locs, cards, profilePictures] = await Promise.all([
        getStore("gi/avatars.json"),
        getStore("gi/locs.json"),
        getStore("gi/namecards.json"),
        getStore("gi/pfps.json"),
    ]);
    const en = locs.en ?? {};

    return {
        uid: player.uid,
        nickname: player.nickname,
        signature: player.signature,
        level: player.level,
        worldLevel: player.worldLevel,

        achievements: player.achievements,
        towerFloor: player.towerFloor,
        towerLevel: player.towerLevel,

        profileImage: imageUrl(profilePictures[String(player.profilePictureId)]?.IconPath),

        cardImage: imageUrl(cards[String(player.cardId)]?.Icon),

        characters: player.characters.map(avatar => {
            const data = avatars[String(avatar.avatarId)];
            return {
                level: avatar.level ?? null,
                name: data ? en[String(data.NameTextMapHash)] ?? null : null,
                image: imageUrl(data?.SideIconName),
            };
        }),
    };
}

async function resolveHSR(player) {
    const [avatars, loc, profilePictures] = await Promise.all([
        getStore("hsr/avatars.json"),
        getStore("hsr/hsr.json"),
        getStore("hsr/pfps.json"),
    ]);

    const en = loc.en ?? {};

    return {
        uid: player.uid,
        nickname: player.nickname,
        signature: player.signature,
        level: player.level,
        worldLevel: player.worldLevel,

        profileImage: imageUrl(profilePictures[String(player.profilePictureId)]?.Icon),

        records: player.records,

        characters: player.characters.map(avatar => {
            const data = avatars[String(avatar.id)];

            return {
                level: avatar.level,
                name: data ? en[String(data.AvatarName?.Hash)] ?? en[String(data.AvatarFullName?.Hash)] ?? null : null,
                image: imageUrl(data?.AvatarSideIconPath),
            };
        }),
    };
}

async function resolveZZZ(player) {
    const [avatars, locs, medals, cards, profilePictures] =
        await Promise.all([
            getStore("zzz/avatars.json"),
            getStore("zzz/locs.json"),
            getStore("zzz/medals.json"),
            getStore("zzz/namecards.json"),
            getStore("zzz/pfps.json"),
        ]);

    const en = locs.en ?? {};

    return {
        uid: player.uid,
        nickname: player.nickname,
        signature: player.signature,
        level: player.level,

        profileImage: imageUrl(profilePictures[String(player.profilePictureId)]?.Icon),
        cardImage: imageUrl(cards[String(player.cardId)]?.Icon),
        titleName: en[`TitleText_${player.titleId}`] ?? null,

        medals: player.medals.map(medal => {
            const data = medals[String(medal.MedalIcon)];
            const { MedalIcon, ...details } = medal;
            return {
                ...details,
                name: data?.Name ? en[data.Name] ?? null : null,
                image: imageUrl(data?.Icon),
            };
        }),

        characters: player.characters.map(character => {
            const data = avatars[String(character.id)];
            return {
                level: character.level,
                name: data?.Name ? en[data.Name] ?? null : null,
                image: imageUrl(data?.Image),
            };
        }),
    };
}

module.exports = enka;

// test
if (require.main === module) {
    (async () => {
        for (const [game, uid] of [
            ["zzz", "1001110335"],
            ["gi", "704368538"],
            ["hsr", "800652829"],
        ]) {
            try {
                const result = await enka(game, uid);
                console.log(`\n--- ${game.toUpperCase()} ---`);
                console.log(JSON.stringify(result, null, 2));
            } catch (error) {
                console.error(`${game.toUpperCase()} error:`, error.message);
            }
        }
    })();
}
