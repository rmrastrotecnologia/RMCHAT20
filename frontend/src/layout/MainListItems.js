import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useHistory } from "react-router-dom";

import {
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Divider,
  Badge,
  Collapse,
  List,
  Typography,
} from "@material-ui/core";

import {
  DashboardOutlined as DashboardOutlinedIcon,
  WhatsApp as WhatsAppIcon,
  SyncAlt as SyncAltIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  PeopleAltOutlined as PeopleAltOutlinedIcon,
  ContactPhoneOutlined as ContactPhoneOutlinedIcon,
  AccountTreeOutlined as AccountTreeOutlinedIcon,
  FlashOn as FlashOnIcon,
  HelpOutline as HelpOutlineIcon,
  CodeRounded as CodeRoundedIcon,
  Event as EventIcon,
  LocalOffer as LocalOfferIcon,
  EventAvailable as EventAvailableIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  People as PeopleIcon,
  ListAlt as ListIcon,
  Announcement as AnnouncementIcon,
  Forum as ForumIcon,
  LocalAtm as LocalAtmIcon,
  AllInclusive,
  AttachFile,
  DeviceHubOutlined,
  BorderColor as BorderColorIcon,
  TableChart as TableChartIcon,
} from "@material-ui/icons";

import { i18n } from "../translate/i18n";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { Can } from "../components/Can";
import { SocketContext } from "../context/Socket/SocketContext";
import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import { makeStyles } from "@material-ui/core/styles";
import usePlans from "../hooks/usePlans";
import useVersion from "../hooks/useVersion";

const useStyles = makeStyles((theme) => ({
  ListSubheader: {
    height: 26,
    marginTop: "-15px",
    marginBottom: "-10px",
  },
}));

function ListItemLink(props) {
  const { icon, primary, to, className } = props;

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  return (
    <li>
      <ListItem button dense component={renderLink} className={className}>
        {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
        <ListItemText primary={primary} />
      </ListItem>
    </li>
  );
}

const reducer = (state, action) => {
  switch (action.type) {
    case "LOAD_CHATS":
      const chats = action.payload;
      const newChats = [];

      if (isArray(chats)) {
        chats.forEach((chat) => {
          const chatIndex = state.findIndex((u) => u.id === chat.id);
          if (chatIndex !== -1) {
            state[chatIndex] = chat;
          } else {
            newChats.push(chat);
          }
        });
      }

      return [...state, ...newChats];

    case "UPDATE_CHATS":
      const chat = action.payload;
      const chatIndex = state.findIndex((u) => u.id === chat.id);

      if (chatIndex !== -1) {
        state[chatIndex] = chat;
        return [...state];
      } else {
        return [chat, ...state];
      }

    case "DELETE_CHAT":
      return state.filter((u) => u.id !== action.payload);

    case "RESET":
      return [];

    case "CHANGE_CHAT":
      return state.map((chat) =>
        chat.id === action.payload.chat.id ? action.payload.chat : chat
      );

    default:
      return state;
  }
};

const MainListItems = (props) => {
  const classes = useStyles();
  const { drawerClose, collapsed } = props;
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, handleLogout } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);

  const [connectionWarning, setConnectionWarning] = useState(false);
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showSchedules, setShowSchedules] = useState(false);
  const [showInternalChat, setShowInternalChat] = useState(false);
  const [showExternalApi, setShowExternalApi] = useState(false);
  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);
  const { getPlanCompany } = usePlans();
  const { getVersion } = useVersion();
  const [version, setVersion] = useState(false);

  useEffect(() => {
    async function fetchVersion() {
      try {
        const _version = await getVersion();
        setVersion(_version.version);
      } catch (err) {
        toastError(err);
      }
    }
    fetchVersion();
  }, [getVersion]);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    async function fetchData() {
      try {
        const companyId = user?.companyId;
        const planConfigs = await getPlanCompany(undefined, companyId);

        setShowCampaigns(planConfigs.plan.useCampaigns);
        setShowKanban(planConfigs.plan.useKanban);
        setShowOpenAi(planConfigs.plan.useOpenAi);
        setShowIntegrations(planConfigs.plan.useIntegrations);
        setShowSchedules(planConfigs.plan.useSchedules);
        setShowInternalChat(planConfigs.plan.useInternalChat);
        setShowExternalApi(planConfigs.plan.useExternalApi);
      } catch (err) {
        toastError(err);
      }
    }
    fetchData();
  }, [getPlanCompany, user?.companyId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    if (socketManager && companyId) {
      const socket = socketManager.getSocket(companyId);

      socket.on(`company-${companyId}-chat`, (data) => {
        if (data.action === "new-message" || data.action === "update") {
          dispatch({ type: "CHANGE_CHAT", payload: data });
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [socketManager]);

  useEffect(() => {
    let unreadsCount = 0;
    chats.forEach((chat) => {
      chat.users.forEach((chatUser) => {
        if (chatUser.userId === user.id) {
          unreadsCount += chatUser.unreads;
        }
      });
    });
    setInvisible(unreadsCount === 0);
  }, [chats, user.id]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) =>
          ["qrcode", "PAIRING", "DISCONNECTED", "TIMEOUT", "OPENING"].includes(
            whats.status
          )
        );
        setConnectionWarning(offlineWhats.length > 0);
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  const handleClickLogout = () => {
    handleLogout();
  };

  return (
    <div onClick={drawerClose}>
      {/* Conteúdo do menu */}
      {/* Mantido o restante do código */}
    </div>
  );
};

export default MainListItems;