const baseAttackPower = [5, 5, 30, 50];
const baseAttackCost = [0, 10, 20, 40];
const effectList = ["overpump","underpump","underfill","overfill","autodrain","autofill","accelerate","decelerate"];
const areaList = [];
const enemyList = [];

var areaIdCount = 0;
class Area {
	constructor(name, spawnType, spawnRate) {
		this.name = name;
		this.spawnType = spawnType;
		this.spawnRate = spawnRate;
		areaList[areaIdCount] = this;
		areaIdCount++;
	}
}
new Area("Obligatory Safe Zone", [0], Infinity);
new Area("Weak Area", [1], 4000);

var enemyIdCount = 0;
class Enemy {
	constructor(name, maxHP, str, def, cooldown, xp, effType = [], effChance = [], effSelf = [], effSelfChance = [], special = function(){}) {
		this.name = name;
		this.maxHP = maxHP;
		this.str = str;
		this.def = def;
		this.cooldown = cooldown;
		this.effType = effType;
		this.effChance = effChance;
		this.effSelf = effSelf;
		this.effSelfChance = effSelfChance;
		this.special = special;
		enemyList[enemyIdCount] = this;
		enemyIdCount++;
	}
}
new Enemy("Nothing", Infinity, 0, 0, Infinity, 0);
new Enemy("test", 100, 5, 0, 3000, 1);
function getPlayerLevel() {
	let lvl = 1 + Math.floor(Math.sqrt(game.battle.xp / 5));
	return lvl;
}
function getPlayerStrength() {
	let player = game.battle.player;
	let str = Math.sqrt(getPlayerLevel()) * (1 + 0.2*(player.effLevel[0]-player.effLevel[1]));
	return str;
}
function getPlayerDefense() {
	let player = game.battle.player;
	let def = Math.sqrt(getPlayerLevel()) * (1 + 0.2*(player.effLevel[2]-player.effLevel[3]));
	return def;
}
function getPlayerMaxHP() {
	let maxHP = 80 + 20 * getPlayerLevel();
	return maxHP;
}
function getPlayerMaxSP() {
	let maxSP = 45 + 5 * getPlayerLevel();
	return maxSP;
}
function getPlayerDamage(power) {
	let enemy = enemyList[game.battle.currentEnemy];
	let dmg = Math.floor(power * getPlayerStrength()) - enemy.def;
	return dmg;
}
function getEnemyDamage() {
	let enemy = enemyList[game.battle.currentEnemy];
	let dmg = Math.floor(enemy.str) - getPlayerDefense();
	return dmg;
}
function getAttackCost(type) {
	let cost = baseAttackCost[type];
	return cost;
}
function playerAttack(type) {
	let player = game.battle.player;
	let enemy = game.battle.enemy;
	if (player.sf >= getAttackCost(type)) {
		player.sf -= getAttackCost(type);
		enemy.hp -= getPlayerDamage(baseAttackPower[type]);
		if (type == 1) {
			enemy.hp -= getPlayerDamage(baseAttackPower[type]);
			enemy.hp -= getPlayerDamage(baseAttackPower[type]);
		}
		if (enemy.hp <= 0) {
			enemyDeath(true);
		}
		updateBattle();
	}
}
function enemyAttack() {
	let player = game.battle.player;
	let enemy = game.battle.enemy;
	enemy.cooldown = enemyList[game.battle.currentEnemy].cooldown;
	player.hp -= getEnemyDamage();
	if (player.hp <= 0) {
		game.battle.currentEnemy = 0;
		game.battle.currentArea = 0;
	}
	updateBattle();
}
function enemyDeath(xp == false) {
	game.battle.currentEnemy = 0;
	game.battle.enemy.hp = Infinity;
	game.battle.enemy.cooldown = Infinity;
	game.battle.enemy.effLevel = [0,0,0,0,0,0,0,0];
	game.battle.enemy.effDuration = [0,0,0,0,0,0,0,0];
	if (xp) game.battle.xp += enemyList[game.battle.currentEnemy].xp;
}
function switchArea(dir) {
	switch (dir) {
		case "left":
			if (game.battle.currentArea > 0) {
				game.battle.currentArea--;
				enemyDeath()
				game.battle.nextSpawn = areaList[game.battle.currentArea].spawnRate;
				updateBattle();
			}
			break;
		case "right":
			if (game.battle.currentArea < areaList.length - 1) {
				game.battle.currentArea++;
				enemyDeath()
				game.battle.nextSpawn = areaList[game.battle.currentArea].spawnRate;
				updateBattle();
			}
			break;
	}
}
