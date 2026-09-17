import { Enemy } from "./Enemy.js";
import { ENEMY_TYPE_2_CONFIG } from "../config/enemies.config.js";

export class EnemyType2 extends Enemy {
  constructor(spawnConfig) {
    super(ENEMY_TYPE_2_CONFIG, spawnConfig);
    this.type = "enemy-2";
  }
}