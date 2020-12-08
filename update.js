function updateAll() {
	id("autoSaveToggleButton").innerHTML = game.doAutoSave ? "Auto Save<br>ON" : "Auto Save<br>OFF";
	document.querySelectorAll("*").forEach(function(node) {node.classList.add(game.currentTheme);});
	id("switchScreenRight").classList[currentScreen == getScreenLimit() ? "add" : "remove"]("disabled");
	id("switchScreenLeft").classList[currentScreen == 0 ? "add" : "remove"]("disabled");
	for (let i = 0; i < 6; i++) {
		id("autoToggle"+i).innerHTML = game.auto.isOn[i] ? "ON" : "OFF";
	}
	if (game.battle.invSelected != undefined) id("battleInvSpace"+game.battle.invSelected).classList.add("invSelected");
	updateProgress();
	updatePoints(0);
	updatePoints(1);
	updateUpg();
	updateSkills();
	updateSineGraph();
	updateBoostBar();
	updateAuto();
	updateAchievements();
	updateBattleMain();
	updateBattleStat();
	updateBattleInv();
}

function updateProgress() {
	for (let i = 0; i < 2; i++) {
		if (isNaN(game.progress[i])) game.progress[i] = Infinity;
		if (isNaN(game.lifetimeProgress[i])) game.lifetimeProgress[i] = Infinity;
		id("progressBar"+i).value = game.progress[i] != Infinity ? game.progress[i] : 1.79e308;
		id("progressBarLabel"+i).innerHTML = format((game.progress[i] / getBarLength(i) * 100), 4) + "%";
		id("redeemButton"+i).classList[game.lifetimeProgress[i] >= getBarLength(i) ? "remove" : "add"]("hidden");
		id("redeemButton"+i).classList[game.progress[i] >= getBarLength(i) ? "remove" : "add"]("disabled");
		id("redeemButton"+i).innerHTML = "Redeem<br>"+format(getPointGain(i))+"<br>point"+pluralCheck(getPointGain(i));
	}
	id("switchScreenLeft").classList[game.lifetimeProgress[1] >= getBarLength(1)/100 ? "remove" : "add"]("hidden");
	id("switchScreenRight").classList[game.lifetimeProgress[1] >= getBarLength(1)/100 ? "remove" : "add"]("hidden");
	id("switchScreenHotkey").classList[game.lifetimeProgress[1] >= getBarLength(1)/100 ? "remove" : "add"]("hidden");
	game.progress[1] = Math.log10(game.progress[0]/getBarLength(0) + 1 == Infinity ? 1.79e308 : game.progress[0]/getBarLength(0) + 1);
	if (game.progress[1] > game.lifetimeProgress[1]) game.lifetimeProgress[1] = game.progress[1];
	id("timePlayed").innerHTML = formatTime(game.timePlayed);
	if (game.progress[0] / getBarLength(0) >= 10) giveAchievement("k");
	if (game.progress[0] / getBarLength(0) >= 1e4) giveAchievement("kk");
	if (game.progress[0] / getBarLength(0) >= 1e10) giveAchievement("kkkk");
	if (game.progress[0] / getBarLength(0) >= 1e48) giveAchievement("goingFast");
	if (game.progress[0] == Infinity) giveAchievement("somethingBreak");
}

