import { Enemy } from "./Enemy.js";
import { ENEMY_TYPE_3_CONFIG } from "../config/enemies.config.js";

export class EnemyType3 extends Enemy {
  constructor(spawnConfig) {
    super(ENEMY_TYPE_3_CONFIG, spawnConfig);
    this.type = "enemy-3";
  }
}