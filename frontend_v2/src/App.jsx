import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline, Paper, BottomNavigation, BottomNavigationAction } from "@mui/material";
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';

import LearnPage from "./pages/LearnPage";
import MePage from "./pages/MePage";
import SettingPage from "./pages/SettingPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import BookshelfPage from "./pages/BookshelfPage";
import ReaderPage from "./pages/ReaderPage";

const storedSettings = JSON.parse(localStorage.getItem("userSettings") || "{}");
const initialThemeDark = storedSettings.theme === "dark";

export default function App() {
  const [darkMode, setDarkMode] = useState(initialThemeDark);

  const theme = createTheme({
    palette: { mode: darkMode ? "dark" : "light" }
  });

  // 传给 SettingPage 的回调，切换主题
  const changeTheme = (mode) => setDarkMode(mode === "dark");

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContainer changeTheme={changeTheme} />
      </Router>
    </ThemeProvider>
  );
}


// AppContainer 使用路由来控制页面
function AppContainer({ changeTheme }) {
  const location = useLocation();
  const navigate = useNavigate();

  const getPageValue = (pathname) => {
    switch (pathname) {
      case "/": return "me";
      case "/shelf": return "shelf";
      case "/learn": return "learn";
      case "/me": return "me";
      case "/settings": return "settings";
      case "/login": return "login";
      case "/signup": return "signup";
      case "/reader": return "reader";
      default: return "me";
    }
  };

  const [value, setValue] = useState(getPageValue(location.pathname));

  React.useEffect(() => {
    setValue(getPageValue(location.pathname));
  }, [location.pathname]);

  // 判断是否隐藏底部导航栏
  const hideNav = ["/login", "/signup"].includes(location.pathname);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw" }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <Routes>
          <Route path="/" element={<MePage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="/settings" element={<SettingPage changeTheme={changeTheme} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/shelf" element={<BookshelfPage />} />
          <Route path="/reader" element={<ReaderPage />} />
        </Routes>
      </div>

      {!hideNav && (
        <Paper elevation={3}>
          <BottomNavigation
            value={value}
            onChange={(event, newValue) => {
              setValue(newValue);
              switch (newValue) {
                case "shelf": navigate("/shelf"); break;
                case "learn": navigate("/learn"); break;
                case "me": navigate("/me"); break;
                case "settings": navigate("/settings"); break;
                case "login": navigate("/login"); break;
                case "signup": navigate("/signup"); break;
                case "reader": navigate("/reader"); break;
                default: navigate("/"); break;
              }
            }}
            showLabels
          >
            <BottomNavigationAction label="Shelf" value="shelf" icon={<MenuBookIcon />} />
            <BottomNavigationAction label="Learn" value="learn" icon={<SchoolIcon />} />
            <BottomNavigationAction label="Me" value="me" icon={<PersonIcon />} />
          </BottomNavigation>
        </Paper>
      )}
    </div>
  );
}