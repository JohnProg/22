'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var TaskLogType = require('../constants/TaskLogType');
var PredictToken = require('../models/PredictToken');
var Q = require('q');

class Tokenizer{
	constructor(app){
		this.app = app;
	}

	tokenizeText(text){
		return text.split(' ');
	}

	getTimeDivision(time){
		if(typeof time == 'date'){
			time = time.getTime();
		}

		return Math.floor(time / (30 * 60 * 1000));
	}

	getWeekDayFromToken(time){
		return (new Date(time * (30 * 60 * 1000))).getDay();
	}

	makeTokens(task, log, time){
		let textTokens = this.tokenizeText(task.name);
		let self = this;

		let tokens = _.map(textTokens, text => {
			let obj = {
				userId: task.userId,
				taskId: task._id,
				text: text,
				duration: task.duedate - task.created,
				priority: task.priority,
				weekday: self.getWeekDayFromToken(time),
				time: time,
				status: log.type,
				loc: log.loc,
			};

			return obj;
		});

		return Q.all(_.map(tokens, function(tokenRaw){
			return self.app.helper.predictToken.create(tokenRaw);
		}));
	}

	processTask(user, task){
		let self = this;
		let app = this.app;
		
		let currentTime = new Date(Date.now());
		let _time = currentTime;
		let lastTime = new Date(task.lastProcessed);

		let p0 = this.app.helper.tasklog.find(task.userId, {taskId: task._id, time: {$gt: lastTime}}, undefined, {sort: {time: -1}});
		let p1 = this.app.helper.tasklog.find(task.userId, {taskId: task._id, time: {$lte: lastTime}}, undefined, {limit: 1});
		let p2 = this.app.helper.predictToken.find(task.userId, {taskId: task._id}, undefined, {sort: {time: 1}, limit: 1});

		return Q.spread([p0, p1, p2], function(logs, lastlog, earleastToken){
			lastlog = lastlog[0];
			var promises = [];
			_.each(logs, (log) => {
				console.log(_.range(self.getTimeDivision(_time), self.getTimeDivision(log.time), -1));
				_.each(_.range(self.getTimeDivision(_time), self.getTimeDivision(log.time), -1), time=>{
					//TODO
					//need to ignore mistaken action
					console.log('p0', task, log, time);
					promises.push(self.makeTokens(task, log, time));
				});

				_time = log.time;
			});

			if(lastlog){
				console.log('earleastToken : ', earleastToken);
				earleastToken = earleastToken[0];
				console.log(self.getTimeDivision(_time), self.getTimeDivision(lastTime), earleastToken!=null?0:1);
				_.each(_.range(self.getTimeDivision(_time), self.getTimeDivision(lastTime) - (earleastToken!=null?0:1), -1), time=>{
					//TODO
					//need to ignore mistaken action
					console.log('p1', task, lastlog, time);
					promises.push(self.makeTokens(task, lastlog, time));
				});
			}

			return Q.all(promises);
		})
		.then(function(){
			return app.helper.taskHelper.update(user._id, {_id: task._id}, {lastProcessed: currentTime})
		})
		.fail(logger.error)
	}
}

module.exports = Tokenizer;
