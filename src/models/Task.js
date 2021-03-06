var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var TaskStateType = require('../constants/TaskStateType');

module.exports = function(app){
	var taskSchema = new Schema({
		userId: Schema.Types.ObjectId,
		name: String,
		description: {type: String, default: ""},
		importance: {type: Number, default: 0}, // 1=important, 0=not
		priorityScore: {type: Number, default: 1.0}, // ????
		timePreferenceScore: [], // array of (timslotIdx, score) tuples.
		estimation: {type: Number, default: 1.0},	//unit-hour
		duedate: {type: Date, default: function(){
			return new Date(Date.now() + 24*60*60*1000);
		}},
		state: {type: Number, default: TaskStateType.named.create.id},

		// Save related location as 4 bits. (home, school, work, etc)
		// 0 means, no location is related to this task
		// 1 means etc.
		// 8 means home
		// 12 means home and school.
		// and, so on ...
		relatedLocation: {type: Number, default: 0},
		lastProcessed: {type: Date, default: Date.now},
		created: {type: Date, default: Date.now},
		important: {type: Boolean, default: true},
		adjustable: {type: Boolean, default: false},
		marginBefore: {type: Number, default: 0},
		marginAfter: {type: Number, default: 0},
		beginAfter: {type: Date}
	});

	taskSchema.index({
		userId: 1
		, priorityScore: -1
	})

	taskSchema.index({
		userId: 1
		, created: 1
	})

	mongoose.model('Task', taskSchema);
};