function updatePoints(n) {
	switch(n) {
		case 0:
			if (game.points[0] == -Infinity || game.upgrade.skill[1]) giveAchievement("wrongWay");
			if (isNaN(game.points[0]) || game.points[0] == -Infinity || typeof(game.points[0]) != "number") game.points[0] = 0;
			if (isNaN(game.lifetimePoints[0]) || game.lifetimePoints[0] == -Infinity || typeof(game.lifetimePoints[0]) != "number") game.lifetimePoints[0] = Infinity;
			id("pointDisplay0").innerHTML = "You have "+format(game.points[0])+" progress point"+pluralCheck(game.points[0])+".";
			id("pointDisplay0").classList[game.lifetimePoints[0] >= 1 ? "remove" : "add"]("hidden");
			id("themeMenuOpen").classList[game.lifetimePoints[0] >= 1 ? "remove" : "add"]("hidden");
			id("saveMenuOpen").classList[game.lifetimePoints[0] >= 1 ? "remove" : "add"]("hidden");
			id("upgMenuOpen").classList[game.lifetimePoints[0] >= 1 ? "remove" : "add"]("hidden");
			id("statsMenuOpen").classList[game.lifetimePoints[0] >= 1 ? "remove" : "add"]("hidden");
			id("totalPP").innerHTML = format(game.lifetimePoints[0],0);
			id("lowestPP").innerHTML = format(game.lowestPP,0);
			if (game.points[0] >= 1) giveAchievement("justABar");
			break;
		case 1:
			if (isNaN(game.points[1]) || game.points[1] == -Infinity || typeof(game.points[0]) != "number") game.points[1] = 0;
			id("pointDisplay1").innerHTML = "You have "+format(game.points[1])+" logress point"+pluralCheck(game.points[1])+".";
			id("pointDisplay1").classList[game.lifetimePoints[1] >= 1 ? "remove" : "add"]("hidden");
			id("logStat").classList[game.lifetimePoints[1] >= 1 ? "remove" : "add"]("hidden");
			id("logHotkey").classList[game.lifetimePoints[1] >= 1 ? "remove" : "add"]("hidden");
			id("totalLP").innerHTML = format(game.lifetimePoints[1],0);
			id("fastestLP").innerHTML = game.fastestLP == Infinity ? "Infinity" : formatTime(game.fastestLP);
			id("logBoost").classList[game.lifetimePoints[1] >= 1 ? "remove" : "add"]("hidden");
			id("logBoostPoints").innerHTML = game.lifetimePoints[1]+" logress point"+pluralCheck(game.lifetimePoints[1]);
			let logBoostLimit = [5,10,5,20,5,4];
			let logBoostReq = [1,2,4,5,10,50];
			for (let i = 0; i < 6; i++) {
				let level = Math.min(Math.floor(game.lifetimePoints[1] / logBoostReq[i]), logBoostLimit[i]);
				id("logBoostDisp"+i).classList[game.lifetimePoints[1] >= logBoostReq[i] ? "remove" : "add"]("disabledUpg");
				id("logBoostAmount"+i).innerHTML = level + "/" + logBoostLimit[i] + " | " + (level == logBoostLimit[i] ? "N/A" : logBoostReq[i] - game.lifetimePoints[1] % logBoostReq[i]);
				let currentBoost;
				switch(i) {
					case 0:
						currentBoost = "-" + level * 10 + "%";
						break;
					case 1:
						currentBoost = "-" + level * 5 + "%";
						break;
					case 2:
						currentBoost = "+" + level * 10 + "%";
						break;
					case 3:
						currentBoost = "-" + level * 6 + "s";
						break;
					case 4:
						currentBoost = "+" + level + "%/point";
						break;
					case 5:
						currentBoost = "+" + level * 100 + "%";
				}
				id("logBoostEffect"+i).innerHTML = currentBoost;
			}
			for (let i = 0; i < 4; i++) {
				id("skillCooldown"+i).innerHTML = skill.cooldown[i] / 60 / 1000 - 0.1 * Math.min(Math.floor(game.lifetimePoints[1] / 5), 20);
			}
			if (game.lifetimePoints[1] >= 5) giveAchievement("theseAreLogBoosts");
			if (game.lifetimePoints[1] >= 50) giveAchievement("runes");
			if (game.lifetimePoints[1] >= 200) giveAchievement("feelBoosted");
	}
}

