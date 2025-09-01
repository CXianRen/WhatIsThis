import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  Checkbox,
  Select,
  MenuItem
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { logout } from "../common/api_user.js";

// 用户信息
const userinfo = { username: "JohnDoe", avatar: "/static/imgs/default-avatar.png" };

// 默认设置
const defaultSettings = {
  enableFeature: false,
  enableNotifications: true,
  theme: "light"
};

// 获取 localStorage 中的设置，如果没有则使用默认值
const loadSettings = () => {
  const stored = localStorage.getItem("userSettings");
  return stored ? JSON.parse(stored) : defaultSettings;
};

// 保存到 localStorage
const saveSettings = (settings) => {
  localStorage.setItem("userSettings", JSON.stringify(settings));
};

// 配置面板
const settingConfig = (changeTheme) => [
  {
    panelTitle: "General",
    settings: [
      {
        type: "checkbox",
        id: "enableFeature",
        label: "Enable Feature",
        onChange: (checked, state, setState) => {
          const newState = { ...state, enableFeature: checked };
          setState(newState);
          saveSettings(newState);
        }
      },
      {
        type: "select",
        id: "theme",
        label: "Theme",
        options: [
          { value: "light", text: "Light" },
          { value: "dark", text: "Dark" }
        ],
        onChange: (value, state, setState) => {
          const newState = { ...state, theme: value };
          setState(newState);
          saveSettings(newState);
          if (changeTheme) changeTheme(value);
        }
      }
    ]
  },
  {
    panelTitle: "Notifications",
    settings: [
      {
        type: "checkbox",
        id: "enableNotifications",
        label: "Enable Notifications",
        onChange: (checked, state, setState) => {
          const newState = { ...state, enableNotifications: checked };
          setState(newState);
          saveSettings(newState);
        }
      }
    ]
  },
  {
    panelTitle: "Book Management",
    settings: [
      {
        type: "button",
        id: "gotoLibrary",
        label: "Add book from library",
        href: "#library",
        onClick: () => console.log("Go to library")
      },
      {
        type: "button",
        id: "gotoBookManage",
        label: "Manage your books",
        href: "#manage",
        onClick: () => console.log("Go to manage books")
      }
    ]
  }
];

// 单个 Setting 项
function SettingItem({ setting, settingsState, setSettingsState }) {
  const value = settingsState[setting.id];

  if (setting.type === "checkbox") {
    return (
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", my: 1 }}>
        <Typography variant="body2">{setting.label}</Typography>
        <Checkbox
          checked={value}
          onChange={(e) => setting.onChange?.(e.target.checked, settingsState, setSettingsState)}
        />
      </Box>
    );
  }

  if (setting.type === "select") {
    return (
      <Box sx={{ mt: 1, mb: 1 }}>
        <Typography variant="body2">{setting.label}</Typography>
        <Select
          fullWidth
          value={value}
          onChange={(e) => setting.onChange?.(e.target.value, settingsState, setSettingsState)}
        >
          {setting.options.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>{opt.text}</MenuItem>
          ))}
        </Select>
      </Box>
    );
  }

  if (setting.type === "button") {
    return (
      <Button
        variant="contained"
        href={setting.href}
        onClick={setting.onClick}
        sx={{ mt: 1, mb: 1, width: "100%", display: "flex", justifyContent: "center" }}
      >
        {setting.label}
      </Button>
    );
  }

  return null;
}

// 单个面板
function SettingPanel({ panel, settingsState, setSettingsState }) {
  return (
    <Paper sx={{ p: 2, mb: 2 }} elevation={3}>
      <Typography variant="h6" gutterBottom>{panel.panelTitle}</Typography>
      {panel.settings.map(setting => (
        <SettingItem
          key={setting.id}
          setting={setting}
          settingsState={settingsState}
          setSettingsState={setSettingsState}
        />
      ))}
    </Paper>
  );
}




// SettingPage
export default function SettingPage({ changeTheme }) {
  const [settingsState, setSettingsState] = useState(loadSettings());

 const navigate = useNavigate();
  // 页面加载时同步主题
  useEffect(() => {
    if (changeTheme) changeTheme(settingsState.theme);
  }, []);

  const handleClear = () => {
    setSettingsState(defaultSettings);
    saveSettings(defaultSettings);
    if (changeTheme) changeTheme(defaultSettings.theme);
  };

  const handleLogout = () => {
    logout();           // 调用登出逻辑
    navigate("/login"); // 跳转到登录页
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* 用户信息 */}
      <Paper sx={{ p: 2, mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar src={userinfo.avatar} />
        <Typography variant="h6">{userinfo.username}</Typography>
        <Button variant="outlined" sx={{ ml: "auto" }} onClick={handleLogout}>
          Logout
        </Button>
      </Paper>

      {/* 设置面板 */}
      {settingConfig(changeTheme).map(panel => (
        <SettingPanel
          key={panel.panelTitle}
          panel={panel}
          settingsState={settingsState}
          setSettingsState={setSettingsState}
        />
      ))}

      {/* 清除按钮 */}
      <Button
        variant="outlined"
        color="error"
        sx={{ mt: 2, width: "100%" }}
        onClick={handleClear}
      >
        Clear Settings
      </Button>
    </Box>
  );
}
