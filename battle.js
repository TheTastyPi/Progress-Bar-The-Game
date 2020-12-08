const baseAttackPower = [5, 5, 30, 50];
const baseAttackCost = [0, 10, 20, 40];
const baseAttackCooldown = [1000, 2000, 4000, 10000];
const effectList = ["overpump","underpump","underfill","overfill","autodrain","autofill","accelerate","decelerate"];
const areaList = [];
const enemyList = [];
const itemList = [];
const itemGroupList = ["weapon","armor","healing"];
const itemTypeList = [
	["bucket","gun","cannon"],
	["top","body","bottom"],
	["instant","gradual"]
]

var areaIdCount = 0;
class Area {
	constructor(name, spawnType, spawnRate) {
		this.name = name;
		this.spawnType = spawnType;
		this.spawnRate = spawnRate;
		this.id = areaIdCount;
		areaList[areaIdCount] = this;
		areaIdCount++;
	}
}
new Area("Obligatory Safe Zone", [0], Infinity);
new Area("Weak Area", [1,1,2,3], 4000);

var enemyIdCount = 0;
class Enemy {
	constructor(name, maxHP, str, def, cooldown, reward, effType = [], effChance = [], effSelf = [], effSelfChance = [], special = function(){}) {
		this.name = name;
		this.maxHP = maxHP;
		this.str = str;
		this.def = def;
		this.cooldown = cooldown;
		this.reward = reward;
		this.effType = effType;
		this.effChance = effChance;
		this.effSelf = effSelf;
		this.effSelfChance = effSelfChance;
		this.special = special;
		this.id = enemyIdCount;
		enemyList[enemyIdCount] = this;
		enemyIdCount++;
	}
}
new Enemy("Nothing", Infinity, 0, 0, Infinity, 0);
new Enemy("A very weak enemy", 25, 5, 0, 3000, 1);
new Enemy("A slightly stronger enemy", 75, 10, 0, 3000, 5);
new Enemy("A very effective training dummy", 100, 10, 0, Infinity, 10);

var itemIdCount = 0;
class Item {
	constructor(name, type, modifiersLeft, p0 = 0, p1 = 0, p2 = 0, p3 = 0, p4 = 0, p5 = 0, p6 = 0, p7 = 0) {
		this.name = name;
		this.type = type;
		if (type[0] <= 1) {
			this.modifiersLeft = modifiersLeft;
			this.maxHP = p0;
			this.maxSP = p1;
			this.str = p2;
			this.def = p3;
			this.critRate = p4;
			this.critMult = p5;
			this.HPRegen = p6;
			this.SPRegen = p7;
		}
		if (type[0] = 2) {
			this.HPGain = p0;
			this.baseCooldown = p1;
			this.cooldown = 0;
		}
		this.id = itemIdCount;
		itemList[itemIdCount] = this;
		itemIdCount++;
	}
}
// weapons&armors: (name,type=[0||1,n],modifiersLeft,maxHP,maxSP,str,def,critRate,critMult,HPRegen,SPRegen)
// weapons
new Item("Unnamed Weapon", [0,0], 10, 10, 5, 0, 15, 0.01, 0.5);

// armors
itemIdCount = 1000; // just in case
new Item("Unnamed Body", [1,1], 10, 10, 5, 0, 15, 0.01, 0.5);

// healing: (name,type=[2,n],modifiersLeft,HPGain,cooldown)
// healing
itemIdCount = 2000; // jUsT iN cAsE
new Item("Healing Stone", [2,0], 0, 25, 5000);

