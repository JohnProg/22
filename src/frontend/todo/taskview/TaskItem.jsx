import React from 'react';
import DocView from './DocView';
import MapImage from '../dialog/MapImage';
import LocationAddress from '../dialog/LocationAddress';
import _ from 'underscore';
import { getReadableDate } from '../../utility/date'
import { startItem, pauseItem, completeItem, removeItem, postponeItem, getRemainTime } from '../actions/tasks';
import { fetchTaskLog } from '../actions/tasklog';
import If from '../../utility/if'
var TaskStateType = require('../../../constants/TaskStateType');
import SvgContainer from '../../d3/SvgContainer'

class TaskItem extends React.Component{
	constructor(props){
		super(props);
		this.state = {};

		const { dispatch } = this.props;
		dispatch(fetchTaskLog(this.props.task));
	}

	complete(){
		const { dispatch } = this.props;
		dispatch(completeItem(this.props.task));
	}

	start() {
		const { dispatch } = this.props;
		dispatch(startItem(this.props.task));
	}

	pause() {
		const { dispatch } = this.props;
		dispatch(pauseItem(this.props.task));
	}

	discard(){
		const { dispatch } = this.props;
		dispatch(removeItem(this.props.task));
	}

	postpone(){
		const { dispatch } = this.props;
		dispatch(postponeItem(this.props.task));
	}

	reset(){
		$.ajax(`/v1/tasktoken/task/${this.props.task._id}/reset`);
	}

	toggleLocationButton(locName){
		var locList = ['home', 'school', 'work', 'etc'];
		var locIndex = 0;
		for (let i in locList){
			if (locList[i] == locName){
				locIndex = i;
				break;
			}
		}
		// Flip bit on locIndex
		const { dispatch } = this.props;
		dispatch(updateRelatedLocation(relatedLocation ^ (1 << (locList.length-1-locIndex))));
	}

	expand(){
		const { dispatch } = this.props;

		var newVal = (this.state.isExpanded||0) ^ 1;
		this.setState({
			isExpanded: newVal
		});
	}

	getLocButtonStates(relatedLocation){
		var locButtonState={
			home: "btn-default",
			school: "btn-default",
			work: "btn-default",
			etc: "btn-default"
		};

		if (relatedLocation % 2 == 1)
			locButtonState.etc = "btn-check";
		relatedLocation = Math.floor(relatedLocation / 2);

		if (relatedLocation % 2 == 1)
			locButtonState.work = "btn-check";
		relatedLocation = Math.floor(relatedLocation / 2);

		if (relatedLocation % 2 == 1)
			locButtonState.school = "btn-check";
		relatedLocation = Math.floor(relatedLocation / 2);

		if (relatedLocation % 2 == 1)
			locButtonState.home = "btn-check";
		relatedLocation = Math.floor(relatedLocation / 2);

		return locButtonState;
	}

	test_tokenlink(){

	}

	getCreatedLocation(){
		let task = this.props.task;
		let logs = this.props.tasklog;

		let log_created = _.findWhere(logs, {taskId: task._id});
		let location;

		if(log_created){
			let longitude = log_created.loc.coordinates[0];
			let latitude = log_created.loc.coordinates[1];
			let location = {longitude, latitude};
			return (<LocationAddress location={location} />);
		}
	}

	getRemainTime() {
		let time = Math.floor(getRemainTime(this.props.task, this.props.tasklog));

		let result = "여유시간: ";
		if(time <= 0) {
			result = "여유시간 부족!";
		}
		else if(time <= 1) {
			result += "1시간 이하";
		}
		else if(time > 25) {
			result += ("약 "+Math.floor((time/24))+"일 "+(time%24)+"시간");
		}
		else{
			result += ("약 "+time+"시간");
		}
		return result;
	}

