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

    if (!dbExists) {
        // Create tables only if DB is new
        createTables(db);
    } else {
        // Update schema only if DB already exists
        updateTables(db);
    }

    db.close();
}

function createTables(db) {
    // Page 1: A1_ClanInfo
    createOrUpdateTable(
        db,
        'A1_ClanInfo',
        `(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dateLogged TEXT,
            name TEXT,
            type TEXT,
            requiredTrophies INTEGER,
            requiredBbTrophies INTEGER,
            requiredThLevel INTEGER,
            description TEXT,
            locationName TEXT,
            isFamilyFriendly BOOLEAN,
            clanLevel INTEGER,
            clanPoints INTEGER,
            clanBbPoints INTEGER,
            capitalLeagueName TEXT,
            capitalHallLevel INTEGER,
            capitalPoints INTEGER,
            warFrequency TEXT,
            isWarLogPublic BOOLEAN,
            warWinStreak INTEGER,
            warWins INTEGER,
            warTies INTEGER,
            warLosses INTEGER,
            CWLLeagueName TEXT,
            members INTEGER
        )`,
        [
            { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
            { name: 'dateLogged', type: 'TEXT' },
            { name: 'name', type: 'TEXT' },
            { name: 'type', type: 'TEXT' },
            { name: 'requiredTrophies', type: 'INTEGER' },
            { name: 'requiredBbTrophies', type: 'INTEGER' },
            { name: 'requiredThLevel', type: 'INTEGER' },
            { name: 'description', type: 'TEXT' },
            { name: 'locationName', type: 'TEXT' },
            { name: 'isFamilyFriendly', type: 'BOOLEAN' },
            { name: 'clanLevel', type: 'INTEGER' },
            { name: 'clanPoints', type: 'INTEGER' },
            { name: 'clanBbPoints', type: 'INTEGER' },
            { name: 'capitalLeagueName', type: 'TEXT' },
            { name: 'capitalHallLevel', type: 'INTEGER' },
            { name: 'capitalPoints', type: 'INTEGER' },
            { name: 'warFrequency', type: 'TEXT' },
            { name: 'isWarLogPublic', type: 'BOOLEAN' },
            { name: 'warWinStreak', type: 'INTEGER' },
            { name: 'warWins', type: 'INTEGER' },
            { name: 'warTies', type: 'INTEGER' },
            { name: 'warLosses', type: 'INTEGER' },
            { name: 'CWLLeagueName', type: 'TEXT' },
            { name: 'members', type: 'INTEGER' }
        ]
    );

    // Page 2: A2_ClanMembers
    createOrUpdateTable(
        db,
        'A2_ClanMembers',
        `(
            -- Main player info
            tag TEXT PRIMARY KEY,
            name TEXT,
            lastUpdated TEXT,
            dateJoin TEXT,
            dateLeft TEXT,
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
                lvlHeroEquipmentElectroBoots INTEGER
        )`,
        [
            { name: 'tag', type: 'TEXT PRIMARY KEY' },
            { name: 'name', type: 'TEXT' },
            { name: 'lastUpdated', type: 'TEXT' },
            { name: 'dateJoin', type: 'TEXT' },
            { name: 'dateLeft', type: 'TEXT' },
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
            { name: 'lvlHeroEquipmentElectroBoots', type: 'INTEGER' }
        ]
    );
}

function updateTables(db) {
    // Page 1: A1_ClanInfo
    createOrUpdateTable(
        db,
        'A1_ClanInfo',
        `(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dateLogged TEXT,
            name TEXT,
            type TEXT,
            requiredTrophies INTEGER,
            requiredBbTrophies INTEGER,
            requiredThLevel INTEGER,
            description TEXT,
            locationName TEXT,
            isFamilyFriendly BOOLEAN,
            clanLevel INTEGER,
            clanPoints INTEGER,
            clanBbPoints INTEGER,
            capitalLeagueName TEXT,
            capitalHallLevel INTEGER,
            capitalPoints INTEGER,
            warFrequency TEXT,
            isWarLogPublic BOOLEAN,
            warWinStreak INTEGER,
            warWins INTEGER,
            warTies INTEGER,
            warLosses INTEGER,
            CWLLeagueName TEXT,
            members INTEGER
        )`,
        [
            { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
            { name: 'dateLogged', type: 'TEXT' },
            { name: 'name', type: 'TEXT' },
            { name: 'type', type: 'TEXT' },
            { name: 'requiredTrophies', type: 'INTEGER' },
            { name: 'requiredBbTrophies', type: 'INTEGER' },
            { name: 'requiredThLevel', type: 'INTEGER' },
            { name: 'description', type: 'TEXT' },
            { name: 'locationName', type: 'TEXT' },
            { name: 'isFamilyFriendly', type: 'BOOLEAN' },
            { name: 'clanLevel', type: 'INTEGER' },
            { name: 'clanPoints', type: 'INTEGER' },
            { name: 'clanBbPoints', type: 'INTEGER' },
            { name: 'capitalLeagueName', type: 'TEXT' },
            { name: 'capitalHallLevel', type: 'INTEGER' },
            { name: 'capitalPoints', type: 'INTEGER' },
            { name: 'warFrequency', type: 'TEXT' },
            { name: 'isWarLogPublic', type: 'BOOLEAN' },
            { name: 'warWinStreak', type: 'INTEGER' },
            { name: 'warWins', type: 'INTEGER' },
            { name: 'warTies', type: 'INTEGER' },
            { name: 'warLosses', type: 'INTEGER' },
            { name: 'CWLLeagueName', type: 'TEXT' },
            { name: 'members', type: 'INTEGER' }
        ]
    );

    // Page 2: A2_ClanMembers
    createOrUpdateTable(
        db,
        'A2_ClanMembers',
        `(
            -- Main player info
            tag TEXT PRIMARY KEY,
            name TEXT,
            lastUpdated TEXT,
            dateJoin TEXT,
            dateLeft TEXT,
            name TEXT,
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
                lvlHeroEquipmentElectroBoots INTEGER
        )`,
        [
            { name: 'tag', type: 'TEXT PRIMARY KEY' },
            { name: 'name', type: 'TEXT' },
            { name: 'lastUpdated', type: 'TEXT' },
            { name: 'dateJoin', type: 'TEXT' },
            { name: 'dateLeft', type: 'TEXT' },
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
            { name: 'lvlHeroEquipmentElectroBoots', type: 'INTEGER' }
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