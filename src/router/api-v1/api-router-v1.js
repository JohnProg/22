'use strict'

var express = require('express');
var fs = require('fs');

var mongoose = require('mongoose');
var ConnectionLog = mongoose.model('ConnectionLog');
var Account = mongoose.model('Account');

module.exports = function(app){
	var router_auth = express.Router();
	router_auth.use('/', app.needAuthorization);

	router_auth.post('/connections/alive', function(req, res){
		var newLog = new ConnectionLog({
			'userId': req.user._id,
			'loc': {
				type: 'Point',
				coordinates: [ Number(req.body.lat), Number(req.body.lon) ]
			 }
		});
		newLog.save(function (err, obj){
			if (err) return console.error(err);
			return res.send(obj);
		})
	})

	router_auth.get('/connections/drop', function(req, res){
		ConnectionLog.remove({'userId' :req.user._id}, function (err){
			if (err) return console.error(err);
			res.send('ok');
		});
	})

	router_auth.get('/connections', function(req, res){
		ConnectionLog.find({'userId' :req.user._id}, function (err, connection){
			if (err) return console.error(err);
			res.send(connection);
		});
	})

	router_auth.get('/locs', function(req, res){
		Account.findOne({'_id' :req.user._id}, function (err, account){
			if (err) return handleError(err);
			var locations = [account.locHome, account.locSchool, account.locWork, account.locEtc];
			res.send(locations);
		});
	})

	router_auth.post('/locs/:label', function(req, res){
		// Save recieved location info to location of the label.

		// recieved data has this form. {type : "Point", coordinates: [100.0, 0.0]}
		let locInfo = _.pick(req.body, ['type', 'coordinates']);
		if (req.params.label == 'home'){
			Account.update({_id: req.user._id}, {locHome: locInfo}, function(err, affected, resp) {
				if (err) return console.error(err);
				res.send('ok');
			})
		}
		else if(req.params.label == 'school'){
			Account.update({_id: req.user._id}, {locSchool: locInfo}, function(err, affected, resp) {
				if (err) return console.error(err);
				res.send('ok');
			})
		}
		else if(req.params.label == 'work'){
			Account.update({_id: req.user._id}, {locWork: locInfo}, function(err, affected, resp) {
				if (err) return console.error(err);
				res.send('ok');
			})
		}
		else if(req.params.label == 'etc'){
			Account.update({_id: req.user._id}, {locEtc: locInfo}, function(err, affected, resp) {
				if (err) return console.error(err);
				res.send('ok');
			})
		}
	})

	fs.readdirSync(__dirname + '/modules').forEach(function(file){
		if(file.search(/.*?\.js$/) != -1){
			require(__dirname + '/modules/' + file)(router_auth, app);
		}
	});

	var router_n_auth = express.Router();
	fs.readdirSync(__dirname + '/modules/not_authorized/').forEach(function(file){
		if(file.search(/.*?\.js$/) != -1){
			require(__dirname + '/modules/not_authorized/' + file)(router_n_auth, app);
		}
	});

	return [router_n_auth, router_auth];
}
