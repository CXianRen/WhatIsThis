// SentenceWidget.jsx
import React, { useState, useRef, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function SentenceWidget({
  srcSentences = [],
  dstSentences = [],
  srcLang = "src",
  dstLang = "dst",
  fontSizeClass = "",
  onWordSelected,
  onShowToolbar,
}) {
  const [sentenceStates, setSentenceStates] = useState({});
  const [selectedWord, setSelectedWord] = useState(""); // 新增
  const touchState = useRef({ startX: 0, startY: 0 });
  const longPressTimer = useRef(null);
  const isDragSelection = useRef(false);
  

  const textRefs = useRef([]);

  const toggleSentence = (index) => {
    setSentenceStates((prev) => ({
      ...prev,
      [index]: prev[index] === "source" ? "dest" : "source",
    }));
  };

  const handleTextSelection = (e, sentenceText) => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (!text) return;

    setSelectedWord(text); // 高亮选中词
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const x = rect.left + window.scrollX + rect.width / 2;
    const y = rect.bottom + window.scrollY;

    const selectedSentenceContent = sentenceText;

    onShowToolbar?.(x, y);
    onWordSelected?.(text, selectedSentenceContent);

    selection.removeAllRanges();
  };

  const expandRangeToWord = (range) => {
    if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) return;

    const text = range.startContainer.textContent;
    let start = range.startOffset;
    let end = range.endOffset;

    // Expand backward
    while (start > 0 && /\w/.test(text[start - 1])) {
      start--;
    }

    // Expand forward
    while (end < text.length && /\w/.test(text[end])) {
      end++;
    }

    range.setStart(range.startContainer, start);
    range.setEnd(range.startContainer, end);
  };

  useEffect(() => {
  const listeners = [];

  textRefs.current.forEach((ref, index) => {
    if (!ref?.current) return;
    const dom = ref.current;

    const state = sentenceStates[index] || "dest";
    if (state === "source") return; // source 状态下跳过，不绑定划词事件

    const sentenceText = dstSentences[index]?.sentence || "";

    const handleTouchStart = (e) => {
      window.getSelection().removeAllRanges();
      clearTimeout(longPressTimer.current);

      const touch = e.touches[0];
      touchState.current.startX = touch.clientX;
      touchState.current.startY = touch.clientY;

      isDragSelection.current = false;

      longPressTimer.current = setTimeout(() => {
        isDragSelection.current = true;
        window.getSelection().removeAllRanges();
      }, 600);
    };

    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchState.current.startX);
      const dy = Math.abs(touch.clientY - touchState.current.startY);

      if (!isDragSelection.current && (dx > 5 || dy > 5)) {
        clearTimeout(longPressTimer.current);
        return;
      }
      e.preventDefault();

      let range;
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(touch.clientX, touch.clientY);
      }
      if (range) {
        expandRangeToWord(range);
        const selection = window.getSelection();
        if (selection.rangeCount === 0) {
          selection.addRange(range);
        } else {
          const existingRange = selection.getRangeAt(0);
          existingRange.setEnd(range.endContainer, range.endOffset);
          expandRangeToWord(existingRange);
        }
      }
    };

    const handleTouchEnd = (e) => {
      clearTimeout(longPressTimer.current);
      if (isDragSelection.current) {
        setTimeout(() => handleTextSelection(e, sentenceText), 100);
      }
    };

    dom.addEventListener("touchstart", handleTouchStart, { passive: false });
    dom.addEventListener("touchmove", handleTouchMove, { passive: false });
    dom.addEventListener("touchend", handleTouchEnd);

    listeners.push({ dom, handleTouchStart, handleTouchMove, handleTouchEnd });
  });

  return () => {
    listeners.forEach(({ dom, handleTouchStart, handleTouchMove, handleTouchEnd }) => {
      dom.removeEventListener("touchstart", handleTouchStart);
      dom.removeEventListener("touchmove", handleTouchMove);
      dom.removeEventListener("touchend", handleTouchEnd);
    });
  };
}, [srcSentences, dstSentences, sentenceStates, onWordSelected, onShowToolbar]); // 注意添加 sentenceStates


  const renderTextWithHighlight = (text) => {
    if (!selectedWord) return text;
    const safe = selectedWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${safe})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} style={{ backgroundColor: "yellow" }}>{part}</span>
      ) : (
        part
      )
    );
  };

  return (
    <Box className={`sentence-container ${fontSizeClass}`}>
      {srcSentences.map((src, index) => {
        const state = sentenceStates[index] || "dest";
        const isSource = state === "source";
        const sentenceText = isSource ? src.sentence : dstSentences[index]?.sentence || "";
        const toggleIcon = isSource ? srcLang : dstLang;

        textRefs.current[index] = textRefs.current[index] || React.createRef();

        return (
          <Box
            key={index}
            sx={{
              mb: 0,
              p: 1,
              borderRadius: 1,
              userSelect: "text",
            }}
          >
            <Typography
              component="span"
              sx={{ fontWeight: "bold", mr: 1 }}
              onClick={() => toggleSentence(index)}
            >
              {toggleIcon}
            </Typography>

            <Typography
              component="span"
              ref={textRefs.current[index]}
              // style={{ touchAction: "manipulation" }}
            >
             {" "}{renderTextWithHighlight(sentenceText)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
