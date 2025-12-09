// Usage: node dbCreate.js <dbFileName>
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

function ensureColumn(db, tableName, columnName, columnType) {
    db.get(`PRAGMA table_info(${tableName})`, (err, row) => {
        if (err) {
            console.error(`Error checking columns for ${tableName}:`, err.message);
            return;
        }
        db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
            if (err) {
                console.error(`Error getting columns for ${tableName}:`, err.message);
                return;
            }
            const exists = columns.some(col => col.name === columnName);
            if (!exists) {
                db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`, (err) => {
                    if (err) console.error(`Error adding column ${columnName} to ${tableName}:`, err.message);
                    else console.log(`Column '${columnName}' added to table '${tableName}'.`);
                });
            }
        });
    });
}

function createOrUpdateTable(db, tableName, createSQL, columnsToEnsure) {
    db.run(`CREATE TABLE IF NOT EXISTS ${tableName} ${createSQL}`, (err) => {

        if (err) console.error(`Error creating table ${tableName}:`, err.message);

        else console.log(`Table '${tableName}' ensured.`);

        // Ensure columns exist (for updates)
        if (columnsToEnsure && columnsToEnsure.length > 0) {
            columnsToEnsure.forEach(col => {
                ensureColumn(db, tableName, col.name, col.type);
            });
        }
    });
}

// Create indexes on specified columns for a table
function createIndexes(db, tableName, columns) {
    if (!columns || columns.length === 0) return;
    columns.forEach(col => {
        const indexName = `idx_${tableName}_${col}`;
        db.run(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${col})`, (err) => {
            if (err) console.error(`Error creating index on ${tableName}.${col}:`, err.message);
            else console.log(`Index '${indexName}' created on '${tableName}(${col})'.`);
        });
    });
}

function createDatabase(dbName) {
    const dbDir = path.resolve(__dirname, '../../../../database/core');
    const dbPath = path.join(dbDir, dbName);
    const dbExists = fs.existsSync(dbPath);

    // Create a blank database file if it doesn't exist
    if (!dbExists) {
        fs.closeSync(fs.openSync(dbPath, 'w'));
        console.log(`Blank database file '${dbName}' created at ${dbPath}`);
    }

    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error creating database:', err.message);
        } else {
            console.log(`Database '${dbName}' opened at ${dbPath}`);
        }
    });

    tableInfo(db);

    db.close();
}