function updateUpg() {
	for (let type of upgrade.list) {
		for (let i = 0; i < 8; i++) {
			let newDesc = (game.upgrade[type][i] != Infinity ? "Cost: "+format(Math.floor(getUpgPrice(i, type)))+" "+(upgrade[type].type[i]==0?"Pr":"L")+"ogress Point"+pluralCheck(getUpgPrice(i, type)) : "Maxed Out")+"<br>Currently: ";
			switch(type) {
				case "normal":
					switch(i) {
						case 0:
							newDesc += "/" + format(Math.pow(2, game.upgrade.normal[i]));
							break;
						case 1:
						case 2:
							newDesc += format(Math.pow(2, game.upgrade.normal[i])) + "x";
							break;
						case 3:
							newDesc += format(1 + game.upgrade.normal[i] * 2) + "&radic;";
							break;
						case 4:
							newDesc += format(game.upgrade.normal[i]) + " Skill" + pluralCheck(game.upgrade.normal[i]);
							break;
						case 5:
						case 6:
						case 7:
							newDesc += (game.upgrade.normal[i]?"Unlocked":"Locked");
					}
					break;
				case "skill":
					switch(i) {
						case 0:
						case 2:
							newDesc += "^" + format(0.5 * game.upgrade.skill[i] + 1, 1);
							break;
						case 4:
							newDesc += "x" + format(game.upgrade.skill[i] + 1, 0);
							break
						case 6:
							newDesc += formatTime(120*1000 - 10*1000*game.upgrade.skill[6],false);
							break;
						case 1:
						case 3:
						case 5:
						case 7:
							newDesc += (game.upgrade.skill[i]?"Unlocked":"Locked");
					}
					break;
				case "auto":
					switch(i) {
						case 0:
						case 1:
						case 2:
						case 3:
						case 4:
						case 5:
							if (game.upgrade.auto[i] == 0) {
								newDesc += "Locked";
							} else {
								newDesc += formatTime(auto.baseInterval[i]/Math.pow(2,game.upgrade.auto[i]),false)+"/run";
							}
							break;
						case 6:
							newDesc += format(Math.pow(2,game.upgrade.auto[i]),0) + "/buy";
							break;
						case 7:
							newDesc += (game.upgrade.auto[i]?"Unlocked":"Locked");
					}
			}
			id((type=="normal"?"u":type+"U")+"pgDesc"+i).innerHTML = newDesc;
			if (game.upgrade[type][i] == upgrade[type].limit[i]) {
				setTimeout(function(){
					id((type=="normal"?"u":type+"U")+"pg"+i).classList.add("maxedUpg");
					setTimeout(function(){id((type=="normal"?"u":type+"U")+"pg"+i).classList.add("hidden");},500);
				},1000);
			} else {
				id((type=="normal"?"u":type+"U")+"pg"+i).classList.remove("maxedUpg");
				id((type=="normal"?"u":type+"U")+"pg"+i).classList.remove("hidden");
			}
			id((type == "normal"?"u":type+"U")+"pgButton"+i).classList[game.points[upgrade[type].type[i]] >= Math.floor(getUpgPrice(i, type)) ? "remove" : "add"]("disabledUpg");
		}
		for (let i = 0; i < screenAmount; i++) {
			if (game.upgrade[type][i*4] == upgrade[type].limit[i*4] &&
			   game.upgrade[type][i*4+1] == upgrade[type].limit[i*4+1] &&
			   game.upgrade[type][i*4+2] == upgrade[type].limit[i*4+2] &&
			   game.upgrade[type][i*4+3] == upgrade[type].limit[i*4+3]) {
				setTimeout(function(){
					id((type=="normal"?"u":type+"U")+"pgCleared"+i).classList.remove("hidden");
					id((type=="normal"?"u":type+"U")+"pgCleared"+i).style.flex = "1";
				},1500);
			} else {
				id((type=="normal"?"u":type+"U")+"pgCleared"+i).classList.add("hidden");
				id((type=="normal"?"u":type+"U")+"pgCleared"+i).style.flex = "0";
			}
		}
	}
	id("progressBar0").max = getBarLength(0) != Infinity ? getBarLength(0) : 1.79e308;
	id("skillMenuOpen").classList[game.upgrade.normal[4] > 0 ? "remove" : "add"]("hidden");
	id("skillUpgMenuOpen").classList[game.upgrade.normal[5] ? "remove" : "add"]("hidden");
	id("autoUpgMenuOpen").classList[game.upgrade.normal[6] ? "remove" : "add"]("hidden");
	id("timeMachineMult").innerHTML = format(getTimeMachineMult(),2) + "x";
	id("autoMenuOpen").classList[game.upgrade.auto.reduce((a,b) => a + b, 0) > 0 ? "remove" : "add"]("hidden");
	for (let i = 0; i < 6; i++) {
		id("auto"+i).classList[game.upgrade.auto[i] == 0 ? "add" : "remove"]("hidden");
	}
	id("auto7").classList[game.upgrade.auto[7] == 0 ? "add" : "remove"]("hidden");
	if (!game.upgrade.skill.includes(0) && !game.upgrade.auto.includes(0)) giveAchievement("stillF");
	id("switchScreenRight").classList[currentScreen == getScreenLimit() ? "add" : "remove"]("disabled");
	id("switchScreenLeft").classList[currentScreen == 0 ? "add" : "remove"]("disabled");
}

