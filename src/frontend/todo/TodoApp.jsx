import React from 'react'
import { createStore } from 'redux'
import { connect } from 'react-redux';

import TaskView from './taskview/TaskView'
import TaskBanner from './taskview/TaskBanner'
import UserView from './userview/UserView'

import _ from 'underscore'

import DateTimePicker from './dialog/DateTimePicker'

import { getLocation } from '../utility/location'
import If from '../utility/if'

import MainTimeline from '../timeline/MainTimeline'

import DevelopView from '../develop/DevelopView'
import ConfigView from '../config/ConfigView'

import GoogleCalendarList from '../calendar/GoogleCalendarList'

import Topbar from '../main/Topbar'
import TaskStateType from '../../constants/TaskStateType';
import { syncUserStatus } from '../todo/actions/user';
import $ from 'jquery';
import TimeTableActionView from './taskview/TimeTableActionView';
import TaskLineChart from './taskview/TaskLineChart';

class TodoApp extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			location: '',
			predictLocation: '',
			currentView: 'task', // Save current user's view
			timelineState: ''
		};

		let { dispatch } = this.props;
		dispatch(syncUserStatus());
	}

	componentDidMount() {
		getLocation()
		.then(function(loc){
			this.sendStillAlive();

			var url = 'v1/locs?lat='+loc.lat+'&lon='+loc.lon;
			
			$.getJSON(url, function( data ) {
				console.log('recieved resp:', data);
				this.setState({
					predictLocation: data.name
				});
			}.bind(this))
			.fail((err)=>{
				console.error('err', err);
			});

			this.setState({
				location: loc
			});
			// Send still alive signal on every 5 min.
			// NOTE: When user inactive the tab in Chrome, the timer is paused.
			setInterval(this.sendStillAlive, 5*60*1000);
		}.bind(this));

		var self = this;
		var wrap = window;
		$(wrap).scroll(function(){
			let timelineState = $(wrap).scrollTop() > 30?'fixed-to-top':'';
			if(timelineState != self.state.timelineState)
				self.setState(Object.assign({}, self.state, {timelineState}));
		});
	}

	sendStillAlive(){
		getLocation()
		.then(loc => {
			if (loc.lat == 0 || loc.lon == 0) {
				return
			}
			$.ajax({
				url: '/v1/connections/alive'
				, type: 'POST'
				, data:{
					lat: loc.lat,
					lon: loc.lon
				}
			})
			.then(
				result => {}
				, err => {console.log(err);}
			)
			if (loc.lat != this.state.location.lat || loc.lon != this.state.location.lon){
				// Only update when location is changed.
				this.setState({
					location: loc
				});
			}
		});
	}

	toggleView(){
		var nextView;
		if(this.state.currentView == 'task'){
			nextView = 'user';
		}
		else{
			nextView = 'task';
		}

		this.setState({
			currentView: nextView
		});
	}

	render() {
		return (
			<div className={"task-app-container " + this.state.timelineState}>
				<Topbar/>
				<MainTimeline timetable={this.props.timetable} config={this.props.config} global={this.props.global}/>
				<TaskBanner tasks={this.props.tasks} timetable={this.props.timetable} dispatch={this.props.dispatch} config={this.props.config}/>
				{/*<DevelopView dispatch={this.props.dispatch} config={this.props.config} user={this.props.user} predictLocation={this.state.predictLocation}/>*/}
				<ConfigView dispatch={this.props.dispatch} config={this.props.config} predictLocation={this.state.predictLocation}/>
				<If test={this.props.config.showCalendarList==true}>
					<GoogleCalendarList dispatch={this.props.dispatch} config={this.props.config} google={this.props.thirdparty.google}/>
				</If>

				<TaskLineChart config={this.props.config} tasks={this.props.tasks}/>

				<TimeTableActionView dispatch={this.props.dispatch} timetable={this.props.timetable} tasks={this.props.tasks} config={this.props.config} global={this.props.global} />

				<If test={this.props.config.userview!=true}>
					<TaskView dispatch={this.props.dispatch}
						tasks={this.props.tasks}
						tasklog={this.props.tasklog}
						global={this.props.global}
						config={this.props.config}
						timetable={this.props.timetable}
					/>
				</If>
				<If test={this.props.config.userview==true}>
					<UserView dispatch={this.props.dispatch} global={this.props.global}/>
				</If>
			</div>
		);
	}
};

function mapStateToProps(state){
	var props = Object.assign({}, state);
	props.tasks.list = _.map(state.tasks._list, _id => state.tasks.tasks[_id]);
	props.tasks.plist = _.map(state.tasks._plist, _id => state.tasks.tasks[_id]);
	let _activeList = _.filter(state.tasks.tasks, obj=>obj.state == TaskStateType.named.start.id);
	_activeList = _.intersection(state.tasks._plist, _.pluck(_activeList, '_id'));

	_.each(state.tasks._tlist, tid=>{
		let task = state.tasks.tempTasks[tid];
		props.tasks.list.push(task);
		props.tasks.plist.push(task);
	})

	try{
		props.testTask = props.tasks.tasks[props.tasks.list[0]._id];
		console.log('testTask : ', props.testTask);
	}
	catch(e){}

	props.tasks.activeList = _.map(_activeList, _id => state.tasks.tasks[_id]);

	return props;
};

export default connect(
	mapStateToProps
)(TodoApp);
