import { Plugin, UIManagerScope } from "@highlite/core";
import { UIManager } from "@highlite/core";
import { SoundManager } from "@highlite/core";

// Yes, this is an import from the same file. I want to alias this as
//  a shorter name in the plugin, but I don't want to expose the shorter
//  name in the export and muddy the namespace.
import { SpellSoundLogLevel as LogLevel } from "./SpellSound";
import { SpellSoundLogSource as LogSource } from "./SpellSound";

import icon_musicPlayer from "../../resources/images/music_icon.png";  // '@static/media/SpellSound/music_icon.png';

//// I like importing these so that there's a compile error if any
////  of these files are missing, so that I can fix it.

//// ==== songs below here ====
import song_SoundMain from '../../resources/sounds/SpellSound/songs/sound_main.mp3';
import song_EarlyDawn from '../../resources/sounds/SpellSound/songs/early_dawn.mp3';
import song_SpiritRealmCrossing1 from '../../resources/sounds/SpellSound/songs/spirit_realm_crossing_1.mp3';
import song_SpiritRealmCrossing2 from '../../resources/sounds/SpellSound/songs/spirit_realm_crossing_2.mp3';
import song_SpiritRealmCrossing3 from '../../resources/sounds/SpellSound/songs/spirit_realm_crossing_3.mp3';
import song_VolrundTheHonourable from '../../resources/sounds/SpellSound/songs/volrund_the_honourable.mp3';
import song_Poisoned from '../../resources/sounds/SpellSound/songs/poisoned.mp3';
import song_Spaces from '../../resources/sounds/SpellSound/songs/spaces.mp3';
import song_LivelyCity from '../../resources/sounds/SpellSound/songs/lively_city.mp3';
import song_WindsOfSiron from '../../resources/sounds/SpellSound/songs/winds_of_siron.mp3';
import song_Marketplace from '../../resources/sounds/SpellSound/songs/marketplace.mp3'
import song_Emperor from '../../resources/sounds/SpellSound/songs/emperor.mp3';
import song_Fishin from '../../resources/sounds/SpellSound/songs/fishin.mp3';
import song_Middlefern from '../../resources/sounds/SpellSound/songs/middlefern.mp3';
import song_WildyRsStyle from '../../resources/sounds/SpellSound/songs/wildy_rs_style.mp3';
import song_Ictirine from '../../resources/sounds/SpellSound/songs/ictirine.mp3';
import song_UpOnGnomeHill from '../../resources/sounds/SpellSound/songs/up_on_gnome_hill.mp3';
import song_Barbarian from '../../resources/sounds/SpellSound/songs/barbarian.mp3';
import song_GlockAndPiano from '../../resources/sounds/SpellSound/songs/glock_and_piano.mp3';
import song_TanSandMan from '../../resources/sounds/SpellSound/songs/tan_sand_man.mp3';
import song_DistantHorizon from '../../resources/sounds/SpellSound/songs/distant_horizon.mp3';
import song_Barony from '../../resources/sounds/SpellSound/songs/barony.mp3';
import song_SwampinAround from '../../resources/sounds/SpellSound/songs/swampin_around.mp3';
import { SpellSoundSfx } from './SpellSoundSfx';

/**
 * Simple class for storing a 2d point. I suppose we could expose this in an "export",
 *  but I don't think it's necessary for now.
 */
class Vector2d {
    constructor(public X: number, public Z: number) {
        this.X = X;
        this.Z = Z;
    }
}

/**
 * Simple enum to represent the human-readable names of locations to play songs in --
 *   for example, "Hedgecastle" or "Middlefern". Also abstract areas like "forest" or
 *  "town". Standardizes the names so that we don't use "Forest" and "Sylvania" to mean
 *  the same thing, etc.
 */
enum MusicRegionName {
    Title = 'title',
    AnywhereOverworld = 'anywhere - overworld', // Can play anywhere on "Overworld layer"
    AnywhereUnderworld = 'anywhere - underworld', // Can play anywhere on "Underworld layer"
    Hedgecastle = 'Hedgecastle',
    Celadon = 'Celadon',
    HighCove = 'High Cove',
    Banton = 'Banton',
    Ictirine = 'Ictirine',
    GnomeHill = 'Gnome Hill',
    Undercroft = 'Undercroft',
    Wasteland = 'Wasteland',
    City = 'city',
    Town = 'town',
    Village = 'village',
    Wilderness = 'wilderness',
    Middlefern = 'Middlefern',
    Marketplace = 'marketplace',
    Beach = 'beach',
    Castle = 'castle',
    Fairy = 'fairy',
    Magical = 'magical',
    Dangerous = 'dangerous',
    Fishing = 'fishing',
    Lake = 'lake',
    River = 'river',
    Cavern = 'cavern',
    Underground = 'underground',
    Mining = 'mining',
    Summerton = 'summerton',
    DriftwoodIsle = 'driftwood isle',
    MtTan = 'Mount Tan',

    // where I want the song "Volrund the Honourable" to play with priority.
    //  not actually a region ingame (like "Banton")
    VolrundsLand = 'Volrund\'s Land',

    WizardsTower = 'Wizard\'s Tower',
    KabeAgilityCourse = 'Kabe Agility Course',
    SwampAgilityCourse = 'Swamp Agility Course',
}

enum MusicRegionLayer {
    Sky = 2, // I *think* the sky layer is layer 2?
    Overworld = 1,
    Underworld = 0,
    Title = -1, // Special layer for the title screen
}

/**
 * Parameters for the MusicRegion constructor. This way we can use
 * named parameters and JSON syntax to create a new MusicRegion object.
 */
interface MusicRegionParams {
    regionName: MusicRegionName;
    bottomLeftWorldPos?: Vector2d;
    topRightWorldPos?: Vector2d;
    regionLayer?: MusicRegionLayer; // Optional, defaults to Overworld
}

/**
 * Defines a bounding box/region inside of which certain types of music will play.
 */
class MusicRegion {
    /**
     * The bottom left vertex of the bounding box that defines this region.
     */
    public bottomLeftWorldPos: Vector2d;

    /**
     * The top right vertex of the bounding box that defines this region.
     */
    public topRightWorldPos: Vector2d;

    /**
     * The name of this region, e.g., "Hedgecastle".
     */
    public regionName: MusicRegionName;

    /**
     * The layer that this region belongs to, e.g., Overworld, Underworld, sky.
     * This is used to determine which layer the music should play on.
     */
    public regionLayer: MusicRegionLayer;

    /**
     * Creates a new MusicRegion object that represents a rectangular region
     *  in the game world defined by the chunk coordinates and the names of the regions.
     * 
     * @param regionName -- The name of this region, e.g., "Hedgecastle".
     * @param bottomLeftWorldPos -- The bottom left vertex of the bounding box.
     * @param topRightWorldPos -- The top right vertex of the bounding box.
     */
    constructor({
            regionName,
            bottomLeftWorldPos,
            topRightWorldPos,
            regionLayer = MusicRegionLayer.Overworld }
        : MusicRegionParams
    ) {
        this.bottomLeftWorldPos = bottomLeftWorldPos ?? new Vector2d(0, 0);
        this.topRightWorldPos = topRightWorldPos ?? new Vector2d(0, 0);
        this.regionName = regionName;
        this.regionLayer = regionLayer;
    }
}

