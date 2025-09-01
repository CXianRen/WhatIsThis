import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";

export default function YouglishWidget({ word, lang = "english", width = 640, height = 550 }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState("加载中...");
  const [widgetReady, setWidgetReady] = useState(false);
  const widgetRef = useRef(null);
  const timerRef = useRef(null);

  // 动态加载脚本
  useEffect(() => {
    if (window.YG) {
      setWidgetReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://youglish.com/public/emb/widget.js";
    script.async = true;
    script.onload = () => {
      window.onYouglishAPIReady = () => {
        setStatus("YouGlish API 已就绪");
        initWidget();
      };
    };
    script.onerror = () => setStatus("脚本加载失败");
    document.head.appendChild(script);

    return () => {
      pauseWidget();
      if (script) document.head.removeChild(script);
    };
  }, []);

  // 初始化 Widget
  const initWidget = () => {
    if (!window.YG || !containerRef.current || widgetRef.current) return;
    try {
      widgetRef.current = new window.YG.Widget(containerRef.current, {
        width,
        height,
        components: 88,
        autoStart: 0,
        events: {
          onFetchDone: (e) => {
            if (e.totalResult === 0) setStatus("没有找到结果");
            else setStatus(`找到 ${e.totalResult} 个发音示例`);
          },
          onCaptionConsumed: () => {
            pauseWidget();
            timerRef.current = setTimeout(() => {
              if (widgetRef.current) widgetRef.current.replay();
            }, 2000);
          },
          onVideoReady: () => setStatus("播放器已准备就绪"),
          onError: (e) => setStatus("发生错误：" + e.code),
        },
      });
      setWidgetReady(true);
      setStatus("Widget 已创建");
    } catch (e) {
      console.error("Widget 创建失败:", e);
      setStatus("Widget 创建失败: " + e.message);
    }
  };

  // 搜索单词
  useEffect(() => {
    if (widgetReady && word) {
      try {
        setStatus("正在搜索: " + word);
        widgetRef.current.fetch(word, lang);
      } catch (e) {
        console.error(e);
        setStatus("搜索失败: " + e.message);
      }
    }
  }, [word, lang, widgetReady]);

  const pauseWidget = () => {
    if (widgetRef.current) {
      try {
        widgetRef.current.pause();
      } catch {}
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <Box>
      <Box
        ref={containerRef}
        sx={{
          width,
          height,
          border: "1px solid #ccc",
          borderRadius: 1,
          overflow: "hidden",
          mb: 1,
        }}
      >
        {!widgetReady && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              background: "#f0f0f0",
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Box>
      <Typography variant="body2" color="text.secondary">
        {status}
      </Typography>
    </Box>
  );
}