function getPlayerLevel() {
	let lvl = 1 + Math.floor(Math.sqrt(game.battle.xp / 5));
	return lvl;
}
function getPlayerMaxHP() {
	let maxHP = 80 + 20 * getPlayerLevel();
	return maxHP;
}
function getPlayerMaxSP() {
	let maxSP = 45 + 5 * getPlayerLevel();
	return maxSP;
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
function getPlayerCritRate() {
	let rate = 0.01;
	return rate;
}
function getPlayerCritMult() {
	let mult = 2;
	return mult;
}
function getPlayerHPRegen() {
	let regen = 2;
	return regen;
}
function getPlayerSPRegen() {
	let regen = 0.5;
	return regen;
}
function getPlayerLPDropRate() {
	let rate = 0.1;
	return rate;
}
function getPlayerDamage(power) {
	let enemy = enemyList[game.battle.currentEnemy];
	let dmg = Math.floor(power * getPlayerStrength()) - enemy.def;
	if (Math.random < getPlayerCritRate()) dmg = dmg * getPlayerCritMult();
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
	if (player.sp >= getAttackCost(type) && player.cooldown[type] == 0) {
		player.sp -= getAttackCost(type);
		enemy.hp -= getPlayerDamage(baseAttackPower[type]);
		if (type == 1) {
			enemy.hp -= getPlayerDamage(baseAttackPower[type]);
			enemy.hp -= getPlayerDamage(baseAttackPower[type]);
		}
		if (enemy.hp <= 0) {
			enemyDeath(true);
		}
		player.cooldown[type] = baseAttackCooldown[type];
	}
}
function enemyAttack() {
	let player = game.battle.player;
	let enemy = game.battle.enemy;
	enemy.cooldown = enemyList[game.battle.currentEnemy].cooldown;
	player.hp -= getEnemyDamage();
	if (player.hp <= 0) {
		player.hp = 0;
		game.battle.currentEnemy = 0;
		game.battle.currentArea = 0;
		game.battle.xp = Math.pow(getPlayerLevel()-1,2) * 5;
	}
}
function enemyDeath(reward = false) {
	if (reward) {
		game.battle.xp += enemyList[game.battle.currentEnemy].reward;
		game.battle.fragments += enemyList[game.battle.currentEnemy].reward * (0.5+Math.random);
		if (Math.random < getPlayerLPDropRate()) {
			game.points[1] += enemyList[game.battle.currentEnemy].reward;
			game.lifetimePoints[1] += enemyList[game.battle.currentEnemy].reward;
		}
		updateBattleStat();
	}
	game.battle.currentEnemy = 0;
	game.battle.enemy.hp = Infinity;
	game.battle.enemy.cooldown = Infinity;
	game.battle.enemy.effLevel = [0,0,0,0,0,0,0,0];
	game.battle.enemy.effDuration = [0,0,0,0,0,0,0,0];
}
function switchArea(dir) {
	switch (dir) {
		case "left":
			if (game.battle.currentArea > 0) {
				game.battle.currentArea--;
				enemyDeath()
				game.battle.nextSpawn = areaList[game.battle.currentArea].spawnRate;
			}
			break;
		case "right":
			if (game.battle.currentArea < areaList.length - 1) {
				game.battle.currentArea++;
				enemyDeath()
				game.battle.nextSpawn = areaList[game.battle.currentArea].spawnRate;
			}
			break;
	}
}

function selectInvSpace(n) {
	if (n != game.battle.invSelected) {
		if (game.battle.invSelected != undefined) id("battleInvSpace"+game.battle.invSelected).classList.remove("invSelected");	
		id("battleInvSpace"+n).classList.add("invSelected");
		game.battle.invSelected = n;
	} else {
		id("battleInvSpace"+n).classList.remove("invSelected");
		game.battle.invSelected = undefined;
	}
}

function switchItem(first, second) {
	let temp = game.battle.inventory[first]
	game.battle.inventory[first] = game.battle.inventory[second];
	game.battle.inventory[second] = temp;
	selectInvSpace(second);
	updateBattleInv();
}

function useItem(invId) {
	let player = game.battle.player;
	let item = game.battle.inventory[invId];
	let type = item.type;
	switch (type[0]) {
		case 0:
		case 1:
			if (invId < 36) {
				if (type[0] == 1) {
					switchItem(invId,type[1]+36);
				} else {
					switchItem(invId,39);
				}
			} else {
				if (game.battle.inventory.includes(0)) {
					for (let i in game.battle.inventory) {
						if (i == 0) {
							switchItem(invId,i);
							break;
						}
					}
				}
			}
			break;
		case 2:
			if (item.cooldown <= 0) {
				player.hp += item.HPGain;
				if (player.hp > getPlayerMaxHP()) player.hp = getPlayerMaxHP();
				item.cooldown = item.baseCooldown;
			}
			break;
	}
}

var invFullNotified = false;
function giveItem(itemId) {
	if (game.battle.inventory.includes(0)) {
		for (let i in game.battle.inventory) {
			if (i == 0) {
				game.battle.inventory[i] = itemList[itemId];
				break;
			}
		}
		invFullNotified = false;
		updateBattleInv();
	} else {
		if (!invFullNotified) {
			notify("Inventory full. Deleting excess items.");
			invFullNotified = true;
		}
	}
}