/**
 * A MusicRegionTag is the abstract idea of where a song should play in the game world, like
 *  "Forest" or "HedgeCastle", whereas MusicRegion is a concrete implementation of a
 *  rectangular area in the game world that contains one or more MusicRegionTags.
 */
class MusicRegionTag {
    /**
     * Creates a new MusicRegionTag object that represents a region where a song should play.
     * @param regionName -- The name of the region where this song should play.
     * @param priority -- The priority of this region tag. Lower numbers mean higher priority.
     *                        Infinity means no priority, 0 is the highest priority, 1 is lower, etc.
     */
    constructor(
        public regionName: MusicRegionName,
        public priority: number = Infinity // Infinity is no priority, 0 is the highest priority, 1 is lower, etc.
    ) {
        this.regionName = regionName;
        this.priority = priority;
    }
}

/**
 * Parameters for the SongInfo constructor. This way we can use
 *  named parameters and JSON syntax to create a new SongInfo object.
 */
interface SongInfoParams {
    name: string;
    url: string;
    minLoopCount: number;
    maxLoopCount: number;
    regionsToPlayIn: MusicRegionTag[];
    author: string;
}

/**
 * LogLevel is an enum that defines the different levels of logging
 *  that can be used in the plugin. Some log messages are enabled/
 *  disabled based on this.doLogAllDebugInfo, which is a plugin setting.
 */
export enum SpellSoundLogLevel {
    Debug,
    Important,
    Error,
}

/**
 * SpellSoundLogSource is an enum that defines the different sources
 *  of log messages in the plugin. This is used to differentiate between
 *  music and sound effects log messages, so that we can enable/disable
 *  them separately.
 */
export enum SpellSoundLogSource {
    Music,
    Sfx,
}

/**
 * A simple class to store song metadata, such as the name, URL, loop count, and regions
 *  to play in.
 */
class SongInfo {
    // The name of the song, which will be displayed in the music player.
    public name: string;

    // The URL of the song, which can be a local file or a remote URL.
    public url: string;

    // minLoopCount is the minimum number of times (inclusive)
    //  that the song *will* loop.
    // -1 means it will loop indefinitely, 0 that it won't loop at all.
    public minLoopCount: number = -1;

    // maxLoopCount is the maximum number of times (inclusive)
    // -1 means it will loop indefinitely, 0 that it won't loop at all.
    public maxLoopCount: number = -1;

    // An array of MusicRegionTag objects representing the regions
    // where this song should play. For example, if the song should
    // play in the "Hedgecastle" region, then this array would contain
    // a MusicRegionTag with the regionName set to "Hedgecastle".
    public regionsToPlayIn: MusicRegionTag[] = [];

    // The author of the song, which will be displayed in the music player.
    public author: string = 'Unknown';

    /**
     * Creates a new SongInfo object that represents a song in the game world.
     * 
     * @param name -- The name of the song.
     * @param url -- The URL of the song.
     * @param minLoopCount -- The minimum number of times (inclusive) that the song will loop.
     *                        -1 means it will loop indefinitely, 0 means it won't loop at all.
     * @param maxLoopCount -- The maximum number of times (inclusive) that the song will loop.
     *                        -1 means it will loop indefinitely, 0 means it won't loop at all.
     * @param regionsToPlayIn -- An array of MusicRegionTag objects representing the regions
     *                           where this song should play.
     * @param author -- The author of the song.
     */
    constructor({ 
            name,
            url,
            minLoopCount = -1,
            maxLoopCount = -1,
            regionsToPlayIn = [],
            author = 'Unknown'}
        : SongInfoParams
    ) {
        this.name = name;
        this.url = url;
        this.minLoopCount = minLoopCount;
        this.maxLoopCount = maxLoopCount;
        this.regionsToPlayIn = regionsToPlayIn;
        this.author = author;
    }
}

/**
 * SpellSound is a HighLite plugin that allows players to play custom music
 * in the game world based on their location. It provides a music player interface
 * and allows players to select and play songs from a predefined list.
 * 
 * It also supports autoplaying music based on the player's location
 * and the defined music regions.
 * 
 * This plugin also adds sound effects to the game, such as pickaxe sounds
 * when mining, smithing sounds when smelting, etc.
 * 
 * The music part of the code is in this class, whereas the sound effects
 * are in the SpellSoundSfx.ts file, which is imported by this class.
 * 
 * @author Bpcooldude
 */
export default class SpellSound extends Plugin {
    pluginName = 'Spell Sound';
    author = 'Bpcooldude';

    private soundManager = new SoundManager();
    private uiManager = new UIManager();

    /**
     * The parent/master "DIV" to which all UI elements of this plugin are added as children
     *  in the DOM hierarchy.
     */
    private masterDiv : HTMLElement | null = null;
    private isAutoplayEnabled: boolean = true;
    private musicPlayerWindow: HTMLDivElement | null = null;
    private currentSong: HTMLAudioElement | null = null;

    // Stores the currentSong's id (index) in the 'songs' array, from
    //  which further metadata can be retrieved.
    private currentSongId: number = 0;
    private musicButton : HTMLElement | null = null;
    private musicInfoContainer: HTMLDivElement | null = null;
    private currentSongNameLabel : HTMLDivElement | null = null;
    private currentSongAuthorLabel : HTMLDivElement | null = null;
    private validMusicRegions : MusicRegion[] = [];

    // Contains a list of all music regions that are in the game.
    private allMusicRegions : MusicRegion[] = []
    private songs : SongInfo[] = [];
    
    /**
     * The timestamp that we last checked the coordinates of the player
     *  against the music regions.
     */
    private lastCoordCheckTimestamp: number = 0;
    private previousPosition: Vector2d | null = null;

    /**
     * The sound effects module of the SpellSound plugin.
     *  It felt appropriate to split up this plugin so it's
     *  not a monolithic "god class".
     */
    private spellSoundSfx : SpellSoundSfx;

    private doLogMusicDebugInfo = true; // Set to true to log all music debug info, false to log only errors, warnings, and important info.
    private doLogSfxDebugInfo = false; // Set to true to log all sfx debug info, false to log only errors, warnings, and important info.

    /**
     * Plugin setting to enable/disable inventory tooltips.
     */
    constructor() {
        super();
        this.spellSoundSfx = new SpellSoundSfx(this);
    }

    /**
     * Logs a message to the console with a specific log level.
     * @param message - The message to log.
     * @param level - The log level (Debug, Important, Error).
     */
    public logToPlugin(message: string, level: LogLevel = LogLevel.Debug, source: LogSource = LogSource.Music): void {
        if (source == LogSource.Music && !this.doLogMusicDebugInfo && level == LogLevel.Debug) {
            return;
        }
        
        if (source == LogSource.Sfx && !this.doLogSfxDebugInfo && level == LogLevel.Debug) {
            return;
        }

        const prefix = `-${LogLevel[level]}- :`;
        switch (level) {
            case LogLevel.Debug:
                this.log(`${prefix} ${message}`);
                break;
            case LogLevel.Important:
                this.log(`${prefix} ${message}`);
                break;
            case LogLevel.Error:
                this.error(`${prefix} ${message}`);
                break;
        }
    }

    /**
     * Initializes the list of songs and metadata.
     */
    initSongs() {
        this.logToPlugin(`\t--> Entering function ${this.initSongs.name}`);

        // A list of the URLs to all songs that can be played, as well as their names.
        this.songs = [
            // anywhere overworld songs
            new SongInfo({
                name: 'Sound Main',
                url: song_SoundMain,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.Title), new MusicRegionTag(MusicRegionName.AnywhereOverworld) ],
                author: 'Bpcooldude', // author's featured title theme
            }),