function updateSkills() {
	for (let i = 0; i < 4; i++) {
		id("skill"+i).classList[game.skill.timer[i]<=0 && game.upgrade.normal[4] > i?"remove":"add"]("disabledUpg");
		if (game.skill.durationTimer[i]>0) {
			id("skillTimer"+i).innerHTML = formatTime(game.skill.durationTimer[i], false);
			id("skillTimer"+i).style.color = "green";
			if (i == 3 && game.skill.waitTimer > 0) {
				id("skillTimer"+i).innerHTML = formatTime(game.skill.waitTimer, false);
				id("skillTimer"+i).style.color = "blue";
			}
		} else if (game.skill.timer[i]>0) {
			id("skillTimer"+i).innerHTML = formatTime(game.skill.timer[i], false);
			id("skillTimer"+i).style.color = "red";
		} else {
			id("skillTimer"+i).innerHTML = ""
		}
		id("skillUse"+i).innerHTML = format(game.skill.uses[i],0)
	}
	id("skillDesc0").innerHTML = `x${format(Math.pow(9, (game.upgrade.skill[0] * 0.5 + 1) * (game.skill.waitTimer == 0 && game.skill.durationTimer[3] > 0 ? (game.upgrade.skill[7] ? 3 : 2) : 1)) + 1,0)} and x${game.upgrade.skill[1] ? "" : "-"}${format(Math.pow(9, (game.upgrade.skill[0] * 0.5 + 1) * (game.skill.waitTimer == 0 && game.skill.durationTimer[3] > 0 ? (game.upgrade.skill[7] ? 3 : 2) : 1)) - 1,0)}`;
	id("skillDesc1").innerHTML = format(Math.pow(36, (0.5 * game.upgrade.skill[2] + 1) * (game.skill.waitTimer == 0 && game.skill.durationTimer[3] > 0 ? (game.upgrade.skill[7] ? 3 : 2) : 1)),0);
	id("skillDesc3").innerHTML = 120 - 10*game.upgrade.skill[6] + " second" + pluralCheck(120 - 10*game.upgrade.skill[6]);
	id("skillDesc3.1").innerHTML = game.upgrade.skill[7] ? "cube" : "square";
	id("couponClicked").innerHTML = game.skill.couponTotal;
	id("chargeFailed").innerHTML = format(game.skill.waitFailed,0);
	if (!game.skill.uses.includes(0)) giveAchievement("goodMath");
	if (game.skill.uses[0] >= 50) giveAchievement("sineNotSin");
	if (game.skill.uses[1] >= 50) giveAchievement("expExp");
	if (game.skill.uses[2] >= 50) giveAchievement("sponsoredHoney");
	if (game.skill.uses[3] >= 50) giveAchievement("madeACube");
}

function updateSineGraph() {
	let line = id("sinGraphLine");
	let sineMult = Math.sin(game.skill.durationTimer[0] / 250);
	if (game.upgrade.skill[1]) sineMult = Math.abs(sineMult);
	let percent = (1 - sineMult) / 2;
	line.style.top = percent * 100 + "%";
	line.style.backgroundColor = "rgb(" + (255*percent) + "," + (255*(1-percent)) + ",0)";
}

function updateBoostBar() {
	let boostColor = "hsl(" + (240 - game.skill.boostProgress/125*3) + ",100%,50%)";
	id("boostLabel").innerHTML = "x" + format(getBoostBarMult(),2);
	id("boostBarValue").style.width = Math.min(game.skill.boostProgress / 100,100) + "%";
	id("boostBarValue").style.backgroundColor = boostColor;
	let boostStatus;
	let x = game.skill.boostProgress;
	switch (true) {
		case (x < 2000):
			boostStatus = "Cold";
			break;
		case (x < 4000):
			boostStatus = "Eh";
			break;
		case (x < 6000):
			boostStatus = "Warm";
			break;
		case (x < 8000):
			boostStatus = "Hot";
			break;
		case (x < 9000):
			boostStatus = "Burning";
			break;
		case (x < 10000):
			boostStatus = "Melting";
	}
	if (game.skill.boostOverflow) boostStatus = "OVERHEAT";
	id("boostBarStatusText").innerText = boostStatus;
	id("boostBarStatus").style.backgroundColor = boostColor;
	id("overflowAmt").innerHTML = format(game.skill.boostOverflowAmt,0);
	if (game.skill.boostOverflowAmt >= 50) giveAchievement("expExpBoom");
}

function updateAuto() {
	for (let i = 0; i < 6; i++) {
		let percent = Math.min(game.auto.nextRun[i] / auto.baseInterval[i] * Math.pow(2,game.upgrade.auto[i]),1) * 100;
		id("autoBarValue"+i).style.width = percent + "%";
		id("autoBarLabel"+i).innerHTML = format(Math.min(percent,100),2) + "%";
	}
}

