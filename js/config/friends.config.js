/**
 * Конфигурация всех 12 типов Friend.
 * У Friend НЕТ damage-звука; есть только один spawn-звук.
 * Соглашения по структуре совпадают с enemies.config.js.
 *
 * Механика появления:
 *  - На каждом уровне (1–5) при нормальном входе выполняется один roll.
 *    С вероятностью FRIEND_RANDOM_SPAWN.chance появляется ровно один Friend.
 *  - Максимум один Friend helper на уровень.
 *  - Результат roll-а кэшируется LevelManager-ом и переиспользуется при restart
 *    того же уровня, чтобы layout не менялся.
 *  - Если на Level 5 helper уже появился, FinaleController НЕ создаёт дубликат
 *    этого типа — 12 уникальных типов присутствуют в финале ровно по одному.
 */

export const FRIEND_BASE_CONFIG = {
  size: { width: 64, height: 96 },
  health: { max: 1 },
  movement: {
    speed: 180,
    jumpVelocity: -700,
    stompBounceVelocity: -420
  }
};

export const FRIEND_RANDOM_SPAWN = Object.freeze({
  chance: 0.40,
  disabledLevelIds: []
});

function buildFriendConfig(n, nickname) {
  return {
    type: `friend-${n}`,
    nickname,
    size: { ...FRIEND_BASE_CONFIG.size },
    health: { ...FRIEND_BASE_CONFIG.health },
    movement: { ...FRIEND_BASE_CONFIG.movement },
    appearance: {
      headTexture: `./assets/images/friends/type${n}/head.png`,
      bodyTexture: `./assets/images/friends/type${n}/body.png`
    },
    audio: {
      spawn: `./assets/audio/friends/friend-${n}/extra.mp3`
    }
  };
}

export const FRIEND_TYPE_1_CONFIG = buildFriendConfig(1, "Вита");
export const FRIEND_TYPE_2_CONFIG = buildFriendConfig(2, "Иван");
export const FRIEND_TYPE_3_CONFIG = buildFriendConfig(3, "Тина");
export const FRIEND_TYPE_4_CONFIG = buildFriendConfig(4, "Полина");
export const FRIEND_TYPE_5_CONFIG = buildFriendConfig(5, "Марина");
export const FRIEND_TYPE_6_CONFIG = buildFriendConfig(6, "Настя");
export const FRIEND_TYPE_7_CONFIG = buildFriendConfig(7, "Настя");
export const FRIEND_TYPE_8_CONFIG = buildFriendConfig(8, "Алиса");
export const FRIEND_TYPE_9_CONFIG = buildFriendConfig(9, "9мышей");
export const FRIEND_TYPE_10_CONFIG = buildFriendConfig(10, "Кай Ангел");
export const FRIEND_TYPE_11_CONFIG = buildFriendConfig(11, "Кира");
export const FRIEND_TYPE_12_CONFIG = buildFriendConfig(12, "L");

export const FRIEND_CONFIG_BY_TYPE = Object.freeze({
  "friend-1": FRIEND_TYPE_1_CONFIG,
  "friend-2": FRIEND_TYPE_2_CONFIG,
  "friend-3": FRIEND_TYPE_3_CONFIG,
  "friend-4": FRIEND_TYPE_4_CONFIG,
  "friend-5": FRIEND_TYPE_5_CONFIG,
  "friend-6": FRIEND_TYPE_6_CONFIG,
  "friend-7": FRIEND_TYPE_7_CONFIG,
  "friend-8": FRIEND_TYPE_8_CONFIG,
  "friend-9": FRIEND_TYPE_9_CONFIG,
  "friend-10": FRIEND_TYPE_10_CONFIG,
  "friend-11": FRIEND_TYPE_11_CONFIG,
  "friend-12": FRIEND_TYPE_12_CONFIG
});

export const FRIEND_TYPES_ORDERED = Object.freeze([
  "friend-1", "friend-2", "friend-3", "friend-4",
  "friend-5", "friend-6", "friend-7", "friend-8",
  "friend-9", "friend-10", "friend-11", "friend-12"
]);