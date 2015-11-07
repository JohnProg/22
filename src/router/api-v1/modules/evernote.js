'use strict'

let Q = require('q');
let mongoose = require('mongoose');
let express = require('express');

module.exports = function(_router, app){
	let helper = app.helper;
	let router = express.Router();
	_router.use('/evernote', router);

	router.get('/auth', function(req, res){
		// Redirect to Evernote to login into Evernote service.
		app.helper.evernote.getAuthURL(req.user)
		.then((results)=>{
			if (results.oauthToken){
				// store the tokens in the session
				req.session.evernote = {
					oauthToken: results.oauthToken,
					oauthTokenSecret: results.oauthTokenSecret
				};
			}
			res.redirect(results.redirectUrl);
		});
	})

	router.get('/oauthcallback', function(req, res){
		// This function will be automatically callled during OAuth.
		app.helper.evernote.processAuthCode(req.user, req.session.evernote, req.query.oauth_verifier)
		.then((oauthAccessToken)=>{
			req.session.evernote = {
				oauthToken: req.session.evernote.oauthToken,
				oauthTokenSecret: req.session.evernote.oauthTokenSecret,
				oauthAccessToken: oauthAccessToken
			};

			// console.log(req.session.evernote);

			// Use below commented redirection after implementing '/pushtodb'.
			res.redirect('/');
			// res.redirect('/v1/evernote/pushtodb')
		})
		.fail((err)=>res.send(err.data));
	})

	router.get('/pushtodb', function(req, res){
		// Push every notes in the evernote account into Article DB.
		// This function will be automatically callled during OAuth.
		app.helper.evernote.getNotebookList(req.session.evernote.oauthAccessToken)
		.then(notelist=>{
			// LOOP OVER NOTEBOOK
				// GET NOTES FROM NOTEBOOK
				// LOOP OVER NOTES
					// PUSH TO Article DB
				// END LOOP
			// END LOOP
		})
		.fail(err=>res.send(err));
	})

	router.get('/unauth', function(req, res){
		// Drop session data for Evernote.
		req.session.evernote = {};
	})

	router.get('/notebooklist/list', function(req, res){
		app.helper.evernote.getNotebookList(req.session.evernote.oauthAccessToken)
		.then(results=>res.send(results))
		.fail(err=>res.send(err));
	})

	router.get('/update', function(req, res){
		// Update any changes of saved notes.
		app.helper.evernote.update(req.user)
		.then(function(results){
			res.send(results);
		})
	})
}
