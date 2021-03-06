'use strict'

var TaskStateType = require('../constants/TaskStateType');
var _ = require('underscore');

function ComprehensivePriorityStrategy(app){
	this.app = app;
}

// Return idle time upon consideration of remain time, performed time, and estimated time of task.
// Hour unit, rounded to the first decimal place.
function getRemainTime(task, logs) {
	function dateToMillisec(date) {
		return new Date(date);
	}

	var remainTime = ((dateToMillisec(task.duedate) - Date.now()) / 1000 / 60 / 60).toFixed(1);
	var estimationTime = task.estimation;
	var activatedTime = 0;

	let from = 0;
	var lognum;
	if(!logs) {
		lognum = -1;
	}
	else {
		lognum = logs.length;
	}
	while (from < lognum) {
		if (logs[from].type == 200) {
			let to = from + 1;
			while (to < lognum) {
				if (logs[to].type == 300) {
					activatedTime += (dateToMillisec(logs[to].time) - dateToMillisec(logs[from].time));
					from = to;
					break;
				}
				to += 1;
			}
		}
		from += 1;
	}
	activatedTime /= (1000 * 60 * 60);

	// 8760 mean total hours of the year (365 * 24)
	let requiredTime = (remainTime - estimationTime + activatedTime).toFixed(1);
	if (requiredTime < 12) emergence = 100000;
	else {
		let emergence = 8760 - requiredTime;
		if (emergence > 8760) emergence = 8760;
	}

	let importance = task.importance * 10000;

	let result = emergence + importance;
	return result;
}

ComprehensivePriorityStrategy.prototype.ready = function(){}

ComprehensivePriorityStrategy.prototype.calculate = function(task, logs){
	let score = getRemainTime(task, logs);

	return score;
}

module.exports = ComprehensivePriorityStrategy;