function updateAchievements() {
	for (let ach of document.getElementsByClassName("achDisp")) {
		if (game.achievements.includes(ach.id.slice(0,-3))) {
			ach.style.backgroundImage = "url(pics/ach/" + ach.id.slice(0,-3) + ".png)";
			id(ach.id+"Desc").innerHTML = "<span style='font-size:18px'>" + achData[ach.id.slice(0,-3)][0] + "</span><br>" + achData[ach.id.slice(0,-3)][1];
		} else {
			ach.style.backgroundImage = "url(pics/ach/unknownAch.png)";
			id(ach.id+"Desc").innerHTML = achData[ach.id.slice(0,-3)][2];
		}
	}
}

function updateBattleMain() {
	let player = game.battle.player;
	let enemy = game.battle.enemy;
	id("battlePlayerHPValue").style.width = Math.floor(player.hp / getPlayerMaxHP() * 100) + "%";
	id("battlePlayerHPLabel").innerHTML = format(player.hp) + "/" + getPlayerMaxHP();
	id("battlePlayerSPValue").style.width = Math.floor(player.sp / getPlayerMaxSP() * 100) + "%";
	id("battlePlayerSPLabel").innerHTML = format(player.sp) + "/" + getPlayerMaxSP();
	for (let i = 0; i < 4; i++) {
		id("battleAttackCooldownDisp"+i).style.width = Math.floor(player.cooldown[i] / baseAttackCooldown[i] * 100) + "%";
		id("battleAttackCost"+i).innerHTML = format(baseAttackCost[i]);
		id("battleAttackCooldown"+i).innerHTML = format(baseAttackCooldown[i]/1000,1);
		id("battleAttackBasePower"+i).innerHTML = format(baseAttackPower[i]);
	}
	id("battleEnemyHPValue").style.width = (enemy.hp == Infinity ? 100 : Math.floor(enemy.hp / enemyList[game.battle.currentEnemy].maxHP * 100)) + "%";
	id("battleEnemyHPLabel").innerHTML = enemyList[game.battle.currentEnemy].name;
	id("battleEnemyAttackValue").style.width = (enemy.cooldown == Infinity ? 0 : 100-Math.floor(enemy.cooldown / enemyList[game.battle.currentEnemy].cooldown * 100)) + "%";
	id("battleAreaName").innerHTML = areaList[game.battle.currentArea].name;
	id("battleContainer").style.backgroundImage = "url('pics/battle/area/" + game.battle.currentArea + "')";
}
function updateBattleStat() {
	id("battlePlayerLevel").innerHTML = getPlayerLevel();
	id("battlePlayerXPToNext").innerHTML = format(Math.pow(getPlayerLevel(),2) * 5 - game.battle.xp);
	id("battlePlayerStr").innerHTML = format(getPlayerStrength(),2);
	id("battlePlayerDef").innerHTML = format(getPlayerDefense(),2);
	id("battlePlayerHPRegen").innerHTML = format(getPlayerHPRegen(),2);
	id("battlePlayerSPRegen").innerHTML = format(getPlayerSPRegen(),2);
}
function updateBattleInv() {
	for (let i in game.battle.inventory) {
		let item = game.battle.inventory[i];
		if (item == 0) {
			id("battleInvSpace"+i).style.backgroundImage = "";
			id("battleInvSpace"+i).style.backgroundColor = "";
			id("battleInvSpace"+i).classList.remove("tooltip");
		} else {
			id("battleInvSpace"+i).style.backgroundImage = "url('pics/battle/item" + item.id + "')";
			id("battleInvSpace"+i).style.backgroundColor = "#222222";
			id("battleInvSpace"+i).classList.add("tooltip");
		}
		let propPriorityList = ["name","type","modifiersLeft","maxHP","maxSP","str","def","critRate","critMult","HPRegen","SPRegen","HPGain","baseCooldown","cooldown"];
		if (id("battleInvSpace"+i).classList.contains("tooltip")) {
			let tooltip = "";
			for (let i in propPriorityList) {
				if (item.keys.includes(propPriorityList[i])) {
					tooltip += propPriorityList[i] + ": " + item[propPriorityList[i]] + (propPriorityList[i] == "modifiersLeft" ? "<hr>" : "<br>");
				}
			}
			tooltip = tooltip.substr(0,tooltip.length-3);
			id("battleInvTooltip"+i).innerHTML = tooltip;
		}
	}
}
