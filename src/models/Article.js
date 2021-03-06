var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function(app){
	var articleSchema = new Schema({
		userId: Schema.Types.ObjectId,
		originId: String,
		title: {type: String, default : ""},
		content: {type: String, default : ""},
		summary: {type: String, default : ""},
		type: Number // 0 for RSS Article, 1 for Evernote		
	});

	articleSchema.index({ userId: 1, originId: 1 }, {unique: true});

	mongoose.model('Article', articleSchema);
};
