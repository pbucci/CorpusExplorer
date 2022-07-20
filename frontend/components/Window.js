// Window.js
import React from "react";

// custom
import Notes from "./Notes"
import Teleoscope from "./Teleoscope"
import Search from "../components/Search";
import GroupPalette from "../components/GroupPalette";
import Group from "../components/Group";
import WorkspaceItem from "../components/WorkspaceItem";
import CloseButton from "../components/CloseButton";
import MinimizeButton from "../components/MinimizeButton";
import MaximizeButton from "../components/MaximizeButton";

// mui
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'

// actions
import { checker } from "../actions/checkedPosts";
import { useSelector, useDispatch } from "react-redux";


const innerContent = (type, id, props) => {
	if (type == "Note") {
		return <Notes id={id}></Notes>	
	}
	if (type == "Teleoscope") {
		return <Teleoscope id={id}></Teleoscope>	
	}	
	if (type == "GroupPalette") {
		return <GroupPalette id={id}></GroupPalette>	
	}
	if (type == "Group") {
		return <Group id={id}></Group>
	}
	if (type == "Search") {
		return <Search id={id}></Search>
	}
	if (type == "Post") {
		return <WorkspaceItem id={id}></WorkspaceItem>
	}	
}

const button_style = {
    fontSize: 15,
    color:"white",
    marginBottom: "0.15em",
    padding: "0",
    cursor: "pointer"
}

export default React.forwardRef(({style, className, onMouseDown, onMouseUp, onTouchEnd, ...props}, ref) => {
	const checked = useSelector((state) => state.checkedPosts.value);
	var w = props.windata;
	var pc = checked.indexOf(w.i);

	return (
		<Card 
			variant={pc >=0 ? "outlined" : ""}
			style={{
				borderWidth: pc >= 0  ? 4 : 0,
            	borderColor: pc >= 0 ? "#4e5cbc" : "white",
            	boxShadow: pc >= 0 ? "1px 1px 8px #888888" : "2px 2px 8px #888888",
				...style}}
			className={className}
			ref={ref}
			onMouseDown={onMouseDown} 
			onMouseUp={onMouseUp} 
			onTouchEnd={onTouchEnd}
		> 
		<div
			style={{backgroundColor: "#475c6c", height: "1em", cursor: "move"}}
			className="drag-handle"
		>

			<MaximizeButton sx={button_style} id={w.i} />
			<MinimizeButton sx={button_style} id={w.i} />
			<CloseButton sx={button_style} id={w.i} />
		</div>
		<div style={{overflow:"auto", height: "100%"}}>
			{innerContent(w.type, w.i, props)}
		</div>
			
		<div
			style={{
				backgroundColor: "#CCCCCC", 
				height: "1em", 
				width: "100%", 
				position: "fixed", 
				left: "0em", 
				bottom: "0em",
				zIndex: 1, 
				cursor: "move",
				...props.style
			}}
			className="drag-handle"
			{...props}
		></div>
		</Card>
	)
})