function tableInfo(db) {
    // Table 1: A1_ClanInfo
    // Primary endpoint: https://api.clashofclans.com/v1/clans/%23{clanTag}
    // DB format: New rows daily
    // DB Ordering: Date logged Ascending

    createOrUpdateTable(
        db,
        'A1_ClanInfo',
        `(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dateLogged TEXT,
            season TEXT,

            -- Clan Info
            name TEXT,
            type TEXT,
            description TEXT,
            memberCount INTEGER
            clanLevel INTEGER,
            clanPoints INTEGER,
            clanBbPoints INTEGER,
            locationName TEXT,
            isFamilyFriendly BOOLEAN,
            chatLanguage TEXT,

            -- Entrance Requirements
            requiredTrophies INTEGER,
            requiredBbTrophies INTEGER,
            requiredThLevel INTEGER,

            -- Clan War Info
            warFrequency TEXT,
            isWarLogPublic BOOLEAN,
            warWinStreak INTEGER,
            warWins INTEGER,
            warTies INTEGER,
            warLosses INTEGER,
            CWLLeagueName TEXT,

            -- Clan Capital Info
            capitalHallLevel INTEGER,
            capitalPoints INTEGER,

            -- Clan Capital Districts
            lvlCapitalPeak INTEGER,
            lvlBarbarianCamp INTEGER,
            lvlWizardValley INTEGER,
            lvlBalloonLagoon INTEGER,
            lvlBuildersWorkshop INTEGER,
            lvlDragonCliffs INTEGER,
            lvlGolemQuarry INTEGER,
            lvlSkeletonPark INTEGER,
            lvlGoblinMines INTEGER
        )`,
        [
            { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
            { name: 'dateLogged', type: 'TEXT' },
            { name: 'season', type: 'TEXT' },

            // Clan Info
            { name: 'name', type: 'TEXT' },
            { name: 'type', type: 'TEXT' },
            { name: 'description', type: 'TEXT' },
            { name: 'memberCount', type: 'INTEGER' },
            { name: 'clanLevel', type: 'INTEGER' },
            { name: 'clanPoints', type: 'INTEGER' },
            { name: 'clanBbPoints', type: 'INTEGER' },
            { name: 'locationName', type: 'TEXT' },
            { name: 'isFamilyFriendly', type: 'BOOLEAN' },
            { name: 'chatLanguage', type: 'TEXT' },

            // Entrance Requirements
            { name: 'requiredTrophies', type: 'INTEGER' },
            { name: 'requiredBbTrophies', type: 'INTEGER' },
            { name: 'requiredThLevel', type: 'INTEGER' },

            // Clan War Info
            { name: 'warFrequency', type: 'TEXT' },
            { name: 'isWarLogPublic', type: 'BOOLEAN' },
            { name: 'warWinStreak', type: 'INTEGER' },
            { name: 'warWins', type: 'INTEGER' },
            { name: 'warTies', type: 'INTEGER' },
            { name: 'warLosses', type: 'INTEGER' },
            { name: 'CWLLeagueName', type: 'TEXT' },

            // Clan Capital Info
            { name: 'capitalHallLevel', type: 'INTEGER' },
            { name: 'capitalPoints', type: 'INTEGER' },

            // Clan Capital Districts
            { name: 'lvlCapitalPeak', type: 'INTEGER' },
            { name: 'lvlBarbarianCamp', type: 'INTEGER' },
            { name: 'lvlWizardValley', type: 'INTEGER' },
            { name: 'lvlBalloonLagoon', type: 'INTEGER' },
            { name: 'lvlBuildersWorkshop', type: 'INTEGER' },
            { name: 'lvlDragonCliffs', type: 'INTEGER' },
            { name: 'lvlGolemQuarry', type: 'INTEGER' },
            { name: 'lvlSkeletonPark', type: 'INTEGER' },
            { name: 'lvlGoblinMines', type: 'INTEGER' }
        ]
    );

    // Table 2: A2_ClanMembers
    // Primary endpoint: https://api.clashofclans.com/v1/clans/%23{clanTag}/members || https://api.clashofclans.com/v1/players/%23{playerTag}
    // DB format: New rows only for new members; old members updated. Updated when number of members change, or every day, whichever is sooner.
    // DB Ordering: Date of first join

    createOrUpdateTable(
        db,
        'A2_ClanMembers',
        `(
            -- Main player info
            playerTag TEXT PRIMARY KEY,
            name TEXT,

            lastUpdated TEXT,
            dateJoin TEXT,
            dateLeft TEXT,
            lastActive TEXT,

            thLevel INTEGER,
            bhLevel INTEGER,
            xpLevel INTEGER,

            trophies INTEGER,
            bestTrophies INTEGER,
            legendTrophies INTEGER,
            bbTrophies INTEGER,
            bestBbTrophies INTEGER,

            warStars INTEGER,
            attackWins INTEGER,
            defenseWins INTEGER,

            clanRole TEXT,
            warPreference BOOLEAN,
            donations INTEGER,
            donationsReceived INTEGER,
            clanCapitalContributions INTEGER,

            legacyLeagueName TEXT,
            leagueInt INTEGER,
            bbLeagueName TEXT,

            -- Achievements
            achievementBiggerCoffers INTEGER,
            achievementGetThoseGoblins INTEGER,
            achievementBiggerBetter INTEGER,
            achievementNiceAndTidy INTEGER,
            achievementDiscoverNewTroops INTEGER,
            achievementGoldGrab INTEGER,
            achievementElixirEscapade INTEGER,
            achievementSweetVictory INTEGER,
            achievementEmpireBuilder INTEGER,
            achievementWallBuster INTEGER,
            achievementHumiliator INTEGER,
            achievementUnionBuster INTEGER,
            achievementConqueror INTEGER,
            achievementUnbreakable INTEGER,
            achievementFriendInNeed INTEGER,
            achievementMortarMauler INTEGER,
            achievementHeroicHeist INTEGER,
            achievementLeagueAllStar INTEGER,
            achievementXBowExterminator INTEGER,
            achievementFirefighter INTEGER,
            achievementWarHero INTEGER,
            achievementClanWarWealth INTEGER,
            achievementAntiArtillery INTEGER,
            achievementSharingIsCaring INTEGER,
            achievementKeepYourAccountSafe INTEGER,
            achievementMasterEngineering INTEGER,
            achievementNextGenerationModel INTEGER,
            achievementUnBuildIt INTEGER,
            achievementChampionBuilder INTEGER,
            achievementHighGear INTEGER,
            achievementHiddenTreasures INTEGER,
            achievementGamesChampion INTEGER,
            achievementDragonSlayer INTEGER,
            achievementWarLeagueLegend INTEGER,
            achievementWellSeasoned INTEGER,
            achievementShatteredAndScattered INTEGER,
            achievementNotSoEasyThisTime INTEGER,
            achievementBustThis INTEGER,
            achievementSuperbWork INTEGER,
            achievementSiegeSharer INTEGER,
            achievementAggressiveCapitalism INTEGER,
            achievementMostValuableClanmate INTEGER,
            achievementCounterspell INTEGER,
            achievementMonolithMasher INTEGER,
            achievementUngratefulChild INTEGER,
            achievementSupercharger INTEGER,
            achievementMultiArcherTowerTerminator INTEGER,
            achievementRicochetCannonCrusher INTEGER,
            achievementFirespitterFinisher INTEGER,
            achievementMultiGearTowerTrampler INTEGER,
            achievementCraftingConnoisseur INTEGER,
            achievementCraftersNightmare INTEGER,
            achievementLeagueFollower INTEGER,

            -- Levels (Elixir Troops)
            lvlTroopElixirBarbarian INTEGER,
            lvlTroopElixirArcher INTEGER,
            lvlTroopElixirGiant INTEGER,
            lvlTroopElixirGoblin INTEGER,
            lvlTroopElixirWallBreaker INTEGER,
            lvlTroopElixirBalloon INTEGER,
            lvlTroopElixirWizard INTEGER,
            lvlTroopElixirHealer INTEGER,
            lvlTroopElixirDragon INTEGER,
            lvlTroopElixirPEKKA INTEGER,
            lvlTroopElixirBabyDragon INTEGER,
            lvlTroopElixirMiner INTEGER,
            lvlTroopElixirElectroDragon INTEGER,
            lvlTroopElixirYeti INTEGER,
            lvlTroopElixirDragonRider INTEGER,
            lvlTroopElixirElectroTitan INTEGER,
            lvlTroopElixirRootRider INTEGER,
            lvlTroopElixirThrower INTEGER,

            -- Levels (Dark Elixir Troops)
            lvlTroopDarkElixirMinion INTEGER,
            lvlTroopDarkElixirHogRider INTEGER,
            lvlTroopDarkElixirValkyrie INTEGER,
            lvlTroopDarkElixirGolem INTEGER,
            lvlTroopDarkElixirWitch INTEGER,
            lvlTroopDarkElixirLavaHound INTEGER,
            lvlTroopDarkElixirBowler INTEGER,
            lvlTroopDarkElixirIceGolem INTEGER,
            lvlTroopDarkElixirHeadhunter INTEGER,
            lvlTroopDarkElixirApprenticeWarden INTEGER,
            lvlTroopDarkElixirDruid INTEGER,
            lvlTroopDarkElixirFurnace INTEGER,

            -- Levels (Spells)
            lvlSpellLightning INTEGER,
            lvlSpellHealing INTEGER,
            lvlSpellRage INTEGER,
            lvlSpellJump INTEGER,
            lvlSpellFreeze INTEGER,
            lvlSpellClone INTEGER,
            lvlSpellInvisibility INTEGER,
            lvlSpellRecall INTEGER,
            lvlSpellRevive INTEGER,

            -- Levels (Dark Spells)
            lvlDarkSpellPoison INTEGER,
            lvlDarkSpellEarthquake INTEGER,
            lvlDarkSpellHaste INTEGER,
            lvlDarkSpellSkeleton INTEGER,
            lvlDarkSpellBat INTEGER,
            lvlDarkSpellOvergrowth INTEGER,
            lvlDarkSpellIceBlock INTEGER,

            -- Levels (Builder Base Troops)
            lvlTroopBuilderBaseRagedBarbarian INTEGER,
            lvlTroopBuilderBaseSneakyArcher INTEGER,
            lvlTroopBuilderBaseBoxerGiant INTEGER,
            lvlTroopBuilderBaseBetaMinion INTEGER,
            lvlTroopBuilderBaseBomber INTEGER,
            lvlTroopBuilderBaseBabyDragon INTEGER,
            lvlTroopBuilderBaseCannonCart INTEGER,
            lvlTroopBuilderBaseNightWitch INTEGER,
            lvlTroopBuilderBaseDropShip INTEGER,
            lvlTroopBuilderBasePowerPekka INTEGER,
            lvlTroopBuilderBaseHogGlider INTEGER,
            lvlTroopBuilderBaseElectrofireWizard INTEGER,

            -- Levels (Siege Machines)
            lvlSiegeWallWrecker INTEGER,
            lvlSiegeBattleBlimp INTEGER,
            lvlSiegeStoneSlammer INTEGER,
            lvlSiegeSiegeBarracks INTEGER,
            lvlSiegeLogLauncher INTEGER,
            lvlSiegeFlameFlinger INTEGER,
            lvlSiegeBattleDrill INTEGER,
            lvlSiegeTroopLauncher INTEGER,

            -- Levels (Pets)
            lvlPetLASSI INTEGER,
            lvlPetMightyYak INTEGER,
            lvlPetElectroOwl INTEGER,
            lvlPetUnicorn INTEGER,
            lvlPetPhoenix INTEGER,
            lvlPetPoisonLizard INTEGER,
            lvlPetDiggy INTEGER,
            lvlPetFrosty INTEGER,
            lvlPetSpiritFox INTEGER,
            lvlPetAngryJelly INTEGER,
            lvlPetSneezy INTEGER,

            -- Levels (Heroes)
            lvlHeroBarbarianKing INTEGER,
            lvlHeroArcherQueen INTEGER,
            lvlHeroMinionPrince INTEGER,
            lvlHeroGrandWarden INTEGER,
            lvlHeroRoyalChampion INTEGER,
            
            lvlHeroBattleMachine INTEGER,
            lvlHeroBattleCopter INTEGER,

            -- Levels (Hero Equipment)

                --- Barbarian King Equipment
                lvlHeroEquipmentBarbarianPuppet INTEGER,
                lvlHeroEquipmentRageVial INTEGER,
                lvlHeroEquipmentEarthquakeBoots INTEGER,
                lvlHeroEquipmentVampstache INTEGER,
                lvlHeroEquipmentGiantGauntlet INTEGER,
                lvlHeroEquipmentSpikyBall INTEGER,
                lvlHeroEquipmentSnakeBracelet INTEGER,
                lvlHeroEquipmentStickHorse INTEGER,

                --- Archer Queen Equipment
                lvlHeroEquipmentArcherPuppet INTEGER,
                lvlHeroEquipmentInvisibilityVial INTEGER,
                lvlHeroEquipmentGiantArrow INTEGER,
                lvlHeroEquipmentHealerPuppet INTEGER,
                lvlHeroEquipmentFrozenArrow INTEGER,
                lvlHeroEquipmentMagicMirror INTEGER,
                lvlHeroEquipmentActionFigure INTEGER,
            
                --- Minion Prince Equipment
                lvlHeroEquipmentHenchmenPuppet INTEGER,
                lvlHeroEquipmentDarkOrb INTEGER,
                lvlHeroEquipmentMetalPants INTEGER,
                lvlHeroEquipmentNobleIron INTEGER,
                lvlHeroEquipmentDarkCrown INTEGER,
                lvlHeroEquipmentMeteorStaff INTEGER,

                --- Grand Warden Equipment
                lvlHeroEquipmentEternalTome INTEGER,
                lvlHeroEquipmentLifeGem INTEGER,
                lvlHeroEquipmentRageGem INTEGER,
                lvlHeroEquipmentHealingTome INTEGER,
                lvlHeroEquipmentFireball INTEGER,
                lvlHeroEquipmentLavaloonPuppet INTEGER,
                lvlHeroEquipmentHeroicTorch INTEGER,

                --- Royal Champion Equipment
                lvlHeroEquipmentRoyalGem INTEGER,
                lvlHeroEquipmentSeekingShield INTEGER,
                lvlHeroEquipmentHogRiderPuppet INTEGER,
                lvlHeroEquipmentHasteVial INTEGER,
                lvlHeroEquipmentRocketSpear INTEGER,
                lvlHeroEquipmentElectroBoots INTEGER,
                lvlHeroEquipmentFrostFlake INTEGER
        )`,
        [
            // Main player info
            { name: 'playerTag', type: 'TEXT PRIMARY KEY' },
            { name: 'name', type: 'TEXT' },

            { name: 'lastUpdated', type: 'TEXT' },
            { name: 'dateJoin', type: 'TEXT' },
            { name: 'dateLeft', type: 'TEXT' },
            { name: 'lastActive', type: 'TEXT' },

            { name: 'thLevel', type: 'INTEGER' },
            { name: 'bhLevel', type: 'INTEGER' },
            { name: 'xpLevel', type: 'INTEGER' },

            { name: 'trophies', type: 'INTEGER' },
            { name: 'bestTrophies', type: 'INTEGER' },
            { name: 'legendTrophies', type: 'INTEGER' },
            { name: 'bbTrophies', type: 'INTEGER' },
            { name: 'bestBbTrophies', type: 'INTEGER' },
            
            { name: 'warStars', type: 'INTEGER' },
            { name: 'attackWins', type: 'INTEGER' },
            { name: 'defenseWins', type: 'INTEGER' },

            { name: 'clanRole', type: 'TEXT' },
            { name: 'warPreference', type: 'BOOLEAN' },
            { name: 'donations', type: 'INTEGER' },
            { name: 'donationsReceived', type: 'INTEGER' },
            { name: 'clanCapitalContributions', type: 'INTEGER' },

            { name: 'legacyLeagueName', type: 'TEXT' },
            { name: 'leagueInt', type: 'INTEGER' },
            { name: 'bbLeagueName', type: 'TEXT' },

            // Achievements
            { name: 'achievementBiggerCoffers', type: 'INTEGER' },
            { name: 'achievementGetThoseGoblins', type: 'INTEGER' },
            { name: 'achievementBiggerBetter', type: 'INTEGER' },
            { name: 'achievementNiceAndTidy', type: 'INTEGER' },
            { name: 'achievementDiscoverNewTroops', type: 'INTEGER' },
            { name: 'achievementGoldGrab', type: 'INTEGER' },
            { name: 'achievementElixirEscapade', type: 'INTEGER' },
            { name: 'achievementSweetVictory', type: 'INTEGER' },
            { name: 'achievementEmpireBuilder', type: 'INTEGER' },
            { name: 'achievementWallBuster', type: 'INTEGER' },
            { name: 'achievementHumiliator', type: 'INTEGER' },
            { name: 'achievementUnionBuster', type: 'INTEGER' },
            { name: 'achievementConqueror', type: 'INTEGER' },
            { name: 'achievementUnbreakable', type: 'INTEGER' },
            { name: 'achievementFriendInNeed', type: 'INTEGER' },
            { name: 'achievementMortarMauler', type: 'INTEGER' },
            { name: 'achievementHeroicHeist', type: 'INTEGER' },
            { name: 'achievementLeagueAllStar', type: 'INTEGER' },
            { name: 'achievementXBowExterminator', type: 'INTEGER' },
            { name: 'achievementFirefighter', type: 'INTEGER' },
            { name: 'achievementWarHero', type: 'INTEGER' },
            { name: 'achievementClanWarWealth', type: 'INTEGER' },
            { name: 'achievementAntiArtillery', type: 'INTEGER' },
            { name: 'achievementSharingIsCaring', type: 'INTEGER' },
            { name: 'achievementKeepYourAccountSafe', type: 'INTEGER' },
            { name: 'achievementMasterEngineering', type: 'INTEGER' },
            { name: 'achievementNextGenerationModel', type: 'INTEGER' },
            { name: 'achievementUnBuildIt', type: 'INTEGER' },
            { name: 'achievementChampionBuilder', type: 'INTEGER' },
            { name: 'achievementHighGear', type: 'INTEGER' },
            { name: 'achievementHiddenTreasures', type: 'INTEGER' },
            { name: 'achievementGamesChampion', type: 'INTEGER' },
            { name: 'achievementDragonSlayer', type: 'INTEGER' },
            { name: 'achievementWarLeagueLegend', type: 'INTEGER' },
            { name: 'achievementWellSeasoned', type: 'INTEGER' },
            { name: 'achievementShatteredAndScattered', type: 'INTEGER' },
            { name: 'achievementNotSoEasyThisTime', type: 'INTEGER' },
            { name: 'achievementBustThis', type: 'INTEGER' },
            { name: 'achievementSuperbWork', type: 'INTEGER' },
            { name: 'achievementSiegeSharer', type: 'INTEGER' },
            { name: 'achievementAggressiveCapitalism', type: 'INTEGER' },
            { name: 'achievementMostValuableClanmate', type: 'INTEGER' },
            { name: 'achievementCounterspell', type: 'INTEGER' },
            { name: 'achievementMonolithMasher', type: 'INTEGER' },
            { name: 'achievementUngratefulChild', type: 'INTEGER' },
            { name: 'achievementSupercharger', type: 'INTEGER' },
            { name: 'achievementMultiArcherTowerTerminator', type: 'INTEGER' },
            { name: 'achievementRicochetCannonCrusher', type: 'INTEGER' },
            { name: 'achievementFirespitterFinisher', type: 'INTEGER' },
            { name: 'achievementMultiGearTowerTrampler', type: 'INTEGER' },
            { name: 'achievementCraftingConnoisseur', type: 'INTEGER' },
            { name: 'achievementCraftersNightmare', type: 'INTEGER' },
            { name: 'achievementLeagueFollower', type: 'INTEGER' },

            // Elixir Troops
            { name: 'lvlTroopElixirBarbarian', type: 'INTEGER' },
            { name: 'lvlTroopElixirArcher', type: 'INTEGER' },
            { name: 'lvlTroopElixirGiant', type: 'INTEGER' },
            { name: 'lvlTroopElixirGoblin', type: 'INTEGER' },
            { name: 'lvlTroopElixirWallBreaker', type: 'INTEGER' },
            { name: 'lvlTroopElixirBalloon', type: 'INTEGER' },
            { name: 'lvlTroopElixirWizard', type: 'INTEGER' },
            { name: 'lvlTroopElixirHealer', type: 'INTEGER' },
            { name: 'lvlTroopElixirDragon', type: 'INTEGER' },
            { name: 'lvlTroopElixirPEKKA', type: 'INTEGER' },
            { name: 'lvlTroopElixirBabyDragon', type: 'INTEGER' },
            { name: 'lvlTroopElixirMiner', type: 'INTEGER' },
            { name: 'lvlTroopElixirElectroDragon', type: 'INTEGER' },
            { name: 'lvlTroopElixirYeti', type: 'INTEGER' },
            { name: 'lvlTroopElixirDragonRider', type: 'INTEGER' },
            { name: 'lvlTroopElixirElectroTitan', type: 'INTEGER' },
            { name: 'lvlTroopElixirRootRider', type: 'INTEGER' },
            { name: 'lvlTroopElixirThrower', type: 'INTEGER' },

            // Dark Elixir Troops
            { name: 'lvlTroopDarkElixirMinion', type: 'INTEGER' },
            { name: 'lvlTroopDarkElixirHogRider', type: 'INTEGER' },
            { name: 'lvlTroopDarkElixirValkyrie', type: 'INTEGER' },
            { name: 'lvlTroopDarkElixirGolem', type: 'INTEGER' },
            { name: 'lvlTroopDarkElixirWitch', type: 'INTEGER' },
            { name: 'lvlTroopDarkElixirLavaHound', type: 'INTEGER' },
            { name: 'lvlTroopDarkElixirBowler', type: 'INTEGER' },
            { name: 'lvlTroopDarkElixirIceGolem', type: 'INTEGER' },
            { name: 'lvlTroopDarkElixirHeadhunter', type: 'INTEGER' },
            { name: 'lvlTroopDarkElixirApprenticeWarden', type: 'INTEGER' },
            { name: 'lvlTroopDarkElixirDruid', type: 'INTEGER' },
            { name: 'lvlTroopDarkElixirFurnace', type: 'INTEGER' },

            // Spells
            { name: 'lvlSpellLightning', type: 'INTEGER' },
            { name: 'lvlSpellHealing', type: 'INTEGER' },
            { name: 'lvlSpellRage', type: 'INTEGER' },
            { name: 'lvlSpellJump', type: 'INTEGER' },
            { name: 'lvlSpellFreeze', type: 'INTEGER' },
            { name: 'lvlSpellClone', type: 'INTEGER' },
            { name: 'lvlSpellInvisibility', type: 'INTEGER' },
            { name: 'lvlSpellRecall', type: 'INTEGER' },
            { name: 'lvlSpellRevive', type: 'INTEGER' },

            // Dark Spells
            { name: 'lvlDarkSpellPoison', type: 'INTEGER' },
            { name: 'lvlDarkSpellEarthquake', type: 'INTEGER' },
            { name: 'lvlDarkSpellHaste', type: 'INTEGER' },
            { name: 'lvlDarkSpellSkeleton', type: 'INTEGER' },
            { name: 'lvlDarkSpellBat', type: 'INTEGER' },
            { name: 'lvlDarkSpellOvergrowth', type: 'INTEGER' },
            { name: 'lvlDarkSpellIceBlock', type: 'INTEGER' },

            // Builder Base Troops
            { name: 'lvlTroopBuilderBaseRagedBarbarian', type: 'INTEGER' },
            { name: 'lvlTroopBuilderBaseSneakyArcher', type: 'INTEGER' },
            { name: 'lvlTroopBuilderBaseBoxerGiant', type: 'INTEGER' },
            { name: 'lvlTroopBuilderBaseBetaMinion', type: 'INTEGER' },
            { name: 'lvlTroopBuilderBaseBomber', type: 'INTEGER' },
            { name: 'lvlTroopBuilderBaseBabyDragon', type: 'INTEGER' },
            { name: 'lvlTroopBuilderBaseCannonCart', type: 'INTEGER' },
            { name: 'lvlTroopBuilderBaseNightWitch', type: 'INTEGER' },
            { name: 'lvlTroopBuilderBaseDropShip', type: 'INTEGER' },
            { name: 'lvlTroopBuilderBasePowerPekka', type: 'INTEGER' },
            { name: 'lvlTroopBuilderBaseHogGlider', type: 'INTEGER' },
            { name: 'lvlTroopBuilderBaseElectrofireWizard', type: 'INTEGER' },

            // Siege Machines
            { name: 'lvlSiegeWallWrecker', type: 'INTEGER' },
            { name: 'lvlSiegeBattleBlimp', type: 'INTEGER' },
            { name: 'lvlSiegeStoneSlammer', type: 'INTEGER' },
            { name: 'lvlSiegeSiegeBarracks', type: 'INTEGER' },
            { name: 'lvlSiegeLogLauncher', type: 'INTEGER' },
            { name: 'lvlSiegeFlameFlinger', type: 'INTEGER' },
            { name: 'lvlSiegeBattleDrill', type: 'INTEGER' },
            { name: 'lvlSiegeTroopLauncher', type: 'INTEGER' },

            // Pets
            { name: 'lvlPetLASSI', type: 'INTEGER' },
            { name: 'lvlPetMightyYak', type: 'INTEGER' },
            { name: 'lvlPetElectroOwl', type: 'INTEGER' },
            { name: 'lvlPetUnicorn', type: 'INTEGER' },
            { name: 'lvlPetPhoenix', type: 'INTEGER' },
            { name: 'lvlPetPoisonLizard', type: 'INTEGER' },
            { name: 'lvlPetDiggy', type: 'INTEGER' },
            { name: 'lvlPetFrosty', type: 'INTEGER' },
            { name: 'lvlPetSpiritFox', type: 'INTEGER' },
            { name: 'lvlPetAngryJelly', type: 'INTEGER' },
            { name: 'lvlPetSneezy', type: 'INTEGER' },

            // Heroes
            { name: 'lvlHeroBarbarianKing', type: 'INTEGER' },
            { name: 'lvlHeroArcherQueen', type: 'INTEGER' },
            { name: 'lvlHeroMinionPrince', type: 'INTEGER' },
            { name: 'lvlHeroGrandWarden', type: 'INTEGER' },
            { name: 'lvlHeroRoyalChampion', type: 'INTEGER' },

            { name: 'lvlHeroBattleMachine', type: 'INTEGER' },
            { name: 'lvlHeroBattleCopter', type: 'INTEGER' },

            // Hero Equipment
            { name: 'lvlHeroEquipmentBarbarianPuppet', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentRageVial', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentEarthquakeBoots', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentVampstache', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentGiantGauntlet', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentSpikyBall', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentSnakeBracelet', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentStickHorse', type: 'INTEGER' },

            { name: 'lvlHeroEquipmentArcherPuppet', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentInvisibilityVial', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentGiantArrow', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentHealerPuppet', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentFrozenArrow', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentMagicMirror', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentActionFigure', type: 'INTEGER' },

            { name: 'lvlHeroEquipmentHenchmenPuppet', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentDarkOrb', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentMetalPants', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentNobleIron', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentDarkCrown', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentMeteorStaff', type: 'INTEGER' },

            { name: 'lvlHeroEquipmentEternalTome', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentLifeGem', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentRageGem', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentHealingTome', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentFireball', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentLavaloonPuppet', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentHeroicTorch', type: 'INTEGER' },

            { name: 'lvlHeroEquipmentRoyalGem', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentSeekingShield', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentHogRiderPuppet', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentHasteVial', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentRocketSpear', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentElectroBoots', type: 'INTEGER' },
            { name: 'lvlHeroEquipmentFrostFlake', type: 'INTEGER' }
        ]
    );

    // Table 3: A3_CWLWarDetails
    // Primary endpoint: https://api.clashofclans.com/v1/clans/%23{clanTag}/currentwar/leaguegroup || https://api.clashofclans.com/v1/clanwarleagues/wars/%23{warTag [NOT CLAN TAG!!!]}
    // DB format: Because of API limitations, we will first store the war details. Each row is a war, meaning every day should have 4 wars, and every CWL should have 28 wars.
    // DB Ordering: Season name > war number > war tag

    createOrUpdateTable(
        db,
        'A3_CWLWarDetails',
        `(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dateLogged TEXT,

            -- CWL Season Info
            season TEXT,
            seasonWarState TEXT,
            teamSize INTEGER,

            -- War Info
            warNum INTEGER,
            warTag TEXT,
            warState TEXT,
            prepStartTime TEXT,
            startTime TEXT,
            endTime TEXT,

            -- Clans Info
            clanTag TEXT,
            clanName TEXT,
            clanLevel INTEGER,
            clanAttacks INTEGER,
            clanStars INTEGER,
            clanDestructionPercent REAL,

            opponentTag TEXT,
            opponentName TEXT,
            opponentLevel INTEGER,
            opponentAttacks INTEGER,
            opponentStars INTEGER,
            opponentDestructionPercent REAL,

            winningClanTag TEXT
        )`,
        [
            { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
            { name: 'dateLogged', type: 'TEXT' },

            // CWL Season Info
            { name: 'season', type: 'TEXT' },
            { name: 'seasonWarState', type: 'TEXT' },
            { name: 'teamSize', type: 'INTEGER' },

            // War Info
            { name: 'warNum', type: 'INTEGER' },
            { name: 'warTag', type: 'TEXT' },
            { name: 'warState', type: 'TEXT' },
            { name: 'prepStartTime', type: 'TEXT' },
            { name: 'startTime', type: 'TEXT' },
            { name: 'endTime', type: 'TEXT' },

            // Clan Info
            { name: 'clanTag', type: 'TEXT' },
            { name: 'clanName', type: 'TEXT' },
            { name: 'clanLevel', type: 'INTEGER' },
            { name: 'clanAttacks', type: 'INTEGER' },
            { name: 'clanStars', type: 'INTEGER' },
            { name: 'clanDestructionPercent', type: 'REAL' },

            { name: 'opponentTag', type: 'TEXT' },
            { name: 'opponentName', type: 'TEXT' },
            { name: 'opponentLevel', type: 'INTEGER' },
            { name: 'opponentAttacks', type: 'INTEGER' },
            { name: 'opponentStars', type: 'INTEGER' },
            { name: 'opponentDestructionPercent', type: 'REAL' },

            { name: 'winningClanTag', type: 'TEXT' }
        ]
    );

    // Table 4: A4_CWLAttackDetails
    // Primary endpoint: https://api.clashofclans.com/v1/clans/%23{clanTag}/currentwar/leaguegroup || https://api.clashofclans.com/v1/clanwarleagues/wars/%23{warTag [NOT CLAN TAG!!!]}
    // DB format: Because of API limitations, all attacks are stored. Basically, only data for each attack for each war is stored. Data is first obtained from A3_CWLWarDetails.
    // DB Ordering: war tag (based on A3_CWLWarDetails) > Team1 attacker map position then team 2.

    createOrUpdateTable(
        db,
        'A4_CWLAttackDetails',
        `(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dateLogged TEXT,
            season TEXT,
            warTag TEXT,
            clanTag TEXT,
            opponentTag TEXT,

            -- Player Details
            attackerTag TEXT,
            attackerName TEXT,
            attackerThLevel INTEGER,
            attackerMapPosition INTEGER,

            -- Opponent Details
            defenderTag TEXT,
            defenderName TEXT,
            defenderThLevel INTEGER,
            defenderMapPosition INTEGER,

            -- Attack Details
            stars INTEGER,
            destructionPercentage INTEGER,
            order INTEGER,
            duration INTEGER
        )`,
        [
            { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
            { name: 'dateLogged', type: 'TEXT' },
            { name: 'season', type: 'TEXT' },
            { name: 'warTag', type: 'TEXT' },
            { name: 'clanTag', type: 'TEXT' },
            { name: 'opponentTag', type: 'TEXT' },

            // Player Details
            { name: 'attackerTag', type: 'TEXT' },
            { name: 'attackerName', type: 'TEXT' },
            { name: 'attackerThLevel', type: 'INTEGER' },
            { name: 'attackerMapPosition', type: 'INTEGER' },

            // Opponent Details
            { name: 'defenderTag', type: 'TEXT' },
            { name: 'defenderName', type: 'TEXT' },
            { name: 'defenderThLevel', type: 'INTEGER' },
            { name: 'defenderMapPosition', type: 'INTEGER' },

            // Attack Details
            { name: 'stars', type: 'INTEGER' },
            { name: 'destructionPercentage', type: 'INTEGER' },
            { name: 'order', type: 'INTEGER' },
            { name: 'duration', type: 'INTEGER' }
        ]
    );

    // Table 5: A5_ClanWarLog
    // Primary endpoint: https://api.clashofclans.com/v1/clans/%23{clanTag}/warlog
    // DB format: Stores high-level overview of war details.
    // DB Ordering: first to last war

    createOrUpdateTable(
        db,
        'A5_ClanWarLog',
        `(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dateLogged TEXT,
            cwSeason TEXT,

            -- Clan War Info
            result TEXT,
            teamsize INTEGER,
            attacksPerMember INTEGER,
            battleModifier TEXT,
            endTime TEXT,

            -- Attacker War Stats
            clanTag TEXT,
            clanName TEXT,
            clanLevel INTEGER,
            clanAttacks INTEGER,
            clanStars INTEGER,
            clanDestructionPercent REAL,
            clanXPGained INTEGER,

            -- Defender War Stats
            opponentTag TEXT,
            opponentName TEXT,
            opponentLevel INTEGER,
            opponentStars INTEGER,
            opponentDestructionPercent REAL
        )`,
        [
            { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
            { name: 'dateLogged', type: 'TEXT' },
            { name: 'cwSeason', type: 'TEXT' },

            // Clan War Info
            { name: 'result', type: 'TEXT' },
            { name: 'teamsize', type: 'INTEGER' },
            { name: 'attacksPerMember', type: 'INTEGER' },
            { name: 'battleModifier', type: 'TEXT' },
            { name: 'endTime', type: 'TEXT' },

            // Attacker War Stats
            { name: 'clanTag', type: 'TEXT' },
            { name: 'clanName', type: 'TEXT' },
            { name: 'clanLevel', type: 'INTEGER' },
            { name: 'clanAttacks', type: 'INTEGER' },
            { name: 'clanStars', type: 'INTEGER' },
            { name: 'clanDestructionPercent', type: 'REAL' },
            { name: 'clanXPGained', type: 'INTEGER' },

            // Defender War Stats
            { name: 'opponentTag', type: 'TEXT' },
            { name: 'opponentName', type: 'TEXT' },
            { name: 'opponentLevel', type: 'INTEGER' },
            { name: 'opponentStars', type: 'INTEGER' },
            { name: 'opponentDestructionPercent', type: 'REAL' }
        ]
    );

    // Table 6: A6_ClanWarAttackDetails
    // Primary endpoint: https://api.clashofclans.com/v1/clans/%23{clanTag}/currentwar
    // DB format: Stores detailed information about each player's attacks in clan wars. Does not account for CWL.
    // DB Ordering: first to last war > attacker map position then defender map position. Indexed via endTime

    /*
    UPDATE AGAIN WHEN CWL ENDS

    createOrUpdateTable(
        db,
        'A6_ClanWarAttackDetails',
        `(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dateLogged TEXT,
            cwSeason TEXT,

            -- Player Details

            -- Attack 1

            -- Attack 2

            -- Best Defense

            -- War Score

        )`,
        [
            { name: 'endTime', type: 'INTEGER PRIMARY KEY' },
            { name: 'dateLogged', type: 'TEXT' },

        ]
    );
    */

    // Table 7: A7_ClanCapitalLog
    // Primary endpoint: https://api.clashofclans.com/v1/clans/%23{clanTag}/capitalraidseasons
    // DB format: Stores high-level details of clan capital raids.
    // DB Ordering: first to last raid
    
    createOrUpdateTable(
        db,
        'A7_ClanCapitalLog',
        `(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dateLogged TEXT,

            -- Raid Identifiers
            ccSeason TEXT,
            state TEXT,
            startTime TEXT,
            endTime TEXT,

            -- Raid Info
            raidsCompleted INTEGER,
            totalAttacks INTEGER,
            enemyDistrictsDestroyed INTEGER,

            -- Raid Rewards
            capitalGoldEarned INTEGER,
            raidMedalsOffensive INTEGER,
            raidMedalsDefensive INTEGER,

            -- Trophy Info
            trophyCount INTEGER,
            clanXp INTEGER
        )`,
        [
            { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
            { name: 'dateLogged', type: 'TEXT' },

            // Raid Identifiers
            { name: 'ccSeason', type: 'TEXT' },
            { name: 'state', type: 'TEXT' },
            { name: 'startTime', type: 'TEXT' },
            { name: 'endTime', type: 'TEXT' },

            // Raid Info
            { name: 'raidsCompleted', type: 'INTEGER' },
            { name: 'totalAttacks', type: 'INTEGER' },
            { name: 'enemyDistrictsDestroyed', type: 'INTEGER' },

            // Raid Rewards
            { name: 'capitalGoldEarned', type: 'INTEGER' },
            { name: 'raidMedalsOffensive', type: 'INTEGER' },
            { name: 'raidMedalsDefensive', type: 'INTEGER' },

            // Trophy Info
            { name: 'trophyCount', type: 'INTEGER' },
            { name: 'clanXp', type: 'INTEGER' }
        ]
    );

    // Table 8: A8_ClanCapitalAttacks
    // Primary endpoint: https://api.clashofclans.com/v1/clans/%23{clanTag}/capitalraidseasons
    // DB format: Stores stats of every member's attacks in weekend raids.
    // DB Ordering: earliest to latest raid > highest resources earned
    
    createOrUpdateTable(
        db,
        'A8_ClanCapitalAttacks',
        `(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ccSeason TEXT,
            dateLogged TEXT,

            -- Player Info
            playerTag TEXT,
            playerName TEXT,

            -- Attacks Used
            attacksUsed INTEGER,
            attackLimit INTEGER,
            bonusAttacksGained INTEGER,
            attacksUsedScore REAL,

            -- Capital Gold Obtained
            capitalGoldLooted INTEGER,
            goldObtainedScore REAL,

            -- Capital Gold Donated
            mostValuableClanmatePoints INTEGER,
            increaseFromPrevious INTEGER,
            goldDonationScore REAL,

            clanCapitalScore REAL
        )`,
        [
            { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
            { name: 'ccSeason', type: 'TEXT' },
            { name: 'dateLogged', type: 'TEXT' },

            // Player Info
            { name: 'playerTag', type: 'TEXT' },
            { name: 'playerName', type: 'TEXT' },

            // Attacks Used
            { name: 'attacksUsed', type: 'INTEGER' },
            { name: 'attackLimit', type: 'INTEGER' },
            { name: 'bonusAttacksGained', type: 'INTEGER' },
            { name: 'attacksUsedScore', type: 'REAL' },

            // Capital Gold Obtained
            { name: 'capitalGoldLooted', type: 'INTEGER' },
            { name: 'goldObtainedScore', type: 'REAL' },

            // Capital Gold Donated
            { name: 'mostValuableClanmatePoints', type: 'INTEGER' },
            { name: 'increaseFromPrevious', type: 'INTEGER' },
            { name: 'goldDonationScore', type: 'REAL' },

            { name: 'clanCapitalScore', type: 'REAL' }
        ]
    );

    // Table 9: A9_ClanCapitalClanAttacks
    // Primary endpoint: https://api.clashofclans.com/v1/clans/%23{clanTag}/capitalraidseasons
    // DB format: Stores stats of clans attacked.
    // DB Ordering: earliest to latest raid > Earliest to finish
    
    createOrUpdateTable(
        db,
        'A9_ClanCapitalClanAttacks',
        `(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ccSeason TEXT,
            dateLogged TEXT,

            --  Clan Info
            clanTag TEXT,
            clanName TEXT,
            clanLevel INTEGER,

            -- Clan Raid Stats
            attackCount INTEGER,
            districtCount INTEGER,
            districtsDestroyed INTEGER,
        )`,
        [
            { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
            { name: 'ccSeason', type: 'TEXT' },
            { name: 'dateLogged', type: 'TEXT' },

            // Player Info
            { name: 'playerTag', type: 'TEXT' },
            { name: 'playerName', type: 'TEXT' },

            // Raid Stats
            { name: 'attacksUsed', type: 'INTEGER' },
            { name: 'attackLimit', type: 'INTEGER' },
            { name: 'bonusAttacksGained', type: 'INTEGER' },
            { name: 'capitalGoldLooted', type: 'INTEGER' }
        ]
    );

    // Table 10: A10_ClanCapitalClanDefenses
    // Primary endpoint: https://api.clashofclans.com/v1/clans/%23{clanTag}/capitalraidseasons
    // DB format: Stores stats of clans defended.
    // DB Ordering: earliest to latest raid > highest resources earned
    
    createOrUpdateTable(
        db,
        'A10_ClanCapitalClanDefenses',
        `(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ccSeason TEXT,
            dateLogged TEXT,

            --  Clan Info
            clanTag TEXT,
            clanName TEXT,
            clanLevel INTEGER,

            -- Clan Raid Stats
            attackCount INTEGER,
            districtCount INTEGER,
            districtsDestroyed INTEGER,
        )`,
        [
            { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
            { name: 'ccSeason', type: 'TEXT' },
            { name: 'dateLogged', type: 'TEXT' },

            // Player Info
            { name: 'playerTag', type: 'TEXT' },
            { name: 'playerName', type: 'TEXT' },

            // Raid Stats
            { name: 'attacksUsed', type: 'INTEGER' },
            { name: 'attackLimit', type: 'INTEGER' },
            { name: 'bonusAttacksGained', type: 'INTEGER' },
            { name: 'capitalGoldLooted', type: 'INTEGER' }
        ]
    );

    // Table 11: B1_PlayerLog
    // Primary database: A2_ClanMembers
    // DB format: Stores history of active players and relevant metrics to calculate the player quality score. runs every week before the ranked league ends (to obtain trophy numbers)
    // DB Ordering: season name > player rank in clan
    
    createOrUpdateTable(
        db,
        'B1_PlayerLog',
        `(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rankedSeason TEXT,
            playerTag TEXT,

            -- TH League + Position
            thLevel INTEGER,
            leagueInt INTEGER,
            trophies INTEGER,
            thLeagueScore REAL,

            -- War Stars
            warStars INTEGER,
            warStarsScore REAL,

            -- Hero Levels
            lvlHeroBarbarianKing INTEGER,
            lvlHeroArcherQueen INTEGER,
            lvlHeroMinionPrince INTEGER,
            lvlHeroGrandWarden INTEGER,
            lvlHeroRoyalChampion INTEGER,
            heroLevelsScore REAL,

            -- Lab Levels
            labUpgrades INTEGER,
            labUpgradesThMax INTEGER,
            labLevelsScore REAL,

            -- Pet Levels
            petUpgrades INTEGER,
            petUpgradesThMax INTEGER,
            petLevelsScore REAL,

            -- Equipment Levels
            equipmentUpgrades INTEGER,
            equipmentUpgradesThMax INTEGER,
            equipmentLevelsScore REAL,

            playerQualityScore REAL
        )`,
        [
            { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
            { name: 'rankedSeason', type: 'TEXT' },
            { name: 'playerTag', type: 'TEXT' },

            // TH League + Position
            { name: 'thLevel', type: 'INTEGER' },
            { name: 'leagueInt', type: 'INTEGER' },
            { name: 'trophies', type: 'INTEGER' },
            { name: 'thLeagueScore', type: 'REAL' },

            // War Stars
            { name: 'warStars', type: 'INTEGER' },
            { name: 'warStarsScore', type: 'REAL' },

            // Hero Levels
            { name: 'lvlHeroBarbarianKing', type: 'INTEGER' },
            { name: 'lvlHeroArcherQueen', type: 'INTEGER' },
            { name: 'lvlHeroMinionPrince', type: 'INTEGER' },
            { name: 'lvlHeroGrandWarden', type: 'INTEGER' },
            { name: 'lvlHeroRoyalChampion', type: 'INTEGER' },
            { name: 'heroLevelsScore', type: 'REAL' },

            // Lab Levels
            { name: 'labUpgrades', type: 'INTEGER' },
            { name: 'labUpgradesThMax', type: 'INTEGER' },
            { name: 'labLevelsScore', type: 'REAL' },

            // Pet Levels
            { name: 'petUpgrades', type: 'INTEGER' },
            { name: 'petUpgradesThMax', type: 'INTEGER' },
            { name: 'petLevelsScore', type: 'REAL' },

            // Equipment Levels
            { name: 'equipmentUpgrades', type: 'INTEGER' },
            { name: 'equipmentUpgradesThMax', type: 'INTEGER' },
            { name: 'equipmentLevelsScore', type: 'REAL' },

            { name: 'playerQualityScore', type: 'REAL' }
        ]
    );

    // Table 12: B2_ClanGamesLog
    // Primary database: A2_ClanMembers
    // DB format: Stores history of the total amount of clan games points earned, meant to help identify how much each member contributed in each clan games.
    // DB Ordering: season name > player tag
    
    createOrUpdateTable(
        db,
        'B2_ClanGamesLog',
        `(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            season TEXT,
            playerTag TEXT,

            -- Clan Games Stats
            gamesChampionPoints INTEGER,
            increaseFromPrevious INTEGER,

            clanGamesScore REAL
        )`,
        [
            { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
            { name: 'season', type: 'TEXT' },
            { name: 'playerTag', type: 'TEXT' },

            // Clan Games Stats
            { name: 'gamesChampionPoints', type: 'INTEGER' },
            { name: 'increaseFromPrevious', type: 'INTEGER' },

            { name: 'clanGamesScore', type: 'REAL' }
        ]
    );

    // Table 13: B3_CWLPlayerLog
    // Primary database: A4_CWLAttackDetails
    // DB format: Stores history of the player's performance each CWL.
    // DB Ordering: season name > highest performing player
    
    createOrUpdateTable(
        db,
        'B3_CWLPlayerLog',
        `(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            season TEXT,
            playerTag TEXT,
            thLevel INTEGER,
            mirrorRule BOOLEAN,

            -- Stars
            war1Stars INTEGER,
            war2Stars INTEGER,
            war3Stars INTEGER,
            war4Stars INTEGER,
            war5Stars INTEGER,
            war6Stars INTEGER,
            war7Stars INTEGER,

            -- Percentages
            war1Percentage INTEGER,
            war2Percentage INTEGER,
            war3Percentage INTEGER,
            war4Percentage INTEGER,
            war5Percentage INTEGER,
            war6Percentage INTEGER,
            war7Percentage INTEGER,

            -- Stars Percentage Score
            war1AttackScore REAL,
            war2AttackScore REAL,
            war3AttackScore REAL,
            war4AttackScore REAL,
            war5AttackScore REAL,
            war6AttackScore REAL,
            war7AttackScore REAL,

            -- Opponent TH Level
            war1OppThLevel INTEGER,
            war2OppThLevel INTEGER,
            war3OppThLevel INTEGER,
            war4OppThLevel INTEGER,
            war5OppThLevel INTEGER,
            war6OppThLevel INTEGER,
            war7OppThLevel INTEGER,

            -- Opponent TH Modifier
            war1OppThLevelModifier REAL,
            war2OppThLevelModifier REAL,
            war3OppThLevelModifier REAL,
            war4OppThLevelModifier REAL,
            war5OppThLevelModifier REAL,
            war6OppThLevelModifier REAL,
            war7OppThLevelModifier REAL,

            -- Player Map Position
            war1MapPosition INTEGER,
            war2MapPosition INTEGER,
            war3MapPosition INTEGER,
            war4MapPosition INTEGER,
            war5MapPosition INTEGER,
            war6MapPosition INTEGER,
            war7MapPosition INTEGER,

            -- Opponent Map Position
            war1OppMapPosition INTEGER,
            war2OppMapPosition INTEGER,
            war3OppMapPosition INTEGER,
            war4OppMapPosition INTEGER,
            war5OppMapPosition INTEGER,
            war6OppMapPosition INTEGER,
            war7OppMapPosition INTEGER,

            -- Mirror Check Modifier
            war1MirrorModifier REAL,
            war2MirrorModifier REAL,
            war3MirrorModifier REAL,
            war4MirrorModifier REAL,
            war5MirrorModifier REAL,
            war6MirrorModifier REAL,
            war7MirrorModifier REAL,

            -- Individual War Scores
            war1Score REAL,
            war2Score REAL,
            war3Score REAL,
            war4Score REAL,
            war5Score REAL,
            war6Score REAL,
            war7Score REAL,

            -- Attacks Used
            attacksUsed INTEGER,
            maxAttacks INTEGER,
            attackModifier REAL,

            cwlPerformanceScore REAL
        )`,
        [
            { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
            { name: 'season', type: 'TEXT' },
            { name: 'playerTag', type: 'TEXT' },

            // Clan Games Stats
            { name: 'gamesChampionPoints', type: 'INTEGER' },
            { name: 'increaseFromPrevious', type: 'INTEGER' },

            { name: 'clanGamesScore', type: 'REAL' }
        ]
    );

    // Table 14: C1_ClanSeasonStats
    // Primary database: A1_ClanInfo || A2_ClanMembers
    // DB format: Stores summarized clan history (monthly, right after CWL signup ends)
    // DB Ordering: season number
    
    createOrUpdateTable(
        db,
        'C1_ClanSeasonStats',
        `(
            season TEXT PRIMARY KEY,
            teamSeason INTEGER,

            --  Clan High Level Overview
            clanLevel INTEGER,
            estClanXpGain INTEGER,
            thClanPoints INTEGER,
            bhClanPoints INTEGER,
            playerCount INTEGER,

            -- Clan Entrance Requirements
            thLeagueRequirement INTEGER,
            bhTrophyRequirement INTEGER,
            minThRequirement INTEGER,

            -- Player Stats
            avgPlayerLvl INTEGER,
            avgThLeague REAL,
            avgBhTrophies REAL,
            avgThLevel REAL,
            avgBhLevel REAL,
            avgWarStars REAL,

            -- Clan War Stats
            warsWon INTEGER,
            warsLost INTEGER,
            warsTied INTEGER,

            -- Clan Games Stats
            CgTotalPoints INTEGER,
            CgActivePlayers INTEGER,
            CgMaxPlayers INTEGER,
            CgAvgPoints REAL,

            -- Clan Capital Stats
            ccCapitalHallLvl INTEGER,
            ccUpgrades INTEGER,
            ccTrophies INTEGER,
            ccAvgGoldDonated REAL
        )`,
        [
            { name: 'season', type: 'TEXT PRIMARY KEY' },
            { name: 'teamSeason', type: 'INTEGER' },

            //  Clan High Level Overview
            { name: 'clanLevel', type: 'INTEGER' },
            { name: 'estClanXpGain', type: 'INTEGER' },
            { name: 'thClanPoints', type: 'INTEGER' },
            { name: 'bhClanPoints', type: 'INTEGER' },
            { name: 'playerCount', type: 'INTEGER' },

            // Clan Entrance Requirements
            { name: 'thLeagueRequirement', type: 'INTEGER' },
            { name: 'bhTrophyRequirement', type: 'INTEGER' },
            { name: 'minThRequirement', type: 'INTEGER' },

            // Player Stats
            { name: 'avgPlayerLvl', type: 'INTEGER' },
            { name: 'avgThLeague', type: 'REAL' },
            { name: 'avgBhTrophies', type: 'REAL' },
            { name: 'avgThLevel', type: 'REAL' },
            { name: 'avgBhLevel', type: 'REAL' },
            { name: 'avgWarStars', type: 'REAL' },

            // Clan War Stats
            { name: 'warsWon', type: 'INTEGER' },
            { name: 'warsLost', type: 'INTEGER' },
            { name: 'warsTied', type: 'INTEGER' },

            // Clan Games Stats
            { name: 'CgTotalPoints', type: 'INTEGER' },
            { name: 'CgActivePlayers', type: 'INTEGER' },
            { name: 'CgMaxPlayers', type: 'INTEGER' },
            { name: 'CgAvgPoints', type: 'REAL' },

            // Clan Capital Stats
            { name: 'ccCapitalHallLvl', type: 'INTEGER' },
            { name: 'ccUpgrades', type: 'INTEGER' },
            { name: 'ccTrophies', type: 'INTEGER' },
            { name: 'ccAvgGoldDonated', type: 'REAL' }
        ]
    );

    // Table 15: C2_CwlSeasonStats
    // Primary database: A3_CWLWarDetails || A4_CWLAttackDetails
    // DB format: Stores summarized CWL history (monthly, right after CWL ends)
    // DB Ordering: season number
    
    createOrUpdateTable(
        db,
        'C2_CwlSeasonStats',
        `(
            season TEXT PRIMARY KEY,
            teamSeason INTEGER,
            clanLevel INTEGER,

            -- CWL High Level Overview
            cwlLeague TEXT,
            cwlPosition INTEGER,
            cwlPromotion BOOLEAN,
            cwlWarSize INTEGER,
            cwlWarsWon INTEGER,
            cwlTotalWars INTEGER,

            -- CWL Stats
            cwlStarsEarned INTEGER,
            cwlStarsMax INTEGER,
            cwlStarsPercentage REAL,

            cwlDamageEarned INTEGER,
            cwlDamageMax INTEGER,
            cwlDamagePercentage REAL,

            cwlXpEarned INTEGER

            cwlAttacksUsed INTEGER,
            cwlAttacksMax INTEGER,
            cwlAttacksPercentage REAL,

            cwlAvgStarsPerAttack REAL,
            cwlAvgTeamThLevel REAL,

            --CWL Opponent Stats
            cwlTotalAvgAttacks REAL,

            cwlOpponentAttacks INTEGER,
            cwlOpponentAttacksMax INTEGER,
            cwlOpponentAttacksPercentage REAL,

            cwlOpponentAvgStars REAL,
            cwlOpponentAvgStarsMax INTEGER,
            cwlOpponentAvgStarsPercentage REAL,
            cwlTotalAvgStarsPerAttack REAL,

            cwlTotalAvgDamage REAL,
            cwlTotalAvgDamageMax REAL,
            cwlTotalAvgDamagePercentage REAL,

            cwlTotalAvgThLevel REAL
        )`,
        [
            { name: 'season', type: 'TEXT PRIMARY KEY' },
            { name: 'teamSeason', type: 'INTEGER' },
            { name: 'clanLevel', type: 'INTEGER' },

            // CWL High Level Overview
            { name: 'cwlLeague', type: 'TEXT' },
            { name: 'cwlPosition', type: 'INTEGER' },
            { name: 'cwlPromotion', type: 'BOOLEAN' },
            { name: 'cwlWarSize', type: 'INTEGER' },
            { name: 'cwlWarsWon', type: 'INTEGER' },
            { name: 'cwlTotalWars', type: 'INTEGER' },

            // CWL Stats
            { name: 'cwlStarsEarned', type: 'INTEGER' },
            { name: 'cwlStarsMax', type: 'INTEGER' },
            { name: 'cwlStarsPercentage', type: 'REAL' },

            { name: 'cwlDamageEarned', type: 'INTEGER' },
            { name: 'cwlDamageMax', type: 'INTEGER' },
            { name: 'cwlDamagePercentage', type: 'REAL' },

            { name: 'cwlXpEarned', type: 'INTEGER' },

            { name: 'cwlAttacksUsed', type: 'INTEGER' },
            { name: 'cwlAttacksMax', type: 'INTEGER' },
            { name: 'cwlAttacksPercentage', type: 'REAL' },

            { name: 'cwlAvgStarsPerAttack', type: 'REAL' },
            { name: 'cwlAvgTeamThLevel', type: 'REAL' },

            //CWL Opponent Stats
            { name: 'cwlTotalAvgAttacks', type: 'REAL' },

            { name: 'cwlOpponentAttacks', type: 'INTEGER' },
            { name: 'cwlOpponentAttacksMax', type: 'INTEGER' },
            { name: 'cwlOpponentAttacksPercentage', type: 'REAL' },

            { name: 'cwlOpponentAvgStars', type: 'REAL' },
            { name: 'cwlOpponentAvgStarsMax', type: 'INTEGER' },
            { name: 'cwlOpponentAvgStarsPercentage', type: 'REAL' },
            { name: 'cwlTotalAvgStarsPerAttack', type: 'REAL' },

            { name: 'cwlTotalAvgDamage', type: 'REAL' },
            { name: 'cwlTotalAvgDamageMax', type: 'REAL' },
            { name: 'cwlTotalAvgDamagePercentage', type: 'REAL' },

            { name: 'cwlTotalAvgThLevel', type: 'REAL' }
        ]
    );

    // Table 16: C3_ClanWarSeasonStats
    // Primary database: A5_ClanWarLog || A6_ClanWarAttackDetails
    // DB format: Stores summarized clan war history (monthly, right before CWL signup ends)
    // DB Ordering: season number
    
    createOrUpdateTable(
        db,
        'C3_ClanWarSeasonStats',
        `(
            season TEXT PRIMARY KEY,
            teamSeason INTEGER,
            clanLevel INTEGER,

            -- Clan War High Level Overview
            totalWars INTEGER,
            seasonWarsWon INTEGER,
            seasonWarsLost INTEGER,
            seasonWarsTied INTEGER,

            -- Clan War Stats
            totalStarsEarned INTEGER,
            totalStarsMax INTEGER,
            starsPercentage REAL,

            totalAttacksUsed INTEGER,
            totalAttacksMax INTEGER,
            attacksPercentage REAL,

            avgStarsPerAttack REAL,
            avgNewStarsPerAttack REAL,
            avgDamagePercentage REAL,

            estXpEarned INTEGER,
            avgXpPerWar REAL,

            -- Opponent Stats
            opponentStarsEarned INTEGER,
            opponentStarsMax INTEGER,
            opponentStarsPercentage REAL,

            opponentAttacksUsed INTEGER,
            opponentAttacksMax INTEGER,
            opponentAttacksPercentage REAL,

            avgOpponentStarsPerAttack REAL,
            avgOpponrntNewStarsPerAttack REAL,
            avgOpponentDamagePercentage REAL
        )`,
        [
            { name: 'season', type: 'TEXT PRIMARY KEY' },
            { name: 'teamSeason', type: 'INTEGER' },
            { name: 'clanLevel', type: 'INTEGER' },

            // Clan War High Level Overview
            { name: 'totalWars', type: 'INTEGER' },
            { name: 'seasonWarsWon', type: 'INTEGER' },
            { name: 'seasonWarsLost', type: 'INTEGER' },
            { name: 'seasonWarsTied', type: 'INTEGER' },

            // Clan War Stats
            { name: 'totalStarsEarned', type: 'INTEGER' },
            { name: 'totalStarsMax', type: 'INTEGER' },
            { name: 'starsPercentage', type: 'REAL' },

            { name: 'totalAttacksUsed', type: 'INTEGER' },
            { name: 'totalAttacksMax', type: 'INTEGER' },
            { name: 'attacksPercentage', type: 'REAL' },

            { name: 'avgStarsPerAttack', type: 'REAL' },
            { name: 'avgNewStarsPerAttack', type: 'REAL' },
            { name: 'avgDamagePercentage', type: 'REAL' },

            { name: 'estXpEarned', type: 'INTEGER' },
            { name: 'avgXpPerWar', type: 'REAL' },

            // Opponent Stats
            { name: 'opponentStarsEarned', type: 'INTEGER' },
            { name: 'opponentStarsMax', type: 'INTEGER' },
            { name: 'opponentStarsPercentage', type: 'REAL' },

            { name: 'opponentAttacksUsed', type: 'INTEGER' },
            { name: 'opponentAttacksMax', type: 'INTEGER' },
            { name: 'opponentAttacksPercentage', type: 'REAL' },

            { name: 'avgOpponentStarsPerAttack', type: 'REAL' },
            { name: 'avgOpponrntNewStarsPerAttack', type: 'REAL' },
            { name: 'avgOpponentDamagePercentage', type: 'REAL' }
        ]
    );

    // Table 17: C4_WeekendRaidSeasonStats
    // Primary database: A7_ClanCapitalLog || A8_ClanCapitalAttacks || A9_ClanCapitalClanAttacks || A10_ClanCapitalClanDefenses
    // DB format: Stores summarized clan capital history (monthly, right before CWL signup ends)
    // DB Ordering: season number
    
    createOrUpdateTable(
        db,
        'C4_WeekendRaidSeasonStats',
        `(
            season TEXT PRIMARY KEY,
            teamSeason INTEGER,
            clanLevel INTEGER,

            -- Weekend Raid High Level Overview
            clanCapitalHallLvl INTEGER,
            clanCapitalUpgrades INTEGER,
            clanCapitalTrophies INTEGER,
            seasonRaidsCompleted INTEGER,

            -- Weekend Raid Player Stats
            seasonClanMembers INTEGER,
            totalPlayers INTEGER,
            avgPlayersPerRaid REAL,
            totalMaxPlayers INTEGER,
            percentagePlayersPerRaid REAL,

            -- Weekend Raid Stats
            trophiesGained INTEGER,
            avgTrophiesGained REAL,

            goldLootedTotal INTEGER,
            goldLootedAvg REAL,
            goldLootedAvgPerPlayer REAL,
            goldLootedAvgPerAttack REAL,

            attacksTotal INTEGER,
            attacksTotalPerRaid REAL,
            attacksAvgPerPlayer REAL,
            attacksAvgPerPlayerPercentage REAL,

            raidMedalsAttackTotal INTEGER,
            raidMedalsDefenseTotal INTEGER,
            raidMedalsTotal INTEGER,
            raidMedalsAvg REAL,

            -- Clans Stats
            clansAttackedTotal INTEGER,
            clansAttackedAvg REAL,
            avgAttacksPerClan REAL,

            clansDefendedTotal INTEGER,
            clansDefendedAttacks INTEGER,
            clansDefendedAttacksAvg REAL

            -- Clan Performance
            attackPerformanceRatio REAL,
            clansAttackDefenseRatio REAL
        )`,
        [
            { name: 'season', type: 'TEXT PRIMARY KEY' },
            { name: 'teamSeason', type: 'INTEGER' },
            { name: 'clanLevel', type: 'INTEGER' },

            //  Clan High Level Overview
            { name: 'clanCapitalHallLvl', type: 'INTEGER' },
            { name: 'clanCapitalUpgrades', type: 'INTEGER' },
            { name: 'clanCapitalTrophies', type: 'INTEGER' },
            { name: 'seasonRaidsCompleted', type: 'INTEGER' },

            // Weekend Raid Player Stats
            { name: 'seasonClanMembers', type: 'INTEGER' },
            { name: 'totalPlayers', type: 'INTEGER' },
            { name: 'avgPlayersPerRaid', type: 'REAL' },
            { name: 'totalMaxPlayers', type: 'INTEGER' },
            { name: 'percentagePlayersPerRaid', type: 'REAL' },

            // Weekend Raid Stats
            { name: 'trophiesGained', type: 'INTEGER' },
            { name: 'avgTrophiesGained', type: 'REAL' },

            { name: 'goldLootedTotal', type: 'INTEGER' },
            { name: 'goldLootedAvg', type: 'INTEGER' },
            { name: 'goldLootedAvgPerPlayer', type: 'REAL' },
            { name: 'goldLootedAvgPerAttack', type: 'REAL' },

            { name: 'attacksTotal', type: 'INTEGER' },
            { name: 'attacksTotalPerRaid', type: 'REAL' },
            { name: 'attacksAvgPerPlayer', type: 'REAL' },
            { name: 'attacksAvgPerPlayerPercentage', type: 'REAL' },

            { name: 'raidMedalsAttackTotal', type: 'INTEGER' },
            { name: 'raidMedalsDefenseTotal', type: 'INTEGER' },
            { name: 'raidMedalsTotal', type: 'INTEGER' },
            { name: 'raidMedalsAvg', type: 'REAL' },

            // Clans Stats
            { name: 'clansAttackedTotal', type: 'INTEGER' },
            { name: 'clansAttackedAvg', type: 'REAL' },
            { name: 'avgAttacksPerClan', type: 'REAL' },

            { name: 'clansDefendedTotal', type: 'INTEGER' },
            { name: 'clansDefendedAttacks', type: 'INTEGER' },
            { name: 'clansDefendedAttacksAvg', type: 'REAL' },

            // Clan Performance
            { name: 'attackPerformanceRatio', type: 'REAL' },
            { name: 'clansAttackDefenseRatio', type: 'REAL' }
        ]
    );

    // Table 18: C5_ThLeagueSeasonStats
    // Primary database: A2_ClanMembers
    // DB format: Stores count of number of players per league in the clan (weekly, right before ranked signup ends)
    // DB Ordering: season number
    
    createOrUpdateTable(
        db,
        'C5_ThLeagueSeasonStats',
        `(
            season TEXT PRIMARY KEY,
            teamSeason INTEGER,
            clanLevel INTEGER,

            avgThLeague REAL,

            -- Unranked
            leagueCount0 INTEGER,

            -- Skeleton League
            leagueCount1 INTEGER,
            leagueCount2 INTEGER,
            leagueCount3 INTEGER,

            -- Barbarian League
            leagueCount4 INTEGER,
            leagueCount5 INTEGER,
            leagueCount6 INTEGER,

            -- Archer League
            leagueCount7 INTEGER,
            leagueCount8 INTEGER,
            leagueCount9 INTEGER,

            -- Wizard League
            leagueCount10 INTEGER,
            leagueCount11 INTEGER,
            leagueCount12 INTEGER,

            -- Valkyrie League
            leagueCount13 INTEGER,
            leagueCount14 INTEGER,
            leagueCount15 INTEGER,

            -- Witch League
            leagueCount16 INTEGER,
            leagueCount17 INTEGER,
            leagueCount18 INTEGER,

            -- Golem League
            leagueCount19 INTEGER,
            leagueCount20 INTEGER,
            leagueCount21 INTEGER,

            -- P.E.K.K.A League
            leagueCount22 INTEGER,
            leagueCount23 INTEGER,
            leagueCount24 INTEGER,

            -- Electro Titan League
            leagueCount25 INTEGER,
            leagueCount26 INTEGER,
            leagueCount27 INTEGER,

            -- Dragon League
            leagueCount28 INTEGER,
            leagueCount29 INTEGER,
            leagueCount30 INTEGER,

            -- Electro Dragon League
            leagueCount31 INTEGER,
            leagueCount32 INTEGER,
            leagueCount33 INTEGER,

            -- Legend League
            leagueCount34 INTEGER
        )`,
        [
            { name: 'season', type: 'TEXT PRIMARY KEY' },
            { name: 'teamSeason', type: 'INTEGER' },
            { name: 'clanLevel', type: 'INTEGER' },

            { name: 'avgThLeague', type: 'REAL' },

            // Unranked
            { name: 'leagueCount0', type: 'INTEGER' },

            // Skeleton League
            { name: 'leagueCount1', type: 'INTEGER' },
            { name: 'leagueCount2', type: 'INTEGER' },
            { name: 'leagueCount3', type: 'INTEGER' },

            // Barbarian League
            { name: 'leagueCount4', type: 'INTEGER' },
            { name: 'leagueCount5', type: 'INTEGER' },
            { name: 'leagueCount6', type: 'INTEGER' },

            // Archer League
            { name: 'leagueCount7', type: 'INTEGER' },
            { name: 'leagueCount8', type: 'INTEGER' },
            { name: 'leagueCount9', type: 'INTEGER' },

            // Wizard League
            { name: 'leagueCount10', type: 'INTEGER' },
            { name: 'leagueCount11', type: 'INTEGER' },
            { name: 'leagueCount12', type: 'INTEGER' },

            // Valkyrie League
            { name: 'leagueCount13', type: 'INTEGER' },
            { name: 'leagueCount14', type: 'INTEGER' },
            { name: 'leagueCount15', type: 'INTEGER' },

            // Witch League
            { name: 'leagueCount16', type: 'INTEGER' },
            { name: 'leagueCount17', type: 'INTEGER' },
            { name: 'leagueCount18', type: 'INTEGER' },

            // Golem League
            { name: 'leagueCount19', type: 'INTEGER' },
            { name: 'leagueCount20', type: 'INTEGER' },
            { name: 'leagueCount21', type: 'INTEGER' },

            // P.E.K.K.A League
            { name: 'leagueCount22', type: 'INTEGER' },
            { name: 'leagueCount23', type: 'INTEGER' },
            { name: 'leagueCount24', type: 'INTEGER' },

            // Electro Titan League
            { name: 'leagueCount25', type: 'INTEGER' },
            { name: 'leagueCount26', type: 'INTEGER' },
            { name: 'leagueCount27', type: 'INTEGER' },

            // Dragon League
            { name: 'leagueCount28', type: 'INTEGER' },
            { name: 'leagueCount29', type: 'INTEGER' },
            { name: 'leagueCount30', type: 'INTEGER' },

            // Electro Dragon League
            { name: 'leagueCount31', type: 'INTEGER' },
            { name: 'leagueCount32', type: 'INTEGER' },
            { name: 'leagueCount33', type: 'INTEGER' },

            // Legend League
            { name: 'leagueCount34', type: 'INTEGER' }
        ]
    );

    // Table 19: C6_BhLeagueSeasonStats
    // Primary database: A2_ClanMembers
    // DB format: Stores count of number of players per builder base league in the clan (monthly, right before CWL signup ends)
    // DB Ordering: season number
    
    createOrUpdateTable(
        db,
        'C6_BhLeagueSeasonStats',
        `(
            season TEXT PRIMARY KEY,
            teamSeason INTEGER,
            clanLevel INTEGER,

            avgBhLeague REAL,

            -- Unranked
            leagueCount0 INTEGER,

            -- Sub-2000 Leagues
            leagueCountWood5 INTEGER,
            leagueCountWood4 INTEGER,
            leagueCountWood3 INTEGER,
            leagueCountWood2 INTEGER,
            leagueCountWood1 INTEGER,

            leagueCountClay5 INTEGER,
            leagueCountClay4 INTEGER,
            leagueCountClay3 INTEGER,
            leagueCountClay2 INTEGER,
            leagueCountClay1 INTEGER,

            leagueCountStone5 INTEGER,
            leagueCountStone4 INTEGER,
            leagueCountStone3 INTEGER,
            leagueCountStone2 INTEGER,
            leagueCountStone1 INTEGER,

            leagueCountCopper5 INTEGER,
            leagueCountCopper4 INTEGER,
            leagueCountCopper3 INTEGER,
            leagueCountCopper2 INTEGER,
            leagueCountCopper1 INTEGER,

            -- Crystal to Titan Leagues
            leagueCountBrass3 INTEGER,
            leagueCountBrass2 INTEGER,
            leagueCountBrass1 INTEGER,

            leagueCountIron3 INTEGER,
            leagueCountIron2 INTEGER,
            leagueCountIron1 INTEGER,

            leagueCountSteel3 INTEGER,
            leagueCountSteel2 INTEGER,
            leagueCountSteel1 INTEGER,

            leagueCountTitanium3 INTEGER,
            leagueCountTitanium2 INTEGER,
            leagueCountTitanium1 INTEGER,

            leagueCountPlatinum3 INTEGER,
            leagueCountPlatinum2 INTEGER,
            leagueCountPlatinum1 INTEGER,

            -- Legend Leagues
            leagueCountEmerald3 INTEGER,
            leagueCountEmerald2 INTEGER,
            leagueCountEmerald1 INTEGER,

            leagueCountRuby3 INTEGER,
            leagueCountRuby2 INTEGER,
            leagueCountRuby1 INTEGER,

            leagueCountDiamond INTEGER
        )`,
        [
            { name: 'season', type: 'TEXT PRIMARY KEY' },
            { name: 'teamSeason', type: 'INTEGER' },
            { name: 'clanLevel', type: 'INTEGER' },

            { name: 'avgBhLeague', type: 'REAL' },

            // Unranked
            { name: 'leagueCount0', type: 'INTEGER' },

            // Sub-2000 Leagues
            { name: 'leagueCountWood5', type: 'INTEGER' },
            { name: 'leagueCountWood4', type: 'INTEGER' },
            { name: 'leagueCountWood3', type: 'INTEGER' },
            { name: 'leagueCountWood2', type: 'INTEGER' },
            { name: 'leagueCountWood1', type: 'INTEGER' },

            { name: 'leagueCountClay5', type: 'INTEGER' },
            { name: 'leagueCountClay4', type: 'INTEGER' },
            { name: 'leagueCountClay3', type: 'INTEGER' },
            { name: 'leagueCountClay2', type: 'INTEGER' },
            { name: 'leagueCountClay1', type: 'INTEGER' },

            { name: 'leagueCountStone5', type: 'INTEGER' },
            { name: 'leagueCountStone4', type: 'INTEGER' },
            { name: 'leagueCountStone3', type: 'INTEGER' },
            { name: 'leagueCountStone2', type: 'INTEGER' },
            { name: 'leagueCountStone1', type: 'INTEGER' },

            { name: 'leagueCountCopper5', type: 'INTEGER' },
            { name: 'leagueCountCopper4', type: 'INTEGER' },
            { name: 'leagueCountCopper3', type: 'INTEGER' },
            { name: 'leagueCountCopper2', type: 'INTEGER' },
            { name: 'leagueCountCopper1', type: 'INTEGER' },

            // Crystal to Titan Leagues
            { name: 'leagueCountBrass3', type: 'INTEGER' },
            { name: 'leagueCountBrass2', type: 'INTEGER' },
            { name: 'leagueCountBrass1', type: 'INTEGER' },

            { name: 'leagueCountIron3', type: 'INTEGER' },
            { name: 'leagueCountIron2', type: 'INTEGER' },
            { name: 'leagueCountIron1', type: 'INTEGER' },

            { name: 'leagueCountSteel3', type: 'INTEGER' },
            { name: 'leagueCountSteel2', type: 'INTEGER' },
            { name: 'leagueCountSteel1', type: 'INTEGER' },

            { name: 'leagueCountTitanium3', type: 'INTEGER' },
            { name: 'leagueCountTitanium2', type: 'INTEGER' },
            { name: 'leagueCountTitanium1', type: 'INTEGER' },

            { name: 'leagueCountPlatinum3', type: 'INTEGER' },
            { name: 'leagueCountPlatinum2', type: 'INTEGER' },
            { name: 'leagueCountPlatinum1', type: 'INTEGER' },

            // Legend Leagues
            { name: 'leagueCountEmerald3', type: 'INTEGER' },
            { name: 'leagueCountEmerald2', type: 'INTEGER' },
            { name: 'leagueCountEmerald1', type: 'INTEGER' },

            { name: 'leagueCountRuby3', type: 'INTEGER' },
            { name: 'leagueCountRuby2', type: 'INTEGER' },
            { name: 'leagueCountRuby1', type: 'INTEGER' },

            { name: 'leagueCountDiamond', type: 'INTEGER' }
        ]
    );

    // Table 20: C7_ThCountSeasonStats
    // Primary database: A2_ClanMembers
    // DB format: Stores count of number of players THs in the clan (monthly, right before CWL signup ends)
    // DB Ordering: season number
    
    createOrUpdateTable(
        db,
        'C7_ThCountSeasonStats',
        `(
            season TEXT PRIMARY KEY,
            teamSeason INTEGER,
            clanLevel INTEGER,

            avgThLevel REAL,

            -- Town Hall Levels
            countTh1 INTEGER,
            countTh2 INTEGER,
            countTh3 INTEGER,
            countTh4 INTEGER,
            countTh5 INTEGER,
            countTh6 INTEGER,
            countTh7 INTEGER,
            countTh8 INTEGER,
            countTh9 INTEGER,
            countTh10 INTEGER,
            countTh11 INTEGER,
            countTh12 INTEGER,
            countTh13 INTEGER,
            countTh14 INTEGER,
            countTh15 INTEGER,
            countTh16 INTEGER,
            countTh17 INTEGER,
            countTh18 INTEGER
        )`,
        [
            { name: 'season', type: 'TEXT PRIMARY KEY' },
            { name: 'teamSeason', type: 'INTEGER' },
            { name: 'clanLevel', type: 'INTEGER' },

            { name: 'avgThLevel', type: 'REAL' },

            // Town Hall Levels
            { name: 'countTh1', type: 'INTEGER' },
            { name: 'countTh2', type: 'INTEGER' },
            { name: 'countTh3', type: 'INTEGER' },
            { name: 'countTh4', type: 'INTEGER' },
            { name: 'countTh5', type: 'INTEGER' },
            { name: 'countTh6', type: 'INTEGER' },
            { name: 'countTh7', type: 'INTEGER' },
            { name: 'countTh8', type: 'INTEGER' },
            { name: 'countTh9', type: 'INTEGER' },
            { name: 'countTh10', type: 'INTEGER' },
            { name: 'countTh11', type: 'INTEGER' },
            { name: 'countTh12', type: 'INTEGER' },
            { name: 'countTh13', type: 'INTEGER' },
            { name: 'countTh14', type: 'INTEGER' },
            { name: 'countTh15', type: 'INTEGER' },
            { name: 'countTh16', type: 'INTEGER' },
            { name: 'countTh17', type: 'INTEGER' },
            { name: 'countTh18', type: 'INTEGER' }            
        ]
    );

    // Table 21: C8_BhCountSeasonStats
    // Primary database: A2_ClanMembers
    // DB format: Stores count of number of players BHs in the clan (monthly, right before CWL signup ends)
    // DB Ordering: season number
    
    createOrUpdateTable(
        db,
        'C8_BhCountSeasonStats',
        `(
            season TEXT PRIMARY KEY,
            teamSeason INTEGER,
            clanLevel INTEGER,

            avgBhLevel REAL,

            -- Builder Hall Levels
            countBh1 INTEGER,
            countBh2 INTEGER,
            countBh3 INTEGER,
            countBh4 INTEGER,
            countBh5 INTEGER,
            countBh6 INTEGER,
            countBh7 INTEGER,
            countBh8 INTEGER,
            countBh9 INTEGER,
            countBh10 INTEGER
        )`,
        [
            { name: 'season', type: 'TEXT PRIMARY KEY' },
            { name: 'teamSeason', type: 'INTEGER' },
            { name: 'clanLevel', type: 'INTEGER' },

            { name: 'avgBhLevel', type: 'REAL' },

            // Builder Hall Levels
            { name: 'countBh1', type: 'INTEGER' },
            { name: 'countBh2', type: 'INTEGER' },
            { name: 'countBh3', type: 'INTEGER' },
            { name: 'countBh4', type: 'INTEGER' },
            { name: 'countBh5', type: 'INTEGER' },
            { name: 'countBh6', type: 'INTEGER' },
            { name: 'countBh7', type: 'INTEGER' },
            { name: 'countBh8', type: 'INTEGER' },
            { name: 'countBh9', type: 'INTEGER' },
            { name: 'countBh10', type: 'INTEGER' }         
        ]
    );

    // Table 22: D1_Achievements
    // Primary database: A1_ClanInfo
    // DB format: Stores achievements of the clan (updated whenever the relevant achievement is obtained; formatted per achievement)
    // DB Ordering: order of Achievement
    
    createOrUpdateTable(
        db,
        'D1_Achievements',
        `(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            
            dateLogged TEXT,
            achievementName TEXT,
            achievementInt INTEGER,
        )`,
        [
            { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
            
            { name: 'dateLogged', type: 'TEXT' },
            { name: 'achievementName', type: 'TEXT' },
            { name: 'achievementInt', type: 'INTEGER' }   
        ]
    );
}

// Get db name from command line argument
const dbFileName = "DEVTEST.db";
if (!dbFileName) {
    console.error('Please specify a database file name.');
    process.exit(1);
}

createDatabase(dbFileName);