'use strict'

var path			= require('path');
var PythonShell 	= require('python-shell');

// define absolute directory
var py_absolute_path = path.resolve('./src/python_scripts/');

//define function path
var morphem_py_path = 'morphem_call.py'
var Q = require('q');

var py_function_broker = function(path, input, callback){
	// This function should get a message. 
	// Then it will return to you the python script result as JSON type
	var options = {
	  mode: 'text',
	  // pythonPath: '/usr/bin/python',
	  scriptPath: py_absolute_path ,
	  args: [input]
	};

	PythonShell.run(path, options, function(err, results){
		if (err) throw err;
		callback(JSON.parse(results[0]))
	});
}

module.exports = {
	analyze_morphem : function(msg) {
		let defer = Q.defer();

		logger.log(morphem_py_path)
		py_function_broker(morphem_py_path, msg, function(tokens){
			defer.resolve(tokens.result);
		});

		return defer.promise;
	}
}
