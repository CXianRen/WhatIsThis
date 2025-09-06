import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { fetchChapters, fetchChapterContent } from "../common/api_book.js";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  IconButton
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SentenceWidget from "../components/SentenceWidget";
import ToolBarPanel from "../components/ToolBarPanel";
import WordPanel from "../components/WordPanel";
import YouglishPanel from "../components/YouglishPanel";
import TagPanel  from "../components/TagPanel";
import WordAnalysisPanel from "../components/WordAnalysisPanel";

export default function ReaderPageReact() {
  const { bookId: paramBookId } = useParams();
  const location = useLocation();
  const stateData = location.state;

  const [bookData, setBookData] = useState(stateData || null);
  const [chapters, setChapters] = useState([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [srcSentences, setSrcSentences] = useState([]);
  const [dstSentences, setDstSentences] = useState([]);
  const [srcLang, setSrcLang] = useState("en");
  const [dstLang, setDstLang] = useState("en");
  const [srcLevel, setSrcLevel] = useState(0);
  const [dstLevel, setDstLevel] = useState(0);
  const [fontSize, setFontSize] = useState(2);

  // toolbar 显示状态和位置
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });

  const [selectedWord, setSelectedWord] = useState("");
  const [selectedSentence, setSelectedSentence] = useState("");

  // WordPanel state
  const [wordPanelOpen, setWordPanelOpen] = React.useState(false);
  // YouglishPanel state
  const [youglishPanelOpen, setYouglishPanelOpen] = React.useState(false);
  // TagPanel state
  const [tagPanelOpen, setTagPanelOpen] = React.useState(false);
  // WordAnalysisPanel state
  const [wordAnalysisPanelOpen, setWordAnalysisPanelOpen] = React.useState(false);


  // toolbar app 列表
  const applist = [
    { name: "Define", onclick: (e) => setWordPanelOpen(true) },
    { name: "Yglish", onclick: (e) => setYouglishPanelOpen(true) },
    { name: "Tag", onclick: (e) => setTagPanelOpen(true) },
    { name: "Analyze", onclick: (e) => setWordAnalysisPanelOpen(true) },
    // 其他工具按钮
  ];

  // 显示 toolbar 的函数
  const showToolbar = (x, y) => {
    console.log("show tool bar at:", x, y)
    setToolbarPos({ x, y });
    setToolbarOpen(true);
  };

  // const fontSizes = ["small", "medium", "large", "extra-large", "huge"];
  const fontSizes = [14, 16, 18, 22, 26, 30];
  const currentChapterEl = useRef(null);
  const chapterInfoEl = useRef(null);
  
  const [textSize, setTextSize] = useState(fontSizes[fontSize]);
  useEffect(() => {
    setTextSize(fontSizes[fontSize]);
  }, [fontSize]);

  // Drawer open state
  const [drawerOpen, setDrawerOpen] = useState(false);
  

  // ========== 初始化 ==========
  useEffect(() => {
    let data = stateData;
    if (!data && paramBookId) {
      const stored = localStorage.getItem("lastReadingBook");
      if (stored) {
        try { data = JSON.parse(stored); } catch { data = null; }
      }
    }
    if (!data) return;

    setBookData(data);
    setSrcLang(data.languages[0].lang);
    setSrcLevel(data.languages[0].level[0]);
    setDstLang(data.languages[1].lang);
    setDstLevel(data.languages[1].level[0]);

    localStorage.setItem("lastReadingBook", JSON.stringify(data));

    loadChapterList(data.id, data.languages[1].lang, data.languages[1].level[0]);
  }, []);

  const loadChapterList = async (bookId, lang, level) => {
    try {
      const chapterData = await fetchChapters({ bookId, lang, level });
      setChapters(chapterData);

      const historyChapterId = loadReadingHistory(bookId);
      let defaultIndex = 0;
      if (historyChapterId) {
        const idx = chapterData.findIndex(ch => ch.chapter_id === historyChapterId);
        if (idx !== -1) defaultIndex = idx;
      }
      setCurrentChapterIndex(defaultIndex);
      selectChapter(defaultIndex, chapterData);
    } catch (err) {
      console.error("Failed to load chapters:", err);
    }
  };

  const selectChapter = async (index, chapterList = chapters) => {
    const chapter = chapterList[index];
    if (!chapter) return;

    setCurrentChapterIndex(index);
    if (currentChapterEl.current) currentChapterEl.current.textContent = chapter.chapter_title;
    if (chapterInfoEl.current) chapterInfoEl.current.textContent = "Loading...";

    try {
      const [srcContent, dstContent] = await Promise.all([
        fetchChapterContent({ bookId: bookData.id, chapterId: chapter.chapter_id, lang: srcLang, level: srcLevel }),
        fetchChapterContent({ bookId: bookData.id, chapterId: chapter.chapter_id, lang: dstLang, level: dstLevel })
      ]);

      if (srcContent.content.length !== dstContent.content.length) {
        alert("Source and target content sentence count mismatch");
        throw new Error("Mismatch");
      }

      setSrcSentences(srcContent.content);
      setDstSentences(dstContent.content);
      if (chapterInfoEl.current) chapterInfoEl.current.textContent = `Total ${dstContent.content.length} sentences`;

      saveReadingHistory(bookData.id, chapter.chapter_id);
      setDrawerOpen(false); // 选章节后自动收回
    } catch (err) {
      console.error(err);
      if (chapterInfoEl.current) chapterInfoEl.current.textContent = `Failed to load: ${err.message}`;
      setSrcSentences([]);
      setDstSentences([]);
    }
  };

  const saveReadingHistory = (bookId, chapterId) => {
    let historyMap = {};
    const historyStr = localStorage.getItem("readingHistory");
    if (historyStr) {
      try { historyMap = JSON.parse(historyStr); } catch { }
    }
    historyMap[bookId] = { chapterId, timestamp: Date.now() };
    localStorage.setItem("readingHistory", JSON.stringify(historyMap));
  };
  const loadReadingHistory = (bookId) => {
    const historyStr = localStorage.getItem("readingHistory");
    if (!historyStr) return null;
    try {
      const historyMap = JSON.parse(historyStr);
      return historyMap[bookId]?.chapterId || null;
    } catch { return null; }
  };

  const handleFontSizeChange = (e) => {
    const sizeIndex = parseInt(e.target.value);
    setFontSize(sizeIndex);
    localStorage.setItem("fontSize", sizeIndex.toString());
  };
  useEffect(() => {
    const saved = localStorage.getItem("fontSize");
    if (saved) setFontSize(parseInt(saved));
  }, []);

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Menu button */}
      {!drawerOpen && (
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={{ position: 'fixed', top: 16, left: 16, zIndex: 1300 }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Drawer */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: '70%',
            maxWidth: 400,
          }
        }}
      >
        <List>
          {chapters.map((ch, idx) => (
            <ListItemButton
              key={idx}
              selected={idx === currentChapterIndex}
              onClick={() => selectChapter(idx)}
            >
              <ListItemText primary={ch.chapter_title} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Main content */}
      <Box sx={{ flex: 1, p: 2 }}>
        {/* Title */}
        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Typography variant="h5" ref={currentChapterEl}></Typography>
        </Box>

        {/* Info row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          {/* Total sentences */}
          <Typography ref={chapterInfoEl}></Typography>

          {/* Font size */}
          <FormControl size="small">
            <InputLabel id="font-size-label">Aa</InputLabel>
            <Select
              labelId="font-size-label"
              value={fontSize}
              onChange={handleFontSizeChange}
            >
              {fontSizes.map((size, idx) => (
                <MenuItem key={idx} value={idx}>{size}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Sentence content */}
        <Box>
          {srcSentences.length > 0 && dstSentences.length > 0 ? (
            <SentenceWidget
              srcSentences={srcSentences}
              dstSentences={dstSentences}
              srcLang={srcLang}
              dstLang={dstLang}
              textSize={textSize}
              onWordSelected={(word, sentence) => {
                console.log("Word selected:", word, sentence);
                // update selected word and open WordPanel
                setSelectedWord(word);
                setSelectedSentence(sentence);
              }
              }
              onShowToolbar={(x, y) => showToolbar(x, y)}
            />
          ) : (
            <Typography>Please select a chapter</Typography>
          )}
        </Box>
      </Box>
      <ToolBarPanel
        applist={applist}
        anchorPos={toolbarPos}
        open={toolbarOpen}
        onClose={() => setToolbarOpen(false)}
      />
      <WordPanel
        open={wordPanelOpen}
        word={selectedWord}
        lang={dstLang}        // 可根据需求传
        nativeLang={srcLang}  // 可根据需求传
        onClose={() => setWordPanelOpen(false)}
      />
      <YouglishPanel
        open={youglishPanelOpen}
        word={selectedWord}
        lang={dstLang}        // 可根据需求传
        onClose={() => setYouglishPanelOpen(false)}
      />
      <TagPanel
        open={tagPanelOpen}
        word={selectedWord}
        lang={dstLang}        // 可根据需求传
        onClose={() => setTagPanelOpen(false)}
      />
      <WordAnalysisPanel
        open={wordAnalysisPanelOpen}
        word={selectedWord}
        text={selectedSentence}
        lang={dstLang}        // 可根据需求传
        onClose={() => setWordAnalysisPanelOpen(false)}
      />
    </Box>

  );
}