	getDetailView(){
		var task = this.props.task;
		var startDate, completeDate;
		var locButtonState = this.getLocButtonStates(task.relatedLocation);

		var completeButtonState = "btn-default";
		var processButtonState = "btn-default";
		if(task.timestampStart != null){
			startDate = (
				<div className="taskStartedDate">
					시작일: {getReadableDate(task.timestampStart)}
				</div>
			);
		}

		if(task.state == TaskStateType.named.complete.id){
			completeDate = (
				<div className="task-complete-date">
					완료일: {getReadableDate(task.timestampComplete)}
				</div>
			);
			completeButtonState = "btn-check";
		}

		if (task.state == TaskStateType.named.start.id) {
			processButtonState = "btn-check";
		}

		let logs = this.props.tasklog || [];


		return (
			<div className="panel panel-default">
				<div className="panel-heading" onClick={this.expand.bind(this)}>
					<h2 className="task-name">{task.name}</h2>
				</div>
				<div className="panel-body">
					<div className="row">
						<div className="col-md-8">
							<div className="task-description">
								<span>{task.description}</span>
							</div>
							<div className="task-relatedLocation">
								작업 가능 장소 선택 :
								<div className="btn-group">
									<button className={"btn " + locButtonState.home} data-toggle="집" label="집" onClick={this.toggleLocationButton.bind(this, 'home')}>
										<span className="glyphicon glyphicon-home"></span>
									</button>
									<button className={"btn " + locButtonState.school} data-toggle="학교" label="학교" onClick={this.toggleLocationButton.bind(this, 'school')}>
										<span className="glyphicon glyphicon-book"></span>
									</button>
									<button className={"btn " + locButtonState.work} data-toggle="직장" label="직장" onClick={this.toggleLocationButton.bind(this, 'work')}>
										<span className="glyphicon glyphicon-briefcase"></span>
									</button>
									<button className={"btn " + locButtonState.etc} data-toggle="기타" label="기타" onClick={this.toggleLocationButton.bind(this, 'etc')}>
										<span className="glyphicon glyphicon-flash"></span>
									</button>
								</div>
							</div>
							<div className="task-startlocation">
								<p>
								생성 시 위치:
								{ this.getCreatedLocation() }
								</p>
								<p>
								완료 위치:
								{ task.locationstampComplete ? <LocationAddress location={task.locationstampComplete} /> : null }
								</p>
							</div>
						</div>
						<div className="card-contents col-md-4">
							<div className="task-importance">
								중요도: {task.importance}
							</div>
							<div className="taskCreatedDate">
								생성일: {getReadableDate(task.created)}
							</div>
							{startDate}
							<div className="task-duedate">
								마감일: {getReadableDate(task.duedate)}
							</div>
							<If test={task.state != TaskStateType.named.complete.id}>
								<div>
									<div>
										소요시간: { task.estimation } 시간
									</div>
									<div>
										{ this.getRemainTime() }
									</div>
								</div>
							</If>
							{completeDate}
						</div>
					</div>
					<div>
						<div className="btn-group">
							<If test={task.state != TaskStateType.named.complete.id}>
								<If test={task.state != TaskStateType.named.start.id}>
									<button className="btn btn-default" onClick={this.start.bind(this)}>
										<span className="glyphicon glyphicon-play"></span> 시작
									</button>
								</If>
							</If>
							<If test={task.state != TaskStateType.named.complete.id}>
								<If test={task.state == TaskStateType.named.start.id}>
									<button className="btn btn-check" onClick={this.pause.bind(this)}>
										<span className="glyphicon glyphicon-play"></span> 일시 정지
									</button>
								</If>
							</If>
							<If test={task.state != TaskStateType.named.complete.id}>
								<button className="btn btn-default" onClick={this.complete.bind(this)}>
									<span className="glyphicon glyphicon-check"></span> 완료
								</button>
							</If>
							<If test={task.state == TaskStateType.named.complete.id}>
								<button className="btn btn-check">
									<span className="glyphicon glyphicon-check"></span> 완료
								</button>
							</If>
							<button className="btn btn-default" label="Remind me later" onClick={this.postpone.bind(this)}>
								<span className="glyphicon glyphicon-send"></span> 나중에 알림
							</button>
							<button className="btn btn-default" label="Discard this task" onClick={this.props.onTaskModify}>
								<span className="glyphicon glyphicon-pencil"></span> 수정
							</button>
							<button className="btn btn-default" label="Discard this task" onClick={this.discard.bind(this)}>
								<span className="glyphicon glyphicon-trash"></span> 할 일 제거
							</button>
							<button className="btn btn-warning" label="Discard this task" onClick={this.reset.bind(this)}>
								<span className="glyphicon glyphicon-trash"></span> reset
							</button>
							<a href={`/v1/tasktoken/timeprefscore/${task._id}/`}>
								<button className="btn btn-warning" label="Discard this task">
									<span className="glyphicon glyphicon-trash"></span> timeprefscore
								</button>
							</a>
							<a href={`/v1/tasktoken/task/${task._id}/`}>
								<button className="btn btn-warning" label="Discard this task">
									<span className="glyphicon glyphicon-trash"></span> tokens
								</button>
							</a>
							<a href={`/v1/tasktoken/time/${this.props.global.time?this.props.global.time:''}`}>
								<button className="btn btn-warning" label="Discard this task">
									<span className="glyphicon glyphicon-trash"></span> tokens by time
								</button>
							</a>
							<a href={`/v1/tasklog/task/${task._id}/`}>
								<button className="btn btn-warning" label="Discard this task">
									<span className="glyphicon glyphicon-trash"></span> show logs
								</button>
							</a>

						</div>
						<DocView taskID = {this.props.task._id} keyword = {task.name + task.description} user_id = {task.userId}/>
					</div>
				</div>
			</div>
		);
	}

	getSimpleView(){
		var task = this.props.task;
		var descStr = task.description || '';
		var startDate, completeDate;
		var locButtonState = this.getLocButtonStates(task.relatedLocation);

		let duedate = moment(task.duedate);

		return (
			<div className='task-item' onClick={this.expand.bind(this)}>
				<If test={task.loading}>
					<i className='fa fa-spinner fa-spin mr10'></i>
				</If>
				{task.name}
				<div className='duedate'>
					<i className='fa fa-clock-o'></i> {duedate.format("YY/MM/DD, HH:mm")}
				</div>
			</div>
		);
	}

	render() {
		// console.log('In TaskItem render():');
		// console.log(this.state);
		var viewContent;
		if (this.state.isExpanded == 1){
			viewContent = this.getDetailView();
		}
		else{
			viewContent = this.getSimpleView();
		}
		return viewContent;
	}
};

export default TaskItem;
