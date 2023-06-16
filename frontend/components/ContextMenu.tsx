import React, { useContext } from "react";

import { useAppSelector, useAppDispatch } from "@/util/hooks";
import { RootState } from "@/stores/store";

// mui
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";

// custom components
import WindowDefinitions from "./WindowFolder/WindowDefinitions";
import { useSelector } from "react-redux";

// actions
import { makeNode } from "@/actions/windows";

// util
import { swrContext } from "@/util/swr";

// contexts
import { StompContext } from "@/components/Stomp";
import ColorPicker from "@/components/ColorPicker";
import Typography from "@mui/material/Typography";

export default function ContextMenu(props) {

  const client = useContext(StompContext);

  const [colorPicker, setColorPicker] = React.useState(false);

  const dispatch = useAppDispatch();

  const session_id = useAppSelector(
    (state: RootState) => state.activeSessionID.value
  );
  const swr = useContext(swrContext);
  const { teleoscopes_raw } = swr.useSWRAbstract(
    "teleoscopes_raw",
    `sessions/${session_id}/teleoscopes`
  );
  const windowState = useSelector((state) => state.windows);
  const wdefs = WindowDefinitions(windowState);
  const { session } = swr.useSWRAbstract("session", `sessions/${session_id}`);
  const settings = useSelector((state) => state.windows.settings);

  // props.contextMenu.mouseX

  const handleAddNode = (id, type) => {    
    dispatch(makeNode({
      client: client,
      oid: id, 
      type: type,
      width: settings.default_document_width,
      height: settings.default_document_height,
      x: props.contextMenu.worldX, 
      y: props.contextMenu.worldY
    }));
  };

  const teleoscopes = teleoscopes_raw?.map((t) => {
    const ret = {
      _id: t._id,
      label: t.history[0].label,
    };
    return ret;
  });

  const handleOpenNewWindow = (menu_action) => {
    const w = { ...wdefs[menu_action] };
    handleAddNode(w.tag, w.type);
    props.handleCloseContextMenu();
  };

  const handleExistingTeleoscope = (t) => {
    const w = { ...wdefs["Teleoscope"] };
    handleAddNode(t, w.type);
    props.handleCloseContextMenu();
  };

  const handleOpenColorPicker = () => {
    setColorPicker(true);
  };

  const handleClose = () => {
    props.handleCloseContextMenu();
    setColorPicker(false);
  };

  const handleColorChange = (color) => {
    client.recolor_session(color, session_id);
  };

  const handleStompPing = () => {
    client.ping();
  }

  if (colorPicker) {
    return (
      <Menu
        sx={{ displayPrint: "none" }}
        open={props.contextMenu !== null}
        onClose={() => setColorPicker(false)}
        anchorReference="anchorPosition"
        anchorPosition={
          props.contextMenu !== null
            ? { top: props.contextMenu.mouseY, left: props.contextMenu.mouseX }
            : undefined
        }
      >
        <ColorPicker
          defaultColor={session?.history[0].color}
          onChange={handleColorChange}
        ></ColorPicker>
      </Menu>
    );
  }

  return (
    <Menu
      open={props.contextMenu !== null}
      onClose={() => handleClose()}
      anchorReference="anchorPosition"
      anchorPosition={
        props.contextMenu !== null
          ? { top: props.contextMenu.mouseY, left: props.contextMenu.mouseX }
          : undefined
      }
    >
      <MenuItem>
        <Typography
          variant="overline"
          onClick={() => handleOpenNewWindow("Teleoscopes")}
        >
          All Teleoscopes
        </Typography>
      </MenuItem>
      {teleoscopes?.map((t) => {
        return (
          <MenuItem key={t._id} onClick={() => handleExistingTeleoscope(t._id)}>
            {t.label}
          </MenuItem>
        );
      })}
      <Divider />

      <MenuItem onClick={() => handleOpenNewWindow("Search")}>
        Open Search
      </MenuItem>
      <MenuItem onClick={() => handleOpenNewWindow("Groups")}>
        Open Groups
      </MenuItem>
      <MenuItem onClick={() => handleOpenNewWindow("FABMenu")}>
        Open Floating Menu
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => handleOpenColorPicker()}>
        Change session color
      </MenuItem>
      <MenuItem onClick={() => handleStompPing()}>
        Ping Stomp
      </MenuItem>
      
    </Menu>
  );
}
