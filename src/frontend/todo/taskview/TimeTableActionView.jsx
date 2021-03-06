import React from 'react';
import TaskActionView from './TaskActionView';
import TaskStateType from '../../../constants/TaskStateType';
import ActiveEventView from './ActiveEventView';
import _ from 'underscore';

class TimeTableActionView extends React.Component {
    constructor(props) {
        super(props);
        this.displayName = 'TimeTableActionView';
    }

    componentDidUpdate(prevProps, prevState) {
        console.log('TimeTableActionView', 'componentDidUpdate', this.refs)

        let refs = this.refs;
        let needToShow0 = this.refs.taskActionView!=null && this.refs.taskActionView.state.needToShow;
        let needToShow1 = this.refs.activeEventView!=null && this.refs.activeEventView.state.needToShow;
        let self = this;

        if(needToShow0 || needToShow1 || this.props.timetable.toStartEvent || this.props.config.forceShowTaskModal){
            var modal = $(React.findDOMNode(this));
            modal.modal({
                backdrop: true
                , keyboard: true
                , show: true
            }).on('hidden.bs.modal', function (e) {
                if(refs.taskActionView!=null)
                    refs.taskActionView.state.needToShow = false;
                if(refs.activeEventView!=null)
                    refs.activeEventView.state.needToShow = false;
                
                if(self.props && self.props.timetable)
                    self.props.timetable.toStartEvent = undefined;

                self.props.config.resetTaskModalState = false;
            })

            this.props.config.forceShowTaskModal = false;
        }
    }

    render(){
        let now = Math.floor((this.props.global.time||Date.now())/(30*60*1000));

        let toStartEvents = _.filter(this.props.timetable.list, event=>{
            let task = this.props.tasks.tasks[event.taskId];
            console.log({event, task});
            if(!task)
                return false;

            console.log(event.tableslotStart, now, task.state, TaskStateType.named.start.id);
            if(event.tableslotStart <= now && (
                task.state != TaskStateType.named.start.id
                && task.state != TaskStateType.named.complete.id)){
                return true;
            }
            else{
                return false;
            }
        })

        if(this.props.timetable.toStartEvent){
            let index = _.findWhere(toStartEvents, {_id: this.props.timetable.toStartEvent._id});
            if(index>=0){
                toStartEvents.splice(index, 1, this.props.timetable.toStartEvent);
            }
            else{
                toStartEvents.push(this.props.timetable.toStartEvent);
            }
        }

        let currentActive = _.filter(this.props.timetable.list, event=>{
            let task = this.props.tasks.tasks[event.taskId];
            if(event.taskId){
                if(task && task.state == TaskStateType.named.start.id){
                    return true;
                }
                else{
                    return false;
                }
            }
            else{
                if(event.tableslotStart<=now && now<=event.tableslotEnd){
                    return true;
                }
                else{
                    return false;
                }
            }  
        })

        console.log('currentActive', currentActive);

        let currentActiveWithoutDismissed = _.filter(currentActive, item=>!item.dismissed);

        return (
            <div className="modal fade" tabIndex="-1" role="dialog" aria-labelledby="gridSystemModalLabel">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-contents form-group-attached">
                            <div className="modal-header">
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                                <h4 className="modal-title" id="gridSystemModalLabel">
                                    Task Wizard
                                </h4>
                            </div>
                            <div className='row'>
                                <div className='col-md-6'>
                                    <div className="modal-body modal-actionview">
                                        <ActiveEventView 
                                            ref='activeEventView' 
                                            dispatch={this.props.dispatch}
                                            events={currentActive} 
                                            tasks={this.props.tasks}
                                            config={this.props.config}
                                            global={this.props.global} />
                                    </div>
                                </div>
                                <div className='col-md-6'>
                                    <div className="modal-body modal-actionview">
                                        <TaskActionView 
                                            ref='taskActionView' 
                                            dispatch={this.props.dispatch}
                                            events={toStartEvents}
                                            tasks={this.props.tasks}
                                            config={this.props.config}
                                            global={this.props.global}
                                            disabled={currentActiveWithoutDismissed.length>0}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default TimeTableActionView;
