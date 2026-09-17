import { Enemy } from "./Enemy.js";
import { ENEMY_TYPE_1_CONFIG } from "../config/enemies.config.js";

export class EnemyType1 extends Enemy {
  constructor(spawnConfig) {
    super(ENEMY_TYPE_1_CONFIG, spawnConfig);
    this.type = "enemy-1";
  }
}