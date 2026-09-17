/**
 * Конфигурация всех 8 типов Friend.
 * У Friend НЕТ damage-звука; есть только один spawn-звук.
 * Соглашения по структуре совпадают с enemies.config.js.
 */

export const FRIEND_BASE_CONFIG = {
  size: { width: 64, height: 96 },
  health: { max: 1 },
  movement: { speed: 180 },
  combat: {
    damage: 0.5,
    attackCooldownMs: 600
  }
};

function buildFriendConfig(n, nickname) {
  return {
    type: `friend-${n}`,
    nickname,
    size: { ...FRIEND_BASE_CONFIG.size },
    health: { ...FRIEND_BASE_CONFIG.health },
    movement: { ...FRIEND_BASE_CONFIG.movement },
    combat: { ...FRIEND_BASE_CONFIG.combat },
    appearance: {
      headTexture: `./assets/images/friends/type-${n}/head.webp`,
      bodyTexture: `./assets/images/friends/type-${n}/body.webp`
    },
    audio: {
      spawn: `./assets/audio/friends/type-${n}/spawn.mp3`
    }
  };
}

export const FRIEND_TYPE_1_CONFIG = buildFriendConfig(1, "Друг 1");
export const FRIEND_TYPE_2_CONFIG = buildFriendConfig(2, "Друг 2");
export const FRIEND_TYPE_3_CONFIG = buildFriendConfig(3, "Друг 3");
export const FRIEND_TYPE_4_CONFIG = buildFriendConfig(4, "Друг 4");
export const FRIEND_TYPE_5_CONFIG = buildFriendConfig(5, "Друг 5");
export const FRIEND_TYPE_6_CONFIG = buildFriendConfig(6, "Друг 6");
export const FRIEND_TYPE_7_CONFIG = buildFriendConfig(7, "Друг 7");
export const FRIEND_TYPE_8_CONFIG = buildFriendConfig(8, "Друг 8");

export const FRIEND_CONFIG_BY_TYPE = Object.freeze({
  "friend-1": FRIEND_TYPE_1_CONFIG,
  "friend-2": FRIEND_TYPE_2_CONFIG,
  "friend-3": FRIEND_TYPE_3_CONFIG,
  "friend-4": FRIEND_TYPE_4_CONFIG,
  "friend-5": FRIEND_TYPE_5_CONFIG,
  "friend-6": FRIEND_TYPE_6_CONFIG,
  "friend-7": FRIEND_TYPE_7_CONFIG,
  "friend-8": FRIEND_TYPE_8_CONFIG
});

export const FRIEND_TYPES_ORDERED = Object.freeze([
  "friend-1", "friend-2", "friend-3", "friend-4",
  "friend-5", "friend-6", "friend-7", "friend-8"
]);