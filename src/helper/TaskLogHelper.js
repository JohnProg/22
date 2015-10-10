'use strict'

var mongoose = require('mongoose');
var TaskLog = mongoose.model('TaskLog');
var Q = require('q');

function init(app){
	function TaskLogHelper(){
	}

	TaskLogHelper.prototype.find = function(userId, query, proj, opt){
		console.log(Object.assign({userId}, query));
		return Q.nbind(TaskLog.find, TaskLog)(Object.assign({userId}, query), proj, opt)
		.then(function(list){
			console.log(list);
			return list;
		})
	}

	TaskLogHelper.prototype.create = function(userId, taskId, type, loc){
		let obj = {
			userId
			, taskId
			, type: type.id
		}

		if(loc){
			obj.loc = {
		      type: 'Point',
		      coordinates: [parseFloat(loc[0]||loc.lon), parseFloat(loc[1]||loc.lat)]
		    }
		}

		obj = new TaskLog(obj);

		return Q.nbind(obj.save, obj)();
	}

	app.helper.tasklog = new TaskLogHelper();
}

module.exports = init;
