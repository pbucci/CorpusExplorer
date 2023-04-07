import React, { useContext, useEffect } from "react";
import space from 'color-space';
import hexRgb from 'hex-rgb';
import rgbHex from 'rgb-hex';

// material ui
import { Menu, MenuItem, rgbToHex, Typography } from "@mui/material";
import { AppBar } from "@mui/material";
import { Toolbar } from "@mui/material";
import { Stack } from '@mui/material';
import { Box } from '@mui/material';

import { Divider } from '@mui/material';
import { IconButton } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

// components
import TeleoscopeLogo from "./TeleoscopeLogo";
import AddUserDialogue from "./AddUserDialog";
import Account from "./Account";
import Session from "../Session";

// actions
import { useSelector, useDispatch } from "react-redux";
import { sessionActivator, setUserId } from "@/actions/activeSessionID";
import { setDefault } from "@/actions/windows";

// utilities
import { useCookies } from "react-cookie";
import { swrContext } from "@/util/swr"



// contexts
import { StompContext } from '@/components/Stomp'

export default function TopBar(props) {
  const [cookies, setCookie] = useCookies(["userid"]);
  const session_id = useSelector((state) => state.activeSessionID.value);
  const userid = useSelector((state) => state.activeSessionID.userid);
  const [loaded, setLoaded] = React.useState(false);
  const dispatch = useDispatch();
  const client = useContext(StompContext)
  const swr = useContext(swrContext);
  const { user } = swr.useSWRAbstract("user", `users/${userid}`);

  useEffect(()=> {
    if (cookies.userid != -1) {
      fetch(`http://${swr.subdomain}.${process.env.NEXT_PUBLIC_FRONTEND_HOST}/api/${swr.subdomain}/users/${cookies.userid}`)
      .then((response) => response.json())
      .then((user) => {
        handleSignIn(user)
      })
    }
  }, [])


  const { session } = swr.useSWRAbstract("session", `sessions/${session_id}`);
  const { users } = swr.useSWRAbstract("users", `users/`);
  const { sessions } = swr.useSWRAbstract("sessions", `sessions/`);

  const handleSignOut = () => {
    setCookie("userid", -1, {
      path: "/"
    });
    dispatch(sessionActivator(-1))
    dispatch(setUserId(-1))
    client.userId = -1
    dispatch(setDefault())
  }

  const handleSignIn = (user) => {
    setCookie("userid", user._id, {
      path: "/"
    });
    dispatch(setUserId(user._id))
    client.userId = user._id
    dispatch(sessionActivator(user.sessions[0]))
  }

  const accountColor = () => {
    if (userid == -1) {
      return "#AAAAAA"      
    } else {
      let rgb = hexRgb(get_color())
      let hsl = space.rgb.hsl([rgb.red, rgb.green, rgb.blue])
      let lighter = space.hsl.rgb([hsl[0], hsl[1], Math.min(100, hsl[2] * 2)])
      let hex = "#" + rgbHex(lighter[0], lighter[1], lighter[2])
      return hex
    }
  }

  const handleSessionChange = (value) => {
    setLoaded(false);
    dispatch(sessionActivator(value))
  }

  const get_color = () => session ? session.history[0].color : "#4E5CBC"

  const getUsers = () => {
    if (session && users) {
      let owner = session.userlist.owner
      let contributors = session.userlist.contributors

      // check if all users have already been added to session
      if (contributors.length + 1 === users.length) {
        return <MenuItem value={'No users to be added...'}>No users to be added...</MenuItem>
      }

      // show all users that are not already in userlist
      return users.map((u) => {
        if (!owner.includes(u._id) && !contributors.includes(u._id)) {
          return (<MenuItem key={u._id} value={u}>{u.username}</MenuItem>)
        }
      })
    }
    return (
      <MenuItem value={''}>No session selected...</MenuItem>
    )
  }

  const [open, toggleOpen] = React.useState(false);

  


  const AccountMenu = () => {
    const [dialogValue, setDialogValue] = React.useState({ label: '' });
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [openMenu, setOpenMenu] = React.useState(false);
    
    const handleClickOpen = () => {
      toggleOpen(true);
    };
  
    const handleClose = () => {
      setDialogValue({
        label: '',
      });
      toggleOpen(false);
    };
  
    return (
      <Stack spacing={1} direction="row-reverse">
        <Stack spacing={0} direction="row" alignItems="center">
          <IconButton id="bIconasic-button" 
              onClick={(event) => {
                setAnchorEl(event.currentTarget)
                setOpenMenu(true)
              }}>
            <AccountCircle sx={{ color: accountColor() }}></AccountCircle>
          </IconButton>
          <Typography sx={{color:accountColor()}}>{ user ? user.username : "Not signed in"}</Typography>
        </Stack>
        <Menu id="basic-menu" anchorEl={anchorEl} open={openMenu} 
            onClose={() => {setAnchorEl(null); setOpenMenu(false)} 
          }>
          <MenuItem
            onKeyDown={(e) => e.stopPropagation()}
            children={
              <Account
                user={user}
                handleSignIn={handleSignIn}
                handleSignOut={handleSignOut}
                client={client}
              />
            }>
          </MenuItem>
          <MenuItem children={
            <Session
              users={users}
              sessions={sessions}
              user={user}
              client={client}
              session_id={session_id}
              handleSessionChange={handleSessionChange}
            />
          }></MenuItem>
          <Divider></Divider>
          <MenuItem onClick={handleClickOpen}>Add a different user to this session</MenuItem>
          <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
        </Menu>
        <AddUserDialogue
          open={open}
          onClose={handleClose}
          users={getUsers()}
          dialogValue={dialogValue}
          setDialogValue={setDialogValue}
          session_id={session_id}
          client={client}
          key={"addUserDialog" + session_id}
        />
      </Stack>

    )
  }

  // Main return for this component
  return (
    <AppBar position="static" sx={{ backgroundColor: get_color(), width: "100%" }}>
      <Toolbar >
        <Stack spacing={10} sx={{ width: "100%" }} direction="row" alignItems="center" justifyContent="space-between">
          <TeleoscopeLogo isConnected={props.isConnected} color={accountColor()} />
          <AccountMenu />
        </Stack>
      </Toolbar>
      <Box sx={{ backgroundColor: get_color(), height: "1px", boxShadow: 3 }}></Box>
    </AppBar>
  );
}