            new SongInfo({
                name: 'Early Dawn',
                url: song_EarlyDawn,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.AnywhereOverworld) ],
                author: 'Bpcooldude',
            }),

            new SongInfo({
                name: 'Spirit Realm Crossing Pt. 1',
                url: song_SpiritRealmCrossing1,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.AnywhereOverworld) ],
                author: 'Bpcooldude',
            }),

            new SongInfo({
                name: 'Spirit Realm Crossing Pt. 2',
                url: song_SpiritRealmCrossing2,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.AnywhereOverworld) ],
                author: 'Bpcooldude',
            }),

            new SongInfo({
                name: 'Spirit Realm Crossing Pt. 3',
                url: song_SpiritRealmCrossing3,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.AnywhereOverworld) ],
                author: 'Bpcooldude',
            }),

            new SongInfo({
                // This song is a cheeky nod to Volrund who returned my bronze-level items
                //  after I died to a goblin as a noob.
                name: 'Volrund the Honourable',
                url: song_VolrundTheHonourable,
                minLoopCount: 0,
                maxLoopCount: 0,

                // Give a priority of "2" in "Volrund's Land" so that Summerton/HighCove music will override it, if necessary.
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.AnywhereOverworld), new MusicRegionTag(MusicRegionName.VolrundsLand, 2) ],
                author: 'Bpcooldude',
            }),

            // anywhere underworld songs
            new SongInfo({
                name: 'Poisoned',
                url: song_Poisoned,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.AnywhereUnderworld) ],
                author: 'Bpcooldude',
            }),

            new SongInfo({
                name: 'Spaces',
                url: song_Spaces,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.AnywhereUnderworld) ],
                author: 'Bpcooldude',
            }),

            // specific city songs
            new SongInfo({
                name: 'Lively City',
                url: song_LivelyCity,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.Celadon, 1) ],
                author: 'Bpcooldude',
            }),

            new SongInfo({
                name: 'Winds of Siron',
                url: song_WindsOfSiron,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [new MusicRegionTag(MusicRegionName.HighCove, 1) ],
                author: 'Bpcooldude',
            }),

            new SongInfo({
                name: 'Marketplace',
                url: song_Marketplace,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.Banton, 1) ],
                author: 'Bpcooldude',
            }),

            new SongInfo({
                name: 'Emperor',
                url: song_Emperor,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.Hedgecastle, 1) ],
                author: 'Bpcooldude',
            }),

            new SongInfo({
                name: 'Fishin\'',
                url: song_Fishin,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.DriftwoodIsle, 1) ],
                author: 'Bpcooldude',
            }),

            new SongInfo({
                name: 'Middlefern',
                url: song_Middlefern,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.Title), new MusicRegionTag(MusicRegionName.Middlefern, 1) ],
                author: 'Heath', // author's featured title theme
            }),

            new SongInfo({
                name: 'Wildy RS Style',
                url: song_WildyRsStyle,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.Wasteland, 2) ], // should be less prioritized than wasteland songs in more specific locations, once we get them in
                author: 'Heath',
            }),

            new SongInfo({
                name: 'Ictirine',
                url: song_Ictirine,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.Ictirine, 1) ],
                author: 'Heath',
            }),

            new SongInfo({
                name: 'Up On Gnome Hill',
                url: song_UpOnGnomeHill,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.GnomeHill, 1) ],
                author: 'Heath',
            }),

            new SongInfo({
                name: 'Barbarian',
                url: song_Barbarian,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.Undercroft, 1) ],
                author: 'Heath',
            }),

            new SongInfo({
                name: 'Glock & Piano',
                url: song_GlockAndPiano,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.Title), new MusicRegionTag(MusicRegionName.Summerton, 1) ],
                author: 'dpiper125', // author's featured title theme
            }),

            new SongInfo({
                name: 'Tan Sand Man',
                url: song_TanSandMan,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.MtTan, 1) ],
                author: 'Bpcooldude'
            }),

            new SongInfo({
                name: 'Distant Horizon',
                url: song_DistantHorizon,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.AnywhereOverworld), new MusicRegionTag(MusicRegionName.WizardsTower, 1) ],
                author: 'Bpcooldude',
            }),

            new SongInfo({
                name: 'Barony',
                url: song_Barony,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.KabeAgilityCourse, 1) ],
                author: 'Bpcooldude'
            }),

            new SongInfo({
                name: 'Swampin\' Around',
                url: song_SwampinAround,
                minLoopCount: 0,
                maxLoopCount: 0,
                regionsToPlayIn: [ new MusicRegionTag(MusicRegionName.SwampAgilityCourse, 1) ],
                author: 'Bpcooldude'
            }),
            
        ];

        // Organize our songs alphabetically so that they're easy to find
        this.songs.sort((a: { name: string; }, b: { name: string; }) => a.name.localeCompare(b.name));

        this.logToPlugin(`\t<-- Exiting function ${this.initSongs.name}`);
    }

    initMusicRegions() {
        this.logToPlugin(`\t--> Entering function ${this.initMusicRegions.name}`);

        this.allMusicRegions = [
            // "Title", "AnywhereOverworld", and "AnywhereUnderworld" are special regions
            //      that can be used to play music in any location on the overworld,
            //      underworld, or title screen. They are not defined by a bounding box,
            //      but rather by their names.

            new MusicRegion({
                regionName: MusicRegionName.Title,
                regionLayer: MusicRegionLayer.Title // Special layer for the title screen
            }),

            new MusicRegion({
                regionName: MusicRegionName.AnywhereOverworld,
                regionLayer: MusicRegionLayer.Overworld
            }),

            new MusicRegion({
                regionName: MusicRegionName.AnywhereUnderworld,
                regionLayer: MusicRegionLayer.Underworld
            }),

            // Define the music regions with their bounding boxes and associated tags
            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(-407, -39),
                topRightWorldPos:   new Vector2d(-279, 72),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.Hedgecastle
            }),

            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(-7,-151),
                topRightWorldPos:   new Vector2d(104,-55),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.Middlefern // box 1
            }),
            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(104,-119),
                topRightWorldPos:   new Vector2d(120,-55),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.Middlefern // box 2
            }),

            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(152,-519),
                topRightWorldPos:   new Vector2d(520,-127),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.Wasteland // box 1
            }),
            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(104,-519),
                topRightWorldPos:   new Vector2d(152,-471),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.Wasteland // box 2
            }),

            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(-71,152),
                topRightWorldPos:   new Vector2d(104,312),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.Ictirine
            }),

            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(280,-71),
                topRightWorldPos:   new Vector2d(392,8),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.Celadon
            }),

            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(8,-39),
                topRightWorldPos:   new Vector2d(56,24),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.GnomeHill
            }),
            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(8,-39),
                topRightWorldPos:   new Vector2d(56,24),
                regionLayer:        MusicRegionLayer.Underworld,
                regionName:         MusicRegionName.GnomeHill // extra copy for gnome hill underworld
            }),

            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(-311,-423),
                topRightWorldPos:   new Vector2d(-215,-327),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.HighCove
            }),

            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(-135,-215),
                topRightWorldPos:   new Vector2d(-39,-151),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.Banton // box 1
            }),
            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(-135,-151),
                topRightWorldPos:   new Vector2d(-55,-135),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.Banton // box 2
            }),

            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(-167,-503),
                topRightWorldPos:   new Vector2d(-135,-455),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.DriftwoodIsle
            }),

            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(376,-247),
                topRightWorldPos:   new Vector2d(488,-23),
                regionLayer:        MusicRegionLayer.Underworld,
                regionName:         MusicRegionName.Undercroft // box 1
            }),
            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(424,-23),
                topRightWorldPos:   new Vector2d(488,40),
                regionLayer:        MusicRegionLayer.Underworld,
                regionName:         MusicRegionName.Undercroft // box 2
            }),

            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(-183,-359),
                topRightWorldPos:   new Vector2d(-103,-295),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.Summerton
            }),

            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(-7, 392),
                topRightWorldPos:   new Vector2d(72, 488),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.MtTan
            }),

            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(-279, -295),
                topRightWorldPos:   new Vector2d(-167, -167), // not a typo, it's actually the same number ingame
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.VolrundsLand // box 1
            }),
            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(-167, -231),
                topRightWorldPos:   new Vector2d(-103, -151),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.VolrundsLand // box 2
            }),

            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(40, 24),
                topRightWorldPos:   new Vector2d(120, 88),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.WizardsTower
            }),

            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(-23, 24),
                topRightWorldPos:   new Vector2d(0, 72),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.KabeAgilityCourse
            }),

            new MusicRegion({
                bottomLeftWorldPos: new Vector2d(168, -151),
                topRightWorldPos:   new Vector2d(216, -103),
                regionLayer:        MusicRegionLayer.Overworld,
                regionName:         MusicRegionName.SwampAgilityCourse
            }),

            // Add more regions as needed
        ]

        this.logToPlugin(`\t<-- Exiting function ${this.initMusicRegions.name}`);
    }

    /**
     * Initializes the plugin (called once on load).
     */
    init(): void {
        this.logToPlugin('Initializing Spell Sound...', LogLevel.Important);
        
        this.logToPlugin('..Initializing Spell Sound Music', LogLevel.Important);
        this.initSongs();
        this.initMusicRegions();
        
        // TODO -- plugins can no longer load on the title screen, so
        //  the HighLite team is going to implement this as part of the
        //  "enhanced login" setting.
        //
        //this.playSongByTag(MusicRegionName.Title, MusicRegionLayer.Title);
        
        this.logToPlugin('..Initializing Spell Sound Sfx', LogLevel.Important);
        this.spellSoundSfx.init();

        this.logToPlugin('Spell Sound initialized.', LogLevel.Important);
    }

    /**
     * Starts the plugin, adds styles and event listeners.
     */
    start() {
        // If not enabled, return
        if (!this.settings.enable.value) {
            return;
        }

        this.logToPlugin('Starting Spell Sound...', LogLevel.Important);
        
        this.createMasterDiv();
        this.createMusicButton();
        this.createMusicPanel('hidden');

        this.isLoggedIn = true;

        // Show the music player button
        if (this.musicButton) {
            this.musicButton.style.visibility = 'visible';
        } else {
            this.logToPlugin('Music button not found', LogLevel.Error);
        }

        this.playNextSong();

        this.spellSoundSfx.start();
        this.logToPlugin('Spell Sound started.', LogLevel.Important);
    }
    
    /**
     * We need a special version of these functions so that the click does not propagate
     * to the game itself.
     */
    private preventDefault(e: Event) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }

    /**
     * We need a special version of these functions so that the click does not propagate
     * to the game itself.
     */
    bindOnClickBlockHsMask(element: HTMLElement, callback: (e: Event) => void) {
        element.addEventListener('click', e => {
            callback(e);
            this.preventDefault(e);
        });
        element.addEventListener('pointerdown', this.preventDefault);
        element.addEventListener('pointerup', this.preventDefault);
        element.addEventListener('mousedown', this.preventDefault);
        element.addEventListener('mouseup', this.preventDefault);
    }

    createMasterDiv() {
        this.masterDiv
            = this.uiManager.createElement(
                UIManagerScope.ClientInternal
            );
    }
    
    createMusicButton() {
        this.logToPlugin(`\t--> Entering function ${this.createMusicButton.name}`);

        this.musicButton
            = this.createSimpleButton();

        this.musicButton.innerHTML = '♫';
        this.musicButton.style.fontSize = '42px';
        this.musicButton.style.fontWeight = 'bold';
        this.musicButton.style.textAlign = 'center';
        this.musicButton.style.color = '#F9F449';
        this.musicButton.classList.add('hs-menu', 'hs-game-menu');
        this.musicButton.style.width = '50px';
        this.musicButton.style.height = '50px';
        this.musicButton.style.right = '363px';
        this.musicButton.style.bottom = '7px';
        // Reset the padding because the inherited padding is messing the UI up.
        this.musicButton.style.padding = '0px';
        this.musicButton.style.backgroundSize = 'cover';
        this.musicButton.style.transition = 'filter 0.3s'; // Smooth transition for hover effect

        // Add hover effect using JavaScript
        this.musicButton.onmouseover = () => {
            this.musicButton!.style.filter = 'brightness(1.2)'; // Brighten the image
        };
        this.musicButton.onmouseout = () => {
            this.musicButton!.style.filter = 'brightness(1)'; // Reset to normal brightness
        };

        this.bindOnClickBlockHsMask(this.musicButton, () => {
            if (this.musicPlayerWindow) {
                let currentVisibility = this.musicPlayerWindow.style.visibility;
                switch (currentVisibility) {
                    case 'visible':
                        this.musicPlayerWindow.style.visibility = 'hidden';
                        // Un-scoot any other plugins that are open, like CoinCounter
                        this.musicPlayerWindow.classList.remove('hs-game-menu--opened');
                        break;
                    case 'hidden':
                        this.musicPlayerWindow.style.visibility = 'visible';

                        this.closeOtherGameMenus();

                        // Let other plugins like CoinCounter know that a 'game window'
                        //  has been opened and they need to scoot over.
                        this.musicPlayerWindow.classList.add('hs-game-menu--opened');
                        break;
                    default:
                        this.logToPlugin(`Unknown visibility state: ${currentVisibility}`, LogLevel.Error);
                }
            } else {
                this.createMusicPanel();
            }
        });

        this.logToPlugin(`\t<-- Exiting function ${this.createMusicButton.name}`);
    }

    /**
     * Closes any other game menus that are open, such as the inventory,
     *  quest list, skills list, etc.
     * 
     * Important Note: This is a bit of a hacky way to do this, as there isn't a
     *  built-in HighLite hook to do this, that I know of, as of July 21st 2025.
     * It *seems* to be stable, though.
     */
    closeOtherGameMenus() {
        const openedMenus = document.getElementsByClassName('hs-game-menu--opened');
        for (let i = 0; i < openedMenus.length; i++) {
            const menu = openedMenus[i] as HTMLElement;
            if (!menu.classList.contains('hl-spell-sound-music-panel')) {
                // !!Do not set the "Visibility" to hidden!!
                //
                // Simply removing the class will close the menu -- HighSpell
                //  itself will handle hiding the menu.
                menu.classList.remove('hs-game-menu--opened');
            }
        }
    }

    /**
     * Stops the plugin, removes event listeners and tooltip.
     */
    stop() {
        this.logToPlugin('Stopping spellsound..', LogLevel.Important);
        
        // Remove the music button from the document body
        try {
            this.masterDiv!.removeChild(this.musicButton!);
        } catch (e) {
            this.error('Error removing music button:', e);
        }

        if (this.musicPlayerWindow) {
            try {
                this.masterDiv!.removeChild(this.musicPlayerWindow);
            } catch (e) {
                this.error('Error removing music player window:', e);
            }

            this.musicPlayerWindow = null;
        }

        // Stop any currently playing song
        this.isAutoplayEnabled = false;
        if (this.currentSong) {
            try {
                this.currentSong.pause();
            } catch (e) {
                this.error('Error stopping current song:', e);
            }
            this.currentSong = null;
        }

        this.logToPlugin('..Spell Sound stopped', LogLevel.Important);
    }

    /**
     * Creates a simple button that can be clicked, adds it to the document body,
     *  and returns the button element.
     */
    createSimpleButton(): HTMLElement {
        // Create the button element
        const button = document.createElement('button');
        button.style.position = 'absolute';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.padding = '10px 20px';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.zIndex = '1000';

        //const spanIcon = document.createElement("i");
        //spanIcon.className = "iconify";
        //spanIcon.setAttribute(
        //    "data-icon",
        //    "material-symbols:mdi:music"
        //);
        //spanIcon.style.color = '#F9F449';
        //spanIcon.ariaHidden = "true";
        //spanIcon.style.marginRight = "10px";
        //spanIcon.style.width = '32px';
        //spanIcon.style.height = '32px';
        //spanIcon.style.visibility = 'visible';

        // Append the button to our parent DIV
        this.masterDiv!.appendChild(button);

        return button;
    }

    /**
     * Creates the music player panel, which contains a list of songs and allows
     *  the user to play them. Also contains info about the current song and
     *  settings for the music player.
     * @param visibility -- the visibility of the music player panel. Defaults to 'visible'.
     */
    createMusicPanel(visibility = 'visible') {
        this.logToPlugin('Creating music player panel');

        // Create the main music list window, inside of which all
        //  of the sub-elements will be created.
        this.musicPlayerWindow = document.createElement('div');
        this.musicPlayerWindow.style.position = 'fixed';
        this.musicPlayerWindow.style.bottom = '65px';
        this.musicPlayerWindow.style.right = '38px';
        this.musicPlayerWindow.style.width = '9%';
        this.musicPlayerWindow.style.height = '40%';
        this.musicPlayerWindow.style.backgroundColor = 'white';
        this.musicPlayerWindow.style.zIndex = '1000';
        this.musicPlayerWindow.style.border = '2px solid black';
        this.musicPlayerWindow.style.display = 'flex';
        this.musicPlayerWindow.style.flexDirection = 'column';
        this.musicPlayerWindow.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        this.musicPlayerWindow.style.justifyContent = 'left';
        this.musicPlayerWindow.style.alignItems = 'left';
        this.musicPlayerWindow.style.borderRadius = '10px';
        this.musicPlayerWindow.style.visibility = visibility;
        this.musicPlayerWindow.style.overflow = 'hidden'; // Prevent scrolling on the div itself
        this.musicPlayerWindow.style.padding = '10px'; // Set padding to 5px
        this.musicPlayerWindow.style.margin = '0'; // Ensure no margin is applied
        this.musicPlayerWindow.classList.add('hl-spell-sound-music-panel');

        if (visibility === 'visible'){
            // Treat this menu as a game menu when it's visible
            //  so plugins such as CoinCounter move over. Remove
            //  this class when it's no longer visible.
            this.musicPlayerWindow.classList.add('hs-game-menu--opened');
        }

        this.musicPlayerWindow.style.background = 'rgba(16, 16, 16, 0.8)';
        this.musicPlayerWindow.style.backdropFilter = 'blur(5px)';
        this.musicPlayerWindow.style.resize = 'none';
        // Disable user selection to prevent text selection
        this.musicPlayerWindow.style.userSelect = 'none';

        // Create a title for the music player
        const title = document.createElement('h2');
        title.textContent = 'Spell Sound Player';
        title.style.color = 'white';
        title.style.textAlign = 'center';
        title.style.margin = '0 0 10px 0';
        this.musicPlayerWindow.appendChild(title);

        this.createAndAddMusicSettings(this.musicPlayerWindow);

        // Create a container for the "current song" and "author" labels
        this.musicInfoContainer = document.createElement('div');
        this.musicInfoContainer.style.color = 'white';
        this.musicInfoContainer.style.marginBottom = '10px';
        this.musicInfoContainer.style.textAlign = 'center';
        this.musicPlayerWindow.appendChild(this.musicInfoContainer);

        // Create the "song name" paragraph for the label
        this.currentSongNameLabel = document.createElement('p');
        this.currentSongNameLabel.style.margin = '0';
        this.currentSongNameLabel.style.fontWeight = 'bold';
        this.currentSongNameLabel.style.color = 'yellow';
        this.currentSongNameLabel.textContent = 'Current Song:';
        this.musicInfoContainer.appendChild(this.currentSongNameLabel);

        // Create the "author" paragraph for the label
        this.currentSongAuthorLabel = document.createElement('p');
        this.currentSongAuthorLabel.style.color = 'white';
        this.currentSongAuthorLabel.style.margin = '0';
        this.currentSongAuthorLabel.textContent = 'Author:';
        this.musicInfoContainer.appendChild(this.currentSongAuthorLabel);

        // Create an inner div for the song list, and have it always
        //  display the vertical scrollbar
        const songListContainer = document.createElement('div');
        songListContainer.style.overflowY = 'scroll'; // Enable vertical scrolling
        songListContainer.style.maxHeight = 'calc(100% - 50px)'; // Adjust height to fit within the panel
        songListContainer.style.scrollbarWidth = 'auto'; // For Firefox: Ensure the scrollbar is visible
        songListContainer.style.scrollbarColor = 'lightgray darkgray'; // For Firefox: Customize scrollbar colors
        songListContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Optional: Background for better visibility
        this.musicPlayerWindow.appendChild(songListContainer);

        // Create a list to display the songs
        const songList = document.createElement('ul');
        songList.style.listStyleType = 'none';
        songList.style.padding = '0';
        songList.style.margin = '0';
        songList.style.color = 'white';
        songList.style.overflowY = 'auto';
        songList.style.flexGrow = '1'; // Allow the list to grow and fill the available space
        songList.style.maxHeight = 'calc(100% - 50px)'; // Adjust height to fit within the panel

        this.songs.forEach((song: { name: string; }, index: number) => {
            const songItem = document.createElement('li');
            songItem.textContent = `${song.name}`;
            songItem.style.cursor = 'pointer';
            songItem.style.padding = '5px';
            songItem.style.borderBottom = '1px solid #ccc';
            songItem.style.color = 'green';
            this.bindOnClickBlockHsMask(songItem, () => {
                this.playSong(index);
            });
            songItem.onmouseover = () => {
                songItem.style.backgroundColor = '#444'; // Darken the background on hover
            };
            songItem.onmouseout = () => {
                songItem.style.backgroundColor = ''; // Reset the background on mouse out
            };
            songList.appendChild(songItem);
        });
        songListContainer.appendChild(songList);

        this.masterDiv!.appendChild(this.musicPlayerWindow);
        this.logToPlugin('Music player panel created successfully');
    }

    /**
     * Creates and adds the music settings, such as the mutually-exclusive buttons
     *  to "Repeat" or "Autoplay", and the "Volume" slider, with labels towards
     *  the left side of the slider (lower volume) and right side of the slider 
     * (higher volume).
     *  then adds the settings to the music player window. The window is required
     *  as a parameter to make the temporal coupling explicitly defined.
     * @param musicPlayerWindow -- the music player window to add the settings to.
     */
    createAndAddMusicSettings(musicPlayerWindow: HTMLDivElement): void {
        this.logToPlugin('Creating music settings');

        // Create a container for the settings
        const settingsContainer = document.createElement('div');
        settingsContainer.style.display = 'flex';
        settingsContainer.style.flexDirection = 'column';
        settingsContainer.style.gap = '10px'; // Space between settings
        settingsContainer.style.marginBottom = '10px'; // Space below the settings

        // Create the autoplay toggle button
        const autoplayToggle = document.createElement('button');
        autoplayToggle.textContent = this.isAutoplayEnabled ? 'Disable Autoplay' : 'Enable Autoplay';
        autoplayToggle.style.padding = '5px 10px';
        autoplayToggle.style.backgroundColor = '#007BFF';
        autoplayToggle.style.color = '#FFFFFF';
        autoplayToggle.style.border = 'none';
        autoplayToggle.style.borderRadius = '5px';
        autoplayToggle.onclick = () => {
            this.isAutoplayEnabled = !this.isAutoplayEnabled;
            autoplayToggle.textContent = this.isAutoplayEnabled ? 'Disable Autoplay' : 'Enable Autoplay';
            
            // If autoplay is enabled, play the next song immediately. Just in case our plugin
            //  glitches and needs a "jump start" so to speak.
            if (this.isAutoplayEnabled) {
                this.playNextSong();
            }

            this.logToPlugin(`Autoplay is now ${this.isAutoplayEnabled ? 'enabled' : 'disabled'}`, LogLevel.Important);
        };
        settingsContainer.appendChild(autoplayToggle);

        // Create the repeat toggle button
        const repeatToggle = document.createElement('button');
        repeatToggle.textContent = this.currentSong && !this.currentSong.loop ? 'Enable Repeat' : 'Disable Repeat';
        repeatToggle.style.padding = '5px 10px';
        repeatToggle.style.backgroundColor = '#007BFF';
        repeatToggle.style.color = '#FFFFFF';
        repeatToggle.style.border = 'none';
        repeatToggle.style.borderRadius = '5px';
        repeatToggle.onclick = () => {
            if (this.currentSong) {
                this.currentSong.loop = !this.currentSong.loop;
                repeatToggle.textContent = this.currentSong.loop ? 'Disable Repeat' : 'Enable Repeat';
                this.logToPlugin(`Repeat is now ${this.currentSong.loop ? 'enabled' : 'disabled'}`, LogLevel.Important);
            } else {
                this.logToPlugin('No song is currently playing to toggle repeat.', LogLevel.Error);
            }
        };
        settingsContainer.appendChild(repeatToggle);

        // Create the volume slider
        const volumeLabel = document.createElement('label');
        volumeLabel.textContent = 'Volume (0% -> 100%): ';
        volumeLabel.style.color = 'white';
        
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '100';
        volumeSlider.value = '50'; // Default volume
        volumeSlider.style.width = '100%';
        volumeSlider.oninput = () => {
            const volume = parseFloat(volumeSlider.value) / 100;
            if (this.currentSong) {
                this.currentSong.volume = volume;
            }
            this.logToPlugin(`Volume set to ${volume * 100}%`, LogLevel.Important);
        };
        volumeLabel.appendChild(volumeSlider);
        settingsContainer.appendChild(volumeLabel);

        // Add the settings container to the music player window
        if (musicPlayerWindow) {
            musicPlayerWindow.appendChild(settingsContainer);
            this.logToPlugin('Music settings added successfully');
        }
        else {
            this.logToPlugin('Music player window not found when trying to add settings', LogLevel.Error);
        }
    }
    
    getSongIdFromName(songName: string): number {
        this.logToPlugin(`\t--> Entering function ${this.getSongIdFromName.name} with songName: ${songName}`);

        // Find the song in the list by name and return its index
        let songIndex = this.songs.findIndex(song => song.name.toLowerCase() === songName.toLowerCase());
        if (songIndex === -1) {
            this.logToPlugin(`Song "${songName}" not found.`, LogLevel.Error);
            songIndex = -1; // Song not found
        }

        this.logToPlugin(`\t<-- Exiting function ${this.getSongIdFromName.name} with songIndex: ${songIndex}`);
        return songIndex; // Return the index of the found song
    }

    playSongByName(songName: string): void {
        this.logToPlugin(`\t--> Entering function ${this.playSongByName.name} with songName: ${songName}`);
        
        const songIndex = this.getSongIdFromName(songName);
        if (songIndex !== -1) {
            this.playSong(songIndex);
        } else {
            this.error(`Song "${songName}" not found.`);
        }

        this.logToPlugin(`\t<-- Exiting function ${this.playSongByName.name}`);
    }
    
    playSongByTag(songTagName: MusicRegionName, layer: MusicRegionLayer): void {
        this.logToPlugin(`\t--> Entering function ${this.playSongByTag.name} with songTag: ${songTagName}`);
        
        // convert the tag into a list of valid regions
        var validRegions
                = this.allMusicRegions.filter(region =>
                    region.regionName === songTagName &&
                    region.regionLayer === layer);

        this.logToPlugin(`Valid regions for tag '${songTagName}': ${validRegions.map(r => r.regionName).join(', ')}`);

        this.playNextSong(0, validRegions);

        this.logToPlugin(`\t<-- Exiting function ${this.playSongByTag.name}`);
    }

    playSong(songIndex: number): void {
        // If a song is already playing, pause it
        if (this.currentSong) {
            this.currentSong.pause();
        }
        
        this.currentSongId = songIndex;

        // Load the new song
        const song = this.songs[songIndex];
        if (song) {
            // Maintain the volume and loop settings from the previous song.
            var doLoop = this.currentSong ? this.currentSong.loop : false;
            this.currentSong = this.soundManager.createAudioElement(song.url, this.currentSong?.volume);
            this.currentSong.loop = doLoop;
            this.currentSong.onended = () => {
                // Give a 5 second break before playing the next song
                setTimeout(() => {
                    if (this.isAutoplayEnabled === true) {
                        this.playNextSong();
                    }
                }, 5000);
            }
            this.currentSong.play().catch(error => {
                this.logToPlugin(`Error playing audio: ${error.message}`, LogLevel.Error);
            });

            // Update the music info label with the song name and author
            if (this.musicInfoContainer) {
                this.currentSongNameLabel!.textContent = `Current Song: ${song.name}`;
                this.currentSongAuthorLabel!.textContent = `Author: ${song.author}`;
            } else {
                this.logToPlugin('Music info label not found', LogLevel.Error);
            }
        } else {
            this.logToPlugin('Invalid song index', LogLevel.Error);
        }
    }

    /**
     * Called when the previous song ends, and automatically picks the next song based
     *  on player location, if the user is playing a specific song, etc.
     * 
     * Remarks: I hate how this function is implemented, but it mostly works. I'll refactor it "Some Day".
     * 
     * @param attemptCount -- how many times we've recursed trying to find a different song
     *  in this area. If this is greater than 5, then we just give up and play whatever song
     *  we can -- there might only be one song in this area, and we don't want to stack overflow.
     */
    playNextSong(attemptCount: number = 0, musicRegions? : MusicRegion[]) : void {
        this.logToPlugin(`\t--> Entering function ${this.playNextSong.name} with attemptCount: ${attemptCount}`);

        const currentPlayerPos
                = this.gameHooks.EntityManager.Instance.MainPlayer?.CurrentGamePosition;
        const currentPlayerLayer
                = this.getCurrentLayer();

        this.logToPlugin(`Current player position: ${currentPlayerPos?.X}, ${currentPlayerPos?.Z}, layer '${currentPlayerLayer}', realLayer = '${this.gameHooks.EntityManager.Instance.MainPlayer?.CurrentMapLevel ?? MusicRegionLayer.Sky}'`);

        this.validMusicRegions
                = musicRegions ?? this.findMusicRegionsForPosition(new Vector2d(currentPlayerPos.X, currentPlayerPos.Z), currentPlayerLayer);
                
        this.logToPlugin(`validMusicRegions: ${this.validMusicRegions.map(r => r.regionName).join(', ')}`);

        let matchingSongs
                = this.findSongsWithMatchingRegions(this.validMusicRegions);
        
        this.logToPlugin(`Found ${matchingSongs.length} matching songs for the current position.`);

        // add each song to the list potentially multiple times,
        //  for each region the song is valid in
        matchingSongs = matchingSongs.flatMap(song => {
            return song.regionsToPlayIn.map(regionTag => {
                // If the region tag is valid for the current position, return the song
                if (this.validMusicRegions.some(r => r.regionName === regionTag.regionName)) {
                    // The region name matches, so we want this song.
                    // Create a shallow copy with the same info except
                    //  for the region list, which contains only
                    //  the current region tag.
                    const songCopy = new SongInfo({
                        name: song.name,
                        author: song.author,
                        url: song.url,
                        minLoopCount: song.minLoopCount,
                        maxLoopCount: song.maxLoopCount,
                        regionsToPlayIn: [regionTag], // Keep only the current region tag
                    });

                    return songCopy;
                }
                return null; // Return null if the region tag does not match
            }).filter(song => song !== null); // Filter out null values
        });

        this.logToPlugin(`matchingSongs: ${matchingSongs.map(s => s.name + ' - priority ' + s.regionsToPlayIn[0].priority).join(', ')}`);

        this.logToPlugin(`sorting matchingSongs by priority, if any`);

        // Order the matching songs by priority, if any
        var validRegionNames = this.validMusicRegions.map(r => r.regionName);
        matchingSongs.sort((a, b) => {
            const aPriority = a.regionsToPlayIn.filter(r => validRegionNames.includes(r.regionName))
                                                    .reduce((min, tag) => Math.min(min, tag.priority), Infinity);
            const bPriority = b.regionsToPlayIn.filter(r => validRegionNames.includes(r.regionName))
                                                    .reduce((min, tag) => Math.min(min, tag.priority), Infinity);
            return aPriority - bPriority; // Sort by priority (lower is better)
        });

        // Songs that have an "Infinite" priority -- thus are not region-specific
        var fallbackSongs : SongInfo[] = [];

        // Group the songs into priority 'buckets'
        const priorityBuckets: { [priority: number]: SongInfo[] } = {};
        matchingSongs.forEach(song => {
            song.regionsToPlayIn.forEach(tag => {
                // Don't add the current song to the priority buckets
                if (matchingSongs.length > 1 &&
                    this.currentSong &&
                    !(song.url === this.currentSong.src)
                ) {
                    if (tag.priority === Infinity) {
                        // If the song has an "Infinite" priority, add it to the fallback songs
                        fallbackSongs.push(song);
                        this.logToPlugin(`Adding song "${song.name}" to fallback songs due to infinite priority.`);

                        // Don't add it to the priority buckets, it'll break the code.
                    }
                    else {
                        if (!priorityBuckets[tag.priority]) {
                            priorityBuckets[tag.priority] = [];
                        }
                        priorityBuckets[tag.priority].push(song);
                    }
                }
            });
        });
        this.logToPlugin(`Grouped songs into priority buckets: ${priorityBuckets}`);

        // Try choosing a song from the lowest number (highest) priority possible
        //  which isn't the song that's currently playing.
        let chosenPriority = Infinity;
        for (const priority in priorityBuckets) {
            if (priorityBuckets[priority].length > 0) {
                chosenPriority = parseInt(priority);
                matchingSongs = priorityBuckets[chosenPriority];
                break; // Stop at the first non-empty bucket
            }
        }
        this.logToPlugin(`Chosen priority: ${chosenPriority}, matchingSongs: ${matchingSongs.map(s => s.name).join(', ')}`);

        if (matchingSongs.length === 0) {
            // Give up and use the fallback songs
            this.logToPlugin(`No matching songs found for the current position. Using fallback songs.`);
            matchingSongs = fallbackSongs;
        }

        const randomIndex = Math.floor(Math.random() * matchingSongs.length);
        const newSong = matchingSongs[randomIndex];

        this.logToPlugin(`chose regional song "${newSong.name}"`);

        // If the current song is the same as the random index, try again
        if (attemptCount < 5 &&
                this.currentSong &&
                newSong.url === this.currentSong.src) {
            return this.playNextSong(attemptCount + 1);
        }

        this.playSongByName(newSong.name);
        this.logToPlugin(`\t<-- Exiting function ${this.playNextSong.name} with song: ${newSong.name}\n`);
    }

    /**
     * Finds all music regions that contain the given position, if any.
     * @param position - The position to check for music regions.
     * @param layer - The map layer to check for music regions.
     */
    findMusicRegionsForPosition(position: Vector2d, layer: MusicRegionLayer): MusicRegion[] {
        this.logToPlugin(`\t--> Entering function ${this.findMusicRegionsForPosition.name} with position: ${position}, layer: ${layer}`);

        const regions: MusicRegion[] = [];

        // Find all regions that match the given coordinate
        for (const region of this.allMusicRegions) {
            // Is this a special region without a bounding box?
            if ((region.regionName == MusicRegionName.Title
                || region.regionName == MusicRegionName.AnywhereOverworld
                || region.regionName == MusicRegionName.AnywhereUnderworld)
                && region.regionLayer === layer // Ensure the region matches the specified layer
            ) {
                // Title and Anywhere regions don't have a bounding box, so skip them
                //  when checking for position containment. We consider them valid for
                //  any position in the specified layer.
                regions.push(region);
            }
            // Else, check the bounding box
            else if (position.X >= region.bottomLeftWorldPos.X &&
                position.X <= region.topRightWorldPos.X &&
                position.Z >= region.bottomLeftWorldPos.Z &&
                position.Z <= region.topRightWorldPos.Z &&
                region.regionLayer === layer // Ensure the region matches the specified layer
            ) {
                // add the region to the list of regions. keep
                //  going as we might have several valid regions
                //  for a given point.
                regions.push(region);
            }
        }

        this.logToPlugin(`\t<-- Exiting function ${this.findMusicRegionsForPosition.name} with regions: ${regions.map(r => r.regionName).join(', ')}`);
        return regions;
    }

    getCurrentLayer(): MusicRegionLayer {
        this.logToPlugin(`\t--> Entering function ${this.getCurrentLayer.name}`);

        // The title screen doesn't have a layer, so if our map level isn't initialized, it's the title screen.
        const currentLevel = this.gameHooks.EntityManager.Instance.MainPlayer?.CurrentMapLevel ?? MusicRegionLayer.Title;
        let layer : MusicRegionLayer;

        switch (currentLevel) {
            case 0:
                layer = MusicRegionLayer.Underworld; // Underworld layer
                break;
            case 1:
                layer = MusicRegionLayer.Overworld; // Overworld layer
                break;
            case 2:
                layer = MusicRegionLayer.Sky; // Sky layer
                break;
            default:
                layer = MusicRegionLayer.Title; // Default to Title layer if unknown. It doesn't actually have a layer ingame.
                break;
        }

        this.logToPlugin(`\t<-- Exiting function ${this.getCurrentLayer.name} with layer: ${layer.toString()}`);
        return layer;
    }

    /**
     * Finds all songs whose MusicRegionTags match the given music regions.
     * @param musicRegions - An array of MusicRegion objects to match against.
     * @returns An array of SongInfo objects that match the given music regions.
     */
    findSongsWithMatchingRegions(musicRegions : MusicRegion[]) : SongInfo[] {
        const matchingSongs : SongInfo[] = [];
        const musicRegionNames : MusicRegionName[] = musicRegions.map(r => r.regionName)

        this.logToPlugin(`\t--> Entering function ${this.findSongsWithMatchingRegions.name} with musicRegions: ${musicRegions}`);

        for (const song of this.songs) {
            // Check if any of the song's regions match the predicate

            var allSongRegionNames
                    = song.regionsToPlayIn
                        .map(r => r.regionName);

            if (allSongRegionNames.some((name) => musicRegionNames.includes(name))
            ) {
                this.logToPlugin(`Song "${song.name}" matches the given music regions.`);
                matchingSongs.push(song);
            }
        }
        
        this.logToPlugin(`Found ${matchingSongs.length} matching songs for the given music regions.`);
        this.logToPlugin(`Returning ${matchingSongs}`);
        this.logToPlugin(`\t<-- Exiting function ${this.findSongsWithMatchingRegions.name}`);
        return matchingSongs;
    }

    // Logged Out
    SocketManager_handleLoggedOut(): void {
        this.logToPlugin(`\t--> Entering function ${this.SocketManager_handleLoggedOut.name}`);
        this.isLoggedIn = false;

        // Don't play any music except for the title music on the
        //  title screen
        this.isAutoPlayEnabled = false;

        this.playSongByName('Sound Main'); // Play the title music

        this.logToPlugin(`\t<-- Exiting function ${this.SocketManager_handleLoggedOut.name}`);
    }

    GameLoop_update(): void {
        if (!this.settings.enable!.value) {
            return;
        }
        
        // Call our submodule's update event, too.
        this.spellSoundSfx.GameLoop_update();

        // See if there is a UI element with the class 'hs-game-menu--opened' which
        //  does not *also* have the class 'hl-spell-sound-music-panel' (our music
        //  player window).
        // If there's another menu opened without that class, then hide the music
        //  player window -- another icon like 'Inventory' was probably clicked.
        if (this.musicPlayerWindow && this.musicPlayerWindow.style.visibility === 'visible') {
            const openedMenus = document.getElementsByClassName('hs-game-menu--opened');
            for (let i = 0; i < openedMenus.length; i++) {
                const menu = openedMenus[i] as HTMLElement;
                if (!menu.classList.contains('hl-spell-sound-music-panel')) {
                    this.musicPlayerWindow.style.visibility = 'hidden';
                    this.musicPlayerWindow.classList.remove('hs-game-menu--opened');
                    break;
                }
            }
        }

        if (!this.gameHooks.EntityManager.Instance.MainPlayer
                ?.CurrentGamePosition
            || this.isAutoplayEnabled == false) {
            return;
        }

        // Check if the player has moved since the last time we checked
        const currentTimestamp = Date.now();
        if (currentTimestamp - this.lastCoordCheckTimestamp < 5000) {
            return; // Don't check coordinates more than once per five seconds
        }

        this.lastCoordCheckTimestamp = currentTimestamp;
        
        const playerMapPos =
            this.gameHooks.EntityManager.Instance.MainPlayer
                .CurrentGamePosition;

        if (this.previousPosition == null) {
            this.previousPosition = new Vector2d( playerMapPos.X, playerMapPos.Z );
        }

        // If we've moved, then perform the expensive 
        //  check to see if we're in a different music region.
        if (!(playerMapPos.X == this.previousPosition.X &&
              playerMapPos.Z == this.previousPosition.Z)
        ) {
            var playerMapLayer = this.getCurrentLayer();

            // Find all music regions that contain the player's position
            var currentMusicRegions
                = this.findMusicRegionsForPosition(new Vector2d(playerMapPos.X, playerMapPos.Z), playerMapLayer);

            // Are we in a different position, but in the same regions?
            var isInSameRegion =
                currentMusicRegions.every(
                    tag => currentMusicRegions.map(r => r.regionName)
                                              .includes(tag.regionName));

            if (!isInSameRegion) {
                // Is this song still valid to play in the current region we're in?
                var currentSongMetadata = this.songs[this.currentSongId];
                var isSongStillInTag = currentMusicRegions.some(region =>
                    currentSongMetadata.regionsToPlayIn.some(
                        tag => tag.regionName === region.regionName
                    )
                );

                this.logToPlugin(`\n====\nPlayer moved to position: ${playerMapPos.X}, ${playerMapPos.Z}, layer '${playerMapLayer}'`);
                this.logToPlugin(`Is current song "${currentSongMetadata.name}" still valid in the current region? '${isSongStillInTag}'`);

                // Is there a song with a higher priority now?
                let areThereHigherPrioritySongs : boolean = false;
                const currentRegionTags = this.songs[this.currentSongId].regionsToPlayIn;

                // Check if there are any songs with a higher priority in the current music regions
                for (const region of currentMusicRegions) {
                    for (const song of this.songs) {
                        if (song.regionsToPlayIn.some(tag =>
                                tag.regionName === region.regionName &&
                                tag.priority < (currentRegionTags.filter(r => r.regionName === tag.regionName)[0]?.priority ?? Infinity)
                        )) {
                            areThereHigherPrioritySongs = true;
                            break;
                        }
                    }

                    if (areThereHigherPrioritySongs) {
                        // No need to check further if we found a higher priority song.
                        //  PlayNextSong will figure out which song is highest
                        //  priority and play it.
                        break;
                    }
                }
                
                this.logToPlugin(`Are there higher priority songs in the current region? '${areThereHigherPrioritySongs}'`);

                if ((!isSongStillInTag) || areThereHigherPrioritySongs) {
                    // We're in a new music region that doesn't match the old music, so update the current music regions.
                    this.logToPlugin(`====\n\tPrevious tags were: ${this.validMusicRegions.map(r => r.regionName).join(', ')}\n\tPlayer moved to a new music region with these tags: ${currentMusicRegions.map(r => r.regionName).join(', ')}`, LogLevel.Important);

                    // Play the next song based on the new music regions
                    this.playNextSong();
                }
            }

            this.previousPosition = new Vector2d( playerMapPos.X, playerMapPos.Z );
        }
    }
}
