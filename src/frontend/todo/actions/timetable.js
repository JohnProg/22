'use strict'

import { type } from './timetable.decl';
import { getLocation } from '../../utility/location'
import _ from 'underscore'
import { request } from './common'
import { type as TaskActionType } from './tasks_decl';


export function fetchTimetable(){
	return (dispatch, getState) => {
		return $.ajax({
			url: '/v1/timetable/',
			type: 'get'
		})
		.then(
			result => {
				dispatch({type: type.FETCH_TIMETABLE, list: result});
			}
			, err => console.error(err)
		)
	}
}

export function resetTimetable(){
	return (dispatch, getState) => {
		return $.ajax({
			url: '/v1/timetable/make',
			type: 'put'
			, data:{
				time: getState().global.time
			}
		})
		.then(function(){
			return $.ajax({
				url: '/v1/timetable/',
				type: 'get'
			})}
		)
		.then(
			result => {
				dispatch({type: type.FETCH_TIMETABLE, list: result});
			}
			, err => console.error(err)
		)
	}
}


export function dismissTimetableItem(event){
	return (dispatch, getState) => {
		return request({
			url: `/v1/timetable/${event._id}/dismiss`
			, type: 'put'
		})
		.then(result=>{
			return fetchTimetable()(dispatch, getState)
			.then(function(){
				dispatch({type: TaskActionType.TASK_RECV_ITEM, item: result.task});
				dispatch({type: TaskActionType.TASK_RECV_LOG, item: result.log, taskId: result.task._id});
			})
		})
	}
}

export function restoreTimetableItem(event){
	return (dispatch, getState) => {
		return request({
			url: `/v1/timetable/${event._id}/restore`
			, type: 'put'
		})
		.then(result=>{
			return fetchTimetable()(dispatch, getState)
			.then(function(){
				dispatch({type: TaskActionType.TASK_RECV_ITEM, item: result.task});
				dispatch({type: TaskActionType.TASK_RECV_LOG, item: result.log, taskId: result.task._id});
			})
		})
	}
}